<template>
  <section
    class="canvas-panel"
    :class="isCanvasDark ? 'canvas-dark' : 'canvas-light'"
    aria-label="Área do diagrama ER"
  >
    <div class="install-button-wrapper">
      <InstallButton aria-label="Instalar aplicativo" />
    </div>

    <DiagramCanvas
      ref="diagramCanvasRef"
      class="canvas-container"
      @selectionArea="handleSelectionArea"
      @selectionSelecting="handleSelectionArea"
      @canvasPointerDown="clearSelectionOnCanvas"
    >
      <g v-if="tables && Object.keys(tables).length > 0">
        <!-- Relacionamentos (atrás das tabelas) -->
        <g class="relationships-layer">
          <RelationshipLine
            v-for="rel in relationshipsList"
            :key="rel.id"
            :relationship="rel"
            :from-table="tables[rel.fromTable]"
            :from-pos="positions[rel.fromTable] || { x: 0, y: 0 }"
            :to-table="tables[rel.toTable]"
            :to-pos="positions[rel.toTable] || { x: 0, y: 0 }"
            :from-table-width="calculateTableWidth(tables[rel.fromTable])"
            :to-table-width="calculateTableWidth(tables[rel.toTable])"
            :header-height="headerHeight"
            :row-height="rowHeight"
            :source-offset-y="edgeOffsets[rel.id]?.sourceOffsetY || 0"
            :target-offset-y="edgeOffsets[rel.id]?.targetOffsetY || 0"
            :selected-tables="selectedTableNames"
            :hovered-column="hoveredColumn"
          />
        </g>

        <!-- Tabelas -->
        <g class="tables-layer">
          <DiagramTableNode
            v-for="table in allTablesList"
            :key="table.name"
            :table="table"
            :x="positions[table.name]?.x || 0"
            :y="positions[table.name]?.y || 0"
            :is-selected="selectedTableNames.has(table.name)"
            :is-pan-mode="diagramStore.isPanMode"
            :header-height="headerHeight"
            :row-height="rowHeight"
            :table-width="calculateTableWidth(table)"
            :table-height="calculateTableHeight(table)"
            :selected-tables-count="selectedTableNames.size"
            :highlighted-columns="highlightedColumns"
            @start-drag="startDrag"
            @column-hover="handleColumnHover"
          />
        </g>
      </g>
    </DiagramCanvas>

    <!-- Overlay quando não há tabelas -->
    <div v-if="!tables || Object.keys(tables).length === 0" class="canvas-empty-overlay">
      <div class="canvas-empty-content">
        <div class="canvas-empty-icon" aria-hidden="true">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="2" y="3" width="7" height="6" rx="1.5" stroke="#2dd4bf" stroke-width="1.6" fill="#f8fffd"/>
            <rect x="15" y="3" width="7" height="6" rx="1.5" stroke="#2dd4bf" stroke-width="1.6" fill="#f8fffd"/>
            <rect x="2" y="15" width="7" height="6" rx="1.5" stroke="#2dd4bf" stroke-width="1.6" fill="#f8fffd"/>
            <path d="M9 6h6M5.5 9v6M18.5 9v6" stroke="#0d9488" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
        </div>
        <h3 class="canvas-empty-title">Nenhuma tabela para exibir</h3>
        <p class="canvas-empty-desc">Digite ou importe comandos SQL CREATE TABLE para gerar o diagrama.</p>
      </div>
    </div>

    <!-- Barra de Ferramentas Flutuante -->
    <DiagramToolbar
      :zoom-level="diagramStore.zoom"
      :is-pan-mode="diagramStore.isPanMode"
      :is-grid-visible="diagramStore.isGridVisible"
      @zoom-in="diagramCanvasRef?.zoomIn()"
      @zoom-out="diagramCanvasRef?.zoomOut()"
      @reset-zoom="diagramCanvasRef?.resetZoom()"
      @toggle-pan="diagramStore.togglePanMode()"
      @toggle-grid="diagramStore.toggleGrid()"
    />
  </section>
</template>

<script setup>
import { ref, computed } from "vue";
import DiagramCanvas from "~/components/generator/DiagramCanvas.vue";
import DiagramTableNode from "~/components/generator/DiagramTableNode.vue";
import RelationshipLine from "~/components/generator/RelationshipLine.vue";
import DiagramToolbar from "~/components/generator/DiagramToolbar.vue";
import InstallButton from "~/components/shared/InstallButton.vue";
import { useDiagram } from "@/composables/useDiagram";
import { useDiagramStore } from "@/stores/diagram";
import { calculateTableWidth, calculateTableHeight } from "@/domain/diagram/tableDimensions";
import { exportSvg, exportPng } from "@/utils/diagramExporter";
import { toastError } from "@/services/toastService";
import { useGeneratorTheme } from "@/composables/useGeneratorTheme";

const diagramStore = useDiagramStore();
const diagramCanvasRef = ref(null);
const { isCanvasDark, initCanvasTheme } = useGeneratorTheme();
initCanvasTheme();
const { tables, relationships, positions, edgeOffsets, selectedTableNames, hoveredColumn, tableOrder } = useDiagram();

const headerHeight = 35;
const rowHeight = 32;

const allTablesList = computed(() => {
  if (!tables.value) return [];
  const tableMap = tables.value;
  const order = tableOrder.value;
  if (!order || order.length === 0) {
    return Object.values(tableMap);
  }
  const ordered = [];
  for (const name of order) {
    if (tableMap[name]) {
      ordered.push(tableMap[name]);
    }
  }
  for (const name in tableMap) {
    if (!order.includes(name)) {
      ordered.push(tableMap[name]);
    }
  }
  return ordered;
});

