<template>
  <svg ref="svgRoot" class="diagram-canvas" tabindex="-1" @wheel="handleWheelEvent" @pointerdown="handleMouseDown"
    @pointermove="handleCanvasPointerMove" @mouseleave="handleMouseLeave" @contextmenu="handleContextMenu"
    :style="{ width: '100%', height: '100%', outline: 'none', cursor: store.isStampActive ? 'crosshair' : (store.isPanMode ? (isLeftMousePanning ? 'grabbing' : 'grab') : currentCursor) }">
    <defs>
      <pattern id="grid-pattern" :width="store.gridSize" :height="store.gridSize" patternUnits="userSpaceOnUse">
        <circle :cx="store.gridSize / 2" :cy="store.gridSize / 2" r="1" fill="var(--grid-color, var(--ref-color, #999))"
          :opacity="Math.max(0.3, Math.min(0.65, store.zoom))" />
      </pattern>
    </defs>

    <DiagramMarkers />

    <g id="background-layer">
      <rect class="diagram-background-rect" width="100%" height="100%" fill="none" style="pointer-events: all" />
    </g>
    <g id="viewport-layer">
      <rect v-if="store.isGridVisible" class="grid-background" :x="-50000 / store.zoom" :y="-50000 / store.zoom"
        :width="100000 / store.zoom" :height="100000 / store.zoom" fill="url(#grid-pattern)"
        style="pointer-events: none" />

      <slot />

      <!-- Silhueta Fantasma do Modo Carimbo (Stamp Tool) -->
      <DiagramTableGhost
        v-if="store.isStampActive && store.stampGhostPosition"
        :x="store.stampGhostPosition.x"
        :y="store.stampGhostPosition.y"
      />

      <rect v-if="selectionBox.visible" :x="-50000" :y="-50000" width="100000" height="100000" fill="transparent"
        style="pointer-events: all; cursor: crosshair" />
      <rect v-if="selectionBox.visible" :x="Math.min(selectionBox.startX, selectionBox.endX)"
        :y="Math.min(selectionBox.startY, selectionBox.endY)" :width="Math.abs(selectionBox.endX - selectionBox.startX)"
        :height="Math.abs(selectionBox.endY - selectionBox.startY)" fill="var(--diagram-selection-box-bg, rgba(59, 130, 246, 0.1))" stroke="var(--diagram-selection-box-stroke, #3b82f6)"
        stroke-width="1" stroke-dasharray="5,5" style="pointer-events: none" />
    </g>
  </svg>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import svgPanZoom from "svg-pan-zoom";
import { useDiagramStore } from "@/stores/diagram";
import DiagramMarkers from "./DiagramMarkers.vue";
import DiagramTableGhost from "./DiagramTableGhost.vue";

const emit = defineEmits(["selectionArea", "selectionSelecting", "canvasPointerDown", "stampPlaced"]);

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

let panVelocity = { x: 0, y: 0 };
let lastPanTime = 0;
let inertiaAnimationId = null;
let panAnimationId = null;

const stopPanAnimation = () => {
  if (panAnimationId !== null) {
    cancelAnimationFrame(panAnimationId);
    panAnimationId = null;
  }
};

const stopInertia = () => {
  if (inertiaAnimationId !== null) {
    cancelAnimationFrame(inertiaAnimationId);
    inertiaAnimationId = null;
  }
};

const startInertia = () => {
  stopInertia();

  if (performance.now() - lastPanTime > 60) {
    panVelocity = { x: 0, y: 0 };
    return;
  }

  const MAX_SPEED = 20;
  panVelocity.x = clamp(panVelocity.x * 0.85, -MAX_SPEED, MAX_SPEED);
  panVelocity.y = clamp(panVelocity.y * 0.85, -MAX_SPEED, MAX_SPEED);

  if (Math.hypot(panVelocity.x, panVelocity.y) < 1.0) {
    panVelocity = { x: 0, y: 0 };
    return;
  }

  const FRICTION = 0.89;

  const step = () => {
    panVelocity.x *= FRICTION;
    panVelocity.y *= FRICTION;

    if (Math.hypot(panVelocity.x, panVelocity.y) < 0.3 || !panZoomInstance.value) {
      stopInertia();
      saveState();
      return;
    }

    try {
      const currentPan = panZoomInstance.value.getPan();
      panZoomInstance.value.pan({
        x: currentPan.x + panVelocity.x,
        y: currentPan.y + panVelocity.y,
      });
    } catch (err) {
      stopInertia();
      return;
    }

    inertiaAnimationId = requestAnimationFrame(step);
  };

  inertiaAnimationId = requestAnimationFrame(step);
};

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
  } catch (err) { }
};

