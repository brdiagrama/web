<template>
  <svg
    ref="svgRoot"
    class="diagram-canvas"
  @wheel="handleWheelEvent"
  @pointerdown="handleMouseDown"
  @mousedown="handleMouseDown"
    @mouseleave="handleMouseLeave"
    :style="{ width: '100%', height: '100%', cursor: store.isPanMode ? (isLeftMousePanning ? 'grabbing' : 'grab') : currentCursor }"
  >
    <defs>
      <pattern
        id="grid-pattern"
        :width="store.gridSize"
        :height="store.gridSize"
        patternUnits="userSpaceOnUse"
      >
        <circle
          :cx="store.gridSize / 2"
          :cy="store.gridSize / 2"
          r="1"
          fill="#999"
          :opacity="Math.max(0.1, Math.min(0.8, store.zoom * 2))"
        />
      </pattern>

      <!-- Markers para relacionamentos (Crow's Foot Notation) -->
      <!-- Markers para relacionamentos (Crow's Foot Notation) -->
      <marker
        id="crowsFoot"
        markerWidth="10"
        markerHeight="12"
        refX="0"
        refY="4"
        orient="auto"
      >
        <path
          d="M0 6 L12 6 M12 0 L0 6 L12 12"
          fill="none"
          stroke="#7f8c8d"
          stroke-width="1.5"
          transform="scale(0.5) rotate(180 6 7)"
        />
      </marker>

      <marker
        id="oneBarStart"
        markerWidth="10"
        markerHeight="12"
        refX="0"
        refY="4.2"
        orient="auto"
      >
        <line
          x1="10"
          y1="0"
          x2="10"
          y2="12"
          stroke="#7f8c8d"
          stroke-width="1.5"
          transform="scale(0.7)"
        />
      </marker>

      <marker
        id="oneBarEnd"
        markerWidth="10"
        markerHeight="12"
        refX="14"
        refY="4.2"
        orient="auto"
      >
        <line
          x1="10"
          y1="0"
          x2="10"
          y2="12"
          stroke="#7f8c8d"
          stroke-width="1.5"
          transform="scale(0.7)"
        />
      </marker>

      <marker
        id="oneBarStartHover"
        markerWidth="10"
        markerHeight="12"
        refX="0"
        refY="4.2"
        orient="auto"
      >
        <line
          x1="10"
          y1="0"
          x2="10"
          y2="12"
          stroke="#192747"
          stroke-width="1.5"
          transform="scale(0.7)"
        />
      </marker>

      <marker
        id="oneBarEndHover"
        markerWidth="10"
        markerHeight="12"
        refX="14"
        refY="4.2"
        orient="auto"
      >
        <line
          x1="10"
          y1="0"
          x2="10"
          y2="12"
          stroke="#192747"
          stroke-width="1.5"
          transform="scale(0.7)"
        />
      </marker>

      <marker
        id="crowsFootHover"
        markerWidth="10"
        markerHeight="12"
        refX="0"
        refY="4"
        orient="auto"
      >
        <path
          d="M0 6 L12 6 M12 0 L0 6 L12 12"
          fill="none"
          stroke="#192747"
          stroke-width="1.5"
          transform="scale(0.5) rotate(180 6 7)"
        />
      </marker>

      <!-- Zero ou Um (0..1) - Círculo duplo -->
      <marker
        id="zeroOrOne"
        markerWidth="14"
        markerHeight="12"
        refX="-2.5"
        refY="4.21"
        orient="auto"
      >
        <line
          x1="1.5"
          y1="0"
          x2="1.5"
          y2="12"
          stroke="#7f8c8d"
          stroke-width="1.5"
          transform="scale(0.7)"
        />

        <circle
          cx="7.5"
          cy="6"
          r="2.5"
          fill="#fff"
          stroke="#7f8c8d"
          stroke-width="1.5"
          transform="scale(0.7)"
        />
      </marker>

      <marker
        id="zeroOrOneHover"
        markerWidth="14"
        markerHeight="12"
        refX="-2.5"
        refY="4.21"
        orient="auto"
      >
        <line
          x1="1.5"
          y1="0"
          x2="1.5"
          y2="12"
          stroke="#192747"
          stroke-width="1.5"
          transform="scale(0.7)"
        />

        <circle
          cx="7.5"
          cy="6"
          r="2.5"
          fill="#fff"
          stroke="#192747"
          stroke-width="1.5"
          transform="scale(0.7)"
        />
      </marker>

      <marker
        id="zeroOrOneEnd"
        markerWidth="14"
        markerHeight="12"
        refX="13"
        refY="4.21"
        orient="auto"
      >
        <circle
          cx="7.5"
          cy="6"
          r="2.5"
          fill="#fff"
          stroke="#7f8c8d"
          stroke-width="1.5"
          transform="scale(0.7)"
        />
        <line
          x1="13.5"
          y1="0"
          x2="13.5"
          y2="12"
          stroke="#7f8c8d"
          stroke-width="1.5"
          transform="scale(0.7)"
        />
      </marker>

      <marker
        id="zeroOrOneEndHover"
        markerWidth="14"
        markerHeight="12"
        refX="13"
        refY="4.21"
        orient="auto"
      >
        <circle
          cx="7.5"
          cy="6"
          r="2.5"
          fill="#fff"
          stroke="#192747"
          stroke-width="1.5"
          transform="scale(0.7)"
        />
        <line
          x1="13.5"
          y1="0"
          x2="13.5"
          y2="12"
          stroke="#192747"
          stroke-width="1.5"
          transform="scale(0.7)"
        />
      </marker>

      <!-- Exatamente Um (1) - Barra dupla vertical -->
      <marker
        id="exactlyOne"
        markerWidth="10"
        markerHeight="12"
        refX="10"
        refY="4.2"
        orient="auto"
      >
        <line
          x1="3"
          y1="0"
          x2="3"
          y2="12"
          stroke="#7f8c8d"
          stroke-width="1.5"
          transform="scale(0.7)"
        />
        <line
          x1="7"
          y1="0"
          x2="7"
          y2="12"
          stroke="#7f8c8d"
          stroke-width="1.5"
          transform="scale(0.7)"
        />
      </marker>

      <marker
        id="exactlyOneHover"
        markerWidth="10"
        markerHeight="12"
        refX="10"
        refY="4.2"
        orient="auto"
      >
        <line
          x1="3"
          y1="0"
          x2="3"
          y2="12"
          stroke="#192747"
          stroke-width="1.5"
          transform="scale(0.7)"
        />
        <line
          x1="7"
          y1="0"
          x2="7"
          y2="12"
          stroke="#192747"
          stroke-width="1.5"
          transform="scale(0.7)"
        />
      </marker>

      <!-- Zero ou Muitos (0..*) - Círculo + Crow's Foot -->
      <marker
        id="zeroOrMany"
        markerWidth="18"
        markerHeight="12"
        refX="0"
        refY="4.2"
        orient="auto"
      >
        <circle
          cx="12"
          cy="6"
          r="3"
          fill="#fff"
          stroke="#7f8c8d"
          stroke-width="1.5"
          transform="scale(0.7)"
        />

        <path
          d="M0 0 L8 6 L0 12"
          fill="none"
          stroke="#7f8c8d"
          stroke-width="1.5"
          transform="scale(0.7)"
        />
      </marker>

      <marker
        id="zeroOrManyHover"
        markerWidth="18"
        markerHeight="12"
        refX="0"
        refY="4.2"
        orient="auto"
      >
        <circle
          cx="12"
          cy="6"
          r="3"
          fill="#fff"
          stroke="#192747"
          stroke-width="1.5"
          transform="scale(0.7)"
        />
        <path
          d="M0 0 L8 6 L0 12"
          fill="none"
          stroke="#192747"
          stroke-width="1.5"
          transform="scale(0.7)"
        />
      </marker>

      <marker
        id="oneOrMany"
        markerWidth="8"
        markerHeight="10"
        refX="0"
        refY="4.65"
        orient="auto"
      >
        <path d="M7.19128 0.436768V8.83677" stroke="#7F8C8D" stroke-width="1.05" />
        <path
          d="M0.29126 0.436768L6.59126 4.63677L0.29126 8.83677"
          stroke="#7F8C8D"
          stroke-width="1.05"
          fill="none"
        />
      </marker>

      <marker
        id="oneOrManyHover"
        markerWidth="8"
        markerHeight="10"
        refX="0"
        refY="4.65"
        orient="auto"
      >
        <path d="M7.19128 0.436768V8.83677" stroke="#192747" stroke-width="1.05" />
        <path
          d="M0.29126 0.436768L6.59126 4.63677L0.29126 8.83677"
          stroke="#192747"
          stroke-width="1.05"
          fill="none"
        />
      </marker>

      <!-- Herança: Triângulo (lado da filha/subclasse) -->
      <marker
        id="twoBars"
        markerWidth="12"
        markerHeight="12"
        refX="0"
        refY="4.65"
        orient="auto"
      >
        <path
          d="M0 6 L10 0 L10 12 Z"
          fill="#fff"
          stroke="#7f8c8d"
          stroke-width="1.5"
          transform="scale(0.7)"
        />
      </marker>

      <marker
        id="twoBarsHover"
        markerWidth="12"
        markerHeight="12"
        refX="0"
        refY="4.65"
        orient="auto"
      >
        <path
          d="M0 6 L10 0 L10 12 Z"
          fill="#fff"
          stroke="#192747"
          stroke-width="2"
          transform="scale(0.7)"
        />
      </marker>
    </defs>

    <g id="background-layer">
      <rect
        class="diagram-background-rect"
        width="100%"
        height="100%"
        fill="none"
        style="pointer-events: all"
      />
    </g>
    <g id="viewport-layer">
      <rect
        v-if="store.isGridVisible"
        class="grid-background"
        :x="-50000 / store.zoom"
        :y="-50000 / store.zoom"
        :width="100000 / store.zoom"
        :height="100000 / store.zoom"
        fill="url(#grid-pattern)"
        style="pointer-events: none"
      />

      <slot />

      <rect
        v-if="selectionBox.visible"
        :x="-50000"
        :y="-50000"
        width="100000"
        height="100000"
        fill="transparent"
        style="pointer-events: all; cursor: crosshair"
      />
      <rect
        v-if="selectionBox.visible"
        :x="Math.min(selectionBox.startX, selectionBox.endX)"
        :y="Math.min(selectionBox.startY, selectionBox.endY)"
        :width="Math.abs(selectionBox.endX - selectionBox.startX)"
        :height="Math.abs(selectionBox.endY - selectionBox.startY)"
        fill="rgba(59, 130, 246, 0.1)"
        stroke="#3b82f6"
        stroke-width="1"
        stroke-dasharray="5,5"
        style="pointer-events: none"
      />
    </g>
  </svg>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import svgPanZoom from "svg-pan-zoom";
import { useDiagramStore } from "@/stores/diagram";


const emit = defineEmits(["selectionArea", "selectionSelecting", "canvasPointerDown"]);

const store = useDiagramStore();

const svgRoot = ref(null);
const panZoomInstance = ref(null);
let isPanEnabled = false;
let isMiddleMouseDown = false;
const isLeftMousePanning = ref(false);

const currentCursor = ref("default");

const activePointers = new Map();
let gestureActive = false;
let gestureInit = {
  distance: 0,
  zoom: 1,
  pan: { x: 0, y: 0 },
  midpoint: { x: 0, y: 0 },
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const startGestureInit = () => {
  if (!panZoomInstance.value || activePointers.size < 2) return;

  const points = Array.from(activePointers.values()).slice(0, 2);
  const p1 = points[0];
  const p2 = points[1];
  const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const midpoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

  gestureInit.distance = distance;
  gestureInit.zoom = panZoomInstance.value.getZoom();
  gestureInit.pan = panZoomInstance.value.getPan();
  gestureInit.midpoint = midpoint;
  gestureActive = true;
};

const updateGesture = () => {
  if (!gestureActive || !panZoomInstance.value) return;

  const rect = svgRoot.value.getBoundingClientRect();
  const pts = Array.from(activePointers.values()).slice(0, 2);
  const p1 = pts[0];
  const p2 = pts[1];
  const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const midpoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

  const scale = distance / gestureInit.distance;
  let newZoom = gestureInit.zoom * scale;
  newZoom = clamp(newZoom, 0.01, 2.0);

  try {
    if (typeof panZoomInstance.value.zoomAtPoint === 'function') {
      panZoomInstance.value.zoomAtPoint(newZoom, { x: midpoint.x - rect.left, y: midpoint.y - rect.top });
    } else {
      const initPan = gestureInit.pan;
      const initZoom = gestureInit.zoom;
      const contentX = (gestureInit.midpoint.x - rect.left - initPan.x) / initZoom;
      const contentY = (gestureInit.midpoint.y - rect.top - initPan.y) / initZoom;

      panZoomInstance.value.zoom(newZoom);

      const newPanX = midpoint.x - rect.left - contentX * newZoom;
      const newPanY = midpoint.y - rect.top - contentY * newZoom;
      panZoomInstance.value.pan({ x: newPanX, y: newPanY });
    }
  } catch (err) {}
};

const onPointerMoveGlobal = (ev) => {
  if (window._brdiagrama_suppressGlobalPointerHandlers) return;

  const prev = activePointers.get(ev.pointerId);
  if (!prev) return;

  if ((isMiddleMouseDown || isLeftMousePanning.value) && activePointers.size === 1 && panZoomInstance.value) {
    const dx = ev.clientX - prev.x;
    const dy = ev.clientY - prev.y;

    try {
      const currentPan = panZoomInstance.value.getPan();
      panZoomInstance.value.pan({ x: currentPan.x + dx, y: currentPan.y + dy });
    } catch (err) {}

    activePointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    saveState();
    return;
  }

  activePointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
  if (activePointers.size >= 2) {
    if (selectionPending) {
      selectionPending = false;
      if (selectionPendingTimeout) {
        clearTimeout(selectionPendingTimeout);
        selectionPendingTimeout = null;
        selectionPendingStart = null;
      }
    }
    if (!gestureActive) startGestureInit();
    updateGesture();
  }
};

const onPointerUpGlobal = (ev) => {
  if (activePointers.has(ev.pointerId)) activePointers.delete(ev.pointerId);
  if (selectionPending) {
    selectionPending = false;
    if (selectionPendingTimeout) {
      clearTimeout(selectionPendingTimeout);
      selectionPendingTimeout = null;
      selectionPendingStart = null;
    }
  }
  if (gestureActive && activePointers.size < 2) {
    gestureActive = false;
    saveState();
  }
  if (activePointers.size === 0 && window._brdiagrama_hasPointerListeners) {
    window.removeEventListener('pointermove', onPointerMoveGlobal);
    window.removeEventListener('pointerup', onPointerUpGlobal);
    window.removeEventListener('pointercancel', onPointerUpGlobal);
    window._brdiagrama_hasPointerListeners = false;
  }
};

const selectionBox = ref({
  visible: false,
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0,
});

let isSelecting = false;
let startPoint = { x: 0, y: 0 };
let selectionPending = false;
let selectionPendingTimeout = null;
let selectionPendingStart = null;

const startSelectionFromCoords = (startClient) => {
  if (!svgRoot.value || !panZoomInstance.value) return;
  const rect = svgRoot.value.getBoundingClientRect();
  const pan = panZoomInstance.value.getPan();
  const zoom = panZoomInstance.value.getZoom();

  startPoint.x = (startClient.x - rect.left - pan.x) / zoom;
  startPoint.y = (startClient.y - rect.top - pan.y) / zoom;

  isSelecting = true;
  selectionBox.value = {
    visible: true,
    startX: startPoint.x,
    startY: startPoint.y,
    endX: startPoint.x,
    endY: startPoint.y,
  };

  if (window.PointerEvent) {
    window.addEventListener("pointermove", handleMouseMove, { passive: false });
    window.addEventListener("pointerup", handleWindowMouseUp);
    window.addEventListener("pointercancel", handleWindowMouseUp);
  } else {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
  }
};

const saveState = () => {
  if (!panZoomInstance.value) return;

  const pan = panZoomInstance.value.getPan();
  const zoom = panZoomInstance.value.getZoom();

  store.updatePan(pan);
  store.updateZoom(zoom);
};

const handleMouseDown = (e) => {
  if (window.PointerEvent && e.pointerId != null) {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!window._brdiagrama_hasPointerListeners) {
      window.addEventListener('pointermove', onPointerMoveGlobal, { passive: false });
      window.addEventListener('pointerup', onPointerUpGlobal);
      window.addEventListener('pointercancel', onPointerUpGlobal);
      window._brdiagrama_hasPointerListeners = true;
    }
  }
  const targetClasses = e.target.classList;
  const isBackground = targetClasses.contains('diagram-background-rect') || 
                       targetClasses.contains('grid-background') ||
                       e.target === svgRoot.value;

  if (isBackground) {
    emit('canvasPointerDown');
  }
  
  if (e.button === 1) {
    e.preventDefault();
    isMiddleMouseDown = true;
    enablePan();
  }
  else if (e.button === 0) {
    if (store.isPanMode) {
      isLeftMousePanning.value = true;
      enablePan();
      return;
    }
    
    if (!isBackground) {
      return;
    }

    if (activePointers.size >= 2) {
      return;
    }

    const rect = svgRoot.value.getBoundingClientRect();
    const pan = panZoomInstance.value.getPan();
    const zoom = panZoomInstance.value.getZoom();

    const isTouch = window.PointerEvent && e.pointerType === 'touch';
    if (isTouch) {
      selectionPending = true;
      selectionPendingStart = { x: e.clientX, y: e.clientY };
      if (selectionPendingTimeout) clearTimeout(selectionPendingTimeout);
      selectionPendingTimeout = setTimeout(() => {
        if (selectionPending && activePointers.size <= 1) {
          startSelectionFromCoords(selectionPendingStart);
        }
        selectionPending = false;
        selectionPendingStart = null;
      }, 60);
      return;
    }

    startPoint.x = (e.clientX - rect.left - pan.x) / zoom;
    startPoint.y = (e.clientY - rect.top - pan.y) / zoom;

    isSelecting = true;

    selectionBox.value = {
      visible: true,
      startX: startPoint.x,
      startY: startPoint.y,
      endX: startPoint.x,
      endY: startPoint.y,
    };

    if (window.PointerEvent) {
      window.addEventListener("pointermove", handleMouseMove, { passive: false });
      window.addEventListener("pointerup", handleWindowMouseUp);
      window.addEventListener("pointercancel", handleWindowMouseUp);
    } else {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleWindowMouseUp);
    }
  }
};

const handleMouseMove = (e) => {
  if (!isSelecting) return;
  
  if (e.cancelable) e.preventDefault();

  const rect = svgRoot.value.getBoundingClientRect();
  const pan = panZoomInstance.value.getPan();
  const zoom = panZoomInstance.value.getZoom();

  selectionBox.value.endX = (e.clientX - rect.left - pan.x) / zoom;
  selectionBox.value.endY = (e.clientY - rect.top - pan.y) / zoom;

  const currentSelection = {
      x1: Math.min(selectionBox.value.startX, selectionBox.value.endX),
      y1: Math.min(selectionBox.value.startY, selectionBox.value.endY),
      x2: Math.max(selectionBox.value.startX, selectionBox.value.endX),
      y2: Math.max(selectionBox.value.startY, selectionBox.value.endY),
  };
  
  emit("selectionSelecting", currentSelection);
};

const handleWindowMouseUp = (e) => {
  if (isSelecting && e.button === 0) {
    isSelecting = false;
    
    if (window.PointerEvent) {
      window.removeEventListener("pointermove", handleMouseMove);
      window.removeEventListener("pointerup", handleWindowMouseUp);
      window.removeEventListener("pointercancel", handleWindowMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    }

    const selectionArea = {
      x1: Math.min(selectionBox.value.startX, selectionBox.value.endX),
      y1: Math.min(selectionBox.value.startY, selectionBox.value.endY),
      x2: Math.max(selectionBox.value.startX, selectionBox.value.endX),
      y2: Math.max(selectionBox.value.startY, selectionBox.value.endY),
    };

    emit("selectionArea", selectionArea);

    selectionBox.value.visible = false;
  }
};

const handleGlobalMouseUp = (e) => {
    if (e.button === 1 && isMiddleMouseDown) {
        isMiddleMouseDown = false;
        disablePan();
    }
    if (e.button === 0 && isLeftMousePanning.value) {
        isLeftMousePanning.value = false;
        disablePan();
    }
}

const handleMouseUp = (e) => {
  if (e.button === 1 && isMiddleMouseDown) {
    isMiddleMouseDown = false;
    disablePan();
  } else if (e.button === 0 && isSelecting) {
    isSelecting = false;
    if (window.PointerEvent) {
      svgRoot.value.removeEventListener("pointermove", handleMouseMove);
    } else {
      svgRoot.value.removeEventListener("mousemove", handleMouseMove);
    }

    const selectionArea = {
      x1: Math.min(selectionBox.value.startX, selectionBox.value.endX),
      y1: Math.min(selectionBox.value.startY, selectionBox.value.endY),
      x2: Math.max(selectionBox.value.startX, selectionBox.value.endX),
      y2: Math.max(selectionBox.value.startY, selectionBox.value.endY),
    };

    emit("selectionArea", selectionArea);

    setTimeout(() => {
      selectionBox.value.visible = false;
    }, 100);
  }
};

const handleMouseLeave = () => {
  if (isMiddleMouseDown) {
    isMiddleMouseDown = false;
    disablePan();
  }
  if (isLeftMousePanning.value) {
    isLeftMousePanning.value = false;
    disablePan();
  }
};

const enablePan = () => {
  if (panZoomInstance.value) {
    currentCursor.value = "grabbing";
    panZoomInstance.value.enablePan();
    isPanEnabled = true;
  }
};

const disablePan = () => {
  if (panZoomInstance.value && isPanEnabled) {
    currentCursor.value = "default";
    panZoomInstance.value.disablePan();
    isPanEnabled = false;
  }
};

const handleWheelEvent = (e) => {
  if (e.ctrlKey) {
    e.preventDefault();
    handleZoom(e);
  }
};

const handleZoom = (e) => {
  if (!panZoomInstance.value) return;

  const rect = svgRoot.value.getBoundingClientRect();
  const clientX = e.clientX - rect.left;
  const clientY = e.clientY - rect.top;
  const currentZoom = panZoomInstance.value.getZoom();

  const delta = e.deltaY < 0 ? 1 : -1;
  const scaleFactor = 1.1 ** delta;
  let newZoom = currentZoom * scaleFactor;

  const minZoom = 0.01;
  const maxZoom = 2.0;

  newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

  if (Math.abs(newZoom - currentZoom) < 0.001) {
    return;
  }
  try {
    panZoomInstance.value.setMinZoom(0.001);
    panZoomInstance.value.setMaxZoom(10);

    panZoomInstance.value.zoom(newZoom);

    panZoomInstance.value.setMinZoom(0.01);
    panZoomInstance.value.setMaxZoom(2.0);

    saveState();
  } catch (error) {}
};

// Monitora o zoom vindo da store (ex: do slider na toolbar)
watch(
  () => store.zoom,
  (newZoom) => {
    if (panZoomInstance.value && panZoomInstance.value.getZoom() !== newZoom) {
      panZoomInstance.value.zoom(newZoom);
    }
  }
);

// --- Lógica de Inicialização ---

onMounted(() => {
  if (svgRoot.value) {
    setTimeout(() => {
      try {
        panZoomInstance.value = svgPanZoom(svgRoot.value, {
          viewportSelector: "#viewport-layer",
          panEnabled: false,
          dblClickZoomEnabled: false,
          zoomScaleSensitivity: 0,
          minZoom: 0.01,
          maxZoom: 2.0,
          fit: false,
          center: false,
        });

        panZoomInstance.value.setMinZoom(0.01);
        panZoomInstance.value.setMaxZoom(2.0);

        panZoomInstance.value.zoom(store.zoom);
        panZoomInstance.value.pan(store.pan);

        panZoomInstance.value.setOnPan(saveState);
        panZoomInstance.value.setOnZoom(saveState);

         if (window.PointerEvent) {
           window.addEventListener("pointerup", handleGlobalMouseUp);
           window.addEventListener("pointercancel", handleGlobalMouseUp);
         } else {
           window.addEventListener("mouseup", handleGlobalMouseUp);
         }
      } catch (error) {}
    }, 100);
  }
});

onUnmounted(() => {
  if (window.PointerEvent) {
    window.removeEventListener("pointerup", handleGlobalMouseUp);
    window.removeEventListener("pointercancel", handleGlobalMouseUp);

    window.removeEventListener("pointerup", handleWindowMouseUp);
    window.removeEventListener("pointercancel", handleWindowMouseUp);
    window.removeEventListener("pointermove", handleMouseMove);

    if (window._brdiagrama_hasPointerListeners) {
      window.removeEventListener('pointermove', onPointerMoveGlobal);
      window.removeEventListener('pointerup', onPointerUpGlobal);
      window.removeEventListener('pointercancel', onPointerUpGlobal);
      window._brdiagrama_hasPointerListeners = false;
    }
  } else {
    window.removeEventListener("mouseup", handleGlobalMouseUp);
    window.removeEventListener("mouseup", handleWindowMouseUp);
    window.removeEventListener("mousemove", handleMouseMove);
  }

  try { window._brdiagrama_suppressGlobalPointerHandlers = false; } catch (e) {}
});

const fitToScreen = () => {
  if (panZoomInstance.value) {
    panZoomInstance.value.fit();
    panZoomInstance.value.center();
    saveState();
  }
};

defineExpose({
  fitToScreen,
  panZoomInstance,
  svgRoot,
});
</script>

<style>
.diagram-background-rect {
  fill: none;
}

.grid-background {
  pointer-events: none;
}

.table-rect {
  fill: #ffffff;
  stroke-width: 1px;
  filter: drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1));
}

.table-header-rect {
  fill: #192747;
}

.table-title {
  fill: #ffffff;
  font-weight: 700;
  font-size: 14px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  pointer-events: none;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.col-text {
  font-size: 12px;
  fill: #2c3e50;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  pointer-events: none;
}

.col-type {
  font-size: 11px;
  fill: #95a5a6;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  pointer-events: none;
  text-transform: uppercase;
}

.pk-icon {
  fill: #1ABC9C;
  font-size: 10px;
  font-weight: 800;
  font-family: "Segoe UI", sans-serif;
}

.fk-icon {
  fill: #3498db;
  font-size: 10px;
  font-weight: 800;
  font-family: "Segoe UI", sans-serif;
}

.pk-icon svg {
  color: #10b981 !important;
  fill: none;
}

.fk-icon svg {
  color: #3b82f6 !important;
  fill: none;
}

.table-group {
  cursor: move !important;
  transition: filter 0.2s ease;
}

.table-group:hover {
  filter: drop-shadow(0 6px 12px #0041d826);
}

.table-group:hover .table-rect {
  stroke: #192747;
  stroke-width: 1px;
}

.table-group:active {
  cursor: grabbing !important;
}
</style>
