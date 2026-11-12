<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { 
  Database, Plus, Search, ChevronRight, 
  Key, Link2, Sun, Moon, TableProperties 
} from "lucide-vue-next";
import IconButton from "@/components/shared/IconButton.vue";
import type { Table } from "@/domain/models/databaseSchema";
import { useGeneratorTheme } from "@/composables/useGeneratorTheme";
import { useDiagram } from "@/composables/useDiagram";

const props = defineProps<{
  tables: Record<string, Table>;
  tableOrder?: string[];
}>();

const emit = defineEmits<{
  (e: "collapse"): void;
  (e: "addTable"): void;
  (e: "focusTable", tableName: string): void;
}>();

const { isModelingDark, toggleModelingTheme } = useGeneratorTheme();
const { 
  isStampActive, 
  toggleStampMode, 
  selectedTableNames, 
  selectTable, 
  renameTable, 
  renameColumn, 
  changeColumnType, 
  draftTableNames, 
  tableErrors 
} = useDiagram();

const getCardErrorMessage = (tableName: string) => {
  return tableErrors.value?.[tableName] || null;
};

const localTableNames = ref<Record<string, string>>({});
const activeInputKey = ref<string | null>(null);

const getTableKey = (table: Table) => table.id || table.name;

watch(
  () => props.tables,
  (newTables) => {
    if (!newTables) return;
    for (const name in newTables) {
      const table = newTables[name];
      const key = getTableKey(table);
      if (activeInputKey.value !== key) {
        localTableNames.value[key] = table.name;
      }
    }
  },
  { immediate: true, deep: true }
);

const getTableNameValue = (table: Table) => {
  const key = getTableKey(table);
  if (activeInputKey.value === key) {
    return localTableNames.value[key] ?? table.name;
  }
  if (draftTableNames.value && table.name in draftTableNames.value) {
    return draftTableNames.value[table.name];
  }
  return localTableNames.value[key] ?? table.name;
};

const handleTableNameInput = (table: Table, event: Event) => {
  const target = event.target as HTMLInputElement;
  const key = getTableKey(table);
  const previousSqlName = getTableNameValue(table);
  const cleanValue = target.value.replace(/\s+/g, '');

  if (target.value !== cleanValue) {
    const cursor = Math.max(0, (target.selectionStart || 1) - 1);
    target.value = cleanValue;
    target.setSelectionRange(cursor, cursor);
  }

  const newSqlName = cleanValue;

  localTableNames.value[key] = newSqlName;
  activeInputKey.value = key;

  if (previousSqlName !== newSqlName) {
    if (expandedTables.value.has(table.name) || expandedTables.value.has(previousSqlName)) {
      if (newSqlName) {
        expandedTables.value.add(newSqlName);
      }
    }

    renameTable(previousSqlName, newSqlName, table.name);

    const cursorPosition = target.selectionStart;
    nextTick(() => {
      if (document.activeElement === target && cursorPosition !== null) {
        target.setSelectionRange(cursorPosition, cursorPosition);
      }
    });
  }
};

const handleTableNameBlur = () => {
  activeInputKey.value = null;
};

const activeColKey = ref<string | null>(null);
const localColValues = ref<Record<string, { name: string; type: string }>>({});

const getColKey = (table: Table, colIndex: number) => `${getTableKey(table)}_col_${colIndex}`;

const getColNameValue = (table: Table, col: any, colIndex: number) => {
  const key = getColKey(table, colIndex);
  if (activeColKey.value === key && localColValues.value[key]) {
    return localColValues.value[key].name;
  }
  return col.name;
};

const getColTypeValue = (table: Table, col: any, colIndex: number) => {
  const key = getColKey(table, colIndex);
  if (activeColKey.value === key && localColValues.value[key]) {
    return localColValues.value[key].type;
  }
  return col.type;
};

