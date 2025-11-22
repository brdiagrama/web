<template>
  <div class="app">
    <div 
      class="editor-panel" 
      :class="{ 'no-transition': isResizing, 'panel-hidden': !isEditorVisible }"
      :style="{ width: isEditorVisible ? editorWidth + 'px' : '0px' }"
    >
      <div class="editor-header">
        <h1>Editor SQL</h1>
        <button class="icon-btn" @click="toggleEditor" title="Ocultar Editor">❮</button>
      </div>

      <SqlEditor 
        v-model="sqlCode" 
        @update:model-value="handleSqlChange"
      />
    </div>

    <div v-if="!isEditorVisible" class="collapsed-sidebar" @click="toggleEditor">
      <button class="icon-btn expand-btn" title="Abrir Editor">❯</button>
    </div>

    <div v-show="isEditorVisible" class="resizer-handle" @mousedown="startResize"></div>

    <div class="canvas-panel">
      <DiagramCanvas
        ref="diagramCanvasRef"
        class="canvas-container"
        @selectionArea="handleSelectionArea"
        @selectionSelecting="handleSelectionArea"
      >
        <!-- Definições SVG -->
        <defs> </defs>
        <!-- Debug: Mostrar informações dos dados -->
        <text
          v-if="!tables || Object.keys(tables).length === 0"
          x="50"
          y="50"
          fill="#666"
          font-size="14"
        >
          {{ debugMessage }}
        </text>
        <g v-if="tables && Object.keys(tables).length > 0">
          <g class="relationships-back" ref="relationshipsBack">
            <RelationshipLine
              v-for="(rel, index) in inactiveRelationships"
              :key="rel.id || index"
              :relationship="rel"
              :from-table="tables[rel.fromTable]"
              :to-table="tables[rel.toTable]"
              :table-width="getTableWidth(tables[rel.fromTable])"
              :from-table-width="getTableWidth(tables[rel.fromTable])"
              :to-table-width="getTableWidth(tables[rel.toTable])"
              :header-height="headerHeight"
              :row-height="rowHeight"
              :selected-tables="selectedTables"
              :hovered-column="hoveredColumn"
              @update="updateRelationship"
            />
          </g>

          <g class="tables-unselected">
            <g
              v-for="table in unselectedTablesList"
              :key="table.name"
              :transform="`translate(${table.x}, ${table.y})`"
              class="table-group"
              style="cursor: grab"
              @mousedown="(event) => startDrag(event, table.name)"
            >
              <rect
                :width="getTableWidth(table)"
                :height="getTableHeight(table)"
                class="table-rect"
                rx="6"
              />
              <path
                :d="`M0 6 Q0 0 6 0 L${getTableWidth(table) - 6} 0 Q${getTableWidth(
                  table
                )} 0 ${getTableWidth(table)} 6 L${getTableWidth(
                  table
                )} ${headerHeight} L0 ${headerHeight} Z`"
                class="table-header-rect"
              />
              <text :x="15" :y="22" class="table-title">{{ table.name }}</text>
              <g v-for="(col, colIndex) in table.columns" :key="colIndex">
                <!-- Retângulo invisível para aumentar área de hover -->
                <rect
                  v-if="col.isPk || col.isFk"
                  :x="0"
                  :y="headerHeight + colIndex * rowHeight"
                  :width="getTableWidth(table) - 1"
                  :height="rowHeight"
                  fill="transparent"
                  class="column-hover-area"
                  @mouseenter="
                    handleColumnHover({
                      tableName: table.name,
                      columnName: col.name,
                      isHovering: true,
                      isPk: col.isPk,
                      isFk: col.isFk,
                      refTable: col.refTable,
                    })
                  "
                  @mouseleave="handleColumnHover({ isHovering: false })"
                />

                <!-- Background highlight - AGORA COLADO NO HEADER -->
                <rect
                  v-if="
                    (col.isPk || col.isFk) &&
                    (isColumnHovered(table.name, col.name) ||
                      isTableColumnHighlighted(table.name, col))
                  "
                  :x="0.6"
                  :y="headerHeight + colIndex * rowHeight"
                  :width="getTableWidth(table) - 1.2"
                  :height="
                    colIndex === table.columns.length - 1 ? rowHeight - 0.6 : rowHeight
                  "
                  :fill="col.isPk ? '#EDFEFC' : '#eff6ff'"
                  :rx="colIndex === table.columns.length - 1 ? 4 : 0"
                  style="pointer-events: none"
                />

                <text
                  :x="15"
                  :y="headerHeight + 20 + colIndex * rowHeight"
                  font-size="10"
                  font-weight="bold"
                  :class="{ 'fk-icon': col.isFk, 'pk-icon': col.isPk && !col.isFk }"
                  style="pointer-events: none"
                >
                  {{ col.isFk ? "FK" : col.isPk ? "PK" : "" }}
                </text>
                <text
                  :x="col.isPk || col.isFk ? 40 : 15"
                  :y="headerHeight + 20 + colIndex * rowHeight"
                  class="col-text"
                  :font-weight="col.isPk ? 'bold' : 'normal'"
                  style="pointer-events: none"
                >
                  {{ col.name }}
                </text>
                <text
                  :x="getTableWidth(table) - 15"
                  :y="headerHeight + 20 + colIndex * rowHeight"
                  class="col-type"
                  text-anchor="end"
                  style="pointer-events: none"
                >
                  {{ col.type }}
                </text>
                <g
                  v-if="
                    (col.isPk || col.isFk) &&
                    (isColumnHovered(table.name, col.name) ||
                      isTableColumnHighlighted(table.name, col))
                  "
                  style="pointer-events: none"
                >
                  <!-- Linha superior (sempre renderiza) -->
                  <line
                    :x1="0.6"
                    :y1="headerHeight + colIndex * rowHeight"
                    :x2="getTableWidth(table) - 0.6"
                    :y2="headerHeight + colIndex * rowHeight"
                    :stroke="col.isPk ? '#70D8CC' : '#93c5fd'"
                    stroke-width="1.1"
                  />

                  <!-- Linha inferior (só se NÃO for a última coluna) -->
                  <line
                    v-if="colIndex < table.columns.length - 1"
                    :x1="0.6"
                    :y1="headerHeight + (colIndex + 1) * rowHeight"
                    :x2="getTableWidth(table) - 0.6"
                    :y2="headerHeight + (colIndex + 1) * rowHeight"
                    :stroke="col.isPk ? '#70D8CC' : '#93c5fd'"
                    stroke-width="1.1"
                  />
                </g>
              </g>
            </g>
          </g>

          <g class="relationships-front" ref="relationshipsFront">
            <RelationshipLine
              v-for="(rel, index) in activeRelationships"
              :key="rel.id || index"
              :relationship="rel"
              :from-table="tables[rel.fromTable]"
              :to-table="tables[rel.toTable]"
              :table-width="getTableWidth(tables[rel.fromTable])"
              :from-table-width="getTableWidth(tables[rel.fromTable])"
              :to-table-width="getTableWidth(tables[rel.toTable])"
              :header-height="headerHeight"
              :row-height="rowHeight"
              :selected-tables="selectedTables"
              :hovered-column="hoveredColumn"
              @update="updateRelationship"
            />
          </g>

          <g class="tables-selected">
            <g
              v-for="table in selectedTablesList"
              :key="table.name"
              :transform="`translate(${table.x}, ${table.y})`"
              class="table-group selected"
              style="cursor: grabbing"
              @mousedown="(event) => startDrag(event, table.name)"
            >
              <rect
                :width="getTableWidth(table)"
                :height="getTableHeight(table)"
                class="table-rect selected"
                rx="6"
              />
              <path
                :d="`M0 6 Q0 0 6 0 L${getTableWidth(table) - 6} 0 Q${getTableWidth(
                  table
                )} 0 ${getTableWidth(table)} 6 L${getTableWidth(
                  table
                )} ${headerHeight} L0 ${headerHeight} Z`"
                class="table-header-rect"
              />
              <text :x="15" :y="22" class="table-title">{{ table.name }}</text>
              <g v-for="(col, colIndex) in table.columns" :key="colIndex">
                <!-- Retângulo invisível para aumentar área de hover -->
                <rect
                  v-if="col.isPk || col.isFk"
                  :x="0"
                  :y="headerHeight + colIndex * rowHeight"
                  :width="getTableWidth(table)"
                  :height="rowHeight"
                  fill="transparent"
                  class="column-hover-area"
                  @mouseenter="
                    handleColumnHover({
                      tableName: table.name,
                      columnName: col.name,
                      isHovering: true,
                      isPk: col.isPk,
                      isFk: col.isFk,
                      refTable: col.refTable,
                    })
                  "
                  @mouseleave="handleColumnHover({ isHovering: false })"
                />

                <!-- Background highlight - AGORA COLADO NO HEADER -->
                <rect
                  v-if="
                    (col.isPk || col.isFk) &&
                    (isColumnHovered(table.name, col.name) ||
                      isTableColumnHighlighted(table.name, col))
                  "
                  :x="2"
                  :y="headerHeight + colIndex * rowHeight"
                  :width="getTableWidth(table) - 3.4"
                  :height="
                    colIndex === table.columns.length - 1 ? rowHeight - 2 : rowHeight
                  "
                  :fill="col.isPk ? '#EDFEFC' : '#eff6ff'"
                  :rx="colIndex === table.columns.length - 1 ? 6 : 3"
                  style="pointer-events: none"
                />

                <text
                  :x="15"
                  :y="headerHeight + 20 + colIndex * rowHeight"
                  font-size="10"
                  font-weight="bold"
                  :class="{ 'fk-icon': col.isFk, 'pk-icon': col.isPk && !col.isFk }"
                  style="pointer-events: none"
                >
                  {{ col.isFk ? "FK" : col.isPk ? "PK" : "" }}
                </text>
                <text
                  :x="col.isPk || col.isFk ? 40 : 15"
                  :y="headerHeight + 20 + colIndex * rowHeight"
                  class="col-text"
                  :font-weight="col.isPk ? 'bold' : 'normal'"
                  style="pointer-events: none"
                >
                  {{ col.name }}
                </text>
                <text
                  :x="getTableWidth(table) - 15"
                  :y="headerHeight + 20 + colIndex * rowHeight"
                  class="col-type"
                  text-anchor="end"
                  style="pointer-events: none"
                >
                  {{ col.type }}
                </text>

                <g
                  v-if="
                    (col.isPk || col.isFk) &&
                    (isColumnHovered(table.name, col.name) ||
                      isTableColumnHighlighted(table.name, col))
                  "
                  style="pointer-events: none"
                >
                  <!-- Linha superior (sempre renderiza) -->
                  <line
                    :x1="1.28"
                    :y1="headerHeight + colIndex * rowHeight"
                    :x2="getTableWidth(table) - 1.28"
                    :y2="headerHeight + colIndex * rowHeight"
                    :stroke="col.isPk ? '#70D8CC' : '#93c5fd'"
                    stroke-width="2"
                  />

                  <!-- Linha inferior (só se NÃO for a última coluna) -->
                  <line
                    v-if="colIndex < table.columns.length - 1"
                    :x1="1.28"
                    :y1="headerHeight + (colIndex + 1) * rowHeight"
                    :x2="getTableWidth(table) - 1.28"
                    :y2="headerHeight + (colIndex + 1) * rowHeight"
                    :stroke="col.isPk ? '#70D8CC' : '#93c5fd'"
                    stroke-width="2"
                  />
                </g>
              </g>
            </g>
          </g>
        </g>
      </DiagramCanvas>

      <DiagramToolbar :diagramRef="diagramCanvasRef" />
    </div>
    <div v-if="isResizing" class="global-resize-overlay"></div>
  </div>
  
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import DiagramCanvas from "./components/DiagramCanvas.vue";
import DiagramToolbar from "./components/DiagramToolbar.vue";
import { MockApiService } from "./services/mockApi.service.js";
import RelationshipLine from "./components/RelationshipLine.vue";
import SqlEditor from "./components/SqlEditor.vue";

const editorWidth = ref(550); // Largura inicial do editor
const isResizing = ref(false);
const isEditorVisible = ref(true);

const MIN_WIDTH = 300;
const MAX_WIDTH = 800;
const SNAP_THRESHOLD = 300;

const startResize = () => {
  // Bloqueia resize no mobile (largura da tela < 768px)
  if (window.innerWidth < 768) return;

  isResizing.value = true;
  document.body.style.cursor = "col-resize"; // Muda cursor globalmente

  document.body.classList.add('is-resizing-global');

  window.addEventListener("mousemove", handleResize);
  window.addEventListener("mouseup", stopResize);
};

const handleResize = (e) => {
  if (!isResizing.value) return;

  // Pega a posição X do mouse
  const currentX = e.clientX;
  
  // Ponto de gatilho (se passar daqui para a esquerda, fecha)
  const SNAP_THRESHOLD = 150; 

  // 1. LÓGICA ELÁSTICA: FECHAR/ABRIR DINAMICAMENTE
  if (currentX < SNAP_THRESHOLD) {
    // Se o mouse cruzou a linha da esquerda, "esconde" o editor visualmente
    // MAS continua ouvindo o movimento (não chamamos stopResize)
    if (isEditorVisible.value) {
      isEditorVisible.value = false;
    }
  } else {
    // Se o mouse voltou para a direita, "mostra" o editor de novo
    if (!isEditorVisible.value) {
      isEditorVisible.value = true;
    }

    // 2. CÁLCULO DA LARGURA (Só atualiza se estiver visível)
    let newWidth = currentX;

    // Clamp (Trava nos limites Min e Max)
    if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
    if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;

    editorWidth.value = newWidth;
  }
};

const stopResize = () => {
  isResizing.value = false;
  document.body.style.cursor = ""; // Reseta cursor
  document.body.classList.remove('is-resizing-global');
  window.removeEventListener("mousemove", handleResize);
  window.removeEventListener("mouseup", stopResize);
};

// Toggle para o botão de ocultar/mostrar
const toggleEditor = () => {
  isEditorVisible.value = !isEditorVisible.value;
};

const unselectedTablesList = computed(() => {
  return Object.values(tables.value).filter(
    (table) => !selectedTables.value.has(table.name)
  );
});

// Filtra tabelas que ESTÃO selecionadas (Ficam no topo absoluto)
const selectedTablesList = computed(() => {
  return Object.values(tables.value).filter((table) =>
    selectedTables.value.has(table.name)
  );
});

const activeRelationships = computed(() => {
  return relationships.value.filter(
    (rel) =>
      selectedTables.value.has(rel.fromTable) || selectedTables.value.has(rel.toTable)
  );
});

const inactiveRelationships = computed(() => {
  return relationships.value.filter(
    (rel) =>
      !selectedTables.value.has(rel.fromTable) && !selectedTables.value.has(rel.toTable)
  );
});

// Refs dos componentes
const diagramCanvasRef = ref(null);
const sqlCode = ref("");

// Estado dos dados do diagrama
const tables = ref({});
const relationships = ref([]);

// Estado para drag and drop
const dragState = ref({
  isDragging: false,
  draggedTable: null,
  offset: { x: 0, y: 0 },
});

// Estado de seleção múltipla
const selectedTables = ref(new Set());
const hoveredColumn = ref(null);

const isTableColumnHighlighted = (tableName, column) => {
  // Só destaca PK/FK automaticamente se houver múltiplas tabelas selecionadas
  if (selectedTables.value.size <= 1) return false;
  return selectedTables.value.has(tableName) && (column.isPk || column.isFk);
};

const highlightedColumns = computed(() => {
  const highlighted = new Set();

  if (!hoveredColumn.value) return highlighted;

  const { tableName, columnName, isFk, isPk } = hoveredColumn.value;

  // Adiciona a coluna atual
  highlighted.add(`${tableName}.${columnName}`);

  // Se for FK, encontra a PK de destino
  if (isFk) {
    relationships.value.forEach((rel) => {
      if (rel.fromTable === tableName && rel.fromCol === columnName) {
        highlighted.add(`${rel.toTable}.${rel.toCol}`);
      }
    });
  }

  // Se for PK, encontra todas as FKs que apontam para ela
  if (isPk) {
    relationships.value.forEach((rel) => {
      if (rel.toTable === tableName && rel.toCol === columnName) {
        highlighted.add(`${rel.fromTable}.${rel.fromCol}`);
      }
    });
  }

  return highlighted;
});

const isColumnHovered = (tableName, columnName) => {
  return highlightedColumns.value.has(`${tableName}.${columnName}`);
};

// Debug message
const debugMessage = computed(() => {
  if (!sqlCode.value.trim()) {
    return "Digite SQL no editor à esquerda para gerar o diagrama";
  }
  if (Object.keys(tables.value).length === 0) {
    return "Processando SQL... Se persistir, verifique o console (F12)";
  }
  return "";
});

// Ordena colunas: PK primeiro, depois FK, depois as demais
const sortColumns = (columns) => {
  if (!columns) return [];

  const pk = columns.filter((c) => c.isPk);
  const fk = columns.filter((c) => c.isFk && !c.isPk);
  const others = columns.filter((c) => !c.isPk && !c.isFk);

  return [...pk, ...fk, ...others];
};

// Constantes para renderização (conforme index.html anexado)
const headerHeight = 35;
const rowHeight = 32;

const MIN_TABLE_WIDTH = 220;
const HORIZONTAL_PADDING = 30;

const getTableWidth = (table) => {
  let maxWidth = MIN_TABLE_WIDTH;

  const nameLength = table.name.length * 8 + HORIZONTAL_PADDING;
  maxWidth = Math.max(maxWidth, nameLength);

  table.columns.forEach((col) => {
    const colNameLength = col.name.length * 7 + (col.isPk || col.isFk ? 40 : 0);

    const colTypeLength = col.type.length * 7;

    const totalRowWidth = colNameLength + colTypeLength + HORIZONTAL_PADDING + 20;

    maxWidth = Math.max(maxWidth, totalRowWidth);
  });

  return Math.ceil(maxWidth);
};

// Exemplo inicial de SQL
const defaultSql = `CREATE TABLE users (
  id INT PRIMARY KEY,
  username VARCHAR(50),
  email VARCHAR(100),
  created_at TIMESTAMP
);

