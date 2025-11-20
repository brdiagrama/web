<template>
    <svg
        ref="svgRoot"
        class="diagram-canvas"
        @wheel="handleWheelEvent"
        style="width: 100%; height: 100%; cursor: grab;"
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
       <marker id="crowsFoot" markerWidth="10" markerHeight="12" refX="0" refY="4" orient="auto">
        <path d="M0 6 L12 6 M12 0 L0 6 L12 12" fill="none" stroke="#7f8c8d" stroke-width="1.5" transform="scale(0.5) rotate(180 6 7)"/>
        </marker>
        
        <marker id="oneBar" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
        <circle cx="5" cy="5" r="3" fill="#fff" stroke="#7f8c8d" stroke-width="1.5" transform="scale(0.7)" />
        </marker>

        <marker id="crowsFootHover" markerWidth="5" markerHeight="12" refX="0" refY="4" orient="auto">
        <path d="M0 6 L12 6 M12 0 L0 6 L12 12" fill="none" stroke="#2980b9" stroke-width="2" transform="scale(0.5) rotate(180 6 7)"/>
        </marker>
        
        <marker id="oneBarHover" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
        <circle cx="5" cy="5" r="3" fill="#fff" stroke="#2980b9" stroke-width="2" transform="scale(0.6)"/>
        </marker>

        <!-- Zero ou Um (0..1) - Círculo duplo -->
        <marker id="zeroOrOne" markerWidth="14" markerHeight="10" refX="14" refY="5" orient="auto">
        <circle cx="3" cy="5" r="2.5" fill="#fff" stroke="#7f8c8d" stroke-width="1.5" transform="scale(0.7)"/>
        <circle cx="11" cy="5" r="2.5" fill="#fff" stroke="#7f8c8d" stroke-width="1.5" transform="scale(0.7)"/>
        </marker>

        <marker id="zeroOrOneHover" markerWidth="14" markerHeight="10" refX="14" refY="5" orient="auto">
        <circle cx="3" cy="5" r="2.5" fill="#fff" stroke="#2980b9" stroke-width="2" transform="scale(0.7)"/>
         <circle cx="11" cy="5" r="2.5" fill="#fff" stroke="#2980b9" stroke-width="2" transform="scale(0.7)"/>
        </marker>

        <!-- Exatamente Um (1) - Barra dupla vertical -->
        <marker id="exactlyOne" markerWidth="10" markerHeight="12" refX="10" refY="6" orient="auto">
        <line x1="3" y1="0" x2="3" y2="12" stroke="#7f8c8d" stroke-width="1.5" transform="scale(0.7)"/>
        <line x1="7" y1="0" x2="7" y2="12" stroke="#7f8c8d" stroke-width="1.5" transform="scale(0.7)"/>
        </marker>

        <marker id="exactlyOneHover" markerWidth="10" markerHeight="12" refX="10" refY="6" orient="auto">
        <line x1="3" y1="0" x2="3" y2="12" stroke="#2980b9" stroke-width="2" transform="scale(0.7)"/>
        <line x1="7" y1="0" x2="7" y2="12" stroke="#2980b9" stroke-width="2" transform="scale(0.7)"/>
        </marker>

        <!-- Zero ou Muitos (0..*) - Círculo + Crow's Foot -->
        <marker id="zeroOrMany" markerWidth="18" markerHeight="12" refX="0" refY="6" orient="auto">
        <circle cx="3" cy="6" r="2.5" fill="#fff" stroke="#7f8c8d" stroke-width="1.5" transform="scale(0.7)"/>
        <path d="M7 6 L18 6 M18 0 L12 6 L18 12" fill="none" stroke="#7f8c8d" stroke-width="1.5" transform="scale(0.7)"/>
        </marker>

        <marker id="zeroOrManyHover" markerWidth="18" markerHeight="12" refX="0" refY="6" orient="auto">
        <circle cx="3" cy="6" r="2.5" fill="#fff" stroke="#2980b9" stroke-width="2" transform="scale(0.7)"/>
        <path d="M7 6 L18 6 M18 0 L12 6 L18 12" fill="none" stroke="#2980b9" stroke-width="2" transform="scale(0.7)"/>
        </marker>

        </defs>
        
        <g id="background-layer">
         
            <!-- Retângulo de fundo existente -->
            <rect 
            class="diagram-background-rect" 
            width="100%" 
            height="100%" 
            fill="none"
            style="pointer-events: all;"
            @mousedown="enablePan"
            @mouseup="disablePan"
            @mouseleave="disablePan"
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
    style="pointer-events: none;"
