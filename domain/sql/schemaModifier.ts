/**
 * Substitui o nome de uma tabela em um script SQL preservando
 * a formatação original e atualizando referências de Foreign Key.
 */
export function replaceTableNameInSql(
  sql: string,
  oldName: string,
  newName: string,
  targetTableIndex?: number
): string {
  if (!sql || oldName === newName) {
    return sql;
  }

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  if (!oldName) {
    // Restaurando a partir do vazio sem duplicar espaços nem colar no parêntese "("
    const emptyCreateRegex = /(\bCREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+)\s*(\()/i;
    return sql.replace(emptyCreateRegex, `$1${newName} $2`);
  }

  const escapedOld = escapeRegExp(oldName);

  if (!newName) {
    // Removendo o nome da tabela mantendo o espaçamento limpo antes do "("
    const removeTableRegex = new RegExp(
      `(\\bCREATE\\s+TABLE(?:\\s+IF\\s+NOT\\s+EXISTS)?\\s+)[\`"']?${escapedOld}[\`"']?\\s*([\\(\\s])`,
      'i'
    );
    return sql.replace(removeTableRegex, `$1$2`);
  }

  if (targetTableIndex !== undefined && targetTableIndex >= 0) {
    // Substitui especificamente o N-ésimo bloco CREATE TABLE para nunca colidir quando dois nomes ficam iguais temporariamente
    let currentIdx = 0;
    const anyCreateRegex = /(\bCREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+[`"']?)([^\s(`"']*)([`"']?\s*[\(\s])/gi;
    const updatedSql = sql.replace(anyCreateRegex, (fullMatch, p1, p2, p3) => {
      if (currentIdx++ === targetTableIndex) {
        return `${p1}${newName}${p3}`;
      }
      return fullMatch;
    });
    const referencesRegex = new RegExp(
      `(\\bREFERENCES\\s+[\`"']?)(${escapedOld})([\`"']?\\s*\\()`,
      'gi'
    );
    return updatedSql.replace(referencesRegex, `$1${newName}$3`);
  }

  const createTableRegex = new RegExp(
    `(\\bCREATE\\s+TABLE(?:\\s+IF\\s+NOT\\s+EXISTS)?\\s+[\`"']?)(${escapedOld})([\`"']?\\s*[\\(\\s])`,
    'i'
  );
  let updatedSql = sql.replace(createTableRegex, `$1${newName}$3`);

  const referencesRegex = new RegExp(
    `(\\bREFERENCES\\s+[\`"']?)(${escapedOld})([\`"']?\\s*\\()`,
    'gi'
  );
  updatedSql = updatedSql.replace(referencesRegex, `$1${newName}$3`);

  return updatedSql;
}


/**
 * Localiza os limites (prefix, body, suffix) do bloco CREATE TABLE de uma tabela,
 * respeitando parênteses aninhados (como VARCHAR(20), DECIMAL(10,2)) e strings/comentários.
 */
function extractTableBlock(sql: string, tableName: string): { prefix: string; body: string; suffix: string } | null {
  if (!sql || !tableName) return null;

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedTable = escapeRegExp(tableName);

  const startRegex = new RegExp(
    `\\bCREATE\\s+TABLE(?:\\s+IF\\s+NOT\\s+EXISTS)?\\s+[\`"']?${escapedTable}[\`"']?\\s*\\(`,
    'i'
  );
  const startMatch = startRegex.exec(sql);
  if (!startMatch) return null;

  const startIndex = startMatch.index + startMatch[0].length;
  let depth = 1;
  let inString = false;
  let stringChar = '';
  let inLineComment = false;
  let inBlockComment = false;
  let endIndex = -1;

  for (let i = startIndex; i < sql.length; i++) {
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
        endIndex = i;
        break;
      }
    }
  }

  if (endIndex === -1) {
    const nextCloseMatch = sql.slice(startIndex).search(/\);/);
    if (nextCloseMatch !== -1) {
      endIndex = startIndex + nextCloseMatch;
    } else {
      return null;
    }
  }

  return {
    prefix: sql.substring(0, startIndex),
    body: sql.substring(startIndex, endIndex),
    suffix: sql.substring(endIndex),
  };
}

/**
 * Localiza o bloco CREATE TABLE correspondente e renomeia uma coluna específica,
 * mantendo as constraints (PRIMARY KEY, FOREIGN KEY, UNIQUE) sincronizadas mesmo
 * quando a coluna for temporariamente apagada pelo usuário durante a digitação.
 */
