<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { Key, Link } from "lucide-vue-next";
import type { Table, Column } from "@/domain/models/databaseSchema";

const props = withDefaults(
  defineProps<{
    table: Table;
    displayName?: string;
    errorMessage?: string | null;
    x: number;
    y: number;
    isSelected: boolean;
    isPanMode: boolean;
    headerHeight: number;
    rowHeight: number;
    tableWidth: number;
    tableHeight: number;
    selectedTablesCount: number;
    highlightedColumns: Set<string>;
    detailLevel?: 'full' | 'simplified';
  }>(),
  {
    detailLevel: 'full',
  }
);

const emit = defineEmits<{
  (e: 'startDrag', event: PointerEvent | MouseEvent, tableName: string): void;
  (e: 'rename', previousName: string, newName: string, originalName: string): void;
  (e: 'renameColumn', tableName: string, oldColName: string, newColName: string): void;
  (e: 'changeColumnType', tableName: string, colName: string, oldType: string, newType: string): void;
  (e: 'columnHover', data: {
    tableName?: string;
    columnName?: string;
    isHovering: boolean;
    isPk?: boolean;
    isFk?: boolean;
    refTable?: string | null;
  }): void;
}>();

const isInheritanceColumn = (col: Column) => {
  return !!(props.table?.isInheritance && col.isPk && col.isFk);
};

const isColumnHovered = (columnName: string) => {
  return props.highlightedColumns.has(`${props.table.name}.${columnName}`);
};

const isTableColumnHighlighted = (column: Column) => {
  if (props.selectedTablesCount <= 1) return false;
  return props.isSelected && (column.isPk || column.isFk);
};

const handleDragStart = (event: PointerEvent | MouseEvent) => {
  if (event.button === 0 || event.button === undefined) {
    emit('startDrag', event, props.table.name);
  }
};

const isEditing = ref(false);
const localInput = ref(props.displayName !== undefined ? props.displayName : props.table.name);

watch(
  () => [props.displayName, props.table.name],
  () => {
    if (!isEditing.value) {
      localInput.value = props.displayName !== undefined ? props.displayName : props.table.name;
    }
  }
);

const handleTitleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const previousSqlName = localInput.value;
  const cleanValue = target.value.replace(/\s+/g, '');
  
  if (target.value !== cleanValue) {
    const cursor = Math.max(0, (target.selectionStart || 1) - 1);
    target.value = cleanValue;
    target.setSelectionRange(cursor, cursor);
  }

  const newSqlName = cleanValue;
  localInput.value = newSqlName;

  if (previousSqlName !== newSqlName) {
    emit('rename', previousSqlName, newSqlName, props.table.name);
    const cursor = target.selectionStart;
    nextTick(() => {
      if (document.activeElement === target && cursor !== null) {
        target.setSelectionRange(cursor, cursor);
      }
    });
  }
};

const hoveredRowIndex = ref<number | null>(null);
const editingColIndex = ref<number | null>(null);
const editingColValues = ref<Record<number, { name: string; type: string }>>({});

const getColNameValue = (col: Column, colIndex: number) => {
  if (editingColIndex.value === colIndex && editingColValues.value[colIndex]) {
    return editingColValues.value[colIndex].name;
  }
  return col.name;
};

const getColTypeValue = (col: Column, colIndex: number) => {
  if (editingColIndex.value === colIndex && editingColValues.value[colIndex]) {
    return editingColValues.value[colIndex].type;
  }
  return col.type;
};

const handleTitleFocus = () => {
  isEditing.value = true;
};

const handleTitleBlur = () => {
  isEditing.value = false;
  localInput.value = props.displayName !== undefined ? props.displayName : props.table.name;
};

const handleColumnNameInput = (col: Column, colIndex: number, event: Event) => {
  const target = event.target as HTMLInputElement;
  const previousColName = getColNameValue(col, colIndex);
  const cleanValue = target.value.replace(/\s+/g, '');

  if (target.value !== cleanValue) {
    const cursor = Math.max(0, (target.selectionStart || 1) - 1);
    target.value = cleanValue;
    target.setSelectionRange(cursor, cursor);
  }

  const newColName = cleanValue;
  editingColIndex.value = colIndex;
  editingColValues.value[colIndex] = {
    name: newColName,
    type: editingColValues.value[colIndex]?.type ?? col.type,
  };

  if (previousColName !== newColName) {
    emit('renameColumn', localInput.value || props.table.name, previousColName, newColName);
    const cursorPosition = target.selectionStart;
    nextTick(() => {
      if (document.activeElement === target && cursorPosition !== null) {
        target.setSelectionRange(cursorPosition, cursorPosition);
      }
    });
  }
};

