<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import GeneratorToolbar from '~/components/generator/GeneratorToolbar.vue';
import MonacoEditorPanel from '~/components/generator/MonacoEditorPanel.vue';
import DiagramWorkspace from '~/components/generator/DiagramWorkspace.vue';
import ProblemsPanel from '~/components/shared/ProblemsPanel.vue';
import AlertModal from '~/components/shared/AlertModal.vue';
import Toast from '~/components/shared/Toast.vue';
import { useDiagram, DEFAULT_SQL } from "@/composables/useDiagram";
import { useDiagramStorage } from "@/composables/useDiagramStorage";
import { ChevronRight } from 'lucide-vue-next';
import { useGeneratorTheme } from "@/composables/useGeneratorTheme";
import { toastSuccess, toastError } from "@/services/toastService";
import { showConfirm } from "@/services/alertService";
import { downloadFile } from "@/utils/helpers";

// Metadata
useHead({
  title: 'Gerador BrDiagrama - Crie Diagramas ER a partir de SQL Online | Gratuito e Offline',
  meta: [
    { name: 'description', content: 'Gerador online gratuito para converter SQL (CREATE TABLE) em diagramas ER automaticamente. Detecta relacionamentos 1:1, 1:N, N:N e herança. Funciona 100% offline no navegador.' }
  ]
});

const { sqlCode, tables, errors: domainErrors, warnings: domainWarnings, parseSql } = useDiagram();
const { isEditorDark, initEditorTheme } = useGeneratorTheme();
initEditorTheme();

const workspaceRef = ref(null);
const isProblemsVisible = ref(false);
const editorWidth = ref(550);
const isResizing = ref(false);
const isEditorVisible = ref(true);
const activeTab = ref('diagram');
const isMobile = ref(false);

const MIN_WIDTH = 300;
const MAX_WIDTH = 1200;
const SNAP_THRESHOLD = 150;

const availableTableNames = computed(() => Object.keys(tables.value));

onMounted(() => {
  isMobile.value = window.innerWidth < 768;
  window.addEventListener('resize', onResizeWindow);

  const { loadSql } = useDiagramStorage();
  const savedSql = loadSql();
  const initialSql = savedSql !== null ? savedSql : DEFAULT_SQL;
  sqlCode.value = initialSql;
  parseSql(initialSql);
});

onUnmounted(() => {
  window.removeEventListener('resize', onResizeWindow);
  window.removeEventListener('mousemove', handleResize);
  window.removeEventListener('mouseup', stopResize);
  window.removeEventListener('pointermove', handleResize);
  window.removeEventListener('pointerup', stopResize);
});

const onResizeWindow = () => {
  isMobile.value = window.innerWidth < 768;
};

const startResize = (e) => {
  if (isMobile.value) return;
  e.preventDefault();
  isResizing.value = true;
  document.body.classList.add('is-resizing-global');
  window.addEventListener('mousemove', handleResize);
  window.addEventListener('mouseup', stopResize);
  window.addEventListener('pointermove', handleResize);
  window.addEventListener('pointerup', stopResize);
};

const handleResize = (e) => {
  if (!isResizing.value) return;

  const currentX = e.clientX;

  if (currentX < SNAP_THRESHOLD) {
    if (isEditorVisible.value) {
      isEditorVisible.value = false;
    }
  } else {
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
  document.body.classList.remove('is-resizing-global');
  window.removeEventListener('mousemove', handleResize);
  window.removeEventListener('mouseup', stopResize);
  window.removeEventListener('pointermove', handleResize);
  window.removeEventListener('pointerup', stopResize);
};

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

const toggleProblemsPanel = () => {
  isProblemsVisible.value = !isProblemsVisible.value;
};

const newProject = async () => {
  const confirmed = await showConfirm(
    "Deseja realmente limpar tudo? Seu progresso não salvo será perdido.",
    "Limpar Projeto",
    "Limpar"
  );

  if (confirmed) {
    sqlCode.value = "";
    parseSql("");
    const { clearSql } = useDiagramStorage();
    clearSql();
    toastSuccess("Novo projeto iniciado");
  }
};

const handleFileImport = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    sqlCode.value = e.target.result;
    parseSql(sqlCode.value);
    toastSuccess("Arquivo importado", `Arquivo ${file.name} carregado com sucesso.`);
  };
  reader.readAsText(file);
};

const exportSql = () => {
  if (!sqlCode.value) {
    toastError("Nada para exportar", "O editor está vazio");
  } else {
    downloadFile(sqlCode.value, "esquema.sql", "text/sql");
  }
};

const exportDiagramPNG = () => {
  workspaceRef.value?.exportDiagramPNG();
};

const exportDiagramSVG = () => {
  workspaceRef.value?.exportDiagramSVG();
};
</script>

