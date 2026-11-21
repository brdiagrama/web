import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WORKSPACE = resolve(__dirname, '..');

// Mesmo hook de tests/tridirectional_sync.test.mjs: resolve "@/" e imports relativos sem extensão para .ts.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const targetTs = resolve(WORKSPACE, specifier.slice(2) + '.ts');
      if (existsSync(targetTs)) {
        return nextResolve(pathToFileURL(targetTs).href, context);
      }
    }
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      const parentPath = context.parentURL ? dirname(fileURLToPath(context.parentURL)) : WORKSPACE;
      const candidateTs = resolve(parentPath, specifier + '.ts');
      if (existsSync(candidateTs)) {
        return nextResolve(pathToFileURL(candidateTs).href, context);
      }
    }
    return nextResolve(specifier, context);
  },
});

const load = (path) => import(pathToFileURL(resolve(WORKSPACE, path)).href);

const { readSseData } = await load('ai/shared/sse.ts');
const { AiError, statusToErrorKind, extractErrorMessage, describeAiError } = await load('ai/shared/errors.ts');
const { streamEndNotice } = await load('ai/shared/notices.ts');
const { validateApiKey } = await load('ai/shared/api-key.ts');
const { parseChatCompletionsEvent, chatCompletionsOutcome, streamChatCompletions } = await load('ai/shared/openai-compatible.ts');
const { getProviderConfig, isProviderId } = await load('ai/catalog.ts');
const { buildSystemPrompt, prepareHistory, orchestrateChat, extractEditorSql } = await load('ai/services/orchestrator.service.ts');
const { buildChatgptBody, refineChatgptError } = await load('ai/providers/chatgpt/chatgpt.ts');
const { buildGeminiBody, parseGeminiEvent, geminiOutcome, refineGeminiError } = await load('ai/providers/gemini/gemini.ts');
const { buildGrokBody, refineGrokError } = await load('ai/providers/grok/grok.ts');
const { buildDeepseekBody, refineDeepseekError } = await load('ai/providers/deepseek/deepseek.ts');
const { buildClaudeParams, claudeOutcome, claudeErrorKind } = await load('ai/providers/claude/claude.ts');
const { buildOpenrouterBody, refineOpenrouterError } = await load('ai/providers/openrouter/openrouter.ts');
const { sendChatMessage } = await load('ai/controllers/ai.controller.ts');

// ---------------------------------------------------------------------------
// Ajudantes
// ---------------------------------------------------------------------------

const encoder = new TextEncoder();
const signal = new AbortController().signal;

function streamOf(chunks) {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(typeof chunk === 'string' ? encoder.encode(chunk) : chunk);
      controller.close();
    },
  });
}

function sseResponse(chunks) {
  return new Response(streamOf(chunks), { headers: { 'content-type': 'text/event-stream' } });
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function chunk(delta, finishReason = null) {
  return `data: ${JSON.stringify({ choices: [{ delta, finish_reason: finishReason }] })}\n\n`;
}

async function collect(iterable) {
  const items = [];
  for await (const item of iterable) items.push(item);
  return items;
}

async function assertAiError(promise, kind, detailIncludes) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof AiError, `esperava AiError, veio ${error}`);
    assert.equal(error.kind, kind);
    if (detailIncludes) assert.ok(error.detail?.includes(detailIncludes), `detalhe: ${error.detail}`);
    return true;
  });
}

function withFetch(handler) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init, body: init?.body ? JSON.parse(init.body) : undefined });
    return handler(url, init);
  };
  return { calls, restore: () => { globalThis.fetch = original; } };
}

function preparedChat(providerId, modelId, extra = {}) {
  const model = getProviderConfig(providerId).models.find((item) => item.id === modelId);
  return {
    model,
    apiKey: 'chave',
    systemPrompt: 'sistema',
    messages: [{ role: 'user', content: 'oi' }, { role: 'assistant', content: 'olá' }, { role: 'user', content: 'tabela?' }],
    signal,
    ...extra,
  };
}

const sentJson = (body) => JSON.parse(JSON.stringify(body));

