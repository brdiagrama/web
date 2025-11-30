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
    <!-- NOVO: Definições de padrões para o grid -->
    <defs>
      <!-- Linha 15-23 - Modificar o pattern: -->
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
      <!-- Retângulo de fundo existente -->
      <rect
        class="diagram-background-rect"
        width="100%"
        height="100%"
        fill="none"
        style="pointer-events: all"
      />
    </g>
    <g id="viewport-layer">
      <!-- Grid de fundo (condicional) -->
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

      <!-- Retângulo de seleção -->

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
const isLeftMousePanning = ref(false); // Para rastrear pan com botão esquerdo

// Estado do cursor
const currentCursor = ref("default");

// --- Pointer/Gesture state (Fase B) ---
const activePointers = new Map(); // pointerId -> { x, y }
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
    // Treat as pinch (zoom)
    if (typeof panZoomInstance.value.zoomAtPoint === 'function') {
      panZoomInstance.value.zoomAtPoint(newZoom, { x: midpoint.x - rect.left, y: midpoint.y - rect.top });
    } else {
      // Fallback: calcula content coords e reaplica pan após setZoom
      const initPan = gestureInit.pan;
      const initZoom = gestureInit.zoom;
      const contentX = (gestureInit.midpoint.x - rect.left - initPan.x) / initZoom;
      const contentY = (gestureInit.midpoint.y - rect.top - initPan.y) / initZoom;

      // Aplica zoom
      panZoomInstance.value.zoom(newZoom);

      // Calcula novo pan para manter o ponto no lugar do midpoint atual
      const newPanX = midpoint.x - rect.left - contentX * newZoom;
      const newPanY = midpoint.y - rect.top - contentY * newZoom;
      panZoomInstance.value.pan({ x: newPanX, y: newPanY });
    }
  } catch (err) {
    // gesture update error (suppressed)
  }
};

