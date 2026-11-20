import type { PreparedChat } from '../../types'
import { CHATGPT_CONFIG } from '../../providers/chatgpt/chatgpt.config'
import { buildChatgptBody, refineChatgptError } from '../../providers/chatgpt/chatgpt'
import { streamChatCompletions } from '../../shared/openai-compatible'

export function streamChatgpt(chat: PreparedChat): AsyncGenerator<string> {
  return streamChatCompletions({
    url: CHATGPT_CONFIG.endpoint,
    apiKey: chat.apiKey,
    body: buildChatgptBody(chat),
    signal: chat.signal,
    refineError: refineChatgptError,
  })
}
