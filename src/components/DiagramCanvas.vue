<template>
    <svg
        ref="svgRoot"
        class="diagram-canvas"
        @wheel="handleWheelEvent"
        style="width: 100%; height: 100%; cursor: grab;"
    >
     <!-- NOVO: Definições de padrões para o grid -->
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
            opacity="0.8"
             />
            </pattern>
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
    x="-10000" 
    y="-10000"
    width="20000" 
    height="20000" 
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