// ---------------------------------------------------------------------------
// readSseData
// ---------------------------------------------------------------------------

test('readSseData separa eventos com \\n\\n e \\r\\n\\r\\n e ignora comentários', async () => {
  const response = sseResponse([': keep-alive\n\n', 'data: um\n\n', 'data: dois\r\n\r\n', 'event: x\nid: 1\ndata: três\n\n']);
  assert.deepEqual(await collect(readSseData(response, signal)), ['um', 'dois', 'três']);
});

test('readSseData junta várias linhas data: e reconhece [DONE] com CRLF', async () => {
  const response = sseResponse(['data: {"a":\ndata: 1}\n\n', 'data: [DONE]\r\n\r\n']);
  assert.deepEqual(await collect(readSseData(response, signal)), ['{"a":\n1}', '[DONE]']);
});

test('readSseData junta evento e letra acentuada divididos entre pedaços', async () => {
  const bytes = encoder.encode('data: ação\n\n');
  const split = bytes.indexOf(0xc3) + 1; // corta no meio do "ç"
  const response = sseResponse(['da', bytes.slice(2, split), bytes.slice(split)]);
  assert.deepEqual(await collect(readSseData(response, signal)), ['ação']);
});

test('readSseData descarta o resto incompleto no fim', async () => {
  const response = sseResponse(['data: completo\n\n', 'data: {"choices":[{"delta":{"content":"ol']);
  assert.deepEqual(await collect(readSseData(response, signal)), ['completo']);
});

test('readSseData termina sem lançar quando a leitura cai no meio', async () => {
  let step = 0;
  const body = new ReadableStream({
    pull(controller) {
      if (step++ === 0) controller.enqueue(encoder.encode('data: antes\n\n'));
      else controller.error(new TypeError('conexão caiu'));
    },
  });
  const response = new Response(body, { headers: { 'content-type': 'text/event-stream' } });
  assert.deepEqual(await collect(readSseData(response, signal)), ['antes']);
});

test('readSseData relança o erro quando o usuário abortou', async () => {
  const aborter = new AbortController();
  aborter.abort();
  const body = new ReadableStream({
    pull(controller) {
      controller.error(new DOMException('parou', 'AbortError'));
    },
  });
  const response = new Response(body, { headers: { 'content-type': 'text/event-stream' } });
  await assert.rejects(collect(readSseData(response, aborter.signal)), { name: 'AbortError' });
});

// ---------------------------------------------------------------------------
// Chat Completions (ChatGPT, Grok, DeepSeek e OpenRouter)
// ---------------------------------------------------------------------------

test('parseChatCompletionsEvent cobre [DONE], texto, refusal, choices vazio e erros', async () => {
  assert.equal(parseChatCompletionsEvent('[DONE]'), 'done');
  assert.deepEqual(parseChatCompletionsEvent(JSON.stringify({ choices: [{ delta: { content: 'oi' }, finish_reason: null }] })), {
    text: 'oi',
    refusal: '',
    finishReason: undefined,
  });
  assert.deepEqual(parseChatCompletionsEvent(JSON.stringify({ choices: [], usage: {} })), {
    text: '',
    refusal: '',
    finishReason: undefined,
  });
  assert.equal(parseChatCompletionsEvent(JSON.stringify({ choices: [{ delta: { refusal: 'não posso' } }] })).refusal, 'não posso');
  await assertAiError(
    (async () => parseChatCompletionsEvent(JSON.stringify({ error: { code: 429, message: 'Rate limit exceeded' }, choices: [] })))(),
    'rate_limit',
    'Rate limit',
  );
  await assertAiError((async () => parseChatCompletionsEvent(JSON.stringify({ code: 'x', error: 'falhou' })))(), 'unavailable', 'falhou');
});

