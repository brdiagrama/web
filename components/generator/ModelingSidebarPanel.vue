<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { 
  Database, Plus, Search, ChevronRight, ChevronDown, 
  Key, Link2, Sun, Moon, X, TableProperties 
} from "lucide-vue-next";
import type { Table } from "@/domain/models/databaseSchema";
import { useGeneratorTheme } from "@/composables/useGeneratorTheme";

const props = defineProps<{
  tables: Record<string, Table>;
  tableOrder?: string[];
}>();

const emit = defineEmits<{
  (e: "collapse"): void;
  (e: "addTable"): void;
}>();

const { isModelingDark, toggleModelingTheme } = useGeneratorTheme();

const searchQuery = ref("");
const expandedTables = ref<Set<string>>(new Set());

watch(searchQuery, (val) => {
  if (val === null || val === undefined) {
    searchQuery.value = "";
  }
});

const tableList = computed(() => {
  const allNames = props.tableOrder && props.tableOrder.length > 0 
    ? props.tableOrder.filter(name => props.tables[name])
    : Object.keys(props.tables);

  const query = (searchQuery.value || "").trim().toLowerCase();
  if (!query) {
    return allNames.map(name => props.tables[name]);
  }

  return allNames
    .map(name => props.tables[name])
    .filter(table => {
      const matchTableName = table.name.toLowerCase().includes(query);
      const matchColumnName = table.columns.some(col => col.name.toLowerCase().includes(query));
      return matchTableName || matchColumnName;
    });
});

const toggleExpandTable = (tableName: string) => {
  if (expandedTables.value.has(tableName)) {
    expandedTables.value.delete(tableName);
  } else {
    expandedTables.value.add(tableName);
  }
};

const isTableExpanded = (tableName: string) => expandedTables.value.has(tableName);
</script>

