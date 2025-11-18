<template>
  <g class="relationship-line">
    <!-- Linha visual com curva bezier (conforme index.html anexado) -->
    <path 
      :d="pathData"
      class="connector"
      :marker-start="markerStart"
      :marker-end="markerEnd"
      @mouseenter="onHover"
      @mouseleave="onUnhover"
    />
     <!--Labels de Cardinalidade -->
    <text 
      :x="labelPositions.start.x" 
      :y="labelPositions.start.y" 
      class="cardinality-label"
      :class="{ 'cardinality-hover': isHovered }"
    >
      {{ cardinalityStart }}
    </text>
    
    <text 
      :x="labelPositions.end.x" 
      :y="labelPositions.end.y" 
      class="cardinality-label"
      :class="{ 'cardinality-hover': isHovered }"
    >
      {{ cardinalityEnd }}
    </text>

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
  isHovered.value = true
  // Markers são atualizados automaticamente via computed property
}
const onUnhover = (event) => {
  isHovered.value = false
  // Markers são atualizados automaticamente via computed property
}
// Computed properties para cardinalidade

// Determina markers baseado na cardinalidade
const markerStart = computed(() => {
  const cardinality = props.relationship.cardinality || 'one-to-many'
  const base = getMarkerForCardinality(cardinality, 'start')
  return isHovered.value ? `url(#${base}Hover)` : `url(#${base})`
})

const markerEnd = computed(() => {
  const cardinality = props.relationship.cardinality || 'one-to-many'
  const base = getMarkerForCardinality(cardinality, 'end')
  return isHovered.value ? `url(#${base}Hover)` : `url(#${base})`
})

// Mapeia cardinalidade para markers corretos
const getMarkerForCardinality = (cardinality, side) => {
  const map = {
    'one-to-one': { start: 'oneBar', end: 'oneBar' },
    'one-to-many': { start: 'crowsFoot', end: 'oneBar' },
    'many-to-many': { start: 'crowsFoot', end: 'crowsFoot' },
    'zero-to-one': { start: 'zeroOrOne', end: 'exactlyOne' },
    'zero-to-many': { start: 'zeroOrMany', end: 'exactlyOne' },
    'one-to-zero-or-one': { start: 'oneBar', end: 'zeroOrOne' },
  }
  return map[cardinality]?.[side] || 'crowsFoot'
}

// Texto da cardinalidade (0..1, 1, N, *)
const cardinalityStart = computed(() => {
  const cardinality = props.relationship.cardinality || 'one-to-many'
  const map = {
    'one-to-one': '1',
    'one-to-many': 'N',
    'many-to-many': 'N',
    'zero-to-one': '0..1',
    'zero-to-many': '*',
    'one-to-zero-or-one': '1',
  }
  return map[cardinality] || 'N'
})

const cardinalityEnd = computed(() => {
  const cardinality = props.relationship.cardinality || 'one-to-many'
  const map = {
    'one-to-one': '1',
    'one-to-many': '1',
    'many-to-many': 'N',
    'zero-to-one': '1',
    'zero-to-many': '1',
    'one-to-zero-or-one': '0..1',
  }
  return map[cardinality] || '1'
})

// Calcula posições dos labels de cardinalidade
const labelPositions = computed(() => {
  const t1 = props.fromTable
  const t2 = props.toTable
  
  if (!t1 || !t2) return { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } }
  
  const y1 = t1.y + getColumnOffset(t1, props.relationship.fromCol)
  const y2 = t2.y + getColumnOffset(t2, props.relationship.toCol)
  
  let startX, endX
  
  // Mesma lógica de posicionamento do path
  if (t1.x + props.tableWidth < t2.x - 50) {
    startX = t1.x + props.tableWidth + 10
    endX = t2.x - 25
  } else if (t1.x > t2.x + props.tableWidth + 50) {
    startX = t1.x - 25
    endX = t2.x + props.tableWidth + 10
  } else {
    startX = t1.x + props.tableWidth + 10
    endX = t2.x + props.tableWidth + 10
  }
  
  return {
    start: { x: startX, y: y1 - 8 }, // 8px acima da linha
    end: { x: endX, y: y2 - 8 }
  }
})

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

/* Garante que markers sejam visíveis fora dos bounds da linha */
:deep(svg) {
  overflow: visible;
}

/* Estilos conforme o index.html anexado */
.connector {
  fill: none;
  stroke: #7f8c8d;
  stroke-width: 2px;
  transition: stroke 0.2s;
  cursor: pointer;
}
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

/* Estilos para cardinalidade */
.cardinality-label {
  font-size: 11px;
  fill: #7f8c8d;
  font-weight: 600;
  font-family: 'Segoe UI', sans-serif;
  pointer-events: none;
  user-select: none;
  transition: fill 0.2s;
}

.cardinality-label.cardinality-hover {
  fill: #2980b9;
  font-weight: 700;
}
</style>