test('chatCompletionsOutcome traduz finish_reason e falta de [DONE]', () => {
  assert.equal(chatCompletionsOutcome('stop', true), 'complete');
  assert.equal(chatCompletionsOutcome('end_turn', false), 'complete');
  assert.equal(chatCompletionsOutcome('length', true), 'cut');
  assert.equal(chatCompletionsOutcome('content_filter', true), 'blocked');
  assert.equal(chatCompletionsOutcome('insufficient_system_resource', false), 'stopped');
  assert.equal(chatCompletionsOutcome('aborted', false), 'stopped');
  assert.equal(chatCompletionsOutcome(undefined, true), 'complete');
  assert.equal(chatCompletionsOutcome(undefined, false), 'interrupted');
});

test('streamChatCompletions devolve o texto e não perde o "cut" por causa do pedaço de consumo', async () => {
  const fake = withFetch(() =>
    sseResponse([chunk({ role: 'assistant', content: '' }), chunk({ content: 'Olá' }), chunk({}, 'length'), `data: ${JSON.stringify({ choices: [], usage: { total_tokens: 3 } })}\n\n`, 'data: [DONE]\n\n']),
  );
  try {
    const pieces = await collect(streamChatCompletions({ url: 'https://x', apiKey: 'k', body: {}, signal }));
    assert.deepEqual(pieces, ['Olá', '\n\n[Resposta cortada: atingiu o limite de tamanho.]']);
    assert.equal(fake.calls[0].init.headers.Authorization, 'Bearer k');
  } finally {
    fake.restore();
  }
});

test('streamChatCompletions: refusal vira blocked; stopped e interrupted somam aviso', async () => {
  let fake = withFetch(() => sseResponse([chunk({ refusal: 'Não posso ajudar.' }, 'stop'), 'data: [DONE]\n\n']));
  try {
    await assertAiError(collect(streamChatCompletions({ url: 'https://x', apiKey: 'k', body: {}, signal })), 'blocked', 'Não posso');
  } finally {
    fake.restore();
  }

  fake = withFetch(() => sseResponse([chunk({ content: 'parte' }), chunk({}, 'insufficient_system_resource'), 'data: [DONE]\n\n']));
  try {
    const pieces = await collect(streamChatCompletions({ url: 'https://x', apiKey: 'k', body: {}, signal }));
    assert.equal(pieces.at(-1), '\n\n[O provedor interrompeu a resposta antes do fim.]');
  } finally {
    fake.restore();
  }

  fake = withFetch(() => sseResponse([chunk({ content: 'parte' })]));
  try {
    const pieces = await collect(streamChatCompletions({ url: 'https://x', apiKey: 'k', body: {}, signal }));
    assert.equal(pieces.at(-1), '\n\n[A conexão caiu antes do fim da resposta.]');
  } finally {
    fake.restore();
  }

  fake = withFetch(() => sseResponse([]));
  try {
    await assertAiError(collect(streamChatCompletions({ url: 'https://x', apiKey: 'k', body: {}, signal })), 'network');
  } finally {
    fake.restore();
  }
});

test('streamChatCompletions: erro no meio do stream (DeepSeek e OpenRouter) vira AiError', async () => {
  const fake = withFetch(() =>
    sseResponse([chunk({ content: 'a' }), `data: ${JSON.stringify({ error: { message: 'timeout' }, usage: {} })}\n\n`]),
  );
  try {
    await assertAiError(collect(streamChatCompletions({ url: 'https://x', apiKey: 'k', body: {}, signal })), 'unavailable', 'timeout');
  } finally {
    fake.restore();
  }
});