export function replaceColumnNameInSql(
  sql: string,
  tableName: string,
  oldColName: string,
  newColName: string,
  originalColName?: string
): string {
  if (!sql || oldColName === newColName || !tableName) {
    return sql;
  }

  const block = extractTableBlock(sql, tableName);
  if (!block) return sql;

  const { prefix, body, suffix } = block;
  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let updatedBody = body;

  if (!oldColName) {
    // Restaurando nome a partir do estado vazio
    // Procura por linha de coluna que começa com espaço e tipo SQL (ex: "\n   INT" ou "\n   VARCHAR(100)")
    const SQL_DATA_TYPES = 'INT|INTEGER|BIGINT|SMALLINT|TINYINT|VARCHAR|CHAR|TEXT|DECIMAL|NUMERIC|FLOAT|DOUBLE|REAL|DATE|DATETIME|TIMESTAMP|TIME|BOOLEAN|BOOL|BLOB|JSON|UUID|SERIAL';
    const emptyColDefRegex = new RegExp(`(^|[\\n,;][ \\t]*)(?:[ \\t]+)(${SQL_DATA_TYPES})\\b`, 'i');
    updatedBody = updatedBody.replace(emptyColDefRegex, `$1${newColName} $2`);
  } else {
    const escapedCol = escapeRegExp(oldColName);
    const colDefRegex = new RegExp(
      `(^|[\\n,;]\\s*[\`"']?)(${escapedCol})([\`"']?\\s+[A-Za-z])`,
      'i'
    );
    updatedBody = updatedBody.replace(colDefRegex, `$1${newColName}$3`);
  }

  // Atualiza constraints (PRIMARY KEY, FOREIGN KEY, UNIQUE)
  const targetConstraintCol = (!oldColName && originalColName) ? originalColName : oldColName;
  if (targetConstraintCol && newColName && targetConstraintCol !== newColName) {
    const escapedTarget = escapeRegExp(targetConstraintCol);
    const pkFkColRegex = new RegExp(
      `(\\b(?:PRIMARY\\s+KEY|FOREIGN\\s+KEY|UNIQUE)\\s*\\([^)]*\\b[\`"']?)(${escapedTarget})([\`"']?\\b)`,
      'gi'
    );
    updatedBody = updatedBody.replace(pkFkColRegex, `$1${newColName}$3`);
  }

  return `${prefix}${updatedBody}${suffix}`;
}

/**
 * Localiza com precisão o intervalo (start, end) do tipo de uma coluna dentro do corpo da tabela.
 * Respeita parênteses (ex: ENUM('a','b'), DECIMAL(10,2)) e aspas sem quebrar em vírgulas internas.
 */
function findColumnTypeRange(body: string, colName: string): { start: number; end: number } | null {
  const escapedCol = colName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const colStartRegex = new RegExp(`(?:^|[\\n,(;])([ \\t]*[\`"']?${escapedCol}[\`"']?[ \\t]+)`, 'i');
  const match = body.match(colStartRegex);
  if (!match || match.index === undefined) return null;

  const typeStart = match.index + match[0].length;
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let typeEnd = body.length;

  const CONSTRAINT_WORDS = new Set([
    'primary', 'not', 'null', 'unique', 'default', 'check', 'references',
    'auto_increment', 'collate', 'comment', 'unsigned', 'zerofill'
  ]);

  for (let i = typeStart; i < body.length; i++) {
    const ch = body[i];

    if (ch === '\n' || ch === ';') {
      typeEnd = i;
      break;
    }

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

    if (ch === '(') {
      depth++;
      continue;
    }

    if (ch === ')') {
      if (depth > 0) {
        depth--;
        continue;
      } else {
        typeEnd = i;
        break;
      }
    }

    if (depth === 0) {
      if (ch === ',') {
        typeEnd = i;
        break;
      }

      if (/\s/.test(ch)) {
        const remaining = body.slice(i).trimStart();
        const firstWord = remaining.split(/[\s,;()]/)[0].toLowerCase();
        if (CONSTRAINT_WORDS.has(firstWord)) {
          typeEnd = i;
          break;
        }
      }
    }
  }

  return { start: typeStart, end: typeEnd };
}

/**
 * Localiza a coluna em sua respectiva tabela e altera o seu tipo SQL.
 */
export function replaceColumnTypeInSql(
  sql: string,
  tableName: string,
  colName: string,
  oldType: string,
  newType: string
): string {
  if (!sql || !colName || !tableName || oldType === newType) {
    return sql;
  }

  const block = extractTableBlock(sql, tableName);
  if (!block) return sql;

  const { prefix, body, suffix } = block;
  const range = findColumnTypeRange(body, colName);
  if (!range) return sql;

  const updatedBody = body.substring(0, range.start) + newType + body.substring(range.end);
  return `${prefix}${updatedBody}${suffix}`;
}

