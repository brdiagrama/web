<template>
  <g class="relationship-line"
  :class="{ highlighted: highlight }"
   @mouseenter="highlight = true"
   @mouseleave="highlight = false">
    <!-- Hitbox invisível para interação -->
    <path class="line-hitbox" :d="pathData" />
    
    <!-- Linha visual -->
    <path 
      class="line-visual" 
      :d="pathData"
      :class="{ highlighted: highlight }"
      :marker-end="markerType"
    />
    
    <!-- Pontos de controle editáveis -->
    <g class="control-points">
  <circle 
    v-for="(vertex, index) in vertices" 
    :key="index"
    :cx="vertex.x" 
    :cy="vertex.y" 
    r="4"
    class="control-point"
    :class="{ 
      dragging: dragIndex === index,
      'point-vertical': vertexTypes[index] === 'vertical',
      'point-horizontal': vertexTypes[index] === 'horizontal'
    }"
    @mousedown="startDrag($event, index)"
    @dblclick="resetToAuto"
  />
</g>
    
    <!-- Label de cardinalidade -->
   <!-- Cardinalidade na origem (lado FK) -->
<text 
  :x="labelPosition.from.x" 
  :y="labelPosition.from.y" 
  class="cardinality-label"
  :text-anchor="bestAnchors?.from?.side === 'right' ? 'start' : 'end'"
>
  N
</text>

<!-- Cardinalidade no destino (lado PK) -->
<text 
  :x="labelPosition.to.x" 
  :y="labelPosition.to.y" 
  class="cardinality-label"
  :text-anchor="bestAnchors?.to?.side === 'right' ? 'start' : 'end'"
>
  1
</text>
  </g>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'

const emit = defineEmits(['update'])

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
    default: 200
  },
  headerHeight: {
    type: Number,
    default: 30
  },
  rowHeight: {
    type: Number,
    default: 22
  }
})

// Estado do componente
const highlight = ref(false)
const dragIndex = ref(null)
const dragOffset = reactive({ x: 0, y: 0 })

// Constantes
const GRID_SIZE = 20

// Utilitários
const snapToGrid = (value) => {
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}

const calculateDistance = (point1, point2) => {
  return Math.sqrt(
    Math.pow(point1.x - point2.x, 2) + 
    Math.pow(point1.y - point2.y, 2)
  )
}

// Calcula pontos de ancoragem para uma tabela
const getTableAnchors = (table) => {
  if (!table) return []
  
  const tableHeight = props.headerHeight + table.columns.length * props.rowHeight + 10
  
  return [
    // Ancoragem esquerda central
    { x: table.x, y: table.y + tableHeight / 2, side: 'left' },
    // Ancoragem direita central
    { x: table.x + props.tableWidth, y: table.y + tableHeight / 2, side: 'right' },
    // Ancoragem por campo (esquerda)
    ...table.columns.map((col, index) => ({
      x: table.x, 
      y: table.y + props.headerHeight + (index + 0.5) * props.rowHeight,
      side: 'left',
      column: col.name
    })),
    // Ancoragem por campo (direita)
    ...table.columns.map((col, index) => ({
      x: table.x + props.tableWidth, 
      y: table.y + props.headerHeight + (index + 0.5) * props.rowHeight,
      side: 'right',
      column: col.name  
    }))
  ]
}

// Encontra melhor par de âncoras
const findBestAnchors = (fromAnchors, toAnchors) => {
  if (!fromAnchors.length || !toAnchors.length) return null
  
  let bestDistance = Infinity
  let bestPair = null
  
  for (const fromAnchor of fromAnchors) {
    for (const toAnchor of toAnchors) {
      const distance = calculateDistance(fromAnchor, toAnchor)
      
      if (distance < bestDistance) {
        bestDistance = distance
        bestPair = { from: fromAnchor, to: toAnchor }
      }
    }
  }
  
  return bestPair
}

