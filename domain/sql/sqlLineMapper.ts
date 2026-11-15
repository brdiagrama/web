import type { Table } from '../models/databaseSchema';

export interface TableBlockRange {
  tableName: string;
  startLine: number;
  endLine: number;
  startOffset?: number;
  endOffset?: number;
  bodyStart?: number;
  bodyEnd?: number;
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
      if (ch === '\n') {
        inString = false;
      } else if (ch === stringChar && body[i - 1] !== '\\') {
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

    const isErrorInTable =
      errorOffset !== undefined && errorOffset !== null && range.startOffset !== undefined && range.endOffset !== undefined
        ? errorOffset >= range.startOffset && errorOffset <= range.endOffset
        : errorLine >= range.startLine && errorLine <= range.endLine;
    if (!isErrorInTable) return;

    tableErrors[matched.name] = errorMessage;

    // Localizar se o erro aconteceu em uma coluna específica dentro do corpo da tabela
    const bodyStart = range.bodyStart ?? (sql.indexOf('(', range.startOffset ?? 0) + 1);
    const bodyEnd = range.bodyEnd ?? -1;
    if (bodyEnd === -1 || bodyStart >= bodyEnd) return;

    const body = sql.substring(bodyStart, bodyEnd);
    const defs = splitTableDefinitions(body);

    // Identificar a definição com erro pelo offset ou pela linha
    let targetDef: { text: string; start: number; end: number } | undefined;

    if (errorOffset !== undefined && errorOffset !== null) {
      targetDef = defs.find((d) => {
        const absStart = bodyStart + d.start;
        const absEnd = bodyStart + d.end;
        return errorOffset >= absStart && errorOffset <= absEnd;
      });
    }

    if (!targetDef) {
      targetDef = defs.find((d) => {
        const absStart = bodyStart + d.start;
        const absEnd = bodyStart + d.end;
        const dStartLine = sql.substring(0, absStart).split('\n').length;
        const dEndLine = sql.substring(0, absEnd).split('\n').length;
        return errorLine >= dStartLine && errorLine <= dEndLine;
      });
    }

    if (!targetDef) {
      // Fallback por inclusão de texto de linha quando não localizado por limites exatos
      const lines = sql.split('\n');
      const errLineText = (lines[errorLine - 1] || '').trim();
      if (errLineText) {
        targetDef = defs.find((d) => d.text.includes(errLineText) || errLineText.includes(d.text.trim()));
      }
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
    if (isConstraint(cleanDef)) {
      return;
    }

    const tokens = cleanDef.split(/\s+/).filter(Boolean);
    const rawColName = tokens[0] ? tokens[0].replace(/[`"']/g, '') : '';
    const fullTypeStr = tokens.slice(1).join(' ');
    const constraintRegex = /\b(primary|key|not|null|unique|default|check|references|constraint|collate|auto_increment|autoincrement|identity|generated|masked|encrypted)\b/i;
    const constraintMatch = fullTypeStr.search(constraintRegex);
    const rawColType = constraintMatch !== -1
      ? fullTypeStr.substring(0, constraintMatch).trim()
      : fullTypeStr.trim();

    // Localizar a coluna correspondente no esquema:
    // 1. Por igualdade ou prefixo do nome
    // 2. Se o nome foi substituído por caracteres inválidos ou apagado, pelo índice ordinal da coluna na tabela
    let matchedCol =
      (rawColName
        ? matched.columns.find((c) => c.name.toLowerCase() === rawColName.toLowerCase()) ||
          matched.columns.find((c) =>
            rawColName.toLowerCase().startsWith(c.name.toLowerCase()) ||
            c.name.toLowerCase().startsWith(rawColName.toLowerCase())
          )
        : null) ||
      (targetColIndex !== -1 && targetColIndex < matched.columns.length
        ? matched.columns[targetColIndex]
        : null);

    if (!matchedCol) return;

    const draftKey = `${matched.name}.${matchedCol.name}`;

    // Determinar rascunhos de nome e tipagem de forma independente
    if (!cleanDef) {
      draftColumnNames[draftKey] = '';
    } else {
      if (rawColName !== matchedCol.name) {
        draftColumnNames[draftKey] = rawColName;
      }
      if (rawColType && rawColType.replace(/\s+/g, '') !== matchedCol.type.replace(/\s+/g, '')) {
        draftColumnTypes[draftKey] = rawColType;
      } else if (!rawColType && matchedCol.type) {
        draftColumnTypes[draftKey] = '';
      }
    }
  });

  return { tableErrors, draftNames, draftColumnNames, draftColumnTypes };
}

/**
 * Retorna o nome da tabela que contém a linha ou offset especificado no script SQL.
 */
export function getTableAtLine(sql: string, lineNumber?: number, offset?: number): string | null {
  if (!sql || (!lineNumber && offset === undefined)) return null;
  const ranges = extractTableLineRanges(sql);
  const matched = ranges.find((r) => {
    if (offset !== undefined && r.startOffset !== undefined && r.endOffset !== undefined) {
      return offset >= r.startOffset && offset <= r.endOffset;
    }
    return lineNumber !== undefined && lineNumber >= r.startLine && lineNumber <= r.endLine;
  });
  return matched ? matched.tableName : null;
}

/**
 * Mapeia os intervalos de linhas (startLine/endLine) e offsets de cada bloco CREATE TABLE no texto SQL,
 * suportando formatação multilinhas ou SQL minificado em uma única linha.
 */
export function extractTableLineRanges(sql: string): TableBlockRange[] {
  if (!sql) return [];
  const ranges: TableBlockRange[] = [];
  const createRegex = /\bCREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+[`"']?([^\s(`"']+)[\`"']?\s*\(/gi;

  let match: RegExpExecArray | null;
  while ((match = createRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const startOffset = match.index;
    const bodyStart = match.index + match[0].length;

    let depth = 1;
    let inString = false;
    let stringChar = '';
    let endOffset = sql.length;
    let bodyEnd = sql.length;

    for (let i = bodyStart; i < sql.length; i++) {
      const ch = sql[i];
      if (inString) {
        if (ch === '\n') {
          inString = false;
        } else if (ch === stringChar && sql[i - 1] !== '\\') {
          inString = false;
        }
        continue;
      }

      if (ch === "'" || ch === '"' || ch === '`') {
        inString = true;
        stringChar = ch;
        continue;
      }

      if (ch === '(') {
        depth++;
      } else if (ch === ')') {
        depth--;
        if (depth === 0) {
          bodyEnd = i;
          let j = i + 1;
          while (j < sql.length && (sql[j] === ' ' || sql[j] === '\t' || sql[j] === '\r' || sql[j] === '\n')) {
            j++;
          }
          endOffset = (sql[j] === ';') ? j + 1 : i + 1;
          break;
        }
      } else if (ch === ';' && depth <= 1) {
        bodyEnd = i;
        endOffset = i + 1;
        break;
      }
    }

    const startLine = sql.substring(0, startOffset).split('\n').length;
    const endLine = sql.substring(0, endOffset).split('\n').length;

    ranges.push({
      tableName,
      startLine,
      endLine,
      startOffset,
      endOffset,
      bodyStart,
      bodyEnd,
    });
  }

  return ranges;
}

/**
 * Retorna as informações da coluna que contém a linha ou offset especificado no script SQL.
 */
export function getColumnAtLine(
  sql: string,
  lineNumber?: number,
  tables?: Record<string, Table>,
  offset?: number
): {
  tableName: string;
  columnName: string;
  isPk?: boolean;
  isFk?: boolean;
  refTable?: string | null;
  isHovering: boolean;
} | null {
  if (!sql || (!lineNumber && offset === undefined) || !tables) return null;

  const ranges = extractTableLineRanges(sql);
  const matchedRange = ranges.find((r) => {
    if (offset !== undefined && r.startOffset !== undefined && r.endOffset !== undefined) {
      return offset >= r.startOffset && offset <= r.endOffset;
    }
    return lineNumber !== undefined && lineNumber >= r.startLine && lineNumber <= r.endLine;
  });
  if (!matchedRange) return null;

  if (offset !== undefined && matchedRange.bodyStart !== undefined && matchedRange.bodyEnd !== undefined) {
    if (offset < matchedRange.bodyStart || offset > matchedRange.bodyEnd) {
      return null;
    }
  } else if (lineNumber !== undefined && (lineNumber <= matchedRange.startLine || lineNumber >= matchedRange.endLine)) {
    return null;
  }

  const table = tables[matchedRange.tableName];
  if (!table || !table.columns) return null;

  const bodyStart = matchedRange.bodyStart ?? (sql.indexOf('(', matchedRange.startOffset ?? 0) + 1);
  const bodyEnd = matchedRange.bodyEnd ?? sql.length;
  const body = sql.substring(bodyStart, bodyEnd);
  const defs = splitTableDefinitions(body);

  const targetDef = defs.find((d) => {
    const absStart = bodyStart + d.start;
    const absEnd = bodyStart + d.end;
    if (offset !== undefined) {
      return offset >= absStart && offset <= absEnd;
    }
    const dStartLine = sql.substring(0, absStart).split('\n').length;
    const dEndLine = sql.substring(0, absEnd).split('\n').length;
    return lineNumber !== undefined && lineNumber >= dStartLine && lineNumber <= dEndLine;
  });

  if (!targetDef) return null;

  const cleanDef = targetDef.text.trim().replace(/^--.*$/gm, '').trim();
  if (!cleanDef) return null;

  const tokens = cleanDef.split(/\s+/).filter(Boolean);
  const rawColName = tokens[0]?.replace(/[`"']/g, '');

  let matchedCol = table.columns.find(
    (c) => c.name.toLowerCase() === rawColName?.toLowerCase()
  );

  if (!matchedCol) {
    const fkMatch = cleanDef.match(/FOREIGN\s+KEY\s*\(\s*[`"']?([^`"'\s)]+)[`"']?\s*\)/i);
    if (fkMatch && fkMatch[1]) {
      const fkColName = fkMatch[1];
      matchedCol = table.columns.find(
        (c) => c.name.toLowerCase() === fkColName.toLowerCase()
      );
    }
  }

  if (!matchedCol) {
    const pkMatch = cleanDef.match(/PRIMARY\s+KEY\s*\(\s*[`"']?([^`"'\s)]+)[`"']?\s*\)/i);
    if (pkMatch && pkMatch[1]) {
      const pkColName = pkMatch[1];
      matchedCol = table.columns.find(
        (c) => c.name.toLowerCase() === pkColName.toLowerCase()
      );
    }
  }

  // Fallback para quando o usuário estiver digitando/editando o nome da coluna no editor
  if (!matchedCol && rawColName) {
    matchedCol = table.columns.find(
      (c) =>
        c.name.toLowerCase().startsWith(rawColName.toLowerCase()) ||
        rawColName.toLowerCase().startsWith(c.name.toLowerCase())
    );
  }

  if (!matchedCol) {
    const isConstraint = (text: string) =>
      /^(?:PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK|CONSTRAINT|INDEX|KEY)\b/i.test(text.trim());
    const columnDefsOnly = defs.filter((d) => !isConstraint(d.text.trim()));
    const targetColIndex = columnDefsOnly.indexOf(targetDef);
    if (targetColIndex !== -1 && targetColIndex < table.columns.length) {
      matchedCol = table.columns[targetColIndex];
    }
  }

  if (!matchedCol) return null;

  return {
    tableName: table.name,
    columnName: matchedCol.name,
    isPk: !!matchedCol.isPk,
    isFk: !!matchedCol.isFk,
    refTable: matchedCol.refTable,
    isHovering: true,
  };
}
