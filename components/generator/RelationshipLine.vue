<template>
  <g class="relationship-line" :class="{ 'is-active': isActive }">
    <path
      :d="pathData"
      class="connector-hitbox"
      @mouseenter="onHover"
      @mouseleave="onUnhover"
    />

    <path
      :d="pathData"
      class="connector-visual"
      :marker-start="markerStart"
      :marker-end="markerEnd"
    />

    <path v-show="isActive" :d="pathData" class="connector-flow" />

    <!-- Labels de Cardinalidade -->
    <text
      :x="labelPositions.start.x"
      :y="labelPositions.start.y"
      class="cardinality-label"
      :class="{ 'cardinality-hover': isActive }"
    >
      {{ cardinalityStart }}
    </text>

    <text
      :x="labelPositions.end.x"
      :y="labelPositions.end.y"
      class="cardinality-label"
      :class="{ 'cardinality-hover': isActive }"
    >
      {{ cardinalityEnd }}
    </text>
  </g>
</template>

<script setup>
import { ref, computed } from "vue";
import {
  calculateRelationshipPath,
  calculateLabelPositions,
  getMarkerForCardinality,
  getCardinalityText,
} from "@/domain/diagram/pathRouter";

const props = defineProps({
  relationship: { type: Object, required: true },
  fromTable: { type: Object, required: true },
  fromPos: { type: Object, required: true },
  toTable: { type: Object, required: true },
  toPos: { type: Object, required: true },
  fromTableWidth: { type: Number, required: true },
  toTableWidth: { type: Number, required: true },
  headerHeight: { type: Number, default: 35 },
  rowHeight: { type: Number, default: 32 },
  sourceOffsetY: { type: Number, default: 0 },
  targetOffsetY: { type: Number, default: 0 },
  selectedTables: { type: Set, default: () => new Set() },
  hoveredColumn: { type: Object, default: null },
});

const isHovered = ref(false);

const isActive = computed(() => {
  if (isHovered.value) return true;

  if (
    props.selectedTables.has(props.relationship.fromTable) ||
    props.selectedTables.has(props.relationship.toTable)
  ) {
    return true;
  }

  if (props.hoveredColumn) {
    const { tableName, columnName, isFk, isPk } = props.hoveredColumn;
    const rel = props.relationship;

    const isRelated =
      (isFk && tableName === rel.fromTable && columnName === rel.fromCol) ||
      (isPk && tableName === rel.toTable && columnName === rel.toCol);

    return isRelated;
  }

  return false;
});

const onHover = () => {
  isHovered.value = true;
};

const onUnhover = () => {
  isHovered.value = false;
};

const markerStart = computed(() => {
  const base = getMarkerForCardinality(props.relationship.cardinality, "start");
  return isActive.value ? `url(#${base}Hover)` : `url(#${base})`;
});

const markerEnd = computed(() => {
  const base = getMarkerForCardinality(props.relationship.cardinality, "end");
  return isActive.value ? `url(#${base}Hover)` : `url(#${base})`;
});

const cardinalityStart = computed(() =>
  getCardinalityText(props.relationship.cardinality, "start")
);

const cardinalityEnd = computed(() =>
  getCardinalityText(props.relationship.cardinality, "end")
);

const routerOptions = computed(() => ({
  fromTableWidth: props.fromTableWidth,
  toTableWidth: props.toTableWidth,
  headerHeight: props.headerHeight,
  rowHeight: props.rowHeight,
  sourceOffsetY: props.sourceOffsetY,
  targetOffsetY: props.targetOffsetY,
}));

const pathData = computed(() =>
  calculateRelationshipPath(props.fromTable, props.fromPos, props.toTable, props.toPos, props.relationship, routerOptions.value)
);

const labelPositions = computed(() =>
  calculateLabelPositions(props.fromTable, props.fromPos, props.toTable, props.toPos, props.relationship, routerOptions.value)
);
</script>

<style scoped>
:deep(svg) {
  overflow: visible;
}

.connector-hitbox {
  fill: none;
  stroke: transparent;
  stroke-width: 25px;
  cursor: pointer;
}

.connector-visual {
  fill: none;
  stroke: #7f8c8d;
  stroke-width: 2px;
  pointer-events: none;
  transition: stroke 0.3s ease, stroke-width 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.3s ease;
}

.relationship-line.is-active .connector-visual {
  stroke: #192747;
  stroke-width: 2px;
  filter: drop-shadow(0 0 2px rgba(25, 39, 71, 0.5));
}

@keyframes flowDash {
  to {
    stroke-dashoffset: 40px;
  }
}

.connector-flow {
  fill: none;
  stroke: #4facfe;
  stroke-width: 2px;
  pointer-events: none;
  stroke-dasharray: 3 10;
  animation: flowDash 2.5s linear infinite;
  opacity: 0.8;
}

.cardinality-label {
  font-size: 0px;
  fill: #7f8c8d;
  font-weight: 600;
  font-family: "Segoe UI", sans-serif;
  pointer-events: none;
  user-select: none;
  transition: opacity 0.2s, transform 0.2s, fill 0.2s;
}

.cardinality-label.cardinality-hover {
  font-size: 20px;
  fill: #192747;
  font-weight: 700;
}

.relationship-line {
  transition: transform 0.15s ease-out;
  transform-origin: center center;
}
</style>