const relationshipsList = computed(() => {
  if (!relationships.value) return [];
  return relationships.value;
});

const highlightedColumns = computed(() => {
  const highlighted = new Set();
  if (!hoveredColumn.value) return highlighted;

  const { tableName, columnName, isFk, isPk } = hoveredColumn.value;
  highlighted.add(`${tableName}.${columnName}`);

  if (isFk && relationships.value) {
    relationships.value.forEach((rel) => {
      if (rel.fromTable === tableName && rel.fromCol === columnName) {
        highlighted.add(`${rel.toTable}.${rel.toCol}`);
      }
    });
  }

  if (isPk && relationships.value) {
    relationships.value.forEach((rel) => {
      if (rel.toTable === tableName && rel.toCol === columnName) {
        highlighted.add(`${rel.fromTable}.${rel.fromCol}`);
      }
    });
  }

  return highlighted;
});

const handleColumnHover = (data) => {
  diagramStore.setHoveredColumn(data);
};

const clearSelectionOnCanvas = () => {
  diagramStore.clearSelection();
};

const handleSelectionArea = (area) => {
  if (!tables.value) return;
  const selected = [];

  for (const tableName in tables.value) {
    const table = tables.value[tableName];
    const pos = positions.value[tableName];
    if (!pos) continue;

    const tableWidth = calculateTableWidth(table);
    const tableHeight = calculateTableHeight(table);

    const intersects = !(
      area.x2 < pos.x ||
      area.x1 > pos.x + tableWidth ||
      area.y2 < pos.y ||
      area.y1 > pos.y + tableHeight
    );

    if (intersects) {
      selected.push(tableName);
    }
  }

  diagramStore.setSelectedTables(selected);
};

const startDrag = (event, tableName) => {
  if (diagramStore.isPanMode) return;
  if (event.button !== 0 && event.button !== undefined) return;

  if (!event.ctrlKey && !event.metaKey) {
    event.preventDefault();
  }

  diagramStore.selectTable(tableName, event.ctrlKey || event.metaKey);

  const initialPan = diagramStore.pan;
  const initialZoom = diagramStore.zoom;
  const initialMouseX = (event.clientX - initialPan.x) / initialZoom;
  const initialMouseY = (event.clientY - initialPan.y) / initialZoom;

  const initialPositions = {};
  selectedTableNames.value.forEach((name) => {
    if (positions.value[name]) {
      initialPositions[name] = { ...positions.value[name] };
    }
  });

  const onPointerMove = (e) => {
    const currentPan = diagramStore.pan;
    const currentZoom = diagramStore.zoom;
    const mouseX = (e.clientX - currentPan.x) / currentZoom;
    const mouseY = (e.clientY - currentPan.y) / currentZoom;
    const deltaX = mouseX - initialMouseX;
    const deltaY = mouseY - initialMouseY;

    selectedTableNames.value.forEach((name) => {
      const initial = initialPositions[name];
      if (initial) {
        diagramStore.updateTablePosition(name, {
          x: Math.round(initial.x + deltaX),
          y: Math.round(initial.y + deltaY),
        });
      }
    });
  };

  const onPointerUp = (e) => {
    if (e.button === 0 || e.button === undefined) {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    }
  };

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
};

const exportDiagramPNG = async () => {
  if (!tables.value || Object.keys(tables.value).length === 0) {
    toastError("Nada para exportar", "Não há tabelas no diagrama");
    return;
  }
  const svgElement = diagramCanvasRef.value?.svgRoot;
  if (!svgElement) {
    toastError("Erro na exportação", "Não foi possível acessar o diagrama");
    return;
  }
  await exportPng(svgElement, tables.value, positions.value, isCanvasDark.value);
};

const exportDiagramSVG = async () => {
  if (!tables.value || Object.keys(tables.value).length === 0) {
    toastError("Nada para exportar", "Não há tabelas no diagrama");
    return;
  }
  const svgElement = diagramCanvasRef.value?.svgRoot;
  if (!svgElement) {
    toastError("Erro na exportação", "Não foi possível acessar o diagrama");
    return;
  }
  await exportSvg(svgElement, tables.value, positions.value, isCanvasDark.value);
};

defineExpose({
  diagramCanvasRef,
  exportDiagramPNG,
  exportDiagramSVG,
});
</script>

<style scoped>
.canvas-panel {
  flex: 1;
  position: relative;
  background-color: var(--canvas-bg, #f0f2f5);
  transition: background-color 0.25s ease;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.canvas-container {
  width: 100%;
  height: 100%;
}

.install-button-wrapper {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 30;
}

.canvas-empty-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--clr-card-bg, rgba(255, 255, 255, 0.85));
  backdrop-filter: blur(4px);
  pointer-events: auto;
  z-index: 20;
}

.canvas-empty-content {
  text-align: center;
  color: var(--clr-text);
  background: var(--clr-bg-surface);
  padding: 24px 32px;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--clr-border);
  max-width: 520px;
  width: min(92%, 520px);
}

.canvas-empty-icon {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.canvas-empty-title {
  margin: 6px 0;
  font-size: 19px;
  color: var(--clr-text);
  font-weight: 700;
}

.canvas-empty-desc {
  margin: 0;
  color: var(--clr-text-muted);
  font-size: 14px;
}
</style>