const onPointerMoveGlobal = (ev) => {
  if (window._brdiagrama_suppressGlobalPointerHandlers) return;

  const prev = activePointers.get(ev.pointerId);
  if (!prev) return;

  if ((isMiddleMouseDown || isLeftMousePanning.value) && activePointers.size === 1 && panZoomInstance.value) {
    const now = performance.now();
    const dt = lastPanTime > 0 ? Math.max(now - lastPanTime, 8) : 16;
    lastPanTime = now;

    const dx = ev.clientX - prev.x;
    const dy = ev.clientY - prev.y;

    const instantVx = (dx / dt) * 16.6;
    const instantVy = (dy / dt) * 16.6;
    panVelocity.x = panVelocity.x * 0.4 + instantVx * 0.6;
    panVelocity.y = panVelocity.y * 0.4 + instantVy * 0.6;

    try {
      const currentPan = panZoomInstance.value.getPan();
      panZoomInstance.value.pan({ x: currentPan.x + dx, y: currentPan.y + dy });
    } catch (err) { }

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
  stopInertia();
  stopPanAnimation();
  panVelocity = { x: 0, y: 0 };
  lastPanTime = performance.now();

  // Desfocar qualquer campo de texto ou editor Monaco ao interagir no canvas
  if (document.activeElement && typeof document.activeElement.blur === 'function') {
    const tagName = document.activeElement.tagName?.toUpperCase();
    const isInput = tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
    const isMonaco = !!document.activeElement.closest?.('.monaco-editor');
    if (isInput || isMonaco || document.activeElement.getAttribute?.('contenteditable') === 'true') {
      document.activeElement.blur();
    }
  }

  // Tratamento do Modo Carimbo (Stamp Tool)
  if (store.isStampActive) {
    if (e.button === 0) {
      e.preventDefault();
      e.stopPropagation();
      if (svgRoot.value && panZoomInstance.value) {
        const rect = svgRoot.value.getBoundingClientRect();
        const pan = panZoomInstance.value.getPan();
        const zoom = panZoomInstance.value.getZoom();
        const posX = Math.round((e.clientX - rect.left - pan.x) / zoom);
        const posY = Math.round((e.clientY - rect.top - pan.y) / zoom);
        emit('stampPlaced', { x: posX, y: posY });
      }
      return;
    } else if (e.button === 2) {
      e.preventDefault();
      e.stopPropagation();
      store.cancelStampMode();
      return;
    }
  }

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
    startInertia();
  }
  if (e.button === 0 && isLeftMousePanning.value) {
    isLeftMousePanning.value = false;
    disablePan();
    startInertia();
  }
};

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

let ghostRafId = null;
let latestPointerX = 0;
let latestPointerY = 0;

const handleCanvasPointerMove = (e) => {
  if (!store.isStampActive) return;
  latestPointerX = e.clientX;
  latestPointerY = e.clientY;

  if (ghostRafId) return;

  ghostRafId = requestAnimationFrame(() => {
    ghostRafId = null;
    if (!store.isStampActive || !svgRoot.value || !panZoomInstance.value) return;
    const rect = svgRoot.value.getBoundingClientRect();
    const pan = panZoomInstance.value.getPan();
    const zoom = panZoomInstance.value.getZoom();
    const posX = (latestPointerX - rect.left - pan.x) / zoom;
    const posY = (latestPointerY - rect.top - pan.y) / zoom;
    store.setStampGhostPosition({ x: posX, y: posY });
  });
};

const handleContextMenu = (e) => {
  if (store.isStampActive) {
    e.preventDefault();
    if (ghostRafId) {
      cancelAnimationFrame(ghostRafId);
      ghostRafId = null;
    }
    store.cancelStampMode();
  }
};

