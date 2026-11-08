import { defineStore } from 'pinia';
import type { DatabaseSchema, Table, Relationship } from '@/domain/models/databaseSchema';
import { parseSqlSchema } from '@/domain/sql/parser';
import { generateLayout, type EdgeOffset } from '@/domain/diagram/layout2d';
import { useDiagramStorage } from '@/composables/useDiagramStorage';

export interface SqlProblem {
  line: number;
  message: string;
  type?: 'error' | 'warning';
}

export interface HoveredColumnInfo {
  tableName?: string;
  columnName?: string;
  isHovering: boolean;
  isPk?: boolean;
  isFk?: boolean;
  refTable?: string | null;
}

export interface DiagramState {
  sqlCode: string;
  schema: DatabaseSchema;
  positions: Record<string, { x: number; y: number }>;
  edgeOffsets: Record<string, EdgeOffset>;
  tableOrder: string[];
  errors: SqlProblem[];
  warnings: SqlProblem[];
  selectedTableNames: Set<string>;
  hoveredColumn: HoveredColumnInfo | null;
  // Viewport state
  zoom: number;
  pan: { x: number; y: number };
  isGridVisible: boolean;
  gridSize: number;
  isPanMode: boolean;
}

export const useDiagramStore = defineStore('diagram', {
  state: (): DiagramState => ({
    sqlCode: '',
    schema: {
      tables: {},
      relationships: [],
    },
    positions: {},
    edgeOffsets: {},
    tableOrder: [],
    errors: [],
    warnings: [],
    selectedTableNames: new Set<string>(),
    hoveredColumn: null,
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    isGridVisible: false,
    gridSize: 20,
    isPanMode: false,
  }),

  getters: {
    tables: (state): Record<string, Table> => state.schema.tables,
    relationships: (state): Relationship[] => state.schema.relationships,
    hasErrors: (state): boolean => state.errors.length > 0,
    hasWarnings: (state): boolean => state.warnings.length > 0,
    errorCount: (state): number => state.errors.length,
    warningCount: (state): number => state.warnings.length,
  },

  actions: {
    setSql(sql: string) {
      this.sqlCode = sql;
      const { saveSql, saveTablePositions, saveTableOrder, loadTableOrder } = useDiagramStorage();
      saveSql(sql);

      if (!sql || !sql.trim()) {
        this.schema = { tables: {}, relationships: [] };
        this.positions = {};
        this.edgeOffsets = {};
        this.tableOrder = [];
        this.errors = [];
        this.warnings = [];
        return;
      }

      try {
        const newSchema = parseSqlSchema(sql);
        const layoutResult = generateLayout(newSchema, this.positions);

        this.schema = newSchema;
        this.positions = layoutResult.positions;
        this.edgeOffsets = layoutResult.edgeOffsets;
        this.errors = [];
        this.warnings = [];

        const currentOrder = this.tableOrder.length > 0 ? this.tableOrder : (loadTableOrder() || []);
        const tableNames = Object.keys(newSchema.tables);
        const validOrder = currentOrder.filter(name => tableNames.includes(name));
        const newTables = tableNames.filter(name => !validOrder.includes(name));
        this.tableOrder = [...validOrder, ...newTables];

        saveTablePositions(this.positions);
        saveTableOrder(this.tableOrder);
      } catch (e: any) {
        this.errors = [{
          line: e.location?.start?.line || 1,
          message: e.message || 'Erro de sintaxe no SQL',
          type: 'error',
        }];
      }
    },

    updateTablePosition(tableName: string, pos: { x: number; y: number }) {
      this.positions[tableName] = pos;
      const { saveTablePositions } = useDiagramStorage();
      saveTablePositions(this.positions);
    },

    setPositions(newPositions: Record<string, { x: number; y: number }>) {
      this.positions = newPositions;
      const { saveTablePositions } = useDiagramStorage();
      saveTablePositions(this.positions);
    },

    bringTablesToFront(tableNames: string[], topTable?: string) {
      if (!tableNames || tableNames.length === 0) return;
      const set = new Set(tableNames);
      const unselected = this.tableOrder.filter(name => !set.has(name));
      let selected = this.tableOrder.filter(name => set.has(name));

      for (const name of tableNames) {
        if (!selected.includes(name)) {
          selected.push(name);
        }
      }

      if (topTable && selected.includes(topTable)) {
        selected = [...selected.filter(name => name !== topTable), topTable];
      }

      this.tableOrder = [...unselected, ...selected];
      const { saveTableOrder } = useDiagramStorage();
      saveTableOrder(this.tableOrder);
    },

    bringTableToFront(tableName: string) {
      if (!tableName) return;
      this.bringTablesToFront([tableName]);
    },

    selectTable(tableName: string, multiSelect = false) {
      if (multiSelect) {
        const updated = new Set(this.selectedTableNames);
        if (updated.has(tableName)) {
          updated.delete(tableName);
        } else {
          updated.add(tableName);
        }
        this.selectedTableNames = updated;
        this.bringTablesToFront(Array.from(this.selectedTableNames), tableName);
      } else {
        if (!this.selectedTableNames.has(tableName)) {
          this.selectedTableNames = new Set([tableName]);
        }
        this.bringTablesToFront(Array.from(this.selectedTableNames), tableName);
      }
    },

    setSelectedTables(tableNames: string[]) {
      this.selectedTableNames = new Set(tableNames);
      if (tableNames.length > 0) {
        this.bringTablesToFront(tableNames);
      }
    },

    clearSelection() {
      this.selectedTableNames = new Set();
      this.hoveredColumn = null;
    },

    setHoveredColumn(hoverInfo: HoveredColumnInfo | null) {
      this.hoveredColumn = hoverInfo?.isHovering ? hoverInfo : null;
    },

    updateZoom(newZoom: number) {
      this.zoom = Math.max(0.05, Math.min(2.0, newZoom));
    },

    updatePan(newPan: { x: number; y: number }) {
      this.pan = newPan;
    },

    toggleGrid() {
      this.isGridVisible = !this.isGridVisible;
    },

    togglePanMode() {
      this.isPanMode = !this.isPanMode;
    },

    setGridSize(size: number) {
      this.gridSize = size;
    },

    resetProject() {
      this.sqlCode = '';
      this.schema = { tables: {}, relationships: [] };
      this.positions = {};
      this.edgeOffsets = {};
      this.tableOrder = [];
      this.errors = [];
      this.warnings = [];
      this.selectedTableNames = new Set();
      this.hoveredColumn = null;
      const { clearSql, clearTablePositions, clearTableOrder } = useDiagramStorage();
      clearSql();
      clearTablePositions();
      clearTableOrder();
    },
  },
});
