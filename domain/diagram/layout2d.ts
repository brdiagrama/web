import type { DatabaseSchema, Relationship } from '../models/databaseSchema';
import { getMarkerForCardinality } from './pathRouter';
import { calculateTableWidth, calculateTableHeight } from './tableDimensions';

export interface EdgeOffset {
  sourceOffsetY: number;
  targetOffsetY: number;
  routeOffsetIndex?: number;
}

export interface DiagramLayoutResult {
  positions: Record<string, { x: number; y: number }>;
  edgeOffsets: Record<string, EdgeOffset>;
}

export function generateLayout(
  schema: DatabaseSchema,
  existingPositions?: Record<string, { x: number; y: number }>
): DiagramLayoutResult {
  const positions: Record<string, { x: number; y: number }> = {};
  const tables = schema.tables || {};
  const tableNames = Object.keys(tables);
  const totalTables = tableNames.length;

  if (totalTables === 0) {
    return { positions, edgeOffsets: {} };
  }

  // Se já temos posições existentes para todas as tabelas (carga normal), mantemos
  const hasAllExisting = existingPositions && tableNames.every(name => !!existingPositions[name]);
  if (hasAllExisting) {
    for (const name of tableNames) {
      positions[name] = { ...existingPositions[name] };
    }
    return { positions, edgeOffsets: calculateEdgeOffsets(schema.relationships || []) };
  }

  // --- Layout em Camadas Inteligente baseado no Grafo de Relacionamentos (DAG / Sugiyama style) ---
  const relationships = schema.relationships || [];
  
  // Grau de saída/entrada para identificar tabelas base (referenciadas) vs filhas (com FK)
  const inDegree: Record<string, number> = {};
  const adjacency: Record<string, string[]> = {};
  tableNames.forEach(name => {
    inDegree[name] = 0;
    adjacency[name] = [];
  });

  relationships.forEach(rel => {
    if (tables[rel.fromTable] && tables[rel.toTable] && rel.fromTable !== rel.toTable) {
      // fromTable aponta para toTable (fromTable tem FK que referencia toTable PK)
      // Queremos toTable na esquerda/topo (nível 0) e fromTable em camadas posteriores
      adjacency[rel.toTable].push(rel.fromTable);
      inDegree[rel.fromTable] = (inDegree[rel.fromTable] || 0) + 1;
    }
  });

  // Atribuir nível (camada) para cada tabela
  const levels: Record<string, number> = {};
  const queue: string[] = [];

  // Tabelas raiz (sem FKs de entrada) ou isoladas começam no nível 0
  tableNames.forEach(name => {
    if (inDegree[name] === 0) {
      levels[name] = 0;
      queue.push(name);
    }
  });

  // Se houver ciclos ou todas tiverem inDegree > 0, pega a de menor inDegree
  if (queue.length === 0) {
    const sortedByInDegree = [...tableNames].sort((a, b) => inDegree[a] - inDegree[b]);
    const root = sortedByInDegree[0];
    levels[root] = 0;
    queue.push(root);
  }

  // BFS para espalhar níveis a partir das raízes
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = levels[current];

    for (const neighbor of adjacency[current]) {
      const nextLevel = currentLevel + 1;
      if (levels[neighbor] === undefined || levels[neighbor] < nextLevel) {
        levels[neighbor] = nextLevel;
        queue.push(neighbor);
      }
    }
  }

  // Garantir que tabelas isoladas ou que sobraram tenham um nível
  tableNames.forEach(name => {
    if (levels[name] === undefined) {
      levels[name] = 0;
    }
  });

  // 2. Passe Reverso (Backward Pull): Puxa tabelas referenciadas para o mais perto possível
  // dos seus consumidores (evitando pular colunas e atravessar por cima de tabelas intermediárias)
  for (let pass = 0; pass < tableNames.length; pass++) {
    let changed = false;
    tableNames.forEach(name => {
      const children = adjacency[name];
      if (children.length > 0) {
        const minChildLevel = Math.min(...children.map(c => levels[c]));
        const targetLevel = minChildLevel - 1;
        if (targetLevel > levels[name]) {
          levels[name] = targetLevel;
          changed = true;
        }
      }
    });
    if (!changed) break;
  }

  // Agrupar tabelas por camada
  const layers: Record<number, string[]> = {};
  tableNames.forEach(name => {
    const lvl = levels[name];
    if (!layers[lvl]) layers[lvl] = [];
    layers[lvl].push(name);
  });

  const layerIndices = Object.keys(layers).map(Number).sort((a, b) => a - b);
  const horizontalGap = 220;
  const verticalGap = 100;

  // Mapa de posições centrais em Y para alinhamento inteligente
  const tableCenterY: Record<string, number> = {};

  let startX = 60;
  layerIndices.forEach((layerIdx, idx) => {
    let layerTables = layers[layerIdx];
    
    // Se não for a primeira camada, ordena as tabelas com base na posição vertical dos seus nós conectados
    if (idx > 0) {
      layerTables = [...layerTables].sort((a, b) => {
        const getParentAvgY = (tableName: string) => {
          const connected = relationships
            .filter(r => (r.fromTable === tableName && levels[r.toTable] < layerIdx) || (r.toTable === tableName && levels[r.fromTable] < layerIdx))
            .map(r => r.fromTable === tableName ? r.toTable : r.fromTable);
          if (connected.length === 0) return 99999; // Se não tem conexão com camadas anteriores, coloca depois das que têm
          const sum = connected.reduce((acc, name) => acc + (tableCenterY[name] || 0), 0);
          return sum / connected.length;
        };
        return getParentAvgY(a) - getParentAvgY(b);
      });
    }

    let startY = 60;
    let maxColWidth = 0;

    layerTables.forEach(tableName => {
      const table = tables[tableName];
      const width = calculateTableWidth(table);
      const height = calculateTableHeight(table);

      positions[tableName] = { x: startX, y: startY };
      tableCenterY[tableName] = startY + height / 2;

      maxColWidth = Math.max(maxColWidth, width);
      startY += height + verticalGap;
    });

    startX += maxColWidth + horizontalGap;
  });

  const edgeOffsets = calculateEdgeOffsets(relationships, levels);
  return { positions, edgeOffsets };
}

