/**
 * src/services/SqlValidator.js
 * Versão Estável 1.0
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
    // 1. Proteção de Performance (SQL Gigante)
    if (sql.length > 50000) {
      return {
        isValid: false,
        errors: [{ line: 1, message: 'SQL muito grande (limite 50k caracteres)', type: 'error' }],
        warnings: []
      };
    }

    const errors = [];
    const warnings = [];
    const tables = {};

    if (!sql || !sql.trim()) {
      return { isValid: true, tables: {}, errors: [], warnings: [] };
    }

    const lines = sql.split('\n');
    const statements = this.extractCreateStatements(sql);

    // Processa cada CREATE TABLE encontrado
    statements.forEach(stmt => {
      const result = this.validateCreateTable(stmt, lines);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
      
      // Se achou uma tabela válida (mesmo com warnings), registra ela
      if (result.table) {
        tables[result.table.name] = result.table;
      }
    });

    // Validação de FKs (Só roda se não tiver erros graves de sintaxe)
    if (errors.length === 0) {
      const fkErrors = this.validateForeignKeys(tables);
      errors.push(...fkErrors);
    }

    return {
      isValid: errors.length === 0,
      tables,
      errors,
      warnings
    };
  }

  // --- MÉTODOS AUXILIARES DE PARSING ---

  static extractCreateStatements(sql) {
    const statements = [];
    let depth = 0;
    let current = '';
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      const prev = sql[i - 1];

      // Lógica de String
      if ((char === "'" || char === '"') && prev !== '\\') {
        if (!inString) { inString = true; stringChar = char; }
        else if (char === stringChar) { inString = false; }
      }

      // Lógica de Parênteses
      if (!inString) {
        if (char === '(') depth++;
        if (char === ')') depth--;
      }

      current += char;

      // Fim do comando (;)
      if (depth === 0 && char === ';') {
        const trimmed = current.trim();
        if (trimmed.toUpperCase().startsWith('CREATE')) {
          statements.push(trimmed);
        }
        current = '';
      }
    }

    // Pega o último comando mesmo sem ;
    if (current.trim() && current.trim().toUpperCase().startsWith('CREATE')) {
      statements.push(current.trim());
    }

    return statements;
  }

  static validateCreateTable(stmt, lines) {
    const errors = [];
    const warnings = [];
    let table = null;

    // Limpa comentários para análise
    const cleanStmt = stmt.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Tenta achar a linha onde começa essa tabela
    const lineNumber = this.findLineNumber(cleanStmt, lines);

    // 1. Valida Cabeçalho: CREATE TABLE nome (
    const headerMatch = cleanStmt.match(/^\s*CREATE\s+TABLE\s+(\w+)\s*\(/i);

    if (!headerMatch) {
      errors.push({ 
        line: lineNumber, 
        message: 'Sintaxe inválida. Esperado: CREATE TABLE nome ( ... );', 
        type: 'error' 
      });
      return { errors, warnings, table: null };
    }

    const tableName = headerMatch[1];

    // 2. Valida Parênteses Balanceados
    const openCount = (cleanStmt.match(/\(/g) || []).length;
    const closeCount = (cleanStmt.match(/\)/g) || []).length;
    if (openCount !== closeCount) {
      errors.push({ 
        line: lineNumber, 
        message: `Parênteses desbalanceados. Abertos: ${openCount}, Fechados: ${closeCount}`, 
        type: 'error' 
      });
      return { errors, warnings, table: null };
    }

    // 3. Extrai o miolo da tabela
    const bodyStart = cleanStmt.indexOf('(');
    const bodyEnd = cleanStmt.lastIndexOf(')');
    const body = cleanStmt.substring(bodyStart + 1, bodyEnd);

    // 4. Analisa as colunas/constraints
    const result = this.parseTableBody(body, tableName, lineNumber, lines);
    
    errors.push(...result.errors);
    warnings.push(...result.warnings);

    if (errors.length === 0) {
      table = { name: tableName, columns: result.columns };
    }

    return { errors, warnings, table };
  }

  static parseTableBody(body, tableName, startLine, lines) {
    const errors = [];
    const warnings = [];
    const columns = [];
    
    // Divide por vírgula respeitando parênteses internos (ex: DECIMAL(10,2))
    const items = this.splitByComma(body);

    items.forEach(item => {
      const trimmed = item.trim();
      if (!trimmed) return;

      // Verifica se é Constraint de Tabela (PK, FK, UNIQUE no fim)
      if (/^\s*(PRIMARY\s+KEY|FOREIGN\s+KEY|CONSTRAINT|UNIQUE|CHECK)/i.test(trimmed)) {
        // Por enquanto ignoramos validação profunda de constraints de tabela 
        // para focar na estabilidade das colunas.
        return; 
      }

      // É uma Coluna
      const colResult = this.parseColumn(trimmed, startLine);
      if (colResult.error) {
        errors.push(colResult.error);
      } else if (colResult.column) {
        columns.push(colResult.column);
      }
    });

    return { errors, warnings, columns };
  }

  static parseColumn(def, defaultLine) {
    // Divide por espaço para pegar "nome" e "tipo"
    const parts = def.trim().split(/\s+/);

    // 🔥 PROTEÇÃO CONTRA CRASH: Se não tiver pelo menos 2 partes (nome e tipo), é erro.
    if (parts.length < 2) {
      return { 
        error: { 
          line: defaultLine, 
          message: `Coluna incompleta: "${def}". Esperado: nome tipo`, 
          type: 'error' 
        } 
      };
    }

    const name = parts[0];
    const typeRaw = parts[1]; // Pega o tipo cru (ex: VARCHAR(50))

    // Validação básica de tipo
    const baseType = typeRaw.split('(')[0].toUpperCase();
    
    if (!this.VALID_TYPES.has(baseType)) {
      return {
        error: {
          line: defaultLine,
          message: `Tipo de dado inválido: "${baseType}"`,
          type: 'error'
        }
      };
    }

    return {
      column: {
        name: name,
        type: typeRaw,
        isPk: /PRIMARY\s+KEY/i.test(def),
        isFk: false // FK será resolvida depois
      }
    };
  }

  static validateForeignKeys(tables) {
    // Implementaremos na próxima etapa para garantir que o básico funcione primeiro
    return []; 
  }

  // Utilitários
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

  static findLineNumber(text, lines) {
    const snippet = text.substring(0, 20).trim();
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(snippet)) return i + 1;
    }
    return 1;
  }
}