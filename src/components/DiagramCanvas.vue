<template>
  <svg
    ref="svgRoot"
    class="diagram-canvas"
    @wheel="handleWheelEvent"
    :style="{ width: '100%', height: '100%', cursor: currentCursor }"
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
        @mousedown="handleMouseDown"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseLeave"
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


const emit = defineEmits(["selectionArea", "selectionSelecting"]);

const store = useDiagramStore();

const svgRoot = ref(null);
const panZoomInstance = ref(null);
let isPanEnabled = false;
let isMiddleMouseDown = false;

// Estado do cursor
const currentCursor = ref("default");

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
  // Botão do meio (Scroll/Pan)
  if (e.button === 1) {
    e.preventDefault();
    isMiddleMouseDown = true;
    enablePan();
  }
  // Botão esquerdo (Seleção)
  else if (e.button === 0) {
    const rect = svgRoot.value.getBoundingClientRect();
    const pan = panZoomInstance.value.getPan();
    const zoom = panZoomInstance.value.getZoom();

    // Inicia coordenadas
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

    // 🔥 CORREÇÃO: Adiciona listeners na JANELA (window).
    // Isso garante que se soltar o mouse em cima de qualquer coisa (tabela, overlay, fora da tela),
    // o evento será capturado.
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
  }
};

const handleMouseMove = (e) => {
  if (!isSelecting) return;
  
  // Previne selecionar texto indesejado enquanto arrasta
  e.preventDefault();

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
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleWindowMouseUp);

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
}

const handleMouseUp = (e) => {
  if (e.button === 1 && isMiddleMouseDown) {
    isMiddleMouseDown = false;
    disablePan();
  } else if (e.button === 0 && isSelecting) {
    // Finalizar seleção
    isSelecting = false;
    svgRoot.value.removeEventListener("mousemove", handleMouseMove);

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

  console.log(
    "Zoom:",
    Math.round(currentZoom * 100) + "% → " + Math.round(newZoom * 100) + "%"
  );

  // Se o zoom não mudou significativamente, não faz nada
  if (Math.abs(newZoom - currentZoom) < 0.001) {
    console.log("Zoom no limite!");
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
    console.error("Erro ao aplicar zoom:", error);
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

        // Listener global para capturar mouseup fora do SVG
       window.addEventListener("mouseup", handleGlobalMouseUp);
      } catch (error) {
        console.error("Erro ao inicializar svg-pan-zoom:", error);
      }
    }, 100);
  }
});

onUnmounted(() => {
  // Limpar listeners globais
 window.removeEventListener("mouseup", handleGlobalMouseUp);
  window.removeEventListener("mouseup", handleWindowMouseUp);
  window.removeEventListener("mousemove", handleMouseMove);
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
  font-weight: bold;
  font-size: 14px;
  pointer-events: none;
}

.col-text {
  font-size: 12px;
  fill: #333;
  pointer-events: none;
}

.col-type {
  font-size: 11px;
  fill: #95a5a6;
  pointer-events: none;
}

.pk-icon {
  fill: #1abc9c;
  font-size: 10px;
  font-weight: bold;
}

.fk-icon {
  fill: #3498db;
  font-size: 10px;
  font-weight: bold;
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
