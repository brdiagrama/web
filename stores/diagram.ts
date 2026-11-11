import { defineStore } from 'pinia';
import type { DatabaseSchema, Table, Relationship } from '@/domain/models/databaseSchema';
import { parseSqlAsync } from '@/services/sqlParserService';
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

export interface LoadingProgress {
  isLoading: boolean;
  phase: 'parsing' | 'rendering';
  current: number;
  total: number;
}

export interface DiagramState {
  sqlCode: string;
  schema: DatabaseSchema;
  positions: Record<string, { x: number; y: number }>;
  edgeOffsets: Record<string, EdgeOffset>;
  tableOrder: string[];
  loadingProgress: LoadingProgress;
  errors: SqlProblem[];
  warnings: SqlProblem[];
  selectedTableNames: Set<string>;
  hoveredColumn: HoveredColumnInfo | null;
  // Viewport state
  zoom: number;
  pan: { x: number; y: number };
  viewportSize: { width: number; height: number };
  isExporting: boolean;
  isGridVisible: boolean;
  gridSize: number;
  isPanMode: boolean;
  isStampActive: boolean;
  stampGhostPosition: { x: number; y: number } | null;
}

let currentLoadId = 0;

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
    loadingProgress: {
      isLoading: false,
      phase: 'parsing',
      current: 0,
      total: 0,
    },
    errors: [],
    warnings: [],
    selectedTableNames: new Set<string>(),
    hoveredColumn: null,
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    viewportSize: { width: 0, height: 0 },
    isExporting: false,
    isGridVisible: false,
    gridSize: 20,
    isPanMode: false,
    isStampActive: false,
    stampGhostPosition: null,
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
    async setSql(sql: string) {
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
        this.loadingProgress = { isLoading: false, phase: 'parsing', current: 0, total: 0 };
        return;
      }

      const loadId = ++currentLoadId;
      const parseTimer = setTimeout(() => {
        if (currentLoadId === loadId) {
          this.loadingProgress = { isLoading: true, phase: 'parsing', current: 0, total: 0 };
        }
      }, 200);

      try {
        const newSchema = await parseSqlAsync(sql);
        clearTimeout(parseTimer);
        if (currentLoadId !== loadId) return;

        const allTableNames = Object.keys(newSchema.tables);
        const totalTables = allTableNames.length;

        const layoutResult = generateLayout(newSchema, this.positions);
        this.positions = layoutResult.positions;
        this.edgeOffsets = layoutResult.edgeOffsets;
        this.errors = [];
        this.warnings = [];

        const allTableSet = new Set(allTableNames);
        const currentOrder = this.tableOrder.length > 0 ? this.tableOrder : (loadTableOrder() || []);
        const validOrder = currentOrder.filter(name => allTableSet.has(name));
        const validSet = new Set(validOrder);
        const newTables = allTableNames.filter(name => !validSet.has(name));
        const targetOrder = [...validOrder, ...newTables];

        if (totalTables <= 200) {
          this.schema = newSchema;
          this.tableOrder = targetOrder;
          this.loadingProgress = { isLoading: false, phase: 'rendering', current: totalTables, total: totalTables };
          saveTablePositions(this.positions);
          saveTableOrder(this.tableOrder);
          return;
        }

        // Esquema grande (> 200 tabelas): processamento progressivo em lotes de 50
        this.loadingProgress = { isLoading: true, phase: 'rendering', current: 0, total: totalTables };

        const CHUNK_SIZE = 50;
        let loadedCount = 0;
        const progressiveTables: Record<string, Table> = {};
        const progressiveOrder: string[] = [];

        while (loadedCount < totalTables) {
          if (currentLoadId !== loadId) return;

          const nextBatch = allTableNames.slice(loadedCount, loadedCount + CHUNK_SIZE);
          for (const name of nextBatch) {
            progressiveTables[name] = newSchema.tables[name];
          }

          for (const name of targetOrder) {
            if (progressiveTables[name] && !progressiveOrder.includes(name)) {
              progressiveOrder.push(name);
            }
          }

          loadedCount += nextBatch.length;

          this.schema = {
            tables: { ...progressiveTables },
            relationships: newSchema.relationships.filter(
              r => progressiveTables[r.fromTable] && progressiveTables[r.toTable]
            ),
          };
          this.tableOrder = [...progressiveOrder];
          this.loadingProgress = { isLoading: true, phase: 'rendering', current: loadedCount, total: totalTables };

          await new Promise(resolve => requestAnimationFrame(resolve));
        }

        if (currentLoadId === loadId) {
          this.schema = newSchema;
          this.tableOrder = targetOrder;
          this.loadingProgress = { isLoading: false, phase: 'rendering', current: totalTables, total: totalTables };
          saveTablePositions(this.positions);
          saveTableOrder(this.tableOrder);
        }
      } catch (e: any) {
        clearTimeout(parseTimer);
        if (currentLoadId === loadId) {
          this.loadingProgress = { isLoading: false, phase: 'parsing', current: 0, total: 0 };
          this.errors = [{
            line: e.line || e.location?.start?.line || 1,
            message: e.message || 'Erro de sintaxe no SQL',
            type: 'error',
          }];
        }
      }
    },

    updateTablePosition(tableName: string, pos: { x: number; y: number }, persist = true) {
      this.positions[tableName] = pos;
      if (persist) {
        const { saveTablePositions } = useDiagramStorage();
        saveTablePositions(this.positions);
      }
    },

    persistTablePositions() {
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

    updateViewportSize(size: { width: number; height: number }) {
      this.viewportSize = size;
    },

    setExporting(status: boolean) {
      this.isExporting = status;
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

    startStampMode() {
      this.isStampActive = true;
      this.isPanMode = false;
    },

    cancelStampMode() {
      this.isStampActive = false;
      this.stampGhostPosition = null;
    },

    toggleStampMode() {
      if (this.isStampActive) {
        this.cancelStampMode();
      } else {
        this.startStampMode();
      }
    },

    setStampGhostPosition(pos: { x: number; y: number } | null) {
      this.stampGhostPosition = pos;
    },

    commitStampPlacement(pos: { x: number; y: number }): string {
      const existingNames = new Set(Object.keys(this.schema.tables).map(n => n.toLowerCase()));
      let counter = 1;
      while (existingNames.has(`nova_tabela_${counter}`)) {
        counter++;
      }
      const newTableName = `nova_tabela_${counter}`;
      const tableDdl = `\n\nCREATE TABLE ${newTableName} (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  nome VARCHAR(100) NOT NULL\n);`;

      this.positions[newTableName] = {
        x: Math.round(pos.x),
        y: Math.round(pos.y),
      };

      this.isStampActive = false;
      this.stampGhostPosition = null;

      this.setSql(this.sqlCode + tableDdl);
      return newTableName;
    },

    resetProject() {
      currentLoadId++;
      this.sqlCode = '';
      this.schema = { tables: {}, relationships: [] };
      this.positions = {};
      this.edgeOffsets = {};
      this.tableOrder = [];
      this.loadingProgress = { isLoading: false, current: 0, total: 0 };
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
