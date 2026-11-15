<template>
  <section
    class="canvas-panel"
    :class="isCanvasDark ? 'canvas-dark' : 'canvas-light'"
    aria-label="Área do diagrama ER"
    @pointerdown.capture="blurActiveInput"
  >
    <div class="install-button-wrapper">
      <InstallButton aria-label="Instalar aplicativo" />
    </div>

    <DiagramProgressLoader />

    <DiagramCanvas
      ref="diagramCanvasRef"
      class="canvas-container"
      @selectionArea="handleSelectionArea"
      @selectionSelecting="handleSelectionArea"
      @canvasPointerDown="clearSelectionOnCanvas"
      @stampPlaced="handleStampPlaced"
    >
      <g v-if="tables && Object.keys(tables).length > 0">
        <g class="relationships-layer">
          <RelationshipLine
            v-for="rel in renderedRelationshipsList"
            :key="rel.id"
            :relationship="rel"
            :from-table="tables[rel.fromTable]"
            :from-pos="positions[rel.fromTable] || { x: 0, y: 0 }"
            :to-table="tables[rel.toTable]"
            :to-pos="positions[rel.toTable] || { x: 0, y: 0 }"
            :from-table-width="tableDimensionsMap[rel.fromTable]?.width || 220"
            :to-table-width="tableDimensionsMap[rel.toTable]?.width || 220"
            :header-height="headerHeight"
            :row-height="rowHeight"
            :source-offset-y="edgeOffsets[rel.id]?.sourceOffsetY || 0"
            :target-offset-y="edgeOffsets[rel.id]?.targetOffsetY || 0"
            :selected-tables="selectedTableNames"
            :hovered-column="hoveredColumn"
            :detail-level="detailLevel"
          />
        </g>

        <!-- Tabelas -->
        <g class="tables-layer">
          <DiagramTableNode
            v-for="(table, index) in renderedTablesList"
            :key="table.id || index"
            :table="table"
            :display-name="getTableDisplayName(table.name)"
            :error-message="getTableErrorMessage(table.name)"
            :x="positions[table.name]?.x ?? 0"
            :y="positions[table.name]?.y ?? 0"
            :is-selected="selectedTableNames.has(table.name)"
            :is-pan-mode="diagramStore.isPanMode"
            :header-height="headerHeight"
            :row-height="rowHeight"
            :table-width="tableDimensionsMap[table.name]?.width || 220"
            :table-height="tableDimensionsMap[table.name]?.height || 35"
            :selected-tables-count="selectedTableNames.size"
            :highlighted-columns="highlightedColumns"
            :draft-columns="draftColumnNames"
            :draft-column-types="draftColumnTypes"
            :detail-level="detailLevel"
            @start-drag="startDrag"
            @select-table="(tableName) => diagramStore.selectTable(tableName, false)"
            @rename="handleTableRename"
            @rename-column="handleColumnRename"
            @change-column-type="handleColumnTypeChange"
            @column-hover="handleColumnHover"
          />
        </g>
      </g>
    </DiagramCanvas>

    <Transition name="empty-state-fade">
      <div v-if="(!tables || Object.keys(tables).length === 0) && !diagramStore.loadingProgress.isLoading && !diagramStore.isStampActive" class="canvas-empty-overlay">
        <div class="canvas-empty-content">
          <div class="canvas-empty-icon" aria-hidden="true">
            <svg
              width="280"
              height="57"
              viewBox="0 0 1153 233"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <g>
                <path
                  d="M92 77C138.944 77 177 61.33 177 42C177 22.67 138.944 7 92 7C45.0558 7 7 22.67 7 42C7 61.33 45.0558 77 92 77Z"
                  stroke="rgba(140, 140, 140, 0.45)"
                  stroke-width="10"
                />
                <path
                  d="M7 42V192C7.39283 196.603 9.98041 201.161 14.615 205.414C19.2496 209.667 25.8404 213.531 34.0112 216.786C42.1819 220.041 51.7726 222.622 62.2356 224.384C72.6986 226.146 83.829 227.052 94.9914 227.052C106.154 227.052 117.129 226.146 127.292 224.384C137.454 222.622 146.604 220.041 154.219 216.786C161.835 213.531 167.766 209.667 171.675 205.414C175.583 201.161 177.393 196.603 177 192V42M7 92C7.39283 96.6031 9.98041 101.161 14.615 105.414C19.2496 109.667 25.8404 113.531 34.0112 116.786C42.1819 120.041 51.7726 122.622 62.2356 124.384C72.6986 126.146 83.829 127.052 94.9914 127.052C106.154 127.052 117.129 126.146 127.292 124.384C137.454 122.622 146.604 120.041 154.219 116.786C161.835 113.531 167.766 109.667 171.675 105.414C175.583 101.161 177.393 96.6031 177 92M7 142C7.39283 146.603 9.98041 151.161 14.615 155.414C19.2496 159.667 25.8404 163.531 34.0112 166.786C42.1819 170.041 51.7726 172.622 62.2356 174.384C72.6986 176.146 83.829 177.052 94.9914 177.052C106.154 177.052 117.129 176.146 127.292 174.384C137.454 172.622 146.604 170.041 154.219 166.786C161.835 163.531 167.766 159.667 171.675 155.414C175.583 151.161 177.393 146.603 177 142"
                  stroke="rgba(140, 140, 140, 0.45)"
                  stroke-width="10"
                />
              </g>
              <path
                d="M178 99.6105C757.573 405.738 375.005 -121.72 970 109.598"
                stroke="rgba(140, 140, 140, 0.45)"
                stroke-width="8"
                stroke-linecap="round"
                fill="none"
              />
              <g>
                <rect x="969" y="20" width="181" height="207" rx="8" stroke="rgba(140, 140, 140, 0.45)" stroke-width="10" />
                <rect x="969" y="20" width="181" height="41" stroke="rgba(140, 140, 140, 0.45)" stroke-width="10" />
              </g>
              <circle r="15" fill="#1ABA9C">
                <animateMotion
                  dur="5s"
                  begin="0s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyPoints="0;1;0"
                  keyTimes="0;0.5;1"
                  keySplines="0.455 0.03 0.515 0.955; 0.455 0.03 0.515 0.955"
                  path="M178 99.6105C757.573 405.738 375.005 -121.72 970 109.598"
                />
              </circle>
            </svg>
          </div>
          <h3 class="canvas-empty-title">Nenhuma tabela no diagrama</h3>
          <p class="canvas-empty-desc">Escreva ou importe SQL no editor, ou crie tabelas pelo painel de modelagem.</p>
        </div>
      </div>
    </Transition>

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

    <Teleport to="body">
      <Transition name="stamp-preview-fade">
        <div
          v-if="diagramStore.isStampActive && stampScreenPos"
          class="global-stamp-preview-host"
          :style="{
            left: `${stampScreenPos.x}px`,
            top: `${stampScreenPos.y}px`,
          }"
        >
          <!-- Camada Claro -->
          <div
            v-if="showLightLayer"
            class="global-stamp-preview canvas-light"
            :style="{ clipPath: lightClipPath }"
          >
            <svg
              width="240"
              height="140"
              viewBox="0 0 240 140"
              style="overflow: visible"
              :style="{
                transform: `scale(${diagramStore.zoom})`,
                transformOrigin: 'top left',
              }"
            >
              <DiagramTableGhost
                :x="0"
                :y="0"
                :is-outside-canvas="!isStampInsideCanvas"
                :detail-level="detailLevel"
                :dialect="diagramStore.sqlDialect"
              />
            </svg>
          </div>

          <!-- Camada Escuro -->
          <div
            v-if="showDarkLayer"
            class="global-stamp-preview canvas-dark"
            :style="{ clipPath: darkClipPath }"
          >
            <svg
              width="240"
              height="140"
              viewBox="0 0 240 140"
              style="overflow: visible"
              :style="{
                transform: `scale(${diagramStore.zoom})`,
                transformOrigin: 'top left',
              }"
            >
              <DiagramTableGhost
                :x="0"
                :y="0"
                :is-outside-canvas="!isStampInsideCanvas"
                :detail-level="detailLevel"
                :dialect="diagramStore.sqlDialect"
              />
            </svg>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from "vue";
