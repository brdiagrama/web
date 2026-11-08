<script setup lang="ts">
import { ref } from 'vue';
import { 
  XCircle, AlertTriangle, Eraser, Upload, Download, 
  FileCode, ImageIcon, Code2, ChevronLeft, Sun, Moon 
} from 'lucide-vue-next';
import { useGeneratorTheme } from '@/composables/useGeneratorTheme';

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

const showExportMenu = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

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
          width="auto"
          height="34"
        />
      </NuxtLink>
    </div>

    <nav class="header-actions" aria-label="Ações do gerador">
      <!-- Badge de Erros -->
      <v-tooltip v-if="errorCount > 0" :text="`${errorCount} erro(s) no SQL`" location="bottom" :theme="isEditorDark ? 'dark' : 'light'">
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
      <v-tooltip v-if="warningCount > 0" :text="`${warningCount} aviso(s) no SQL`" location="bottom" :theme="isEditorDark ? 'dark' : 'light'">
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
      <v-tooltip text="Novo projeto (Limpar)" location="bottom" :theme="isEditorDark ? 'dark' : 'light'">
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            icon
            variant="text"
            size="small"
            class="action-btn"
            aria-label="Novo projeto ou limpar tela"
            @click="emit('newProject')"
          >
            <Eraser :size="18" />
          </v-btn>
        </template>
      </v-tooltip>

      <!-- Importar Arquivo SQL -->
      <v-tooltip text="Importar arquivo SQL" location="bottom" :theme="isEditorDark ? 'dark' : 'light'">
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            icon
            variant="text"
            size="small"
            class="action-btn"
            aria-label="Importar arquivo SQL do computador"
            @click="triggerImportLocal"
          >
            <Upload :size="18" />
          </v-btn>
        </template>
      </v-tooltip>

      <!-- Menu de Exportação -->
      <v-menu v-model="showExportMenu" location="bottom end" :offset="8">
        <template #activator="{ props: menuProps }">
          <v-tooltip text="Exportar" location="bottom" :disabled="showExportMenu" :theme="isEditorDark ? 'dark' : 'light'">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                v-bind="{ ...menuProps, ...tooltipProps }"
                icon
                variant="text"
                size="small"
                class="action-btn"
                :class="{ 'btn-active': showExportMenu }"
                aria-label="Menu de exportação"
              >
                <Download :size="18" />
              </v-btn>
            </template>
          </v-tooltip>
        </template>

        <v-list 
          class="custom-dropdown-list" 
          :class="isEditorDark ? 'dropdown-dark' : 'dropdown-light'"
          density="compact" 
          elevation="4" 
          rounded="lg"
        >
          <v-list-item @click="emit('exportSql')" class="dropdown-list-item" rounded="md">
            <template #prepend>
              <FileCode :size="16" class="dropdown-icon" />
            </template>
            <v-list-item-title class="dropdown-item-title">Arquivo SQL</v-list-item-title>
          </v-list-item>

          <v-list-item @click="emit('exportDiagramPNG')" class="dropdown-list-item" rounded="md">
            <template #prepend>
              <ImageIcon :size="16" class="dropdown-icon" />
            </template>
            <v-list-item-title class="dropdown-item-title">Imagem PNG</v-list-item-title>
          </v-list-item>

          <v-list-item @click="emit('exportDiagramSVG')" class="dropdown-list-item" rounded="md">
            <template #prepend>
              <Code2 :size="16" class="dropdown-icon" />
            </template>
            <v-list-item-title class="dropdown-item-title">Vetor SVG</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- Alternar Tema do Painel Esquerdo (Editor + Cabeçalho) -->
      <v-tooltip :text="isEditorDark ? 'Mudar editor para tema claro' : 'Mudar editor para tema escuro'" location="bottom" :theme="isEditorDark ? 'dark' : 'light'">
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            icon
            variant="text"
            size="small"
            class="action-btn"
            :aria-label="isEditorDark ? 'Mudar editor para tema claro' : 'Mudar editor para tema escuro'"
            @click="(e: MouseEvent) => toggleEditorTheme(e)"
          >
            <Sun v-if="isEditorDark" :size="18" />
            <Moon v-else :size="18" />
          </v-btn>
        </template>
      </v-tooltip>

      <div class="header-divider" aria-hidden="true"></div>

      <!-- Ocultar / Minimizar Editor -->
      <v-tooltip text="Ocultar editor" location="bottom" :theme="isEditorDark ? 'dark' : 'light'">
        <template #activator="{ props: tooltipProps }">
          <v-btn
            v-bind="tooltipProps"
            icon
            variant="text"
            size="small"
            class="action-btn"
            aria-label="Ocultar painel do editor"
            @click="emit('toggleEditor')"
          >
            <ChevronLeft :size="20" />
          </v-btn>
        </template>
      </v-tooltip>

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
}

.action-btn {
  border-radius: 8px !important;
  transition: all 0.2s ease;
}

.editor-header.editor-dark .action-btn {
  color: #9AA0A6 !important;
}

.editor-header.editor-dark .action-btn:hover,
.editor-header.editor-dark .action-btn.btn-active {
  background-color: rgba(26, 186, 156, 0.15) !important;
  color: #1ABA9C !important;
}

.editor-header.editor-light .action-btn {
  color: #5E6368 !important;
}

.editor-header.editor-light .action-btn:hover,
.editor-header.editor-light .action-btn.btn-active {
  background-color: rgba(26, 186, 156, 0.12) !important;
  color: #1ABA9C !important;
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

/* Dropdown Menu de Exportação */
.custom-dropdown-list {
  padding: 6px !important;
  min-width: 170px;
}

.custom-dropdown-list.dropdown-dark {
  background-color: #1F1F1F !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  color: #F0F0F0 !important;
}

.custom-dropdown-list.dropdown-light {
  background-color: #FFFFFF !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  color: #1F1F1F !important;
}

.dropdown-list-item {
  cursor: pointer;
  padding: 8px 12px !important;
  min-height: 36px !important;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.dropdown-dark .dropdown-list-item {
  color: #F0F0F0 !important;
}

.dropdown-light .dropdown-list-item {
  color: #1F1F1F !important;
}

.dropdown-dark .dropdown-list-item:hover {
  background-color: rgba(26, 186, 156, 0.15) !important;
  color: #1ABA9C !important;
}

.dropdown-light .dropdown-list-item:hover {
  background-color: rgba(26, 186, 156, 0.12) !important;
  color: #1ABA9C !important;
}

.dropdown-icon {
  margin-right: 10px;
}

.dropdown-dark .dropdown-icon {
  color: #9AA0A6;
}

.dropdown-light .dropdown-icon {
  color: #5E6368;
}

.dropdown-list-item:hover .dropdown-icon {
  color: #1ABA9C;
}

.dropdown-item-title {
  font-size: 13px !important;
  font-weight: 500 !important;
  font-family: inherit !important;
}
</style>
