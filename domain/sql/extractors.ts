import type { Table, Column } from '../models/databaseSchema';

export function generateId(): string {
    return Math.random().toString(36).substring(2, 11);
}

export function extractColumnName(colRef: any): string {
    if (!colRef) return '';
    if (typeof colRef === 'string') return colRef.replace(/[`"']/g, '');
    if (colRef.column) return extractColumnName(colRef.column);
    if (colRef.expr?.value) return String(colRef.expr.value).replace(/[`"']/g, '');
    if (colRef.value) return String(colRef.value).replace(/[`"']/g, '');
    return '';
}

export function extractTableName(tableRef: any): string {
    if (!tableRef) return '';
    if (typeof tableRef === 'string') return tableRef.replace(/[`"']/g, '');
    if (Array.isArray(tableRef)) return extractTableName(tableRef[0]);
    if (tableRef.table) return extractTableName(tableRef.table);
    return '';
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
    if (def.auto_increment || (typeof def.auto_increment === 'string' && def.auto_increment.toLowerCase() === 'auto_increment')) {
        column.autoIncrement = true;
    }
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

function formatColumnType(def: any): string {
    const definition = def?.definition;
    if (!definition || !definition.dataType) return '';

    const baseType = definition.dataType;

    if (definition.expr && Array.isArray(definition.expr.value)) {
        const exprValues = definition.expr.value
            .map((item: any) => `'${item.value}'`)
            .join(', ');
        return `${baseType}(${exprValues})`;
    }

    if (definition.length !== undefined && definition.length !== null) {
        if (definition.scale !== undefined && definition.scale !== null) {
            return `${baseType}(${definition.length},${definition.scale})`;
        }
        return `${baseType}(${definition.length})`;
    }

    return baseType;
}

export function extractColumnFromDefinition(def: any): Column {
    const column: Column = {
        name: extractColumnName(def.column),
        type: formatColumnType(def),
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
                const pkColName = extractColumnName(pkDef);
                const col = tableData.columns.find(c => c.name === pkColName);
                if (col) col.isPk = true;
            });
            break;
        case 'unique':
            const uniqueColName = extractColumnName(def.definition?.[0]);
            const col = tableData.columns.find(c => c.name === uniqueColName);
            if (col) col.unique = true;
            break;
    }
}

export function extractTable(ast: any, index = 0): Table {
    const tableName = extractTableName(ast.table);
    const tableData: Table = {
        id: `table_idx_${index}`,
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
