import { registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WORKSPACE = resolve(__dirname, '..');

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      const parentPath = context.parentURL ? dirname(fileURLToPath(context.parentURL)) : WORKSPACE;
      const candidateTs = resolve(parentPath, specifier + '.ts');
      if (existsSync(candidateTs)) {
        return nextResolve(pathToFileURL(candidateTs).href, context);
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith('domain/sql/parser.ts')) {
      let source = readFileSync(fileURLToPath(url), 'utf8');
      source = source.replace(
        "import { Parser } from 'node-sql-parser';",
        "import pkg from 'node-sql-parser'; const { Parser } = pkg;"
      );
      return nextLoad(url, { ...context, source });
    }
    return nextLoad(url, context);
  }
});

const { parseSqlSchema } = await import(pathToFileURL(resolve(WORKSPACE, 'domain/sql/parser.ts')).href);
const { mapSqlErrorsToTables, extractTableLineRanges, getColumnAtLine, getTableAtLine } = await import(pathToFileURL(resolve(WORKSPACE, 'domain/sql/sqlLineMapper.ts')).href);
const { replaceTableNameInSql, replaceColumnNameInSql, replaceColumnTypeInSql } = await import(pathToFileURL(resolve(WORKSPACE, 'domain/sql/schemaModifier.ts')).href);

// ============================================================================
// MOTOR DE SIMULAÇÃO TRIDIRECIONAL (SQL <-> CANVAS <-> PAINEL DE MODELAGEM)
// ============================================================================

class TridirectionalSimulator {
  constructor(initialSql, dialect = 'MySQL') {
    this.dialect = dialect;
    this.sqlCode = '';
    this.schema = { tables: {}, relationships: [] };
    this.errors = [];
    this.tableErrors = {};
    this.draftTableNames = {};
    this.draftColumnNames = {};
    this.draftColumnTypes = {};

    // Estado local do Canvas (DiagramTableNode.vue)
    this.canvasState = {
      editingTable: null,
      localTableInput: {},
      editingColKey: null, // `${tableName}_${colIndex}`
      editingColValues: {},
    };

    // Estado local da Sidebar (ModelingSidebarPanel.vue)
    this.sidebarState = {
      activeInputKey: null,
      localTableNames: {},
      activeColKey: null,
      localColValues: {},
    };

    this.setSql(initialSql);
  }

  setSql(sql, preserveInlineDrafts = false) {
    this.sqlCode = sql;
    if (!preserveInlineDrafts) {
      this.draftTableNames = {};
      this.draftColumnNames = {};
      this.draftColumnTypes = {};
    }
    if (!sql || !sql.trim()) {
      this.schema = { tables: {}, relationships: [] };
      this.errors = [];
      this.draftTableNames = {};
      this.draftColumnNames = {};
      this.draftColumnTypes = {};
      this.tableErrors = {};
      return;
    }

    try {
      const newSchema = parseSqlSchema(sql, this.dialect);
      this.schema = newSchema;
      this.errors = [];
      this.tableErrors = {};
      this.draftTableNames = {};
      this.draftColumnNames = {};
      this.draftColumnTypes = {};

      // Sincroniza watches do Canvas e Sidebar quando schema muda
      for (const tName in newSchema.tables) {
        const table = newSchema.tables[tName];
        if (this.canvasState.editingTable !== tName) {
          this.canvasState.localTableInput[tName] = table.name;
        }
        const tKey = table.id || table.name;
        if (this.sidebarState.activeInputKey !== tKey) {
          this.sidebarState.localTableNames[tKey] = table.name;
        }
      }
    } catch (e) {
      const errorLine = e.line || e.location?.start?.line || 1;
      const errorOffset = e.location?.start?.offset;
      const errorMessage = e.message || 'Erro de sintaxe no SQL';
      this.errors = [{ line: errorLine, message: errorMessage, type: 'error' }];

      const mapped = mapSqlErrorsToTables(
        sql,
        errorLine,
        errorMessage,
        this.schema.tables,
        errorOffset
      );
      this.tableErrors = mapped.tableErrors;
      this.draftTableNames = { ...mapped.draftNames, ...this.draftTableNames };
      this.draftColumnNames = { ...(mapped.draftColumnNames || {}), ...this.draftColumnNames };
      this.draftColumnTypes = { ...(mapped.draftColumnTypes || {}), ...this.draftColumnTypes };

      for (const tName in this.schema.tables) {
        if (this.canvasState.editingTable !== tName) {
          this.canvasState.localTableInput[tName] =
            tName in this.draftTableNames ? this.draftTableNames[tName] : tName;
        }
      }
    }
  }

  // ---- LEITURA DE VALORES VISÍVEIS NO CANVAS ----
  getCanvasTableName(schemaTableName) {
    const table = this.schema.tables[schemaTableName];
    if (!table) return null;
    if (this.canvasState.editingTable === schemaTableName) {
      return this.canvasState.localTableInput[schemaTableName];
    }
    if (schemaTableName in this.draftTableNames) {
      return this.draftTableNames[schemaTableName];
    }
    return table.name;
  }

  getCanvasColName(schemaTableName, colIndex) {
    const table = this.schema.tables[schemaTableName];
    const col = table?.columns[colIndex];
    if (!col) return null;
    const editKey = `${schemaTableName}_${colIndex}`;
    if (this.canvasState.editingColKey === editKey && this.canvasState.editingColValues[editKey]) {
      return this.canvasState.editingColValues[editKey].name;
    }
    const draftKey = `${table.name}.${col.name}`;
    if (draftKey in this.draftColumnNames) {
      return this.draftColumnNames[draftKey];
    }
    return col.name;
  }

  getCanvasColType(schemaTableName, colIndex) {
    const table = this.schema.tables[schemaTableName];
    const col = table?.columns[colIndex];
    if (!col) return null;
    const editKey = `${schemaTableName}_${colIndex}`;
    if (this.canvasState.editingColKey === editKey && this.canvasState.editingColValues[editKey]) {
      return this.canvasState.editingColValues[editKey].type;
    }
    const draftKey = `${table.name}.${col.name}`;
    if (draftKey in this.draftColumnTypes) {
      return this.draftColumnTypes[draftKey];
    }
    return col.type;
  }

  // ---- LEITURA DE VALORES VISÍVEIS NA SIDEBAR ----
  getSidebarTableName(schemaTableName) {
    const table = this.schema.tables[schemaTableName];
    if (!table) return null;
    const key = table.id || table.name;
    if (this.sidebarState.activeInputKey === key) {
      return this.sidebarState.localTableNames[key] ?? table.name;
    }
    if (table.name in this.draftTableNames) {
      return this.draftTableNames[table.name];
    }
    return this.sidebarState.localTableNames[key] ?? table.name;
  }

  getSidebarColName(schemaTableName, colIndex) {
    const table = this.schema.tables[schemaTableName];
    const col = table?.columns[colIndex];
    if (!col) return null;
    const key = `${table.id || table.name}_col_${colIndex}`;
    if (this.sidebarState.activeColKey === key && this.sidebarState.localColValues[key]) {
      return this.sidebarState.localColValues[key].name;
    }
    const draftKey = `${table.name}.${col.name}`;
    if (draftKey in this.draftColumnNames) {
      return this.draftColumnNames[draftKey];
    }
    return col.name;
  }

