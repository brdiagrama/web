// Controller - Camada MVC
// Coordena validação, parsing e cache de diagramas

import { SqlParserService } from '../models/SqlParser.service.js';
import { SqlValidator } from '../services/SqlValidator.js';

export class DiagramController {
  
  static STORAGE_KEYS = {
    LAST_SQL: 'brdiagrama_last_sql',
    LAST_DIAGRAM: 'brdiagrama_last_diagram',
    LAST_POSITIONS: 'brdiagrama_table_positions',
    USER_PREFERENCES: 'brdiagrama_preferences'
  };

  static processSql(sql) {
    try {
      if (!sql || !sql.trim()) {
        return {
          success: false,
          errors: [{ line: 1, message: 'SQL vazio' }],
          warnings: [],
          data: null
        };
      }


      const validation = SqlValidator.validate(sql);
      
      if (!validation.isValid) {
        return {
          success: false,
          errors: validation.errors,
          warnings: validation.warnings,
          data: null
        };
      }

      const diagramData = SqlParserService.parse(sql);

      const enrichedData = this.restoreTablePositions(diagramData);

      this.saveToCache(sql, enrichedData);

      return {
        success: true,
        errors: [],
        warnings: validation.warnings,
        data: enrichedData
      };

    } catch (error) {
      console.error('[DiagramController] Erro ao processar SQL:', error);
      
      let errorMessage = error.message || 'Erro ao processar SQL';
      let isWarning = false;
      
      // Traduz e classifica erros comuns do parser
      if (errorMessage.includes('Expected "*/" or any character but end of input found')) {
        errorMessage = 'Comentário de bloco não foi fechado. Esperado "*/" mas encontrou fim do arquivo.';
        isWarning = true;
      } 
      // Erros de sintaxe do parser (Expected...) são warnings, não críticos
      else if (errorMessage.startsWith('Expected ')) {
        // Mantém a mensagem original do parser para erros de sintaxe
        isWarning = true;
      }
      
      return {
        success: false,
        errors: isWarning ? [] : [{
          line: error.location?.start?.line || 1,
          message: errorMessage
        }],
        warnings: isWarning ? [{
          line: error.location?.start?.line || 1,
          message: errorMessage,
          type: 'warning'
        }] : [],
        data: null
      };
    }
  }

  static saveToCache(sql, diagramData) {
    try {
      localStorage.setItem(this.STORAGE_KEYS.LAST_SQL, sql);
      localStorage.setItem(this.STORAGE_KEYS.LAST_DIAGRAM, JSON.stringify(diagramData));
    } catch (error) {
      console.warn('Falha ao salvar no cache:', error);
    }
  }

  static loadLastSql() {
    try {
      return localStorage.getItem(this.STORAGE_KEYS.LAST_SQL);
    } catch (error) {
      return null;
    }
  }

  static loadLastDiagram() {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEYS.LAST_DIAGRAM);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      return null;
    }
  }

  static saveTablePositions(tables) {
    try {
      const positions = {};
      Object.keys(tables).forEach(tableName => {
        positions[tableName] = {
          x: tables[tableName].x,
          y: tables[tableName].y
        };
      });
      localStorage.setItem(this.STORAGE_KEYS.LAST_POSITIONS, JSON.stringify(positions));
    } catch (error) {
      console.warn('Falha ao salvar posições:', error);
    }
  }

  static restoreTablePositions(diagramData) {
    try {
      const savedPositions = localStorage.getItem(this.STORAGE_KEYS.LAST_POSITIONS);
      if (!savedPositions) return diagramData;

      const positions = JSON.parse(savedPositions);
      const restoredData = { ...diagramData };

      Object.keys(restoredData.tables).forEach(tableName => {
        if (positions[tableName]) {
          restoredData.tables[tableName].x = positions[tableName].x;
          restoredData.tables[tableName].y = positions[tableName].y;
        }
      });

      return restoredData;
    } catch (error) {
      return diagramData;
    }
  }

  static clearCache() {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.LAST_SQL);
      localStorage.removeItem(this.STORAGE_KEYS.LAST_DIAGRAM);
      localStorage.removeItem(this.STORAGE_KEYS.LAST_POSITIONS);
    } catch (error) {
      console.warn('Falha ao limpar cache:', error);
    }
  }

  static getStatistics(diagramData) {
    if (!diagramData || !diagramData.tables) return null;

    const tables = Object.values(diagramData.tables);
    const relationships = diagramData.relationships || [];

    return {
      totalTables: tables.length,
      totalColumns: tables.reduce((sum, t) => sum + (t.columns?.length || 0), 0),
      totalRelationships: relationships.length,
      totalPrimaryKeys: tables.reduce((sum, t) => 
        sum + (t.columns?.filter(c => c.isPk).length || 0), 0
      ),
      totalForeignKeys: tables.reduce((sum, t) => 
        sum + (t.columns?.filter(c => c.isFk).length || 0), 0
      ),
      tablesWithInheritance: tables.filter(t => t.isInheritance).length,
      junctionTables: tables.filter(t => t.isJunction).length
    };
  }
}