test('postStream: status de erro, 200 sem stream e falha de rede', async () => {
  let fake = withFetch(() => jsonResponse({ error: { message: 'Incorrect API key provided: sk-XX**' } }, 401));
  try {
    await assertAiError(collect(streamChatCompletions({ url: 'https://x', apiKey: 'k', body: {}, signal })), 'invalid_key');
  } finally {
    fake.restore();
  }

  fake = withFetch(() => jsonResponse({ error: { code: 'credit_balance_exhausted', message: 'sem crédito' } }, 429));
  try {
    await assertAiError(
      collect(streamChatCompletions({ url: 'https://x', apiKey: 'k', body: {}, signal, refineError: refineChatgptError })),
      'no_credits',
    );
  } finally {
    fake.restore();
  }

  fake = withFetch(() => jsonResponse({ code: 'invalid-argument', error: 'Incorrect API key provided.' }, 200));
  try {
    await assertAiError(
      collect(streamChatCompletions({ url: 'https://x', apiKey: 'k', body: {}, signal, refineError: refineGrokError })),
      'invalid_key',
    );
  } finally {
    fake.restore();
  }

  fake = withFetch(() => jsonResponse({ code: 'x', error: 'serviço indisponível' }, 200));
  try {
    await assertAiError(collect(streamChatCompletions({ url: 'https://x', apiKey: 'k', body: {}, signal })), 'unavailable');
  } finally {
    fake.restore();
  }

  fake = withFetch(() => {
    throw new TypeError('Failed to fetch');
  });
  try {
    await assertAiError(collect(streamChatCompletions({ url: 'https://x', apiKey: 'k', body: {}, signal })), 'network');
  } finally {
    fake.restore();
  }
});

// ---------------------------------------------------------------------------
// streamEndNotice
// ---------------------------------------------------------------------------

test('streamEndNotice cobre os cinco resultados, com e sem texto', () => {
  assert.equal(streamEndNotice('complete', true), '');
  assert.throws(() => streamEndNotice('complete', false), (error) => error.kind === 'unavailable');
  assert.equal(streamEndNotice('cut', false), '\n\n[Resposta cortada: atingiu o limite de tamanho.]');
  assert.equal(streamEndNotice('stopped', true), '\n\n[O provedor interrompeu a resposta antes do fim.]');
  assert.throws(() => streamEndNotice('stopped', false), (error) => error.kind === 'unavailable');
  assert.equal(streamEndNotice('interrupted', true), '\n\n[A conexão caiu antes do fim da resposta.]');
  assert.throws(() => streamEndNotice('interrupted', false), (error) => error.kind === 'network');
  assert.throws(() => streamEndNotice('blocked', true, 'motivo'), (error) => error.kind === 'blocked' && error.detail === 'motivo');
});

// ---------------------------------------------------------------------------
// Corpos de cada provedor
// ---------------------------------------------------------------------------

test('ChatGPT: id em texto, mensagens limpas, sem temperatura nos modelos 6.2', () => {
  const body = sentJson(buildChatgptBody(preparedChat('chatgpt', 'gpt-6.2-sol')));
  assert.equal(body.model, 'gpt-6.2-sol');
  assert.equal(body.reasoning_effort, 'low');
  assert.equal(body.store, false);
  assert.equal(body.stream, true);
  assert.equal('temperature' in body, false);
  assert.deepEqual(body.messages[0], { role: 'system', content: 'sistema' });
  assert.ok(body.messages.every((message) => Object.keys(message).sort().join() === 'content,role'));

  const terra = sentJson(buildChatgptBody(preparedChat('chatgpt', 'gpt-6.1-terra', { temperature: 0.2 })));
  assert.equal(terra.reasoning_effort, 'none');
  assert.equal(terra.temperature, 0.2);
});

test('Grok: sem reasoning_effort no 4.20 e sem penalidades', () => {
  const body = sentJson(buildGrokBody(preparedChat('grok', 'grok-4.20-0309-non-reasoning', { temperature: 0.7 })));
  assert.equal('reasoning_effort' in body, false);
  assert.equal(body.temperature, 0.7);
  for (const field of ['presence_penalty', 'frequency_penalty', 'stop']) assert.equal(field in body, false);
  assert.equal(sentJson(buildGrokBody(preparedChat('grok', 'grok-4.7'))).reasoning_effort, 'low');
});

test('DeepSeek: raciocínio desligado', () => {
  const body = sentJson(buildDeepseekBody(preparedChat('deepseek', 'deepseek-flash', { temperature: 1 })));
  assert.deepEqual(body.thinking, { type: 'disabled' });
  assert.equal(body.temperature, 1);
});

