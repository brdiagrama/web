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
        statements.forEach(ast => {
            // Filtra apenas statements de criação de tabela
            if (ast.type === 'create' && ast.keyword === 'table') {
                const tableName = ast.table[0].table;
                
                // Estrutura da tabela que será renderizada no SVG
                const tableData = {
                    name: tableName,
                    columns: [],
                    // Posição inicial aleatória no canvas (evita sobreposição)
                    x: Math.random() * 400 + 50,
                    y: Math.random() * 300 + 50,
                };

                // Itera sobre cada definição dentro do CREATE TABLE (colunas + constraints)
                ast.create_definitions.forEach(def => {
                    
                    // CASO 1: Definição de COLUNA
                    if (def.resource === 'column') {
                        const column = {
                            name: def.column.column,
                            type: def.definition.dataType,
                            isPk: false,  // será marcado true se for PRIMARY KEY
                            isFk: false,  // será marcado true se for FOREIGN KEY
                            refTable: null, // preenchido com nome da tabela referenciada (se FK)
                            nullable: true, //  padrão é permitir NULL
                            unique: false   //  padrão não é única
                        };
                        
                        // Verifica se a coluna tem constraints inline (ex: id INT PRIMARY KEY)
                        if (def.constraints) {
                            def.constraints.forEach(c => {
                                if (c.constraint_type === 'primary key') column.isPk = true;
                                if (c.constraint_type === 'not null') column.nullable = false; 
                                if (c.constraint_type === 'unique') column.unique = true;
                            });
                        }
                        
                        tableData.columns.push(column);
                    } 
                    
                    // CASO 2: Definição de CONSTRAINT (PK ou FK declaradas separadas das colunas)
                    else if (def.resource === 'constraint') {
                        
                        // Primary Key definida como constraint separada
                        // Exemplo: PRIMARY KEY (id)
                        if (def.constraint_type && def.constraint_type.toLowerCase() === 'primary key') {
                            const pkColumnName = def.definition[0].column;
                            const pkColumn = tableData.columns.find(c => c.name === pkColumnName);
                            if (pkColumn) pkColumn.isPk = true;
                        } 
                        
                        // Foreign Key: cria relacionamento entre tabelas
                        // Exemplo: FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
                        else if (def.constraint_type && def.constraint_type.toLowerCase() === 'foreign key') {
                            const fkColumnName = def.definition[0].column;
                            const fkColumn = tableData.columns.find(c => c.name === fkColumnName);
                            
                            if (fkColumn) {
                                fkColumn.isFk = true;
                                // Extrai nome da tabela referenciada (a tabela "pai")
                                fkColumn.refTable = def.reference_definition.table[0].table;
                                
                                // Extrai a coluna referenciada (normalmente é o PK da tabela pai)
                                const toColumnName = def.reference_definition.definition?.[0]?.column || 'id';
                                
                                // Adiciona relacionamento para desenhar linha no diagrama
                                newRelationships.push({
                                    id: generateId(), // ID único para o relacionamento
                                    fromTable: tableName,       // tabela "filha"
                                    fromCol: fkColumnName,      // coluna FK
                                    toTable: fkColumn.refTable,     // tabela "pai"
                                    toCol: toColumnName, // Coluna referenciada (PK)
                                  cardinality: SqlParserService.detectCardinality(fkColumn, def), // Detectado do SQL
                                    vertices: [], // Array de pontos de controle (será auto-calculado)
                                    auto: true // Flag para recálculo automático
                                });
                            }
                        }
                    }
                });
                
                // Adiciona tabela processada ao resultado final
                newTables[tableName] = tableData;
            }
        });
        
        // Retorna estrutura pronta para ser renderizada pela View
        return { tables: newTables, relationships: newRelationships };
    }
}