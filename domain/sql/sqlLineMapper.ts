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
      if (ch === '\n' || ch === '\r') {
        inString = false;
        depth = 0;
      } else if (ch === stringChar && body[i - 1] !== '\\') {
        inString = false;
      }
    } else if (ch === "'" || ch === '"' || ch === '`') {
      inString = true;
      stringChar = ch;
    } else if (ch === '(') {
      depth++;
    } else if (ch === ')') {
      if (depth > 0) depth--;
    }

    if (ch === ',') {
      const rest = body.slice(i + 1);
      const isLineEndComma = rest.search(/[\r\n]/) !== -1 &&
        (rest.search(/[\r\n]/) < rest.search(/\S/) || rest.search(/\S/) === -1);

      if ((!inString && depth === 0) || isLineEndComma) {
        defs.push({ text: body.substring(start, i), start, end: i });
        start = i + 1;
        depth = 0;
        inString = false;
      }
    }
  }

  defs.push({ text: body.substring(start), start, end: body.length });
  return defs;
}

export function extractColumnRawTypesFromSql(
  sql: string,
  tables: Record<string, Table>
): Record<string, string> {
  const result: Record<string, string> = {};
  if (!sql || !tables) return result;

  const ranges = extractTableLineRanges(sql);
  const tableValues = Object.values(tables);
  const isConstraint = (text: string) =>
    /^(?:PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK|CONSTRAINT|INDEX|KEY)\b/i.test(
      text.trim().replace(/^--.*$/gm, '').trim()
    );
  const constraintRegex = /\b(primary|key|not|null|unique|default|check|references|constraint|collate|auto_increment|autoincrement|identity|generated|masked|encrypted)\b/i;

  ranges.forEach((range, index) => {
    const matched =
      tableValues.find((t) => t.id === `table_idx_${index}`) ||
      tables[range.tableName];
    if (!matched || !matched.columns) return;

    const bodyStart = range.bodyStart ?? (sql.indexOf('(', range.startOffset ?? 0) + 1);
    const bodyEnd = range.bodyEnd ?? -1;
    if (bodyEnd === -1 || bodyStart >= bodyEnd) return;

    const body = sql.substring(bodyStart, bodyEnd);
    const defs = splitTableDefinitions(body);
    const columnDefsOnly = defs.filter((d) => {
      const clean = d.text.trim().replace(/^--.*$/gm, '').trim();
      return clean.length > 0 && !isConstraint(clean);
    });

    columnDefsOnly.forEach((colDef, colOrdinalIndex) => {
      const cleanDef = colDef.text.trim().replace(/^--.*$/gm, '').trim();
      if (isConstraint(cleanDef)) return;

      const nameMatch = cleanDef.match(/^[`"']?([^\s,;()]+)[`"']?/);
      const rawColName = nameMatch ? nameMatch[1] : '';
      const remainder = nameMatch ? cleanDef.slice(nameMatch[0].length).trimStart() : cleanDef;

      let rawColType = '';
      let depth = 0;
      let inString = false;
      let stringChar = '';

      for (let i = 0; i < remainder.length; i++) {
        const ch = remainder[i];
        if (inString) {
          if (ch === '\n') {
            inString = false;
          } else if (ch === stringChar && remainder[i - 1] !== '\\') {
            inString = false;
            rawColType += ch;
            continue;
          } else {
            if (/\s/.test(ch)) {
              const rest = remainder.slice(i).trimStart();
              const firstWord = rest.split(/[\s,;()]/)[0].toLowerCase();
              if (constraintRegex.test(firstWord)) break;
            }
            rawColType += ch;
            continue;
          }
        }
        if (ch === "'" || ch === '"' || ch === '`') {
          inString = true;
          stringChar = ch;
          rawColType += ch;
          continue;
        }
        if (ch === '(') {
          depth++;
          rawColType += ch;
          continue;
        }
        if (ch === ')') {
          if (depth > 0) depth--;
          rawColType += ch;
          continue;
        }
        if (ch === ';' || ch === '\n') break;
        if (depth === 0 && ch === ',') break;
        if (i === 0 || /\s/.test(ch)) {
          const rest = remainder.slice(i).trimStart();
          const firstWord = rest.split(/[\s,;()]/)[0].toLowerCase();
          if (constraintRegex.test(firstWord)) break;
        }
        rawColType += ch;
      }

      rawColType = rawColType.trim();
      const matchedCol =
        (rawColName
          ? matched.columns.find((c) => c.name.toLowerCase() === rawColName.toLowerCase())
          : null) ||
        (colOrdinalIndex < matched.columns.length ? matched.columns[colOrdinalIndex] : null);

      if (matchedCol && rawColType) {
        result[`${matched.name}.${matchedCol.name}`] = rawColType;
      }
    });
  });

  return result;
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

    // Identificar todas as definições que são colunas (excluindo constraints de tabela como PRIMARY KEY, FOREIGN KEY)
    const isConstraint = (text: string) =>
      /^(?:PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK|CONSTRAINT|INDEX|KEY)\b/i.test(
        text.trim().replace(/^--.*$/gm, '').trim()
      );

    const columnDefsOnly = defs.filter((d) => {
      const clean = d.text.trim().replace(/^--.*$/gm, '').trim();
      return clean.length > 0 && !isConstraint(clean);
    });
    const constraintRegex = /\b(primary|key|not|null|unique|default|check|references|constraint|collate|auto_increment|autoincrement|identity|generated|masked|encrypted)\b/i;

    columnDefsOnly.forEach((colDef, colOrdinalIndex) => {
      const cleanDef = colDef.text.trim().replace(/^--.*$/gm, '').trim();
      if (isConstraint(cleanDef)) {
        return;
      }

      // Extrai o nome da coluna e o tipo respeitando parênteses aninhados e aspas
      const nameMatch = cleanDef.match(/^[`"']?([^\s,;()]+)[`"']?/);
      const rawColName = nameMatch ? nameMatch[1] : '';
      const remainder = nameMatch ? cleanDef.slice(nameMatch[0].length).trimStart() : cleanDef;

      let rawColType = '';
      let depth = 0;
      let inString = false;
      let stringChar = '';

      for (let i = 0; i < remainder.length; i++) {
        const ch = remainder[i];

        if (inString) {
          if (ch === '\n') {
            inString = false;
          } else if (ch === stringChar && remainder[i - 1] !== '\\') {
            inString = false;
            rawColType += ch;
            continue;
          } else {
            // Se houver aspa ainda não fechada durante digitação transitória (ex: ENUM(' NOT NULL),
            // não engolir constraints subsequentes da coluna
            if (/\s/.test(ch)) {
              const rest = remainder.slice(i).trimStart();
              const firstWord = rest.split(/[\s,;()]/)[0].toLowerCase();
              if (constraintRegex.test(firstWord)) {
                break;
              }
            }
            rawColType += ch;
            continue;
          }
        }

        if (ch === "'" || ch === '"' || ch === '`') {
          inString = true;
          stringChar = ch;
          rawColType += ch;
          continue;
        }

        if (ch === '(') {
          depth++;
          rawColType += ch;
          continue;
        }

        if (ch === ')') {
          if (depth > 0) depth--;
          rawColType += ch;
          continue;
        }

        if (ch === ';' || ch === '\n') {
          break;
        }

        if (depth === 0 && ch === ',') {
          break;
        }

        // Mesmo com parêntese ainda aberto durante digitação transitória, constraints delimitam o fim do tipo
        if (i === 0 || /\s/.test(ch)) {
          const rest = remainder.slice(i).trimStart();
          const firstWord = rest.split(/[\s,;()]/)[0].toLowerCase();
          if (constraintRegex.test(firstWord)) {
            break;
          }
        }

        rawColType += ch;
      }

      rawColType = rawColType.trim();

      let matchedCol =
        (colOrdinalIndex < matched.columns.length ? matched.columns[colOrdinalIndex] : null) ||
        (rawColName
          ? matched.columns.find((c) => c.name.toLowerCase() === rawColName.toLowerCase()) ||
            matched.columns.find((c) =>
              rawColName.toLowerCase().startsWith(c.name.toLowerCase()) ||
              c.name.toLowerCase().startsWith(rawColName.toLowerCase())
            )
          : null);

      if (!matchedCol) return;

      const draftKey = `${matched.name}.${matchedCol.name}`;

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
  const createRegex = /\bCREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:[`"\[]?([^\s(`"'\].]*)[`"\]]?\.)?[`"\[]?([^\s(`"'\].]*)[`"\]]?\s*\(/gi;

  let match: RegExpExecArray | null;
  while ((match = createRegex.exec(sql)) !== null) {
    const tableName = match[2] || match[1];
    const startOffset = match.index;
    const bodyStart = match.index + match[0].length;

    let depth = 1;
    let inString = false;
    let stringChar = '';
    let inLineComment = false;
    let inBlockComment = false;
    let endOffset = sql.length;
    let bodyEnd = sql.length;

    for (let i = bodyStart; i < sql.length; i++) {
      const ch = sql[i];
      const nextCh = sql[i + 1] || '';

      if (inLineComment) {
        if (ch === '\n') inLineComment = false;
        continue;
      }
      if (inBlockComment) {
        if (ch === '*' && nextCh === '/') {
          inBlockComment = false;
          i++;
        }
        continue;
      }

      if (inString) {
        if (ch === '\n') {
          inString = false;
        } else if (ch === stringChar && sql[i - 1] !== '\\') {
          inString = false;
        }
        continue;
      }

      if (ch === '-' && nextCh === '-') {
        inLineComment = true;
        i++;
        continue;
      }
      if (ch === '/' && nextCh === '*') {
        inBlockComment = true;
        i++;
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