// Gera vértices automáticos
const generateAutoVertices = (fromAnchor, toAnchor) => {
  if (!fromAnchor || !toAnchor) return []
  
  const spacing = 60 // Espaçamento mínimo das tabelas
  const minVerticalGap = 40 // Espaçamento mínimo vertical
  
  // Calcula posições ortogonais
  const fromX = fromAnchor.x
  const fromY = fromAnchor.y
  const toX = toAnchor.x
  const toY = toAnchor.y
  
  // Ponto 1: Saída horizontal da tabela origem
  const p1X = fromAnchor.side === 'right' ? fromX + spacing : fromX - spacing
  const p1Y = fromY
  
  // Ponto 2: Mudança para vertical (no meio do caminho)
  const p2X = p1X
  const p2Y = (fromY + toY) / 2
  
  // Ponto 3: Mudança para horizontal (alinhado com destino)
  const p3X = toAnchor.side === 'right' ? toX - spacing : toX + spacing
  const p3Y = p2Y
  
  // Ponto 4: Entrada vertical na tabela destino
  const p4X = p3X
  const p4Y = toY
  
  return [
    { x: p1X, y: p1Y, type: 'vertical' },
    { x: p2X, y: p2Y, type: 'horizontal' }, 
    { x: p3X, y: p3Y, type: 'vertical' },
    { x: p4X, y: p4Y, type: 'horizontal' }
  ]
}

// Computed properties
const fromAnchors = computed(() => getTableAnchors(props.fromTable))
const toAnchors = computed(() => getTableAnchors(props.toTable))

const bestAnchors = computed(() => {
  return findBestAnchors(fromAnchors.value, toAnchors.value)
})

const vertices = computed(() => {
  if (!props.relationship || !bestAnchors.value) return []
  
  // Se tem vértices customizados e não está em modo auto, usa eles
  if (props.relationship.vertices && props.relationship.vertices.length > 0 && !props.relationship.auto) {
    return props.relationship.vertices
  }
  
  // Senão, gera vértices automáticos
  return generateAutoVertices(bestAnchors.value.from, bestAnchors.value.to)
})

const pathData = computed(() => {
  if (!bestAnchors.value || !vertices.value.length) return ''
  
  const start = bestAnchors.value.from
  const end = bestAnchors.value.to
  const points = vertices.value
  
  let path = `M ${start.x},${start.y}`
  
  for (const point of points) {
    path += ` L ${point.x},${point.y}`
  }
  
  path += ` L ${end.x},${end.y}`
  
  return path
})

const markerType = computed(() => {
  const cardinality = props.relationship?.cardinality || 'one-to-many'
  
  switch (cardinality) {
    case 'one-to-one':
      return 'url(#one-to-one-marker)'
    case 'one-to-many':
      return 'url(#one-to-many-marker)'
    case 'many-to-many':
      return 'url(#many-to-many-marker)'
    default:
      return 'url(#arrowhead)'
  }
})

const labelPosition = computed(() => {
  if (!bestAnchors.value) {
    return { x: 0, y: 0 }
  }
  
  const fromTable = props.fromTable
  const toTable = props.toTable
  const fromAnchor = bestAnchors.value.from
  const toAnchor = bestAnchors.value.to
  
  // Posicionar sempre fora das tabelas, nunca sobreposto
  const spacing = 15 // Distância mínima da tabela
  
  return {
    // Para tabela origem (lado FK)
    from: {
      x: fromAnchor.side === 'right' ? fromTable.x + props.tableWidth + spacing : fromTable.x - spacing,
      y: fromAnchor.y
    },
    // Para tabela destino (lado PK) 
    to: {
      x: toAnchor.side === 'right' ? toTable.x + props.tableWidth + spacing : toTable.x - spacing,
      y: toAnchor.y
    }
  }
})

const cardinalityText = computed(() => {
  const cardinality = props.relationship?.cardinality || 'one-to-many'
  
  switch (cardinality) {
    case 'one-to-one':
      return '1:1'
    case 'one-to-many':
      return '1:N'
    case 'many-to-many':
      return 'N:N'
    default:
      return ''
  }
})
// Classifica cada vértice como horizontal ou vertical
const vertexTypes = computed(() => {
  if (!vertices.value.length) return []
  
  return vertices.value.map((vertex, index) => {
    // Primeiro ponto: sempre vertical (sai horizontal da tabela)
    if (index === 0) return 'vertical'
    // Alterna: vertical → horizontal → vertical → horizontal
    return index % 2 === 0 ? 'vertical' : 'horizontal'
  })
})
// Funções de interação
const startDrag = (event, index) => {
  event.preventDefault()
  dragIndex.value = index
  
  // Calcula offset inicial
  const rect = event.target.ownerSVGElement.getBoundingClientRect()
  const svgX = event.clientX - rect.left
  const svgY = event.clientY - rect.top
  
  dragOffset.x = svgX - vertices.value[index].x
  dragOffset.y = svgY - vertices.value[index].y
  
  // Adiciona listeners globais
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', endDrag)
  
  // Desativa modo automático
  if (props.relationship.auto) {
    emit('update', props.relationship.id, { auto: false })
  }
}

