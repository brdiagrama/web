import type { Table } from '../models/databaseSchema';

export const TABLE_DIMENSION_CONSTANTS = {
  MIN_TABLE_WIDTH: 220,
  HORIZONTAL_PADDING: 30,
  HEADER_HEIGHT: 35,
  ROW_HEIGHT: 32,
  TITLE_CHAR_WIDTH: 8,
  COLUMN_NAME_CHAR_WIDTH: 7,
  COLUMN_TYPE_CHAR_WIDTH: 7,
  ROW_EXTRA_SPACING: 20,
};

export function calculateTableWidth(table: Table | null | undefined): number {
  if (!table) return TABLE_DIMENSION_CONSTANTS.MIN_TABLE_WIDTH;

  let maxWidth = TABLE_DIMENSION_CONSTANTS.MIN_TABLE_WIDTH;
  const nameLength = table.name.length * TABLE_DIMENSION_CONSTANTS.TITLE_CHAR_WIDTH + TABLE_DIMENSION_CONSTANTS.HORIZONTAL_PADDING;
  maxWidth = Math.max(maxWidth, nameLength);

  if (table.columns) {
    table.columns.forEach((col) => {
      const isInheritanceCol = !!(table.isInheritance && col.isPk && col.isFk);
      const reservedIconWidth = isInheritanceCol ? 64 : (col.isPk || col.isFk ? 40 : 0);
      const colNameLength = col.name.length * TABLE_DIMENSION_CONSTANTS.COLUMN_NAME_CHAR_WIDTH + reservedIconWidth;
      const colTypeLength = (col.type || '').length * TABLE_DIMENSION_CONSTANTS.COLUMN_TYPE_CHAR_WIDTH;
      const totalRowWidth = colNameLength + colTypeLength + TABLE_DIMENSION_CONSTANTS.HORIZONTAL_PADDING + TABLE_DIMENSION_CONSTANTS.ROW_EXTRA_SPACING;
      maxWidth = Math.max(maxWidth, totalRowWidth);
    });
  }

  return Math.ceil(maxWidth);
}

export function calculateTableHeight(table: Table | null | undefined): number {
  if (!table || !table.columns) return TABLE_DIMENSION_CONSTANTS.HEADER_HEIGHT;
  return TABLE_DIMENSION_CONSTANTS.HEADER_HEIGHT + table.columns.length * TABLE_DIMENSION_CONSTANTS.ROW_HEIGHT;
}
