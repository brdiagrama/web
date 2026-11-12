/**
 * Substitui o nome de uma tabela em um script SQL preservando
 * a formatação original e atualizando referências de Foreign Key.
 */
export function replaceTableNameInSql(
  sql: string,
  oldName: string,
  newName: string
): string {
  if (!sql || oldName === newName) {
    return sql;
  }

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  if (!oldName) {
    const emptyCreateRegex = /(\bCREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+)(\s*\()/i;
    return sql.replace(emptyCreateRegex, `$1${newName}$2`);
  }

  const escapedOld = escapeRegExp(oldName);

  const createTableRegex = new RegExp(
    `(\\bCREATE\\s+TABLE(?:\\s+IF\\s+NOT\\s+EXISTS)?\\s+[\`"']?)(${escapedOld})([\`"']?\\s*[\\(\\s])`,
    'gi'
  );
  let updatedSql = sql.replace(createTableRegex, `$1${newName}$3`);

  if (newName) {
    const referencesRegex = new RegExp(
      `(\\bREFERENCES\\s+[\`"']?)(${escapedOld})([\`"']?\\s*\\()`,
      'gi'
    );
    updatedSql = updatedSql.replace(referencesRegex, `$1${newName}$3`);
  }

  return updatedSql;
}


/**
 * Localiza o bloco CREATE TABLE correspondente e renomeia uma coluna específica.
 */
export function replaceColumnNameInSql(
  sql: string,
  tableName: string,
  oldColName: string,
  newColName: string
): string {
  if (!sql || oldColName === newColName || !tableName) {
    return sql;
  }

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedTable = escapeRegExp(tableName);

  const tableBlockRegex = new RegExp(
    `(\\bCREATE\\s+TABLE(?:\\s+IF\\s+NOT\\s+EXISTS)?\\s+[\`"']?${escapedTable}[\`"']?\\s*\\()([\\s\\S]*?)(\\);?)`,
    'i'
  );

  return sql.replace(tableBlockRegex, (match, prefix, body, suffix) => {
    if (!oldColName) {
      const emptyColDefRegex = /(^|[\n,;]\s*[`"']?)(\s+[A-Za-z])/i;
      const updatedBody = body.replace(emptyColDefRegex, `$1${newColName}$2`);
      return `${prefix}${updatedBody}${suffix}`;
    }

    const escapedCol = escapeRegExp(oldColName);
    const colDefRegex = new RegExp(
      `(^|[\\n,;]\\s*[\`"']?)(${escapedCol})([\`"']?\\s+[A-Za-z])`,
      'i'
    );
    let updatedBody = body.replace(colDefRegex, `$1${newColName}$3`);

    if (newColName) {
      const pkFkColRegex = new RegExp(
        `(\\b(?:PRIMARY\\s+KEY|FOREIGN\\s+KEY|UNIQUE)\\s*\\([^)]*\\b[\`"']?)(${escapedCol})([\`"']?\\b)`,
        'gi'
      );
      updatedBody = updatedBody.replace(pkFkColRegex, `$1${newColName}$3`);
    }

    return `${prefix}${updatedBody}${suffix}`;
  });
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

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedTable = escapeRegExp(tableName);
  const escapedCol = escapeRegExp(colName);

  const tableBlockRegex = new RegExp(
    `(\\bCREATE\\s+TABLE(?:\\s+IF\\s+NOT\\s+EXISTS)?\\s+[\`"']?${escapedTable}[\`"']?\\s*\\()([\\s\\S]*?)(\\);?)`,
    'i'
  );

  return sql.replace(tableBlockRegex, (match, prefix, body, suffix) => {
    if (!oldType) {
      const emptyTypeRegex = new RegExp(
        `(^|[\\n,;]\\s*[\`"']?${escapedCol}[\`"']?\\s+)`,
        'i'
      );
      const updatedBody = body.replace(emptyTypeRegex, `$1${newType}`);
      return `${prefix}${updatedBody}${suffix}`;
    }

    const escapedOldType = escapeRegExp(oldType);
    const exactTypeRegex = new RegExp(
      `(^|[\\n,;]\\s*[\`"']?${escapedCol}[\`"']?\\s+)(${escapedOldType})`,
      'i'
    );

    if (exactTypeRegex.test(body)) {
      const updatedBody = body.replace(exactTypeRegex, `$1${newType}`);
      return `${prefix}${updatedBody}${suffix}`;
    }

    const fallbackTypeRegex = new RegExp(
      `(^|[\\n,;]\\s*[\`"']?${escapedCol}[\`"']?\\s+)([A-Za-z0-9_]+(?:\\s*\\([^)]*\\))?)`,
      'i'
    );
    const updatedBody = body.replace(fallbackTypeRegex, `$1${newType}`);
    return `${prefix}${updatedBody}${suffix}`;
  });
}

