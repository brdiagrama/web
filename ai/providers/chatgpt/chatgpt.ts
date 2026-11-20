import type { PreparedChat, RefineError } from '../../types'
import { buildChatCompletionsBody } from '../../shared/openai-compatible'

const NO_CREDIT_CODES = new Set([
  'credit_balance_exhausted',
  'insufficient_quota',
  'organization_spend_limit_exceeded',
  'project_spend_limit_exceeded',
  'organization_usage_limit_exceeded',
])

export function buildChatgptBody(chat: PreparedChat) {
  return buildChatCompletionsBody(chat, {
    reasoning_effort: chat.model.reasoningEffort,
    store: false,
    temperature: chat.temperature,
  })
}

export const refineChatgptError: RefineError = (status, body) => {
  const code = (body as { error?: { code?: unknown } } | undefined)?.error?.code
  return status === 429 && typeof code === 'string' && NO_CREDIT_CODES.has(code) ? { kind: 'no_credits' } : undefined
}