// Handlers globais para pointer (registrados dinamicamente)
const onPointerMoveGlobal = (ev) => {
  // Se estamos suprimindo handlers globais (ex: arrasto de tabela em App.vue), ignoramos
  if (window._brdiagrama_suppressGlobalPointerHandlers) return;

  // Se não temos um registro prévio, ignoramos (registro feito no pointerdown)
  const prev = activePointers.get(ev.pointerId);
  if (!prev) return;

  // Se estamos em panning com um único ponteiro (botão do meio ou modo mão), aplicamos pan manualmente
  if ((isMiddleMouseDown || isLeftMousePanning.value) && activePointers.size === 1 && panZoomInstance.value) {
    const dx = ev.clientX - prev.x;
    const dy = ev.clientY - prev.y;

    // Atualiza o pan absoluto
    try {
      const currentPan = panZoomInstance.value.getPan();
      panZoomInstance.value.pan({ x: currentPan.x + dx, y: currentPan.y + dy });
    } catch (err) {
      // pan manual error (suppressed)
    }

    // Atualiza o ponto armazenado
    activePointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    // Salva estado para persistir se necessário
    saveState();
    return;
  }

  // Atualiza posição e, caso tenhamos >=2 ponteiros, processa gesture (pinch/pan)
  activePointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
  if (activePointers.size >= 2) {
    // If selection was pending (waiting to see if a second pointer would arrive), cancel it
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
  // Cancel any pending single-touch selection when pointers change
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

// Estado do retângulo de seleção
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

// Função para salvar o estado de zoom e pan na store
const saveState = () => {
  if (!panZoomInstance.value) return;

  const pan = panZoomInstance.value.getPan();
  const zoom = panZoomInstance.value.getZoom();

  store.updatePan(pan);
  store.updateZoom(zoom);
};

// --- Funções de Panorâmica (Arrastar) ---

const handleMouseDown = (e) => {
  // Se for PointerEvent, registre o ponteiro para suportar gestos
  if (window.PointerEvent && e.pointerId != null) {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!window._brdiagrama_hasPointerListeners) {
      window.addEventListener('pointermove', onPointerMoveGlobal, { passive: false });
      window.addEventListener('pointerup', onPointerUpGlobal);
      window.addEventListener('pointercancel', onPointerUpGlobal);
      window._brdiagrama_hasPointerListeners = true;
    }
  }
  // Ignora se o clique foi em um elemento que não seja o fundo (tabelas, etc)
  const targetClasses = e.target.classList;
  const isBackground = targetClasses.contains('diagram-background-rect') || 
                       targetClasses.contains('grid-background') ||
                       e.target === svgRoot.value;

  // Avisa o pai que o usuário tocou/clicou no canvas (permite desselcionar hover/colunas)
  if (isBackground) {
    emit('canvasPointerDown');
  }
  
  // Botão do meio (Scroll/Pan)
  if (e.button === 1) {
    e.preventDefault();
    isMiddleMouseDown = true;
    enablePan();
  }
  // Botão esquerdo (Pan Mode ou Seleção)
  else if (e.button === 0) {
    // Se Pan Mode estiver ativo, ativa o pan
    if (store.isPanMode) {
      // Não prevenir o evento para não bloquear o svg-pan-zoom interno
      isLeftMousePanning.value = true;
      enablePan();
      return;
    }
    
    // Só inicia seleção se clicou no fundo
    if (!isBackground) {
      return;
    }

    // Se houver >=2 pointers ativos, isso é parte de um gesto (pinch) — não iniciar seleção
    if (activePointers.size >= 2) {
      return;
    }

    // Caso contrário, inicia seleção
    const rect = svgRoot.value.getBoundingClientRect();
    const pan = panZoomInstance.value.getPan();
    const zoom = panZoomInstance.value.getZoom();

    // Para dispositivos touch, aguarda um curto delay para detectar segunda ponta (evita iniciar seleção quando o usuário começar um gesto com 2 dedos)
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
      // don't start selection immediately; wait a short moment to see if a second pointer arrives
      return;
    }

    // Inicia coordenadas (desktop / immediate)
    startPoint.x = (e.clientX - rect.left - pan.x) / zoom;
    startPoint.y = (e.clientY - rect.top - pan.y) / zoom;

    isSelecting = true;

    // Define caixa inicial (ponto único)
    selectionBox.value = {
      visible: true,
      startX: startPoint.x,
      startY: startPoint.y,
      endX: startPoint.x,
      endY: startPoint.y,
    };

  // Adiciona listeners na janela para garantir que o mouse/up seja capturado mesmo fora do SVG
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
  
  // Previne selecionar texto indesejado enquanto arrasta
  // Em eventos de touch precisamos prevenir scroll enquanto selecionamos
  if (e.cancelable) e.preventDefault();

  const rect = svgRoot.value.getBoundingClientRect();
  const pan = panZoomInstance.value.getPan();
  const zoom = panZoomInstance.value.getZoom();

  selectionBox.value.endX = (e.clientX - rect.left - pan.x) / zoom;
  selectionBox.value.endY = (e.clientY - rect.top - pan.y) / zoom;

  // Emitindo em tempo real para o efeito visual
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
    
    // Remove os listeners globais para não pesar a memória
    if (window.PointerEvent) {
      window.removeEventListener("pointermove", handleMouseMove);
      window.removeEventListener("pointerup", handleWindowMouseUp);
      window.removeEventListener("pointercancel", handleWindowMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    }

    // Calcula área final
    const selectionArea = {
      x1: Math.min(selectionBox.value.startX, selectionBox.value.endX),
      y1: Math.min(selectionBox.value.startY, selectionBox.value.endY),
      x2: Math.max(selectionBox.value.startX, selectionBox.value.endX),
      y2: Math.max(selectionBox.value.startY, selectionBox.value.endY),
    };

    // Emite evento final (App.vue vai processar e limpar se for clique vazio)
    emit("selectionArea", selectionArea);

    // Esconde a caixa visualmente
    selectionBox.value.visible = false;
  }
};

const handleGlobalMouseUp = (e) => {
    if (e.button === 1 && isMiddleMouseDown) {
        isMiddleMouseDown = false;
        disablePan();
    }
    // Se Pan Mode estiver ativo e botão esquerdo for solto
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
    // Finalizar seleção
    isSelecting = false;
    if (window.PointerEvent) {
      svgRoot.value.removeEventListener("pointermove", handleMouseMove);
    } else {
      svgRoot.value.removeEventListener("mousemove", handleMouseMove);
    }

    // Aqui você pode emitir um evento com as coordenadas do retângulo
    // para que o componente pai possa selecionar as tabelas dentro da área
    const selectionArea = {
      x1: Math.min(selectionBox.value.startX, selectionBox.value.endX),
      y1: Math.min(selectionBox.value.startY, selectionBox.value.endY),
      x2: Math.max(selectionBox.value.startX, selectionBox.value.endX),
      y2: Math.max(selectionBox.value.startY, selectionBox.value.endY),
    };

    // Emit event para o componente pai
    emit("selectionArea", selectionArea);

    // Esconder o retângulo
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
    // Altera o cursor para indicar que é possível arrastar
    currentCursor.value = "grabbing";
    panZoomInstance.value.enablePan();
    isPanEnabled = true;
  }
};

const disablePan = () => {
  if (panZoomInstance.value && isPanEnabled) {
    // Restaura o cursor
    currentCursor.value = "default";
    panZoomInstance.value.disablePan();
    isPanEnabled = false;
  }
};

const handleWheelEvent = (e) => {
  // Verifica se Ctrl está pressionado
  if (e.ctrlKey) {
    // Previne o comportamento padrão apenas quando Ctrl estiver pressionado
    e.preventDefault();
    handleZoom(e);
  }
  // Se Ctrl não estiver pressionado, permite o scroll normal da página
};