test('OpenRouter: max_tokens fixo, service_tier e reasoning só quando o modelo tem', () => {
  const sol = sentJson(buildOpenrouterBody(preparedChat('openrouter', 'openai/gpt-6.2-sol')));
  assert.equal(sol.max_tokens, 8192);
  assert.equal(sol.service_tier, 'default');
  assert.deepEqual(sol.reasoning, { effort: 'low', exclude: true });
  assert.equal('temperature' in sol, false);
  const gemma = sentJson(buildOpenrouterBody(preparedChat('openrouter', 'google/gemma-4-31b-it:free', { temperature: 0.7 })));
  assert.equal('reasoning' in gemma, false);
  assert.equal(gemma.temperature, 0.7);
});

test('Gemini: assistant vira model, thinkingLevel e nada de temperatura', () => {
  const body = sentJson(buildGeminiBody(preparedChat('gemini', 'gemini-3.5-flash-lite')));
  assert.deepEqual(body.systemInstruction, { parts: [{ text: 'sistema' }] });
  assert.deepEqual(body.contents.map((item) => item.role), ['user', 'model', 'user']);
  assert.deepEqual(body.generationConfig, { thinkingConfig: { thinkingLevel: 'minimal' } });
});

test('Claude: parâmetros sem temperatura e com effort', () => {
  const params = buildClaudeParams(preparedChat('claude', 'claude-haiku-5-5'));
  assert.equal(params.model, 'claude-haiku-5-5');
  assert.equal(params.max_tokens, 64000);
  assert.equal(params.system, 'sistema');
  assert.deepEqual(params.output_config, { effort: 'low' });
  for (const field of ['temperature', 'top_p', 'top_k', 'thinking']) assert.equal(field in params, false);
});

// ---------------------------------------------------------------------------
// Leitura de stream e erros próprios de cada provedor
// ---------------------------------------------------------------------------

test('Gemini: pula raciocínio, trata bloqueio e erro no stream', async () => {
  const event = JSON.stringify({
    candidates: [{ content: { parts: [{ text: 'pensando', thought: true }, { text: '' }, { text: 'Resposta' }] }, finishReason: 'STOP' }],
  });
  assert.deepEqual(parseGeminiEvent(event), { text: 'Resposta', finishReason: 'STOP' });
  await assertAiError((async () => parseGeminiEvent(JSON.stringify({ promptFeedback: { blockReason: 'SAFETY' } })))(), 'blocked', 'SAFETY');
  await assertAiError((async () => parseGeminiEvent(JSON.stringify({ error: { code: 503, message: 'overloaded' } })))(), 'unavailable');
  assert.equal(geminiOutcome('STOP'), 'complete');
  assert.equal(geminiOutcome('MAX_TOKENS'), 'cut');
  assert.equal(geminiOutcome('SAFETY'), 'blocked');
  assert.equal(geminiOutcome('MALFORMED_RESPONSE'), 'stopped');
  assert.equal(geminiOutcome(undefined), 'interrupted');
});

test('Claude: claudeOutcome e claudeErrorKind', () => {
  assert.equal(claudeOutcome('end_turn'), 'complete');
  assert.equal(claudeOutcome('max_tokens'), 'cut');
  assert.equal(claudeOutcome('model_context_window_exceeded'), 'cut');
  assert.equal(claudeOutcome('refusal'), 'blocked');
  assert.equal(claudeErrorKind({ name: 'APIConnectionTimeoutError' }), 'timeout');
  assert.equal(claudeErrorKind({ name: 'APIConnectionError' }), 'network');
  assert.equal(claudeErrorKind({ name: 'RateLimitError', status: 429, errorCode: 'enforced_spend_limit_reached' }), 'no_credits');
  assert.equal(claudeErrorKind({ name: 'RateLimitError', status: 429 }), 'rate_limit');
  assert.equal(claudeErrorKind({ status: 402, type: 'billing_error' }), 'no_credits');
  assert.equal(claudeErrorKind({ status: 413 }), 'context_too_long');
  assert.equal(claudeErrorKind({ status: 529 }), 'unavailable');
  assert.equal(claudeErrorKind({ name: 'APIError', type: 'overloaded_error' }), 'unavailable');
  assert.equal(claudeErrorKind({ name: 'APIError', type: 'billing_error' }), 'no_credits');
  assert.equal(claudeErrorKind({ name: 'AnthropicError' }), undefined);
});