const handleColumnTypeInput = (col: Column, colIndex: number, event: Event) => {
  const target = event.target as HTMLInputElement;
  const previousType = getColTypeValue(col, colIndex);
  const currentColName = getColNameValue(col, colIndex);
  const newType = target.value;

  editingColIndex.value = colIndex;
  editingColValues.value[colIndex] = {
    name: currentColName,
    type: newType,
  };

  if (previousType !== newType) {
    emit('changeColumnType', localInput.value || props.table.name, currentColName, previousType, newType);
    const cursorPosition = target.selectionStart;
    nextTick(() => {
      if (document.activeElement === target && cursorPosition !== null) {
        target.setSelectionRange(cursorPosition, cursorPosition);
      }
    });
  }
};

const handleColumnBlur = () => {
  editingColIndex.value = null;
  editingColValues.value = {};
};
</script>

<template>
  <g
    :transform="`translate(${x}, ${y})`"
    class="table-group"
    :class="{ 
      selected: isSelected, 
      'is-error': !!errorMessage,
      'is-simplified': detailLevel === 'simplified' 
    }"
    :style="{ cursor: isPanMode ? 'grab' : 'move' }"
    @pointerdown="handleDragStart"
  >
    <title v-if="errorMessage">{{ errorMessage }}</title>
    <rect
      :width="tableWidth"
      :height="tableHeight"
      class="table-bg"
      :class="{ selected: isSelected }"
      rx="6"
    />

    <path
      :d="`M0 6 Q0 0 6 0 L${tableWidth - 6} 0 Q${tableWidth} 0 ${tableWidth} 6 L${tableWidth} ${headerHeight} L0 ${headerHeight} Z`"
      class="table-header-rect"
    />
    <foreignObject
      v-if="detailLevel === 'full'"
      :x="11"
      :y="3.5"
      :width="tableWidth - 22"
      :height="headerHeight - 8"
      class="table-title-foreign"
    >
      <div class="table-title-wrapper" xmlns="http://www.w3.org/1999/xhtml">
        <span class="table-title-input-sizer" :data-value="localInput">
          <input
            :value="localInput"
            type="text"
            class="table-title-input"
            :class="{ 'is-title-error': !!errorMessage }"
            @click.stop
            @pointerdown.stop
            @mousedown.stop
            @focus="handleTitleFocus"
            @blur="handleTitleBlur"
            @input="handleTitleInput"
            @keydown.space.prevent.stop
            @keydown.enter.stop="(e) => (e.target as HTMLElement)?.blur()"
            aria-label="Nome da tabela no diagrama"
          />
        </span>
      </div>
    </foreignObject>
    <rect
      v-else
      :x="15"
      :y="12"
      :width="Math.min(tableWidth - 30, Math.max(50, (displayName !== undefined ? displayName : table.name).length * 7.5))"
      height="11"
      rx="3"
      class="table-header-skeleton"
    />

    <!-- Modo Completo (Zoom Normal ou Exportação) -->
    <template v-if="detailLevel === 'full'">
      <g 
        v-for="(col, colIndex) in table.columns" 
        :key="colIndex"
        @mouseenter="hoveredRowIndex = colIndex"
        @mouseleave="hoveredRowIndex === colIndex ? hoveredRowIndex = null : null"
      >
        <rect
          v-if="!col.isPk && !col.isFk"
          :x="0"
          :y="headerHeight + colIndex * rowHeight"
          :width="tableWidth"
          :height="rowHeight"
          :fill="hoveredRowIndex === colIndex ? 'var(--clr-hover)' : 'transparent'"
          class="column-neutral-hover"
        />

        <rect
          v-if="col.isPk || col.isFk"
          :x="0"
          :y="headerHeight + colIndex * rowHeight"
          :width="tableWidth"
          :height="rowHeight"
          fill="transparent"
          class="column-hover-area"
          @mouseenter="emit('columnHover', { tableName: table.name, columnName: col.name, isPk: col.isPk, isFk: col.isFk, refTable: col.refTable, isHovering: true })"
          @mouseleave="emit('columnHover', { isHovering: false })"
        />

        <rect
          v-if="col.isPk || col.isFk"
          :x="0"
          :y="headerHeight + colIndex * rowHeight"
          :width="tableWidth"
          :height="rowHeight"
          :fill="col.isPk ? 'var(--diagram-col-highlight-pk)' : 'var(--diagram-col-highlight-fk)'"
          :rx="colIndex === table.columns.length - 1 ? 6 : 0"
          class="column-highlight-bg"
          :class="{ 'is-active': isColumnHovered(col.name) || isTableColumnHighlighted(col) }"
          style="pointer-events: none"
        />

        <g
          :transform="`translate(15, ${headerHeight + 20 + colIndex * rowHeight - 12})`"
          style="pointer-events: none; transform-origin: top left;"
        >
          <template v-if="isInheritanceColumn(col)">
            <g class="pk-icon" style="display:inline-block;">
              <Key :size="18" stroke-width="2" />
            </g>
            <g class="fk-icon" style="display:inline-block; transform: translateX(22px);">
              <Link :size="17" stroke-width="2" />
            </g>
          </template>

          <g v-else-if="col.isPk && !col.isFk" class="pk-icon">
            <Key :size="18" stroke-width="2" style="display: block;" />
          </g>
          <g v-else-if="col.isFk" class="fk-icon">
            <Link :size="17" stroke-width="2" style="display: block;" />
          </g>
        </g>

        <foreignObject
          :x="isInheritanceColumn(col) ? 60 : (col.isPk || col.isFk ? 36 : 11)"
          :y="headerHeight + colIndex * rowHeight + 4"
          :width="Math.max(120, tableWidth - (isInheritanceColumn(col) ? 75 : (col.isPk || col.isFk ? 50 : 25)))"
          :height="rowHeight - 8"
          class="col-name-foreign"
          @mouseenter="col.isPk || col.isFk ? emit('columnHover', { tableName: table.name, columnName: col.name, isPk: col.isPk, isFk: col.isFk, refTable: col.refTable, isHovering: true }) : null"
        >
          <div class="col-input-wrapper" xmlns="http://www.w3.org/1999/xhtml">
            <span class="col-name-input-sizer" :data-value="getColNameValue(col, colIndex)">
              <input
                :value="getColNameValue(col, colIndex)"
                type="text"
                class="col-name-input"
                :style="{ fontWeight: col.isPk ? '600' : '500' }"
                @click.stop
                @pointerdown.stop
                @mousedown.stop
                @input="handleColumnNameInput(col, colIndex, $event)"
                @blur="handleColumnBlur"
                @keydown.space.prevent.stop
                @keydown.enter.stop="(e) => (e.target as HTMLElement)?.blur()"
                aria-label="Nome da coluna"
              />
            </span>
          </div>
        </foreignObject>

        <foreignObject
          :x="15"
          :y="headerHeight + colIndex * rowHeight + 4"
          :width="tableWidth - 30"
          :height="rowHeight - 8"
          class="col-type-foreign"
          @mouseenter="col.isPk || col.isFk ? emit('columnHover', { tableName: table.name, columnName: col.name, isPk: col.isPk, isFk: col.isFk, refTable: col.refTable, isHovering: true }) : null"
        >
          <div class="col-input-wrapper is-end" xmlns="http://www.w3.org/1999/xhtml">
            <span class="col-type-input-sizer" :data-value="getColTypeValue(col, colIndex)">
              <input
                :value="getColTypeValue(col, colIndex)"
                type="text"
                class="col-type-input"
                :class="{ 'pk-type': col.isPk }"
                @click.stop
                @pointerdown.stop
                @mousedown.stop
                @input="handleColumnTypeInput(col, colIndex, $event)"
                @blur="handleColumnBlur"
                @keydown.enter.stop="(e) => (e.target as HTMLElement)?.blur()"
                aria-label="Tipo da coluna"
              />
            </span>
          </div>
        </foreignObject>

        <g
          v-if="col.isPk || col.isFk"
          class="column-highlight-borders"
          :class="{ 'is-active': isColumnHovered(col.name) || isTableColumnHighlighted(col) }"
          style="pointer-events: none"
        >
          <line
            :x1="0"
            :y1="headerHeight + colIndex * rowHeight + (colIndex === 0 ? 0.55 : 0)"
            :x2="tableWidth"
            :y2="headerHeight + colIndex * rowHeight + (colIndex === 0 ? 0.55 : 0)"
            :stroke="col.isPk ? 'var(--diagram-col-border-pk)' : 'var(--diagram-col-border-fk)'"
            stroke-width="1.1"
          />
          <line
            v-if="colIndex < table.columns.length - 1"
            :x1="0"
            :y1="headerHeight + (colIndex + 1) * rowHeight"
            :x2="tableWidth"
            :y2="headerHeight + (colIndex + 1) * rowHeight"
            :stroke="col.isPk ? 'var(--diagram-col-border-pk)' : 'var(--diagram-col-border-fk)'"
            stroke-width="1.1"
          />
        </g>
      </g>
    </template>

    <!-- Modo Simplificado / LOD (Zoom Out em Diagramas Grandes <= 20%) -->
    <template v-else>
      <g v-for="(col, colIndex) in table.columns" :key="colIndex">
        <template v-if="col.isPk || col.isFk">
          <circle
            :cx="18"
            :cy="headerHeight + 20 + colIndex * rowHeight - 4"
            r="3.5"
            :fill="col.isPk ? 'var(--diagram-col-border-pk)' : 'var(--diagram-col-border-fk)'"
          />
          <rect
            :x="28"
            :y="headerHeight + 20 + colIndex * rowHeight - 6"
            :width="Math.min(tableWidth - 46, 52 + (colIndex % 4) * 22)"
            height="3.5"
            rx="1.75"
            class="column-skeleton-line"
            :class="{ 'skeleton-pk': col.isPk, 'skeleton-fk': col.isFk }"
          />
        </template>
        <rect
          v-else
          :x="18"
          :y="headerHeight + 20 + colIndex * rowHeight - 6"
          :width="Math.min(tableWidth - 36, 44 + (colIndex % 4) * 20)"
          height="3.5"
          rx="1.75"
          class="column-skeleton-line"
        />
      </g>
    </template>

    <rect
      :width="tableWidth"
      :height="tableHeight"
      class="table-rect"
      :class="{ selected: isSelected }"
      rx="6"
    />
  </g>
