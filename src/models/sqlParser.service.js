// MODEL - Camada de Regras de Negócio
// src/models/sqlParser.service.js
// 
// Responsabilidades:
// - Parsear SQL (CREATE TABLE) para estrutura JSON
// - Identificar colunas, tipos de dados, PKs e FKs
// - Extrair relacionamentos entre tabelas
// - Preparar dados para visualização no diagrama ER

import { generateId } from '../utils/mathUtils.js';
import pkg from 'node-sql-parser';
const { Parser } = pkg;

/**
 * Service que processa SQL e extrai metadados para diagramas ER.
 * 
 * Usa biblioteca node-sql-parser para transformar SQL em AST (Abstract Syntax Tree),
 * permitindo análise estruturada das definições de tabelas.
 */
export class SqlParserService {
    
    /**
     * Método principal: recebe SQL bruto e retorna estrutura para diagrama.
     * 
     * @param {string} sql - Uma ou mais declarações CREATE TABLE em SQL
     * @returns {object} { tables: {...}, relationships: [...] }
     * 
     * Exemplo de retorno:
     * {
     *   tables: {
     *     "usuarios": { name: "usuarios", columns: [...], x: 100, y: 50 },
     *     "pedidos": { name: "pedidos", columns: [...], x: 350, y: 50 }
     *   },
     *   relationships: [
     *     { fromTable: "pedidos", fromColumn: "usuario_id", toTable: "usuarios" }
     *   ]
     * }
     */
    //  Função auxiliar para detectar cardinalidade
    static detectCardinality(fkColumn, foreignKeyDef) {
        // Verifica constraints da coluna FK
        const isNullable = fkColumn.nullable !== false; // se NOT NULL
        const isUnique = fkColumn.unique || false;
        
        // Lógica de detecção:
        // - FK única + NOT NULL = one-to-one
        // - FK única + NULL = zero-to-one
        // - FK normal + NOT NULL = one-to-many
        // - FK normal + NULL = zero-to-many
        
        if (isUnique && isNullable) return 'one-to-one';
        if (isUnique && !isNullable) return 'zero-to-one';
        if (!isUnique && isNullable) return 'one-to-many';
        if (!isUnique && !isNullable) return 'zero-to-many';
        
        // Padrão: one-to-many (FK comum)
        return 'one-to-many';
    }
    static parse(sql) {
        // Instancia o parser da biblioteca node-sql-parser
        const parser = new Parser();
        const newTables = {};
        const newRelationships = [];

        // Validação básica: SQL vazio retorna estrutura vazia
        if (!sql.trim()) {
            return { tables: {}, relationships: [] };
        }

        // Converte SQL em AST (Abstract Syntax Tree)
        // O AST é uma representação em árvore do código SQL, permitindo navegação estruturada
        const astList = parser.astify(sql, { database: 'MySQL' });
        
        // astify pode retornar um único statement ou array (quando há múltiplos CREATE TABLE)
        const statements = Array.isArray(astList) ? astList : [astList];

        // Processa cada statement SQL (cada CREATE TABLE vira uma tabela)
        // Parâmetros de layout
        const maxPerRow = 5; // Máximo de tabelas por linha
        const xSpacing = 300; // Espaço horizontal entre tabelas
        const ySpacing = 180; // Espaço vertical entre linhas

        let tableIndex = 0;
        statements.forEach(ast => {
            if (ast.type === 'create' && ast.keyword === 'table') {
                const tableName = ast.table[0].table;

                // Calcula posição baseada no índice
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

                // Detecta PK por constraint separada
                let pkConstraintName = null;

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
                        // Detecta PK inline pelo AST
                        if (def.primary_key && def.primary_key.toLowerCase() === 'primary key') {
                            column.isPk = true;
                        }
                        if (def.constraints) {
                            def.constraints.forEach(c => {
                                if (c.constraint_type && c.constraint_type.toLowerCase() === 'primary key') column.isPk = true;
                                if (c.constraint_type && c.constraint_type.toLowerCase() === 'not null') column.nullable = false;
                                if (c.constraint_type && c.constraint_type.toLowerCase() === 'unique') column.unique = true;
                            });
                        }
                        if (def.definition && def.definition.primaryKey === true) {
                            column.isPk = true;
                        }
                        if (pkConstraintName && column.name === pkConstraintName) {
                            column.isPk = true;
                        }
                        tableData.columns.push(column);
                    } else if (def.resource === 'constraint') {
                        if (def.constraint_type && def.constraint_type.toLowerCase() === 'primary key') {
                            pkConstraintName = def.definition[0].column;
                        } else if (def.constraint_type && def.constraint_type.toLowerCase() === 'foreign key') {
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
                                    cardinality: SqlParserService.detectCardinality(fkColumn, def),
                                    vertices: [],
                                    auto: true
                                });
                            }
                        }
                    }
                });
                // Se PK foi definida por constraint, marca a coluna correspondente
                if (pkConstraintName) {
                    const pkColumn = tableData.columns.find(c => c.name === pkConstraintName);
                    if (pkColumn) pkColumn.isPk = true;
                }
                newTables[tableName] = tableData;
                tableIndex++;
            }
        });
        
        // Retorna estrutura pronta para ser renderizada pela View
        return { tables: newTables, relationships: newRelationships };
    }
}