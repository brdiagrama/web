// Mock da API para desenvolvimento local
// Simula o comportamento da API /api/parse

import { SqlParserService } from '../models/sqlParser.service.js';

/**
 * Mock da API de parsing SQL para desenvolvimento
 * Remove a necessidade de servidor backend durante desenvolvimento
 */
export class MockApiService {
  
  /**
   * Simula uma chamada POST para /api/parse
   * @param {string} sql - SQL a ser parseado
   * @returns {Promise<object>} - Resultado parseado
   */
  static async parse(sql) {
    // Simula um pequeno delay de rede
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      // Usa o mesmo serviço que a API real
      const result = SqlParserService.parse(sql);
      
      // Simula resposta HTTP success
      return {
        ok: true,
        json: async () => result
      };
      
    } catch (error) {
      // Simula resposta HTTP error
      return {
        ok: false,
        status: 500,
        json: async () => ({
          error: 'Erro ao processar SQL',
          details: error.message
        })
      };
    }
  }
}