const handleDrag = (event) => {
  if (dragIndex.value === null) return
  
  const rect = event.target.ownerSVGElement?.getBoundingClientRect()
  if (!rect) return
  
  const svgX = event.clientX - rect.left
  const svgY = event.clientY - rect.top
  
  // Determina o tipo do ponto sendo arrastado
  const pointType = vertexTypes.value[dragIndex.value]
  const currentVertex = vertices.value[dragIndex.value]
  
  let newX = currentVertex.x
  let newY = currentVertex.y
  
  // Aplica restrição baseada no tipo
  if (pointType === 'vertical') {
    // Só permite movimento vertical (Y)
    newY = snapToGrid(svgY - dragOffset.y)
    // X permanece fixo
  } else if (pointType === 'horizontal') {
    // Só permite movimento horizontal (X) 
    newX = snapToGrid(svgX - dragOffset.x)
    // Y permanece fixo
  }
  
  // Atualiza vértice com restrições
  const newVertices = [...vertices.value]
  newVertices[dragIndex.value] = { x: newX, y: newY }
  
  emit('update', props.relationship.id, { vertices: newVertices })
}
const endDrag = () => {
  dragIndex.value = null
  dragOffset.x = 0
  dragOffset.y = 0
  
  // Remove listeners globais
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', endDrag)
}

const resetToAuto = () => {
  emit('update', props.relationship.id, { 
    auto: true, 
    vertices: [] 
  })
}
// Valida e corrige posições ortogonais
const validateOrtogonalStructure = (vertices) => {
  if (!vertices.length) return vertices
  
  const validated = [...vertices]
  
  for (let i = 0; i < validated.length; i++) {
    const type = vertexTypes.value[i]
    
    if (type === 'vertical' && i > 0) {
      // Pontos verticais devem ter X igual ao ponto anterior
      validated[i].x = validated[i - 1].x
    } else if (type === 'horizontal' && i > 0) {
      // Pontos horizontais devem ter Y igual ao ponto anterior  
      validated[i].y = validated[i - 1].y
    }
  }
  
  return validated
}
// Inicialização
onMounted(() => {
  // Se não tem vértices, força modo automático
  if (!props.relationship.vertices || props.relationship.vertices.length === 0) {
    emit('update', props.relationship.id, { auto: true })
  }
})
</script>

<style scoped>
.relationship-line {
  cursor: pointer;
}

.line-hitbox {
  fill: none;
  stroke: transparent;
  stroke-width: 29px;  /* Aumentado para melhor interatividade */
}

.line-visual {
  fill: none;
  stroke: var(--ref-color, #d3d3d3);
  stroke-width: 2px;
  stroke-linejoin: round;  /* DB-Diagram específico */
  stroke-linecap: butt;    /* DB-Diagram específico */
  transition: stroke 0.2s ease;
}

.line-visual.highlighted {
  stroke: var(--ref-highlight-color, #619bcc);
}

.control-points {
  display: none;  /* Invisível por padrão */
}

.relationship-line.highlighted .control-points {
  display: block;  /* Só aparece no highlight */
}

.control-point {
  fill: var(--control-point-color, #000000);
  stroke: var(--control-point-stroke, #619bcc);
  stroke-width: 1px;
  cursor: move;
  r: 5;  /* Tamanho fixo como no DB-Diagram */
  transition: r 0.2s ease;
}

.control-point:hover,
.control-point.dragging {
  r: 6;
  stroke-width: 2px;
}

.control-point.dragging {
  fill: var(--ref-highlight-color, #619bcc);
}

.cardinality-label {
  font-size: 11px;
  fill: #6f6f6f;
  font-weight: 400;
  pointer-events: none;
  font-family: 'Maven Pro', sans-serif;
  dominant-baseline: middle; /* Centraliza verticalmente */
}
/* Pontos com restrição de movimento */
.point-vertical {
  cursor: ns-resize; /* Cursor só vertical */
}

.point-horizontal {
  cursor: ew-resize; /* Cursor só horizontal */
}

.point-vertical:hover {
  fill: #4CAF50; /* Verde para vertical */
}

.point-horizontal:hover {
  fill: #2196F3; /* Azul para horizontal */
}

/* Feedback visual melhorado */
.control-point {
  transition: fill 0.2s ease;
}
</style>