  getSidebarColType(schemaTableName, colIndex) {
    const table = this.schema.tables[schemaTableName];
    const col = table?.columns[colIndex];
    if (!col) return null;
    const key = `${table.id || table.name}_col_${colIndex}`;
    if (this.sidebarState.activeColKey === key && this.sidebarState.localColValues[key]) {
      return this.sidebarState.localColValues[key].type;
    }
    const draftKey = `${table.name}.${col.name}`;
    if (draftKey in this.draftColumnTypes) {
      return this.draftColumnTypes[draftKey];
    }
    return col.type;
  }

  // ---- AÇÕES DA STORE ----
  storeRenameTable(oldSqlName, newSqlName, schemaTableName) {
    if (oldSqlName === newSqlName) return false;
    const baseName = schemaTableName || oldSqlName;
    this.draftTableNames = { ...this.draftTableNames, [baseName]: newSqlName };
    const sourceTable = this.schema.tables[baseName];
    const targetTableIndex = sourceTable?.id?.startsWith('table_idx_')
      ? parseInt(sourceTable.id.replace('table_idx_', ''), 10)
      : undefined;
    const updatedSql = replaceTableNameInSql(this.sqlCode, oldSqlName, newSqlName, targetTableIndex);
    this.setSql(updatedSql, true);
    return true;
  }

  storeRenameColumn(tableName, oldColName, newColName, originalColName) {
    if (oldColName === newColName || !tableName) return false;
    const colDraftKey = `${tableName}.${originalColName || oldColName}`;
    this.draftColumnNames = { ...this.draftColumnNames, [colDraftKey]: newColName };
    const table = this.schema.tables[tableName];
    const targetColIndex = table && originalColName
      ? table.columns.findIndex((c) => c.name === originalColName)
      : undefined;
    const updatedSql = replaceColumnNameInSql(
      this.sqlCode,
      tableName,
      oldColName,
      newColName,
      originalColName,
      targetColIndex !== undefined && targetColIndex >= 0 ? targetColIndex : undefined
    );
    this.setSql(updatedSql, true);
    return true;
  }

  storeChangeColumnType(tableName, colName, oldType, newType) {
    if (!tableName || !colName || oldType === newType) return false;
    const typeDraftKey = `${tableName}.${colName}`;
    this.draftColumnTypes = { ...this.draftColumnTypes, [typeDraftKey]: newType };
    const updatedSql = replaceColumnTypeInSql(this.sqlCode, tableName, colName, oldType, newType);
    this.setSql(updatedSql, true);
    return true;
  }

  // ---- SIMULAÇÃO DE INPUTS NO CANVAS (DiagramTableNode.vue) ----
  canvasInputColName(schemaTableName, colIndex, rawInputVal) {
    const table = this.schema.tables[schemaTableName];
    const col = table.columns[colIndex];
    const previousColName = this.getCanvasColName(schemaTableName, colIndex);
    const currentColType = this.getCanvasColType(schemaTableName, colIndex);
    const cleanValue = rawInputVal.replace(/\s+/g, '');
    const editKey = `${schemaTableName}_${colIndex}`;
    const existing = this.canvasState.editingColValues[editKey];
    this.canvasState.editingColKey = editKey;
    this.canvasState.editingColValues[editKey] = {
      name: cleanValue,
      type: existing?.type ?? currentColType,
      initialName: existing?.initialName ?? (previousColName || col.name),
      initialType: existing?.initialType ?? (currentColType || col.type),
    };
    if (previousColName !== cleanValue) {
      const effTableName = this.getCanvasTableName(schemaTableName) || table.name;
      this.storeRenameColumn(effTableName, previousColName, cleanValue, col.name);
    }
  }

  canvasInputColType(schemaTableName, colIndex, rawInputVal) {
    const table = this.schema.tables[schemaTableName];
    const col = table.columns[colIndex];
    const previousType = this.getCanvasColType(schemaTableName, colIndex);
    const currentColName = this.getCanvasColName(schemaTableName, colIndex);
    const newType = rawInputVal;
    const editKey = `${schemaTableName}_${colIndex}`;
    const existing = this.canvasState.editingColValues[editKey];
    this.canvasState.editingColKey = editKey;
    this.canvasState.editingColValues[editKey] = {
      name: currentColName,
      type: newType,
      initialName: existing?.initialName ?? (currentColName || col.name),
      initialType: existing?.initialType ?? (previousType || col.type),
    };
    if (previousType !== newType) {
      const effTableName = this.getCanvasTableName(schemaTableName) || table.name;
      this.storeChangeColumnType(effTableName, currentColName, previousType, newType);
    }
  }

  canvasBlurCol(schemaTableName, colIndex) {
    const table = this.schema.tables[schemaTableName];
    const col = table.columns[colIndex];
    const editKey = `${schemaTableName}_${colIndex}`;
    const currentVal = this.canvasState.editingColValues[editKey];
    if (currentVal) {
      const effTableName = this.getCanvasTableName(schemaTableName) || table.name;
      if (!currentVal.name.trim()) {
        this.storeRenameColumn(effTableName, '', currentVal.initialName || col.name, col.name);
      }
      if (!currentVal.type.trim()) {
        this.storeChangeColumnType(effTableName, currentVal.name || currentVal.initialName || col.name, '', currentVal.initialType || col.type);
      }
    }
    this.canvasState.editingColKey = null;
    this.canvasState.editingColValues = {};
  }

  // ---- SIMULAÇÃO DE INPUTS NA SIDEBAR (ModelingSidebarPanel.vue) ----
  sidebarInputColName(schemaTableName, colIndex, rawInputVal) {
    const table = this.schema.tables[schemaTableName];
    const col = table.columns[colIndex];
    const key = `${table.id || table.name}_col_${colIndex}`;
    const previousColName = this.getSidebarColName(schemaTableName, colIndex);
    const currentColType = this.getSidebarColType(schemaTableName, colIndex);
    const newColName = rawInputVal.replace(/\s+/g, '');
    const existing = this.sidebarState.localColValues[key];
    this.sidebarState.activeColKey = key;
    this.sidebarState.localColValues[key] = {
      name: newColName,
      type: currentColType,
      initialName: existing?.initialName ?? (previousColName || col.name),
      initialType: existing?.initialType ?? (currentColType || col.type),
    };
    if (previousColName !== newColName) {
      const effTableName = this.getSidebarTableName(schemaTableName) || table.name;
      this.storeRenameColumn(effTableName, previousColName, newColName, col.name);
    }
  }

  sidebarInputColType(schemaTableName, colIndex, rawInputVal) {
    const table = this.schema.tables[schemaTableName];
    const col = table.columns[colIndex];
    const key = `${table.id || table.name}_col_${colIndex}`;
    const currentColName = this.getSidebarColName(schemaTableName, colIndex);
    const previousColType = this.getSidebarColType(schemaTableName, colIndex);
    const newType = rawInputVal;
    const existing = this.sidebarState.localColValues[key];
    this.sidebarState.activeColKey = key;
    this.sidebarState.localColValues[key] = {
      name: currentColName,
      type: newType,
      initialName: existing?.initialName ?? (currentColName || col.name),
      initialType: existing?.initialType ?? (previousColType || col.type),
    };
    if (previousColType !== newType) {
      const effTableName = this.getSidebarTableName(schemaTableName) || table.name;
      this.storeChangeColumnType(effTableName, currentColName, previousColType, newType);
    }
  }

