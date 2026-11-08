<template>
    <div class="diagram-toolbar" :class="isCanvasDark ? 'toolbar-dark' : 'toolbar-light'">
        <!-- Reset Zoom -->
        <v-tooltip text="Ajustar zoom (100%)" location="top" :theme="isCanvasDark ? 'dark' : 'light'">
            <template #activator="{ props: tooltipProps }">
                <button 
                    v-bind="tooltipProps"
                    @click="resetZoom" 
                    class="toolbar-btn reset-zoom-btn" 
                    aria-label="Ajustar zoom para 100%"
                >
                    <Maximize2 :size="18" />
                </button>
            </template>
        </v-tooltip>
        
        <!-- Botão de Pan Mode -->
        <v-tooltip text="Modo de navegação (arrastar tela)" location="top" :theme="isCanvasDark ? 'dark' : 'light'">
            <template #activator="{ props: tooltipProps }">
                <button 
                    v-bind="tooltipProps"
                    @click="togglePanMode" 
                    :class="['toolbar-btn', 'pan-mode-btn', { active: store.isPanMode }]" 
                    aria-label="Modo de navegação"
                >
                    <Hand :size="18" />
                </button>
            </template>
        </v-tooltip>

        <!-- Botão do Grid -->
        <v-tooltip text="Mostrar ou ocultar grade" location="top" :theme="isCanvasDark ? 'dark' : 'light'">
            <template #activator="{ props: tooltipProps }">
                <button 
                    v-bind="tooltipProps"
                    @click="toggleGrid" 
                    :class="['toolbar-btn', 'grid-btn', { active: store.isGridVisible }]"
                    aria-label="Mostrar ou ocultar grade"
                >
                    <Grid :size="18" />
                </button>
            </template>
        </v-tooltip>
           
        <div class="zoom-control">
            <v-tooltip text="Diminuir zoom" location="top" :theme="isCanvasDark ? 'dark' : 'light'">
                <template #activator="{ props: tooltipProps }">
                    <button 
                        v-bind="tooltipProps"
                        @click="decreaseZoom" 
                        class="toolbar-btn zoom-btn" 
                        aria-label="Diminuir zoom"
                    >
                        <Minus :size="16" />
                    </button>
                </template>
            </v-tooltip>

            <span class="zoom-label">{{ Math.round(zoomScale) }}%</span>

            <v-tooltip text="Aumentar zoom" location="top" :theme="isCanvasDark ? 'dark' : 'light'">
                <template #activator="{ props: tooltipProps }">
                    <button 
                        v-bind="tooltipProps"
                        @click="increaseZoom" 
                        class="toolbar-btn zoom-btn" 
                        aria-label="Aumentar zoom"
                    >
                        <Plus :size="16" />
                    </button>
                </template>
            </v-tooltip>
        </div>

        <div class="toolbar-divider" aria-hidden="true"></div>

        <!-- Botão de Tema do Diagrama -->
        <v-tooltip :text="isCanvasDark ? 'Mudar diagrama para tema claro' : 'Mudar diagrama para tema escuro'" location="top" :theme="isCanvasDark ? 'dark' : 'light'">
            <template #activator="{ props: tooltipProps }">
                <button
                    v-bind="tooltipProps"
                    @click="(e) => toggleCanvasTheme(e)"
                    class="toolbar-btn theme-btn"
                    :aria-label="isCanvasDark ? 'Mudar diagrama para tema claro' : 'Mudar diagrama para tema escuro'"
                >
                    <Sun v-if="isCanvasDark" :size="18" />
                    <Moon v-else :size="18" />
                </button>
            </template>
        </v-tooltip>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { Maximize2, Hand, Grid, Minus, Plus, Sun, Moon } from 'lucide-vue-next';
import { useDiagramStore } from '@/stores/diagram';
import { useGeneratorTheme } from '@/composables/useGeneratorTheme';

const props = defineProps({
    diagramRef: {
        type: Object,
        required: true,
    }
});

const store = useDiagramStore();
const { isCanvasDark, toggleCanvasTheme } = useGeneratorTheme();

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
        newZoom = Math.max(5, current - 1);
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
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 6px;
    border-radius: 12px;
    border: none;
    display: flex;
    gap: 4px;
    align-items: center;
    transition: background-color 0.2s ease, box-shadow 0.2s ease;
    background: var(--clr-bg-surface);
    box-shadow: var(--clr-shadow-floating);
    z-index: 25;
}

.toolbar-divider {
    width: 1px;
    height: 18px;
    background-color: var(--clr-border, rgba(0, 0, 0, 0.08));
    margin: 0 2px;
    opacity: 0.6;
}

.toolbar-dark .toolbar-divider {
    background-color: rgba(255, 255, 255, 0.1);
}

.toolbar-btn {
    cursor: pointer;
    width: 34px;
    height: 34px;
    min-width: 34px;
    min-height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--clr-text-muted, #5E6368);
    transition: background-color 0.15s ease, color 0.15s ease;
}

.toolbar-dark .toolbar-btn {
    color: #9AA0A6;
}

.toolbar-light .toolbar-btn {
    color: #5E6368;
}

.toolbar-dark .toolbar-btn:hover {
    background-color: rgba(26, 186, 156, 0.15);
    color: #1aba9c;
}

.toolbar-light .toolbar-btn:hover {
    background-color: rgba(26, 186, 156, 0.12);
    color: #1aba9c;
}

.zoom-control {
    display: flex;
    align-items: center;
    gap: 2px;
    background: transparent;
    border: none;
    padding: 0;
}

.zoom-label {
    min-width: 40px;
    text-align: center;
    font-weight: 600;
    font-size: 12px;
    color: var(--clr-text, #1F1F1F);
    font-family: inherit;
    user-select: none;
}

.toolbar-dark .zoom-label {
    color: #F0F0F0;
}

.toolbar-light .zoom-label {
    color: #1F1F1F;
}

.grid-btn.active,
.pan-mode-btn.active {
    background-color: rgba(26, 186, 156, 0.15) !important;
    color: #1aba9c !important;
}

@media (max-width: 768px) {
    .diagram-toolbar {
        bottom: calc(80px + env(safe-area-inset-bottom, 20px));
        gap: 4px;
        padding: 6px;
    }
    .toolbar-btn {
        width: 40px;
        height: 40px;
        min-width: 40px;
        min-height: 40px;
    }
    .zoom-label { display: none; }
}
</style>