const handleColumnNameInput = (table: Table, col: any, colIndex: number, event: Event) => {
  const target = event.target as HTMLInputElement;
  const key = getColKey(table, colIndex);
  const previousColName = getColNameValue(table, col, colIndex);
  const currentColType = getColTypeValue(table, col, colIndex);
  const cleanValue = target.value.replace(/\s+/g, '');

  if (target.value !== cleanValue) {
    const cursor = Math.max(0, (target.selectionStart || 1) - 1);
    target.value = cleanValue;
    target.setSelectionRange(cursor, cursor);
  }

  const newColName = cleanValue;
  activeColKey.value = key;
  localColValues.value[key] = {
    name: newColName,
    type: currentColType,
  };

  if (previousColName !== newColName) {
    const effectiveTableName = getTableNameValue(table) || table.name;
    renameColumn(effectiveTableName, previousColName, newColName);
    const cursorPosition = target.selectionStart;
    nextTick(() => {
      if (document.activeElement === target && cursorPosition !== null) {
        target.setSelectionRange(cursorPosition, cursorPosition);
      }
    });
  }
};

const handleColumnTypeInput = (table: Table, col: any, colIndex: number, event: Event) => {
  const target = event.target as HTMLInputElement;
  const key = getColKey(table, colIndex);
  const currentColName = getColNameValue(table, col, colIndex);
  const previousColType = getColTypeValue(table, col, colIndex);
  const newType = target.value;

  activeColKey.value = key;
  localColValues.value[key] = {
    name: currentColName,
    type: newType,
  };

  if (previousColType !== newType) {
    const effectiveTableName = getTableNameValue(table) || table.name;
    changeColumnType(effectiveTableName, currentColName, previousColType, newType);
    const cursorPosition = target.selectionStart;
    nextTick(() => {
      if (document.activeElement === target && cursorPosition !== null) {
        target.setSelectionRange(cursorPosition, cursorPosition);
      }
    });
  }
};

const handleColumnBlur = () => {
  activeColKey.value = null;
  localColValues.value = {};
};

const searchQuery = ref("");
const expandedTables = ref<Set<string>>(new Set());
const scrollContainerRef = ref<HTMLElement | null>(null);

watch(searchQuery, (val) => {
  if (val === null || val === undefined) {
    searchQuery.value = "";
  }
});

const naturalCompare = (a: string, b: string) => {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
};

