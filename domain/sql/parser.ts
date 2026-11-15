import { Parser } from 'node-sql-parser';
import type { DatabaseSchema, Table, Relationship } from '../models/databaseSchema';
import { extractTable, extractColumnName, extractTableName, generateId } from './extractors';
import { detectCardinality, updateInheritanceTables, updateJunctionRelationships } from './relationshipDetector';
import { extractColumnRawTypesFromSql } from './sqlLineMapper';
import { validateSchemaSemantics } from './semanticValidator';

export type SqlDialect = 'MySQL' | 'MariaDB' | 'PostgreSQL' | 'SQLite' | 'TransactSQL';

export function parseSqlSchema(sql: string, dialect: SqlDialect = 'MySQL'): DatabaseSchema {
    const tables: Record<string, Table> = {};
    const relationships: Relationship[] = [];

    if (!sql.trim()) {
        return { tables, relationships };
    }

    // Validação estrita: PostgreSQL não suporta AUTO_INCREMENT (usa SERIAL ou GENERATED ALWAYS AS IDENTITY)
    if (dialect === 'PostgreSQL') {
        const autoIncrementRegex = /\bAUTO_INCREMENT\b/i;
        const match = autoIncrementRegex.exec(sql);
        if (match) {
            const errorLine = sql.substring(0, match.index).split('\n').length || 1;
            const err: any = new Error('AUTO_INCREMENT não é suportado no PostgreSQL. Utilize SERIAL ou GENERATED ALWAYS AS IDENTITY.');
            err.line = errorLine;
            err.location = { start: { line: errorLine, offset: match.index } };
            throw err;
        }
    }

    const parser = new Parser();
    const parsed = parser.astify(sql, { database: dialect });
    const astList: any[] = Array.isArray(parsed) ? parsed : [parsed];

    // Extração de tabelas e validação de nomes duplicados
    let tableIndex = 0;
    const seenTableNames = new Set<string>();
    astList.forEach((ast: any) => {
        if (ast?.type === 'create' && ast?.keyword === 'table') {
            const tableData = extractTable(ast, tableIndex++);
            const normalizedName = tableData.name.toLowerCase();
            if (seenTableNames.has(normalizedName)) {
                const duplicateRegex = new RegExp(
                    `\\bCREATE\\s+TABLE(?:\\s+IF\\s+NOT\\s+EXISTS)?\\s+[\`"']?${tableData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\`"']?\\s*\\(`,
                    'gi'
                );
                let match: RegExpExecArray | null = null;
                let lastMatchIndex = 0;
                while ((match = duplicateRegex.exec(sql)) !== null) {
                    lastMatchIndex = match.index;
                }
                const errorLine = sql.substring(0, lastMatchIndex).split('\n').length || 1;
                const err: any = new Error(`Tabela duplicada: "${tableData.name}" já existe no esquema.`);
                err.line = errorLine;
                err.location = { start: { line: errorLine, offset: lastMatchIndex } };
                throw err;
            }
            seenTableNames.add(normalizedName);
            tables[tableData.name] = tableData;
        }
    });

    // Extração de relacionamentos (Inline e Explicit)
    astList.forEach((ast: any) => {
        if (ast?.type === 'create' && ast?.keyword === 'table') {
            const tableName = extractTableName(ast.table);
            const tableData = tableName ? tables[tableName] : undefined;

            if (!tableData || !ast.create_definitions) return;

            ast.create_definitions.forEach((def: any) => {
                // FK Inline
                if (def.resource === 'column' && def.reference_definition) {
                    const colName = extractColumnName(def.column);
                    const column = tableData.columns.find(c => c.name === colName);
                    if (column) {
                        const refTableName = extractTableName(def.reference_definition.table);
                        column.isFk = true;
                        column.refTable = refTableName;
                        const toColName = extractColumnName(def.reference_definition.definition?.[0]) || 'id';

                        relationships.push({
                            id: generateId(),
                            fromTable: tableName,
                            fromCol: column.name,
                            toTable: refTableName,
                            toCol: toColName,
                            cardinality: detectCardinality(column, tableData, refTableName, tables)
                        });
                    }
                }

                // FK Explícita (Constraint)
                if (def.resource === 'constraint' && def.constraint_type?.toLowerCase() === 'foreign key') {
                    const fkColumnName = extractColumnName(def.definition?.[0]);
                    const fkColumn = tableData.columns.find(c => c.name === fkColumnName);
                    if (fkColumn) {
                        const refTableName = extractTableName(def.reference_definition?.table);
                        fkColumn.isFk = true;
                        fkColumn.refTable = refTableName;
                        const toColumnName = extractColumnName(def.reference_definition?.definition?.[0]) || 'id';

                        relationships.push({
                            id: generateId(),
                            fromTable: tableName,
                            fromCol: fkColumnName,
                            toTable: refTableName,
                            toCol: toColumnName,
                            cardinality: detectCardinality(fkColumn, tableData, refTableName, tables)
                        });
                    }
                }
            });
        }
    });

    // Preservar a formatação exata do tipo escrito no SQL (maiúsculas/minúsculas e espaçamento interno)
    const rawTypesMap = extractColumnRawTypesFromSql(sql, tables);
    for (const table of Object.values(tables)) {
        for (const col of table.columns) {
            const rawKey = `${table.name}.${col.name}`;
            if (rawTypesMap[rawKey]) {
                col.type = rawTypesMap[rawKey];
            }
        }
    }

    updateInheritanceTables(tables);
    updateJunctionRelationships(tables, relationships);

    const warnings = validateSchemaSemantics(sql, astList, { tables, relationships });

    return { tables, relationships, warnings };
}