const handleMouseLeave = () => {
  if (ghostRafId) {
    cancelAnimationFrame(ghostRafId);
    ghostRafId = null;
  }
  if (store.isStampActive) {
    store.setStampGhostPosition(null);
  }
  if (isMiddleMouseDown) {
    isMiddleMouseDown = false;
    disablePan();
    startInertia();
  }
  if (isLeftMousePanning.value) {
    isLeftMousePanning.value = false;
    disablePan();
    startInertia();
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
  stopInertia();
  stopPanAnimation();
  if (!panZoomInstance.value) return;

  const rect = svgRoot.value.getBoundingClientRect();
  const clientX = e.clientX - rect.left;
  const clientY = e.clientY - rect.top;
  const currentZoom = panZoomInstance.value.getZoom();

  const delta = e.deltaY < 0 ? 1 : -1;
  const scaleFactor = 1.1 ** delta;
  let newZoom = currentZoom * scaleFactor;

  const minZoom = 0.05;
  const maxZoom = 2.0;

  newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

  if (Math.abs(newZoom - currentZoom) < 0.001) {
    return;
  }
  try {
    panZoomInstance.value.zoom(newZoom);
    saveState();
  } catch (error) { }
};

watch(
  () => store.zoom,
  (newZoom) => {
    if (panZoomInstance.value && panZoomInstance.value.getZoom() !== newZoom) {
      panZoomInstance.value.zoom(newZoom);
    }
  }
);

let resizeObserver = null;
let lastCanvasRight = null;
let lastWindowWidth = null;

const updateCanvasSize = () => {
  if (!svgRoot.value) return;
  const rect = svgRoot.value.getBoundingClientRect();
  const currentWidth = Math.round(rect.width);
  const currentHeight = Math.round(rect.height);
  const currentRight = Math.round(rect.right);
  const currentWindowWidth = window.innerWidth;

  store.updateViewportSize({
    width: currentWidth,
    height: currentHeight,
  });

  if (
    panZoomInstance.value &&
    lastCanvasRight !== null &&
    lastWindowWidth === currentWindowWidth
  ) {
    const deltaRight = currentRight - lastCanvasRight;
    if (deltaRight !== 0) {
      panZoomInstance.value.panBy({ x: deltaRight, y: 0 });
      saveState();
    }
  }

  lastCanvasRight = currentRight;
  lastWindowWidth = currentWindowWidth;
};

onMounted(() => {
  if (svgRoot.value) {
    updateCanvasSize();
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updateCanvasSize();
      });
      resizeObserver.observe(svgRoot.value);
    }

    setTimeout(() => {
      try {
        panZoomInstance.value = svgPanZoom(svgRoot.value, {
          viewportSelector: "#viewport-layer",
          panEnabled: false,
          dblClickZoomEnabled: false,
          zoomScaleSensitivity: 0,
          minZoom: 0.05,
          maxZoom: 2.0,
          fit: false,
          center: false,
        });

        panZoomInstance.value.setMinZoom(0.05);
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
      } catch (error) { }
    }, 100);
  }
});

onUnmounted(() => {
  stopInertia();
  stopPanAnimation();

  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

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

  try { window._brdiagrama_suppressGlobalPointerHandlers = false; } catch (e) { }
});

const fitToScreen = () => {
  stopPanAnimation();
  if (panZoomInstance.value) {
    panZoomInstance.value.fit();
    panZoomInstance.value.center();
    saveState();
  }
};

const panToCoordinates = (targetX, targetY, { animate = true, duration = 280 } = {}) => {
  if (!panZoomInstance.value || !svgRoot.value) return;

  stopInertia();
  stopPanAnimation();

  const rect = svgRoot.value.getBoundingClientRect();
  const currentZoom = panZoomInstance.value.getZoom();
  const targetPanX = rect.width / 2 - targetX * currentZoom;
  const targetPanY = rect.height / 2 - targetY * currentZoom;

  if (!animate || duration <= 0) {
    panZoomInstance.value.pan({ x: targetPanX, y: targetPanY });
    saveState();
    return;
  }

  const startPan = panZoomInstance.value.getPan();
  const deltaX = targetPanX - startPan.x;
  const deltaY = targetPanY - startPan.y;
  const startTime = performance.now();

  const step = (now) => {
    if (!panZoomInstance.value) {
      stopPanAnimation();
      return;
    }

    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    panZoomInstance.value.pan({
      x: startPan.x + deltaX * eased,
      y: startPan.y + deltaY * eased,
    });

    if (progress < 1) {
      panAnimationId = requestAnimationFrame(step);
    } else {
      panAnimationId = null;
      saveState();
    }
  };

  panAnimationId = requestAnimationFrame(step);
};

defineExpose({
  fitToScreen,
  panToCoordinates,
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
}

.table-group:active {
  cursor: grabbing !important;
}
</style>
