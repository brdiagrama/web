import type { AiProviderConfig, ProviderId } from './types'
import { CHATGPT_CONFIG } from './providers/chatgpt/chatgpt.config'
import { GEMINI_CONFIG } from './providers/gemini/gemini.config'
import { GROK_CONFIG } from './providers/grok/grok.config'
import { DEEPSEEK_CONFIG } from './providers/deepseek/deepseek.config'
import { CLAUDE_CONFIG } from './providers/claude/claude.config'
import { OPENROUTER_CONFIG } from './providers/openrouter/openrouter.config'

// A ordem das chaves é a ordem do menu.
const PROVIDER_CONFIGS: Record<ProviderId, AiProviderConfig> = {
  chatgpt: CHATGPT_CONFIG,
  gemini: GEMINI_CONFIG,
  grok: GROK_CONFIG,
  deepseek: DEEPSEEK_CONFIG,
  claude: CLAUDE_CONFIG,
  openrouter: OPENROUTER_CONFIG,
}

export const AI_PROVIDERS: AiProviderConfig[] = Object.values(PROVIDER_CONFIGS)

export function getProviderConfig(id: ProviderId): AiProviderConfig {
  return PROVIDER_CONFIGS[id]
}

export function isProviderId(value: unknown): value is ProviderId {
  return typeof value === 'string' && Object.hasOwn(PROVIDER_CONFIGS, value)
}
