<template>
  <div class="app" role="application" aria-label="Gerador BrDiagrama">
    <main class="main-content">
      <aside
        v-if="!isMobile || activeTab === 'editor'"
        class="editor-panel"
        :class="{ 'no-transition': isResizing, 'panel-hidden': !isEditorVisible }"
        :style="{ width: isEditorVisible ? (isMobile ? '100%' : editorWidth + 'px') : '0px' }"
        role="complementary"
        aria-label="Painel do gerador SQL"
      >
        <header class="editor-header" role="banner">
          <div class="brand-area">
            <a href="/" aria-label="Voltar para a página inicial do BrDiagrama">
              <img :src="logoBrDiagrama" alt="BrDiagrama - Logo" class="editor-logo" width="auto" height="40" />
            </a>
          </div>

          <nav class="header-actions" aria-label="Ações do gerador">
            <!-- Badge de Erros (Vermelho) -->
            <button
              v-if="errorCount > 0"
              class="problems-badge has-errors"
              @click="toggleProblemsPanel"
              :title="`${errorCount} erro(s)`"
            >
              <XCircle :size="14" class="badge-icon error-icon" />
              <span class="badge-count">{{ errorCount }}</span>
            </button>

            <!-- Badge de Warnings (Amarelo) -->
            <button
              v-if="warningCount > 0"
              class="problems-badge has-warnings"
              @click="toggleProblemsPanel"
              :title="`${warningCount} aviso(s)`"
            >
              <AlertTriangle :size="14" class="badge-icon warning-icon" />
              <span class="badge-count">{{ warningCount }}</span>
            </button>

            <button class="icon-btn" @click="newProject" title="Novo Projeto / Limpar">
              <Eraser :size="18" />
            </button>

            <button class="icon-btn" @click="triggerImport" title="Importar SQL">
              <Upload :size="18" />
            </button>

            <div class="export-dropdown" ref="exportDropdownRef">
              <button
                class="icon-btn"
                :class="{ active: showExportDropdown }"
                @mouseenter="showExportDropdown = true"
                aria-label="Menu de exportação"
                :aria-expanded="showExportDropdown"
              >
                <Download :size="18" aria-hidden="true" />
              </button>

              <div
                v-if="showExportDropdown"
                class="dropdown-menu"
                role="menu"
                @mouseenter="showExportDropdown = true"
                @mouseleave="showExportDropdown = false"
              >
                <div class="dropdown-header">Exportar como...</div>
                <button @click="exportSql" class="dropdown-item">
                  <FileCode :size="16" class="dropdown-icon-lucide" />
                  <span>Arquivo SQL</span>
                </button>
                <button @click="exportDiagramPNG" class="dropdown-item">
                  <ImageIcon :size="16" class="dropdown-icon-lucide" />
                  <span>Imagem PNG</span>
                </button>
                <button @click="exportDiagramSVG" class="dropdown-item">
                  <Code2 :size="16" class="dropdown-icon-lucide" />
                  <span>Vetor SVG</span>
                </button>
              </div>
            </div>

            <div class="header-divider"></div>

            <button
              class="icon-btn toggle-btn"
              @click="toggleEditor"
              title="Ocultar Editor"
            >
              <ChevronLeft :size="20" />
            </button>

            <input
              ref="fileInputRef"
              type="file"
              accept=".sql,text/sql,.txt"
              @change="handleFileImport"
              style="display: none"
            />
          </nav>
        </header>

      
      <button
        v-if="isMobile && activeTab === 'editor'"
        class="mobile-editor-close"
        @click="toggleEditor"
        title="Fechar editor"
      >
        ✕
      </button>

        <SqlEditor
          v-model="sqlCode"
          :markers="[...validationResult.errors, ...validationResult.warnings]"
          :db-tables="availableTableNames"
          @update:model-value="handleSqlChange"
          @editor-ready="handleEditorReady"
          aria-label="Editor de código SQL"
        />
      </aside>

      <button v-if="!isEditorVisible && !isMobile" class="collapsed-sidebar" @click="toggleEditor" aria-label="Expandir painel do editor SQL">
        <div class="expand-btn" aria-hidden="true">
          <ChevronRight :size="20" />
        </div>
      </button>

      <div
        class="resizer-handle"
        @pointerdown="startResize"
        v-if="isEditorVisible && !isMobile"
        role="separator"
        aria-label="Arrastar para redimensionar o editor"
        tabindex="0"
      ></div>

      <section v-if="!isMobile || activeTab === 'diagram'" class="canvas-panel" aria-label="Área do diagrama ER">
        
        <div class="install-button-wrapper">
          <InstallButton aria-label="Instalar aplicativo" />
        </div>
        
        <DiagramCanvas
          ref="diagramCanvasRef"
          class="canvas-container"
          @selectionArea="handleSelectionArea"
          @selectionSelecting="handleSelectionArea"
          @canvasPointerDown="clearSelectionOnCanvas"
        >
          <!-- Definições SVG -->
          <defs> </defs>
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
                :style="{ cursor: diagramStore.isPanMode ? 'grab' : 'move' }"
                @pointerdown="(event) => startDrag(event, table.name)"
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

                  <g
                    :transform="`translate(15, ${headerHeight + 20 + colIndex * rowHeight - 12})`"
                    style="pointer-events: none; transform-origin: top left;"
                  >
                    <!-- Caso HERANÇA: mostra PK + FK lado a lado -->
                    <g v-if="isInheritanceColumn(table, col)" class="pk-icon" style="display:inline-block;">
                      <Key :size="18" stroke-width="2" />
                    </g>
                    <g v-if="isInheritanceColumn(table, col)" class="fk-icon" style="display:inline-block; transform: translateX(22px);">
                      <Link :size="17" stroke-width="2" />
                    </g>

                    <!-- Caso padrão: PK (quando não for FK) ou FK -->
                    <g v-else-if="col.isPk && !col.isFk" class="pk-icon">
                      <Key :size="18" stroke-width="2" style="display: block;" />
                    </g>
                    <g v-else-if="col.isFk" class="fk-icon">
                      <Link :size="17" stroke-width="2" style="display: block;" />
                    </g>
                  </g>
                  <text
                    :x="isInheritanceColumn(table, col) ? 64 : (col.isPk || col.isFk ? 40 : 15)"
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
                :style="{ cursor: diagramStore.isPanMode ? 'grab' : 'move' }"
                @pointerdown="(event) => startDrag(event, table.name)"
                @mousedown="(event) => startDrag(event, table.name)"
              >
              <!-- Tabela quando ta selecionada, a gente ta só clonando -->
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

                  <g
                    :transform="`translate(15, ${headerHeight + 20 + colIndex * rowHeight - 12})`"
                    style="pointer-events: none; transform-origin: top left;"
                  >
                    <!-- Caso HERANÇA: mostra PK + FK lado a lado -->
                    <g v-if="isInheritanceColumn(table, col)" class="pk-icon" style="display:inline-block;">
                      <Key :size="18" stroke-width="2" />
                    </g>
                    <g v-if="isInheritanceColumn(table, col)" class="fk-icon" style="display:inline-block; transform: translateX(22px);">
                      <Link :size="17" stroke-width="2" />
                    </g>

                    <!-- Caso padrão: PK (quando não for FK) ou FK -->
                    <g v-else-if="col.isPk && !col.isFk" class="pk-icon">
                      <Key :size="18" stroke-width="2" style="display: block;" />
                    </g>
                    <g v-else-if="col.isFk" class="fk-icon">
                      <Link :size="17" stroke-width="2" style="display: block;" />
                    </g>
                  </g>
                  <text
                    :x="isInheritanceColumn(table, col) ? 64 : (col.isPk || col.isFk ? 40 : 15)"
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

        <!-- Overlay que bloqueia o canvas e instrui o usuário quando não há diagrama -->
        <div v-if="Object.keys(tables).length === 0" class="canvas-empty-overlay">
          <div class="canvas-empty-content">
            <div class="canvas-empty-icon" aria-hidden>
              <!-- Simple diagram/network SVG icon, styled with project turquoise -->
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="2" y="3" width="7" height="6" rx="1.5" stroke="#2dd4bf" stroke-width="1.6" fill="#f8fffd"/>
                <rect x="15" y="3" width="7" height="6" rx="1.5" stroke="#2dd4bf" stroke-width="1.6" fill="#f8fffd"/>
                <rect x="2" y="15" width="7" height="6" rx="1.5" stroke="#2dd4bf" stroke-width="1.6" fill="#f8fffd"/>
                <rect x="15" y="15" width="7" height="6" rx="1.5" stroke="#2dd4bf" stroke-width="1.6" fill="#f8fffd"/>
                <path d="M9 6.5H15" stroke="#2dd4bf" stroke-width="1.2" stroke-linecap="round"/>
                <path d="M9 17.5H15" stroke="#2dd4bf" stroke-width="1.2" stroke-linecap="round"/>
                <circle cx="12" cy="12" r="1.2" fill="#2dd4bf" />
              </svg>
            </div>
            <h3 class="canvas-empty-title">Sem diagrama</h3>
            <p class="canvas-empty-desc">Digite o SQL no editor à esquerda para gerar o diagrama.</p>
          </div>
        </div>

          <DiagramToolbar v-if="diagramCanvasRef" :diagramRef="diagramCanvasRef" aria-label="Barra de ferramentas do diagrama" />
      </section>
    </main>

    <!-- Mobile: pequena setinha no canto esquerdo superior (mostra apenas quando o diagrama estiver visível) -->
    <button v-if="isMobile && activeTab === 'diagram'" class="mobile-top-toggle" @click="toggleEditor" :title="'Abrir Editor'">
      <span>◀</span>
    </button>

    <AlertModal ref="alertModalRef" />
    <Toast ref="toastRef" />

    <ProblemsPanel
      :problems="[...validationResult.errors, ...validationResult.warnings]"
      :is-visible="isProblemsVisible"
      @close="isProblemsVisible = false"
      @toggle="isProblemsVisible = !isProblemsVisible"
      @goto-line="gotoLine"
    />

    <div v-if="isResizing" class="global-resize-overlay"></div>
  </div>
