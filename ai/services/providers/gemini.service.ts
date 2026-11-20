import type { PreparedChat } from '../../types'
import { GEMINI_CONFIG } from '../../providers/gemini/gemini.config'
import { buildGeminiBody, geminiOutcome, parseGeminiEvent, refineGeminiError } from '../../providers/gemini/gemini'
import { postStream } from '../../shared/http'
import { streamEndNotice } from '../../shared/notices'
import { readSseData } from '../../shared/sse'

export async function* streamGemini(chat: PreparedChat): AsyncGenerator<string> {
  const response = await postStream({
    url: `${GEMINI_CONFIG.endpoint}/${chat.model.id}:streamGenerateContent?alt=sse`,
    // A chave vai no cabeçalho, nunca na URL.
    headers: { 'x-goog-api-key': chat.apiKey },
    body: buildGeminiBody(chat),
    signal: chat.signal,
    refineError: refineGeminiError,
  })
  let hasText = false
  let finishReason: string | undefined
  for await (const data of readSseData(response, chat.signal)) {
    const event = parseGeminiEvent(data)
    finishReason = event.finishReason ?? finishReason
    if (event.text) {
      hasText = true
      yield event.text
    }
  }
  const notice = streamEndNotice(geminiOutcome(finishReason), hasText)
  if (notice) yield notice
}
