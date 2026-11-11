import { storeToRefs } from 'pinia';
import { useDiagramStore } from '@/stores/diagram';

export const DEFAULT_SQL = `CREATE TABLE clientes (
  id INT PRIMARY KEY,
  nome_completo VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  cpf VARCHAR(14)
);

CREATE TABLE produtos (
  id INT PRIMARY KEY,
  nome VARCHAR(100),
  preco DECIMAL(10,2),
  estoque_atual INT
);

CREATE TABLE pedidos (
  id INT PRIMARY KEY,
  data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20),
  total DECIMAL(10,2),
  
  -- Um Pedido pertence a um Cliente
  cliente_id INT NOT NULL,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- Tabela de Detalhes (Relacionamento N:N entre Pedido e Produto)
CREATE TABLE itens_pedido (
  pedido_id INT,
  produto_id INT,
  quantidade INT,
  preco_unitario DECIMAL(10,2),
  
  -- Chave Composta (Impede duplicidade do mesmo produto no item)
  PRIMARY KEY (pedido_id, produto_id),
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);`;

export function useDiagram() {
  const store = useDiagramStore();
  const { 
    sqlCode, errors, warnings, positions, edgeOffsets, 
    selectedTableNames, hoveredColumn, tableOrder, loadingProgress,
    isStampActive, stampGhostPosition 
  } = storeToRefs(store);

  const tables = computed(() => store.tables);
  const relationships = computed(() => store.relationships);

  const parseSql = (sql: string) => {
    store.setSql(sql);
  };

  const bringTableToFront = (tableName: string) => {
    store.bringTableToFront(tableName);
  };

  const bringTablesToFront = (tableNames: string[], topTable?: string) => {
    store.bringTablesToFront(tableNames, topTable);
  };

  const startStampMode = () => store.startStampMode();
  const cancelStampMode = () => store.cancelStampMode();
  const toggleStampMode = () => store.toggleStampMode();
  const setStampGhostPosition = (pos: { x: number; y: number } | null) => store.setStampGhostPosition(pos);
  const commitStampPlacement = (pos: { x: number; y: number }) => store.commitStampPlacement(pos);
  const selectTable = (tableName: string, multiSelect = false) => store.selectTable(tableName, multiSelect);
  const clearSelection = () => store.clearSelection();

  return {
    sqlCode,
    tables,
    relationships,
    positions,
    edgeOffsets,
    tableOrder,
    loadingProgress,
    errors,
    warnings,
    selectedTableNames,
    hoveredColumn,
    isStampActive,
    stampGhostPosition,
    parseSql,
    bringTableToFront,
    bringTablesToFront,
    startStampMode,
    cancelStampMode,
    toggleStampMode,
    setStampGhostPosition,
    commitStampPlacement,
    selectTable,
    clearSelection,
  };
}
