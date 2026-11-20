import type { PreparedChat } from '../../types'
import { GROK_CONFIG } from '../../providers/grok/grok.config'
import { buildGrokBody, refineGrokError } from '../../providers/grok/grok'
import { streamChatCompletions } from '../../shared/openai-compatible'

export function streamGrok(chat: PreparedChat): AsyncGenerator<string> {
  return streamChatCompletions({
    url: GROK_CONFIG.endpoint,
    apiKey: chat.apiKey,
    body: buildGrokBody(chat),
    signal: chat.signal,
    refineError: refineGrokError,
  })
}