import DiagramCanvas from "~/components/generator/DiagramCanvas.vue";
import DiagramTableNode from "~/components/generator/DiagramTableNode.vue";
import DiagramTableGhost from "~/components/generator/DiagramTableGhost.vue";
import RelationshipLine from "~/components/generator/RelationshipLine.vue";
import DiagramToolbar from "~/components/generator/DiagramToolbar.vue";
import DiagramProgressLoader from "~/components/generator/DiagramProgressLoader.vue";
import InstallButton from "~/components/shared/InstallButton.vue";
import { useDiagram } from "@/composables/useDiagram";
import { useDiagramStore } from "@/stores/diagram";
import { calculateTableWidth, calculateTableHeight } from "@/domain/diagram/tableDimensions";
import { exportSvg, exportPng } from "@/utils/diagramExporter";
import { toastError, toastSuccess } from "@/services/toastService";
import { useGeneratorTheme } from "@/composables/useGeneratorTheme";

const diagramStore = useDiagramStore();
const diagramCanvasRef = ref(null);
const { isCanvasDark, isModelingDark, isEditorDark, initCanvasTheme } = useGeneratorTheme();
initCanvasTheme();
const { 
  tables, relationships, positions, edgeOffsets, 
  selectedTableNames, hoveredColumn, tableOrder,
  commitStampPlacement, draftTableNames, draftColumnNames, draftColumnTypes, tableErrors,
  renameTable, renameColumn, changeColumnType
} = useDiagram();