<template>
  <aside 
    class="modeling-panel" 
    :class="isModelingDark ? 'panel-dark' : 'panel-light'"
    role="complementary"
    aria-label="Painel de modelagem ER"
  >
    <!-- Cabeçalho (56px alinhado à Toolbar) -->
    <header class="modeling-header">
      <div class="header-brand">
        <div class="brand-icon-wrap" aria-hidden="true">
          <TableProperties :size="18" />
        </div>
        <span class="brand-title">Modelagem ER</span>
      </div>

      <nav class="header-actions" aria-label="Ações de modelagem">
        <!-- Alternar Tema -->
        <v-tooltip 
          :text="isModelingDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'" 
          location="bottom" 
          :theme="isModelingDark ? 'dark' : 'light'"
        >
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              icon
              variant="text"
              size="small"
              class="action-btn"
              :aria-label="isModelingDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'"
              @click="(e: MouseEvent) => toggleModelingTheme(e)"
            >
              <Sun v-if="isModelingDark" :size="18" />
              <Moon v-else :size="18" />
            </v-btn>
          </template>
        </v-tooltip>

        <div class="header-divider" aria-hidden="true"></div>

        <!-- Recolher Painel -->
        <v-tooltip 
          text="Ocultar modelagem" 
          location="bottom" 
          :theme="isModelingDark ? 'dark' : 'light'"
        >
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              icon
              variant="text"
              size="small"
              class="action-btn"
              aria-label="Ocultar painel de modelagem"
              @click="emit('collapse')"
            >
              <ChevronRight :size="20" />
            </v-btn>
          </template>
        </v-tooltip>
      </nav>
    </header>

    <!-- Barra de Ações Rápidas (Busca Vuetify + Botão Nova Tabela Vuetify) -->
    <div class="action-bar">
      <v-text-field
        v-model="searchQuery"
        placeholder="Buscar tabela ou coluna..."
        density="compact"
        variant="solo"
        flat
        hide-details
        single-line
        clearable
        rounded="lg"
        class="modeling-search-field"
        aria-label="Buscar tabela ou coluna"
        @click:clear="searchQuery = ''"
      >
        <template #prepend-inner>
          <Search :size="15" class="search-icon" aria-hidden="true" />
        </template>
      </v-text-field>

      <v-btn 
        class="create-table-btn"
        variant="flat"
        size="small"
        rounded="lg"
        @click="emit('addTable')"
        aria-label="Criar nova tabela"
      >
        <template #prepend>
          <Plus :size="15" />
        </template>
        Nova Tabela
      </v-btn>
    </div>

    <!-- Lista de Tabelas em Acordeão Limpo (Frameless) -->
    <div class="table-list-scroll">
      <div v-if="tableList.length === 0" class="empty-state">
        <div class="empty-icon-wrap" aria-hidden="true">
          <Database :size="28" />
        </div>
        <p class="empty-title">Nenhuma tabela encontrada</p>
        <p class="empty-subtitle">
          {{ searchQuery ? 'Nenhum resultado para a busca.' : 'Comece criando uma tabela ou colando SQL no editor.' }}
        </p>
        <button 
          v-if="!searchQuery"
          class="empty-action-btn"
          @click="emit('addTable')"
        >
          <Plus :size="14" />
          <span>Criar primeira tabela</span>
        </button>
      </div>

      <div v-else class="table-items-container">
        <div 
          v-for="table in tableList" 
          :key="table.name"
          class="table-accordion-card"
          :class="{ 'is-expanded': isTableExpanded(table.name) }"
        >
          <!-- Cabeçalho do Card da Tabela -->
          <div 
            class="card-header"
            @click="toggleExpandTable(table.name)"
            role="button"
            :aria-expanded="isTableExpanded(table.name)"
            tabindex="0"
            @keydown.enter="toggleExpandTable(table.name)"
            @keydown.space.prevent="toggleExpandTable(table.name)"
          >
            <div class="card-title-group">
              <span class="chevron-indicator" aria-hidden="true">
                <ChevronRight :size="15" class="chevron-icon" />
              </span>
              <span class="table-name">{{ table.name }}</span>
            </div>

            <div class="card-meta">
              <span class="column-count">{{ table.columns.length }} campos</span>
            </div>
          </div>

          <!-- Corpo Expansível (Lista de Colunas) -->
          <v-expand-transition>
            <div v-if="isTableExpanded(table.name)" class="card-collapse-wrapper">
              <div class="card-body">
                <div class="columns-table-view">
                  <div 
                    v-for="col in table.columns" 
                    :key="col.name"
                    class="column-row"
                  >
                    <div class="column-name-cell">
                      <span v-if="col.isPrimaryKey" class="badge-pk" title="Primary Key">
                        <Key :size="11" />
                      </span>
                      <span v-else-if="col.isForeignKey" class="badge-fk" title="Foreign Key">
                        <Link2 :size="11" />
                      </span>
                      <span class="column-name-text">{{ col.name }}</span>
                    </div>

                    <div class="column-type-cell">
                      <span class="column-type-text">{{ col.type }}</span>
                    </div>

                    <div 
                      v-if="(col.isNotNull && !col.isPrimaryKey) || (col.isUnique && !col.isPrimaryKey) || col.isAutoIncrement" 
                      class="column-flags-cell"
                    >
                      <span v-if="col.isNotNull && !col.isPrimaryKey" class="flag-tag">NN</span>
                      <span v-if="col.isUnique && !col.isPrimaryKey" class="flag-tag">UQ</span>
                      <span v-if="col.isAutoIncrement" class="flag-tag">AI</span>
                    </div>
                  </div>
                </div>

                <!-- Linha de Adicionar Coluna -->
                <button 
                  class="add-column-row-btn"
                  aria-label="Adicionar coluna nesta tabela"
                >
                  <Plus :size="13" />
                  <span>Adicionar coluna</span>
                </button>
              </div>
            </div>
          </v-expand-transition>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.modeling-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  background-color: var(--panel-bg);
  color: var(--panel-text);
  user-select: none;
  -webkit-user-select: none;
  transition: background-color 0.2s ease, color 0.2s ease;
}

