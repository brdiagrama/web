// CONTROLLER
// api/parse.js

import { SqlParserService } from '../src/models/sqlParser.service.js';
import Cors from 'cors';

// Inicializa o middleware de CORS
const cors = Cors({
  methods: ['POST', 'GET', 'HEAD', 'OPTIONS'],
});

// Função auxiliar para rodar o middleware de CORS
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

// 2. A função 'handler' que a Vercel executa
export default async function handler(req, res) {
  
  // 3. Roda o CORS
  await runMiddleware(req, res, cors);

  // 4. Se for uma requisição OPTIONS (verificação do CORS), só responde OK
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 5. Permite apenas requisições POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 6. Lógica do Controller
  try {
    const { sql } = req.body;
    if (!sql) {
      return res.status(400).json({ error: 'Nenhum SQL fornecido.' });
    }

    // Chama o Model
    const diagramData = SqlParserService.parse(sql);
    
    // Envia a resposta (JSON)
    return res.status(200).json(diagramData);

  } catch (e) {
    console.error("Erro na função serverless:", e.message);
    return res.status(500).json({ error: 'Erro ao parsear SQL.', details: e.message });
  }
}
