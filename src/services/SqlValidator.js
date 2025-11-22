/**
 * src/services/SqlValidator.js
 * Versão 2.0 - Backend Inteligente
 * - Detecção de Ponto e Vírgula faltando
 * - Prevenção de Duplicatas
 * - Validação de Tipos Robusta
 */

export class SqlValidator {
  static RESERVED_WORDS = new Set([
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'TABLE',
    'PRIMARY', 'FOREIGN', 'KEY', 'REFERENCES', 'CONSTRAINT', 'UNIQUE', 'NOT',
    'NULL', 'DEFAULT', 'CHECK', 'INDEX', 'ALTER', 'DROP', 'ADD', 'COLUMN'
  ]);

  static VALID_TYPES = new Set([
    'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT',
    'VARCHAR', 'CHAR', 'TEXT', 'LONGTEXT', 'MEDIUMTEXT',
    'DATE', 'DATETIME', 'TIMESTAMP', 'TIME',
    'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE', 'REAL',
    'BOOLEAN', 'BOOL', 'BIT',
    'SERIAL', 'JSON', 'JSONB', 'UUID', 'MONEY', 'BLOB'
  ]);

  /**
   * Método Principal
   */
  static validate(sql) {
    // 0. Inicialização Limpa
    const uniqueErrors = new Set(); // Chave única para evitar duplicatas
    const errors = [];
    const warnings = [];
    const tables = {};

    // Helper para adicionar erro sem duplicar
    const addError = (line, message, type = 'error') => {
      const key = `${line}-${message}`;
      if (!uniqueErrors.has(key)) {
        uniqueErrors.add(key);
        // Empurra para o array real
        (type === 'error' ? errors : warnings).push({ line, message, type });
      }
    };

    if (!sql || !sql.trim()) {
      return { isValid: true, tables: {}, errors: [], warnings: [] };
    }

    // 1. Proteção de Performance
    if (sql.length > 50000) {
      return {
        isValid: false,
        errors: [{ line: 1, message: 'SQL muito grande (limite 50k caracteres)', type: 'error' }],
        warnings: []
      };
    }

    const lines = sql.split('\n');

    // 2. 🔥 NOVO: Validação Rigorosa de Ponto e Vírgula (Antes de processar)
    // Regex: Procura um ")" seguido de quebra de linha/espaço e IMEDIATAMENTE um "CREATE"
    // Isso significa que o usuário fechou a tabela mas esqueceu o ";" antes da próxima.
    const cleanSqlForCheck = sql.replace(/--.*$/gm, ''); // Remove comentários
    const missingSemicolonRegex = /\)\s*[\r\n]+\s*CREATE/gi;
    let match;
    
    while ((match = missingSemicolonRegex.exec(cleanSqlForCheck)) !== null) {
      // Calcula a linha exata onde ocorreu o erro
      const textUntilError = cleanSqlForCheck.substring(0, match.index);
      const lineNumber = textUntilError.split('\n').length;
      
      addError(lineNumber, "Faltou ponto e vírgula ';' após fechar a tabela anterior.");
    }

    // Se faltou ponto e vírgula entre tabelas, paramos aqui. 
    // Tentar processar o resto causaria erros de sintaxe confusos.
    if (errors.length > 0) {
      return { isValid: false, tables: {}, errors, warnings };
    }

    // 3. Extração e Validação das Tabelas
    const statements = this.extractCreateStatements(sql);

    statements.forEach(stmt => {
      const result = this.validateCreateTable(stmt, lines);
      
      // Mescla os resultados usando nosso helper anti-duplicata
      result.errors.forEach(e => addError(e.line, e.message, 'error'));
      result.warnings.forEach(w => addError(w.line, w.message, 'warning'));
      
      if (result.table) {
        tables[result.table.name] = result.table;
      }
    });

    // 4. Validação Cruzada (FKs) - Só roda se a sintaxe base estiver OK
    if (errors.length === 0) {
      // Futuro: validateForeignKeys(tables)
    }

