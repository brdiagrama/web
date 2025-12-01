import { generateId } from '../utils/mathUtils.js';
import { Parser } from 'node-sql-parser';

export class SqlParserService {

    static detectCardinality(fkColumn, tableData, refTableName, newTables) {
        if (SqlParserService.isInheritanceRelationship(tableData, fkColumn, refTableName, newTables)) {
            return 'inheritance';
        }

        const isNullable = fkColumn.nullable !== false;
        const isUnique = fkColumn.unique === true;
        if (isUnique) {
            if (!isNullable) {
                return 'one-to-one';
            } else {
                return 'zero-to-one';
            }
        } else {
            if (!isNullable) {
                return 'zero-to-many';
            } else {
                return 'optional-many';
            }
        }

    }

    static isJunctionTable(tableData) {
        if (tableData.columns.length < 2) return false;

        let fkCount = 0;
        let pkCount = 0;

        for (const col of tableData.columns) {
            if (col.isFk) fkCount++;
            if (col.isPk) pkCount++;
        }

        const allFksArePks = tableData.columns
            .filter(c => c.isFk)
            .every(c => c.isPk);

        return fkCount >= 2 && allFksArePks && pkCount === fkCount;
    }

    static isInheritanceRelationship(tableData, fkColumn, refTableName, newTables) {
        if (!fkColumn.isPk || !fkColumn.isFk) return false;

        const fkCount = tableData.columns.filter(c => c.isFk).length;
        if (fkCount > 1) return false;

        const pkColumns = tableData.columns.filter(c => c.isPk);
        if (pkColumns.length !== 1) return false;

        const refTable = newTables[refTableName];
        if (!refTable) return false;

        return true;
    }

    static calculateOffsets(relationships) {
        const ports = {};

        const getMarkerType = (cardinality, side) => {
            const map = {
                "one-to-one": { start: "oneBarStart", end: "oneBarEnd" },
                "one-to-many": { start: "oneOrMany", end: "oneBarEnd" },
                "zero-to-one": { start: "zeroOrOne", end: "oneBarEnd" },
                "zero-to-many": { start: "zeroOrMany", end: "exactlyOne" },
                "optional-many": { start: "zeroOrMany", end: "zeroOrOne" },
                "inheritance": { start: "zeroOrOne", end: "exactlyOne" },
                "many-to-many": { start: "crowsFoot", end: "crowsFoot" }
            };
            const type = map[cardinality] || map["one-to-many"];
            return side === 'source' ? type.start : type.end;
        };

        relationships.forEach(rel => {
            const keySource = `${rel.fromTable}_${rel.fromCol}_source`;
            const keyTarget = `${rel.toTable}_${rel.toCol}_target`;

            if (!ports[keySource]) ports[keySource] = [];
            if (!ports[keyTarget]) ports[keyTarget] = [];

            ports[keySource].push(rel);
            ports[keyTarget].push(rel);
        });

        Object.entries(ports).forEach(([key, group]) => {
            if (group.length > 0) {
                const isSource = key.includes('_source');
                const markerGroups = {};

                group.forEach(rel => {
                    const marker = getMarkerType(rel.cardinality, isSource ? 'source' : 'target');

                    if (!markerGroups[marker]) markerGroups[marker] = [];
                    markerGroups[marker].push(rel);
                });

                const uniqueMarkers = Object.keys(markerGroups).sort();
                const count = uniqueMarkers.length;
                const gap = 20;
                const totalHeight = (count - 1) * gap;
                let currentY = -totalHeight / 2;

                uniqueMarkers.forEach(marker => {
                    const relsInThisGroup = markerGroups[marker];

                    relsInThisGroup.forEach(rel => {
                        if (key === `${rel.fromTable}_${rel.fromCol}_source`) {
                            rel.sourceOffsetY = currentY;
                        } else {
                            rel.targetOffsetY = currentY;
                        }
                    });

                    currentY += gap;
                });
            }
        });

        return relationships;
    }

