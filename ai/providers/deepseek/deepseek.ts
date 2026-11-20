import type { PreparedChat, RefineError } from '../../types'
import { extractErrorMessage } from '../../shared/errors'
import { buildChatCompletionsBody } from '../../shared/openai-compatible'

/** O raciocínio vem ligado por padrão; desligado, a resposta sai mais rápida e a temperatura funciona. */
export function buildDeepseekBody(chat: PreparedChat) {
  return buildChatCompletionsBody(chat, {
    thinking: { type: 'disabled' },
    temperature: chat.temperature,
  })
}

export const refineDeepseekError: RefineError = (status, body) =>
  status === 400 && extractErrorMessage(body)?.includes('Model Not Exist') ? { kind: 'model_not_found' } : undefined
