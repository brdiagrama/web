import { Parser } from 'node-sql-parser';
import type { DatabaseSchema, Table, Relationship } from '../models/databaseSchema';
import { extractTable, generateId } from './extractors';
import { detectCardinality, updateInheritanceTables, updateJunctionRelationships } from './relationshipDetector';

export function parseSqlSchema(sql: string): DatabaseSchema {
    const tables: Record<string, Table> = {};
    const relationships: Relationship[] = [];

    if (!sql.trim()) {
        return { tables, relationships };
    }

    const parser = new Parser();
    const parsed = parser.astify(sql, { database: 'MySQL' });
    const astList: any[] = Array.isArray(parsed) ? parsed : [parsed];

    // Extração de tabelas
    let tableIndex = 0;
    astList.forEach((ast: any) => {
        if (ast?.type === 'create' && ast?.keyword === 'table') {
            const tableData = extractTable(ast, tableIndex++);
            tables[tableData.name] = tableData;
        }
    });

    // Extração de relacionamentos (Inline e Explicit)
    astList.forEach((ast: any) => {
        if (ast?.type === 'create' && ast?.keyword === 'table') {
            const rawTable = ast.table;
            const tableName = Array.isArray(rawTable) ? rawTable[0]?.table : rawTable?.table;
            const tableData = tableName ? tables[tableName] : undefined;

            if (!tableData || !ast.create_definitions) return;

            ast.create_definitions.forEach((def: any) => {
                // FK Inline
                if (def.resource === 'column' && def.reference_definition) {
                    const colName = def.column.column;
                    const column = tableData.columns.find(c => c.name === colName);
                    if (column) {
                        const refTableName = def.reference_definition.table[0].table;
                        column.isFk = true;
                        column.refTable = refTableName;
                        const toColName = def.reference_definition.definition?.[0]?.column || 'id';

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
                    const fkColumnName = def.definition[0].column;
                    const fkColumn = tableData.columns.find(c => c.name === fkColumnName);
                    if (fkColumn) {
                        const refTableName = def.reference_definition.table[0].table;
                        fkColumn.isFk = true;
                        fkColumn.refTable = refTableName;
                        const toColumnName = def.reference_definition.definition?.[0]?.column || 'id';

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

    updateInheritanceTables(tables);
    updateJunctionRelationships(tables, relationships);
    return { tables, relationships };
}
