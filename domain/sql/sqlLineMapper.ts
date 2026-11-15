import type { Table } from '../models/databaseSchema';

export interface TableBlockRange {
  tableName: string;
  startLine: number;
  endLine: number;
}

export interface TableErrorMapping {
  tableErrors: Record<string, string>;
  draftNames: Record<string, string>;
  draftColumnNames?: Record<string, string>;
  draftColumnTypes?: Record<string, string>;
}

export interface SqlErrorLocation {
  line?: number;
  offset?: number;
}

/**
 * Divide o corpo de uma tabela (entre os parênteses) em definições de colunas/constraints,
 * respeitando parênteses aninhados (como VARCHAR(20), DECIMAL(10,2)) e strings.
 */
function splitTableDefinitions(
  body: string
): Array<{ text: string; start: number; end: number }> {
  const defs: Array<{ text: string; start: number; end: number }> = [];
  let depth = 0;
  let start = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inString) {
      if (ch === stringChar && body[i - 1] !== '\\') {
        inString = false;
      }
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inString = true;
      stringChar = ch;
      continue;
    }

    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      defs.push({ text: body.substring(start, i), start, end: i });
      start = i + 1;
    }
  }

  defs.push({ text: body.substring(start), start, end: body.length });
  return defs;
}

/**
 * Associa a linha e o offset do erro de sintaxe SQL às tabelas e colunas
 * já existentes no esquema, capturando o rascunho com erro.
 */
export function mapSqlErrorsToTables(
  sql: string,
  errorLine: number,
  errorMessage: string,
  existingTables: Record<string, Table>,
  errorOffset?: number
): TableErrorMapping {
  const tableErrors: Record<string, string> = {};
  const draftNames: Record<string, string> = {};
  const draftColumnNames: Record<string, string> = {};
  const draftColumnTypes: Record<string, string> = {};

  const ranges = extractTableLineRanges(sql);
  const tableValues = Object.values(existingTables);

  ranges.forEach((range, index) => {
    const matched =
      tableValues.find((t) => t.id === `table_idx_${index}`) ||
      existingTables[range.tableName];

    if (!matched) return;

    if (range.tableName !== matched.name) {
      draftNames[matched.name] = range.tableName;
    }

    const isErrorInTable = errorLine >= range.startLine && errorLine <= range.endLine;
    if (!isErrorInTable) return;

    tableErrors[matched.name] = errorMessage;

    // Localizar se o erro aconteceu em uma coluna específica dentro do corpo da tabela
    const openParen = sql.indexOf('(', range.startLine > 1 ? sql.split('\n').slice(0, range.startLine - 1).join('\n').length : 0);
    if (openParen === -1) return;

    let depth = 1;
    let closeParen = -1;
    for (let i = openParen + 1; i < sql.length; i++) {
      if (sql[i] === '(') depth++;
      else if (sql[i] === ')') {
        depth--;
        if (depth === 0) {
          closeParen = i;
          break;
        }
      }
    }

    if (closeParen === -1) return;

    const body = sql.substring(openParen + 1, closeParen);
    const defs = splitTableDefinitions(body);

    // Identificar a definição com erro pelo offset ou pela linha
    let targetDef: { text: string; start: number; end: number } | undefined;

    if (errorOffset !== undefined && errorOffset !== null) {
      targetDef = defs.find((d) => {
        const absStart = openParen + 1 + d.start;
        const absEnd = openParen + 1 + d.end;
        return errorOffset >= absStart && errorOffset <= absEnd;
      });
    }

    if (!targetDef) {
      // Fallback por linha quando offset não estiver disponível
      const lines = sql.split('\n');
      const errLineText = (lines[errorLine - 1] || '').trim();
      targetDef = defs.find((d) => d.text.includes(errLineText) || errLineText.includes(d.text.trim()));
    }

    if (!targetDef) return;

    // Filtrar apenas as definições que são colunas (excluindo constraints de tabela como PRIMARY KEY, FOREIGN KEY)
    const isConstraint = (text: string) =>
      /^(?:PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK|CONSTRAINT|INDEX|KEY)\b/i.test(
        text.trim().replace(/^--.*$/gm, '').trim()
      );

    const columnDefsOnly = defs.filter((d) => !isConstraint(d.text));
    const targetColIndex = columnDefsOnly.indexOf(targetDef);

    const cleanDef = targetDef.text.trim().replace(/^--.*$/gm, '').trim();
    if (!cleanDef || isConstraint(cleanDef)) {
      return;
    }

    const tokens = cleanDef.split(/\s+/);
    if (tokens.length === 0) return;

    const rawColName = tokens[0].replace(/[`"']/g, '');
    const rawColType = tokens.slice(1).join(' ');

    // Localizar a coluna correspondente no esquema:
    // 1. Por igualdade ou prefixo do nome
    // 2. Se o nome foi substituído por caracteres inválidos (ex: @@@), pelo índice ordinal da coluna na tabela
    let matchedCol =
      matched.columns.find((c) => c.name.toLowerCase() === rawColName.toLowerCase()) ||
      matched.columns.find((c) =>
        rawColName.toLowerCase().startsWith(c.name.toLowerCase()) ||
        c.name.toLowerCase().startsWith(rawColName.toLowerCase())
      );

    if (!matchedCol && targetColIndex !== -1 && targetColIndex < matched.columns.length) {
      matchedCol = matched.columns[targetColIndex];
    }

    if (!matchedCol) return;

    const draftKey = `${matched.name}.${matchedCol.name}`;

    // Determinar se o erro foi no nome da coluna ou na tipagem
    if (rawColName !== matchedCol.name) {
      draftColumnNames[draftKey] = rawColName;
    } else if (rawColType && rawColType !== matchedCol.type) {
      draftColumnTypes[draftKey] = rawColType;
    } else {
      // Se a sintaxe quebrou logo após o nome, registra o rascunho do nome
      draftColumnNames[draftKey] = rawColName;
    }
  });

  return { tableErrors, draftNames, draftColumnNames, draftColumnTypes };
}

/**
 * Retorna o nome da tabela que contém a linha especificada no script SQL.
 */
export function getTableAtLine(sql: string, lineNumber: number): string | null {
  if (!sql || !lineNumber) return null;
  const ranges = extractTableLineRanges(sql);
  const matched = ranges.find((r) => lineNumber >= r.startLine && lineNumber <= r.endLine);
  return matched ? matched.tableName : null;
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
