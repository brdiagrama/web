<template>
  <g class="relationship-line">
    <!-- Linha visual com curva bezier (conforme index.html anexado) -->
    <path 
      :d="pathData"
      class="connector"
      marker-start="url(#crowsFoot)"
      marker-end="url(#oneBar)"
      @mouseenter="onHover"
      @mouseleave="onUnhover"
    />
  </g>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  relationship: {
    type: Object,
    required: true
  },
  fromTable: {
    type: Object,
    required: true
  },
  toTable: {
    type: Object,
    required: true
  },
  tableWidth: {
    type: Number,
    default: 220
  },
  headerHeight: {
    type: Number,
    default: 35
  },
  rowHeight: {
    type: Number,
    default: 28
  }
})

// Estado do hover
const isHovered = ref(false)

// Funções de hover para trocar markers
const onHover = (event) => {
  const path = event.target
  path.setAttribute('marker-start', 'url(#crowsFootHover)')
  path.setAttribute('marker-end', 'url(#oneBarHover)')
  isHovered.value = true
}

const onUnhover = (event) => {
  const path = event.target
  path.setAttribute('marker-start', 'url(#crowsFoot)')
  path.setAttribute('marker-end', 'url(#oneBar)')
  isHovered.value = false
}

// Calcula offset Y da coluna dentro da tabela (já ordenada no App.vue)
const getColumnOffset = (table, columnName) => {
  if (!table || !table.columns) return 0
  
  // Busca pelo índice da coluna na lista ordenada (PK, FK, outros)
  const colIndex = table.columns.findIndex(col => col.name === columnName)
  if (colIndex === -1) return 0
  
  // Retorna Y no centro da linha da coluna
  return props.headerHeight + 20 + colIndex * props.rowHeight - 4
}

// Calcula o path da linha com curva bezier (lógica do index.html)
const pathData = computed(() => {
  const t1 = props.fromTable // Tabela com FK (crow's foot)
  const t2 = props.toTable   // Tabela com PK (one bar)
  
  if (!t1 || !t2) return ''
  
  // Coordenadas Y das colunas
  const y1 = t1.y + getColumnOffset(t1, props.relationship.fromCol)
  const y2 = t2.y + getColumnOffset(t2, props.relationship.toCol)
  
  let x1, x2, anchor1, anchor2
  
  // Lógica de posicionamento (mesma do index.html)
  // Se T1 está à esquerda de T2
  if (t1.x + props.tableWidth < t2.x - 50) {
    x1 = t1.x + props.tableWidth // Sai da direita de T1
    x2 = t2.x                     // Entra na esquerda de T2
    anchor1 = 1
    anchor2 = -1
  }
  // Se T1 está à direita de T2
  else if (t1.x > t2.x + props.tableWidth + 50) {
    x1 = t1.x                     // Sai da esquerda de T1
    x2 = t2.x + props.tableWidth  // Entra na direita de T2
    anchor1 = -1
    anchor2 = 1
  }
  // Caso de sobreposição ou vertical
  else {
    x1 = t1.x + props.tableWidth
    x2 = t2.x + props.tableWidth
    anchor1 = 1
    anchor2 = 1
  }
  
  // Curva de Bezier Cúbica
  const dist = Math.abs(x2 - x1) * 0.5
  const cp1x = x1 + (dist * anchor1) // Control point 1
  const cp2x = x2 + (dist * anchor2) // Control point 2
  
  return `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`
})

</script>

<style scoped>
/* Estilos conforme o index.html anexado */
.connector {
  fill: none;
  stroke: #7f8c8d;
  stroke-width: 2px;
  transition: stroke 0.2s;
  cursor: pointer;
}

.connector:hover {
  stroke: #2980b9;
  stroke-width: 3px;
}
</style>