<script setup lang="ts">
import { ref } from 'vue';
import { 
  XCircle, AlertTriangle, Eraser, Upload, Download, 
  FileCode, ImageIcon, Code2, ChevronLeft, Sun, Moon 
} from 'lucide-vue-next';
import { useGeneratorTheme } from '@/composables/useGeneratorTheme';
import DatabaseDialectSelector from './DatabaseDialectSelector.vue';
import IconButton from '@/components/shared/IconButton.vue';
import DropdownSelect, { type DropdownItem } from '@/components/shared/DropdownSelect.vue';

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

const { isEditorDark, toggleEditorTheme } = useGeneratorTheme();
const fileInputRef = ref<HTMLInputElement | null>(null);

const exportOptions: DropdownItem[] = [
  { id: 'sql', label: 'Arquivo SQL', icon: FileCode, iconType: 'component', action: () => emit('exportSql') },
  { id: 'png', label: 'Imagem PNG', icon: ImageIcon, iconType: 'component', action: () => emit('exportDiagramPNG') },
  { id: 'svg', label: 'Vetor SVG', icon: Code2, iconType: 'component', action: () => emit('exportDiagramSVG') },
];

const triggerImportLocal = () => {
  emit('triggerImport');
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};
</script>

<template>
  <header 
    class="editor-header" 
    :class="isEditorDark ? 'editor-dark' : 'editor-light'" 
    role="banner"
  >
    <div class="brand-area">
      <NuxtLink to="/" aria-label="Voltar para a página inicial do BrDiagrama" class="brand-link">
        <img
          src="~/assets/images/logo/logo-completa.svg"
          alt="BrDiagrama - Logo"
          class="editor-logo"
          width="141"
          height="34"
        />
      </NuxtLink>
      <DatabaseDialectSelector />
    </div>

    <nav class="header-actions" aria-label="Ações do gerador">
      <!-- Badge de Erros -->
      <v-tooltip
        v-if="errorCount > 0"
        :text="`${errorCount} erro(s) no SQL`"
        :aria-label="`${errorCount} erro(s) no SQL`"
        location="bottom"
        :theme="isEditorDark ? 'dark' : 'light'"
      >
        <template #activator="{ props: tooltipProps }">
          <button
            v-bind="tooltipProps"
            class="problems-badge has-errors"
            @click="emit('toggleProblemsPanel')"
            aria-label="Ver erros de sintaxe SQL"
          >
            <XCircle :size="14" class="badge-icon" />
            <span class="badge-count">{{ errorCount }}</span>
          </button>
        </template>
      </v-tooltip>

      <!-- Badge de Avisos -->
      <v-tooltip
        v-if="warningCount > 0"
        :text="`${warningCount} aviso(s) no SQL`"
        :aria-label="`${warningCount} aviso(s) no SQL`"
        location="bottom"
        :theme="isEditorDark ? 'dark' : 'light'"
      >
        <template #activator="{ props: tooltipProps }">
          <button
            v-bind="tooltipProps"
            class="problems-badge has-warnings"
            @click="emit('toggleProblemsPanel')"
            aria-label="Ver avisos de sintaxe SQL"
          >
            <AlertTriangle :size="14" class="badge-icon" />
            <span class="badge-count">{{ warningCount }}</span>
          </button>
        </template>
      </v-tooltip>

      <!-- Limpar / Novo Projeto -->
      <IconButton
        tooltip="Novo projeto (Limpar)"
        :theme="isEditorDark ? 'dark' : 'light'"
        aria-label="Novo projeto ou limpar tela"
        @click="emit('newProject')"
      >
        <Eraser :size="18" />
      </IconButton>

      <!-- Importar Arquivo SQL -->
      <IconButton
        tooltip="Importar arquivo SQL"
        :theme="isEditorDark ? 'dark' : 'light'"
        aria-label="Importar arquivo SQL do computador"
        @click="triggerImportLocal"
      >
        <Upload :size="18" />
      </IconButton>

      <!-- Menu de Exportação -->
      <DropdownSelect
        :items="exportOptions"
        :theme="isEditorDark ? 'dark' : 'light'"
        location="bottom end"
        :offset="8"
      >
        <template #activator="{ props: menuProps, isOpen }">
          <IconButton
            v-bind="menuProps"
            tooltip="Exportar"
            :theme="isEditorDark ? 'dark' : 'light'"
            :active="isOpen"
            aria-label="Menu de exportação"
          >
            <Download :size="18" />
          </IconButton>
        </template>
      </DropdownSelect>

      <!-- Alternar Tema do Painel Esquerdo (Editor + Cabeçalho) -->
      <IconButton
        :tooltip="isEditorDark ? 'Mudar editor para tema claro' : 'Mudar editor para tema escuro'"
        :theme="isEditorDark ? 'dark' : 'light'"
        :aria-label="isEditorDark ? 'Mudar editor para tema claro' : 'Mudar editor para tema escuro'"
        @click="(e: MouseEvent) => toggleEditorTheme(e)"
      >
        <Sun v-if="isEditorDark" :size="18" />
        <Moon v-else :size="18" />
      </IconButton>

      <div class="header-divider" aria-hidden="true"></div>

      <!-- Ocultar / Minimizar Editor -->
      <IconButton
        tooltip="Ocultar editor"
        :theme="isEditorDark ? 'dark' : 'light'"
        aria-label="Ocultar painel do editor"
        @click="emit('toggleEditor')"
      >
        <ChevronLeft :size="20" />
      </IconButton>

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
  padding: 0 16px;
  height: 56px;
  min-height: 56px;
  user-select: none;
  -webkit-user-select: none;
  flex-shrink: 0;
  box-sizing: border-box;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.editor-header.editor-dark {
  background-color: #1C1C1C !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
  color: #F0F0F0 !important;
}

.editor-header.editor-light {
  background-color: #FFFFFF !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08) !important;
  color: #1F1F1F !important;
}

.brand-area {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.brand-link {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.editor-logo {
  height: 34px;
  width: auto;
  max-height: 34px;
  object-fit: contain;
  display: block;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.problems-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.problems-badge.has-errors {
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.problems-badge.has-warnings {
  background-color: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.header-divider {
  width: 1px;
  height: 20px;
  margin: 0 4px;
}

.editor-header.editor-dark .header-divider {
  background-color: rgba(255, 255, 255, 0.08);
}

.editor-header.editor-light .header-divider {
  background-color: rgba(0, 0, 0, 0.08);
}
</style>
