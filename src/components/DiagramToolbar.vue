<template>
    <div class="diagram-toolbar">
        <button @click="fitDiagram" class="toolbar-btn">
            Ajustar à Tela
        </button>
        
        <div class="zoom-control">
            <span>Zoom: {{ Math.round(zoomScale) }}%</span>            <input 
                type="range"
                v-model.number="zoomScale"
                min="1"
                max="200"
                step="1"
            >
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

// Lógica para sincronizar o slider (10-200) com a store (0.1-2.0)
const zoomScale = computed({
    get() {
        return store.zoom * 100; // Store 1.0 -> UI 100
    },
    set(value) {
        store.updateZoom(value / 100); // UI 100 -> Store 1.0
    }
});

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
    gap: 10px;
}
</style>