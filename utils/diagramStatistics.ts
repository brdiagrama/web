import type { DatabaseSchema, Table } from '../domain/models/databaseSchema';

export interface DiagramStatistics {
  totalTables: number;
  totalColumns: number;
  totalRelationships: number;
  totalPrimaryKeys: number;
  totalForeignKeys: number;
  tablesWithInheritance: number;
  junctionTables: number;
}

export function getDiagramStatistics(schema: DatabaseSchema): DiagramStatistics | null {
  if (!schema || !schema.tables) return null;

  const tableList: Table[] = Array.isArray(schema.tables)
    ? schema.tables
    : Object.values(schema.tables);

  const relationships = schema.relationships || [];

  return {
    totalTables: tableList.length,
    totalColumns: tableList.reduce((sum, t) => sum + (t.columns?.length || 0), 0),
    totalRelationships: relationships.length,
    totalPrimaryKeys: tableList.reduce(
      (sum, t) => sum + (t.columns?.filter((c) => c.isPk).length || 0),
      0
    ),
    totalForeignKeys: tableList.reduce(
      (sum, t) => sum + (t.columns?.filter((c) => c.isFk).length || 0),
      0
    ),
    tablesWithInheritance: tableList.filter((t) => t.isInheritance).length,
    junctionTables: tableList.filter((t) => t.isJunction).length,
  };
}
