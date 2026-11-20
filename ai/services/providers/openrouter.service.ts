import type { PreparedChat } from '../../types'
import { OPENROUTER_CONFIG } from '../../providers/openrouter/openrouter.config'
import { buildOpenrouterBody, refineOpenrouterError } from '../../providers/openrouter/openrouter'
import { streamChatCompletions } from '../../shared/openai-compatible'

export function streamOpenrouter(chat: PreparedChat): AsyncGenerator<string> {
  return streamChatCompletions({
    url: OPENROUTER_CONFIG.endpoint,
    apiKey: chat.apiKey,
    body: buildOpenrouterBody(chat),
    signal: chat.signal,
    refineError: refineOpenrouterError,
  })
}
