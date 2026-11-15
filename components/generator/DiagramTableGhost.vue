<script setup lang="ts">
import { computed } from 'vue';
import { Key } from 'lucide-vue-next';
import type { SqlDialect } from '@/domain/sql/parser';

const props = withDefaults(
  defineProps<{
    x: number;
    y: number;
    width?: number;
    height?: number;
    isOutsideCanvas?: boolean;
    detailLevel?: 'full' | 'simplified';
    dialect?: SqlDialect;
  }>(),
  {
    width: 220,
    height: 99,
    isOutsideCanvas: false,
    detailLevel: 'full',
    dialect: 'MySQL',
  }
);

const pkTypeLabel = computed(() => {
  switch (props.dialect) {
    case 'PostgreSQL':
      return 'SERIAL';
    case 'SQLite':
      return 'INTEGER';
    case 'MySQL':
    case 'MariaDB':
    case 'TransactSQL':
    default:
      return 'INT';
  }
});
</script>

<template>
  <g
    :transform="`translate(${x}, ${y})`"
    class="table-ghost-group"
    :class="{ 'is-outside': isOutsideCanvas }"
    aria-hidden="true"
  >
    <rect
      :width="width"
      :height="height"
      rx="6"
      class="ghost-body"
    />

    <path
      :d="`M0 6 Q0 0 6 0 L${width - 6} 0 Q${width} 0 ${width} 6 L${width} 35 L0 35 Z`"
      class="ghost-header"
    />

    <template v-if="detailLevel === 'full'">
      <text :x="15" :y="22" class="table-title">
        nova_tabela
      </text>

      <g transform="translate(15, 43)" class="pk-icon">
        <Key :size="18" stroke-width="2" style="display: block;" />
      </g>
      <text :x="39" :y="55" class="col-text" font-weight="600">id</text>
      <text :x="width - 18" :y="55" text-anchor="end" class="col-type pk-type" font-weight="600">{{ pkTypeLabel }}</text>

      <text :x="14" :y="87" class="col-text" font-weight="500">nome</text>
      <text :x="width - 18" :y="87" text-anchor="end" class="col-type" font-weight="400">VARCHAR(100)</text>
    </template>

    <template v-else>
      <rect :x="15" :y="12" width="90" height="11" rx="3" class="ghost-skeleton-title" />
      <circle :cx="18" :cy="51" r="3.5" class="ghost-skeleton-pk" />
      <rect :x="28" :y="49" width="64" height="3.5" rx="1.75" class="ghost-skeleton-pk" />
      <rect :x="18" :y="81" width="84" height="3.5" rx="1.75" class="ghost-skeleton-line" />
    </template>

    <g :transform="`translate(${width / 2}, ${height + 18})`" class="ghost-hint-badge">
      <rect
        :x="-105"
        :y="-11"
        :width="210"
        :height="22"
        rx="11"
        class="ghost-hint-bg"
      />
      <text
        :x="0"
        :y="0"
        text-anchor="middle"
        dominant-baseline="central"
        class="ghost-hint-text"
        :class="{ 'is-hidden': !isOutsideCanvas }"
      >
        Leve até o canvas <tspan class="ghost-hint-pipe">|</tspan> Esc para cancelar
      </text>
      <text
        :x="0"
        :y="0"
        text-anchor="middle"
        dominant-baseline="central"
        class="ghost-hint-text"
        :class="{ 'is-hidden': isOutsideCanvas }"
      >
        Clique para soltar <tspan class="ghost-hint-pipe">|</tspan> Esc para cancelar
      </text>
    </g>
  </g>
</template>

<style scoped>
.table-ghost-group {
  pointer-events: none;
  user-select: none;
  transition: opacity 0.18s ease;
}

.ghost-body,
.ghost-header,
.table-title,
.pk-icon {
  transition: fill 0.18s ease, stroke 0.18s ease, color 0.18s ease;
}

.table-ghost-group.is-outside {
  opacity: 0.68;
}

.table-ghost-group.is-outside .ghost-body {
  fill: rgba(140, 140, 140, 0.08);
  stroke: rgba(140, 140, 140, 0.65);
}

.table-ghost-group.is-outside .ghost-header {
  fill: rgba(140, 140, 140, 0.18);
}

.table-ghost-group.is-outside .table-title,
.table-ghost-group.is-outside .pk-icon {
  fill: rgba(140, 140, 140, 0.85);
  color: rgba(140, 140, 140, 0.85);
}

.ghost-body {
  fill: rgba(26, 186, 156, 0.08);
  stroke: var(--clr-primary);
  stroke-width: 1.5;
  stroke-dasharray: 5 4;
}

.ghost-header {
  fill: rgba(26, 186, 156, 0.22);
}

.table-title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
  fill: var(--clr-primary);
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
  font-family: "Fira Code", "JetBrains Mono", monospace;
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

.ghost-skeleton-title {
  fill: var(--clr-primary);
  opacity: 0.4;
}

.ghost-skeleton-pk {
  fill: #1abc9c;
  opacity: 0.55;
}

.ghost-skeleton-line {
  fill: var(--diagram-table-text-type);
  opacity: 0.25;
}

.ghost-hint-bg {
  fill: #1e293b;
  opacity: 0.92;
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.25));
}

.ghost-hint-text {
  fill: #f8fafc;
  font-size: 11px;
  font-weight: 500;
  font-family: var(--diagram-font, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif);
  letter-spacing: 0.01em;
  pointer-events: none;
  user-select: none;
}

.ghost-hint-text.is-hidden {
  display: none;
}

.ghost-hint-pipe {
  fill: #64748b;
  font-weight: 300;
  margin: 0 4px;
}
</style>