const handleTableRename = (previousName, newName, originalName) => {
  renameTable(previousName, newName, originalName);
};

const handleColumnRename = (tableName, oldColName, newColName, originalColName, targetColIndex) => {
  renameColumn(tableName, oldColName, newColName, originalColName, targetColIndex);
};

const handleColumnTypeChange = (tableName, colName, oldType, newType) => {
  changeColumnType(tableName, colName, oldType, newType);
};

const getTableDisplayName = (tableName) => {
  if (draftTableNames.value && tableName in draftTableNames.value) {
    return draftTableNames.value[tableName];
  }
  return tableName;
};

const getTableErrorMessage = (tableName) => {
  return tableErrors.value?.[tableName] || null;
};

const handleStampPlaced = (pos) => {
  commitStampPlacement(pos);
};

const stampScreenPos = ref(null);
const isStampInsideCanvas = ref(false);
const canvasBounds = ref(null);
const lastKnownPointer = ref({ x: 0, y: 0 });

const updateStampPosition = (clientX, clientY, target) => {
  stampScreenPos.value = { x: clientX, y: clientY };
  const el = target || document.elementFromPoint(clientX, clientY);
  isStampInsideCanvas.value = !!el?.closest?.('.diagram-canvas');

  const canvasEl = diagramCanvasRef.value?.$el || document.querySelector('.diagram-canvas');
  if (canvasEl) {
    canvasBounds.value = canvasEl.getBoundingClientRect();
  }
};

const showLightLayer = computed(() => !isCanvasDark.value || !isModelingDark.value || !isEditorDark.value);
const showDarkLayer = computed(() => isCanvasDark.value || isModelingDark.value || isEditorDark.value);