  sidebarBlurCol(schemaTableName, colIndex) {
    const table = this.schema.tables[schemaTableName];
    const col = table.columns[colIndex];
    const key = `${table.id || table.name}_col_${colIndex}`;
    const currentVal = this.sidebarState.localColValues[key];
    if (currentVal) {
      const effTableName = this.getSidebarTableName(schemaTableName) || table.name;
      if (!currentVal.name.trim()) {
        this.storeRenameColumn(effTableName, '', currentVal.initialName || col.name, col.name);
      }
      if (!currentVal.type.trim()) {
        this.storeChangeColumnType(effTableName, currentVal.name || currentVal.initialName || col.name, '', currentVal.initialType || col.type);
      }
    }
    this.sidebarState.activeColKey = null;
    this.sidebarState.localColValues = {};
  }
}

// ============================================================================
// CENÁRIOS DE TESTE EXAUSTIVOS
// ============================================================================

const failures = [];
let totalTests = 0;

function assertEqual(actual, expected, contextMsg) {
  totalTests++;
  if (actual !== expected) {
    failures.push({
      context: contextMsg,
      actual,
      expected,
    });
    return false;
  }
  return true;
}

// Função utilitária que simula digitação tecla por tecla:
// Apaga caractere por caractere (backspace) e depois digita caractere por caractere
function generateKeystrokeSequence(fromStr, toStr) {
  const steps = [];
  // 1. Apagar do fim até o começo
  for (let i = fromStr.length - 1; i >= 0; i--) {
    steps.push(fromStr.slice(0, i));
  }
  // 2. Digitar letra por letra do novo valor
  for (let i = 1; i <= toStr.length; i++) {
    steps.push(toStr.slice(0, i));
  }
  return steps;
}

// ----------------------------------------------------------------------------
// 1. TESTE DE DIGITAÇÃO DE TIPOS (CANVAS -> SQL + SIDEBAR)
// ----------------------------------------------------------------------------
const BASE_DDL_MULTILINE = `CREATE TABLE usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  saldo DECIMAL(10,2) DEFAULT 0.00,
  ativo BOOLEAN
);`;

const TYPE_SEQUENCES = [
  { colIdx: 0, from: 'INT', to: 'VARCHAR(255)' },
  { colIdx: 0, from: 'VARCHAR(255)', to: 'BIGINT' },
  { colIdx: 1, from: 'VARCHAR(100)', to: "ENUM('admin', 'user', 'guest')" },
  { colIdx: 1, from: "ENUM('admin', 'user', 'guest')", to: 'TEXT' },
  { colIdx: 2, from: 'DECIMAL(10,2)', to: 'NUMERIC(15, 4)' },
  { colIdx: 3, from: 'BOOLEAN', to: 'CHAR(1)' },
  // Teste com espaços internos antes do fecha parêntese
  { colIdx: 1, from: 'TEXT', to: 'VARCHAR(255 )' },
  { colIdx: 1, from: 'VARCHAR(255 )', to: "ENUM('oi', 'd' )" },
];

console.log('--- Iniciando Bateria 1: Digitação de Tipos no Canvas (Multilinha) ---');
{
  const sim = new TridirectionalSimulator(BASE_DDL_MULTILINE, 'MySQL');
  for (const seq of TYPE_SEQUENCES) {
    const currentType = sim.getCanvasColType('usuarios', seq.colIdx);
    const keystrokes = generateKeystrokeSequence(currentType, seq.to);
    for (const stroke of keystrokes) {
      sim.canvasInputColType('usuarios', seq.colIdx, stroke);

      const canvasVal = sim.getCanvasColType('usuarios', seq.colIdx);
      const sidebarVal = sim.getSidebarColType('usuarios', seq.colIdx);

      assertEqual(
        canvasVal,
        stroke,
        `[Canvas->Canvas] Col ${seq.colIdx} digitando "${stroke}" (de "${seq.from}" para "${seq.to}") | SQL atual: ${JSON.stringify(sim.sqlCode)}`
      );
      assertEqual(
        sidebarVal,
        stroke,
        `[Canvas->Sidebar] Col ${seq.colIdx} digitando "${stroke}" (de "${seq.from}" para "${seq.to}") | SQL atual: ${JSON.stringify(sim.sqlCode)}`
      );

      // Verifica se nenhuma outra coluna da tabela foi engolida ou alterada!
      for (let otherIdx = 0; otherIdx < 4; otherIdx++) {
        if (otherIdx !== seq.colIdx) {
          const otherCanvasType = sim.getCanvasColType('usuarios', otherIdx);
          const otherSidebarType = sim.getSidebarColType('usuarios', otherIdx);
          assertEqual(
            otherCanvasType,
            otherSidebarType,
            `[Canvas->Invariante Outra Coluna ${otherIdx}] Durante digitação de "${stroke}" na col ${seq.colIdx}`
          );
        }
      }
    }
    sim.canvasBlurCol('usuarios', seq.colIdx);
  }
}

// ----------------------------------------------------------------------------
// 2. TESTE DE DIGITAÇÃO DE TIPOS NA SIDEBAR (SIDEBAR -> SQL + CANVAS)
// ----------------------------------------------------------------------------
console.log('--- Iniciando Bateria 2: Digitação de Tipos na Sidebar (Multilinha) ---');
{
  const sim = new TridirectionalSimulator(BASE_DDL_MULTILINE, 'MySQL');
  for (const seq of TYPE_SEQUENCES) {
    const currentType = sim.getSidebarColType('usuarios', seq.colIdx);
    const keystrokes = generateKeystrokeSequence(currentType, seq.to);
    for (const stroke of keystrokes) {
      sim.sidebarInputColType('usuarios', seq.colIdx, stroke);

      const sidebarVal = sim.getSidebarColType('usuarios', seq.colIdx);
      const canvasVal = sim.getCanvasColType('usuarios', seq.colIdx);

      assertEqual(
        sidebarVal,
        stroke,
        `[Sidebar->Sidebar] Col ${seq.colIdx} digitando "${stroke}" (de "${seq.from}" para "${seq.to}") | SQL atual: ${JSON.stringify(sim.sqlCode)}`
      );
      assertEqual(
        canvasVal,
        stroke,
        `[Sidebar->Canvas] Col ${seq.colIdx} digitando "${stroke}" (de "${seq.from}" para "${seq.to}") | SQL atual: ${JSON.stringify(sim.sqlCode)}`
      );
    }
    sim.sidebarBlurCol('usuarios', seq.colIdx);
  }
}

// ----------------------------------------------------------------------------
// 3. TESTE EM TABELA SEM CONSTRAINTS (CASO EXATO DA FOTO DO USUÁRIO)
// ----------------------------------------------------------------------------
console.log('--- Iniciando Bateria 3: Tabela Simples Sem Constraints (id int, coluna varchar(100)) ---');
{
  const simpleSql = `CREATE TABLE nome_tabela (\n  id INT,\n  coluna VARCHAR(100)\n);`;
  const sim = new TridirectionalSimulator(simpleSql, 'MySQL');
  const keystrokes = generateKeystrokeSequence('INT', 'varchar(255)');
  for (const stroke of keystrokes) {
    sim.canvasInputColType('nome_tabela', 0, stroke);
    assertEqual(
      sim.getCanvasColType('nome_tabela', 0),
      stroke,
      `[Tabela Simples Canvas->Canvas] Digitando "${stroke}" | SQL: ${JSON.stringify(sim.sqlCode)}`
    );
    assertEqual(
      sim.getSidebarColType('nome_tabela', 0),
      stroke,
      `[Tabela Simples Canvas->Sidebar] Digitando "${stroke}" | SQL: ${JSON.stringify(sim.sqlCode)}`
    );
    assertEqual(
      sim.getCanvasColName('nome_tabela', 1),
      'coluna',
      `[Tabela Simples Coluna 2 Nome Intacto] Digitando "${stroke}" | SQL: ${JSON.stringify(sim.sqlCode)}`
    );
    assertEqual(
      sim.getCanvasColType('nome_tabela', 1),
      'VARCHAR(100)',
      `[Tabela Simples Coluna 2 Tipo Intacto] Digitando "${stroke}" | SQL: ${JSON.stringify(sim.sqlCode)}`
    );
  }
}

