import type { DatabaseSchema } from '../domain/models/databaseSchema';

const STORAGE_KEYS = {
  LAST_SQL: 'brdiagrama_last_sql',
  LAST_DIAGRAM: 'brdiagrama_last_diagram',
  LAST_POSITIONS: 'brdiagrama_table_positions',
  LAST_TABLE_ORDER: 'brdiagrama_table_order',
};

export function useDiagramStorage() {
  const saveSql = (sql: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LAST_SQL, sql);
    }
  };

  const loadSql = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.LAST_SQL);
    }
    return null;
  };

  const clearSql = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.LAST_SQL);
    }
  };

  const saveTablePositions = (positions: Record<string, { x: number; y: number }>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LAST_POSITIONS, JSON.stringify(positions));
    }
  };

  const loadTablePositions = (): Record<string, { x: number; y: number }> | null => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.LAST_POSITIONS);
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  };

  const clearTablePositions = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.LAST_POSITIONS);
    }
  };

  const saveTableOrder = (order: string[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LAST_TABLE_ORDER, JSON.stringify(order));
    }
  };

  const loadTableOrder = (): string[] | null => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.LAST_TABLE_ORDER);
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  };

  const clearTableOrder = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.LAST_TABLE_ORDER);
    }
  };

  return {
    saveSql,
    loadSql,
    clearSql,
    saveTablePositions,
    loadTablePositions,
    clearTablePositions,
    saveTableOrder,
    loadTableOrder,
    clearTableOrder,
  };
}
