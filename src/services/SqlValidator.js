/**
 * src/services/SqlValidator.js
 * - Tratamento de Vírgula Trailing + FK Validation
 * - Detecta vírgula antes de ')' (trailing comma)
 * - Valida Foreign Keys (tabela referenciada existe?)
 *  */

export class SqlValidator {
    static RESERVED_WORDS = new Set([
        'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'TABLE',
        'PRIMARY', 'FOREIGN', 'KEY', 'REFERENCES', 'CONSTRAINT', 'UNIQUE', 'NOT',
        'NULL', 'DEFAULT', 'CHECK', 'INDEX', 'ALTER', 'DROP', 'ADD', 'COLUMN', 'ORDER', 'GROUP', 'BY'
    ]);

    static VALID_TYPES = new Set([
        'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT',
        'VARCHAR', 'CHAR', 'TEXT', 'LONGTEXT', 'MEDIUMTEXT',
        'DATE', 'DATETIME', 'TIMESTAMP', 'TIME',
        'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE', 'REAL',
        'BOOLEAN', 'BOOL', 'BIT',
        'SERIAL', 'JSON', 'JSONB', 'UUID', 'MONEY', 'BLOB'
    ]);

    static removeComments(sql) {
        let result = sql;
        
        // Remove comentários de linha (--) primeiro
        result = result.replace(/--.*$/gm, '');
        
        // Remove comentários de bloco (/* ... */) completos
        result = result.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // Detecta comentário de bloco não fechado (/* sem */)
        const unclosedCommentIndex = result.indexOf('/*');
        if (unclosedCommentIndex !== -1) {
            // Se encontrar /* sem fechar, remove tudo a partir dali
            result = result.substring(0, unclosedCommentIndex);
        }
        
        return result;
    }

    static validate(sql) {
        const uniqueErrors = new Map();
        const errors = [];
        const warnings = [];
        const tables = {};

        const declaredTableNames = new Set();
        let lastLineSearched = 0;

        const addIssue = (line, message, type = 'error') => {
            const key = `${line}-${message.trim()}`;
            if (!uniqueErrors.has(key)) {
                const issue = { line, message, type };
                uniqueErrors.set(key, issue);
                (type === 'error' ? errors : warnings).push(issue);
            }
        };

        if (!sql || !sql.trim()) return { isValid: true, tables: {}, errors: [], warnings: [] };

        const lines = sql.split('\n');

        // Remove comentários de forma robusta
        const sqlWithoutComments = this.removeComments(sql).trim();

        // Se após remover comentários não sobrou nada, retorna vazio (não é erro)
        if (!sqlWithoutComments) {
            return { isValid: true, tables: {}, errors: [], warnings: [] };
        }

        const cleanSqlForCheck = sql.replace(/--.*$/gm, '');
        const missingSemicolonRegex = /\)\s*[\r\n]+\s*CREATE/gi;
        let match;
        let semicolonErrors = [];

        while ((match = missingSemicolonRegex.exec(cleanSqlForCheck)) !== null) {
            const textUntilError = cleanSqlForCheck.substring(0, match.index);
            const lineNumber = textUntilError.split('\n').length;
            semicolonErrors.push({ line: lineNumber, message: "Faltou ponto e vírgula ';' após a tabela anterior." });
        }

        const statements = this.extractCreateStatements(sql);
        
        // Se não encontrou nenhum CREATE TABLE, retorna vazio (tudo está comentado)
        if (statements.length === 0) {
            return { isValid: true, tables: {}, errors: [], warnings: [] };
        }

        let hasInternalErrors = false;

