import type { Table, Column, Relationship } from '../models/databaseSchema';

export function detectCardinality(fkColumn: Column, tableData: Table, refTableName: string, newTables: Record<string, Table>): string {
    if (isInheritanceRelationship(tableData, fkColumn, refTableName, newTables)) {
        return 'inheritance';
    }

    const isNullable = fkColumn.nullable !== false;
    const isUnique = fkColumn.unique === true;

    if (isUnique) {
        return !isNullable ? 'one-to-one' : 'zero-to-one';
    }

    return !isNullable ? 'zero-to-many' : 'optional-many';
}

export function isJunctionTable(tableData: Table): boolean {
    if (tableData.columns.length < 2) return false;

    let fkCount = 0;
    let pkCount = 0;
    let allFksArePks = true;

    for (const col of tableData.columns) {
        if (col.isFk) {
            fkCount++;
            if (!col.isPk) allFksArePks = false;
        }
        if (col.isPk) pkCount++;
    }

    return fkCount >= 2 && allFksArePks && pkCount === fkCount;
}

export function isInheritanceRelationship(tableData: Table, fkColumn: Column, refTableName: string, newTables: Record<string, Table>): boolean {
    if (!fkColumn.isPk || !fkColumn.isFk) return false;

    const pkCount = tableData.columns.filter(c => c.isPk).length;
    if (pkCount !== 1) return false;

    return !!newTables[refTableName];
}

export function updateInheritanceTables(tables: Record<string, Table>): void {
    for (const table of Object.values(tables)) {
        const pkColumns = table.columns.filter(c => c.isPk);
        if (pkColumns.length === 1 && pkColumns[0].isFk) {
            table.isInheritance = true;
        }
    }
}

export function updateJunctionRelationships(tables: Record<string, Table>, relationships: Relationship[]): void {
    const junctionTableNames: string[] = [];

    for (const [name, data] of Object.entries(tables)) {
        if (isJunctionTable(data)) {
            junctionTableNames.push(name);
            data.isJunction = true;
        }
    }

    relationships.forEach(rel => {
        if (junctionTableNames.includes(rel.fromTable)) {
            rel.cardinality = 'many-to-many';
        }
    });
}