</template>

<style scoped>
.table-group {
  user-select: none;
}

.table-bg {
  fill: var(--diagram-table-bg, #ffffff);
  filter: drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1));
  transition: filter 0.16s ease-out, fill 0.16s ease-out;
}

.table-rect {
  fill: none;
  stroke: transparent;
  stroke-width: 1px;
  pointer-events: none;
  transition: stroke 0.16s ease-out, stroke-width 0.16s ease-out;
}

/* Hover na tabela não selecionada: restaura o azul característico (#0041d826) */
.table-group:not(.selected):hover .table-bg {
  filter: drop-shadow(0 6px 12px rgba(0, 65, 216, 0.15)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08));
}

.table-group:not(.selected):hover .table-rect {
  stroke: var(--diagram-table-border-hover, #192747);
  stroke-width: 1px;
}

/* Tabela selecionada: preserva permanentemente o box-shadow azul mesmo ao passar hover nas colunas */
.table-group.selected .table-bg,
.table-bg.selected,
.table-group.selected:hover .table-bg {
  filter: drop-shadow(0 0 2px var(--diagram-table-shadow-selected, rgba(59, 130, 246, 0.3))) drop-shadow(0 0 4px var(--diagram-table-shadow-selected, rgba(59, 130, 246, 0.35)));
}

.table-group.selected .table-rect,
.table-rect.selected,
.table-group.selected:hover .table-rect {
  stroke: var(--diagram-table-border-selected, #192747ff);
  stroke-width: 2.5px;
}

/* Tabela com erro de sintaxe SQL: prioridade visual de alerta vermelho */
.table-group.is-error .table-rect,
.table-group.is-error:hover .table-rect,
.table-group.is-error.selected .table-rect {
  stroke: #ef4444 !important;
  stroke-width: 2px !important;
}

.table-group.is-error .table-bg,
.table-group.is-error:hover .table-bg {
  filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.35)) !important;
}