const tableList = computed(() => {
  const allNames = Object.keys(props.tables).sort(naturalCompare);

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

const isInternalClick = ref(false);
const lastCenteredTableName = ref<string | null>(null);

const toggleExpandTable = (tableName: string) => {
  if (expandedTables.value.has(tableName)) {
    expandedTables.value.delete(tableName);
  } else {
    isInternalClick.value = true;
    lastCenteredTableName.value = tableName;
    expandedTables.value.add(tableName);
    selectTable(tableName, false);
    emit("focusTable", tableName);
  }
};

const isTableExpanded = (tableName: string) => expandedTables.value.has(tableName);

const isBatchExpanding = ref(false);

const scrollToCard = (tableName: string) => {
  const cardEl = scrollContainerRef.value?.querySelector(
    `[data-table-name="${CSS.escape(tableName)}"]`
  );
  if (cardEl) {
    cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

watch(
  () => Array.from(selectedTableNames.value),
  async (selectedList, prevList = []) => {
    // Sincroniza acordeão com o estado de seleção:
    // Tabelas que foram desmarcadas fecham o acordeão
    const currentSet = new Set(selectedList);
    for (const prev of prevList) {
      if (!currentSet.has(prev)) {
        expandedTables.value.delete(prev);
      }
    }

    if (selectedList.length === 0) return;

    // Se mais de 2 tabelas forem selecionadas simultaneamente,
    // desativa a animação temporariamente para expansão instantânea e sem lag
    const isMulti = selectedList.length > 2;
    if (isMulti) {
      isBatchExpanding.value = true;
    }

    // Abre todas as tabelas atualmente selecionadas no canvas
    for (const name of selectedList) {
      if (props.tables[name]) {
        expandedTables.value.add(name);
      }
    }

    // Rola até a tabela selecionada pelo canvas se estiver fora da vizinhança (mais de 3 de distância)
    const latestSelected = selectedList[selectedList.length - 1];
    if (props.tables[latestSelected]) {
      if (!isInternalClick.value) {
        let shouldScroll = true;
        if (lastCenteredTableName.value) {
          const names = tableList.value.map(t => t.name);
          const prevIdx = names.indexOf(lastCenteredTableName.value);
          const newIdx = names.indexOf(latestSelected);
          if (prevIdx !== -1 && newIdx !== -1 && Math.abs(newIdx - prevIdx) <= 3) {
            shouldScroll = false;
          }
        }

        if (shouldScroll) {
          lastCenteredTableName.value = latestSelected;
          await nextTick();
          scrollToCard(latestSelected);
        }
      } else {
        isInternalClick.value = false;
      }
    }

    if (isMulti) {
      await nextTick();
      requestAnimationFrame(() => {
        isBatchExpanding.value = false;
      });
    }
  },
  { deep: true }
);
</script>

<template>
  <aside 
    class="modeling-panel" 
    :class="[
      isModelingDark ? 'panel-dark' : 'panel-light',
      { 'is-stamp-mode': isStampActive }
    ]"
    role="complementary"
    aria-label="Painel de modelagem ER"
  >
    <!-- Cabeçalho (56px alinhado à Toolbar) -->
    <header class="modeling-header">
      <div class="header-brand">
        <div class="brand-icon-wrap" aria-hidden="true">
          <Database :size="17" />
        </div>
        <span class="brand-title">Modelagem</span>
      </div>

      <nav class="header-actions" aria-label="Ações de modelagem">
        <!-- Alternar Tema -->
        <IconButton
          :tooltip="isModelingDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'"
          :theme="isModelingDark ? 'dark' : 'light'"
          size="small"
          @click="(e: MouseEvent) => toggleModelingTheme(e)"
        >
          <Sun v-if="isModelingDark" :size="18" />
          <Moon v-else :size="18" />
        </IconButton>

        <div class="header-divider" aria-hidden="true"></div>

        <!-- Recolher Painel -->
        <IconButton
          tooltip="Ocultar modelagem"
          :theme="isModelingDark ? 'dark' : 'light'"
          size="small"
          @click="emit('collapse')"
        >
          <ChevronRight :size="20" />
        </IconButton>
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

      <v-tooltip
        text="Nova Tabela (T) Clique para carimbar no canvas"
        location="bottom"
        :theme="isModelingDark ? 'dark' : 'light'"
      >
        <template #activator="{ props: tooltipProps }">
          <v-btn 
            v-bind="tooltipProps"
            class="create-table-btn"
            :class="{ 'is-stamp-active': isStampActive }"
            variant="flat"
            size="small"
            rounded="lg"
            @click="toggleStampMode"
            aria-label="Nova Tabela (Atalho T)"
          >
            <template #prepend>
              <Plus :size="15" />
            </template>
            Nova Tabela
            <span class="shortcut-tag" aria-hidden="true">T</span>
          </v-btn>
        </template>
      </v-tooltip>
    </div>

    <!-- Lista de Tabelas em Acordeão Limpo (Frameless) -->
    <div ref="scrollContainerRef" class="table-list-scroll">
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
          v-for="(table, index) in tableList" 
          :key="table.id || index"
          :data-table-name="table.name"
          class="table-accordion-card"
          :class="{ 
            'is-expanded': isTableExpanded(table.name),
            'is-selected': selectedTableNames.has(table.name),
            'is-error': !!getCardErrorMessage(table.name)
          }"
        >
          <!-- Cabeçalho do Card da Tabela -->
          <div 
            class="card-header"
            :title="getCardErrorMessage(table.name) || undefined"
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
              <TableProperties :size="14" class="table-entity-icon" aria-hidden="true" />

              <!-- Input Direto e Reativo em Tempo Real -->
              <span class="table-name-input-sizer" :data-value="getTableNameValue(table)">
                <input
                  :value="getTableNameValue(table)"
                  type="text"
                  class="table-name-input"
                  @click.stop
                  @pointerdown.stop
                  @mousedown.stop
                  @input="handleTableNameInput(table, $event)"
                  @blur="handleTableNameBlur"
                  @keydown.space.prevent.stop
                  @keydown.enter.stop="(e) => (e.target as HTMLElement)?.blur()"
                  aria-label="Nome da tabela"
                />
              </span>
            </div>

            <div class="card-meta">
              <span class="column-count">{{ table.columns.length }} campos</span>
            </div>
          </div>

          <!-- Corpo Expansível (Lista de Colunas) -->
          <v-expand-transition 
            :disabled="isBatchExpanding"
          >
            <div v-if="isTableExpanded(table.name)" class="card-collapse-wrapper">
              <div class="card-body">
                <div class="columns-table-view">
                  <div 
                    v-for="(col, colIndex) in table.columns" 
                    :key="`${table.name}_col_${colIndex}`"
                    class="column-row"
                  >
                    <div class="column-name-cell">
                      <span v-if="col.isPrimaryKey" class="badge-pk" title="Primary Key">
                        <Key :size="11" />
                      </span>
                      <span v-else-if="col.isForeignKey" class="badge-fk" title="Foreign Key">
                        <Link2 :size="11" />
                      </span>
                      <span class="column-name-input-sizer" :data-value="getColNameValue(table, col, colIndex)">
                        <input
                          :value="getColNameValue(table, col, colIndex)"
                          type="text"
                          class="column-name-input"
                          @click.stop
                          @pointerdown.stop
                          @mousedown.stop
                          @input="handleColumnNameInput(table, col, colIndex, $event)"
                          @blur="handleColumnBlur"
                          @keydown.space.prevent.stop
                          @keydown.enter.stop="(e) => (e.target as HTMLElement)?.blur()"
                          aria-label="Nome da coluna"
                        />
                      </span>
                    </div>

                    <div class="column-type-cell">
                      <span class="column-type-input-sizer" :data-value="getColTypeValue(table, col, colIndex)">
                        <input
                          :value="getColTypeValue(table, col, colIndex)"
                          type="text"
                          class="column-type-input"
                          @click.stop
                          @pointerdown.stop
                          @mousedown.stop
                          @input="handleColumnTypeInput(table, col, colIndex, $event)"
                          @blur="handleColumnBlur"
                          @keydown.enter.stop="(e) => (e.target as HTMLElement)?.blur()"
                          aria-label="Tipo da coluna"
                        />
                      </span>
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

/*  */.modeling-panel.is-stamp-mode {
  cursor: crosshair;
}

.modeling-panel.is-stamp-mode button,
.modeling-panel.is-stamp-mode [role="button"],
.modeling-panel.is-stamp-mode .v-btn,
.modeling-panel.is-stamp-mode .action-btn,
.modeling-panel.is-stamp-mode .card-header,
.modeling-panel.is-stamp-mode .column-row,
.modeling-panel.is-stamp-mode .add-column-row-btn {
  cursor: pointer;
}

.modeling-panel.is-stamp-mode input,
.modeling-panel.is-stamp-mode .v-field__input {
  cursor: text;
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
  --btn-neutral-bg: #2C2C2C;
  --btn-neutral-hover: #363636;
  --btn-neutral-text: #F0F0F0;
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
  --btn-neutral-bg: #EAECEF;
  --btn-neutral-hover: #DFE2E6;
  --btn-neutral-text: #1F1F1F;
  --scrollbar-thumb: rgba(0, 0, 0, 0.22);
  --scrollbar-thumb-hover: rgba(0, 0, 0, 0.38);
}

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
  font-weight: 500 !important;
  letter-spacing: normal !important;
  text-transform: none !important;
  background-color: var(--btn-neutral-bg) !important;
  border: none !important;
  color: var(--btn-neutral-text) !important;
  box-shadow: none !important;
  outline: none !important;
  outline-offset: 0 !important;
  flex-shrink: 0;
  transition: background-color 0.15s ease, color 0.15s ease !important;
  display: inline-flex !important;
  align-items: center !important;
}

.create-table-btn:hover {
  background-color: var(--btn-neutral-hover) !important;
  border: none !important;
  color: var(--btn-neutral-text) !important;
  box-shadow: none !important;
  outline: none !important;
  outline-offset: 0 !important;
}

.create-table-btn:focus,
.create-table-btn:focus-visible,
.create-table-btn:active,
.create-table-btn.v-btn--active {
  outline: none !important;
  outline-offset: 0 !important;
  border: none !important;
  box-shadow: none !important;
}

.create-table-btn :deep(.v-btn__overlay) {
  display: none !important;
}

.create-table-btn.is-stamp-active {
  background-color: var(--clr-primary) !important;
  border: none !important;
  color: #0F0F0F !important;
  font-weight: 500 !important;
  box-shadow: none !important;
  outline: none !important;
  outline-offset: 0 !important;
}

.create-table-btn.is-stamp-active:hover {
  background-color: var(--clr-primary-hover) !important;
  border: none !important;
  color: #0F0F0F !important;
  box-shadow: none !important;
  outline: none !important;
  outline-offset: 0 !important;
}

.shortcut-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
  background-color: rgba(140, 145, 155, 0.2);
  color: var(--panel-text-muted);
  margin-left: 6px;
  line-height: 1.2;
  transition: all 0.2s ease;
}

