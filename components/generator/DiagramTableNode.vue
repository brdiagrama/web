<script setup lang="ts">
import { Key, Link } from "lucide-vue-next";
import type { Table, Column } from "@/domain/models/databaseSchema";

const props = defineProps<{
  table: Table;
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
}>();

const emit = defineEmits<{
  (e: 'startDrag', event: PointerEvent | MouseEvent, tableName: string): void;
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
</script>

<template>
  <g
    :transform="`translate(${x}, ${y})`"
    class="table-group"
    :class="{ selected: isSelected }"
    :style="{ cursor: isPanMode ? 'grab' : 'move' }"
    @pointerdown="handleDragStart"
  >
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
    <text :x="15" :y="22" class="table-title">{{ table.name }}</text>

    <g v-for="(col, colIndex) in table.columns" :key="colIndex">
      <rect
        v-if="!col.isPk && !col.isFk"
        :x="0"
        :y="headerHeight + colIndex * rowHeight"
        :width="tableWidth"
        :height="rowHeight"
        fill="transparent"
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

      <text
        :x="isInheritanceColumn(col) ? 64 : (col.isPk || col.isFk ? 40 : 15)"
        :y="headerHeight + 20 + colIndex * rowHeight"
        class="col-text"
        :font-weight="col.isPk ? '600' : '400'"
        style="pointer-events: none"
      >
        {{ col.name }}
      </text>

      <text
        :x="tableWidth - 15"
        :y="headerHeight + 20 + colIndex * rowHeight"
        text-anchor="end"
        class="col-type"
        :class="{ 'pk-type': col.isPk }"
        :font-weight="col.isPk ? '600' : '400'"
        style="pointer-events: none"
      >
        {{ col.type }}
      </text>

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
  transition: stroke 0.16s ease-out, stroke-width 0.16s ease-out, filter 0.16s ease-out;
}

.table-group:not(.selected):hover .table-bg {
  filter: drop-shadow(0 10px 15px -3px rgba(25, 39, 71, 0.15)), drop-shadow(0 4px 6px -4px rgba(25, 39, 71, 0.1));
}

.table-group:not(.selected):hover .table-rect {
  stroke: var(--diagram-table-border-hover, #192747);
  stroke-width: 1px;
}

.table-group.selected .table-bg,
.table-bg.selected {
  filter: drop-shadow(0 0 2px var(--diagram-table-shadow-selected, rgba(59, 130, 246, 0.3))) drop-shadow(0 0 4px var(--diagram-table-shadow-selected, rgba(59, 130, 246, 0.35)));
}

.table-group.selected .table-rect,
.table-rect.selected {
  stroke: var(--diagram-table-border-selected, #192747ff);
  stroke-width: 2.5px;
}

.table-group.selected:hover .table-bg {
  filter: drop-shadow(0 0 4px var(--diagram-table-shadow-selected, rgba(59, 130, 246, 0.45))) drop-shadow(0 10px 20px -3px rgba(25, 39, 71, 0.25));
}

.table-group.selected:hover .table-rect {
  stroke: var(--diagram-table-border-selected, #192747ff);
  stroke-width: 2.5px;
}

.table-header-rect {
  fill: var(--diagram-table-header, #192747);
  transition: fill 0.16s ease-out;
}

.table-title {
  font-size: 14px;
  font-weight: 700;
  fill: var(--diagram-table-title, #ffffff);
  font-family: var(--diagram-font, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif);
  user-select: none;
  pointer-events: none;
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
</style>