.table-group.is-simplified .table-bg,
.table-group.is-simplified:hover .table-bg {
  filter: none;
}

.table-header-rect {
  fill: var(--diagram-table-header, #192747);
  transition: fill 0.16s ease-out;
}

.table-title-foreign {
  overflow: visible;
  pointer-events: auto;
  opacity: 0.999;
}

.table-title-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
}

.table-title-input-sizer {
  position: relative;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  min-width: 10px;
  max-width: 100%;
  flex-shrink: 1;
  border-radius: 4px;
  background-color: transparent;
  transition: background-color 0.15s ease;
}

.table-title-input-sizer:hover,
.table-title-input-sizer:focus-within {
  background-color: rgba(255, 255, 255, 0.12);
}

.table-title-input-sizer::after,
.table-title-input {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
  font-family: var(--diagram-font, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif);
  line-height: 1;
  padding: 3px 4px 4px 4px;
  box-sizing: border-box;
  white-space: pre;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: geometricPrecision;
}

.table-title-input-sizer::after {
  content: attr(data-value) "\200B";
  visibility: hidden;
  pointer-events: none;
  overflow: hidden;
}

.table-title-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  color: var(--diagram-table-title, #ffffff);
  border: none;
  outline: none;
  box-shadow: none;
  border-radius: 4px;
  text-align: left;
  background-color: transparent;
  cursor: text;
}

