<template>
  <g class="relationship-line" ref="relationshipGroup" :class="{ 'is-active': isActive }">
    <path
      :d="pathData"
      class="connector-hitbox"
      @mouseenter="onHover"
      @mouseleave="onUnhover"
    />

    <path
      :d="pathData"
      class="connector-visual"
      :marker-start="markerStart"
      :marker-end="markerEnd"
    />

    <path v-show="isActive" :d="pathData" class="connector-flow" />

    <!--Labels de Cardinalidade -->
    <text
      :x="labelPositions.start.x"
      :y="labelPositions.start.y"
      class="cardinality-label"
      :class="{ 'cardinality-hover': isActive }"
    >
      {{ cardinalityStart }}
    </text>

    <text
      :x="labelPositions.end.x"
      :y="labelPositions.end.y"
      class="cardinality-label"
      :class="{ 'cardinality-hover': isActive }"
    >
      {{ cardinalityEnd }}
    </text>
  </g>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  relationship: {
    type: Object,
    required: true,
  },
  fromTable: {
    type: Object,
    required: true,
  },
  toTable: {
    type: Object,
    required: true,
  },
  tableWidth: {
    type: Number,
    default: 220,
  },
  headerHeight: {
    type: Number,
    default: 35,
  },
  rowHeight: {
    type: Number,
    default: 28,
  },
  selectedTables: {
    type: Set,
    default: () => new Set(),
  },
});

// Estado do hover
const isHovered = ref(false);
const relationshipGroup = ref(null);
let hoverTimeout = null;

const isActive = computed(() => {
  return (
    isHovered.value ||
    props.selectedTables.has(props.relationship.fromTable) ||
    props.selectedTables.has(props.relationship.toTable)
  );
});


// Funções de hover para trocar markers
const onHover = () => {
  clearTimeout(hoverTimeout);
  isHovered.value = true;
  if (relationshipGroup.value?.parentNode) {
    relationshipGroup.value.parentNode.appendChild(relationshipGroup.value);
  }
};

const onUnhover = () => {
  // 3. Em vez de remover o estado imediatamente, define um pequeno atraso (ex: 50ms)
  hoverTimeout = setTimeout(() => {
    isHovered.value = false;
  }, 50); // 💡 Atraso de 50ms
};
// Computed properties para cardinalidade
// Determina markers baseado na cardinalidade
const markerStart = computed(() => {
  const cardinality = props.relationship.cardinality || "one-to-many";
  const base = getMarkerForCardinality(cardinality, "start");
  return isActive.value ? `url(#${base}Hover)` : `url(#${base})`;
});

const markerEnd = computed(() => {
  const cardinality = props.relationship.cardinality || "one-to-many";
  const base = getMarkerForCardinality(cardinality, "end");
  return isActive.value ? `url(#${base}Hover)` : `url(#${base})`;
});

// Mapeia cardinalidade para markers corretos
const getMarkerForCardinality = (cardinality, side) => {
  const map = {
    "one-to-one": { start: "oneBarStart", end: "oneBarEnd" },
    "one-to-many": { start: "oneOrMany", end: "oneBarEnd" },
    "many-to-many": { start: "crowsFoot", end: "" },
    "zero-to-one": { start: "zeroOrOne", end: "oneBarEnd" },
    "zero-to-many": { start: "zeroOrMany", end: "" },
  };
  return map[cardinality]?.[side] || "oneBar";
};

// Texto da cardinalidade (0..1, 1, N, *)
const cardinalityStart = computed(() => {
  const cardinality = props.relationship.cardinality || "one-to-many";
  const map = {
    "one-to-one": "1",
    "one-to-many": "N",
    "many-to-many": "N",
    "zero-to-one": "0..1",
    "zero-to-many": "*",
    "one-to-zero-or-one": "1",
  };
  return map[cardinality] || "N";
});

const cardinalityEnd = computed(() => {
  const cardinality = props.relationship.cardinality || "one-to-many";
  const map = {
    "one-to-one": "1",
    "one-to-many": "1",
    "many-to-many": "1",
    "zero-to-one": "1",
    "zero-to-many": "1",
    "one-to-zero-or-one": "0..1",
  };
  return map[cardinality] || "1";
});

