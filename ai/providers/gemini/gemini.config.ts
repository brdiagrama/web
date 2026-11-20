import type { AiProviderConfig } from '../../types'

export const GEMINI_CONFIG = {
  id: 'gemini',
  label: 'Gemini',
  icon: '/ai-providers/gemini.svg',
  // O service monta {endpoint}/{modelo}:streamGenerateContent?alt=sse
  endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
  // Sem prefixo: chaves antigas começam com AIza e as novas com AQ.
  keyConsoleUrl: 'https://aistudio.google.com/apikey',
  keyHint: 'Tem nível gratuito. Nele, o Google pode usar as conversas para melhorar os produtos dele.',
  defaultModel: 'gemini-4-hydrogen',
  // Nenhum aceita temperatura; reasoningEffort vira thinkingLevel.
  models: [
    { id: 'gemini-4-hydrogen', label: 'Gemini 4 Hydrogen (tem nível gratuito)', supportsTemperature: false, reasoningEffort: 'low' },
    { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite (mais rápido, tem nível gratuito)', supportsTemperature: false, reasoningEffort: 'minimal' },
    { id: 'gemini-4-carbon', label: 'Gemini 4 Carbon (mais forte, só pago)', supportsTemperature: false, reasoningEffort: 'low' },
  ],
} satisfies AiProviderConfig
