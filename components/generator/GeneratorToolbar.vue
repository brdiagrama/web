<script setup lang="ts">
import { ref } from 'vue';
import { 
  XCircle, AlertTriangle, Eraser, Upload, Download, 
  FileCode, ImageIcon, Code2, ChevronLeft 
} from 'lucide-vue-next';

const props = defineProps<{
  errorCount: number;
  warningCount: number;
}>();

const emit = defineEmits<{
  (e: 'toggleProblemsPanel'): void;
  (e: 'newProject'): void;
  (e: 'triggerImport'): void;
  (e: 'exportSql'): void;
  (e: 'exportDiagramPNG'): void;
  (e: 'exportDiagramSVG'): void;
  (e: 'toggleEditor'): void;
  (e: 'fileImport', event: Event): void;
}>();

const showExportDropdown = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const triggerImportLocal = () => {
  emit('triggerImport');
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};
</script>

<template>
  <header class="editor-header" role="banner">
    <div class="brand-area">
      <a href="/" aria-label="Voltar para a página inicial do BrDiagrama" class="brand-link">
        <img
          src="~/assets/images/logo/logo-completa.svg"
          alt="BrDiagrama - Logo"
          class="editor-logo"
          width="auto"
          height="38"
        />
      </a>
    </div>

    <nav class="header-actions" aria-label="Ações do gerador">
      <!-- Badge de Erros (Vermelho) -->
      <button
        v-if="errorCount > 0"
        class="problems-badge has-errors"
        @click="emit('toggleProblemsPanel')"
        :title="`${errorCount} erro(s)`"
      >
        <XCircle :size="15" class="badge-icon error-icon" />
        <span class="badge-count">{{ errorCount }}</span>
      </button>

      <!-- Badge de Warnings (Amarelo) -->
      <button
        v-if="warningCount > 0"
        class="problems-badge has-warnings"
        @click="emit('toggleProblemsPanel')"
        :title="`${warningCount} aviso(s)`"
      >
        <AlertTriangle :size="15" class="badge-icon warning-icon" />
        <span class="badge-count">{{ warningCount }}</span>
      </button>

      <button class="icon-btn" @click="emit('newProject')" title="Novo Projeto / Limpar">
        <Eraser :size="19" />
      </button>

      <button class="icon-btn" @click="triggerImportLocal" title="Importar SQL">
        <Upload :size="19" />
      </button>

      <div class="export-dropdown">
        <button
          class="icon-btn"
          :class="{ active: showExportDropdown }"
          @mouseenter="showExportDropdown = true"
          aria-label="Menu de exportação"
          :aria-expanded="showExportDropdown"
        >
          <Download :size="19" aria-hidden="true" />
        </button>

        <div
          v-if="showExportDropdown"
          class="dropdown-menu"
          role="menu"
          @mouseenter="showExportDropdown = true"
          @mouseleave="showExportDropdown = false"
        >
          <div class="dropdown-header">Exportar como...</div>
          <button @click="emit('exportSql')" class="dropdown-item">
            <FileCode :size="17" class="dropdown-icon-lucide" />
            <span>Arquivo SQL</span>
          </button>
          <button @click="emit('exportDiagramPNG')" class="dropdown-item">
            <ImageIcon :size="17" class="dropdown-icon-lucide" />
            <span>Imagem PNG</span>
          </button>
          <button @click="emit('exportDiagramSVG')" class="dropdown-item">
            <Code2 :size="17" class="dropdown-icon-lucide" />
            <span>Vetor SVG</span>
          </button>
        </div>
      </div>

      <div class="header-divider"></div>

      <button
        class="icon-btn toggle-btn"
        @click="emit('toggleEditor')"
        title="Ocultar Editor"
      >
        <ChevronLeft :size="21" />
      </button>

      <input
        ref="fileInputRef"
        type="file"
        accept=".sql,text/sql,.txt"
        @change="(e) => emit('fileImport', e)"
        style="display: none"
      />
    </nav>
  </header>
</template>

<style scoped>
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #020617;
  padding: 0 16px;
  height: 56px;
  min-height: 56px;
  border-bottom: 1px solid #1e293b;
  user-select: none;
  -webkit-user-select: none;
  flex-shrink: 0;
  box-sizing: border-box;
}

.brand-area {
  display: flex;
  align-items: center;
}

.brand-link {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.editor-logo {
  height: 38px;
  width: auto;
  max-height: 38px;
  object-fit: contain;
  display: block;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  width: 34px;
  height: 34px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  user-select: none;
}

.icon-btn:hover,
.icon-btn.active {
  background-color: #1e293b;
  color: #5eead4;
}

.problems-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.problems-badge.has-errors {
  background-color: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.problems-badge.has-warnings {
  background-color: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.header-divider {
  width: 1px;
  height: 22px;
  background-color: #1e293b;
  margin: 0 4px;
}

.export-dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background-color: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 6px;
  min-width: 175px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dropdown-header {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  padding: 5px 10px 6px;
  letter-spacing: 0.5px;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 12px;
  border-radius: 6px;
  background: none;
  border: none;
  color: #cbd5e1;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.dropdown-item:hover {
  background-color: #1e293b;
  color: #5eead4;
}

.dropdown-icon-lucide {
  color: #94a3b8;
  flex-shrink: 0;
}

.dropdown-item:hover .dropdown-icon-lucide {
  color: #5eead4;
}
</style>