/>
            
            <slot />
        </g>
    </svg>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import svgPanZoom from 'svg-pan-zoom';
import { useDiagramStore } from '@/stores/diagram';


const store = useDiagramStore();

const svgRoot = ref(null);
const panZoomInstance = ref(null);
let isPanEnabled = false;

// Função para salvar o estado de zoom e pan na store
const saveState = () => {
    if (!panZoomInstance.value) return;
    
    const pan = panZoomInstance.value.getPan();
    const zoom = panZoomInstance.value.getZoom();

    store.updatePan(pan);
    store.updateZoom(zoom);
};

// --- Funções de Panorâmica (Arrastar) ---

const enablePan = () => {
    if (panZoomInstance.value) {
        // Altera o cursor para indicar que é possível arrastar
        svgRoot.value.style.cursor = 'grabbing';
        panZoomInstance.value.enablePan();
        isPanEnabled = true;
    }
};

const disablePan = () => {
    if (panZoomInstance.value && isPanEnabled) {
        // Restaura o cursor
        svgRoot.value.style.cursor = 'grab';
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
    const clientY = e.clientY - rect.top;    // Pega o zoom atual
    const currentZoom = panZoomInstance.value.getZoom();
    
    // Decide a direção (in/out)
    const delta = e.deltaY < 0 ? 1 : -1;
    // Usa uma sensibilidade menor para um zoom mais suave
    const scaleFactor = 1.1 ** delta;
      // Calcula o novo zoom
    let newZoom = currentZoom * scaleFactor;
    
    // Aplica os limites rigorosamente (1% a 200%)
    const minZoom = 0.01;  // 1%
    const maxZoom = 2.0;   // 200%
    
    // Força os limites
    newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
    
    console.log('Zoom:', Math.round(currentZoom * 100) + '% → ' + Math.round(newZoom * 100) + '%');
    
    // Se o zoom não mudou significativamente, não faz nada
    if (Math.abs(newZoom - currentZoom) < 0.001) {
        console.log('Zoom no limite!');
        return;
    }// FORÇA o zoom diretamente, ignorando os limites internos da biblioteca
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
        console.error('Erro ao aplicar zoom:', error);
    }
};

// Monitora o zoom vindo da store (ex: do slider na toolbar)
watch(() => store.zoom, (newZoom) => {
    if (panZoomInstance.value && panZoomInstance.value.getZoom() !== newZoom) {
        panZoomInstance.value.zoom(newZoom);
    }
});


// --- Lógica de Inicialização ---

onMounted(() => {
    if (svgRoot.value) {
        // Aguarda um momento para garantir que o DOM esteja pronto
        setTimeout(() => {
            try {                panZoomInstance.value = svgPanZoom(svgRoot.value, {
                    viewportSelector: '#viewport-layer',
                    panEnabled: false,
                    dblClickZoomEnabled: false,
                    zoomScaleSensitivity: 0,
                    minZoom: 0.01,  // 1% mínimo (0.01 * 100 = 1%)
                    maxZoom: 2.0,   // 200% máximo (2.0 * 100 = 200%)
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
                
            } catch (error) {
                console.error('Erro ao inicializar svg-pan-zoom:', error);
            }
        }, 100);
    }
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
    svgRoot
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
  stroke: #dfe6e9;
  stroke-width: 1px;
  filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.1));
}

.table-header-rect {
  fill: #2c3e50;
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
  fill: #e74c3c;
  font-size: 10px;
  font-weight: bold;
}

.fk-icon {
  fill: #3498db;
  font-size: 10px;
  font-weight: bold;
}

.table-group {
  cursor: move;
  transition: filter 0.2s ease;
}

.table-group:hover {
  filter: drop-shadow(0 6px 12px rgba(0,0,0,0.15));
}

.table-group:active {
  cursor: grabbing;
}
</style>