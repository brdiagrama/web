import type { AiProviderConfig } from '../../types'

export const DEEPSEEK_CONFIG = {
  id: 'deepseek',
  label: 'DeepSeek',
  icon: '/ai-providers/deepseek.svg',
  endpoint: 'https://api.deepseek.com/chat/completions',
  keyPrefix: 'sk-',
  keyConsoleUrl: 'https://platform.deepseek.com/api_keys',
  keyHint: 'Precisa de saldo pago na conta da DeepSeek.',
  defaultModel: 'deepseek-flash',
  // A temperatura funciona porque o raciocínio é desligado no corpo da chamada.
  models: [
    { id: 'deepseek-flash', label: 'DeepSeek Flash', supportsTemperature: true },
    { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro (maior e mais caro)', supportsTemperature: true },
  ],
} satisfies AiProviderConfig
