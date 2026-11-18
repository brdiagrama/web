<script setup lang="ts">
import { Key, Link } from 'lucide-vue-next';
import type { DiagramColumnData, DiagramTableData } from '@/data/slidesPresentationData';

const props = withDefaults(
  defineProps<{
    table: DiagramTableData;
    active?: boolean;
    compact?: boolean;
    clickable?: boolean;
  }>(),
  {
    active: false,
    compact: false,
    clickable: false,
  }
);

const emit = defineEmits<{
  (e: 'selectTable', tableId: string): void;
  (e: 'selectColumn', payload: { tableId: string; column: DiagramColumnData }): void;
}>();

const getRowClass = (col: DiagramColumnData): Record<string, boolean> => {
  return {
    'is-pk': Boolean(col.isPk),
    'is-fk': Boolean(!col.isPk && col.isFk),
    'is-clickable': props.clickable,
  };
};

const handleCardClick = () => {
  if (props.clickable) {
    emit('selectTable', props.table.id);
  }
};

const handleRowClick = (col: DiagramColumnData) => {
  if (props.clickable) {
    emit('selectColumn', { tableId: props.table.id, column: col });
  }
};
</script>

<template>
  <div
    class="slide-diagram-card"
    :class="{ 'is-active': active, 'is-compact': compact, 'is-interactive': clickable }"
    @click="handleCardClick"
  >
    <div class="card-header">
      <span class="table-name">{{ table.name }}</span>
      <span v-if="table.subtitle" class="table-subtitle">{{ table.subtitle }}</span>
    </div>

    <div class="card-columns">
      <div
        v-for="col in table.columns"
        :key="col.name"
        class="column-row"
        :class="getRowClass(col)"
        @click.stop="handleRowClick(col)"
      >
        <div class="column-left">
          <span v-if="col.isPk || col.isFk" class="column-icons" aria-hidden="true">
            <Key v-if="col.isPk" :size="compact ? 12 : 14" :stroke-width="2.1" class="icon-pk" />
            <Link v-if="col.isFk" :size="compact ? 12 : 14" :stroke-width="2.1" class="icon-fk" />
          </span>
          <span class="column-name">{{ col.name }}</span>
        </div>
        <span class="column-type">{{ col.type }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.slide-diagram-card {
  background-color: #ffffff;
  border: 1px solid rgba(25, 39, 71, 0.16);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s ease, transform 0.2s ease;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
}

.slide-diagram-card.is-interactive {
  cursor: pointer;
}

.slide-diagram-card.is-interactive:hover {
  border-color: #192747;
}

.slide-diagram-card.is-active {
  border-color: #192747;
  box-shadow: 0 0 0 2px rgba(26, 186, 156, 0.25);
}

.card-header {
  background-color: #192747;
  color: #ffffff;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.is-compact .card-header {
  padding: 6px 10px;
}

.table-name {
  font-family: 'Google Sans Flex', system-ui, sans-serif;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: #ffffff;
}

.is-compact .table-name {
  font-size: 0.8125rem;
}

.table-subtitle {
  font-size: 0.6875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.72);
}

.card-columns {
  display: flex;
  flex-direction: column;
}

.column-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  transition: background-color 0.15s ease;
}

.is-compact .column-row {
  padding: 5px 10px;
  gap: 8px;
}

.column-row:first-child {
  border-top: none;
}

.column-row.is-pk {
  background-color: #edfefc;
  border-top-color: rgba(26, 186, 156, 0.35);
}

.column-row.is-fk {
  background-color: #eff6ff;
  border-top-color: rgba(59, 130, 246, 0.3);
}

.column-row.is-clickable:hover {
  filter: brightness(0.97);
}

.column-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.column-icons {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.icon-pk {
  color: #1aba9c;
}

.icon-fk {
  color: #3b82f6;
}

.column-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.column-row.is-pk .column-name {
  font-weight: 600;
  color: #111827;
}

.is-compact .column-name {
  font-size: 0.75rem;
}

.column-type {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.6875rem;
  font-weight: 500;
  color: #5e6368;
  flex-shrink: 0;
}

.column-row.is-pk .column-type {
  color: #0f766e;
  font-weight: 600;
}

.column-row.is-fk .column-type {
  color: #1d4ed8;
}
</style>