/* Temas com contraste editorial refinado */
.modeling-panel.panel-dark {
  --panel-bg: #1C1C1C;
  --panel-surface: #242424;
  --panel-surface-elevated: #2C2C2C;
  --panel-border: rgba(255, 255, 255, 0.08);
  --panel-text: #F0F0F0;
  --panel-text-muted: #9AA0A6;
  --panel-hover: #2A2A2A;
  --panel-input-bg: #151515;
  --column-hover-bg: #3D3D3D;
  --scrollbar-thumb: rgba(255, 255, 255, 0.22);
  --scrollbar-thumb-hover: rgba(255, 255, 255, 0.38);
}

.modeling-panel.panel-light {
  --panel-bg: #FFFFFF;
  --panel-surface: #F8F9FA;
  --panel-surface-elevated: #EEF0F2;
  --panel-border: rgba(0, 0, 0, 0.08);
  --panel-text: #1F1F1F;
  --panel-text-muted: #5E6368;
  --panel-hover: #F1F3F4;
  --panel-input-bg: #F1F3F4;
  --column-hover-bg: #E5E7EB;
  --scrollbar-thumb: rgba(0, 0, 0, 0.22);
  --scrollbar-thumb-hover: rgba(0, 0, 0, 0.38);
}

/* Cabeçalho */
.modeling-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  min-height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid var(--panel-border);
  flex-shrink: 0;
  box-sizing: border-box;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--clr-primary);
}

.brand-title {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
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

.panel-dark .action-btn {
  color: #9AA0A6 !important;
}

.panel-dark .action-btn:hover {
  background-color: rgba(26, 186, 156, 0.15) !important;
  color: #1ABA9C !important;
}

.panel-light .action-btn {
  color: #5E6368 !important;
}

.panel-light .action-btn:hover {
  background-color: rgba(26, 186, 156, 0.12) !important;
  color: #1ABA9C !important;
}

.header-divider {
  width: 1px;
  height: 20px;
  margin: 0 4px;
}

.panel-dark .header-divider {
  background-color: rgba(255, 255, 255, 0.08);
}

.panel-light .header-divider {
  background-color: rgba(0, 0, 0, 0.08);
}

/* Barra de Ações Rápidas */
.action-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--panel-border);
  flex-shrink: 0;
}

.modeling-search-field {
  flex: 1;
}

.modeling-search-field :deep(.v-field) {
  border-radius: 8px !important;
  background-color: var(--panel-input-bg) !important;
  color: var(--panel-text) !important;
  font-size: 12.5px !important;
  box-shadow: none !important;
  border: none !important;
  min-height: 34px !important;
  height: 34px !important;
  padding-inline-start: 10px !important;
  padding-inline-end: 6px !important;
  transition: all 0.2s ease !important;
}

.modeling-search-field :deep(.v-field__outline) {
  display: none !important;
}

.modeling-search-field :deep(.v-field__input) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  min-height: 34px !important;
  height: 34px !important;
  font-size: 12.5px !important;
  color: var(--panel-text) !important;
}

.modeling-search-field :deep(input) {
  outline: none !important;
  box-shadow: none !important;
  border: none !important;
}

.modeling-search-field :deep(input:focus),
.modeling-search-field :deep(input:focus-visible),
.modeling-search-field :deep(.v-field__input:focus),
.modeling-search-field :deep(.v-field__input:focus-visible) {
  outline: none !important;
  outline-offset: 0 !important;
  box-shadow: none !important;
  border: none !important;
}

.modeling-search-field :deep(.v-field__input)::placeholder {
  color: var(--panel-text-muted) !important;
  opacity: 1 !important;
}

.modeling-search-field :deep(.v-field--focused) {
  box-shadow: 0 0 0 1.5px var(--clr-primary) !important;
}

.modeling-search-field :deep(.v-field__clearable) {
  cursor: pointer !important;
  opacity: 0.7;
  transition: opacity 0.15s ease;
}