test('refineError de cada provedor', () => {
  assert.deepEqual(refineChatgptError(429, { error: { code: 'project_spend_limit_exceeded' } }), { kind: 'no_credits' });
  assert.equal(refineChatgptError(429, { error: { code: null } }), undefined);
  assert.deepEqual(refineGeminiError(400, { error: { status: 'INVALID_ARGUMENT', details: [{ reason: 'API_KEY_INVALID' }] } }), {
    kind: 'invalid_key',
  });
  assert.equal(refineGeminiError(400, { error: { status: 'FAILED_PRECONDITION' } }).kind, 'bad_request');
  assert.deepEqual(refineGrokError(403, { code: 'permission-denied', error: 'used all available credits' }), { kind: 'no_credits' });
  assert.deepEqual(refineDeepseekError(400, { error: { message: 'Model Not Exist' } }), { kind: 'model_not_found' });
  assert.deepEqual(refineOpenrouterError(403, { error: { message: 'x', metadata: { limit_source: 'openrouter_key_limit' } } }), {
    kind: 'no_credits',
  });
  assert.equal(refineOpenrouterError(404, { error: { message: 'No endpoints found matching your data policy' } }).kind, 'forbidden');
});

// ---------------------------------------------------------------------------
// Orquestrador
// ---------------------------------------------------------------------------

test('buildSystemPrompt usa dialeto, SQL e a frase de criatividade', () => {
  const prompt = buildSystemPrompt({ sql: 'CREATE TABLE a (id INT);', dialect: 'PostgreSQL' }, 'preciso');
  assert.ok(prompt.includes('dialeto PostgreSQL'));
  assert.ok(prompt.includes('```sql\nCREATE TABLE a (id INT);\n```'));
  assert.ok(prompt.includes('não invente tabelas'));
  assert.ok(buildSystemPrompt({ sql: '  ', dialect: 'MySQL' }, 'criativo').includes('O editor está vazio.'));
  assert.ok(buildSystemPrompt({ sql: '', dialect: 'MySQL' }, 'criativo').includes('prós e contras'));
});

test('permissão de alterar o SQL: instrução no prompt e leitura do bloco devolvido', () => {
  assert.ok(buildSystemPrompt({ sql: '', dialect: 'MySQL', canEditSql: true }, 'equilibrado').includes('```sql-brdiagrama'));
  assert.ok(buildSystemPrompt({ sql: '', dialect: 'MySQL', canEditSql: false }, 'equilibrado').includes('NÃO tem permissão'));
  const reply = 'Adicionei a coluna.\n\n```sql-brdiagrama\nCREATE TABLE a (id INT, nome TEXT);\n```';
  assert.deepEqual(extractEditorSql(reply), { text: 'Adicionei a coluna.', sql: 'CREATE TABLE a (id INT, nome TEXT);' });
  assert.deepEqual(extractEditorSql('Só uma sugestão:\n```sql\nSELECT 1;\n```'), { text: 'Só uma sugestão:\n```sql\nSELECT 1;\n```' });
});

test('prepareHistory tira erros, fica com a última de mensagens seguidas, corta em 20 e começa pelo usuário', () => {
  assert.deepEqual(
    prepareHistory([
      { role: 'user', content: 'Q1' },
      { role: 'assistant', content: 'bloqueada', error: true },
      { role: 'user', content: 'Q2' },
    ]),
    [{ role: 'user', content: 'Q2' }],
  );
  assert.deepEqual(
    prepareHistory([
      { role: 'user', content: 'Q1' },
      { role: 'assistant', content: '' },
      { role: 'user', content: 'Q2' },
    ]),
    [{ role: 'user', content: 'Q2' }],
  );
  // Resposta só com espaços (ex.: parada logo no primeiro pedaço) também sai: o Claude recusa texto vazio.
  assert.deepEqual(
    prepareHistory([
      { role: 'user', content: 'Q1' },
      { role: 'assistant', content: '\n\n' },
      { role: 'user', content: 'Q2' },
    ]),
    [{ role: 'user', content: 'Q2' }],
  );
  const long = Array.from({ length: 30 }, (_, index) => ({ role: index % 2 ? 'assistant' : 'user', content: String(index) }));
  long.push({ role: 'user', content: 'nova' });
  const prepared = prepareHistory(long);
  assert.ok(prepared.length <= 20);
  assert.equal(prepared[0].role, 'user');
  assert.deepEqual(prepared.at(-1), { role: 'user', content: 'nova' });
});