        statements.forEach(stmt => {
            const cleanStmt = stmt.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
            const headerMatch = cleanStmt.match(/^\s*CREATE\s+TABLE\s+([a-zA-Z0-9_]+)/i);

            let currentTableLine = 1;
            let tableName = null;

            if (headerMatch) {
                tableName = headerMatch[1];
                currentTableLine = this.findLineNumber(`CREATE TABLE ${tableName}`, lines, lastLineSearched);
                lastLineSearched = currentTableLine;

                if (declaredTableNames.has(tableName)) {
                    addIssue(currentTableLine, `A tabela '${tableName}' já foi declarada anteriormente.`, 'error');
                    hasInternalErrors = true;
                    return;
                }
                declaredTableNames.add(tableName);
            }

            const result = this.validateCreateTable(stmt, lines, tables, currentTableLine);

            result.errors.forEach(e => {
                addIssue(e.line, e.message, 'error');
                hasInternalErrors = true;
            });
            result.warnings.forEach(w => addIssue(w.line, w.message, 'warning'));

            if (result.table && result.errors.length === 0) {
                tables[result.table.name] = result.table;
            }
        });

        if (!hasInternalErrors) {
            semicolonErrors.forEach(e => addIssue(e.line, e.message, 'error'));
        }

        return { isValid: errors.length === 0, tables, errors, warnings };
    }

    static validateCreateTable(stmt, lines, existingTables, startLine) {
        const localErrors = [];
        const localWarnings = [];
        let table = null;

        const cleanStmt = stmt.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
        const headerMatch = cleanStmt.match(/^\s*CREATE\s+TABLE\s+([a-zA-Z0-9_]+)/i);

        if (!headerMatch) return { errors: [], warnings: [], table: null };
        const tableName = headerMatch[1];

        const bodyStart = cleanStmt.indexOf('(');

        if (bodyStart === -1) {
            if (cleanStmt.length > `CREATE TABLE ${tableName}`.length + 2) {
                localErrors.push({
                    line: startLine,
                    message: `Esperado '(' para iniciar as colunas da tabela '${tableName}'.`,
                    type: 'error'
                });
            }
            return { errors: localErrors, warnings: [], table: null };
        }

        const contentAfterOpen = cleanStmt.substring(bodyStart + 1).trim();
        if (contentAfterOpen.length === 0) {
            localWarnings.push({
                line: startLine,
                message: `Adicione a primeira coluna (ex: id INT) na tabela '${tableName}'.`,
                type: 'warning'
            });
            return { errors: [], warnings: localWarnings, table: null };
        }

        const bodyEnd = cleanStmt.lastIndexOf(')');
        if (bodyEnd === -1 || bodyEnd < bodyStart) {
            localErrors.push({
                line: startLine,
                message: `Faltou fechar parênteses ')' no final da tabela '${tableName}'.`,
                type: 'error'
            });
            const bodyPartial = cleanStmt.substring(bodyStart + 1);
            const resultPartial = this.parseTableBody(bodyPartial, tableName, startLine, lines, existingTables);
            if (resultPartial.columns.length > 0) {
                table = { name: tableName, columns: resultPartial.columns };
            }
            return { errors: [...localErrors, ...resultPartial.errors], warnings: [], table };
        }

        const body = cleanStmt.substring(bodyStart + 1, bodyEnd);

        const textBeforeClosing = body.trimEnd();
        if (textBeforeClosing.endsWith(',')) {
            const lastCommaIndex = body.lastIndexOf(',');
            const textUntilComma = body.substring(0, lastCommaIndex);
            const lineWithComma = startLine + textUntilComma.split('\n').length;

            localErrors.push({
                line: lineWithComma,
                message: `Remova a vírgula após a última coluna (antes de ')').`,
                type: 'error'
            });
        }

        const result = this.parseTableBody(body, tableName, startLine, lines, existingTables);

        if (result.errors.length === 0 && localErrors.length === 0) {
            table = { name: tableName, columns: result.columns };
        }

        return { errors: [...localErrors, ...result.errors], warnings: [...localWarnings, ...result.warnings], table };
    }

    static parseTableBody(bodyContent, tableName, tableStartLine, allLines, existingTables) {
        const errors = [];
        const warnings = [];
        const columns = [];
        const columnNames = new Set();

        const firstPassRegex = /([a-zA-Z0-9_]+)\s+(INT|INTEGER|VARCHAR|TEXT|DATE|TIMESTAMP|BOOLEAN|FLOAT|DOUBLE|DECIMAL|CHAR|SERIAL|BIGINT|JSON|UUID|MONEY|TIME|BLOB|TINYINT|SMALLINT|LONGTEXT|MEDIUMTEXT|NUMERIC|REAL|BOOL|BIT|DATETIME|JSONB)/gi;
        let firstMatch;
        const declaredColumns = new Set();

        while ((firstMatch = firstPassRegex.exec(bodyContent)) !== null) {
            declaredColumns.add(firstMatch[1]);
        }

        const fkRegex = /FOREIGN\s+KEY\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*REFERENCES\s+([a-zA-Z0-9_]+)\s*\(\s*([a-zA-Z0-9_]+)\s*\)/gi;
        let fkMatch;
        while ((fkMatch = fkRegex.exec(bodyContent)) !== null) {
            const localColumn = fkMatch[1];     
            const referencedTable = fkMatch[2]; 
            const referencedColumn = fkMatch[3];

            const textUntilFK = bodyContent.substring(0, fkMatch.index);
            const fkLine = tableStartLine + textUntilFK.split('\n').length - 1;

            if (!declaredColumns.has(localColumn)) {
                errors.push({
                    line: fkLine,
                    message: `A coluna '${localColumn}' não foi encontrada nesta tabela. Declare-a antes de usar na FOREIGN KEY.`,
                    type: 'error'
                });
            }

            if (!existingTables[referencedTable]) {
                errors.push({
                    line: fkLine,
                    message: `A tabela referenciada '${referencedTable}' não foi encontrada. `,
                    type: 'error'
                });
            } else {
                const targetTableColumns = existingTables[referencedTable].columns.map(c => c.name);
                if (!targetTableColumns.includes(referencedColumn)) {
                    errors.push({
                        line: fkLine,
                        message: `A coluna '${referencedColumn}' não foi encontrada na tabela '${referencedTable}'.`,
                        type: 'error'
                    });
                }
            }
        }
        const pkRegex = /PRIMARY\s+KEY\s*\(\s*([a-zA-Z0-9_]+)\s*\)/gi;
        let pkMatch;
        while ((pkMatch = pkRegex.exec(bodyContent)) !== null) {
            const pkColumn = pkMatch[1];
            const textUntilPK = bodyContent.substring(0, pkMatch.index);
            const pkLine = tableStartLine + textUntilPK.split('\n').length - 1;

            if (!declaredColumns.has(pkColumn)) {
                errors.push({
                    line: pkLine,
                    message: `A coluna '${pkColumn}' não foi encontrada nesta tabela. Declare-a antes de usar na PRIMARY KEY.`,
                    type: 'error'
                });
            }
        }

        const inlineFkRegex = /([a-zA-Z0-9_]+)\s+(?:INT|INTEGER|VARCHAR|TEXT|BIGINT|SMALLINT)\s+REFERENCES\s+([a-zA-Z0-9_]+)\s*\(\s*([a-zA-Z0-9_]+)\s*\)/gi;
        let inlineFkMatch;
        while ((inlineFkMatch = inlineFkRegex.exec(bodyContent)) !== null) {
            const localColumn = inlineFkMatch[1];       // Ex: cliente_id
            const referencedTable = inlineFkMatch[2];   // Ex: cliente
            const referencedColumn = inlineFkMatch[3];  // Ex: iddas (errado)

            const textUntilFK = bodyContent.substring(0, inlineFkMatch.index);
            const fkLine = tableStartLine + textUntilFK.split('\n').length - 1;

            if (!existingTables[referencedTable]) {
                errors.push({
                    line: fkLine,
                    message: `A tabela referenciada '${referencedTable}' não foi encontrada. `,
                    type: 'error'
                });
            } else {
                const targetTableColumns = existingTables[referencedTable].columns.map(c => c.name);
                if (!targetTableColumns.includes(referencedColumn)) {
                    errors.push({
                        line: fkLine,
                        message: `A coluna '${referencedColumn}' não foi encontrada na tabela '${referencedTable}'.`,
                        type: 'error'
                    });
                }
            }
        }

        const itemRegex = /(CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK|INDEX)|([a-zA-Z0-9_]+)\s+(INT|INTEGER|VARCHAR|TEXT|DATE|TIMESTAMP|BOOLEAN|FLOAT|DOUBLE|DECIMAL|CHAR|SERIAL|BIGINT|JSON|UUID|MONEY|TIME|BLOB|TINYINT|SMALLINT|LONGTEXT|MEDIUMTEXT|NUMERIC|REAL|BOOL|BIT|DATETIME|JSONB)/gi;

        let match;
        let lastEndIndex = 0;
        let isFirstItem = true;

        while ((match = itemRegex.exec(bodyContent)) !== null) {
            const fullMatch = match[0];
            const startIndex = match.index;

            const isConstraint = !!match[1];
            const colName = match[2];
            const colType = match[3];

            if (!isFirstItem) {
                const textBetween = bodyContent.substring(lastEndIndex, startIndex);
                const hasComma = textBetween.includes(',');
                const hasNewLine = textBetween.includes('\n');

                if (!hasComma) {
                    if (isConstraint && !hasNewLine) {
                        lastEndIndex = startIndex + fullMatch.length;
                        continue;
                    }

                    const textUntilItem = bodyContent.substring(0, startIndex);
                    const relativeLine = textUntilItem.split('\n').length - 1;
                    const errorLine = tableStartLine + relativeLine;
                    const nextItemName = isConstraint ? fullMatch.split(' ')[0] : colName;

                    errors.push({
                        line: errorLine,
                        message: `Faltou uma vírgula antes de '${nextItemName}'.`,
                        type: 'error'
                    });
                }
            }

            const itemTextUntilNow = bodyContent.substring(0, startIndex);
            const currentLine = tableStartLine + itemTextUntilNow.split('\n').length - 1;

            if (!isConstraint) {
                if (this.RESERVED_WORDS.has(colName.toUpperCase())) {
                    errors.push({
                        line: currentLine,
                        message: `'${colName}' é palavra reservada.`,
                        type: 'error'
                    });
                }

                if (columnNames.has(colName)) {
                    errors.push({
                        line: currentLine,
                        message: `Coluna duplicada: '${colName}'.`,
                        type: 'error'
                    });
                } else {
                    columnNames.add(colName);
                    columns.push({
                        name: colName,
                        type: colType,
                        isPk: /PRIMARY\s+KEY/i.test(bodyContent.substring(startIndex, startIndex + fullMatch.length + 20)),
                        isFk: /REFERENCES\s+[a-zA-Z0-9_]+/i.test(bodyContent.substring(startIndex, startIndex + fullMatch.length + 50))
                    });
                }
            }

            lastEndIndex = startIndex + fullMatch.length;
            isFirstItem = false;
        }

        return { errors, warnings, columns };
    }

    static findClosestType(invalidType) {
        if (!invalidType || invalidType.length < 3) return null;

        for (const type of this.VALID_TYPES) {
            if (type.startsWith(invalidType) || invalidType.startsWith(type)) {
                return type;
            }
        }
        return null;
    }

    static extractCreateStatements(sql) {
        // Remove comentários usando o método robusto
        const cleanSql = this.removeComments(sql);
        
        const statements = [];
        let depth = 0;
        let current = '';
        let inString = false;
        let stringChar = '';

        for (let i = 0; i < cleanSql.length; i++) {
            const char = cleanSql[i];
            const prev = cleanSql[i - 1];
            if ((char === "'" || char === '"') && prev !== '\\') {
                if (!inString) { inString = true; stringChar = char; }
                else if (char === stringChar) { inString = false; }
            }
            if (!inString) {
                if (char === '(') depth++;
                if (char === ')') depth--;
            }
            current += char;
            if (depth === 0 && char === ';') {
                const trimmed = current.trim();
                if (trimmed.toUpperCase().startsWith('CREATE')) statements.push(trimmed);
                current = '';
            }
        }
        if (current.trim() && current.trim().toUpperCase().startsWith('CREATE')) {
            statements.push(current.trim());
        }
        return statements;
    }

    static findLineNumber(snippet, lines, startOffset = 0) {
        const search = snippet.trim();
        if (!search) return startOffset + 1;
        for (let i = startOffset; i < lines.length; i++) {
            if (lines[i].includes(search)) return i + 1;
        }
        return startOffset + 1;
    }
}