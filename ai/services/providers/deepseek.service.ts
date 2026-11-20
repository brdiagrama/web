import type { PreparedChat } from '../../types'
import { DEEPSEEK_CONFIG } from '../../providers/deepseek/deepseek.config'
import { buildDeepseekBody, refineDeepseekError } from '../../providers/deepseek/deepseek'
import { streamChatCompletions } from '../../shared/openai-compatible'

export function streamDeepseek(chat: PreparedChat): AsyncGenerator<string> {
  return streamChatCompletions({
    url: DEEPSEEK_CONFIG.endpoint,
    apiKey: chat.apiKey,
    body: buildDeepseekBody(chat),
    signal: chat.signal,
    refineError: refineDeepseekError,
  })
}
