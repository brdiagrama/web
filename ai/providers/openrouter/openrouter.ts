import type { PreparedChat, RefineError } from '../../types'
import { buildChatCompletionsBody } from '../../shared/openai-compatible'

const PRIVACY_DETAIL =
  'Suas configurações de privacidade no OpenRouter bloqueiam este modelo. Ajuste em https://openrouter.ai/settings/privacy.'

export function buildOpenrouterBody(chat: PreparedChat) {
  const effort = chat.model.reasoningEffort
  return buildChatCompletionsBody(chat, {
    // Sempre explícito: o OpenRouter estima o custo máximo por ele, e sem ele chaves com limite recebem 402.
    max_tokens: 8192,
    // Evita endpoints prioritários, que cobram mais.
    service_tier: 'default',
    temperature: chat.temperature,
    // Com exclude, o raciocínio não vem no stream.
    reasoning: effort ? { effort, exclude: true } : undefined,
  })
}

export const refineOpenrouterError: RefineError = (status, body) => {
  const error = (body as { error?: { message?: string; metadata?: { limit_source?: string } } } | undefined)?.error
  if (status === 403 && error?.metadata?.limit_source) return { kind: 'no_credits' }
  if (status === 404 && error?.message?.includes('data policy')) return { kind: 'forbidden', detail: PRIVACY_DETAIL }
  return undefined
}
