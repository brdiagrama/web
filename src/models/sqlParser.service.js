import { generateId } from '../utils/mathUtils.js';
import pkg from 'node-sql-parser';
const { Parser } = pkg;

export class SqlParserService {

    static detectCardinality(fkColumn, tableData, refTableName, newTables) {
        if (SqlParserService.isInheritanceRelationship(tableData, fkColumn, refTableName, newTables)) {
            return 'inheritance';
        }

        // Lógica original
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
                // CASO PADRÃO (Teste 1): FK Obrigatória (NOT NULL)
                // Retorna 'zero-to-many' porque no seu mapa ele desenha:
                // Pai: || (exactlyOne)
                // Filho: o< (zeroOrMany)
                return 'zero-to-many';
            } else {
                // CASO OPCIONAL (Teste 2): FK Opcional (NULLABLE)
                // Retorna o NOVO TIPO que criamos
                // Pai: o| (zeroOrOne)
                // Filho: o< (zeroOrMany)
                return 'optional-many';
            }
        }

    }

    static isJunctionTable(tableData) {
        // Uma tabela associativa pura geralmente tem poucas colunas (2 ou 3 se tiver created_at)
        // Se tiver muitas colunas, pode ser uma entidade fraca, então cuidado com validação muito estrita.
        if (tableData.columns.length < 2) return false;

        let fkCount = 0;
        let pkCount = 0;

        for (const col of tableData.columns) {
            if (col.isFk) fkCount++;
            if (col.isPk) pkCount++;
        }

        // REGRA N:N PURA:
        // 1. Todas as colunas da PK devem ser também FKs.
        // 2. Deve ter pelo menos 2 FKs que compõem a PK.
        // No seu caso (id_aluno, id_curso), ambos são PK e ambos são FK.

        // Vamos verificar se todas as colunas que são FKs também são PKs
        const allFksArePks = tableData.columns
            .filter(c => c.isFk)
            .every(c => c.isPk);

        // E se a quantidade de colunas bate com a quantidade de PKs (para ser pura)
        // Ou se você aceita colunas extras, apenas verifique se tem 2 FKs que são PKs.

        // Para o seu SQL exato:
        return fkCount >= 2 && allFksArePks && pkCount === fkCount;
    }

    static isInheritanceRelationship(tableData, fkColumn, refTableName, newTables) {
        // Condições para herança:
        // 1. A coluna FK deve ser a PK da tabela
        // 2. A coluna FK deve referenciar a PK da tabela pai
        // 3. Não pode ter outras FKs (senão seria tabela associativa)

        if (!fkColumn.isPk || !fkColumn.isFk) return false;

        // Conta quantas FKs a tabela tem
        const fkCount = tableData.columns.filter(c => c.isFk).length;
        if (fkCount > 1) return false;

        // Verifica se a FK é a única PK da tabela
        const pkColumns = tableData.columns.filter(c => c.isPk);
        if (pkColumns.length !== 1) return false;

        // Verifica se a coluna referenciada também é PK na tabela pai
        const refTable = newTables[refTableName];
        if (!refTable) return false;

        // Aqui pode-se checar se a coluna referenciada é PK na tabela pai
        // (Ajuste se necessário para seu modelo de dados)
        // const refColumn = refTable.columns.find(c => c.name === fkColumn.refTable);

        return true; // É herança!
    }

    static calculateOffsets(relationships) {
        const ports = {};

        // 1. Definição do Mapa de Marcadores (Tem que ser igual ao do Frontend)
        // Isso serve para saber se visualmente os ícones são iguais ou diferentes
        const getMarkerType = (cardinality, side) => {
            const map = {
                "one-to-one": { start: "oneBarStart", end: "oneBarEnd" },
                "one-to-many": { start: "oneOrMany", end: "oneBarEnd" },
                "zero-to-one": { start: "zeroOrOne", end: "oneBarEnd" },

                // Nossos casos personalizados
                "zero-to-many": { start: "zeroOrMany", end: "exactlyOne" },
                "optional-many": { start: "zeroOrMany", end: "zeroOrOne" },

                "inheritance": { start: "zeroOrOne", end: "exactlyOne" },
                "many-to-many": { start: "crowsFoot", end: "crowsFoot" }
            };
            const type = map[cardinality] || map["one-to-many"];
            return side === 'source' ? type.start : type.end;
        };

        // 2. Agrupar conexões por "porta" (Tabela + Coluna + Lado)
        relationships.forEach(rel => {
            const keySource = `${rel.fromTable}_${rel.fromCol}_source`;
            const keyTarget = `${rel.toTable}_${rel.toCol}_target`;

            if (!ports[keySource]) ports[keySource] = [];
            if (!ports[keyTarget]) ports[keyTarget] = [];

            ports[keySource].push(rel);
            ports[keyTarget].push(rel);
        });

        // 3. Processar cada porta
        Object.entries(ports).forEach(([key, group]) => {
            if (group.length > 0) {
                const isSource = key.includes('_source');

                // --- SUB-AGRUPAMENTO INTELIGENTE ---
                // Agrupa as relações baseadas no TIPO VISUAL do marcador
                const markerGroups = {};

                group.forEach(rel => {
                    // Descobre qual desenho vai aparecer nesta ponta
                    const marker = getMarkerType(rel.cardinality, isSource ? 'source' : 'target');

                    if (!markerGroups[marker]) markerGroups[marker] = [];
                    markerGroups[marker].push(rel);
                });

                // Lista de tipos de marcadores únicos presentes nesta porta
                const uniqueMarkers = Object.keys(markerGroups).sort();

                // Se tivermos marcadores diferentes, precisamos separar as linhas.
                // Se todos forem iguais, count será 1 e gap será 0 (tudo junto).
                const count = uniqueMarkers.length;
                const gap = 20; // Distância entre GRUPOS de tipos diferentes
                const totalHeight = (count - 1) * gap;
                let currentY = -totalHeight / 2;

                uniqueMarkers.forEach(marker => {
                    const relsInThisGroup = markerGroups[marker];

                    // Aplica o MESMO offset para todas as linhas que têm o MESMO marcador
                    relsInThisGroup.forEach(rel => {
                        if (key === `${rel.fromTable}_${rel.fromCol}_source`) {
                            rel.sourceOffsetY = currentY;
                        } else {
                            rel.targetOffsetY = currentY;
                        }
                    });

                    // Só avança o Y se mudarmos de tipo de marcador
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

        // --- FASE 1: Mapear Tabelas e Colunas ---
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
                            // --- CORREÇÃO AQUI: Iterar sobre TODAS as colunas da PK composta ---
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

        // --- FASE 2: Mapear Relacionamentos (Inicialmente como 1:N) ---
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

        // --- FASE 3: Detecção e Reversão para Muitos-para-Muitos (N:N) ---
        const junctionTableNames = [];

        // 1. Identificar tabelas associativas
        for (const [name, data] of Object.entries(newTables)) {
            if (SqlParserService.isJunctionTable(data)) {
                junctionTableNames.push(name);
                data.isJunction = true;
            }
        }

        // 2. Marcar os relacionamentos que apontam PARA uma tabela associativa como N:N
        newRelationships.forEach(rel => {
            // Se o destino (fromTable) é uma tabela associativa
            if (junctionTableNames.includes(rel.fromTable)) {
                // Muda a cardinalidade para many-to-many (pé de galinha dos dois lados)
                rel.cardinality = 'many-to-many';
            }
        });

        SqlParserService.calculateOffsets(newRelationships);

        return { tables: newTables, relationships: newRelationships };
    }
}