const buildThemeClipPath = (targetDark) => {
  if (!stampScreenPos.value || !canvasBounds.value) return 'none';
  if (isCanvasDark.value === targetDark && isModelingDark.value === targetDark && isEditorDark.value === targetDark) {
    return 'none';
  }

  const x = stampScreenPos.value.x;
  const relLeft = canvasBounds.value.left - x;
  const relRight = canvasBounds.value.right - x;

  const editorMatch = isEditorDark.value === targetDark;
  const canvasMatch = isCanvasDark.value === targetDark;
  const modelingMatch = isModelingDark.value === targetDark;

  // Caso 1: apenas o centro (canvas)
  if (!editorMatch && canvasMatch && !modelingMatch) {
    return `polygon(${relLeft}px -1000px, ${relRight}px -1000px, ${relRight}px 1000px, ${relLeft}px 1000px)`;
  }
  // Caso 2: as duas laterais (buraco no centro usando evenodd)
  if (editorMatch && !canvasMatch && modelingMatch) {
    return `polygon(evenodd, -1000px -1000px, 2000px -1000px, 2000px 1000px, -1000px 1000px, ${relLeft}px -1000px, ${relLeft}px 1000px, ${relRight}px 1000px, ${relRight}px -1000px)`;
  }
  // Caso 3: esquerda + centro
  if (editorMatch && canvasMatch && !modelingMatch) {
    return `polygon(-1000px -1000px, ${relRight}px -1000px, ${relRight}px 1000px, -1000px 1000px)`;
  }
  // Caso 4: centro + direita
  if (!editorMatch && canvasMatch && modelingMatch) {
    return `polygon(${relLeft}px -1000px, 2000px -1000px, 2000px 1000px, ${relLeft}px 1000px)`;
  }
  // Caso 5: apenas esquerda
  if (editorMatch && !canvasMatch && !modelingMatch) {
    return `polygon(-1000px -1000px, ${relLeft}px -1000px, ${relLeft}px 1000px, -1000px 1000px)`;
  }
  // Caso 6: apenas direita
  if (!editorMatch && !canvasMatch && modelingMatch) {
    return `polygon(${relRight}px -1000px, 2000px -1000px, 2000px 1000px, ${relRight}px 1000px)`;
  }

  return 'inset(100%)';
};

const lightClipPath = computed(() => buildThemeClipPath(false));
const darkClipPath = computed(() => buildThemeClipPath(true));

const handleGlobalStampPointerMove = (e) => {
  lastKnownPointer.value = { x: e.clientX, y: e.clientY };
  if (!diagramStore.isStampActive) return;
  updateStampPosition(e.clientX, e.clientY, e.target);
};

const handleGlobalStampPointerDown = (e) => {
  lastKnownPointer.value = { x: e.clientX, y: e.clientY };
  if (!diagramStore.isStampActive) return;

  const target = e.target;
  if (target?.closest?.('.diagram-canvas') || target?.closest?.('.create-table-btn')) {
    return;
  }

  diagramStore.cancelStampMode();
};

watch(
  () => diagramStore.isStampActive,
  (active) => {
    if (active && lastKnownPointer.value.x > 0) {
      updateStampPosition(lastKnownPointer.value.x, lastKnownPointer.value.y, null);
    } else if (!active) {
      stampScreenPos.value = null;
      isStampInsideCanvas.value = false;
    }
  }
);

onMounted(() => {
  window.addEventListener('pointermove', handleGlobalStampPointerMove, { passive: true });
  window.addEventListener('pointerdown', handleGlobalStampPointerDown, { capture: true });
});

onUnmounted(() => {
  window.removeEventListener('pointermove', handleGlobalStampPointerMove);
  window.removeEventListener('pointerdown', handleGlobalStampPointerDown, { capture: true });
});

const blurActiveInput = () => {
  const activeEl = document.activeElement;
  if (activeEl && typeof activeEl.blur === 'function') {
    const tagName = activeEl.tagName?.toUpperCase();
    const isInput = tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
    const isMonaco = !!activeEl.closest?.('.monaco-editor');
    if (isInput || isMonaco || activeEl.getAttribute?.('contenteditable') === 'true') {
      activeEl.blur();
    }
  }
};

const headerHeight = 35;
const rowHeight = 32;

const CULLING_THRESHOLD = 30;
const VIEWPORT_BUFFER = 250;