</template>

<script setup>
import AlertModal from "./components/AlertModal.vue";
import { setAlertModalRef, showAlert, showError } from "@/services/alertService.js";
import { ref, computed, onMounted, watch, nextTick, shallowRef } from "vue";
import DiagramCanvas from "./components/DiagramCanvas.vue";
import DiagramToolbar from "./components/DiagramToolbar.vue";
import RelationshipLine from "./components/RelationshipLine.vue";
import SqlEditor from "./components/SqlEditor.vue";
import ProblemsPanel from "./components/ProblemsPanel.vue";
import InstallButton from "./components/InstallButton.vue";
import { DiagramController } from "./controllers/DiagramController.js";
import { XCircle, AlertTriangle } from "lucide-vue-next";
import { useDiagramStore } from "./stores/diagram.js";
import Toast from "./components/Toast.vue";
import { setToastRef, toastSuccess, toastError } from "@/services/toastService.js";
import {
  Key,
  Link,
  Eraser,
  Upload,
  Download,
  ChevronLeft,
  ChevronRight,
  FileCode,
  Image as ImageIcon,
  Code2,
} from "lucide-vue-next";
import logoBrDiagrama from "@/assets/images/logo/logo-completa.svg";

const alertModalRef = ref(null);

const toastRef = ref(null);

// Configura o serviço global quando o componente monta
onMounted(() => {
  setAlertModalRef(alertModalRef.value);
  setToastRef(toastRef.value); // Inicializa o serviço de Toast
  
  const savedSql = DiagramController.loadLastSql();
  // Se savedSql é null (não existe no storage), usa defaultSql
  // Se é string vazia (""), mantém vazio (usuário limpou todo o input)
  sqlCode.value = savedSql !== null ? savedSql : defaultSql;
  updateDiagram();
});

const diagramStore = useDiagramStore();

const isProblemsVisible = ref(false);
const showExportDropdown = ref(false);
const exportDropdownRef = ref(null);

const availableTableNames = computed(() => {
  return Object.keys(tables.value);
});

const toggleProblemsPanel = () => {
  isProblemsVisible.value = !isProblemsVisible.value;
};

const monacoEditor = shallowRef(null); 
const monacoInstance = shallowRef(null);
const isMonacoReady = ref(false);

// Função que o componente SqlEditor chama quando termina de carregar
const handleEditorReady = ({ editor, monaco }) => {
  monacoEditor.value = editor;
  monacoInstance.value = monaco;
  isMonacoReady.value = true; // Libera o uso
};

const editorWidth = ref(550); // Largura inicial do editor
const isResizing = ref(false);
const isEditorVisible = ref(true);
// Mobile tabs state
const activeTab = ref('diagram');
const isMobile = ref(window.innerWidth < 768);

const onResizeWindow = () => {
  isMobile.value = window.innerWidth < 768;
  // If switched to mobile, default to diagram view
  if (isMobile.value) {
    // Preserve previous visibility: if editor was visible keep it, else diagram
    activeTab.value = isEditorVisible.value ? 'editor' : 'diagram';
  }
};

window.addEventListener('resize', onResizeWindow);

const MIN_WIDTH = 300;
const MAX_WIDTH = 800;
const SNAP_THRESHOLD = 300;

