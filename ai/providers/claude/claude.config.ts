import type { AiProviderConfig } from '../../types'

export const CLAUDE_CONFIG = {
  id: 'claude',
  label: 'Claude',
  icon: '/ai-providers/claude.svg',
  keyPrefix: 'sk-ant-',
  keyConsoleUrl: 'https://platform.claude.com/settings/keys',
  keyHint: 'Precisa de créditos pagos na conta da Anthropic.',
  defaultModel: 'claude-opus-5-5',
  // Nenhum aceita temperatura; reasoningEffort vira output_config.effort.
  models: [
    { id: 'claude-opus-5-5', label: 'Claude Opus 5.5', supportsTemperature: false, reasoningEffort: 'low' },
    { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', supportsTemperature: false, reasoningEffort: 'low' },
    { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5 (mais rápido e barato)', supportsTemperature: false, reasoningEffort: 'low' },
  ],
} satisfies AiProviderConfig
