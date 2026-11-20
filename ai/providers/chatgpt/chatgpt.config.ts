import type { AiProviderConfig } from '../../types'

export const CHATGPT_CONFIG = {
  id: 'chatgpt',
  label: 'ChatGPT',
  icon: '/ai-providers/chatgpt.svg',
  iconOnDark: '/ai-providers/chatgpt-dark.svg',
  endpoint: 'https://api.openai.com/v1/chat/completions',
  keyPrefix: 'sk-',
  keyConsoleUrl: 'https://platform.openai.com/api-keys',
  keyHint: 'Precisa de créditos pagos na conta da OpenAI.',
  defaultModel: 'gpt-6.2-sol',
  models: [
    { id: 'gpt-6.2-sol', label: 'GPT-6.2 Sol', supportsTemperature: false, reasoningEffort: 'low' },
    { id: 'gpt-6.2-astra', label: 'GPT-6.2 Astra (mais forte)', supportsTemperature: false, reasoningEffort: 'low' },
    // Terra e Luna só aceitam temperatura com reasoning_effort "none".
    { id: 'gpt-6.1-terra', label: 'GPT-6.1 Terra (mais barato)', supportsTemperature: true, reasoningEffort: 'none' },
    { id: 'gpt-6-luna', label: 'GPT-6 Luna (mais rápido e barato)', supportsTemperature: true, reasoningEffort: 'none' },
  ],
} satisfies AiProviderConfig
