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
        
        <!-- Botão de Pan Mode -->
        <button 
            @click="togglePanMode" 
            :class="['toolbar-btn', 'pan-mode-btn', { active: store.isPanMode }]" 
            title="Modo de Navegação (Mover com Clique Esquerdo)"
        >
            <svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M256 0c-25.3 0-47.2 14.7-57.6 36c-7-2.6-14.5-4-22.4-4c-35.3 0-64 28.7-64 64l0 165.5-2.7-2.7c-25-25-65.5-25-90.5 0s-25 65.5 0 90.5L106.5 437c48 48 113.1 75 181 75l8.5 0 8 0c1.5 0 3-.1 4.5-.4c91.7-6.2 165-79.4 171.1-171.1c.3-1.5 .4-3 .4-4.5l0-176c0-35.3-28.7-64-64-64c-5.5 0-10.9 .7-16 2l0-2c0-35.3-28.7-64-64-64c-7.9 0-15.4 1.4-22.4 4C303.2 14.7 281.3 0 256 0zM240 96.1l0-.1 0-32c0-8.8 7.2-16 16-16s16 7.2 16 16l0 31.9 0 .1 0 136c0 13.3 10.7 24 24 24s24-10.7 24-24l0-136c0 0 0 0 0-.1c0-8.8 7.2-16 16-16s16 7.2 16 16l0 55.9c0 0 0 .1 0 .1l0 80c0 13.3 10.7 24 24 24s24-10.7 24-24l0-71.9c0 0 0-.1 0-.1c0-8.8 7.2-16 16-16s16 7.2 16 16l0 172.9c-.1 .6-.1 1.3-.2 1.9c-3.4 69.7-59.3 125.6-129 129c-.6 0-1.3 .1-1.9 .2l-4.9 0-8.5 0c-55.2 0-108.1-21.9-147.1-60.9L52.7 315.3c-6.2-6.2-6.2-16.4 0-22.6s16.4-6.2 22.6 0L119 336.4c6.9 6.9 17.2 8.9 26.2 5.2s14.8-12.5 14.8-22.2L160 96c0-8.8 7.2-16 16-16c8.8 0 16 7.1 16 15.9L192 232c0 13.3 10.7 24 24 24s24-10.7 24-24l0-135.9z"/>
            </svg>
        </button>
          <!-- NOVO: Botão do Grid -->
        <button 
            @click="toggleGrid" 
            :class="['toolbar-btn', 'grid-btn', { active: store.isGridVisible }]"
            title="Mostrar/Ocultar Grade"
        >
            <svg height="28" viewBox="0 0 24 24" width="28" xmlns="http://www.w3.org/2000/svg">
                <path d="M19,7 L19,17 L22,17 L22,19 L19,19 L19,22 L17,22 L17,19 L7,19 L7,22 L5,22 L5,19 L2,19 L2,17 L5,17 L5,7 L2,7 L2,5 L5,5 L5,2 L7,2 L7,5 L17,5 L17,2 L19,2 L19,5 L22,5 L22,7 L19,7 Z M17,7 L7,7 L7,17 L17,17 L17,7 Z" fill="currentColor"></path>
            </svg>
        </button>
           
        
        <div class="zoom-control">
            <button @click="decreaseZoom" class="zoom-btn" title="Diminuir Zoom">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor">
                    <line x1="2" y1="7" x2="12" y2="7" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            </button>
            <span class="zoom-label">{{ Math.round(zoomScale) }}%</span>
            <button @click="increaseZoom" class="zoom-btn" title="Aumentar Zoom">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor">
                    <line x1="7" y1="2" x2="7" y2="12" stroke-width="1.5" stroke-linecap="round"/>
                    <line x1="2" y1="7" x2="12" y2="7" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            </button>
        </div>
    </div>
    
</template>

<script setup>
import { computed } from 'vue';
import { useDiagramStore } from '@/stores/diagram';

const props = defineProps({
    diagramRef: {
        type: Object,
        required: true,
    }
});

const store = useDiagramStore();

const toggleGrid = () => {
    store.toggleGrid();
};

const togglePanMode = () => {
    store.togglePanMode();
};

const zoomScale = computed({
    get() {
        return store.zoom * 100;
    },
    set(value) {
        store.updateZoom(value / 100);
    }
});

const getZoomIncrement = (currentZoom) => {
    if (currentZoom <= 30) return 1;
    if (currentZoom <= 100) return 3;
    if (currentZoom <= 150) return 5;
    return 8;
};

const increaseZoom = () => {
    const current = Math.round(zoomScale.value);
    const increment = getZoomIncrement(current);
    const newZoom = Math.min(200, current + increment);
    zoomScale.value = newZoom;
};

const decreaseZoom = () => {
    const current = Math.round(zoomScale.value);
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

const resetZoom = () => {
    zoomScale.value = 100;
};

</script>

<style scoped>
.diagram-toolbar {
    position: absolute;
    bottom: 34px;
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    padding: 12px 14px;
    border-radius: 10px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
    display: flex;
    gap: 18px;
    align-items: center;
}
.toolbar-btn {
    padding: 10px 16px;
    cursor: pointer;
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
}

.reset-zoom-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    padding: 0;
    border: none;
    background: white;
    border-radius: 10px;
    transition: all 0.18s ease;
    color: #666;
}

.reset-zoom-btn:hover {
    background-color: #f0f0f0;
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
    width: 44px;
    height: 44px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    background: white;
    border-radius: 8px;
    transition: all 0.16s ease;
}

.zoom-btn:hover {
    background-color: #f0f0f0;
}

.zoom-btn:active {
    background-color: #e0e0e0;
}

.zoom-label {
    min-width: 50px;
    text-align: center;
    font-weight: 500;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}
.grid-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.16s ease;
    width: 48px;
    height: 48px;
    border: none;
    background: white;
    border-radius: 10px;
    color: #666;
}

.grid-btn.active {
    background-color: rgba(45,212,191,0.14);
    color: #24a897;
}

.grid-btn:hover {
    background-color: #f0f0f0;
}

.grid-btn.active:hover {
    background-color: rgba(45,212,191,0.18);
}

.pan-mode-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.16s ease;
    width: 48px;
    height: 48px;
    border: none;
    background: white;
    border-radius: 10px;
    color: #666;
}

.pan-mode-btn.active {
    background-color: rgba(45,212,191,0.14);
    color: #24a897;
}

.pan-mode-btn:hover {
    background-color: #f0f0f0;
}

.pan-mode-btn.active:hover {
    background-color: rgba(45,212,191,0.18);
}

@media (max-width: 768px) {
    .diagram-toolbar {
        bottom: calc(80px + env(safe-area-inset-bottom, 20px));
        gap: 12px;
        padding: 12px;
        left: 50%;
        transform: translateX(-50%);
    }
    .toolbar-btn, .zoom-btn, .reset-zoom-btn, .grid-btn, .pan-mode-btn {
        min-width: 52px;
        min-height: 52px;
        width: 52px;
        height: 52px;
    }
    .zoom-label { display: none; }
}
</style>