const startResize = () => {
  // Bloqueia resize no mobile (largura da tela < 768px)
  if (window.innerWidth < 768) return;

  isResizing.value = true;
  document.body.style.cursor = "col-resize"; // Muda cursor globalmente

  document.body.classList.add("is-resizing-global");

  window.addEventListener("mousemove", handleResize);
  window.addEventListener("mouseup", stopResize);
};

const handleResize = (e) => {
  if (!isResizing.value) return;

  // Pega a posição X do mouse
  const currentX = e.clientX;

  // Ponto de gatilho (se passar daqui para a esquerda, fecha)
  const SNAP_THRESHOLD = 150;

  if (currentX < SNAP_THRESHOLD) {
    // Se o mouse cruzou a linha da esquerda, "esconde" o editor visualmente
    // MAS continua ouvindo o movimento (não chamar stopResize)
    if (isEditorVisible.value) {
      isEditorVisible.value = false;
    }1
  } else {
    // Se o mouse voltou para a direita, mostra o editor de novo
    if (!isEditorVisible.value) {
      isEditorVisible.value = true;
    }

    let newWidth = currentX;

    if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
    if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;

    editorWidth.value = newWidth;
  }
};

const stopResize = () => {
  isResizing.value = false;
  document.body.style.cursor = ""; // Reseta cursor
  document.body.classList.remove("is-resizing-global");
  window.removeEventListener("mousemove", handleResize);
  window.removeEventListener("mouseup", stopResize);
};