export function calculateEdgeOffsets(
  relationships: Relationship[],
  levels?: Record<string, number>
): Record<string, EdgeOffset> {
  const offsets: Record<string, EdgeOffset> = {};
  const ports: Record<string, { rel: Relationship; isSource: boolean }[]> = {};

  // Rastrear conexões por corredor entre colunas ou por tabela de origem/destino
  const channelCount: Record<string, number> = {};

  relationships.forEach((rel) => {
    // Determinar o canal vertical (corredor entre camadas ou chave de tabela pai)
    let channelKey = [rel.fromTable, rel.toTable].sort().join('___');
    if (levels && levels[rel.fromTable] !== undefined && levels[rel.toTable] !== undefined) {
      const minLvl = Math.min(levels[rel.fromTable], levels[rel.toTable]);
      const maxLvl = Math.max(levels[rel.fromTable], levels[rel.toTable]);
      // Compartilham o mesmo corredor entre minLvl e maxLvl
      channelKey = `lane_${minLvl}_${maxLvl}_from_${rel.toTable}`;
    }

    const routeIndex = channelCount[channelKey] || 0;
    channelCount[channelKey] = routeIndex + 1;

    offsets[rel.id] = { sourceOffsetY: 0, targetOffsetY: 0, routeOffsetIndex: routeIndex };

    const keySource = `${rel.fromTable}_${rel.fromCol}_source`;
    const keyTarget = `${rel.toTable}_${rel.toCol}_target`;

    if (!ports[keySource]) ports[keySource] = [];
    if (!ports[keyTarget]) ports[keyTarget] = [];

    ports[keySource].push({ rel, isSource: true });
    ports[keyTarget].push({ rel, isSource: false });
  });

  Object.entries(ports).forEach(([_, group]) => {
    if (group.length === 0) return;

    const markerGroups: Record<string, { rel: Relationship; isSource: boolean }[]> = {};

    group.forEach(({ rel, isSource }) => {
      const marker = getMarkerForCardinality(rel.cardinality, isSource ? 'start' : 'end');
      if (!markerGroups[marker]) markerGroups[marker] = [];
      markerGroups[marker].push({ rel, isSource });
    });

    const uniqueMarkers = Object.keys(markerGroups).sort();
    const gap = 20;
    const totalHeight = (uniqueMarkers.length - 1) * gap;
    let currentY = -totalHeight / 2;

    uniqueMarkers.forEach((marker) => {
      const items = markerGroups[marker] || [];
      items.forEach(({ rel, isSource }) => {
        const currentOffset = offsets[rel.id] || { sourceOffsetY: 0, targetOffsetY: 0 };
        if (isSource) {
          currentOffset.sourceOffsetY = currentY;
        } else {
          currentOffset.targetOffsetY = currentY;
        }
        offsets[rel.id] = currentOffset;
      });
      currentY += gap;
    });
  });

  return offsets;
}
