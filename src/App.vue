<template>
  <div class="app">
    <div class="editor-panel">
      <h1>Editor SQL</h1>
      <textarea 
        v-model="sqlCode"
        @input="handleSqlChange"
        class="sql-editor"
        placeholder="Digite seu código CREATE TABLE aqui..."
      ></textarea>
    </div>
    
    <div class="canvas-panel">
      <DiagramCanvas 
        ref="diagramCanvasRef"
        class="canvas-container"
      >        <!-- Definições SVG -->
        <defs>
         
         
        </defs>
          <!-- Debug: Mostrar informações dos dados -->
        <text v-if="!tables || Object.keys(tables).length === 0" x="50" y="50" fill="#666" font-size="14">
          {{ debugMessage }}
        </text>
        
        <!-- Conteúdo do diagrama será renderizado aqui -->
        <g v-if="tables && Object.keys(tables).length > 0">
          <!-- Renderiza relacionamentos (linhas) -->
         <!-- Renderiza relacionamentos (linhas) -->
        <g class="relationships">
          <RelationshipLine
            v-for="(rel, index) in relationships"
            :key="rel.id || index"
            :relationship="rel"
            :from-table="tables[rel.fromTable]"
            :to-table="tables[rel.toTable]"
            :table-width="tableWidth"
            :header-height="headerHeight"
            :row-height="rowHeight"
            @update="updateRelationship"
          />
        </g>
          
          <!-- Renderiza tabelas -->
          <g class="tables">            <g 
              v-for="table in tables" 
              :key="table.name"
              :transform="`translate(${table.x}, ${table.y})`"
              class="table-group"
              style="cursor: move;"
              @mousedown="(event) => startDrag(event, table.name)"
            >
              <!-- Retângulo da tabela -->
              <rect 
                :width="tableWidth"
                :height="getTableHeight(table)"
                class="table-rect"
                rx="5"
              />
              
              <!-- Cabeçalho da tabela -->
              <rect 
                :width="tableWidth"
                :height="headerHeight"
                class="table-header-rect"
                rx="5"
              />
              
              <text 
                :x="15"
                :y="20"
                class="table-header"
              >
                {{ table.name }}
              </text>
              
              <!-- Colunas -->
              <text 
                v-for="(col, colIndex) in table.columns" 
                :key="colIndex"
                :x="15"
                :y="headerHeight + 20 + colIndex * rowHeight"
                :class="getColumnClass(col)"
              >
                {{ formatColumn(col) }}
              </text>
            </g>
          </g>
        </g>
      </DiagramCanvas>
      
      <DiagramToolbar :diagramRef="diagramCanvasRef" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import DiagramCanvas from './components/DiagramCanvas.vue';
import DiagramToolbar from './components/DiagramToolbar.vue';
import { MockApiService } from './services/mockApi.service.js';
import RelationshipLine from './components/RelationshipLine.vue';

// Refs dos componentes
const diagramCanvasRef = ref(null);
const sqlCode = ref('');

// Estado dos dados do diagrama
const tables = ref({});
const relationships = ref([]);

// Estado para drag and drop
const dragState = ref({
  isDragging: false,
  draggedTable: null,
  offset: { x: 0, y: 0 }
});

// Debug message
const debugMessage = computed(() => {
  if (!sqlCode.value.trim()) {
    return 'Digite SQL no editor à esquerda para gerar o diagrama';
  }
  if (Object.keys(tables.value).length === 0) {
    return 'Processando SQL... Se persistir, verifique o console (F12)';
  }
  return '';
});

// Constantes para renderização
const tableWidth = 200;
const headerHeight = 30;
const rowHeight = 22;

// Exemplo inicial de SQL
const defaultSql = `CREATE TABLE usuarios (
    id INT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE
);

CREATE TABLE posts (
    id INT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    conteudo TEXT,
    usuario_id INT,
    CONSTRAINT fk_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);`;

// Função debounce para evitar muitas chamadas da API
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), delay);
  };
};

// Calcula a altura total de uma tabela
const getTableHeight = (table) => {
  return headerHeight + table.columns.length * rowHeight + 10;
};

// Determina as classes CSS da coluna baseado nas propriedades
const getColumnClass = (col) => {
  const classes = ['column-text'];
  if (col.isPk) classes.push('column-pk');
  if (col.isFk) classes.push('column-fk');
  return classes.join(' ');
};

// Formata o texto da coluna com ícones
const formatColumn = (col) => {
  let content = `${col.name} (${col.type})`;
  if (col.isPk) content = '🔑 ' + content;
  if (col.isFk) content = '🔗 ' + content;
  return content;
};

