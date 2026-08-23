export interface Column {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
  refTable?: string | null;
  nullable?: boolean;
  unique?: boolean;
}

export interface Table {
  name: string;
  columns: Column[];
  isJunction?: boolean;
  isInheritance?: boolean;
}

export interface Relationship {
  id: string;
  fromTable: string;
  fromCol: string;
  toTable: string;
  toCol: string;
  cardinality: string;
}

export interface DatabaseSchema {
  tables: Record<string, Table>;
  relationships: Relationship[];
}
