// MODEL
// src/models/sqlParser.service.js

import pkg from 'node-sql-parser';
const { Parser } = pkg;

export class SqlParserService {
    
    static parse(sql) {
        const parser = new Parser();
        const newTables = {};
        const newRelationships = [];

        if (!sql.trim()) {
            return { tables: {}, relationships: [] };
        }

        const astList = parser.astify(sql, { database: 'MySQL' });
        const statements = Array.isArray(astList) ? astList : [astList];

        statements.forEach(ast => {
            if (ast.type === 'create' && ast.keyword === 'table') {
                const tableName = ast.table[0].table;
                const tableData = {
                    name: tableName,
                    columns: [],
                    x: Math.random() * 400 + 50,
                    y: Math.random() * 300 + 50,
                };

                ast.create_definitions.forEach(def => {
                    if (def.resource === 'column') {
                        const column = {
                            name: def.column.column,
                            type: def.definition.dataType,
                            isPk: false,
                            isFk: false,
                            refTable: null
                        };
                        
                        if (def.constraints) {
                            def.constraints.forEach(c => {
                                if (c.constraint_type === 'primary key') column.isPk = true;
                            });
                        }
                        tableData.columns.push(column);
                    } else if (def.resource === 'constraint') {
                        if (def.constraint_type === 'primary key') {
                            const pkColumnName = def.definition[0].column;
                            const pkColumn = tableData.columns.find(c => c.name === pkColumnName);
                            if (pkColumn) pkColumn.isPk = true;
                        } else if (def.constraint_type === 'foreign key') {
                            const fkColumnName = def.definition[0].column;
                            const fkColumn = tableData.columns.find(c => c.name === fkColumnName);
                            if (fkColumn) {
                                fkColumn.isFk = true;
                                fkColumn.refTable = def.reference_definition.table[0].table;
                                newRelationships.push({
                                    fromTable: tableName,
                                    fromColumn: fkColumnName,
                                    toTable: fkColumn.refTable,
                                });
                            }
                        }
                    }
                });
                newTables[tableName] = tableData;
            }
        });
        
        return { tables: newTables, relationships: newRelationships };
    }
}