    return {
      isValid: errors.length === 0,
      tables,
      errors, // Array limpo e sem duplicatas
      warnings
    };
  }

  // --- MÉTODOS DE PARSING ---

  static extractCreateStatements(sql) {
    const statements = [];
    let depth = 0;
    let current = '';
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      const prev = sql[i - 1];

      // Ignora strings
      if ((char === "'" || char === '"') && prev !== '\\') {
        if (!inString) { inString = true; stringChar = char; }
        else if (char === stringChar) { inString = false; }
      }

      // Conta parênteses (para não cortar no ; de dentro de um CHECK ou string)
      if (!inString) {
        if (char === '(') depth++;
        if (char === ')') depth--;
      }

      current += char;

      // Corta no Ponto e Vírgula (se não estiver dentro de parênteses)
      if (depth === 0 && char === ';') {
        const trimmed = current.trim();
        if (trimmed.toUpperCase().startsWith('CREATE')) {
          statements.push(trimmed);
        }
        current = '';
      }
    }

    // Pega o último comando (que pode não ter ;)
    if (current.trim() && current.trim().toUpperCase().startsWith('CREATE')) {
      statements.push(current.trim());
    }

    return statements;
  }

  static validateCreateTable(stmt, lines) {
    const localErrors = [];
    let table = null;

    // Remove comentários para limpar a string
    const cleanStmt = stmt.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Acha a linha real no arquivo original
    const lineNumber = this.findLineNumber(stmt, lines);

    // Valida Header
    const headerMatch = cleanStmt.match(/^\s*CREATE\s+TABLE\s+(\w+)\s*\(/i);
    if (!headerMatch) {
      // Se não achou CREATE TABLE, ignora (pode ser lixo no fim do arquivo)
      return { errors: [], warnings: [], table: null };
    }

    const tableName = headerMatch[1];

    // Valida Parênteses
    const openCount = (cleanStmt.match(/\(/g) || []).length;
    const closeCount = (cleanStmt.match(/\)/g) || []).length;
    if (openCount !== closeCount) {
      localErrors.push({ 
        line: lineNumber, 
        message: `Parênteses desbalanceados na tabela '${tableName}'.`, 
        type: 'error' 
      });
      return { errors: localErrors, warnings: [], table: null };
    }

    // Extrai o corpo
    const bodyStart = cleanStmt.indexOf('(');
    const bodyEnd = cleanStmt.lastIndexOf(')');
    const body = cleanStmt.substring(bodyStart + 1, bodyEnd);

    // Valida colunas
    const result = this.parseTableBody(body, tableName, lineNumber, lines);

    if (result.errors.length === 0 && localErrors.length === 0) {
      table = { name: tableName, columns: result.columns };
    }

    return { 
      errors: [...localErrors, ...result.errors], 
      warnings: result.warnings, 
      table 
    };
  }

  static parseTableBody(body, tableName, startLine, lines) {
    const errors = [];
    const warnings = [];
    const columns = [];
    
    const items = this.splitByComma(body);

    items.forEach(item => {
      const trimmed = item.trim();
      if (!trimmed) return;

      // Ignora constraints de tabela por enquanto
      if (/^\s*(PRIMARY\s+KEY|FOREIGN\s+KEY|CONSTRAINT|UNIQUE|CHECK)/i.test(trimmed)) {
        return; 
      }

      // Acha a linha específica desta coluna (procura o texto dentro do arquivo)
      // Isso é "inteligente": em vez de usar a linha da tabela, achamos a linha da coluna
      const columnLine = this.findLineNumber(trimmed.split(' ')[0], lines, startLine);

      const colResult = this.parseColumn(trimmed, columnLine || startLine);
      
      if (colResult.error) {
        errors.push(colResult.error);
      } else if (colResult.column) {
        columns.push(colResult.column);
      }
    });

    return { errors, warnings, columns };
  }

  static parseColumn(def, line) {
    const parts = def.trim().split(/\s+/);

    if (parts.length < 2) {
      return { 
        error: { 
          line: line, 
          message: `Definição incompleta. Esperado: nome_coluna tipo_dado`, 
          type: 'error' 
        } 
      };
    }

    const name = parts[0];
    const typeRaw = parts[1];
    
    // Remove parenteses do tipo para validar (ex: VARCHAR(50) -> VARCHAR)
    const baseType = typeRaw.split('(')[0].toUpperCase();

    // Validação de Tipo Inteligente
    if (!this.VALID_TYPES.has(baseType)) {
      // Verifica se o usuário não digitou uma palavra reservada sem querer
      if (this.RESERVED_WORDS.has(baseType)) {
        return {
          error: {
            line: line,
            message: `"${baseType}" é uma palavra reservada, não um tipo.`,
            type: 'error'
          }
        };
      }

      return {
        error: {
          line: line,
          message: `Tipo inválido: "${baseType}". Use INT, VARCHAR, DATE, etc.`,
          type: 'error'
        }
      };
    }

    return {
      column: {
        name: name,
        type: typeRaw,
        isPk: /PRIMARY\s+KEY/i.test(def),
        isFk: false
      }
    };
  }

  // --- UTILITÁRIOS ---

  static splitByComma(str) {
    const result = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === '(') depth++;
      if (char === ')') depth--;
      if (char === ',' && depth === 0) {
        result.push(current);
        current = '';
        continue;
      }
      current += char;
    }
    if (current.trim()) result.push(current);
    return result;
  }

  // Busca a linha onde um texto aparece, começando de uma linha offset
  static findLineNumber(snippet, lines, startOffset = 0) {
    const search = snippet.substring(0, 20).trim(); // Pega só o começo para buscar
    if (!search) return startOffset;

    for (let i = startOffset; i < lines.length; i++) {
      if (lines[i].includes(search)) return i + 1;
    }
    return startOffset || 1;
  }
}