test('orchestrateChat só manda temperatura quando o modelo aceita', async () => {
  const captured = [];
  const service = async function* (chat) {
    captured.push(chat);
    yield 'ok';
  };
  const request = {
    provider: 'gemini',
    model: 'x',
    apiKey: 'k',
    creativity: 'criativo',
    messages: [{ role: 'user', content: 'oi' }],
    context: { sql: '', dialect: 'MySQL' },
    signal,
  };
  await collect(orchestrateChat(request, getProviderConfig('gemini').models[0], service));
  await collect(orchestrateChat(request, getProviderConfig('deepseek').models[0], service));
  assert.equal(captured[0].temperature, undefined);
  assert.equal(captured[1].temperature, 1);
});

// ---------------------------------------------------------------------------
// Chave e erros
// ---------------------------------------------------------------------------

test('validateApiKey: espaços, quebra de linha, prefixo e chave de outro provedor', () => {
  const chatgpt = getProviderConfig('chatgpt');
  const gemini = getProviderConfig('gemini');
  assert.equal(validateApiKey('  sk-proj-abc  ', chatgpt), 'sk-proj-abc');
  assert.throws(() => validateApiKey('   ', chatgpt), (error) => error.kind === 'missing_key');
  assert.throws(() => validateApiKey('sk-ab\ncd', chatgpt), (error) => error.kind === 'invalid_key_format');
  assert.throws(() => validateApiKey('xai-abc', chatgpt), (error) => error.kind === 'invalid_key_format');
  assert.throws(() => validateApiKey('sk-ant-abc', chatgpt), (error) => error.detail === 'Ela parece ser do Claude.');
  assert.throws(() => validateApiKey('xai-abc', gemini), (error) => error.detail === 'Ela parece ser do Grok.');
  assert.throws(() => validateApiKey('sk-ant-abc', gemini), (error) => error.detail === 'Ela parece ser do Claude.');
  assert.throws(() => validateApiKey('sk-abc', gemini), (error) => error.detail === 'Ela parece ser do ChatGPT ou do DeepSeek.');
  assert.equal(validateApiKey('AQ.Ab12-cd_34.ef', gemini), 'AQ.Ab12-cd_34.ef');
});

test('isProviderId só aceita os 6 provedores (nada herdado de Object)', () => {
  assert.equal(isProviderId('gemini'), true);
  for (const value of ['toString', 'constructor', '__proto__', 'valueOf', '', null, 42]) assert.equal(isProviderId(value), false);
});

test('statusToErrorKind responde para qualquer status e describeAiError monta a mensagem', () => {
  assert.equal(statusToErrorKind(400), 'bad_request');
  assert.equal(statusToErrorKind(401), 'invalid_key');
  assert.equal(statusToErrorKind(402), 'no_credits');
  assert.equal(statusToErrorKind(403), 'forbidden');
  assert.equal(statusToErrorKind(404), 'model_not_found');
  assert.equal(statusToErrorKind(408), 'timeout');
  assert.equal(statusToErrorKind(413), 'context_too_long');
  assert.equal(statusToErrorKind(418), 'bad_request');
  assert.equal(statusToErrorKind(429), 'rate_limit');
  assert.equal(statusToErrorKind(503), 'unavailable');
  assert.equal(statusToErrorKind(529), 'unavailable');
  assert.equal(extractErrorMessage({ error: { message: 'a', metadata: { remedy_hint: 'b' } } }), 'b');
  assert.equal(extractErrorMessage({ code: 'x', error: 'texto' }), 'texto');
  assert.equal(extractErrorMessage(undefined), undefined);

  const config = getProviderConfig('deepseek');
  assert.equal(describeAiError(new Error('qualquer'), config), 'O DeepSeek está instável ou sobrecarregado. Tente de novo em instantes.');
  assert.equal(
    describeAiError(new AiError('invalid_key_format', 'Ela parece ser do Claude.'), config),
    'Essa chave não parece ser do DeepSeek. Ela deve começar com sk-. Detalhe: Ela parece ser do Claude.',
  );
});