.modeling-search-field :deep(.v-field__clearable:hover) {
  opacity: 1;
}

.modeling-search-field :deep(.v-field__clearable .v-icon) {
  cursor: pointer !important;
}

.search-icon {
  color: var(--panel-text-muted);
  margin-right: 4px;
}

.create-table-btn {
  height: 34px !important;
  padding: 0 12px !important;
  font-size: 12.5px !important;
  font-weight: 600 !important;
  letter-spacing: normal !important;
  text-transform: none !important;
  background-color: var(--clr-primary) !important;
  color: #0F0F0F !important;
  box-shadow: none !important;
  flex-shrink: 0;
  transition: background-color 0.15s ease;
}

.create-table-btn:hover {
  background-color: var(--clr-primary-hover) !important;
}

/* Scroll da Lista */
.table-list-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 14px;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) transparent;
}

.table-list-scroll::-webkit-scrollbar {
  width: 6px;
}

.table-list-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.table-list-scroll::-webkit-scrollbar-thumb {
  background-color: var(--scrollbar-thumb);
  border-radius: 6px;
}

.table-list-scroll::-webkit-scrollbar-thumb:hover {
  background-color: var(--scrollbar-thumb-hover);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 16px;
}

.empty-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background-color: var(--panel-surface);
  color: var(--panel-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.empty-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
}

.empty-subtitle {
  font-size: 12px;
  color: var(--panel-text-muted);
  line-height: 1.5;
  max-width: 240px;
  margin-bottom: 16px;
}

.empty-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 8px;
  background-color: var(--panel-surface);
  border: 1px solid var(--panel-border);
  color: var(--clr-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.empty-action-btn:hover {
  background-color: var(--panel-hover);
}

/* Cards do Acordeão Frameless */
.table-items-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.table-accordion-card {
  border-radius: 10px;
  background-color: var(--panel-surface);
  transition: background-color 0.2s ease;
  overflow: hidden;
  contain: paint;
}

.table-accordion-card:hover {
  background-color: var(--panel-surface-elevated);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
}

.card-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.chevron-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--panel-text-muted);
  transition: transform 0.25s cubic-bezier(0.2, 0, 0, 1);
}

.table-accordion-card.is-expanded .chevron-indicator {
  transform: rotate(90deg);
}

.table-name {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.column-count {
  font-size: 11.5px;
  color: var(--panel-text-muted);
}

/* Wrapper do Colapso (Zero padding/border para transição fluida a 0px) */
.card-collapse-wrapper {
  overflow: hidden;
  will-change: height;
}

/* Corpo do Card (Colunas) */
.card-body {
  padding: 2px 10px 10px 10px;
  border-top: 1px solid var(--panel-border);
}

.columns-table-view {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-top: 6px;
}

.column-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 12px;
  gap: 12px;
  transition: background-color 0.15s ease, color 0.15s ease;
  cursor: pointer;
}

.column-row:hover {
  background-color: var(--column-hover-bg);
}

.column-name-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.badge-pk {
  display: inline-flex;
  align-items: center;
  color: #F59E0B;
  flex-shrink: 0;
}

.badge-fk {
  display: inline-flex;
  align-items: center;
  color: #3B82F6;
  flex-shrink: 0;
}

.column-name-text {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.column-type-cell {
  flex-shrink: 0;
  text-align: right;
  margin-left: auto;
}

.column-type-text {
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 11px;
  color: var(--panel-text-muted);
}

.column-flags-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.flag-tag {
  font-size: 9.5px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 4px;
  background-color: rgba(140, 145, 155, 0.18);
  color: var(--panel-text-muted);
}

.add-column-row-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 7px 8px;
  margin-top: 4px;
  border-radius: 6px;
  border: 1px dashed var(--panel-border);
  background: transparent;
  color: var(--panel-text-muted);
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-column-row-btn:hover {
  border-color: var(--clr-primary);
  color: var(--clr-primary);
  background-color: rgba(26, 186, 156, 0.06);
}
</style>

