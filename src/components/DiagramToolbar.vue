<template>
    <div class="diagram-toolbar">
        <button @click="resetZoom" class="toolbar-btn reset-zoom-btn" title="Zoom 100%">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <!-- Quadrado externo -->
                <rect x="3" y="3" width="18" height="18" stroke-width="2" rx="2"/>
                <!-- Setas nos cantos -->
                <path d="M 7 7 L 7 10 M 7 7 L 10 7" stroke-width="2" stroke-linecap="round"/>
                <path d="M 17 7 L 17 10 M 17 7 L 14 7" stroke-width="2" stroke-linecap="round"/>
                <path d="M 7 17 L 7 14 M 7 17 L 10 17" stroke-width="2" stroke-linecap="round"/>
                <path d="M 17 17 L 17 14 M 17 17 L 14 17" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </button>
          <!-- NOVO: Botão do Grid -->
        <button 
            @click="toggleGrid" 
            :class="['toolbar-btn', 'grid-btn', { active: store.isGridVisible }]"
            title="Mostrar/Ocultar Grade"
        >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor">
                <!-- Linhas verticais -->
                <line x1="6" y1="2" x2="6" y2="16" stroke-width="2"/>
                <line x1="12" y1="2" x2="12" y2="16" stroke-width="2"/>
                <!-- Linhas horizontais -->
                <line x1="2" y1="6" x2="16" y2="6" stroke-width="2"/>
                <line x1="2" y1="12" x2="16" y2="12" stroke-width="2"/>
            </svg>
        </button>
           
        
        <div class="zoom-control">
            <button @click="decreaseZoom" class="zoom-btn" title="Diminuir Zoom">−</button>
            <span class="zoom-label">{{ Math.round(zoomScale) }}%</span>
            <button @click="increaseZoom" class="zoom-btn" title="Aumentar Zoom">+</button>
        </div>
    </div>
    
</template>

<script setup>
import { computed } from 'vue';
import { useDiagramStore } from '@/stores/diagram';


// Propriedade injetada: O componente pai deve passar a ref do DiagramCanvas
const props = defineProps({
    diagramRef: {
        type: Object,
        required: true,
    }
});

const store = useDiagramStore();

// NOVA: Função para toggle do grid
const toggleGrid = () => {
    store.toggleGrid();
};

// Lógica para sincronizar o zoom com a store
const zoomScale = computed({
    get() {
        return store.zoom * 100; // Store 1.0 -> UI 100
    },
    set(value) {
        store.updateZoom(value / 100); // UI 100 -> Store 1.0
    }
});

/**
 * Calcula o próximo incremento baseado no valor atual do zoom
 * 1-30: +1
 * 31-100: +3
 * 101-150: +5
 * 151-200: +8
 */
const getZoomIncrement = (currentZoom) => {
    if (currentZoom <= 30) return 1;
    if (currentZoom <= 100) return 3;
    if (currentZoom <= 150) return 5;
    return 8;
};

/**
 * Aumenta o zoom seguindo a lógica de incremento variável
 */
const increaseZoom = () => {
    const current = Math.round(zoomScale.value);
    const increment = getZoomIncrement(current);
    const newZoom = Math.min(200, current + increment);
    zoomScale.value = newZoom;
};

/**
 * Diminui o zoom seguindo a lógica de incremento variável
 */
const decreaseZoom = () => {
    const current = Math.round(zoomScale.value);
    
    // Determina o decremento baseado no valor APÓS a diminuição
    let newZoom = current;
    
    if (current > 151) {
        newZoom = Math.max(151, current - 8);
    } else if (current > 101) {
        newZoom = Math.max(101, current - 5);
    } else if (current > 31) {
        newZoom = Math.max(31, current - 3);
    } else {
        newZoom = Math.max(1, current - 1);
    }
    
    zoomScale.value = newZoom;
};

/**
 * Reseta o zoom para 100%
 */
const resetZoom = () => {
    zoomScale.value = 100;
};

</script>

<style scoped>
.diagram-toolbar {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    gap: 20px;
    align-items: center;
}
.toolbar-btn {
    padding: 8px 15px;
    cursor: pointer;
}

.reset-zoom-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 36px;
    padding: 0;
    border: 1px solid #ddd;
    background: white;
    border-radius: 7px;
    transition: all 0.2s ease;
}

.reset-zoom-btn:hover {
    background-color: #f0f0f0;
    border-color: #999;
}

.reset-zoom-btn:active {
    background-color: #e0e0e0;
}
.zoom-control {
    display: flex;
    align-items: center;
    gap: 8px;
}

.zoom-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: bold;
    cursor: pointer;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.zoom-btn:hover {
    background-color: #f0f0f0;
    border-color: #999;
}

.zoom-btn:active {
    background-color: #e0e0e0;
}

.zoom-label {
    min-width: 50px;
    text-align: center;
    font-weight: 500;
}
.grid-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    width: 75px;
    height: 36px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 7px;
}

.grid-btn.active {
    background-color: #e8f4ff;
    border-color: #007acc;
    color: #007acc;
}

.grid-btn:hover {
    background-color: #f0f0f0;
    border-color: #999;
}

.grid-btn.active:hover {
    background-color: #d0e8ff;
    border-color: #005a9e;
}
</style>