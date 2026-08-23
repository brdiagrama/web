import type { Table, Relationship } from '../models/databaseSchema';

export interface PathRouterOptions {
  fromTableWidth: number;
  toTableWidth: number;
  headerHeight?: number;
  rowHeight?: number;
  sourceOffsetY?: number;
  targetOffsetY?: number;
  index?: number;
}

export interface LabelPositions {
  start: { x: number; y: number };
  end: { x: number; y: number };
}

const CARDINALITY_MARKERS: Record<string, { start: string; end: string }> = {
  'one-to-one': { start: 'oneBarStart', end: 'oneBarEnd' },
  'one-to-many': { start: 'oneOrMany', end: 'oneBarEnd' },
  'many-to-many': { start: 'crowsFoot', end: '' },
  'zero-to-one': { start: 'zeroOrOne', end: 'oneBarEnd' },
  'zero-to-many': { start: 'zeroOrMany', end: 'exactlyOne' },
  'optional-many': { start: 'zeroOrMany', end: 'zeroOrOneEnd' },
  'inheritance': { start: 'zeroOrOne', end: 'exactlyOne' },
};

const CARDINALITY_TEXTS: Record<string, { start: string; end: string }> = {
  'one-to-one': { start: '1', end: '1' },
  'one-to-many': { start: 'N', end: '1' },
  'many-to-many': { start: 'N', end: '1' },
  'zero-to-one': { start: '0..1', end: '1' },
  'zero-to-many': { start: 'N', end: '1' },
  'one-to-zero-or-one': { start: '1', end: '0..1' },
  'inheritance': { start: '0..1', end: '1' },
  'optional-many': { start: 'N', end: '0..1' },
};

const DEFAULT_MARKER = { start: 'oneOrMany', end: 'oneBarEnd' };
const DEFAULT_TEXT = { start: 'N', end: '1' };

export function getMarkerForCardinality(cardinality = 'one-to-many', side: 'start' | 'end'): string {
  const map = CARDINALITY_MARKERS[cardinality] ?? DEFAULT_MARKER;
  return map[side] || 'oneBar';
}

export function getCardinalityText(cardinality = 'one-to-many', side: 'start' | 'end'): string {
  const map = CARDINALITY_TEXTS[cardinality] ?? DEFAULT_TEXT;
  return map[side] || (side === 'start' ? 'N' : '1');
}

export function getColumnOffsetY(
  table: Table,
  columnName: string,
  headerHeight = 35,
  rowHeight = 32
): number {
  if (!table?.columns) return 0;
  const colIndex = table.columns.findIndex(col => col.name === columnName);
  if (colIndex === -1) return 0;
  return headerHeight + 20 + colIndex * rowHeight - 4;
}