<template>
  <div class="app" role="application" aria-label="Gerador BrDiagrama">
    <main class="main-content">
      <!-- Coluna da Esquerda (Editor + Barra de Redimensionamento) -->
      <div
        v-if="!isMobile || activeTab === 'editor'"
        class="editor-shell"
        :class="{ 
          'no-transition': isResizing, 
          'panel-hidden': !isEditorVisible,
          'editor-dark': isEditorDark,
          'editor-light': !isEditorDark
        }"
        :style="{ width: isEditorVisible ? (isMobile ? '100%' : (editorWidth + 8) + 'px') : '0px' }"
      >
        <aside
          class="editor-panel"
          role="complementary"
          aria-label="Painel do gerador SQL"
        >
          <GeneratorToolbar
            :errorCount="domainErrors.length"
            :warningCount="domainWarnings.length"
            @toggleProblemsPanel="toggleProblemsPanel"
            @newProject="newProject"
            @exportSql="exportSql"
            @exportDiagramPNG="exportDiagramPNG"
            @exportDiagramSVG="exportDiagramSVG"
            @toggleEditor="toggleEditor"
            @fileImport="handleFileImport"
          />

          <button
            v-if="isMobile && activeTab === 'editor'"
            class="mobile-editor-close"
            @click="toggleEditor"
            title="Fechar editor"
          >
            ✕
          </button>

          <MonacoEditorPanel
            v-model="sqlCode"
            :markers="[...domainErrors, ...domainWarnings]"
            :db-tables="availableTableNames"
            @update:model-value="parseSql"
            aria-label="Editor de código SQL"
          />
        </aside>

        <!-- Barra de Redimensionamento (Arrastar) -->
        <div
          v-if="isEditorVisible && !isMobile"
          class="resizer-handle"
          @mousedown="startResize"
          @pointerdown="startResize"
          role="separator"
          aria-label="Arrastar para redimensionar o editor"
          tabindex="0"
          title="Arrastar para redimensionar"
        ></div>
      </div>

      <!-- Barra Lateral Colapsada Original -->
      <v-tooltip 
        v-if="!isEditorVisible && !isMobile"
        text="Expandir editor" 
        location="right"
        target="cursor"
        :offset="12"
        :theme="isEditorDark ? 'dark' : 'light'"
      >
        <template #activator="{ props: tooltipProps }">
          <button
            v-bind="tooltipProps"
            class="collapsed-sidebar"
            :class="isEditorDark ? 'editor-dark' : 'editor-light'"
            @click="toggleEditor"
            aria-label="Expandir painel do editor SQL"
          >
            <div class="expand-btn" aria-hidden="true">
              <ChevronRight :size="20" />
            </div>
          </button>
        </template>
      </v-tooltip>

      <!-- Área do Diagrama Canvas -->
      <DiagramWorkspace ref="workspaceRef" />

      <!-- Painel de Problemas (Erros/Warnings) -->
      <ProblemsPanel
        :problems="[...domainErrors, ...domainWarnings]"
        :is-visible="isProblemsVisible"
        @close="isProblemsVisible = false"
        @toggle="isProblemsVisible = !isProblemsVisible"
      />

      <!-- Overlay de Redimensionamento Global -->
      <div v-if="isResizing" class="global-resize-overlay"></div>
    </main>

    <AlertModal />
    <Toast />
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--clr-bg);
  color: var(--clr-text);
}

.main-content {
  display: flex;
  flex: 1;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.editor-shell {
  display: flex;
  flex-direction: row;
  height: 100%;
  flex-shrink: 0;
  transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
  position: relative;
}

.editor-shell.panel-hidden {
  border-right: none;
}

.editor-shell.no-transition {
  transition: width 0.1s ease-out !important;
  will-change: width;
}

.editor-shell.editor-dark {
  --panel-bg: #1C1C1C;
  --panel-surface: #242424;
  --panel-border: rgba(255, 255, 255, 0.08);
  --panel-text: #F0F0F0;
  --panel-text-muted: #9AA0A6;
  --panel-hover: #2A2A2A;
}

.editor-shell.editor-light {
  --panel-bg: #FFFFFF;
  --panel-surface: #FAF9F9;
  --panel-border: rgba(0, 0, 0, 0.08);
  --panel-text: #1F1F1F;
  --panel-text-muted: #5E6368;
  --panel-hover: #EBEBEB;
}

.editor-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  background-color: var(--panel-bg);
  color: var(--panel-text);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.resizer-handle {
  width: 8px;
  height: 100%;
  cursor: col-resize;
  flex-shrink: 0;
  z-index: 25;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.editor-shell.editor-dark .resizer-handle {
  background-color: #242424;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.editor-shell.editor-light .resizer-handle {
  background-color: #F0F0F0;
  border-left: 1px solid rgba(0, 0, 0, 0.08);
  border-right: 1px solid rgba(0, 0, 0, 0.08);
}

.editor-shell .resizer-handle:hover,
.editor-shell .resizer-handle:active {
  background-color: var(--clr-primary) !important;
}

.collapsed-sidebar {
  width: 40px;
  border: none !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 11px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
  z-index: 20;
}

.collapsed-sidebar.editor-dark {
  background-color: #1C1C1C;
}

.collapsed-sidebar.editor-light {
  background-color: #FFFFFF;
}

.collapsed-sidebar.editor-dark:hover {
  background-color: #242424;
}

.collapsed-sidebar.editor-light:hover {
  background-color: #F1F3F4;
}

.expand-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  transition: all 0.2s ease;
}

.collapsed-sidebar.editor-dark .expand-btn {
  color: #9AA0A6;
}

.collapsed-sidebar.editor-light .expand-btn {
  color: #5E6368;
}

.collapsed-sidebar.editor-dark:hover .expand-btn,
.collapsed-sidebar.editor-dark .expand-btn:hover {
  background-color: rgba(26, 186, 156, 0.15);
  color: #1ABA9C;
}

.collapsed-sidebar.editor-light:hover .expand-btn,
.collapsed-sidebar.editor-light .expand-btn:hover {
  background-color: rgba(26, 186, 156, 0.12);
  color: #1ABA9C;
}

.global-resize-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  cursor: col-resize;
  user-select: none;
  background: transparent;
  touch-action: none;
}

.mobile-editor-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 50;
  background: var(--clr-bg-surface);
  border: 1px solid var(--clr-border);
  color: var(--clr-text);
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
</style>
