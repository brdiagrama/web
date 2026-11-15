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
      `(\\bCREATE\\s+TABLE(?:\\s+IF\\s+NOT\\s+EXISTS)?\\s+(?:[\`"'\\[]?[^\\s(\`"'\\]]+\\.)?)[[\`"'\\[]?${escapedOld}[\`"'\\]]?\\s*([\\(\\s])`,
      'i'
    );
    return sql.replace(removeTableRegex, `$1$2`);
  }

  if (targetTableIndex !== undefined && targetTableIndex >= 0) {
    // Substitui especificamente o N-ésimo bloco CREATE TABLE para nunca colidir quando dois nomes ficam iguais temporariamente
    let currentIdx = 0;
    const anyCreateRegex = /(\bCREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:[\`"'\\[]?[^\s(\`"'\\]]+\.)?[\`"'\\[]?)([^\s(`"'\].]*)([\`"'\\]?\s*[\(\s])/gi;
    const updatedSql = sql.replace(anyCreateRegex, (fullMatch, p1, p2, p3) => {
      if (currentIdx++ === targetTableIndex) {
        return `${p1}${newName}${p3}`;
      }
      return fullMatch;
    });
    const referencesRegex = new RegExp(
      `(\\bREFERENCES\\s+(?:[\`"'\\[]?[^\\s(\`"'\\]]+\\.)?[\`"'\\[]?)(${escapedOld})([\`"'\\]]?\\s*\\()`,
      'gi'
    );
    return updatedSql.replace(referencesRegex, `$1${newName}$3`);
  }

  const createTableRegex = new RegExp(
    `(\\bCREATE\\s+TABLE(?:\\s+IF\\s+NOT\\s+EXISTS)?\\s+(?:[\`"'\\[]?[^\\s(\`"'\\]]+\\.)?[\`"'\\[]?)(${escapedOld})([\`"'\\]?\\s*[\\(\\s])`,
    'i'
  );
  let updatedSql = sql.replace(createTableRegex, `$1${newName}$3`);

  const referencesRegex = new RegExp(
    `(\\bREFERENCES\\s+(?:[\`"'\\[]?[^\\s(\`"'\\]]+\\.)?[\`"'\\[]?)(${escapedOld})([\`"'\\]?\\s*\\()`,
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
    `\\bCREATE\\s+TABLE(?:\\s+IF\\s+NOT\\s+EXISTS)?\\s+(?:[\`"'\\[]?[^\\s(\`"'\\]]+\\.)?[\`"'\\[]?${escapedTable}[\`"'\\]]?\\s*\\(`,
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
  originalColName?: string,
  targetColIndex?: number
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
    // Restaurando nome a partir do estado vazio:
    // Se sabemos o índice da coluna ou se localizamos a definição cuja primeira palavra já é tipo/constraint
    const TABLE_CONSTRAINTS = /^(?:PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK|CONSTRAINT|INDEX|KEY)\b/i;
    const defs: Array<{ text: string; start: number; end: number }> = [];
    let depth = 0;
    let start = 0;
    let inString = false;
    let stringChar = '';
    for (let i = 0; i < body.length; i++) {
      const ch = body[i];
      if (inString) {
        if (ch === '\n') inString = false;
        else if (ch === stringChar && body[i - 1] !== '\\') inString = false;
        continue;
      }
      if (ch === "'" || ch === '"' || ch === '`') {
        inString = true;
        stringChar = ch;
        continue;
      }
      if (ch === '(') depth++;
      else if (ch === ')') { if (depth > 0) depth--; }
      else if (ch === ',') {
        const rest = body.slice(i + 1);
        const isLineEndComma = rest.search(/[\r\n]/) !== -1 &&
          (rest.search(/[\r\n]/) < rest.search(/\S/) || rest.search(/\S/) === -1);
        if (depth === 0 || isLineEndComma) {
          defs.push({ text: body.substring(start, i), start, end: i });
          start = i + 1;
          depth = 0;
        }
      }
    }
    defs.push({ text: body.substring(start), start, end: body.length });

    const colDefs = defs.filter((d) => !TABLE_CONSTRAINTS.test(d.text.trim().replace(/^--.*$/gm, '').trim()));
    const targetDef =
      targetColIndex !== undefined && colDefs[targetColIndex]
        ? colDefs[targetColIndex]
        : colDefs.find((d) => {
            return /^[ \t]*\n?[ \t]*(?:[`"']{2}|[ \t]{2,})[A-Za-z_]/.test(d.text);
          }) || colDefs[0];

    if (targetDef) {
      const defContent = targetDef.text;
      // Caso tenhamos aspas vazias como `` ou "" deixadas ao apagar o nome entre backticks
      const emptyQuotesMatch = defContent.match(/^(\s*)([`"'])\2(\s*)/);
      if (emptyQuotesMatch) {
        const leadingWs = emptyQuotesMatch[1];
        const quote = emptyQuotesMatch[2];
        const afterWs = emptyQuotesMatch[3] || ' ';
        const rest = defContent.slice(emptyQuotesMatch[0].length);
        const newDefText = `${leadingWs}${quote}${newColName}${quote}${afterWs}${rest}`;
        updatedBody = body.substring(0, targetDef.start) + newDefText + body.substring(targetDef.end);
      } else {
        const firstWordMatch = defContent.match(/^(\s*)(\S+)/);
        if (firstWordMatch) {
          const leadingWs = firstWordMatch[1];
          const normalizedWs = leadingWs.replace(/([ \t]+)$/, (spaces) =>
            spaces.length > 2 ? spaces.slice(0, 2) : spaces
          );
          const newDefText = `${normalizedWs}${newColName} ${defContent.slice(leadingWs.length)}`;
          updatedBody = body.substring(0, targetDef.start) + newDefText + body.substring(targetDef.end);
        }
      }
    }
  } else {
    const escapedCol = escapeRegExp(oldColName);
    const colDefRegex = new RegExp(
      `(^|[\\n,(;]\\s*)([\`"']?)(${escapedCol})\\2(?=\\s|$|[,;)])`,
      'i'
    );
    if (!newColName) {
      // Remove tanto o nome quanto eventuais aspas/backticks ao redor quando o campo fica vazio
      updatedBody = updatedBody.replace(colDefRegex, `$1`);
    } else {
      updatedBody = updatedBody.replace(colDefRegex, (_m, p1, quote, _col, offset, fullStr) => {
        const nextCh = fullStr[offset + _m.length] || '';
        const needsSpace = Boolean(nextCh && !/[\s,;)]/.test(nextCh));
        return `${p1}${quote}${newColName}${quote}${needsSpace ? ' ' : ''}`;
      });
    }
  }

  // Atualiza constraints internas (PRIMARY KEY, FOREIGN KEY, UNIQUE) e referências externas
  let updatedPrefix = prefix;
  let updatedSuffix = suffix;
  const targetConstraintCol = (!oldColName && originalColName) ? originalColName : oldColName;
  if (targetConstraintCol && newColName && targetConstraintCol !== newColName) {
    const escapedTarget = escapeRegExp(targetConstraintCol);
    const pkFkColRegex = new RegExp(
      `(\\b(?:PRIMARY\\s+KEY|FOREIGN\\s+KEY|UNIQUE)\\s*\\([^)]*\\b[\`"'\\[]?)(${escapedTarget})([\`"'\\]]?\\b)`,
      'gi'
    );
    updatedBody = updatedBody.replace(pkFkColRegex, `$1${newColName}$3`);

    // Atualiza referências externas em outras tabelas: REFERENCES tableName(targetCol)
    const escapedTable = escapeRegExp(tableName);
    const foreignRefRegex = new RegExp(
      `(\\bREFERENCES\\s+(?:[\`"'\\[]?[^\\s(\`"'\\]]+\\.)?[\`"'\\[]?${escapedTable}[\`"'\\]]?\\s*\\([^)]*\\b[\`"'\\[]?)(${escapedTarget})([\`"'\\]]?\\b)`,
      'gi'
    );
    updatedPrefix = updatedPrefix.replace(foreignRefRegex, `$1${newColName}$3`);
    updatedSuffix = updatedSuffix.replace(foreignRefRegex, `$1${newColName}$3`);
  }

  return `${updatedPrefix}${updatedBody}${updatedSuffix}`;
}

/**
 * Localiza com precisão o intervalo (start, end) do tipo de uma coluna dentro do corpo da tabela.
 * Respeita parênteses (ex: ENUM('a','b'), DECIMAL(10,2)) e aspas sem quebrar em vírgulas internas.
 */
function findColumnTypeRange(body: string, colName: string, oldType?: string): { start: number; end: number } | null {
  const escapedCol = colName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const colStartRegex = new RegExp(`(?:^|[\\n,(;])([ \\t]*[\`"']?${escapedCol}[\`"']?[ \\t]+)`, 'i');
  const match = body.match(colStartRegex);
  if (!match || match.index === undefined) return null;

  const typeStart = match.index + match[0].length;

  // Se sabemos o oldType exato (não vazio) e ele corresponde ao início de typeStart, o intervalo é deterministicamente exato
  if (oldType && body.slice(typeStart, typeStart + oldType.length) === oldType) {
    return { start: typeStart, end: typeStart + oldType.length };
  }

  let depth = 0;
  let inString = false;
  let stringChar = '';
  let typeEnd = body.length;

  const CONSTRAINT_WORDS = new Set([
    'primary', 'key', 'not', 'null', 'unique', 'default', 'check', 'references',
    'constraint', 'collate', 'auto_increment', 'autoincrement', 'identity',
    'generated', 'comment', 'masked', 'encrypted'
  ]);

  // Se a primeira palavra logo após o nome da coluna já for uma constraint, o tipo está vazio
  const initialRemaining = body.slice(typeStart).trimStart();
  const initialFirstWord = initialRemaining.split(/[\s,;()]/)[0].toLowerCase();
  if (CONSTRAINT_WORDS.has(initialFirstWord)) {
    return { start: typeStart, end: typeStart };
  }

  for (let i = typeStart; i < body.length; i++) {
    const ch = body[i];

    if (ch === '\n' || ch === ';') {
      typeEnd = i;
      break;
    }

    if (inString) {
      if (ch === stringChar && body[i - 1] !== '\\') {
        inString = false;
      } else {
        // Durante digitação transitória de uma aspa aberta (ex: ENUM('), não engolir constraints da coluna
        if (/\s/.test(ch)) {
          const remaining = body.slice(i).trimStart();
          const firstWord = remaining.split(/[\s,;()]/)[0].toLowerCase();
          if (CONSTRAINT_WORDS.has(firstWord)) {
            typeEnd = i;
            break;
          }
        }
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

    if (ch === ',') {
      const afterComma = body.slice(i + 1);
      const trimmedAfter = afterComma.trimStart();
      const isFollowedByNewline = afterComma.search(/[\r\n]/) !== -1 &&
        (afterComma.search(/[\r\n]/) < afterComma.search(/\S/) || afterComma.search(/\S/) === -1);
      const nextWord = trimmedAfter.split(/[\s,;()]/)[0].toLowerCase();
      if (depth === 0 || isFollowedByNewline || CONSTRAINT_WORDS.has(nextWord)) {
        typeEnd = i;
        break;
      }
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

  // Se por qualquer motivo uma vírgula ao final da linha foi engolida em rascunho com parênteses/aspas abertos,
  // recua o typeEnd para preservá-la intacta
  const typeText = body.substring(typeStart, typeEnd);
  const trailingCommaMatch = typeText.match(/,\s*$/);
  if (trailingCommaMatch && trailingCommaMatch.index !== undefined) {
    typeEnd = typeStart + trailingCommaMatch.index;
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
  const range = findColumnTypeRange(body, colName, oldType);
  if (!range) return sql;

  const afterChar = body[range.end] || '';
  const needsSpaceAfter = Boolean(newType && afterChar && !/[\s,;)]/.test(afterChar));
  const replacement = needsSpaceAfter ? `${newType} ` : newType;
  const updatedBody = body.substring(0, range.start) + replacement + body.substring(range.end);
  return `${prefix}${updatedBody}${suffix}`;
}

