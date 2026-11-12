import type { Table } from '../models/databaseSchema';

export interface TableBlockRange {
  tableName: string;
  startLine: number;
  endLine: number;
}

export interface TableErrorMapping {
  tableErrors: Record<string, string>;
  draftNames: Record<string, string>;
}

/**
 * Associa a linha do erro de sintaxe SQL às tabelas já existentes no esquema
 * e captura o nome atual digitado no bloco CREATE TABLE.
 */
export function mapSqlErrorsToTables(
  sql: string,
  errorLine: number,
  errorMessage: string,
  existingTables: Record<string, Table>
): TableErrorMapping {
  const tableErrors: Record<string, string> = {};
  const draftNames: Record<string, string> = {};
  const ranges = extractTableLineRanges(sql);
  const tableValues = Object.values(existingTables);

  ranges.forEach((range, index) => {
    const matched =
      existingTables[range.tableName] ||
      tableValues.find((t) => t.id === `table_idx_${index}`);

    if (!matched) return;

    if (range.tableName !== matched.name) {
      draftNames[matched.name] = range.tableName;
    }

    if (errorLine >= range.startLine && errorLine <= range.endLine) {
      tableErrors[matched.name] = errorMessage;
    }
  });

  return { tableErrors, draftNames };
}

/**
 * Mapeia os intervalos de linhas (startLine/endLine) e o nome atual
 * de cada bloco CREATE TABLE no texto SQL.
 */
export function extractTableLineRanges(sql: string): TableBlockRange[] {
  if (!sql) return [];
  const lines = sql.split('\n');
  const ranges: TableBlockRange[] = [];

  let currentStart = -1;
  let currentName = '';
  let parenDepth = 0;
  let foundOpeningParen = false;

  const createRegex = /^\s*CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+([^\s(]*)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const newCreateMatch = line.match(createRegex);

    if (currentStart !== -1 && newCreateMatch) {
      ranges.push({
        tableName: currentName,
        startLine: currentStart,
        endLine: lineNum - 1,
      });
      currentStart = -1;
      currentName = '';
    }

    if (currentStart === -1 && newCreateMatch) {
      currentStart = lineNum;
      currentName = (newCreateMatch[1] || '').replace(/[`"']/g, '');
      parenDepth = 0;
      foundOpeningParen = false;
    }

    if (currentStart !== -1) {
      for (const ch of line) {
        if (ch === '(') {
          parenDepth++;
          foundOpeningParen = true;
        } else if (ch === ')') {
          parenDepth--;
        }
      }

      const endsBlock = (foundOpeningParen && parenDepth <= 0) || line.includes(';');
      if (endsBlock || i === lines.length - 1) {
        ranges.push({
          tableName: currentName,
          startLine: currentStart,
          endLine: lineNum,
        });
        currentStart = -1;
        currentName = '';
      }
    }
  }

  return ranges;
}