CREATE TABLE posts (
  id INT PRIMARY KEY,
  user_id INT,
  title VARCHAR(200),
  body TEXT,
  status VARCHAR(20),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE follows (
  follower_id INT,
  followed_id INT,
  created_at TIMESTAMP,
  FOREIGN KEY (follower_id) REFERENCES users(id),
  FOREIGN KEY (followed_id) REFERENCES users(id)
);`;

// Função debounce para evitar muitas chamadas da API
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), delay);
  };
};

// Calcula a altura total de uma tabela (conforme index.html)
const getTableHeight = (table) => {
  return headerHeight + table.columns.length * rowHeight + 0;
};

// Funções de formatação removidas - agora usa renderização direta no template

// Função para atualizar o diagrama via API
// Função para atualizar o diagrama via API
const updateDiagram = async () => {
  if (!sqlCode.value.trim()) {
    tables.value = {};
    relationships.value = [];
    return;
  }
  try {
    // Usa MockApiService durante desenvolvimento
    // Em produção, isso seria uma chamada fetch real para /api/parse
    const response = await MockApiService.parse(sqlCode.value);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erro na resposta da API");
    }

    const { tables: newTables, relationships: newRelationships } = await response.json();

    // Preserva posições das tabelas existentes e ordena colunas
    const updatedTables = {};
    for (const tableName in newTables) {
      const oldTable = tables.value[tableName];
      updatedTables[tableName] = {
        ...newTables[tableName],
        columns: sortColumns(newTables[tableName].columns),
        x: oldTable?.x || newTables[tableName].x,
        y: oldTable?.y || newTables[tableName].y,
      };
    }
    tables.value = updatedTables;

    // Preserva vértices customizados dos relacionamentos existentes
    const updatedRelationships = newRelationships.map((newRel) => {
      const existing = relationships.value.find((r) => r.id === newRel.id);
      return {
        ...newRel,
        vertices: existing?.vertices || [],
        auto: existing?.auto !== false,
      };
    });

    relationships.value = updatedRelationships;
  } catch (error) {
    console.error("❌ Erro ao processar diagrama:", error);
  }
};

// Handler com debounce para mudanças no SQL
const handleSqlChange = debounce(updateDiagram, 500);

// --- Funções de Seleção Múltipla ---

const handleSelectionArea = (area) => {
  // Limpar seleção anterior
  selectedTables.value.clear();

  // Verificar quais tabelas estão dentro da área de seleção
  for (const tableName in tables.value) {
    const table = tables.value[tableName];
    const tableHeight = getTableHeight(table);

    // Verificar se a tabela intersecta com a área de seleção
    const tableX1 = table.x;
    const tableY1 = table.y;
    const tableX2 = table.x + getTableWidth(table);
    const tableY2 = table.y + tableHeight;

    // Verifica interseção
    const intersects = !(
      area.x2 < tableX1 ||
      area.x1 > tableX2 ||
      area.y2 < tableY1 ||
      area.y1 > tableY2
    );

    if (intersects) {
      selectedTables.value.add(tableName);
    }
  }

  console.log("Tabelas selecionadas:", Array.from(selectedTables.value));
};

const handleColumnHover = (data) => {
  hoveredColumn.value = data.isHovering ? data : null;
};

// --- Funções de Drag and Drop ---

const startDrag = (event, tableName) => {
  if (!event.ctrlKey && !event.metaKey) {
    event.preventDefault();
  }

  const svgElement = diagramCanvasRef.value?.svgRoot;
  if (!svgElement) return;

  if (event.ctrlKey || event.metaKey) {
    if (selectedTables.value.has(tableName)) {
      selectedTables.value.delete(tableName);
      return;
    } else {
      selectedTables.value.add(tableName);
    }
  } else {
    if (!selectedTables.value.has(tableName)) {
      selectedTables.value.clear();
      selectedTables.value.add(tableName);
    }
  }

  dragState.value.isDragging = true;
  dragState.value.draggedTable = tableName;

  const ctm = svgElement.getScreenCTM();
  const table = tables.value[tableName];

  dragState.value.offset.x = (event.clientX - ctm.e) / ctm.a - table.x;
  dragState.value.offset.y = (event.clientY - ctm.f) / ctm.d - table.y;

  document.addEventListener("mousemove", handleDrag);
  document.addEventListener("mouseup", endDrag);
};

const handleDrag = (event) => {
  if (!dragState.value.isDragging || !dragState.value.draggedTable) return;

  const svgElement = diagramCanvasRef.value?.svgRoot;
  if (!svgElement) return;

  const ctm = svgElement.getScreenCTM();
  const newX = (event.clientX - ctm.e) / ctm.a - dragState.value.offset.x;
  const newY = (event.clientY - ctm.f) / ctm.d - dragState.value.offset.y;

  // Calcula o delta de movimento
  const draggedTable = tables.value[dragState.value.draggedTable];
  const deltaX = newX - draggedTable.x;
  const deltaY = newY - draggedTable.y;

  // Move todas as tabelas selecionadas
  selectedTables.value.forEach((tableName) => {
    if (tables.value[tableName]) {
      tables.value[tableName].x += deltaX;
      tables.value[tableName].y += deltaY;
    }
  });
};

const endDrag = () => {
  dragState.value.isDragging = false;
  dragState.value.draggedTable = null;

  // Remove event listeners globais
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", endDrag);
};

// --- Funções para Relacionamentos Avançados ---

const updateRelationship = (relationshipId, updates) => {
  const rel = relationships.value.find((r) => r.id === relationshipId);
  if (rel) {
    Object.assign(rel, updates);
  }
};

const snapToGrid = (value) => {
  const gridSize = 20; // ou usar da store
  return Math.round(value / gridSize) * gridSize;
};

const screenToSVG = (screenX, screenY) => {
  const svgElement = diagramCanvasRef.value?.svgRoot;
  if (!svgElement) return { x: screenX, y: screenY };

  const ctm = svgElement.getScreenCTM();
  return {
    x: (screenX - ctm.e) / ctm.a,
    y: (screenY - ctm.f) / ctm.d,
  };
};
// Inicialização
onMounted(() => {
  sqlCode.value = defaultSql;
  updateDiagram();
});
</script>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #0F172A; /* Cor de fundo geral */
}

.editor-panel {
  display: flex;
  flex-direction: column;
  background-color: #0F172A;
  flex-shrink: 0;
  
  /* 🔥 AQUI ESTÁ A MÁGICA */
  /* Animamos a largura, a opacidade e as margens */
  transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  /* Essencial: Esconde o conteúdo enquanto encolhe */
  overflow: hidden;
  white-space: nowrap;
  
  /* Garante que ele possa chegar a zero */
  min-width: 0; 
  
  /* Borda direita (se houver) */
  border-right: 1px solid #1E293B; 
}


.editor-panel.panel-hidden {
  border-right: none;
}
.editor-panel.no-transition {
  /* 0.1s = Muito rápido (sensação de peso)
     ease-out = Começa rápido e desacelera no final (para "encaixar" no mouse)
  */
  transition: width 0.1s ease-out !important; 
  will-change: width; /* Avisa o navegador para usar aceleração de GPU */
}

.editor-panel.no-transition:not(.panel-hidden) {
  /* Velocidade de arraste (Rápida para acompanhar o mouse) */
  transition: width 0.1s ease-out !important; 
  will-change: width;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* 🔥 MUDANÇA: Header agora é MAIS ESCURO que o editor (Slate 950) */
  background-color: #020617; 
  padding: 0 15px;
  height: 40px;
  /* Borda sutil para separar */
  border-bottom: 1px solid #1E293B;
  
  /* 🔥 IMPEDE SELEÇÃO DE TEXTO */
  user-select: none;
  -webkit-user-select: none; 
}

.editor-header h1 {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  /* Verde Água da Marca */
  color: #5EEAD4; 
  font-weight: 700;
  margin: 0;
}

.editor-header h1 {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  /* Verde Água da Marca */
  color: #5EEAD4; 
  font-weight: 700;
  margin: 0;
}

.editor-panel :deep(.editor-container) {
  flex: 1;
  height: calc(100% - 40px); /* Altura total menos o header */
}

.resizer-handle {
  width: 5px;
  /* Mesma cor do fundo para ficar invisível até passar o mouse */
  background-color: #0F172A; 
  cursor: col-resize;
  transition: background 0.2s, width 0.2s; /* Animação suave */
  z-index: 20; /* Garante que fique acima de tudo */
  flex-shrink: 0;
  
  /* Borda sutil na esquerda para separar do editor */
  border-left: 1px solid #1E293B; 
}

.resizer-handle:hover,
.resizer-handle:active {
  /* 🔥 MUDANÇA: Agora brilha em VERDE ÁGUA (Teal) */
  background-color: #2DD4BF; 
  /* Fica um pouquinho mais largo pra facilitar o clique */
  width: 7px; 
}
.icon-btn {
  background: none;
  border: none;
  color: #94A3B8; /* Cinza claro */
  cursor: pointer;
  font-size: 16px;
  padding: 5px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* 🔥 IMPEDE SELEÇÃO DO ÍCONE COMO TEXTO */
  user-select: none; 
}

.icon-btn:hover {
  background-color: #1E293B;
  color: #5EEAD4; /* Verde ao passar o mouse */
}

.icon-btn:hover {
  background-color: #3e4451;
  color: #fff;
}

.collapsed-sidebar {
  width: 40px;
  /* Fundo escuro igual ao Header */
  background-color: #020617; 
  border-right: 1px solid #1E293B;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 10px;
  cursor: pointer;
  
  /* 🔥 IMPEDE SELEÇÃO */
  user-select: none; 
}

.collapsed-sidebar:hover {
  background-color: #1E293B;
}

@media (max-width: 768px) {
  .app {
    flex-direction: column; /* Vira coluna no celular */
  }
  
  .editor-panel {
    width: 100% !important; /* Força largura total */
    height: 50%; /* Ocupa metade da tela se aberto */
    border-bottom: 2px solid #444;
  }
  
  .resizer-handle {
    display: none !important; /* Esconde a barra de arraste */
  }
  
  .collapsed-sidebar {
    width: 100%;
    height: 40px;
    flex-direction: row;
    justify-content: center;
    padding: 0;
    border-right: none;
    border-bottom: 1px solid #444;
  }
}

.canvas-panel {
  flex: 1;
  position: relative;
  background: #f0f2f5;
  background-image: radial-gradient(#dfe6e9 1px, transparent 1px);
  background-size: 20px 20px;
  transition: all 0.1s ease-out;
  border-left: 2px solid #444;
}

.canvas-container {
  width: 100%;
  height: 100%;
}

/* Estilos para seleção múltipla */
:deep(.table-group.selected .table-rect) {
  stroke: #192747ff;
  stroke-width: 2.5;
  filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.3))
    drop-shadow(0 0 4px rgba(59, 130, 246, 0.35));
}

:deep(.table-rect) {
  transition: stroke 0.2s, stroke-width 0.2s, filter 0.2s;
}

:deep(.column-hover-area) {
  cursor: pointer;
  transition: fill 0.15s;
}

:deep(.column-hover-area:hover) {
  fill: rgba(25, 39, 71, 0.05);
}

:deep(.hoverable-column:hover .col-text) {
  fill: #192747;
  font-weight: 600;
}

:deep(.hoverable-column:hover .pk-icon),
:deep(.hoverable-column:hover .fk-icon) {
  filter: drop-shadow(0 0 2px currentColor);
}

/* 🔥 BLOQUEIO GERAL DE SELEÇÃO DE TEXTO NO DIAGRAMA */
/* Isso impede que arrastar a tabela selecione o nome dela */
:deep(.table-group text),
:deep(.table-title),
:deep(.col-text),
:deep(.col-type),
:deep(.pk-icon),
:deep(.fk-icon) {
  user-select: none;
  -webkit-user-select: none; /* Para Safari/Chrome antigos */
  pointer-events: none; /* Garante que o mouse "atravesse" o texto e pegue a tabela */
}

.global-resize-overlay {
  position: fixed; /* Fixo na tela inteira */
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999; /* Fica acima de TUDO (Header, Editor, Canvas) */
  cursor: col-resize; /* Mantém o cursor de arrastar */
  background: transparent; /* Invisível */
  
  /* Garante que o navegador priorize essa div */
  user-select: none;
  touch-action: none;
}
</style>
