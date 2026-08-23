import type { DatabaseSchema, Relationship } from '../models/databaseSchema';
import { getMarkerForCardinality } from './pathRouter';

export interface EdgeOffset {
  sourceOffsetY: number;
  targetOffsetY: number;
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
  const maxPerRow = 5;
  const xSpacing = 300;
  const ySpacing = 180;
  let tableIndex = 0;

  for (const tableName in schema.tables) {
    const table = schema.tables[tableName];
    if (!table) continue;

    const existing = existingPositions?.[tableName];
    const x = existing ? existing.x : 50 + (tableIndex % maxPerRow) * xSpacing;
    const y = existing ? existing.y : 50 + Math.floor(tableIndex / maxPerRow) * ySpacing;

    positions[tableName] = { x, y };
    tableIndex++;
  }

  const edgeOffsets = calculateEdgeOffsets(schema.relationships || []);

  return { positions, edgeOffsets };
}

export function calculateEdgeOffsets(relationships: Relationship[]): Record<string, EdgeOffset> {
  const offsets: Record<string, EdgeOffset> = {};
  const ports: Record<string, { rel: Relationship; isSource: boolean }[]> = {};

  relationships.forEach((rel) => {
    offsets[rel.id] = { sourceOffsetY: 0, targetOffsetY: 0 };

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
