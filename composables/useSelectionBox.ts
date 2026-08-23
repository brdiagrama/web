import { ref } from 'vue';
import type { Table } from '@/domain/models/databaseSchema';
import { calculateTableWidth, calculateTableHeight } from '@/domain/diagram/tableDimensions';

export interface SelectionBoxState {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  visible: boolean;
}

export function useSelectionBox(
  getTables: () => Record<string, Table>,
  getPositions: () => Record<string, { x: number; y: number }>,
  onSelect: (selectedNames: string[]) => void
) {
  const selectionBox = ref<SelectionBoxState>({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    visible: false,
  });

  const onSelectionStart = (point: { x: number; y: number }) => {
    selectionBox.value = {
      startX: point.x,
      startY: point.y,
      endX: point.x,
      endY: point.y,
      visible: true,
    };
  };

  const onSelectionMove = (point: { x: number; y: number }) => {
    if (!selectionBox.value.visible) return;
    selectionBox.value.endX = point.x;
    selectionBox.value.endY = point.y;

    evaluateSelection();
  };

  const onSelectionEnd = () => {
    if (!selectionBox.value.visible) return;
    evaluateSelection();
    selectionBox.value.visible = false;
  };

  const evaluateSelection = () => {
    const box = {
      left: Math.min(selectionBox.value.startX, selectionBox.value.endX),
      right: Math.max(selectionBox.value.startX, selectionBox.value.endX),
      top: Math.min(selectionBox.value.startY, selectionBox.value.endY),
      bottom: Math.max(selectionBox.value.startY, selectionBox.value.endY),
    };

    // Pequeno threshold para ignorar micro-cliques como seleção de área
    if (box.right - box.left < 5 && box.bottom - box.top < 5) {
      return;
    }

    const tables = getTables();
    const positions = getPositions();
    const selected: string[] = [];

    Object.entries(tables).forEach(([tableName, table]) => {
      const pos = positions[tableName];
      if (!pos) return;

      const width = calculateTableWidth(table);
      const height = calculateTableHeight(table);

      const tableRect = {
        left: pos.x,
        right: pos.x + width,
        top: pos.y,
        bottom: pos.y + height,
      };

      const intersects = !(
        box.left > tableRect.right ||
        box.right < tableRect.left ||
        box.top > tableRect.bottom ||
        box.bottom < tableRect.top
      );

      if (intersects) {
        selected.push(tableName);
      }
    });

    onSelect(selected);
  };

  return {
    selectionBox,
    onSelectionStart,
    onSelectionMove,
    onSelectionEnd,
  };
}
