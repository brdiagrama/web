import type { Table, Column } from '../models/databaseSchema';

export function generateId(): string {
    return Math.random().toString(36).substring(2, 11);
}

// Strategy Pattern for constraints
const CONSTRAINT_STRATEGIES: Record<string, (col: Column) => void> = {
    'primary key': (col) => { col.isPk = true; },
    'unique': (col) => { col.unique = true; },
    'not null': (col) => { col.nullable = false; }
};

function applyInlineConstraints(def: any, column: Column): void {
    if (def.primary_key && def.primary_key.toLowerCase() === 'primary key') column.isPk = true;
    if (def.unique && def.unique.toLowerCase() === 'unique') column.unique = true;
    if (def.nullable && def.nullable.type === 'not null') column.nullable = false;
    if (def.definition && def.definition.primaryKey === true) column.isPk = true;
}

function applyArrayConstraints(def: any, column: Column): void {
    if (!def.constraints) return;

    def.constraints.forEach((c: any) => {
        if (c.constraint_type) {
            const type = c.constraint_type.toLowerCase();
            if (CONSTRAINT_STRATEGIES[type]) {
                CONSTRAINT_STRATEGIES[type](column);
            }
        }
    });
}

export function extractColumnFromDefinition(def: any): Column {
    const column: Column = {
        name: def.column.column,
        type: def.definition.dataType,
        isPk: false,
        isFk: false,
        refTable: null,
        nullable: true,
        unique: false
    };

    applyInlineConstraints(def, column);
    applyArrayConstraints(def, column);

    return column;
}

function applyTableConstraint(def: any, tableData: Table): void {
    const type = def.constraint_type ? def.constraint_type.toLowerCase() : '';
    
    switch (type) {
        case 'primary key':
            def.definition.forEach((pkDef: any) => {
                const col = tableData.columns.find(c => c.name === pkDef.column);
                if (col) col.isPk = true;
            });
            break;
        case 'unique':
            const uniqueColName = def.definition[0].column;
            const col = tableData.columns.find(c => c.name === uniqueColName);
            if (col) col.unique = true;
            break;
    }
}

export function extractTable(ast: any): Table {
    const tableName = ast.table[0].table;
    const tableData: Table = {
        name: tableName,
        columns: [],
        isJunction: false,
        isInheritance: false
    };

    ast.create_definitions.forEach((def: any) => {
        if (def.resource === 'column') {
            const column = extractColumnFromDefinition(def);
            tableData.columns.push(column);
        } else if (def.resource === 'constraint') {
            applyTableConstraint(def, tableData);
        }
    });

    return tableData;
}