// --- Funções de Zoom ---

// Lida com o zoom usando a roda do mouse (scroll)
const handleZoom = (e) => {
  if (!panZoomInstance.value) return;

  // Calcula as coordenadas do mouse no elemento SVG
  const rect = svgRoot.value.getBoundingClientRect();
  const clientX = e.clientX - rect.left;
  const clientY = e.clientY - rect.top; // Pega o zoom atual
  const currentZoom = panZoomInstance.value.getZoom();

  // Decide a direção (in/out)
  const delta = e.deltaY < 0 ? 1 : -1;
  // Usa uma sensibilidade menor para um zoom mais suave
  const scaleFactor = 1.1 ** delta;
  // Calcula o novo zoom
  let newZoom = currentZoom * scaleFactor;

  // Aplica os limites rigorosamente (1% a 200%)
  const minZoom = 0.01; // 1%
  const maxZoom = 2.0; // 200%

  // Força os limites
  newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

  // debug logs removed

  // Se o zoom não mudou significativamente, não faz nada
  if (Math.abs(newZoom - currentZoom) < 0.001) {
  // debug logs removed
    return;
  } // FORÇA o zoom diretamente, ignorando os limites internos da biblioteca
  try {
    // Temporariamente remove os limites da biblioteca
    panZoomInstance.value.setMinZoom(0.001);
    panZoomInstance.value.setMaxZoom(10);

    // Aplica o novo zoom diretamente
    panZoomInstance.value.zoom(newZoom);

    // Restaura os limites
    panZoomInstance.value.setMinZoom(0.01);
    panZoomInstance.value.setMaxZoom(2.0);

    saveState();
  } catch (error) {
    // zoom apply error (suppressed)
  }
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
    // Aguarda um momento para garantir que o DOM esteja pronto
    setTimeout(() => {
      try {
        panZoomInstance.value = svgPanZoom(svgRoot.value, {
          viewportSelector: "#viewport-layer",
          panEnabled: false,
          dblClickZoomEnabled: false,
          zoomScaleSensitivity: 0,
          minZoom: 0.01, // 1% mínimo (0.01 * 100 = 1%)
          maxZoom: 2.0, // 200% máximo (2.0 * 100 = 200%)
          fit: false,
          center: false,
        });

        // Força os limites novamente (às vezes a biblioteca ignora na inicialização)
        panZoomInstance.value.setMinZoom(0.01);
        panZoomInstance.value.setMaxZoom(2.0);

        // Carrega o estado inicial
        panZoomInstance.value.zoom(store.zoom);
        panZoomInstance.value.pan(store.pan);

        // Adiciona listeners para salvar o estado
        panZoomInstance.value.setOnPan(saveState);
        panZoomInstance.value.setOnZoom(saveState);

          // Listener global para capturar mouseup/pointerup fora do SVG
         if (window.PointerEvent) {
           window.addEventListener("pointerup", handleGlobalMouseUp);
           window.addEventListener("pointercancel", handleGlobalMouseUp);
         } else {
           window.addEventListener("mouseup", handleGlobalMouseUp);
         }
      } catch (error) {
        // svg-pan-zoom init error (suppressed)
      }
    }, 100);
  }
});

onUnmounted(() => {
  // Limpar listeners globais
  if (window.PointerEvent) {
    window.removeEventListener("pointerup", handleGlobalMouseUp);
    window.removeEventListener("pointercancel", handleGlobalMouseUp);

    window.removeEventListener("pointerup", handleWindowMouseUp);
    window.removeEventListener("pointercancel", handleWindowMouseUp);
    window.removeEventListener("pointermove", handleMouseMove);

    // Remover listeners de gesture caso existam
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

  // Ensure suppression flag removed on unmount
  try { window._brdiagrama_suppressGlobalPointerHandlers = false; } catch (e) {}
});

// --- Métodos Expostos (Acessíveis pelo componente pai) ---
const fitToScreen = () => {
  if (panZoomInstance.value) {
    panZoomInstance.value.fit();
    panZoomInstance.value.center();
    saveState(); // Salva o novo estado 'fit'
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
  /* Retângulo de fundo do SVG */
  fill: none;
}

.grid-background {
  /* Grid de fundo do SVG */
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
  font-weight: 700; /* Negrito mais forte como na imagem */
  font-size: 14px;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  pointer-events: none;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1); /* Leve sombra para leitura */
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
  text-transform: uppercase; /* Fica mais elegante */
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

/* Ajuste para ícones SVG do Lucide (prioriza cor via color e remove fill) */
.pk-icon svg {
  color: #10b981 !important; /* Teal para PK */
  fill: none;
}

.fk-icon svg {
  color: #3b82f6 !important; /* Azul para FK */
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
  stroke: #192747; /* cor da borda ao passar o mouse */
  stroke-width: 1px; /* opcional: engrossar */
}

.table-group:active {
  cursor: grabbing !important;
}
</style>