// ----------------------------------------------------------------------------
// 4. TESTE DE DIGITAÇÃO DIRETA NO MONACO EDITOR (SQL -> CANVAS + SIDEBAR)
// ----------------------------------------------------------------------------
console.log('--- Iniciando Bateria 4: Edição Direta no Editor SQL (Monaco) ---');
{
  const baseSql = `CREATE TABLE pedidos (\n  id SERIAL PRIMARY KEY,\n  status VARCHAR(20) NOT NULL,\n  valor DECIMAL(10,2)\n);`;
  const sim = new TridirectionalSimulator(baseSql, 'PostgreSQL');

  // Caso 4.1: Usuário digita tipo inválido 'dasdas' no SQL e depois altera o nome da coluna 'id' -> 'idss'
  const step1Sql = `CREATE TABLE pedidos (\n  id dasdas PRIMARY KEY,\n  status VARCHAR(20) NOT NULL,\n  valor DECIMAL(10,2)\n);`;
  sim.setSql(step1Sql);
  assertEqual(sim.getCanvasColName('pedidos', 0), 'id', '[Monaco Erro Tipo] Nome col 0 deve ser id');
  assertEqual(sim.getCanvasColType('pedidos', 0), 'dasdas', '[Monaco Erro Tipo] Tipo col 0 deve ser dasdas');
  assertEqual(sim.getSidebarColType('pedidos', 0), 'dasdas', '[Monaco Erro Tipo Sidebar] Tipo col 0 deve ser dasdas');

  const step2Sql = `CREATE TABLE pedidos (\n  idss dasdas PRIMARY KEY,\n  status VARCHAR(20) NOT NULL,\n  valor DECIMAL(10,2)\n);`;
  sim.setSql(step2Sql);
  assertEqual(sim.getCanvasColName('pedidos', 0), 'idss', '[Monaco Nome+Tipo Erro] Nome col 0 deve ser idss');
  assertEqual(sim.getCanvasColType('pedidos', 0), 'dasdas', '[Monaco Nome+Tipo Erro] Tipo col 0 deve continuar dasdas');
  assertEqual(sim.getSidebarColName('pedidos', 0), 'idss', '[Monaco Nome+Tipo Erro Sidebar] Nome col 0 deve ser idss');
  assertEqual(sim.getSidebarColType('pedidos', 0), 'dasdas', '[Monaco Nome+Tipo Erro Sidebar] Tipo col 0 deve continuar dasdas');

  // Caso 4.2: Usuário apaga o tipo no SQL deixando apenas 'id PRIMARY KEY'
  const step3Sql = `CREATE TABLE pedidos (\n  id PRIMARY KEY,\n  status VARCHAR(20) NOT NULL,\n  valor DECIMAL(10,2)\n);`;
  sim.setSql(step3Sql);
  assertEqual(sim.getCanvasColName('pedidos', 0), 'id', '[Monaco Tipo Vazio] Nome col 0 deve ser id');
  assertEqual(sim.getCanvasColType('pedidos', 0), '', '[Monaco Tipo Vazio] Tipo col 0 deve ser vazio ""');

  // Caso 4.3: Usuário vai digitando ENUM('oi', 'd') caractere a caractere no Monaco
  const enumProgressions = [
    "ENUM(",
    "ENUM('",
    "ENUM('o",
    "ENUM('oi",
    "ENUM('oi'",
    "ENUM('oi',",
    "ENUM('oi', ",
    "ENUM('oi', '",
    "ENUM('oi', 'd",
    "ENUM('oi', 'd'",
    "ENUM('oi', 'd' ",
    "ENUM('oi', 'd' )",
    "ENUM('oi', 'd')",
  ];
  for (const prog of enumProgressions) {
    const sqlProg = `CREATE TABLE pedidos (\n  id SERIAL PRIMARY KEY,\n  status ${prog} NOT NULL,\n  valor DECIMAL(10,2)\n);`;
    sim.setSql(sqlProg);
    assertEqual(
      sim.getCanvasColType('pedidos', 1),
      prog.trim(),
      `[Monaco ENUM Progressivo->Canvas] Digitando "${prog}"`
    );
    assertEqual(
      sim.getSidebarColType('pedidos', 1),
      prog.trim(),
      `[Monaco ENUM Progressivo->Sidebar] Digitando "${prog}"`
    );
  }
}

// ----------------------------------------------------------------------------
// 5. TESTE DE RENOMEAÇÃO DE COLUNAS E TABELAS (INCLUINDO APAGAR TUDO E REESCREVER)
// ----------------------------------------------------------------------------
console.log('--- Iniciando Bateria 5: Renomeação de Colunas e Tabelas (Vazio -> Novo Nome) ---');
{
  const sim = new TridirectionalSimulator(BASE_DDL_MULTILINE, 'MySQL');
  const colNameStrokes = generateKeystrokeSequence('nome', 'nome_completo_cliente');
  for (const stroke of colNameStrokes) {
    sim.canvasInputColName('usuarios', 1, stroke);
    assertEqual(
      sim.getCanvasColName('usuarios', 1),
      stroke,
      `[Canvas Rename Col->Canvas] Digitando "${stroke}" | SQL: ${JSON.stringify(sim.sqlCode)}`
    );
    assertEqual(
      sim.getSidebarColName('usuarios', 1),
      stroke,
      `[Canvas Rename Col->Sidebar] Digitando "${stroke}" | SQL: ${JSON.stringify(sim.sqlCode)}`
    );
  }
  sim.canvasBlurCol('usuarios', 1);
}

// ----------------------------------------------------------------------------
// 6. TESTE DE SQL MINIFICADO (UMA ÚNICA LINHA)
// ----------------------------------------------------------------------------
console.log('--- Iniciando Bateria 6: SQL Minificado ---');
{
  const minifiedSql = `CREATE TABLE clientes (id INT PRIMARY KEY, email VARCHAR(100) UNIQUE, saldo DECIMAL(10,2) NOT NULL);`;
  const sim = new TridirectionalSimulator(minifiedSql, 'MySQL');

  const strokes = generateKeystrokeSequence('VARCHAR(100)', 'VARCHAR(255)');
  for (const stroke of strokes) {
    sim.canvasInputColType('clientes', 1, stroke);
    assertEqual(
      sim.getCanvasColType('clientes', 1),
      stroke,
      `[Minificado Canvas->Canvas] Digitando "${stroke}" | SQL: ${JSON.stringify(sim.sqlCode)}`
    );
    assertEqual(
      sim.getSidebarColType('clientes', 1),
      stroke,
      `[Minificado Canvas->Sidebar] Digitando "${stroke}" | SQL: ${JSON.stringify(sim.sqlCode)}`
    );
    // Coluna vizinha (saldo) deve continuar intacta!
    assertEqual(
      sim.getCanvasColName('clientes', 2),
      'saldo',
      `[Minificado Coluna Vizinha Nome] Durante "${stroke}" | SQL: ${JSON.stringify(sim.sqlCode)}`
    );
  }
  sim.canvasBlurCol('clientes', 1);
}