// Calcula posições dos labels de cardinalidade
const labelPositions = computed(() => {
  const t1 = props.fromTable;
  const t2 = props.toTable;
  if (!t1 || !t2) return { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } };

  // Y do ponto de conexão (centro da coluna)
  const y1 = t1.y + getColumnOffset(t1, props.relationship.fromCol);
  const y2 = t2.y + getColumnOffset(t2, props.relationship.toCol);

  // ZONA DE CÁLCULO
  const t1Right = t1.x + props.tableWidth;
  const t2Right = t2.x + props.tableWidth;
  const t1Left = t1.x;
  const t2Left = t2.x;

  const STUB_LENGTH = 25; // Distância usada no roteador

  let startX, endX;
  const yOffset = -15; // 15px acima da linha

  // --- CENÁRIO 1: T1 à esquerda de T2 (Rotas em Z) ---
  if (t1Right + 40 < t2Left) {
    // Lado 'start' (FK) fica à direita da tabela, perto do ícone
    startX = t1Right + 4;

    // Lado 'end' (PK) fica à esquerda da tabela, perto do ícone
    endX = t2Left - 15;
  }

  // --- CENÁRIO 2: T1 à direita de T2 (Rotas em Z invertido) ---
  else if (t1Left > t2Right + 40) {
    const isWideMarker = props.relationship.cardinality === "zero-to-one";

    // Se for wide usa 45, senão usa o padrão 20
    const offset = isWideMarker ? 45 : 20;

    // Lado 'start' (FK) fica à esquerda da tabela com o recuo calculado
    startX = t1Left - offset;

    // Lado 'end' (PK) fica à direita da tabela
    endX = t2Right + 4;
  }

  // --- CENÁRIO 3: Sobreposição Vertical / Safe Zone (Rotas em C) ---
  else {
    // Usa a Zona Segura (safeX) calculada no pathData para posicionar o label
    const maxX = Math.max(t1Right, t2Right);
    const relationshipIndex = props.relationship.index || 0;
    const safeX = maxX + 30 + relationshipIndex * 20;

    // Labels ficam ao longo da linha vertical no ponto SafeX

    // Lado 'start' (FK) fica logo na saída da tabela (o stub inicial)
    startX = t1Right + 4;

    // Lado 'end' (PK) fica logo na entrada da tabela
    endX = t2Right + 4;
  }

  return {
    start: { x: startX, y: y1 + yOffset },
    end: { x: endX, y: y2 + yOffset },
  };
});

// Calcula offset Y da coluna dentro da tabela (já ordenada no App.vue)
const getColumnOffset = (table, columnName) => {
  if (!table || !table.columns) return 0;

  // Busca pelo índice da coluna na lista ordenada (PK, FK, outros)
  const colIndex = table.columns.findIndex((col) => col.name === columnName);
  if (colIndex === -1) return 0;

  // Retorna Y no centro da linha da coluna
  return props.headerHeight + 20 + colIndex * props.rowHeight - 4;
};

// Calcula o path da linha com curva bezier (lógica do index.html)
const pathData = computed(() => {
  const t1 = props.fromTable;
  const t2 = props.toTable;

  if (!t1 || !t2) return "";

  // Coordenadas Y das colunas
  const y1 = t1.y + getColumnOffset(t1, props.relationship.fromCol);
  const y2 = t2.y + getColumnOffset(t2, props.relationship.toCol);

  // Configuração do raio base
  const defaultRadius = 12;
  const deltaY = Math.abs(y2 - y1);
  const dirY = y1 < y2 ? 1 : -1;
  const r = Math.min(defaultRadius, deltaY / 2);

  // Limites das tabelas (Bounding Box)
  const t1Right = t1.x + props.tableWidth;
  const t2Right = t2.x + props.tableWidth;
  const t1Left = t1.x;
  const t2Left = t2.x;

  // Margem de segurança para a linha não colar na tabela
  const gap = 40;

  // --- LÓGICA DE ROTEAMENTO ---

  // CENÁRIO 1: T1 totalmente à esquerda de T2 (Normal)
  // Verifica se há espaço suficiente no meio para não colidir
  if (t1Right + gap < t2Left) {
    const x1 = t1Right;
    const x2 = t2Left;
    const midX = (x1 + x2) / 2;

    return `M ${x1} ${y1} 
            L ${midX - r} ${y1} 
            Q ${midX} ${y1} ${midX} ${y1 + r * dirY}
            L ${midX} ${y2 - r * dirY}
            Q ${midX} ${y2} ${midX + r} ${y2}
            L ${x2} ${y2}`;
  }

  // CENÁRIO 2: T1 totalmente à direita de T2 (Invertido)
  else if (t1Left > t2Right + gap) {
    const x1 = t1Left;
    const x2 = t2Right;
    const midX = (x1 + x2) / 2;

    return `M ${x1} ${y1} 
            L ${midX + r} ${y1} 
            Q ${midX} ${y1} ${midX} ${y1 + r * dirY}
            L ${midX} ${y2 - r * dirY}
            Q ${midX} ${y2} ${midX - r} ${y2}
            L ${x2} ${y2}`;
  }

  // CENÁRIO 3: Sobreposição Vertical (O SEU CASO ATUAL)
  // As tabelas estão uma em cima da outra ou muito próximas horizontalmente.
  // A linha deve sair pela direita de ambas e fazer um "C" ou colchete.
  else {
    const maxX = Math.max(t1Right, t2Right);
    // Zona segura à direita das tabelas
    const relationshipIndex = props.relationship.index || 0;
    const safeX = maxX + 30 + relationshipIndex * 20;

    const startX = t1Right;
    const endX = t2Right;

    return `M ${startX} ${y1}
            L ${safeX - r} ${y1}
            Q ${safeX} ${y1} ${safeX} ${y1 + r * dirY}
            L ${safeX} ${y2 - r * dirY}
            Q ${safeX} ${y2} ${safeX - r} ${y2}
            L ${endX} ${y2}`;
  }
});
</script>