    static parse(sql) {
        const parser = new Parser();
        const newTables = {};
        const newRelationships = [];

        if (!sql.trim()) {
            return { tables: {}, relationships: [] };
        }
        
        const astList = parser.astify(sql, { database: 'MySQL' });
        const statements = Array.isArray(astList) ? astList : [astList];

        const maxPerRow = 5;
        const xSpacing = 300;
        const ySpacing = 180;

        let tableIndex = 0;

        statements.forEach(ast => {
            if (ast.type === 'create' && ast.keyword === 'table') {
                const tableName = ast.table[0].table;

                const row = Math.floor(tableIndex / maxPerRow);
                const col = tableIndex % maxPerRow;
                const x = 50 + col * xSpacing;
                const y = 50 + row * ySpacing;

                const tableData = {
                    name: tableName,
                    columns: [],
                    x,
                    y,
                };

                ast.create_definitions.forEach(def => {
                    if (def.resource === 'column') {
                        const column = {
                            name: def.column.column,
                            type: def.definition.dataType,
                            isPk: false,
                            isFk: false,
                            refTable: null,
                            nullable: true,
                            unique: false
                        };

                        // Constraints Inline
                        if (def.reference_definition) {
                            column.isFk = true;
                            column.refTable = def.reference_definition.table[0].table;
                            const toColName = def.reference_definition.definition?.[0]?.column || 'id';
                            newRelationships.push({
                                id: generateId(),
                                fromTable: tableName,
                                fromCol: column.name,
                                toTable: column.refTable,
                                toCol: toColName,
                                cardinality: SqlParserService.detectCardinality(column, tableData, column.refTable, newTables),
                                vertices: [],
                                auto: true,
                                sourceOffsetY: 0,
                                targetOffsetY: 0
                            });
                        }

                        if (def.primary_key && def.primary_key.toLowerCase() === 'primary key') column.isPk = true;
                        if (def.unique && def.unique.toLowerCase() === 'unique') column.unique = true;
                        if (def.nullable && def.nullable.type === 'not null') column.nullable = false;
                        if (def.definition && def.definition.primaryKey === true) column.isPk = true;

                        // Constraints Array
                        if (def.constraints) {
                            def.constraints.forEach(c => {
                                if (c.constraint_type) {
                                    const type = c.constraint_type.toLowerCase();
                                    if (type === 'primary key') column.isPk = true;
                                    if (type === 'not null') column.nullable = false;
                                    if (type === 'unique') column.unique = true;
                                }
                            });
                        }

                        tableData.columns.push(column);

                    } else if (def.resource === 'constraint') {
                        const type = def.constraint_type ? def.constraint_type.toLowerCase() : '';

                        if (type === 'primary key') {
                            def.definition.forEach(pkDef => {
                                const col = tableData.columns.find(c => c.name === pkDef.column);
                                if (col) col.isPk = true;
                            });
                        } else if (type === 'unique') {
                            const uniqueColName = def.definition[0].column;
                            const col = tableData.columns.find(c => c.name === uniqueColName);
                            if (col) col.unique = true;
                        }
                    }
                });

                newTables[tableName] = tableData;
                tableIndex++;
            }
        });

        statements.forEach(ast => {
            if (ast.type === 'create' && ast.keyword === 'table') {
                const tableName = ast.table[0].table;
                const tableData = newTables[tableName];

                ast.create_definitions.forEach(def => {
                    if (def.resource === 'constraint' && def.constraint_type && def.constraint_type.toLowerCase() === 'foreign key') {
                        const fkColumnName = def.definition[0].column;
                        const fkColumn = tableData.columns.find(c => c.name === fkColumnName);

                        if (fkColumn) {
                            fkColumn.isFk = true;
                            fkColumn.refTable = def.reference_definition.table[0].table;
                            const toColumnName = def.reference_definition.definition?.[0]?.column || 'id';

                            newRelationships.push({
                                id: generateId(),
                                fromTable: tableName,
                                fromCol: fkColumnName,
                                toTable: fkColumn.refTable,
                                toCol: toColumnName,
                                cardinality: SqlParserService.detectCardinality(fkColumn, tableData, fkColumn.refTable, newTables),
                                vertices: [],
                                auto: true,
                                sourceOffsetY: 0,
                                targetOffsetY: 0
                            });
                        }
                    }
                });
            }
        });

        const junctionTableNames = [];

        for (const [name, data] of Object.entries(newTables)) {
            if (SqlParserService.isJunctionTable(data)) {
                junctionTableNames.push(name);
                data.isJunction = true;
            }
        }

        newRelationships.forEach(rel => {
            if (junctionTableNames.includes(rel.fromTable)) {
                rel.cardinality = 'many-to-many';
            }
        });

        SqlParserService.calculateOffsets(newRelationships);

        return { tables: newTables, relationships: newRelationships };
    }
}