// ----------------------------------------------------------------------------
// 7. TESTE DE MÚLTIPLAS EDIÇÕES SEQUENCIAIS (ALTERA COLUNA -> ALTERA TIPO -> ALTERA TABELA)
// ----------------------------------------------------------------------------
console.log('--- Iniciando Bateria 7: Combo de Edições Sequenciais ---');
{
  const sim = new TridirectionalSimulator(BASE_DDL_MULTILINE, 'MySQL');

  // 1. Muda tipo para algo inválido no Canvas (ex: 'varchar(255')
  sim.canvasInputColType('usuarios', 1, 'varchar(255');
  sim.canvasBlurCol('usuarios', 1);

  assertEqual(sim.getCanvasColType('usuarios', 1), 'varchar(255', '[Combo Passo 1] Tipo com erro no Canvas');
  assertEqual(sim.getSidebarColType('usuarios', 1), 'varchar(255', '[Combo Passo 1] Tipo com erro na Sidebar');

  // 2. Agora edita na Sidebar para fechar o parêntese 'varchar(255)'
  sim.sidebarInputColType('usuarios', 1, 'varchar(255)');
  sim.sidebarBlurCol('usuarios', 1);

  assertEqual(sim.errors.length, 0, `[Combo Passo 2] SQL deve voltar a ficar válido! SQL: ${sim.sqlCode}`);
  assertEqual(sim.getCanvasColType('usuarios', 1), 'varchar(255)', '[Combo Passo 2] Tipo fiel ao digitado após parse');
}

// ----------------------------------------------------------------------------
// 8. TESTE DE EDIÇÃO DE NOME DE TABELA (CANVAS <-> SIDEBAR <-> SQL + FKs)
// ----------------------------------------------------------------------------
console.log('--- Iniciando Bateria 8: Edição de Nome de Tabela e Sincronização de FK ---');
{
  const fkDdl = `CREATE TABLE clientes (\n  id INT PRIMARY KEY,\n  nome VARCHAR(100)\n);\n\nCREATE TABLE pedidos (\n  id INT PRIMARY KEY,\n  cliente_id INT,\n  FOREIGN KEY (cliente_id) REFERENCES clientes(id)\n);`;
  const sim = new TridirectionalSimulator(fkDdl, 'MySQL');

  const tableStrokes = generateKeystrokeSequence('clientes', 'clientes_vip');
  for (const stroke of tableStrokes) {
    // Simulando input do título no Canvas
    const prevName = sim.getCanvasTableName(Object.keys(sim.schema.tables)[0]);
    const cleanVal = stroke.replace(/\s+/g, '');
    const currentSchemaName = Object.keys(sim.schema.tables)[0];
    sim.canvasState.editingTable = currentSchemaName;
    sim.canvasState.localTableInput[currentSchemaName] = cleanVal;
    if (prevName !== cleanVal) {
      sim.storeRenameTable(prevName, cleanVal, currentSchemaName);
    }

    const updatedSchemaName = Object.keys(sim.schema.tables)[0];
    sim.canvasState.editingTable = updatedSchemaName;
    sim.canvasState.localTableInput[updatedSchemaName] = cleanVal;

    assertEqual(
      sim.getCanvasTableName(updatedSchemaName),
      cleanVal,
      `[Rename Table Canvas->Canvas] Digitando "${cleanVal}" | SQL: ${JSON.stringify(sim.sqlCode)}`
    );
    assertEqual(
      sim.getSidebarTableName(updatedSchemaName),
      cleanVal,
      `[Rename Table Canvas->Sidebar] Digitando "${cleanVal}" | SQL: ${JSON.stringify(sim.sqlCode)}`
    );
  }
  assertEqual(sim.errors.length, 0, '[Rename Table Final] SQL válido com FK atualizada');
  assertEqual(sim.sqlCode.includes('REFERENCES clientes_vip(id)'), true, '[Rename Table FK] FK aponta para clientes_vip');
}

// ----------------------------------------------------------------------------
// 9. TESTE MULTI-DIALETOS (POSTGRESQL, SQLITE, SQL SERVER, MARIADB, MYSQL)
// ----------------------------------------------------------------------------
console.log('--- Iniciando Bateria 9: Validação Multi-Dialetos e Edição em Todos os Bancos ---');
{
  const dialectConfigs = [
    {
      dialect: 'PostgreSQL',
      ddl: `CREATE TABLE produtos (\n  id SERIAL PRIMARY KEY,\n  dados JSONB NOT NULL,\n  preco NUMERIC(10, 2)\n);`,
      newType: 'VARCHAR(150)',
    },
    {
      dialect: 'SQLite',
      ddl: `CREATE TABLE produtos (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  dados TEXT NOT NULL,\n  preco REAL\n);`,
      newType: 'VARCHAR(150)',
    },
    {
      dialect: 'TransactSQL',
      ddl: `CREATE TABLE produtos (\n  id INT IDENTITY(1,1) PRIMARY KEY,\n  dados NVARCHAR(100) NOT NULL,\n  preco DECIMAL(10, 2)\n);`,
      newType: 'VARCHAR(150)',
    },
    {
      dialect: 'MariaDB',
      ddl: `CREATE TABLE produtos (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  dados LONGTEXT NOT NULL,\n  preco DOUBLE\n);`,
      newType: "ENUM('ativo', 'inativo')",
    },
  ];

  for (const cfg of dialectConfigs) {
    const sim = new TridirectionalSimulator(cfg.ddl, cfg.dialect);
    assertEqual(sim.errors.length, 0, `[Dialeto ${cfg.dialect}] DDL inicial deve ser válido`);

    const initialType = sim.getCanvasColType('produtos', 1);
    const strokes = generateKeystrokeSequence(initialType, cfg.newType);
    for (const stroke of strokes) {
      sim.sidebarInputColType('produtos', 1, stroke);
      assertEqual(
        sim.getSidebarColType('produtos', 1),
        stroke,
        `[Dialeto ${cfg.dialect} Sidebar->Sidebar] Digitando "${stroke}"`
      );
      assertEqual(
        sim.getCanvasColType('produtos', 1),
        stroke,
        `[Dialeto ${cfg.dialect} Sidebar->Canvas] Digitando "${stroke}"`
      );
    }
    sim.sidebarBlurCol('produtos', 1);
    assertEqual(sim.errors.length, 0, `[Dialeto ${cfg.dialect}] DDL final deve ser válido após digitar "${cfg.newType}"`);
  }

  // Validação estrita: PostgreSQL deve rejeitar AUTO_INCREMENT
  const pgInvalid = new TridirectionalSimulator(
    `CREATE TABLE teste (\n  id INT PRIMARY KEY AUTO_INCREMENT\n);`,
    'PostgreSQL'
  );
  assertEqual(pgInvalid.errors.length, 1, '[PostgreSQL Strict] Deve rejeitar AUTO_INCREMENT');
}