<style scoped>
/* Garante que markers sejam visíveis fora dos bounds da linha */
:deep(svg) {
  overflow: visible;
}

.connector-hitbox {
  fill: none;
  stroke: transparent; /* Torna a linha invisível */
  stroke-width: 25px; /* 💡 Aumenta a área de hover para 15px */
  cursor: pointer;
}

/* 2. ESTILIZAÇÃO DA LINHA VISUAL */
.connector-visual {
  fill: none;
  stroke: #7f8c8d; /* Cor padrão */
  stroke-width: 2px; /* Largura fina e nítida */
  pointer-events: none; /* ESSENCIAL: Permite que o mouse pegue o elemento de baixo */
  transition: stroke 0.3s ease, stroke-width 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275),
    filter 0.3s ease;
}

/* 3. EFEITO DE HOVER (Quando o estado isHovered é TRUE) */
.connector-visual.connector-hover-active {
  stroke: #192747; /* Cor de destaque (Azul) */
  stroke-width: 3px; /* Fica um pouco mais grossa no hover */
}

.cardinality-label {
  font-size: 0px;
  fill: #7f8c8d;
  font-weight: 600;
  font-family: "Segoe UI", sans-serif;
  pointer-events: none;
  user-select: none;
  transition: fill 0.2s;
}

.cardinality-label.cardinality-hover {
  font-size: 20px;
  fill: #192747;
  font-weight: 700;
}

.relationship-line {
  /* 💡 ESSENCIAL: Transição no estado base */
  transition: transform 0.15s ease-out;
  /* Define o centro da transformação para a linha não "deslocar" */
  transform-origin: center center;
}

/* Quando o JS ativa o hover (isHovered = true) */
.relationship-line.is-active {
  /* 1. Efeito de Scale (Animação) */
}

/* 2. Destaque Visual no Hover (Triggered by .is-active no pai) */
.relationship-line.is-active .connector-visual {
  stroke: #192747;
  stroke-width: 2.5px;
  filter: drop-shadow(0 0 0px #19274780) drop-shadow(0 0 8px #19274740);
  color: #192747;
}
/* 3. Estilo dos Rótulos (Opcional: Fazer o rótulo "pular" junto) */
.cardinality-label {
  /* ... */
  transition: opacity 0.2s, transform 0.2s;
}

/* Animação Keyframe: Cria o movimento infinito */
@keyframes flowDash {
  to {
    stroke-dashoffset: 40px; /* O valor negativo puxa para frente (do start pro end) */
  }
}

.connector-flow {
  fill: none;
  stroke: #4facfe;
  stroke-width: 2px;
  pointer-events: none;
  
  stroke-dasharray: 3 10; 
  
  animation: flowDash 2.5s linear infinite;

  opacity: 0.8;
}

/* Ajuste fino para quando estiver ativo */
.relationship-line.is-active .connector-visual {
  stroke: #192747; 
  stroke-width: 3px; 
  filter: drop-shadow(0 0 2px rgba(25, 39, 71, 0.5));
}
</style>