const tableDimensionsMap = computed(() => {
  const map = {};
  if (!tables.value) return map;
  for (const tableName in tables.value) {
    const table = tables.value[tableName];
    const effectiveDisplayName = getTableDisplayName(tableName);
    const effectiveColumns = table.columns?.map((col) => {
      const colDraftKey = `${tableName}.${col.name}`;
      const effectiveColName = draftColumnNames.value?.[colDraftKey] || col.name;
      const effectiveColType = draftColumnTypes.value?.[colDraftKey] || col.type;
      return {
        ...col,
        name: effectiveColName,
        type: effectiveColType,
      };
    });
    const tableWithEffectiveValues = {
      ...table,
      name: effectiveDisplayName && effectiveDisplayName !== table.name ? effectiveDisplayName : table.name,
      columns: effectiveColumns || table.columns,
    };
    map[tableName] = {
      width: calculateTableWidth(tableWithEffectiveValues),
      height: calculateTableHeight(tableWithEffectiveValues),
    };
  }
  return map;
});

const allTablesList = computed(() => {
  if (!tables.value) return [];
  const tableMap = tables.value;
  const order = tableOrder.value;
  if (!order || order.length === 0) {
    return Object.values(tableMap);
  }
  const ordered = [];
  const seen = new Set();
  for (const name of order) {
    if (tableMap[name] && !seen.has(name)) {
      ordered.push(tableMap[name]);
      seen.add(name);
    }
  }
  for (const name in tableMap) {
    if (!seen.has(name)) {
      ordered.push(tableMap[name]);
      seen.add(name);
    }
  }
  return ordered;
});

const visibleTableNamesSet = computed(() => {
  const tableMap = tables.value;
  if (!tableMap) return new Set();

  const allNames = Object.keys(tableMap);
  if (allNames.length <= CULLING_THRESHOLD || diagramStore.isExporting) {
    return new Set(allNames);
  }

  const size = diagramStore.viewportSize;
  if (!size || size.width === 0 || size.height === 0) {
    return new Set(allNames);
  }

  const zoom = diagramStore.zoom || 1;
  const pan = diagramStore.pan || { x: 0, y: 0 };

  const minX = -pan.x / zoom - VIEWPORT_BUFFER;
  const maxX = (size.width - pan.x) / zoom + VIEWPORT_BUFFER;
  const minY = -pan.y / zoom - VIEWPORT_BUFFER;
  const maxY = (size.height - pan.y) / zoom + VIEWPORT_BUFFER;

  const visible = new Set();
  const posMap = positions.value;
  const dimsMap = tableDimensionsMap.value;

  for (const name of allNames) {
    const pos = posMap[name];
    if (!pos) {
      visible.add(name);
      continue;
    }

    const dims = dimsMap[name] || { width: 220, height: 35 };
    const isVisible = !(
      pos.x + dims.width < minX ||
      pos.x > maxX ||
      pos.y + dims.height < minY ||
      pos.y > maxY
    );

    if (isVisible) {
      visible.add(name);
    }
  }

  return visible;
});

const renderedTablesList = computed(() => {
  const visible = visibleTableNamesSet.value;
  return allTablesList.value.filter((table) => visible.has(table.name));
});

const relationshipsList = computed(() => {
  if (!relationships.value) return [];
  return relationships.value;
});

const renderedRelationshipsList = computed(() => {
  const visible = visibleTableNamesSet.value;
  return relationshipsList.value.filter(
    (rel) => visible.has(rel.fromTable) || visible.has(rel.toTable)
  );
});

