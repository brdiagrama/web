<template>
    <div class="diagram-toolbar">
        <button @click="fitDiagram" class="toolbar-btn">
            Ajustar à Tela
        </button>
          <!-- NOVO: Botão do Grid -->
        <button 
            @click="toggleGrid" 
            :class="['toolbar-btn', 'grid-btn', { active: store.isGridVisible }]"
            title="Mostrar/Ocultar Grade"
        >
            <svg width="16" height="16" viewBox="0 0 16 16">
                <!-- Ícone de grade pontilhada -->
                <circle cx="2" cy="2" r="0.5" fill="currentColor"/>
                <circle cx="6" cy="2" r="0.5" fill="currentColor"/>
                <circle cx="10" cy="2" r="0.5" fill="currentColor"/>
                <circle cx="14" cy="2" r="0.5" fill="currentColor"/>
                <!-- ... mais pontos para formar a grade -->
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
 * Chama o método 'fitToScreen' exposto pelo DiagramCanvas.
 */
const fitDiagram = () => {
    // Verifica se a referência ao componente DiagramCanvas é válida
    if (props.diagramRef && props.diagramRef.fitToScreen) {
        props.diagramRef.fitToScreen();
    }
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
}

.grid-btn.active {
    background-color: #007acc;
    color: white;
}

.grid-btn:hover {
    background-color: #f0f0f0;
}

.grid-btn.active:hover {
    background-color: #005a9e;
}
</style>