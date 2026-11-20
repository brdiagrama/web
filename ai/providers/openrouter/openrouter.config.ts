import type { AiProviderConfig } from '../../types'

export const OPENROUTER_CONFIG = {
  id: 'openrouter',
  label: 'OpenRouter',
  icon: '/ai-providers/openrouter.svg',
  iconOnDark: '/ai-providers/openrouter-dark.svg',
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  keyPrefix: 'sk-or-v1-',
  keyConsoleUrl: 'https://openrouter.ai/keys',
  keyHint:
    "Modelos com 'grátis' no nome não cobram, mas têm limite de 20 pedidos por minuto e 50 por dia (1000 por dia para quem já comprou 10 créditos). Nos grátis, o provedor pode guardar as conversas.",
  defaultModel: 'google/gemma-4-31b-it:free',
  // GPT-6.2 Sol, Claude Sonnet 5.5 e Gemini 4 têm raciocínio obrigatório: effort "none" dá 400.
  models: [
    { id: 'google/gemma-4-31b-it:free', label: 'Gemma 4 31B (grátis)', supportsTemperature: true },
    { id: 'deepseek/deepseek-v4.1-flash-1017', label: 'DeepSeek V4.1 Flash (barato)', supportsTemperature: true, reasoningEffort: 'none' },
    { id: 'openai/gpt-6.2-sol', label: 'GPT-6.2 Sol', supportsTemperature: false, reasoningEffort: 'low' },
    { id: 'anthropic/claude-sonnet-5.5', label: 'Claude Sonnet 5.5', supportsTemperature: false, reasoningEffort: 'low' },
    { id: 'google/gemini-4-hydrogen', label: 'Gemini 4 Hydrogen', supportsTemperature: false, reasoningEffort: 'low' },
  ],
} satisfies AiProviderConfig