// ----------------------------------------------------------------------------
// 10. TESTE DE BLUR EM CAMPO VAZIO (RESTAURAÇÃO AUTOMÁTICA DE NOME E TIPO)
// ----------------------------------------------------------------------------
console.log('--- Iniciando Bateria 10: Restauração Automática ao Dar Blur com Campo Vazio ---');
{
  const sim = new TridirectionalSimulator(BASE_DDL_MULTILINE, 'MySQL');

  // Apaga todo o tipo da coluna 1 ('VARCHAR(100)') e dá blur
  const eraseTypeStrokes = generateKeystrokeSequence('VARCHAR(100)', '');
  for (const s of eraseTypeStrokes) {
    sim.canvasInputColType('usuarios', 1, s);
  }
  assertEqual(sim.getCanvasColType('usuarios', 1), '', '[Blur Vazio Tipo] Enquanto focado deve mostrar vazio');
  sim.canvasBlurCol('usuarios', 1);
  assertEqual(sim.errors.length, 0, '[Blur Vazio Tipo] Após blur deve restaurar SQL válido');
  assertEqual(sim.getCanvasColType('usuarios', 1), 'VARCHAR(100)', '[Blur Vazio Tipo] Deve restaurar VARCHAR(100)');

  // Apaga todo o nome da coluna 1 ('nome') e dá blur
  const eraseNameStrokes = generateKeystrokeSequence('nome', '');
  for (const s of eraseNameStrokes) {
    sim.sidebarInputColName('usuarios', 1, s);
  }
  assertEqual(sim.getSidebarColName('usuarios', 1), '', '[Blur Vazio Nome] Enquanto focado deve mostrar vazio');
  sim.sidebarBlurCol('usuarios', 1);
  assertEqual(sim.errors.length, 0, '[Blur Vazio Nome] Após blur deve restaurar SQL válido');
  assertEqual(sim.getSidebarColName('usuarios', 1), 'nome', '[Blur Vazio Nome] Deve restaurar nome');
}

// ----------------------------------------------------------------------------
// 11. TESTE DE COLUNAS E TABELAS ENTRE ASPAS / BACKTICKS (`id`, "nome")
// ----------------------------------------------------------------------------
console.log('--- Iniciando Bateria 11: Colunas e Tabelas com Backticks e Aspas ---');
{
  const quotedSql = "CREATE TABLE `minha_tabela` (\n  `id` INT PRIMARY KEY,\n  `status_atual` VARCHAR(50) NOT NULL\n);";
  const sim = new TridirectionalSimulator(quotedSql, 'MySQL');

  const typeStrokes = generateKeystrokeSequence('VARCHAR(50)', "ENUM('a', 'b')");
  for (const s of typeStrokes) {
    sim.canvasInputColType('minha_tabela', 1, s);
    assertEqual(sim.getCanvasColType('minha_tabela', 1), s, `[Backticks Tipo Canvas] Digitando "${s}"`);
    assertEqual(sim.getSidebarColType('minha_tabela', 1), s, `[Backticks Tipo Sidebar] Digitando "${s}"`);
  }
  sim.canvasBlurCol('minha_tabela', 1);
  assertEqual(sim.errors.length, 0, '[Backticks Tipo Final] SQL válido');

  const nameStrokes = generateKeystrokeSequence('status_atual', 'novo_status');
  for (const s of nameStrokes) {
    sim.sidebarInputColName('minha_tabela', 1, s);
    assertEqual(sim.getSidebarColName('minha_tabela', 1), s, `[Backticks Nome Sidebar] Digitando "${s}"`);
    assertEqual(sim.getCanvasColName('minha_tabela', 1), s, `[Backticks Nome Canvas] Digitando "${s}"`);
  }
  sim.sidebarBlurCol('minha_tabela', 1);
  assertEqual(sim.errors.length, 0, '[Backticks Nome Final] SQL válido');
}

// ----------------------------------------------------------------------------
// 12. TESTE DE TABELA COM COMENTÁRIOS INLINE E MÚLTIPLAS TABELAS NO SCRIPT
// ----------------------------------------------------------------------------
console.log('--- Iniciando Bateria 12: Comentários Inline e Múltiplas Tabelas ---');
{
  const multiTableSql = `CREATE TABLE categorias (
  id INT PRIMARY KEY, -- identificador
  titulo VARCHAR(80) NOT NULL -- nome da categoria
);

CREATE TABLE itens (
  id INT PRIMARY KEY,
  preco DECIMAL(10, 2) DEFAULT 0.00, -- valor unitario
  categoria_id INT,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);`;
  const sim = new TridirectionalSimulator(multiTableSql, 'MySQL');

  // Edita tipo na tabela 2 (itens)
  const strokes = generateKeystrokeSequence('DECIMAL(10, 2)', 'NUMERIC(12, 4)');
  for (const s of strokes) {
    sim.canvasInputColType('itens', 1, s);
    assertEqual(sim.getCanvasColType('itens', 1), s, `[MultiTable Comentários Canvas] Digitando "${s}"`);
    assertEqual(sim.getSidebarColType('itens', 1), s, `[MultiTable Comentários Sidebar] Digitando "${s}"`);
    // Tabela 1 continua intacta
    assertEqual(sim.getCanvasColType('categorias', 1), 'VARCHAR(80)', '[MultiTable Tabela 1 Intacta]');
  }
  sim.canvasBlurCol('itens', 1);
  assertEqual(sim.errors.length, 0, '[MultiTable Final] SQL válido');
}

// ----------------------------------------------------------------------------
// 13. TESTE DE INTERCALAÇÃO DE FOCO SEM CORRIGir ERRO (EDITA COL 1 COM ERRO -> EDITA COL 2 COM ERRO -> CORRIGE AMBAS)
// ----------------------------------------------------------------------------
console.log('--- Iniciando Bateria 13: Edição Simultânea de Múltiplas Colunas com Erro ---');
{
  const sim = new TridirectionalSimulator(BASE_DDL_MULTILINE, 'MySQL');

  // 1. Deixa coluna 0 com tipo inválido 'varchar(' no Canvas
  sim.canvasInputColType('usuarios', 0, 'varchar(');
  sim.canvasBlurCol('usuarios', 0);
  assertEqual(sim.getCanvasColType('usuarios', 0), 'varchar(', '[MultiErro Col 0] Mantém varchar(');
  assertEqual(sim.getSidebarColType('usuarios', 0), 'varchar(', '[MultiErro Col 0 Sidebar] Mantém varchar(');

  // 2. Enquanto Col 0 está com erro, edita Col 1 na Sidebar para 'enum('
  sim.sidebarInputColType('usuarios', 1, 'enum(');
  sim.sidebarBlurCol('usuarios', 1);
  assertEqual(sim.getCanvasColType('usuarios', 0), 'varchar(', '[MultiErro Col 0 Preservada] Continua varchar(');
  assertEqual(sim.getCanvasColType('usuarios', 1), 'enum(', '[MultiErro Col 1] Mostra enum(');
  assertEqual(sim.getSidebarColType('usuarios', 1), 'enum(', '[MultiErro Col 1 Sidebar] Mostra enum(');

  // 3. Enquanto Col 0 e Col 1 têm erro de tipo, muda nome da Col 2 para 'meu_saldo'
  sim.canvasInputColName('usuarios', 2, 'meu_saldo');
  sim.canvasBlurCol('usuarios', 2);
  assertEqual(sim.getCanvasColName('usuarios', 2), 'meu_saldo', '[MultiErro Col 2 Nome] Mostra meu_saldo');
  assertEqual(sim.getSidebarColName('usuarios', 2), 'meu_saldo', '[MultiErro Col 2 Nome Sidebar] Mostra meu_saldo');
  assertEqual(sim.getCanvasColType('usuarios', 0), 'varchar(', '[MultiErro Col 0 Ainda Preservada]');
  assertEqual(sim.getCanvasColType('usuarios', 1), 'enum(', '[MultiErro Col 1 Ainda Preservada]');

  // 4. Corrige Col 0 para 'VARCHAR(20)' e Col 1 para "ENUM('x', 'y')"
  sim.canvasInputColType('usuarios', 0, 'VARCHAR(20)');
  sim.canvasBlurCol('usuarios', 0);
  sim.sidebarInputColType('usuarios', 1, "ENUM('x', 'y')");
  sim.sidebarBlurCol('usuarios', 1);

  assertEqual(sim.errors.length, 0, `[MultiErro Recuperação Total] SQL válido! SQL: ${sim.sqlCode}`);
  assertEqual(sim.getCanvasColType('usuarios', 0), 'VARCHAR(20)', '[MultiErro Final Col 0]');
  assertEqual(sim.getCanvasColType('usuarios', 1), "ENUM('x', 'y')", '[MultiErro Final Col 1]');
  assertEqual(sim.getCanvasColName('usuarios', 2), 'meu_saldo', '[MultiErro Final Col 2]');
}

