import type { AiProviderConfig } from '../../types'

export const GROK_CONFIG = {
  id: 'grok',
  label: 'Grok',
  icon: '/ai-providers/grok.svg',
  iconOnDark: '/ai-providers/grok-dark.svg',
  endpoint: 'https://api.x.ai/v1/chat/completions',
  keyPrefix: 'xai-',
  keyConsoleUrl: 'https://console.x.ai/team/default/api-keys',
  keyHint: 'Precisa de créditos pagos na conta da xAI.',
  defaultModel: 'grok-4.7',
  models: [
    { id: 'grok-4.7', label: 'Grok 4.7', supportsTemperature: true, reasoningEffort: 'low' },
    { id: 'grok-4.3', label: 'Grok 4.3 (mais barato)', supportsTemperature: true, reasoningEffort: 'low' },
    // Mandar reasoning_effort para o 4.20 dá 400.
    { id: 'grok-4.20-0309-non-reasoning', label: 'Grok 4.20 (mais rápido, sem raciocínio)', supportsTemperature: true },
  ],
} satisfies AiProviderConfig
