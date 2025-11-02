// CONTROLLER - Camada de Controle HTTP
// api/parse.js
//
// Responsabilidades:
// - Receber requisições HTTP do frontend
// - Validar método HTTP e payload
// - Aplicar middlewares (CORS)
// - Delegar processamento para o Model
// - Retornar resposta formatada (JSON)
//
// Padrão Serverless (Vercel):
// Cada arquivo em /api vira um endpoint automaticamente.
// Este arquivo responde em: POST /api/parse

import { SqlParserService } from '../src/models/sqlParser.service.js';
import Cors from 'cors';

// Configura CORS para aceitar requisições do frontend
// Necessário porque frontend (HTML estático) e API podem estar em domínios diferentes
const cors = Cors({
  methods: ['POST', 'GET', 'HEAD', 'OPTIONS'],
});

/**
 * Wrapper para executar middlewares no modelo serverless da Vercel.
 * 
 * Middlewares normalmente usam callbacks (req, res, next), mas serverless
 * precisa de Promises. Esta função faz a conversão.
 * 
 * @param {Request} req - Objeto da requisição HTTP
 * @param {Response} res - Objeto da resposta HTTP
 * @param {Function} fn - Middleware a ser executado (ex: CORS)
 */
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

/**
 * Handler principal do Controller (ponto de entrada da API).
 * 
 * A Vercel chama esta função automaticamente quando há requisição para /api/parse.
 * 
 * Fluxo:
 * 1. Aplica CORS (permite frontend acessar API)
 * 2. Valida método HTTP (aceita apenas POST)
 * 3. Extrai SQL do body
 * 4. Delega processamento para Model (SqlParserService)
 * 5. Retorna JSON com dados do diagrama
 * 
 * @param {Request} req - Requisição HTTP (contém body, headers, method, etc)
 * @param {Response} res - Resposta HTTP (usado para enviar JSON de volta)
 */
export default async function handler(req, res) {
  
  // Aplica middleware CORS (adiciona headers necessários na resposta)
  await runMiddleware(req, res, cors);

  // Requisição OPTIONS é enviada pelo navegador antes do POST (preflight CORS)
  // Apenas confirma que o servidor aceita a requisição real
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Valida método HTTP: esta API só aceita POST
  // GET não faz sentido aqui porque precisamos enviar SQL no body
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Processa a requisição válida
  try {
    // Extrai SQL do body da requisição
    const { sql } = req.body;
    
    // Validação de payload: SQL é obrigatório
    if (!sql) {
      return res.status(400).json({ error: 'Nenhum SQL fornecido.' });
    }

    // DELEGAÇÃO PARA O MODEL
    // Controller não tem lógica de negócio, apenas chama o Model
    // O Model (SqlParserService) faz o trabalho pesado de parsear SQL
    const diagramData = SqlParserService.parse(sql);
    
    // Retorna sucesso com dados processados
    // Status 200 = OK, corpo da resposta = JSON com tabelas e relacionamentos
    return res.status(200).json(diagramData);

  } catch (e) {
    // Tratamento de erros: qualquer exceção vira erro 500
    // Útil para debug (loga erro) e para frontend (retorna mensagem amigável)
    console.error("Erro ao processar SQL:", e.message);
    return res.status(500).json({ 
      error: 'Erro ao processar SQL.', 
      details: e.message 
    });
  }
}
