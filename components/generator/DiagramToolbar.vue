<template>
    <div class="diagram-toolbar" :class="isCanvasDark ? 'toolbar-dark' : 'toolbar-light'">
        <!-- Reset Zoom -->
        <IconButton
            tooltip="Ajustar zoom (100%)"
            tooltip-location="top"
            :theme="isCanvasDark ? 'dark' : 'light'"
            aria-label="Ajustar zoom para 100%"
            @click="resetZoom"
        >
            <Maximize2 :size="18" />
        </IconButton>
        
        <!-- Botão de Selecionar Várias Tabelas (Área de Seleção) -->
        <IconButton
            tooltip="Selecionar área (selecionar várias tabelas)"
            tooltip-location="top"
            :theme="isCanvasDark ? 'dark' : 'light'"
            :active="store.isSelectMode"
            aria-label="Selecionar várias tabelas"
            @click="toggleSelectMode"
        >
            <BoxSelect :size="18" />
        </IconButton>

        <!-- Botão do Grid -->
        <IconButton
            tooltip="Mostrar ou ocultar grade"
            tooltip-location="top"
            :theme="isCanvasDark ? 'dark' : 'light'"
            :active="store.isGridVisible"
            aria-label="Mostrar ou ocultar grade"
            @click="toggleGrid"
        >
            <Grid :size="18" />
        </IconButton>

        <!-- Botão de Auto-organizar / Auto-alinhar Layout -->
        <IconButton
            tooltip="Organizar diagrama automaticamente"
            tooltip-location="top"
            :theme="isCanvasDark ? 'dark' : 'light'"
            aria-label="Organizar diagrama automaticamente"
            @click="handleAutoAlign"
        >
            <LayoutGrid :size="18" />
        </IconButton>
           
        <div class="zoom-control">
            <IconButton
                tooltip="Diminuir zoom"
                tooltip-location="top"
                :theme="isCanvasDark ? 'dark' : 'light'"
                aria-label="Diminuir zoom"
                size="small"
                @click="decreaseZoom"
            >
                <Minus :size="16" />
            </IconButton>

            <span class="zoom-label">{{ Math.round(zoomScale) }}%</span>

            <IconButton
                tooltip="Aumentar zoom"
                tooltip-location="top"
                :theme="isCanvasDark ? 'dark' : 'light'"
                aria-label="Aumentar zoom"
                size="small"
                @click="increaseZoom"
            >
                <Plus :size="16" />
            </IconButton>
        </div>

        <div class="toolbar-divider" aria-hidden="true"></div>

        <!-- Botão de Tema do Diagrama -->
        <IconButton
            :tooltip="isCanvasDark ? 'Mudar diagrama para tema claro' : 'Mudar diagrama para tema escuro'"
            tooltip-location="top"
            :theme="isCanvasDark ? 'dark' : 'light'"
            :aria-label="isCanvasDark ? 'Mudar diagrama para tema claro' : 'Mudar diagrama para tema escuro'"
            @click="(e) => toggleCanvasTheme(e)"
        >
            <Sun v-if="isCanvasDark" :size="18" />
            <Moon v-else :size="18" />
        </IconButton>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { Maximize2, BoxSelect, Grid, LayoutGrid, Minus, Plus, Sun, Moon } from 'lucide-vue-next';
import { useDiagramStore } from '@/stores/diagram';
import { useGeneratorTheme } from '@/composables/useGeneratorTheme';
import IconButton from '@/components/shared/IconButton.vue';

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

const toggleSelectMode = () => {
    store.toggleSelectMode();
};

const handleAutoAlign = () => {
    store.autoAlignLayout();
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

@media (max-width: 768px) {
    .diagram-toolbar {
        bottom: calc(80px + env(safe-area-inset-bottom, 20px));
        gap: 4px;
        padding: 6px;
    }
    .zoom-label { display: none; }
}
</style>
