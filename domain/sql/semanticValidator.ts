import type { DatabaseSchema } from '../models/databaseSchema';
import { extractTableName, extractColumnName } from './extractors';

export interface SchemaValidationProblem {
  line: number;
  message: string;
  type: 'error' | 'warning';
}

function findWordLineInSql(sql: string, word: string, tableName?: string): number {
  if (!word) return 1;
  const lines = sql.split('\n');
  const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordRegex = new RegExp(`\\b[\`"'\\[]?${escapedWord}[\`"'\\]]?\\b`, 'i');

  if (tableName) {
    const escapedTable = tableName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tableRegex = new RegExp(`\\bCREATE\\s+TABLE(?:\\s+IF\\s+NOT\\s+EXISTS)?\\s+(?:[^\s(]+\\.)?[[\`"'\\[]?${escapedTable}[[\`"'\\]]?\\s*\\(`, 'i');
    let insideTargetTable = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (tableRegex.test(line)) {
        insideTargetTable = true;
      }
      if (insideTargetTable) {
        if (wordRegex.test(line)) {
          return i + 1;
        }
        if (line.includes(');')) {
          insideTargetTable = false;
        }
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    if (wordRegex.test(lines[i])) {
      return i + 1;
    }
  }

  return 1;
}

/**
 * Validação semântica estrita do esquema SQL.
 * Identifica referências a tabelas ou colunas inexistentes em chaves primárias e estrangeiras.
 */
export function validateSchemaSemantics(
  sql: string,
  astList: any[],
  schema: DatabaseSchema
): SchemaValidationProblem[] {
  const problems: SchemaValidationProblem[] = [];
  const tables = schema.tables;

  astList.forEach((ast: any) => {
    if (ast?.type !== 'create' || ast?.keyword !== 'table') return;

    const tableName = extractTableName(ast.table);
    const table = tables[tableName];
    if (!table || !ast.create_definitions) return;

    const existingColNames = new Set(table.columns.map((c) => c.name.toLowerCase()));

    ast.create_definitions.forEach((def: any) => {
      // 1. Validação de PRIMARY KEY ou UNIQUE em constraints de tabela
      if (def.resource === 'constraint') {
        const constraintType = def.constraint_type?.toLowerCase();

        if (constraintType === 'primary key' || constraintType === 'unique') {
          const defCols = Array.isArray(def.definition) ? def.definition : [def.definition];
          defCols.forEach((colDef: any) => {
            const colName = extractColumnName(colDef);
            if (colName && !existingColNames.has(colName.toLowerCase())) {
              const line = findWordLineInSql(sql, colName, tableName);
              problems.push({
                line,
                message: `A coluna "${colName}" referenciada na ${constraintType.toUpperCase()} não existe na tabela "${tableName}".`,
                type: 'warning',
              });
            }
          });
        }

        // 2. Validação de FOREIGN KEY de tabela
        if (constraintType === 'foreign key') {
          const originColName = extractColumnName(def.definition?.[0]);
          if (originColName && !existingColNames.has(originColName.toLowerCase())) {
            const line = findWordLineInSql(sql, originColName, tableName);
            problems.push({
              line,
              message: `A coluna de origem "${originColName}" da FOREIGN KEY não existe na tabela "${tableName}".`,
              type: 'warning',
            });
          }

          const refTableName = extractTableName(def.reference_definition?.table);
          if (refTableName) {
            const targetTable = tables[refTableName];
            if (!targetTable) {
              const line = findWordLineInSql(sql, refTableName, tableName);
              problems.push({
                line,
                message: `A tabela referenciada "${refTableName}" na FOREIGN KEY não existe no esquema.`,
                type: 'warning',
              });
            } else {
              const targetColName = extractColumnName(def.reference_definition?.definition?.[0]) || 'id';
              const targetColExists = targetTable.columns.some(
                (c) => c.name.toLowerCase() === targetColName.toLowerCase()
              );
              if (!targetColExists) {
                const line = findWordLineInSql(sql, targetColName, tableName);
                problems.push({
                  line,
                  message: `A coluna de destino "${targetColName}" na tabela referenciada "${refTableName}" não existe.`,
                  type: 'warning',
                });
              }
            }
          }
        }
      }

      // 3. Validação de FOREIGN KEY inline na coluna
      if (def.resource === 'column' && def.reference_definition) {
        const colName = extractColumnName(def.column);
        const refTableName = extractTableName(def.reference_definition.table);

        if (refTableName) {
          const targetTable = tables[refTableName];
          if (!targetTable) {
            const line = findWordLineInSql(sql, refTableName, tableName);
            problems.push({
              line,
              message: `A tabela referenciada "${refTableName}" na coluna "${colName}" não existe no esquema.`,
              type: 'warning',
            });
          } else {
            const targetColName = extractColumnName(def.reference_definition.definition?.[0]) || 'id';
            const targetColExists = targetTable.columns.some(
              (c) => c.name.toLowerCase() === targetColName.toLowerCase()
            );
            if (!targetColExists) {
              const line = findWordLineInSql(sql, targetColName, tableName);
              problems.push({
                line,
                message: `A coluna de destino "${targetColName}" na tabela referenciada "${refTableName}" não existe.`,
                type: 'warning',
              });
            }
          }
        }
      }
    });
  });

  return problems;
}