.create-table-btn.is-stamp-active .shortcut-tag {
  background-color: rgba(0, 0, 0, 0.18);
  color: #0F0F0F;
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
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
  contain: paint;
}

.table-accordion-card:hover {
  background-color: var(--panel-surface-elevated);
}

.table-accordion-card.is-selected {
  background-color: var(--panel-surface-elevated);
}

.table-accordion-card.is-error {
  box-shadow: inset 0 0 0 1.5px #ef4444;
}

.table-accordion-card.is-error .table-name-input {
  color: #ef4444;
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
  flex: 1;
  overflow: hidden;
  line-height: 1;
}

.chevron-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--panel-text-muted);
  transition: transform 0.25s cubic-bezier(0.2, 0, 0, 1);
  line-height: 1;
}

.table-accordion-card.is-expanded .chevron-indicator {
  transform: rotate(90deg);
}

.table-entity-icon {
  color: var(--panel-text-muted);
  opacity: 0.7;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s ease, color 0.2s ease;
}

.table-accordion-card:hover .table-entity-icon,
.table-accordion-card.is-selected .table-entity-icon {
  opacity: 1;
}

.table-accordion-card.is-expanded .table-entity-icon {
  color: var(--clr-primary);
  opacity: 1;
}

.table-name-input-sizer {
  position: relative;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  min-width: 10px;
  max-width: 100%;
  flex-shrink: 1;
  margin-left: -3px;
  border-radius: 4px;
  background-color: transparent;
  transition: background-color 0.15s ease;
}