// ---------------------------------------------------------------------------
// Caminho completo: controller unificado → controller do provedor → orquestrador → service
// ---------------------------------------------------------------------------

test('sendChatMessage leva a pergunta até o DeepSeek e devolve a resposta', async () => {
  const fake = withFetch(() => sseResponse([chunk({ content: 'Use ' }), chunk({ content: 'chave estrangeira.' }, 'stop'), 'data: [DONE]\n\n']));
  try {
    const pieces = await collect(
      sendChatMessage({
        provider: 'deepseek',
        model: 'deepseek-flash',
        apiKey: '  sk-teste  ',
        creativity: 'equilibrado',
        messages: [{ role: 'user', content: 'Como ligo pedidos a clientes?' }],
        context: { sql: 'CREATE TABLE clientes (id INT);', dialect: 'MySQL' },
        signal,
      }),
    );
    assert.deepEqual(pieces, ['Use ', 'chave estrangeira.']);
    const [call] = fake.calls;
    assert.equal(call.url, 'https://api.deepseek.com/chat/completions');
    assert.equal(call.init.headers.Authorization, 'Bearer sk-teste');
    assert.equal(call.body.temperature, 0.7);
    assert.equal(call.body.messages[0].role, 'system');
    assert.ok(call.body.messages[0].content.includes('CREATE TABLE clientes'));
    assert.deepEqual(call.body.messages.at(-1), { role: 'user', content: 'Como ligo pedidos a clientes?' });
  } finally {
    fake.restore();
  }
});

test('sendChatMessage recusa chave vazia, chave de outro provedor e modelo desconhecido sem chamar a rede', async () => {
  const fake = withFetch(() => {
    throw new Error('não devia chamar a rede');
  });
  const base = {
    provider: 'grok',
    model: 'grok-4.7',
    creativity: 'equilibrado',
    messages: [{ role: 'user', content: 'oi' }],
    context: { sql: '', dialect: 'MySQL' },
    signal,
  };
  try {
    await assertAiError(collect(sendChatMessage({ ...base, apiKey: '' })), 'missing_key');
    await assertAiError(collect(sendChatMessage({ ...base, apiKey: 'sk-ant-abc' })), 'invalid_key_format');
    await assertAiError(collect(sendChatMessage({ ...base, apiKey: 'xai-abc', model: 'grok-9' })), 'model_not_found');
    assert.equal(fake.calls.length, 0);
  } finally {
    fake.restore();
  }
});

test('Gemini manda a chave no cabeçalho e monta a URL do modelo', async () => {
  const geminiChunk = (text, finishReason) =>
    `data: ${JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text }] }, finishReason }] })}\r\n\r\n`;
  const fake = withFetch(() => sseResponse([geminiChunk('Olá'), geminiChunk('!', 'STOP')]));
  try {
    const pieces = await collect(
      sendChatMessage({
        provider: 'gemini',
        model: 'gemini-4-hydrogen',
        apiKey: 'AIzaTeste',
        creativity: 'preciso',
        messages: [{ role: 'user', content: 'oi' }],
        context: { sql: '', dialect: 'MySQL' },
        signal,
      }),
    );
    assert.deepEqual(pieces, ['Olá', '!']);
    const [call] = fake.calls;
    assert.equal(call.url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-4-hydrogen:streamGenerateContent?alt=sse');
    assert.equal(call.init.headers['x-goog-api-key'], 'AIzaTeste');
    assert.equal(call.url.includes('key='), false);
  } finally {
    fake.restore();
  }
});