// Calcula o path SVG para uma linha de relacionamento
const calculatePath = (rel) => {
  const fromTable = tables.value[rel.fromTable];
  const toTable = tables.value[rel.toTable];
  
  if (!fromTable || !toTable) return '';
  
  const x1 = fromTable.x + tableWidth / 2;
  const y1 = fromTable.y + getTableHeight(fromTable) / 2;
  const x2 = toTable.x + tableWidth / 2;
  const y2 = toTable.y + getTableHeight(toTable) / 2;
  
  return `M ${x1} ${y1} C ${x1 + 100} ${y1}, ${x2 - 100} ${y2}, ${x2} ${y2}`;
};

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
      throw new Error(errorData.error || 'Erro na resposta da API');
    }

    const { tables: newTables, relationships: newRelationships } = await response.json();
    
    // Preserva posições das tabelas existentes
    const updatedTables = {};
    for (const tableName in newTables) {
      const oldTable = tables.value[tableName];
      updatedTables[tableName] = {
        ...newTables[tableName],
        x: oldTable?.x || newTables[tableName].x,
        y: oldTable?.y || newTables[tableName].y,
      };
    }
            tables.value = updatedTables;
    
    // Preserva vértices customizados dos relacionamentos existentes
    const updatedRelationships = newRelationships.map(newRel => {
      const existing = relationships.value.find(r => r.id === newRel.id);
      return {
        ...newRel,
        vertices: existing?.vertices || [],
        auto: existing?.auto !== false
      };
    });
    
    relationships.value = updatedRelationships;
    
    console.log('🎨 Tabelas atualizadas no estado:', tables.value);
    console.log('🔗 Relacionamentos atualizados:', relationships.value);
    console.log('📊 Total de relacionamentos:', relationships.value.length);
    
  } catch (error) {
    console.error("❌ Erro ao processar diagrama:", error);
  }
};

// Handler com debounce para mudanças no SQL
const handleSqlChange = debounce(updateDiagram, 500);

// --- Funções de Drag and Drop ---

const startDrag = (event, tableName) => {
  const svgElement = diagramCanvasRef.value?.svgRoot;
  if (!svgElement) return;

  dragState.value.isDragging = true;
  dragState.value.draggedTable = tableName;

  // Calcula o offset do mouse relativo à posição da tabela
  const ctm = svgElement.getScreenCTM();
  const table = tables.value[tableName];
  
  dragState.value.offset.x = (event.clientX - ctm.e) / ctm.a - table.x;
  dragState.value.offset.y = (event.clientY - ctm.f) / ctm.d - table.y;

  // Adiciona event listeners globais para mousemove e mouseup
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', endDrag);
  
  // Evita seleção de texto durante o drag
  event.preventDefault();
};

const handleDrag = (event) => {
  if (!dragState.value.isDragging || !dragState.value.draggedTable) return;

  const svgElement = diagramCanvasRef.value?.svgRoot;
  if (!svgElement) return;

  const ctm = svgElement.getScreenCTM();
  const newX = (event.clientX - ctm.e) / ctm.a - dragState.value.offset.x;
  const newY = (event.clientY - ctm.f) / ctm.d - dragState.value.offset.y;

  // Atualiza a posição da tabela
  const tableName = dragState.value.draggedTable;
  if (tables.value[tableName]) {
    tables.value[tableName].x = newX;
    tables.value[tableName].y = newY;
  }
};

const endDrag = () => {
  dragState.value.isDragging = false;
  dragState.value.draggedTable = null;

  // Remove event listeners globais
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', endDrag);
};

// --- Funções para Relacionamentos Avançados ---

const updateRelationship = (relationshipId, updates) => {
  const rel = relationships.value.find(r => r.id === relationshipId);
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
    y: (screenY - ctm.f) / ctm.d
  };
};
// Inicialização
onMounted(() => {
  sqlCode.value = defaultSql;
  updateDiagram();
});
</script>

<style scoped>
:root {
  /* Tema Claro (padrão) */
  --ref-color: #d3d3d3;
  --ref-highlight-color: #619bcc;
  --control-point-color: #000000;
  --control-point-stroke: #619bcc;
}

/* Tema Escuro (opcional futuro) */
@media (prefers-color-scheme: dark) {
  :root {
    --ref-color: #9b9ca4;
    --ref-highlight-color: #3ea8de;
    --control-point-color: #d7d7d9;
    --control-point-stroke: #3ea8de;
  }
}

.app {
  display: flex;
  height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.editor-panel {
  width: 40%;
  background-color: #282c34;
  display: flex;
  flex-direction: column;
}

.editor-panel h1 {
  color: #fff;
  padding: 15px 20px;
  margin: 0;
  font-size: 1.2em;
  background-color: #1e2228;
}

.sql-editor {
  flex: 1;
  background-color: #282c34;
  color: #abb2bf;
  border: none;
  padding: 20px;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 16px;
  line-height: 1.5;
  resize: none;
}

.sql-editor:focus {
  outline: none;
}

.canvas-panel {
  flex: 1;
  position: relative;
  background-color: #fdfdfd;
  border-left: 2px solid #444;
}

.canvas-container {
  width: 100%;
  height: 100%;
}

/* Estilos SVG para o diagrama */
:deep(.table-rect) {
  fill: #ffffff;
  stroke: #dfe6f0;
  stroke-width: 1.5px;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
}

:deep(.table-header-rect) {
  fill: #f0f4f8;
}

:deep(.table-header) {
  font-weight: bold;
  font-size: 14px;
  fill: #333;
}

:deep(.column-text) {
  font-size: 13px;
  fill: #444;
}

:deep(.column-pk) {
  fill: #c792ea;
  font-weight: bold;
}

:deep(.column-fk) {
  fill: #89ddff;
  font-style: italic;
}

:deep(.relationship-line) {
  stroke: #5c6773;
  stroke-width: 2px;
  fill: none;
  marker-end: url(#arrowhead);
}

:deep(.table-group) {
  cursor: move;
  transition: filter 0.2s ease;
}

:deep(.table-group:hover) {
  filter: drop-shadow(0 6px 12px rgba(0,0,0,0.15));
}

:deep(.table-group:active) {
  cursor: grabbing;
}
</style>