// ----------------------------------------------------------------------------
// 14. TESTE DE EDIÇÃO NO MEIO DA STRING E COLAR (PASTE)
// ----------------------------------------------------------------------------
console.log('--- Iniciando Bateria 14: Edição no Meio da String e Colar (Paste) ---');
{
  const sim = new TridirectionalSimulator(BASE_DDL_MULTILINE, 'MySQL');

  // 1. Substituir no meio da string: VARCHAR(100) -> VARCHAR(255)
  sim.canvasInputColType('usuarios', 1, 'VARCHAR(255)');
  sim.canvasBlurCol('usuarios', 1);
  assertEqual(sim.getCanvasColType('usuarios', 1), 'VARCHAR(255)', '[Paste Canvas] VARCHAR(255)');
  assertEqual(sim.getSidebarColType('usuarios', 1), 'VARCHAR(255)', '[Paste Sidebar] VARCHAR(255)');

  // 2. Colar tipo novo: DECIMAL(12, 4)
  sim.sidebarInputColType('usuarios', 1, 'DECIMAL(12, 4)');
  sim.sidebarBlurCol('usuarios', 1);
  assertEqual(sim.getCanvasColType('usuarios', 1), 'DECIMAL(12, 4)', '[Paste Tipo Novo Canvas]');
  assertEqual(sim.getSidebarColType('usuarios', 1), 'DECIMAL(12, 4)', '[Paste Tipo Novo Sidebar]');

  // 3. Edição no miolo tecla por tecla: DECIMAL(12, 4) -> DECIMAL(12, 40) -> DECIMAL(12, 4)
  const steps = ['DECIMAL(12, 40)', 'DECIMAL(12, 400)', 'DECIMAL(12, 40)', 'DECIMAL(12, 4)'];
  for (const step of steps) {
    sim.canvasInputColType('usuarios', 1, step);
    assertEqual(sim.getCanvasColType('usuarios', 1), step, `[Miolo Canvas] ${step}`);
    assertEqual(sim.getSidebarColType('usuarios', 1), step, `[Miolo Sidebar] ${step}`);
  }
  sim.canvasBlurCol('usuarios', 1);
}

// ----------------------------------------------------------------------------
// 15. TESTE DE COLISÃO DE SUBSTRINGS E PALAVRAS RESERVADAS
// ----------------------------------------------------------------------------
console.log('--- Iniciando Bateria 15: Colisão de Substrings e Palavras Reservadas ---');
{
  const sqlCollisions = `CREATE TABLE pedidos (\n  cliente_id INT,\n  id INT PRIMARY KEY,\n  id_externo INT\n);`;
  const sim = new TridirectionalSimulator(sqlCollisions, 'MySQL');

  // Renomear 'id' para 'codigo' - não deve colidir com 'cliente_id' nem 'id_externo'
  sim.canvasInputColName('pedidos', 1, 'codigo');
  sim.canvasBlurCol('pedidos', 1);
  assertEqual(sim.getCanvasColName('pedidos', 0), 'cliente_id', '[Substrings] cliente_id intacto');
  assertEqual(sim.getCanvasColName('pedidos', 1), 'codigo', '[Substrings] id virou codigo');
  assertEqual(sim.getCanvasColName('pedidos', 2), 'id_externo', '[Substrings] id_externo intacto');

  // Colunas chamadas de palavras-chave / tipos: text, date, status, check
  const sqlKeywords = `CREATE TABLE logs (\n  id INT PRIMARY KEY,\n  text TEXT,\n  date DATE,\n  status VARCHAR(50),\n  \`check\` BOOLEAN\n);`;
  const simKeywords = new TridirectionalSimulator(sqlKeywords, 'MySQL');

  simKeywords.sidebarInputColName('logs', 1, 'conteudo');
  simKeywords.sidebarBlurCol('logs', 1);
  assertEqual(simKeywords.getCanvasColName('logs', 1), 'conteudo', '[Palavra Reservada] Coluna "text" virou "conteudo"');
  assertEqual(simKeywords.getCanvasColType('logs', 1), 'TEXT', '[Palavra Reservada] Tipo TEXT preservado');

  simKeywords.canvasInputColType('logs', 1, 'LONGTEXT');
  simKeywords.canvasBlurCol('logs', 1);
  assertEqual(simKeywords.getCanvasColType('logs', 1), 'LONGTEXT', '[Palavra Reservada] Tipo virou LONGTEXT');
}

// ----------------------------------------------------------------------------
// 16. TESTE DE RENOMEAÇÃO EM CASCATA DE FK E PK COMPOSTA
// ----------------------------------------------------------------------------
console.log('--- Iniciando Bateria 16: Renomeação em Cascata de FK e PK Composta ---');
{
  const sqlPkComposta = `CREATE TABLE itens (\n  pedido_id INT,\n  produto_id INT,\n  PRIMARY KEY (pedido_id, produto_id)\n);`;
  const simPk = new TridirectionalSimulator(sqlPkComposta, 'MySQL');

  simPk.canvasInputColName('itens', 0, 'id_pedido');
  simPk.canvasBlurCol('itens', 0);
  assertEqual(simPk.getCanvasColName('itens', 0), 'id_pedido', '[PK Composta] pedido_id -> id_pedido');
  assertEqual(simPk.sqlCode.includes('PRIMARY KEY (id_pedido, produto_id)'), true, '[PK Composta] SQL atualizou constraint');

  const sqlFkMulti = `CREATE TABLE clientes (\n  id INT PRIMARY KEY,\n  nome VARCHAR(100)\n);\n\nCREATE TABLE pedidos (\n  id INT PRIMARY KEY,\n  cliente_id INT,\n  FOREIGN KEY (cliente_id) REFERENCES clientes(id)\n);`;
  const simFk = new TridirectionalSimulator(sqlFkMulti, 'MySQL');

  // Renomear clientes.id para cod_cliente -> deve atualizar REFERENCES clientes(cod_cliente)
  simFk.canvasInputColName('clientes', 0, 'cod_cliente');
  simFk.canvasBlurCol('clientes', 0);
  assertEqual(simFk.getCanvasColName('clientes', 0), 'cod_cliente', '[FK Multi] clientes.id -> cod_cliente');
  assertEqual(simFk.sqlCode.includes('REFERENCES clientes(cod_cliente)'), true, '[FK Multi] REFERENCES clientes(cod_cliente) atualizado em pedidos');

  // Renomear cliente_id em pedidos para id_cliente -> deve atualizar FOREIGN KEY (id_cliente)
  simFk.sidebarInputColName('pedidos', 1, 'id_cliente');
  simFk.sidebarBlurCol('pedidos', 1);
  assertEqual(simFk.getSidebarColName('pedidos', 1), 'id_cliente', '[FK Multi] pedidos.cliente_id -> id_cliente');
  assertEqual(simFk.sqlCode.includes('FOREIGN KEY (id_cliente)'), true, '[FK Multi] FOREIGN KEY (id_cliente) atualizado em pedidos');
}

