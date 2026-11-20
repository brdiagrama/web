import type { PreparedChat, RefineError } from '../../types'
import { extractErrorMessage } from '../../shared/errors'
import { buildChatCompletionsBody } from '../../shared/openai-compatible'

/** Nunca mande presence_penalty, frequency_penalty nem stop: o Grok responde 400. */
export function buildGrokBody(chat: PreparedChat) {
  return buildChatCompletionsBody(chat, {
    temperature: chat.temperature,
    reasoning_effort: chat.model.reasoningEffort,
  })
}

/** Vale para qualquer status: o Grok responde 400 para chave errada e 403 para falta de crédito. */
export const refineGrokError: RefineError = (_status, body) => {
  const message = extractErrorMessage(body) ?? ''
  if (message.includes('API key')) return { kind: 'invalid_key' }
  if (message.includes('credits') || message.includes('spending limit')) return { kind: 'no_credits' }
  return undefined
}
