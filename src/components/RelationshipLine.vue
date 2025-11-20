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
  const t1 = props.fromTable
  const t2 = props.toTable
  
  if (!t1 || !t2) return ''

  // Coordenadas Y das colunas
  const y1 = t1.y + getColumnOffset(t1, props.relationship.fromCol)
  const y2 = t2.y + getColumnOffset(t2, props.relationship.toCol)
  
  // Configuração do raio base
  const defaultRadius = 12 
  const deltaY = Math.abs(y2 - y1)
  const dirY = y1 < y2 ? 1 : -1
  const r = Math.min(defaultRadius, deltaY / 2)

  // Limites das tabelas (Bounding Box)
  const t1Right = t1.x + props.tableWidth
  const t2Right = t2.x + props.tableWidth
  const t1Left = t1.x
  const t2Left = t2.x

  // Margem de segurança para a linha não colar na tabela
  const gap = 40 

  // --- LÓGICA DE ROTEAMENTO ---

  // CENÁRIO 1: T1 totalmente à esquerda de T2 (Normal)
  // Verifica se há espaço suficiente no meio para não colidir
  if (t1Right + gap < t2Left) {
    const x1 = t1Right
    const x2 = t2Left
    const midX = (x1 + x2) / 2
    
    return `M ${x1} ${y1} 
            L ${midX - r} ${y1} 
            Q ${midX} ${y1} ${midX} ${y1 + (r * dirY)}
            L ${midX} ${y2 - (r * dirY)}
            Q ${midX} ${y2} ${midX + r} ${y2}
            L ${x2} ${y2}`
  }
  
  // CENÁRIO 2: T1 totalmente à direita de T2 (Invertido)
  else if (t1Left > t2Right + gap) {
    const x1 = t1Left
    const x2 = t2Right
    const midX = (x1 + x2) / 2
    
    return `M ${x1} ${y1} 
            L ${midX + r} ${y1} 
            Q ${midX} ${y1} ${midX} ${y1 + (r * dirY)}
            L ${midX} ${y2 - (r * dirY)}
            Q ${midX} ${y2} ${midX - r} ${y2}
            L ${x2} ${y2}`
  }
  
  // CENÁRIO 3: Sobreposição Vertical (O SEU CASO ATUAL)
  // As tabelas estão uma em cima da outra ou muito próximas horizontalmente.
  // A linha deve sair pela direita de ambas e fazer um "C" ou colchete.
else {
    const maxX = Math.max(t1Right, t2Right)
    // Zona segura à direita das tabelas
    const relationshipIndex = props.relationship.index || 0
    const safeX = maxX + 30 + (relationshipIndex * 20)

    const startX = t1Right
    const endX = t2Right

    return `M ${startX} ${y1}
            L ${safeX - r} ${y1}
            Q ${safeX} ${y1} ${safeX} ${y1 + (r * dirY)}
            L ${safeX} ${y2 - (r * dirY)}
            Q ${safeX} ${y2} ${safeX - r} ${y2}
            L ${endX} ${y2}`
  }
})


</script>

<style scoped>
/* Garante que markers sejam visíveis fora dos bounds da linha */
:deep(svg) {
  overflow: visible;
}

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