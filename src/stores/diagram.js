import { defineStore } from 'pinia';

/**
 * Store Pinia para gerenciar o estado do diagrama (zoom e posição da panorâmica).
 */
export const useDiagramStore = defineStore('diagram', {
    state: () => ({
        // Nível de zoom inicial (1.0 = 100%)
        zoom: 1.0, 
        // Posição da panorâmica inicial (pan)
        pan: { x: 0, y: 0 }, 
        // NOVO: Estado do grid
        isGridVisible: false,
        gridSize: 20, // Tamanho da grade em pixels (espaçamento entre pontos)
        
        // CTM (Current Transformation Matrix) e outros dados complexos podem ser adicionados aqui
    }),
    actions: {
        /**
         * Atualiza o nível de zoom.
         * @param {number} newZoom - O novo fator de zoom (ex: 0.5, 1.0, 2.0).
         */
        updateZoom(newZoom) {
            this.zoom = newZoom;
        },
        
        /**
         * Atualiza a posição da panorâmica.
         * @param {{x: number, y: number}} newPan - A nova posição X e Y do pan.
         */
        updatePan(newPan) {
            this.pan = newPan;
        },
        
        /**
         * Carrega o estado salvo de zoom e pan (útil ao iniciar o componente).
         * @param {number} zoom - O zoom a ser carregado.
         * @param {{x: number, y: number}} pan - O pan a ser carregado.
         */
        loadState({ zoom, pan }) {
            this.zoom = zoom;
            this.pan = pan;
        },
        
        /**
         * Toggle do grid
         */
        toggleGrid() {
            this.isGridVisible = !this.isGridVisible;
        },
        
        /**
         * Configurar tamanho do grid
         * @param {number} size - O novo tamanho da grade em pixels
         */
        setGridSize(size) {
            this.gridSize = size;
        }
    },
});