.table-title-input.is-title-error {
  color: #f87171 !important;
}

.table-title {
  font-size: 14px;
  font-weight: 700;
  fill: var(--diagram-table-title, #ffffff);
  font-family: var(--diagram-font, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif);
  user-select: none;
  pointer-events: auto;
  cursor: text;
  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
  /* Mantém suavização grayscale constante, evitando alternância ClearType durante animações/transições do SVG */
  opacity: 0.999;
}

.table-header-skeleton {
  fill: var(--diagram-table-title);
  opacity: 0.55;
  pointer-events: none;
}

.col-name-foreign,
.col-type-foreign {
  overflow: visible;
  pointer-events: none;
  opacity: 0.999;
}

.col-input-wrapper {
  display: flex;
  align-items: center;
  width: max-content;
  min-width: 100%;
  height: 100%;
  pointer-events: none;
}

.col-input-wrapper.is-end {
  justify-content: flex-end;
}

.col-name-input-sizer,
.col-type-input-sizer {
  position: relative;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  min-width: 6px;
  border-radius: 4px;
  background-color: transparent;
  pointer-events: auto;
}

.col-name-input-sizer:hover,
.col-name-input-sizer:focus-within,
.col-type-input-sizer:hover,
.col-type-input-sizer:focus-within {
  background-color: var(--clr-hover, rgba(0, 0, 0, 0.06));
}

.col-name-input-sizer::after,
.col-name-input {
  font-size: 12px;
  font-weight: 500;
  font-family: var(--diagram-font, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif);
  line-height: 1.2;
  padding: 1px 3px;
  box-sizing: border-box;
  white-space: pre;
}

.col-name-input-sizer::after,
.col-type-input-sizer::after {
  content: attr(data-value) "\200B";
  visibility: hidden;
  pointer-events: none;
  overflow: hidden;
}

.col-name-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  color: var(--diagram-table-text, #2c3e50);
  border: none;
  outline: none;
  box-shadow: none;
  border-radius: 4px;
  text-align: left;
  background-color: transparent;
  cursor: text;
}

.col-type-input-sizer::after,
.col-type-input {
  font-family: "Fira Code", "JetBrains Mono", monospace;
  font-size: 10.5px;
  letter-spacing: 0.1px;
  line-height: 1.2;
  padding: 1px 3px;
  box-sizing: border-box;
  white-space: pre;
}

.col-type-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  color: var(--diagram-table-text-type, #7f8c8d);
  border: none;
  outline: none;
  box-shadow: none;
  border-radius: 4px;
  text-align: right;
  background-color: transparent;
  cursor: text;
}

.col-type-input.pk-type {
  color: var(--diagram-table-text-pk, #475569);
  font-weight: 600;
}

.col-text {
  font-size: 12px;
  fill: var(--diagram-table-text, #2c3e50);
  font-family: var(--diagram-font, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif);
  user-select: none;
  pointer-events: none;
}

.col-type {
  font-size: 10.5px;
  fill: var(--diagram-table-text-type, #7f8c8d);
  font-family: "Fira Code", "JetBrains Mono", SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-weight: 400;
  letter-spacing: 0.1px;
  user-select: none;
  pointer-events: none;
  opacity: 0.9;
}

.col-type.pk-type {
  fill: var(--diagram-table-text-pk, #475569);
  font-weight: 600;
  opacity: 1;
}

.pk-icon {
  color: #1abc9c;
}

.fk-icon {
  color: #3498db;
}

.column-neutral-hover {
  transition: fill 0.16s ease-out;
}

.column-neutral-hover:hover {
  fill: var(--clr-hover);
}

.column-hover-area {
  cursor: pointer;
}

.column-highlight-bg {
  opacity: 0;
  transition: opacity 0.16s ease-out;
}

.column-highlight-bg.is-active {
  opacity: 1;
}

.column-highlight-borders {
  opacity: 0;
  transition: opacity 0.16s ease-out;
}

.column-highlight-borders.is-active {
  opacity: 1;
}

.column-skeleton-line {
  fill: var(--diagram-table-text-type);
  opacity: 0.22;
  pointer-events: none;
}

.column-skeleton-line.skeleton-pk {
  fill: var(--diagram-col-border-pk);
  opacity: 0.55;
}

.column-skeleton-line.skeleton-fk {
  fill: var(--diagram-col-border-fk);
  opacity: 0.55;
}
</style>