// Toggle para o botão de ocultar/mostrar
const toggleEditor = () => {
  if (isMobile.value) {
    if (activeTab.value === 'editor') {
      activeTab.value = 'diagram';
      isEditorVisible.value = false;
    } else {
      activeTab.value = 'editor';
      isEditorVisible.value = true;
    }
  } else {
    isEditorVisible.value = !isEditorVisible.value;
  }
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
    return "Digite o SQL à esquerda para gerar o diagrama";
  }
  if (Object.keys(tables.value).length === 0) {
    return "Digite o SQL à esquerda para gerar o diagrama";
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

// Retorna true se a coluna atual pertence a uma tabela de herança
// (exatamente 1 PK na tabela e essa PK também é FK)
const isInheritanceColumn = (table, col) => {
  return !!(table && table.isInheritance && col && col.isPk && col.isFk);
};

const headerHeight = 35;
const rowHeight = 32;

const MIN_TABLE_WIDTH = 220;
const HORIZONTAL_PADDING = 30;

const getTableWidth = (table) => {
  let maxWidth = MIN_TABLE_WIDTH;

  const nameLength = table.name.length * 8 + HORIZONTAL_PADDING;
  maxWidth = Math.max(maxWidth, nameLength);

    table.columns.forEach((col) => {
      // Se a tabela for herança e a coluna é a PK que também é FK, reserva espaço extra
      const reservedIconWidth = table.isInheritance && col.isPk && col.isFk ? 64 : (col.isPk || col.isFk ? 40 : 0);

      const colNameLength = col.name.length * 7 + reservedIconWidth;

      const colTypeLength = col.type.length * 7;

      const totalRowWidth = colNameLength + colTypeLength + HORIZONTAL_PADDING + 20;

      maxWidth = Math.max(maxWidth, totalRowWidth);
    });

  return Math.ceil(maxWidth);
};

// Exemplo inicial de SQL
const defaultSql = `CREATE TABLE clientes (
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

// Função debounce para evitar muitas chamadas da API
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), delay);
  };
};

const getTableHeight = (table) => {
  return headerHeight + table.columns.length * rowHeight + 0;
};

const validationResult = ref({ isValid: true, errors: [], warnings: [] });
const lastValidState = ref(null);

const errorCount = computed(() => validationResult.value.errors.length);
const warningCount = computed(() => validationResult.value.warnings.length);

watch(sqlCode, (newSql) => {
  // Salva sempre, mesmo quando vazio (permite persistir o estado "limpo")
  DiagramController.saveToCache(newSql || '', { tables: tables.value, relationships: relationships.value });
}, { debounce: 500 });

const updateDiagram = async () => {
  const result = DiagramController.processSql(sqlCode.value);

  // Se SQL vazio, limpa tudo
  if (!sqlCode.value.trim()) {
    tables.value = {};
    relationships.value = [];
    validationResult.value = { isValid: true, errors: [], warnings: [] };
    return;
  }

  // Se houve sucesso no parsing
  if (result.success && result.data) {
    const tempTables = {};
    for (const tableName in result.data.tables) {
      const oldTable = tables.value[tableName];
      tempTables[tableName] = {
        ...result.data.tables[tableName],
        columns: sortColumns(result.data.tables[tableName].columns),
        x: oldTable?.x || result.data.tables[tableName].x,
        y: oldTable?.y || result.data.tables[tableName].y,
      };
    }

    Object.values(tempTables).forEach((t) => {
      const pkCount = (t.columns || []).filter((c) => c.isPk).length;
      if (pkCount === 1) {
        const pkCol = (t.columns || []).find((c) => c.isPk);
        if (pkCol && pkCol.isFk) {
          t.isInheritance = true;
        } else {
          t.isInheritance = false;
        }
      } else {
        t.isInheritance = false;
      }
    });

    tables.value = tempTables;
    relationships.value = result.data.relationships;

    lastValidState.value = {
      tables: JSON.parse(JSON.stringify(tempTables)),
      relationships: [...result.data.relationships],
    };

    finishUpdate(true, result.errors, result.warnings, tempTables, result.data.relationships);
  } else {
    finishUpdate(false, result.errors, result.warnings);
  }
};

// Função auxiliar para não repetir o código de finalização/filtragem
const finishUpdate = (isValid, errors, warnings, newTables = {}, newRels = []) => {
  // Filtragem Anti-Duplicata
  const uniqueErrors = new Map();
  errors.forEach((err) => uniqueErrors.set(`${err.line}-${err.message.trim()}`, err));

  const uniqueWarnings = new Map();
  warnings.forEach((warn) =>
    uniqueWarnings.set(`${warn.line}-${warn.message.trim()}`, warn)
  );

  // Atualiza Visualização
  if (isValid || Object.keys(newTables).length > 0) {
    tables.value = newTables;
    relationships.value = newRels;
  }

  // Atualiza Marcadores
  validationResult.value = {
    isValid: isValid,
    errors: Array.from(uniqueErrors.values()),
    warnings: Array.from(uniqueWarnings.values()),
  };
};

const gotoLine = (lineNumberRaw) => {
  const lineNumber = parseInt(lineNumberRaw);
  if (!monacoEditor.value || isNaN(lineNumber) || lineNumber < 1) return;

  monacoEditor.value.revealLineInCenter(lineNumber);
  monacoEditor.value.setPosition({ lineNumber, column: 1 });
  monacoEditor.value.focus();
};

const fileInputRef = ref(null);

const triggerImport = () => {
  fileInputRef.value?.click();
};

const MAX_FILE_SIZE = 100 * 1024; // 100 KB
const ALLOWED_EXT_RE = /\.sql$/i;
const FORBIDDEN_EXT_RE = /\.(exe|bin|dll|sh|bat|jar|class|com|py)$/i;
const ALLOWED_MIME = new Set(["application/sql", "text/sql", "text/plain"]);

/**
 * Checa se o ArrayBuffer parece conter dados binários.
 * Retorna true se detectar bytes nulos ou alta proporção de bytes "não-texto".
 */
const isLikelyBinary = (arrayBuffer) => {
  const view = new Uint8Array(arrayBuffer);
  const len = Math.min(view.length, 1024);
  if (len === 0) return false;

  let nonText = 0;
  for (let i = 0; i < len; i++) {
    const b = view[i];
    if (b === 0) return true; // null byte -> binário quase certo
    // Permitir: tab(9), LF(10), CR(13), e bytes imprimíveis 32..126
    if (b === 9 || b === 10 || b === 13) continue;
    if (b >= 32 && b <= 126) continue;
    nonText++;
  }
  // Se mais de 10% forem não-text, considera binário
  return nonText / len > 0.1;
};

const handleFileImport = async (event) => {
  const file = event.target?.files?.[0];

  // limpa input e retorna se nada selecionado
  if (!file) {
    if (fileInputRef.value) fileInputRef.value.value = "";
    return;
  }

  // Rejeita por extensão proibida (executáveis/binaries)
  if (FORBIDDEN_EXT_RE.test(file.name || "")) {
    showError("Somente arquivos .sql são permitidos");
    if (fileInputRef.value) fileInputRef.value.value = "";
    return;
  }

  // Verifica extensão .sql
  if (!ALLOWED_EXT_RE.test(file.name || "")) {
    showError("Somente arquivos .sql são permitidos");
    if (fileInputRef.value) fileInputRef.value.value = "";
    return;
  }

  // Verifica tamanho máximo
  if (file.size > MAX_FILE_SIZE) {
    showError("Arquivo muito grande", "Tamanho máximo: 100 KB");
    if (fileInputRef.value) fileInputRef.value.value = "";
    return;
  }

  // Verifica MIME (quando disponível) — aceita text/plain também
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    // Alguns navegadores deixam file.type vazio; aqui só bloqueia quando houver tipo e for inválido
    showError("Somente arquivos .sql são permitidos");
    if (fileInputRef.value) fileInputRef.value.value = "";
    return;
  }

  try {
    // Lê os primeiros bytes para detectar binário
    const head = file.slice(0, 1024);
    const buf = await head.arrayBuffer();
    if (isLikelyBinary(buf)) {
      showError("Somente arquivos .sql são permitidos");
      return;
    }

    // Lê como texto
    const text = await file.text();

    // Segurança adicional: curto sanity-check no conteúdo (evita uploads de arquivos muito estranhos)
    if (!text.trim()) {
      showError("Arquivo vazio ou inválido");
      return;
    }

    // Aplica ao editor/estado
    sqlCode.value = text;

    // Se o Monaco já estiver pronto, atualiza o editor diretamente
    if (monacoEditor.value && typeof monacoEditor.value.setValue === "function") {
      monacoEditor.value.setValue(text);
    }

    // Atualiza o diagrama imediatamente com o conteúdo importado
    await updateDiagram();
    toastSuccess("Arquivo importado", `${event.target.files[0].name} carregado com sucesso!`);
  } catch (err) {
  // import error
    toastError("Erro na importação", "Ocorreu um erro ao importar o arquivo");
  } finally {
    // limpa o input para permitir reimportar o mesmo arquivo depois
    if (fileInputRef.value) fileInputRef.value.value = "";
  }
};

// apaga estado atual
const newProject = async () => {

  const confirmed = await showAlert({
    title: "Novo Projeto",
    message: "Deseja apagar o projeto atual?",
    type: "warning",
    buttonText: "Apagar"
  });

  if (!confirmed) {
    toastInfo("Ação cancelada", "Seu projeto foi preservado");
    return;
  }

  // Limpa estado do editor/diagrama
  sqlCode.value = "";
  tables.value = {};
  relationships.value = [];
  selectedTables.value.clear();
  validationResult.value = { isValid: true, errors: [], warnings: [] };
  lastValidState.value = null;

  // Atualiza Monaco se estiver pronto
  if (monacoEditor.value && typeof monacoEditor.value.setValue === "function") {
    monacoEditor.value.setValue("");
  }

  // Atualiza visual do diagrama
  await updateDiagram();
  toastSuccess("Projeto limpo", "Um novo projeto foi criado!");

};


const exportSql = () => {
  showExportDropdown.value = false;
  const content = sqlCode.value || "";
  const blob = new Blob([content], { type: "text/sql;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "export.sql";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toastSuccess("SQL exportado", "Arquivo SQL foi baixado com sucesso!");
};

const calculateDiagramBounds = () => {
  const padding = 80; 
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  Object.values(tables.value).forEach((table) => {
    const tableWidth = getTableWidth(table);
    const tableHeight = getTableHeight(table);

    const x1 = table.x;
    const y1 = table.y;
    const x2 = table.x + tableWidth;
    const y2 = table.y + tableHeight;

    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  });

  if (minX === Infinity) {
    return { x: 0, y: 0, width: 800, height: 600 };
  }

  const bounds = {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };

  

  return bounds;
};

const exportDiagramPNG = async () => {
  showExportDropdown.value = false;

  try {
    if (!tables.value || Object.keys(tables.value).length === 0) {
      showError("Não há tabelas para exportar");
      return;
    }

    
    const svgElement = diagramCanvasRef.value?.svgRoot;
    if (!svgElement) {
      alert("Erro: SVG não encontrado");
      return;
    }

    const bounds = calculateDiagramBounds();

    // Clona o SVG para não afetar a visualização atual
    const svgClone = svgElement.cloneNode(true);

    // Configura o SVG clonado com dimensões e viewBox corretos
    svgClone.setAttribute("width", Math.ceil(bounds.width));
    svgClone.setAttribute("height", Math.ceil(bounds.height));
    svgClone.setAttribute(
      "viewBox",
      `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`
    );
    svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    // Remove TODAS as transformações relacionadas ao zoom/pan (Calcula as posições absolutas)
    const viewportLayer = svgClone.querySelector("#viewport-layer");
    if (viewportLayer) {
      viewportLayer.removeAttribute("transform");
      viewportLayer.style.transform = "";
    }

    
    const allGroups = svgClone.querySelectorAll("g[transform]");
    allGroups.forEach((g) => {
      
      if (!g.id || !g.id.includes("marker")) {
        const currentTransform = g.getAttribute("transform");
        
        if (
          currentTransform &&
          !currentTransform.startsWith("translate(") &&
          currentTransform.includes("scale")
        ) {
          g.removeAttribute("transform");
        }
      }
    });

    
    const selectionsToRemove = svgClone.querySelectorAll(
      'rect[fill="rgba(59, 130, 246, 0.1)"]'
    );
    selectionsToRemove.forEach((el) => el.remove());

    const gridToRemove = svgClone.querySelector(".grid-background");
    if (gridToRemove) gridToRemove.remove();

    // Aplica estilos inline no SVG clonado
    const styleSheets = Array.from(document.styleSheets);
    let cssText = "";

    styleSheets.forEach((sheet) => {
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (rules) {
          Array.from(rules).forEach((rule) => {
            cssText += rule.cssText + "\n";
          });
        }
      } catch (e) {
        
      }
    });

    const styleElement = document.createElementNS("http://www.w3.org/2000/svg", "style");
    styleElement.textContent = cssText;
    const defsElement = svgClone.querySelector("defs");
    if (defsElement) {
      defsElement.appendChild(styleElement);
    } else {
      svgClone.insertBefore(styleElement, svgClone.firstChild);
    }

    // Converte SVG para string
    const svgString = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    // Cria imagem a partir do SVG
    const img = new Image();
    img.onload = () => {
      // Cria canvas para conversão
      const canvas = document.createElement("canvas");

      // Limite máximo de canvas (maioria dos browsers suporta até 32767x32767)
      const MAX_DIMENSION = 16000;
      let scale = 2; // 2x para melhor qualidade

      // Ajusta scale se as dimensões excederem o limite
      if (bounds.width * scale > MAX_DIMENSION || bounds.height * scale > MAX_DIMENSION) {
        scale = Math.min(MAX_DIMENSION / bounds.width, MAX_DIMENSION / bounds.height);
      }

      canvas.width = Math.floor(bounds.width * scale);
      canvas.height = Math.floor(bounds.height * scale);
     
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, bounds.width, bounds.height);

      // Adiciona marca d'água (logo) 
      const logoImg = new Image();
      logoImg.onload = () => {
        ctx.save();
        const logoHeight = 50; 
        const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
        const logoPadding = 20;

        
        ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        
        ctx.globalAlpha = 0.7;
        ctx.drawImage(
          logoImg,
          bounds.width - logoWidth - logoPadding,
          bounds.height - logoHeight - logoPadding,
          logoWidth,
          logoHeight
        );
        ctx.restore();

        // Converte para PNG e faz download
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "diagrama.png";
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          URL.revokeObjectURL(svgUrl);
        }, "image/png");
      };

      logoImg.onerror = () => {
      // Se falhar, faz download sem logo
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "diagrama.png";
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          URL.revokeObjectURL(svgUrl);
        }, "image/png");
      };

      // Carrega a logo
      logoImg.src = new URL(
        "@/assets/images/logo/logo-completa.svg",
        import.meta.url
      ).href;
    };

    img.onerror = (error) => {
        alert("Erro ao gerar PNG. Verifique o console para mais detalhes.");
      URL.revokeObjectURL(svgUrl);
    };

    img.src = svgUrl;
  } catch (error) {
      alert("Erro ao exportar PNG: " + (error?.message || "Erro desconhecido"));
  }
};

const exportDiagramSVG = () => {
  showExportDropdown.value = false;

  try {
    // Verifica se há tabelas
    if (!tables.value || Object.keys(tables.value).length === 0) {
      alert("Não há tabelas para exportar");
      return;
    }

    // Acessa o SVG através da ref do componente
    const svgElement = diagramCanvasRef.value?.svgRoot;
    if (!svgElement) {
      alert("Erro: SVG não encontrado");
      return;
    }

    const bounds = calculateDiagramBounds();

     // Clona o SVG para não afetar a visualização atual
    const svgClone = svgElement.cloneNode(true);

    // Configuração para o SVG clonado com dimensões e viewBox corretos
    svgClone.removeAttribute("style");
    svgClone.setAttribute("width", Math.ceil(bounds.width));
    svgClone.setAttribute("height", Math.ceil(bounds.height));
    svgClone.setAttribute(
      "viewBox",
      `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`
    );
    svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const viewportLayer = svgClone.querySelector("#viewport-layer");
    if (viewportLayer) {
      viewportLayer.removeAttribute("transform");
      viewportLayer.style.transform = "";
    }

    const allGroups = svgClone.querySelectorAll("g[transform]");
    allGroups.forEach((g) => {
      if (!g.id || !g.id.includes("marker")) {
        const currentTransform = g.getAttribute("transform");
        if (
          currentTransform &&
          !currentTransform.startsWith("translate(") &&
          currentTransform.includes("scale")
        ) {
          g.removeAttribute("transform");
        }
      }
    });

    const selectionsToRemove = svgClone.querySelectorAll(
      'rect[fill="rgba(59, 130, 246, 0.1)"]'
    );
    selectionsToRemove.forEach((el) => el.remove());

    const gridToRemove = svgClone.querySelector(".grid-background");
    if (gridToRemove) gridToRemove.remove();

    const hoverAreas = svgClone.querySelectorAll(
      '.column-hover-area, rect[fill="transparent"]'
    );
    hoverAreas.forEach((el) => el.remove());

    const svgDefs = svgClone.querySelector("defs");
    if (svgDefs) {
      const hoverMarkers = svgDefs.querySelectorAll('marker[id*="Hover"]');
      hoverMarkers.forEach((marker) => marker.remove());
    }

    const highlightRects = svgClone.querySelectorAll(
      'rect[fill="#EDFEFC"], rect[fill="#eff6ff"]'
    );
    highlightRects.forEach((rect) => rect.remove());

    const highlightLines = svgClone.querySelectorAll(
      'line[stroke="#70D8CC"], line[stroke="#93c5fd"]'
    );
    highlightLines.forEach((line) => line.remove());

    const connectorHitboxes = svgClone.querySelectorAll(".connector-hitbox");
    connectorHitboxes.forEach((el) => el.remove());

    const connectorFlows = svgClone.querySelectorAll(".connector-flow");
    connectorFlows.forEach((el) => el.remove());

    // IMPORTANTE: Preservar transforms dos ícones FK em herança ANTES de limpar estilos
    const fkIconsTransforms = new Map();
    svgClone.querySelectorAll(".fk-icon").forEach((icon) => {
      const transform = icon.style.transform;
      if (transform && transform.includes("translateX")) {
        // Converte translateX(22px) para translate(22, 0)
        const match = transform.match(/translateX\(([\d.]+)px\)/);
        if (match) {
          fkIconsTransforms.set(icon, `translate(${match[1]}, 0)`);
        }
      }
    });

    const relationshipGroups = svgClone.querySelectorAll(".relationship-line");
    relationshipGroups.forEach((group) => {
      group.classList.remove("is-active", "hover", "active");
    });

    const cardinalityLabels = svgClone.querySelectorAll(".cardinality-label");
    cardinalityLabels.forEach((label) => {
      label.classList.remove("cardinality-hover");
       });

    const relationshipLines = svgClone.querySelectorAll("line, path, polyline");
    relationshipLines.forEach((line) => {
      if (line.classList) {
        line.classList.remove(
          "hover",
          "active",
          "selected",
          "highlighted",
          "connector-hover-active"
        );
      }

      const markerStart = line.getAttribute("marker-start");
      const markerEnd = line.getAttribute("marker-end");

      if (markerStart && markerStart.includes("Hover")) {
        line.setAttribute("marker-start", markerStart.replace(/Hover/g, ""));
      }
      if (markerEnd && markerEnd.includes("Hover")) {
        line.setAttribute("marker-end", markerEnd.replace(/Hover/g, ""));
      }

      const stroke = line.getAttribute("stroke");
      if (
        stroke &&
        (stroke.includes("#192747") ||
          stroke.includes("rgb(25, 39, 71)") ||
          stroke.includes("#4facfe"))
      ) {
        line.setAttribute("stroke", "#7f8c8d");
      }

      const strokeWidth = line.getAttribute("stroke-width");
      if (strokeWidth && parseFloat(strokeWidth) !== 2) {
        line.setAttribute("stroke-width", "2");
      }

      line.removeAttribute("style");
      line.style.animation = "none";
    });

    const allElements = svgClone.querySelectorAll("*");
    allElements.forEach((el) => {
      el.removeAttribute("style"); 
      el.style.pointerEvents = "none"; 
      el.removeAttribute("@mouseenter");
      el.removeAttribute("@mouseleave");
      el.removeAttribute("@mousedown");
      el.removeAttribute("@click");

      if (el.classList) {
        el.classList.remove("hover", "active", "selected", "highlighted");
      }
    });

    const tableRects = svgClone.querySelectorAll(".table-rect");
    tableRects.forEach((rect) => {
      rect.setAttribute("fill", "#ffffff");
      rect.setAttribute("stroke", "#e5e7eb");
      rect.setAttribute("stroke-width", "1");
    });

    const tableHeaders = svgClone.querySelectorAll(".table-header-rect");
    tableHeaders.forEach((header) => {
      header.setAttribute("fill", "#1e293b");
    });

    const tableTitles = svgClone.querySelectorAll(".table-title");
    tableTitles.forEach((title) => {
      title.setAttribute("fill", "#ffffff");
      title.setAttribute("font-size", "14");
      title.setAttribute("font-weight", "600");
      title.setAttribute("font-family", "Arial, sans-serif");
    });

    // Textos de colunas
    const colTexts = svgClone.querySelectorAll(".col-text");
    colTexts.forEach((text) => {
      text.setAttribute("fill", "#1e293b");
      text.setAttribute("font-size", "12");
      text.setAttribute("font-family", "Arial, sans-serif");
    });

    const colTypes = svgClone.querySelectorAll(".col-type");
    colTypes.forEach((text) => {
      text.setAttribute("fill", "#6b7280");
      text.setAttribute("font-size", "11");
      text.setAttribute("font-family", "Arial, sans-serif");
    });

    // Ícones PK/FK
    const pkIcons = svgClone.querySelectorAll(".pk-icon");
    pkIcons.forEach((icon) => {
      icon.setAttribute("fill", "#10b981");
      icon.setAttribute("font-size", "9");
      icon.setAttribute("font-weight", "bold");
    });

    const fkIcons = svgClone.querySelectorAll(".fk-icon");
    fkIcons.forEach((icon) => {
      icon.setAttribute("fill", "#3b82f6");
      icon.setAttribute("font-size", "9");
      icon.setAttribute("font-weight", "bold");
      
      // Aplica o transform salvo anteriormente (caso de herança)
      if (fkIconsTransforms.has(icon)) {
        icon.setAttribute("transform", fkIconsTransforms.get(icon));
      }
    });

    // Linhas de relacionamento
    const connectorVisuals = svgClone.querySelectorAll(".connector-visual");
    connectorVisuals.forEach((line) => {
      line.setAttribute("fill", "none");
      line.setAttribute("stroke", "#7f8c8d");
      line.setAttribute("stroke-width", "2");
    });

    // Labels de cardinalidade
    const cardLabels = svgClone.querySelectorAll(".cardinality-label");
    cardLabels.forEach((label) => {
      label.setAttribute("font-size", "0"); // Esconde por padrão
      label.setAttribute("fill", "#7f8c8d");
      label.setAttribute("font-weight", "600");
      label.setAttribute("font-family", "Arial, sans-serif");
    });

    // Serializa e faz download
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diagrama.svg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
  alert("Erro ao exportar SVG: " + error.message);
  }
};

// Handler com debounce para mudanças no SQL
const handleSqlChange = debounce(updateDiagram, 300);

// Funções relacionadas a Seleção Múltipla ---

const handleSelectionArea = (area) => {
  // Limpar hover e seleção anterior (clique no canvas deve desselcionar)
  hoveredColumn.value = null;
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
};

const handleColumnHover = (data) => {
  hoveredColumn.value = data.isHovering ? data : null;
};

const clearSelectionOnCanvas = () => {
  // Ao clicar no fundo do canvas, removemos qualquer hover e seleção
  hoveredColumn.value = null;
  selectedTables.value.clear();
  dragState.value.pending = false;
  dragState.value.pendingStart = null;
  dragState.value.pendingPointerId = null;
};

// Drag and Drop das Tabelas

const startDrag = (event, tableName) => {
  // Bloqueia drag de tabelas quando pan mode está ativo
  if (diagramStore.isPanMode) {
    return;
  }

  if (!event.ctrlKey && !event.metaKey) {
    event.preventDefault();
  }

  const svgElement = diagramCanvasRef.value?.svgRoot;
  if (!svgElement) return;
  try { window._brdiagrama_suppressGlobalPointerHandlers = true; } catch (e) {}
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

  const isTouch = (window.PointerEvent && event.pointerType === 'touch') || (!window.PointerEvent && 'ontouchstart' in window);

  dragState.value.draggedTable = tableName;

  if (window.PointerEvent && event.pointerId != null) {
    try {
      const svgRootEl = diagramCanvasRef.value && diagramCanvasRef.value.svgRoot;
      if (svgRootEl && svgRootEl.setPointerCapture) {
        svgRootEl.setPointerCapture(event.pointerId);
        dragState.value._pointerCapturedOn = svgRootEl;
        dragState.value._pointerId = event.pointerId;
      }
    } catch (err) {
    }
  }

  if (isTouch) {
    dragState.value.pending = true;
    dragState.value.pendingStart = { x: event.clientX, y: event.clientY };
    dragState.value.pendingPointerId = event.pointerId || null;
  } else {
    dragState.value.isDragging = true;

    const ctm = svgElement.getScreenCTM();
    const table = tables.value[tableName];

    const zoom = diagramStore.zoom;
    dragState.value.offset.x = (event.clientX - ctm.e) / zoom - table.x;
    dragState.value.offset.y = (event.clientY - ctm.f) / zoom - table.y;
  }

  try { window._brdiagrama_suppressGlobalPointerHandlers = true; } catch (e) {}

  if (window.PointerEvent && event.pointerId != null) {
    try {
      const svgRootEl = diagramCanvasRef.value && diagramCanvasRef.value.svgRoot;
      if (svgRootEl && svgRootEl.setPointerCapture) {
        try {
          svgRootEl.setPointerCapture(event.pointerId);
          dragState.value._pointerCapturedOn = svgRootEl;
          dragState.value._pointerId = event.pointerId;
        } catch (err) {
          event.target && event.target.setPointerCapture && event.target.setPointerCapture(event.pointerId);
          dragState.value._pointerCapturedOn = event.target;
          dragState.value._pointerId = event.pointerId;
        }
      } else {
        event.target && event.target.setPointerCapture && event.target.setPointerCapture(event.pointerId);
        dragState.value._pointerCapturedOn = event.target;
        dragState.value._pointerId = event.pointerId;
      }
    } catch (err) {
    }

    document.addEventListener("pointermove", handleDrag);
    document.addEventListener("pointerup", endDrag);
    document.addEventListener("pointercancel", endDrag);
  } else {
    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", endDrag);
  }
};

const TOUCH_DRAG_THRESHOLD = 6; // px

const handleDrag = (event) => {
  if (dragState.value.pending) {
    if (dragState.value.pendingPointerId != null && event.pointerId != null && dragState.value.pendingPointerId !== event.pointerId) return;

    const dx = event.clientX - dragState.value.pendingStart.x;
    const dy = event.clientY - dragState.value.pendingStart.y;
    const dist = Math.hypot(dx, dy);
    if (dist < TOUCH_DRAG_THRESHOLD) {
      return;
    }

    dragState.value.pending = false;
    dragState.value.isDragging = true;

    const svgElement = diagramCanvasRef.value?.svgRoot;
    if (!svgElement) return;
    const ctm = svgElement.getScreenCTM();
    const table = tables.value[dragState.value.draggedTable];
    const zoom = diagramStore.zoom;

    dragState.value.offset.x = (dragState.value.pendingStart.x - ctm.e) / zoom - table.x;
    dragState.value.offset.y = (dragState.value.pendingStart.y - ctm.f) / zoom - table.y;
  }

  if (!dragState.value.isDragging || !dragState.value.draggedTable) return;

  const svgElement = diagramCanvasRef.value?.svgRoot;
  if (!svgElement) return;

  const ctm = svgElement.getScreenCTM();

  // Converte as coordenadas do mouse considerando o zoom atual
  const zoom = diagramStore.zoom;
  const newX = (event.clientX - ctm.e) / zoom - dragState.value.offset.x;
  const newY = (event.clientY - ctm.f) / zoom - dragState.value.offset.y;

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

const endDrag = (e) => {
  dragState.value.isDragging = false;
  dragState.value.draggedTable = null;
  dragState.value.pending = false;
  dragState.value.pendingStart = null;
  dragState.value.pendingPointerId = null;

  try {
    const capturedEl = dragState.value._pointerCapturedOn;
    const pid = dragState.value._pointerId != null ? dragState.value._pointerId : (e && e.pointerId);
    if (capturedEl && pid != null && capturedEl.releasePointerCapture) {
      try { capturedEl.releasePointerCapture(pid); } catch (err) { /* ignore */ }
    }
    dragState.value._pointerCapturedOn = null;
    dragState.value._pointerId = null;
  } catch (err) {
  }

  if (window.PointerEvent) {
    document.removeEventListener("pointermove", handleDrag);
    document.removeEventListener("pointerup", endDrag);
    document.removeEventListener("pointercancel", endDrag);
  }
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", endDrag);

  try {
    window._brdiagrama_suppressGlobalPointerHandlers = false;
  } catch (e) {}
};

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
</script>

<style scoped>
.mobile-top-toggle {
  position: fixed;
  top: calc(env(safe-area-inset-top, 12px) + 45px);
  left: calc(env(safe-area-inset-left, 12px) + 8px);
  transform: none;
  z-index: 1200;
  background: #2dd4bf;
  color: #fff;
  border-radius: 12px;
  border: none;
  box-shadow: 0 10px 26px rgba(45, 212, 191, 0.18);
  padding: 8px;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.mobile-top-toggle:active { transform: translateY(1px) scale(0.995); }
.mobile-top-toggle span { display: inline-block; font-size: 20px; line-height: 1; }

.mobile-editor-close {
  position: absolute;
  top: calc(env(safe-area-inset-top, 12px) + 55px);
  right: calc(env(safe-area-inset-right, 12px) + 10px);
  z-index: 1300;
  background: rgba(255,255,255,0.06);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.06);
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(2,6,23,0.4);
}
.mobile-editor-close:hover { background: rgba(255,255,255,0.09); }

 
</style>

<style scoped>
.problems-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: auto;
  margin-right: 8px;
  background-color: rgba(255, 255, 255, 0.03); 
}

.problems-badge.has-errors {
  color: #fca5a5;
  background-color: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.2);
}
.problems-badge.has-errors:hover {
  background-color: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
}

.problems-badge.has-warnings {
  color: #fcd34d;
  background-color: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.2);
}
.problems-badge.has-warnings:hover {
  background-color: rgba(245, 158, 11, 0.2);
  border-color: #f59e0b;
}

.badge-count {
  font-size: 12px;
  font-weight: 600;
  font-family: "Segoe UI", sans-serif;
}

.badge-icon {
  transition: transform 0.2s;
}

.problems-badge:hover .badge-icon {
  transform: scale(1.1);
}

.header-badge {
  margin-left: auto; 
  margin-right: 10px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s;
}

.header-badge.error {
  background-color: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.5);
  animation: pulse-red 2s infinite;
}

.header-badge:hover {
  background-color: rgba(239, 68, 68, 0.4);
}

@keyframes pulse-red {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

.main-content {
  display: flex;
  flex: 1; 
  overflow: hidden; 
  min-height: 0; 
  flex-direction: row;
}

.mobile-tabbar {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  background: rgba(15,23,42,0.9);
  padding: 8px;
  border-radius: 999px;
  z-index: 60;
  box-shadow: 0 6px 24px rgba(2,6,23,0.6);
}
.mobile-tabbar .tab-btn {
  background: transparent;
  color: #cbd5e1;
  border: none;
  padding: 8px 14px;
  border-radius: 999px;
  font-weight: 600;
}
.mobile-tabbar .tab-btn.active {
  background: #0f172a;
  color: #e2e8f0;
}

.app {
  display: flex;
  flex-direction: column; 
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #0f172a;
}

.editor-panel {
  display: flex;
  flex-direction: column;
  background-color: #0f172a;
  flex-shrink: 0;
  transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
}

.editor-panel.panel-hidden {
  border-right: none;
}
.editor-panel.no-transition {
  transition: width 0.1s ease-out !important;
  will-change: width; 
}

.editor-panel.no-transition:not(.panel-hidden) {
  transition: width 0.1s ease-out !important;
  will-change: width;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #020617;
  padding: 0 16px;
  height: 56px; 
  border-bottom: 1px solid #1e293b;
  flex-shrink: 0;
  user-select: none;
}
.brand-area {
  display: flex;
  align-items: center;
}

.editor-logo {
  height: 40px; 
  width: auto;
  display: block;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px; 
}

.install-button-wrapper {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 999;
  pointer-events: auto;
}


@media (max-width: 768px) {
  .install-button-wrapper {
    top: 12px;
    right: 12px;
  }
}

.header-divider {
  width: 1px;
  height: 20px;
  background-color: #334155;
  margin: 0 8px;
}

.editor-panel :deep(.editor-container) {
  flex: 1;
  height: auto;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.resizer-handle {
  width: 5px;
  background-color: #0f172a;
  cursor: col-resize;
  transition: background 0.2s, width 0.2s;
  flex-shrink: 0;
  border-left: 1px solid #1e293b;
}

.resizer-handle:hover,
.resizer-handle:active {
  background-color: #2dd4bf;
  width: 7px;
}
.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8; 
  background: transparent;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
}

.collapsed-sidebar {
  width: 40px;
  background-color: #020617;
  border-right: 1px solid #1e293b;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 12px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.collapsed-sidebar:hover {
  background-color: #0f172a;
}

.expand-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  background: transparent;
  border: 1px solid transparent;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.collapsed-sidebar:hover .expand-btn {
  background-color: rgba(45, 212, 191, 0.1); 
  color: #2dd4bf; 
  border-color: rgba(45, 212, 191, 0.2); 
  transform: translateX(2px);
  box-shadow: 0 0 10px rgba(45, 212, 191, 0.15); 
}

.icon-btn:hover,
.icon-btn.active {
  background-color: rgba(45, 212, 191, 0.1);
  color: #2dd4bf; 
}

.toggle-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.editor-header .icon-btn:hover {
  background-color: rgba(45, 212, 191, 0.1); 
  color: #2dd4bf;
  border-color: rgba(45, 212, 191, 0.2); 
  transform: translateX(2px);
  box-shadow: 0 0 10px rgba(45, 212, 191, 0.15); 
}

.export-dropdown {
  position: relative;
  display: inline-block;
}


.dropdown-header {
  padding: 10px 14px;
  font-size: 11px;
  text-transform: uppercase;
  color: #94a3b8;
  font-family: "Segoe UI", sans-serif;
  font-weight: 700;
  letter-spacing: 0.5px;
  
  border-bottom: 1px solid rgba(255,255,255,0.05);
  margin-bottom: 4px;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  left: auto;
  transform: none;
  
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
  min-width: 180px;
  padding: 4px;
  z-index: 1000;
  animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}


.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  left: auto;
  transform: none;

  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
  min-width: 180px;
  padding: 4px;
  z-index: 1000;
  animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown-item {
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #cbd5e1;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  font-weight: 500;
  border-bottom: none;
  font-family: "Segoe UI", sans-serif;
}

.dropdown-icon-lucide {
  display: block;
  opacity: 0.7;
}
.dropdown-item:hover .dropdown-icon-lucide {
  opacity: 1;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.expand-btn {
   color: #64748b;
}
.expand-btn:hover {
   color: #2dd4bf;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background-color: rgba(45, 212, 191, 0.15);
  color: #2dd4bf;
}

.dropdown-item:active {
  background-color: rgba(45, 212, 191, 0.25);
}

.dropdown-icon {
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
}

@media (max-width: 768px) {
  .app {
    flex-direction: column;
  }

  .editor-panel {
    width: 100% !important;
    height: 100% !important;
    border-bottom: none;
    position: relative;
    z-index: 1200;
  }

  .resizer-handle {
    display: none !important;
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

:deep(.table-group text),
:deep(.table-title),
:deep(.col-text),
:deep(.col-type),
:deep(.pk-icon),
:deep(.fk-icon) {
  user-select: none;
  -webkit-user-select: none; 
  pointer-events: none; 
}

.global-resize-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  cursor: col-resize;
  background: transparent;
  user-select: none;
  touch-action: none;
}

:deep(.find-widget) {
  right: auto !important;
  left: 0 !important;
  z-index: 100 !important;
}

:deep(.suggest-widget),
:deep(.context-view) {
  z-index: 5000 !important;
}

:deep(.monaco-hover) {
  z-index: 9999 !important;
}
</style>

<style>
.canvas-empty-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.90);
  pointer-events: auto;
}
.canvas-empty-content {
  text-align: center;
  color: #0f172a;
  background: linear-gradient(180deg, #ffffff 0%, #fbffff 100%);
  padding: 22px 30px;
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(2,6,23,0.08);
  border: 2px solid rgba(45,212,191,0.14);
  max-width: 520px;
  width: min(92%, 520px);
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}
.canvas-empty-icon {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.canvas-empty-title { margin: 6px 0; font-size: 20px; color: #05223a; font-weight: 700; }
.canvas-empty-desc { margin: 0; color: #475569; font-size: 14px; }

.monaco-editor-hover,
.monaco-hover {
  z-index: 999999 !important;
}

.editor-widget.suggest-widget,
.monaco-editor .suggest-widget {
  z-index: 50000 !important; 
}

.monaco-editor .find-widget {
  z-index: 60000 !important; 
  left: 0 !important;
}
</style>