.table-accordion-card:hover .table-name-input-sizer,
.table-name-input-sizer:focus-within {
  background-color: var(--panel-input-bg);
}

.panel-dark .table-accordion-card:hover .table-name-input-sizer,
.panel-dark .table-name-input-sizer:focus-within {
  background-color: rgba(255, 255, 255, 0.08);
}

.panel-light .table-accordion-card:hover .table-name-input-sizer,
.panel-light .table-name-input-sizer:focus-within {
  background-color: rgba(0, 0, 0, 0.06);
}

.table-name-input-sizer::after,
.table-name-input {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  font-family: inherit;
  line-height: 1.2;
  padding: 2px 3px;
  box-sizing: border-box;
  white-space: pre;
}

.table-name-input-sizer::after {
  content: attr(data-value) "\200B";
  visibility: hidden;
  pointer-events: none;
  overflow: hidden;
}

.table-name-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  color: var(--panel-text);
  border: none;
  outline: none;
  box-shadow: none;
  border-radius: 4px;
  text-align: left;
  background-color: transparent;
  cursor: text;
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

.column-name-input-sizer,
.column-type-input-sizer {
  position: relative;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  min-width: 8px;
  border-radius: 4px;
  background-color: transparent;
}

.column-row:hover .column-name-input-sizer,
.column-name-input-sizer:focus-within,
.column-row:hover .column-type-input-sizer,
.column-type-input-sizer:focus-within {
  background-color: rgba(255, 255, 255, 0.08);
}

.panel-light .column-row:hover .column-name-input-sizer,
.panel-light .column-name-input-sizer:focus-within,
.panel-light .column-row:hover .column-type-input-sizer,
.panel-light .column-type-input-sizer:focus-within {
  background-color: rgba(0, 0, 0, 0.06);
}

.column-name-input-sizer::after,
.column-name-input {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: -0.01em;
  font-family: inherit;
  line-height: 1.2;
  padding: 1px 3px;
  box-sizing: border-box;
  white-space: pre;
}

.column-name-input-sizer::after,
.column-type-input-sizer::after {
  content: attr(data-value) "\200B";
  visibility: hidden;
  pointer-events: none;
  overflow: hidden;
}

.column-name-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  color: var(--panel-text);
  border: none;
  outline: none;
  box-shadow: none;
  border-radius: 4px;
  text-align: left;
  background-color: transparent;
  cursor: text;
}

.column-type-input-sizer::after,
.column-type-input {
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 11px;
  line-height: 1.2;
  padding: 1px 3px;
  box-sizing: border-box;
  white-space: pre;
}

.column-type-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  color: var(--panel-text-muted);
  border: none;
  outline: none;
  box-shadow: none;
  border-radius: 4px;
  text-align: right;
  background-color: transparent;
  cursor: text;
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