// ----------------------------------------------------------------------------
// 17. TESTE DE TIPOS COMPOSTOS E CONSTRAINTS COMPLEXAS
// ----------------------------------------------------------------------------
console.log('--- Iniciando Bateria 17: Tipos Compostos e Constraints Complexas ---');
{
  const sqlComplex = `CREATE TABLE complexa (\n  id INT PRIMARY KEY,\n  peso DOUBLE PRECISION,\n  num INT UNSIGNED,\n  criado_em TIMESTAMP WITH TIME ZONE,\n  msg VARCHAR(100) DEFAULT 'a, b',\n  valor DECIMAL(10, 2) CHECK (valor > 0 AND valor < 100)\n);`;
  const sim = new TridirectionalSimulator(sqlComplex, 'PostgreSQL');

  assertEqual(sim.getCanvasColType('complexa', 1), 'DOUBLE PRECISION', '[Tipos Compostos] DOUBLE PRECISION');
  assertEqual(sim.getCanvasColType('complexa', 2), 'INT UNSIGNED', '[Tipos Compostos] INT UNSIGNED');
  assertEqual(sim.getCanvasColType('complexa', 3), 'TIMESTAMP WITH TIME ZONE', '[Tipos Compostos] TIMESTAMP WITH TIME ZONE');
  assertEqual(sim.getCanvasColType('complexa', 4), 'VARCHAR(100)', '[Tipos Compostos] DEFAULT com vírgula "a, b"');
  assertEqual(sim.getCanvasColType('complexa', 5), 'DECIMAL(10, 2)', '[Tipos Compostos] CHECK com parênteses e operadores');
}

// ----------------------------------------------------------------------------
// 18. TESTE DE CRLF (\r\n), COMENTÁRIOS DE BLOCO E SCHEMAS
// ----------------------------------------------------------------------------
console.log('--- Iniciando Bateria 18: CRLF, Comentários de Bloco e Schemas ---');
{
  // CRLF
  const sqlCrlf = "CREATE TABLE crlf_tabela (\r\n  id INT PRIMARY KEY,\r\n  nome VARCHAR(50)\r\n);\r\n";
  const simCrlf = new TridirectionalSimulator(sqlCrlf, 'MySQL');
  assertEqual(simCrlf.getCanvasColName('crlf_tabela', 0), 'id', '[CRLF] Col 0 nome');
  assertEqual(simCrlf.getCanvasColType('crlf_tabela', 1), 'VARCHAR(50)', '[CRLF] Col 1 tipo');

  // Comentários de Bloco com caracteres de fecho falso
  const sqlBlockComment = `CREATE TABLE comentarios (\n  id INT PRIMARY KEY,\n  /* comentário de bloco com ); dentro */\n  nome VARCHAR(100)\n);`;
  const simComment = new TridirectionalSimulator(sqlBlockComment, 'MySQL');
  assertEqual(simComment.getCanvasColName('comentarios', 1), 'nome', '[Bloco Comentário] Ignora ); dentro de /* */');

  // Schemas em PostgreSQL: public.usuarios
  const sqlPgSchema = `CREATE TABLE public.usuarios (\n  id SERIAL PRIMARY KEY,\n  nome VARCHAR(100)\n);`;
  const simPg = new TridirectionalSimulator(sqlPgSchema, 'PostgreSQL');
  simPg.canvasInputColName('usuarios', 1, 'nome_completo');
  simPg.canvasBlurCol('usuarios', 1);
  assertEqual(simPg.getCanvasColName('usuarios', 1), 'nome_completo', '[Schema PG] public.usuarios renomeado com sucesso');
  assertEqual(simPg.sqlCode.includes('public.usuarios'), true, '[Schema PG] Preserva prefixo public.');
}

// ----------------------------------------------------------------------------
// 19. TESTE DE VALIDAÇÃO SEMÂNTICA (WARNINGS PARA COLUNAS E TABELAS INEXISTENTES EM PK/FK)
// ----------------------------------------------------------------------------
console.log('--- Iniciando Bateria 19: Validação Semântica (Avisos de Integridade) ---');
{
  // 1. Tabela com coluna inexistente na Chave Primária Composta (o caso exato trazido pelo usuário!)
  const sqlSemanticError = `CREATE TABLE itens_pedido (
  pedido_id INT,
  dasdsadasdas INT,
  quantidade INT,
  preco_unitario DECIMAL(10,2),
  PRIMARY KEY (pedido_id, aa),
  FOREIGN KEY (pedido_id) REFERENCES pedidos_renomado(id),
  FOREIGN KEY (dasdsadasdas) REFERENCES Produtos(id)
);`;

  const parsedSemantic = parseSqlSchema(sqlSemanticError, 'MySQL');
  assertEqual(
    Boolean(parsedSemantic.warnings && parsedSemantic.warnings.length > 0),
    true,
    '[Validação Semântica] Detectou problemas semânticos'
  );

  const pkWarning = parsedSemantic.warnings?.find(w => w.message.includes('aa'));
  assertEqual(
    Boolean(pkWarning),
    true,
    '[Validação Semântica PK] Emitiu warning sobre coluna "aa" inexistente'
  );

  const fkWarningTable = parsedSemantic.warnings?.find(w => w.message.includes('pedidos_renomado'));
  assertEqual(
    Boolean(fkWarningTable),
    true,
    '[Validação Semântica FK Tabela] Emitiu warning sobre tabela referenciada "pedidos_renomado" inexistente'
  );

  const fkWarningProd = parsedSemantic.warnings?.find(w => w.message.includes('Produtos'));
  assertEqual(
    Boolean(fkWarningProd),
    true,
    '[Validação Semântica FK Tabela] Emitiu warning sobre tabela referenciada "Produtos" inexistente'
  );
}

// ============================================================================
// RELATÓRIO FINAL
// ============================================================================
console.log(`\n========================================================`);
console.log(`TOTAL DE VERIFICAÇÕES EXECUTADAS: ${totalTests}`);
console.log(`TOTAL DE FALHAS ENCONTRADAS: ${failures.length}`);
console.log(`========================================================\n`);

if (failures.length > 0) {
  console.log('DETALHES DAS PRIMEIRAS 15 FALHAS:');
  failures.slice(0, 15).forEach((f, idx) => {
    console.log(`\n#${idx + 1}: ${f.context}`);
    console.log(`  Esperado : ${JSON.stringify(f.expected)}`);
    console.log(`  Obtido   : ${JSON.stringify(f.actual)}`);
  });
  process.exit(1);
} else {
  console.log('TODOS OS TESTES PASSARAM COM 100% DE PRECISÃO!');
}
