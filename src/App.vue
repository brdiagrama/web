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
        @selectionArea="handleSelectionArea"
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
              :class="{ 'selected': selectedTables.has(table.name) }"
              style="cursor: move;"
              @mousedown="(event) => startDrag(event, table.name)"
            >
              <!-- Retângulo base da tabela -->
              <rect 
                :width="tableWidth"
                :height="getTableHeight(table)"
                class="table-rect"
                :class="{ 'selected': selectedTables.has(table.name) }"
                rx="6"
              />
              
              <!-- Cabeçalho da tabela com path customizado -->
              <path 
                :d="`M0 6 Q0 0 6 0 L${tableWidth-6} 0 Q${tableWidth} 0 ${tableWidth} 6 L${tableWidth} ${headerHeight} L0 ${headerHeight} Z`"
                class="table-header-rect"
              />
              
              <text 
                :x="15"
                :y="22"
                class="table-title"
              >
                {{ table.name }}
              </text>
              
              <!-- Colunas com formato melhorado -->
              <g v-for="(col, colIndex) in table.columns" :key="colIndex">
                <!-- Ícone PK/FK -->
              <text 
                :x="15"
                :y="headerHeight + 20 + colIndex * rowHeight"
                font-size="10"
                font-weight="bold"
                
                :class="{ 
                  // Prioridade 1: É FK? (Isso inclui o caso PK+FK)
                  'fk-icon': col.isFk, 
                  // Prioridade 2: É PK, mas não é FK?
                  'pk-icon': col.isPk && !col.isFk
                }"
              >
                {{ 
                  // Lógica visual simplificada:
                  col.isFk ? 'FK' : (col.isPk ? 'PK' : '') 
                }}
              </text>
                
                <!-- Nome da coluna -->
                <text 
                  :x="col.isPk || col.isFk ? 40 : 15"
                  :y="headerHeight + 20 + colIndex * rowHeight"
                  class="col-text"
                  :font-weight="col.isPk ? 'bold' : 'normal'"
                >
                  {{ col.name }}
                </text>
                
                <!-- Tipo da coluna -->
                <text 
                  :x="tableWidth - 15"
                  :y="headerHeight + 20 + colIndex * rowHeight"
                  class="col-type"
                  text-anchor="end"
                >
                  {{ col.type }}
                </text>
              </g>
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

// Estado de seleção múltipla
const selectedTables = ref(new Set());

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

// Ordena colunas: PK primeiro, depois FK, depois as demais
const sortColumns = (columns) => {
  if (!columns) return [];
  
  const pk = columns.filter(c => c.isPk);
  const fk = columns.filter(c => c.isFk && !c.isPk);
  const others = columns.filter(c => !c.isPk && !c.isFk);
  
  return [...pk, ...fk, ...others];
};

// Constantes para renderização (conforme index.html anexado)
const tableWidth = 220;
const headerHeight = 35;
const rowHeight = 28;

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
  return headerHeight + (table.columns.length * rowHeight) + 10;
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
      throw new Error(errorData.error || 'Erro na resposta da API');
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
    const updatedRelationships = newRelationships.map(newRel => {
      const existing = relationships.value.find(r => r.id === newRel.id);
      return {
        ...newRel,
        vertices: existing?.vertices || [],
        auto: existing?.auto !== false
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
    const tableX2 = table.x + tableWidth;
    const tableY2 = table.y + tableHeight;
    
    // Verifica interseção
    const intersects = !(area.x2 < tableX1 || area.x1 > tableX2 || 
                         area.y2 < tableY1 || area.y1 > tableY2);
    
    if (intersects) {
      selectedTables.value.add(tableName);
    }
  }
  
  console.log('Tabelas selecionadas:', Array.from(selectedTables.value));
};

// --- Funções de Drag and Drop ---

const startDrag = (event, tableName) => {
  const svgElement = diagramCanvasRef.value?.svgRoot;
  if (!svgElement) return;

  // Se a tabela clicada não está na seleção, limpa a seleção e seleciona apenas ela
  if (!selectedTables.value.has(tableName)) {
    selectedTables.value.clear();
    selectedTables.value.add(tableName);
  }

  //Trazer tabela para frente
  const tableGroup = event.currentTarget; // O elemento <g> da tabela clicada
  const tablesLayer = tableGroup.parentNode; // O container <g class="tables">
  tablesLayer.appendChild(tableGroup); // Move para o final (renderiza por último = fica na frente)
 
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

  // Calcula o delta de movimento
  const draggedTable = tables.value[dragState.value.draggedTable];
  const deltaX = newX - draggedTable.x;
  const deltaY = newY - draggedTable.y;

  // Move todas as tabelas selecionadas
  selectedTables.value.forEach(tableName => {
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
  background: #f0f2f5;
  background-image: radial-gradient(#dfe6e9 1px, transparent 1px);
  background-size: 20px 20px;
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
   filter:
    drop-shadow(0 0 2px rgba(59, 130, 246, 0.3))
    drop-shadow(0 0 4px rgba(59, 130, 246, 0.35));
}

:deep(.table-rect) {
  transition: stroke 0.2s, stroke-width 0.2s, filter 0.2s;
}
</style>