const detailLevel = computed(() => {
  if (diagramStore.isExporting) return 'full';
  return (diagramStore.zoom || 1) <= 0.30 ? 'simplified' : 'full';
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
    const dims = tableDimensionsMap.value[tableName];
    const pos = positions.value[tableName];
    if (!pos || !dims) continue;

    const intersects = !(
      area.x2 < pos.x ||
      area.x1 > pos.x + dims.width ||
      area.y2 < pos.y ||
      area.y1 > pos.y + dims.height
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

  let dragRafId = null;
  let latestClientX = event.clientX;
  let latestClientY = event.clientY;

  const onPointerMove = (e) => {
    latestClientX = e.clientX;
    latestClientY = e.clientY;

    if (dragRafId) return;

    dragRafId = requestAnimationFrame(() => {
      dragRafId = null;
      const currentPan = diagramStore.pan;
      const currentZoom = diagramStore.zoom;
      const mouseX = (latestClientX - currentPan.x) / currentZoom;
      const mouseY = (latestClientY - currentPan.y) / currentZoom;
      const deltaX = mouseX - initialMouseX;
      const deltaY = mouseY - initialMouseY;

      selectedTableNames.value.forEach((name) => {
        const initial = initialPositions[name];
        if (initial) {
          diagramStore.updateTablePosition(name, {
            x: initial.x + deltaX,
            y: initial.y + deltaY,
          }, false);
        }
      });
    });
  };

  const onPointerUp = (e) => {
    if (e.button === 0 || e.button === undefined) {
      if (dragRafId) {
        cancelAnimationFrame(dragRafId);
        dragRafId = null;
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);

      selectedTableNames.value.forEach((name) => {
        const currentPos = positions.value[name];
        if (currentPos) {
          diagramStore.updateTablePosition(name, {
            x: Math.round(currentPos.x),
            y: Math.round(currentPos.y),
          }, false);
        }
      });

      diagramStore.persistTablePositions();
    }
  };

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
};

const getExportSvgElement = () => {
  if (!tables.value || Object.keys(tables.value).length === 0) {
    toastError("Nada para exportar", "Não há tabelas no diagrama");
    return null;
  }
  const svgElement = diagramCanvasRef.value?.svgRoot;
  if (!svgElement) {
    toastError("Erro na exportação", "Não foi possível acessar o diagrama");
    return null;
  }
  return svgElement;
};

const exportDiagramPNG = async () => {
  const svg = getExportSvgElement();
  if (!svg) return;

  diagramStore.setExporting(true);
  try {
    await nextTick();
    await exportPng(svg, tables.value, positions.value, isCanvasDark.value);
  } finally {
    diagramStore.setExporting(false);
  }
};

const exportDiagramSVG = async () => {
  const svg = getExportSvgElement();
  if (!svg) return;

  diagramStore.setExporting(true);
  try {
    await nextTick();
    await exportSvg(svg, tables.value, positions.value, isCanvasDark.value);
  } finally {
    diagramStore.setExporting(false);
  }
};

const focusTable = (tableName) => {
  if (!tables.value || !tables.value[tableName]) return;
  diagramStore.setSelectedTables([tableName]);
  const pos = positions.value[tableName] || { x: 0, y: 0 };
  const dims = tableDimensionsMap.value[tableName] || { width: 220, height: 99 };
  const centerX = pos.x + dims.width / 2;
  const centerY = pos.y + dims.height / 2;
  diagramCanvasRef.value?.panToCoordinates(centerX, centerY);
};

defineExpose({
  diagramCanvasRef,
  focusTable,
  exportDiagramPNG,
  exportDiagramSVG,
});
</script>

<style scoped>
.canvas-panel {
  flex: 1;
  min-width: 0;
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

.relationships-layer,
.tables-layer {
  isolation: isolate;
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
  background: transparent;
  pointer-events: none;
  z-index: 20;
}

.canvas-empty-content {
  text-align: center;
  color: var(--clr-text);
  padding: 24px 32px;
  max-width: 460px;
  width: min(92%, 460px);
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

.empty-state-fade-enter-active,
.empty-state-fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.empty-state-fade-enter-from,
.empty-state-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

.global-stamp-preview-host {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
}

.global-stamp-preview {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.stamp-preview-fade-enter-active,
.stamp-preview-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.stamp-preview-fade-enter-from,
.stamp-preview-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