export function calculateRelationshipPath(
  t1: Table,
  p1: { x: number; y: number },
  t2: Table,
  p2: { x: number; y: number },
  rel: Relationship,
  options: PathRouterOptions
): string {
  if (!t1 || !t2 || !p1 || !p2) return '';

  const headerHeight = options.headerHeight ?? 35;
  const rowHeight = options.rowHeight ?? 32;
  const sourceOffset = options.sourceOffsetY ?? 0;
  const targetOffset = options.targetOffsetY ?? 0;

  const y1 = p1.y + getColumnOffsetY(t1, rel.fromCol, headerHeight, rowHeight) + sourceOffset;
  const y2 = p2.y + getColumnOffsetY(t2, rel.toCol, headerHeight, rowHeight) + targetOffset;

  const defaultRadius = 12;
  const deltaY = Math.abs(y2 - y1);
  const dirY = y1 < y2 ? 1 : -1;
  const r = Math.min(defaultRadius, deltaY / 2);

  const t1Right = p1.x + options.fromTableWidth;
  const t2Right = p2.x + options.toTableWidth;
  const t1Left = p1.x;
  const t2Left = p2.x;
  const gap = 40;

  // CENÁRIO 1: T1 à esquerda de T2 (Rotas em Z)
  if (t1Right + gap < t2Left) {
    const startX = t1Right;
    const endX = t2Left;
    const midX = (startX + endX) / 2;

    if (deltaY === 0) return `M ${startX} ${y1} L ${endX} ${y2}`;

    return [
      `M ${startX} ${y1}`,
      `L ${midX - r} ${y1}`,
      `Q ${midX} ${y1} ${midX} ${y1 + r * dirY}`,
      `L ${midX} ${y2 - r * dirY}`,
      `Q ${midX} ${y2} ${midX + r} ${y2}`,
      `L ${endX} ${y2}`,
    ].join(' ');
  }

  // CENÁRIO 2: T1 à direita de T2 (Rotas em Z invertido)
  if (t1Left > t2Right + gap) {
    const startX = t1Left;
    const endX = t2Right;
    const midX = (startX + endX) / 2;

    if (deltaY === 0) return `M ${startX} ${y1} L ${endX} ${y2}`;

    return [
      `M ${startX} ${y1}`,
      `L ${midX + r} ${y1}`,
      `Q ${midX} ${y1} ${midX} ${y1 + r * dirY}`,
      `L ${midX} ${y2 - r * dirY}`,
      `Q ${midX} ${y2} ${midX - r} ${y2}`,
      `L ${endX} ${y2}`,
    ].join(' ');
  }

  // CENÁRIO 3: Sobreposição Vertical (Rotas em C pela direita)
  const startX = t1Right;
  const endX = t2Right;
  const maxX = Math.max(t1Right, t2Right);
  const relationshipIndex = options.index ?? 0;
  const safeX = maxX + 30 + relationshipIndex * 20;

  return [
    `M ${startX} ${y1}`,
    `L ${safeX - r} ${y1}`,
    `Q ${safeX} ${y1} ${safeX} ${y1 + r * dirY}`,
    `L ${safeX} ${y2 - r * dirY}`,
    `Q ${safeX} ${y2} ${safeX - r} ${y2}`,
    `L ${endX} ${y2}`,
  ].join(' ');
}

export function calculateLabelPositions(
  t1: Table,
  p1: { x: number; y: number },
  t2: Table,
  p2: { x: number; y: number },
  rel: Relationship,
  options: PathRouterOptions
): LabelPositions {
  if (!t1 || !t2 || !p1 || !p2) {
    return { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } };
  }

  const headerHeight = options.headerHeight ?? 35;
  const rowHeight = options.rowHeight ?? 32;
  const sourceOffset = options.sourceOffsetY ?? 0;
  const targetOffset = options.targetOffsetY ?? 0;

  const y1 = p1.y + getColumnOffsetY(t1, rel.fromCol, headerHeight, rowHeight) + sourceOffset;
  const y2 = p2.y + getColumnOffsetY(t2, rel.toCol, headerHeight, rowHeight) + targetOffset;

  const t1Right = p1.x + options.fromTableWidth;
  const t2Right = p2.x + options.toTableWidth;
  const t1Left = p1.x;
  const t2Left = p2.x;
  const yOffset = -15;

  let startX: number;
  let endX: number;

  if (t1Right + 40 < t2Left) {
    const isWideMarker = rel.cardinality === 'optional-many';
    const offset = isWideMarker ? 30 : 20;
    startX = t1Right + 4;
    endX = t2Left - offset - 15;
  } else if (t1Left > t2Right + 40) {
    const isWideMarker = rel.cardinality === 'zero-to-one' || rel.cardinality === 'inheritance';
    const offset = isWideMarker ? 45 : 20;
    startX = t1Left - offset;
    endX = t2Right + 4;
  } else {
    startX = t1Right + 4;
    endX = t2Right + 4;
  }

  return {
    start: { x: startX, y: y1 + yOffset },
    end: { x: endX, y: y2 + yOffset },
  };
}
