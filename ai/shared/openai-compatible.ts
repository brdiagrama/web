import type { PreparedChat, RefineError, StreamOutcome } from '../types'
import { AiError, extractErrorMessage, statusToErrorKind } from './errors'
import { postStream } from './http'
import { streamEndNotice } from './notices'
import { readSseData } from './sse'

type ChatCompletionsEvent = 'done' | { text: string; refusal: string; finishReason?: string }

interface StreamChatCompletionsOptions {
  url: string
  apiKey: string
  body: unknown
  signal: AbortSignal
  refineError?: RefineError
}

/** Corpo no formato Chat Completions, usado por ChatGPT, Grok, DeepSeek e OpenRouter. */
export function buildChatCompletionsBody(chat: PreparedChat, extras: Record<string, unknown>) {
  return {
    model: chat.model.id,
    messages: [{ role: 'system', content: chat.systemPrompt }, ...chat.messages],
    stream: true,
    ...extras,
  }
}

export function parseChatCompletionsEvent(data: string): ChatCompletionsEvent {
  if (data === '[DONE]') return 'done'
  const chunk = JSON.parse(data)
  if (chunk.error) {
    const code = chunk.error.code
    throw new AiError(typeof code === 'number' ? statusToErrorKind(code) : 'unavailable', extractErrorMessage(chunk))
  }
  const choice = chunk.choices?.[0]
  return {
    text: choice?.delta?.content ?? '',
    refusal: choice?.delta?.refusal ?? '',
    finishReason: choice?.finish_reason ?? undefined,
  }
}

export function chatCompletionsOutcome(finishReason: string | undefined, sawDone: boolean): StreamOutcome {
  if (!finishReason) return sawDone ? 'complete' : 'interrupted'
  if (finishReason === 'length') return 'cut'
  if (finishReason === 'content_filter') return 'blocked'
  if (finishReason === 'insufficient_system_resource' || finishReason === 'aborted') return 'stopped'
  return 'complete'
}

export async function* streamChatCompletions({
  url,
  apiKey,
  body,
  signal,
  refineError,
}: StreamChatCompletionsOptions): AsyncGenerator<string> {
  const response = await postStream({ url, headers: { Authorization: `Bearer ${apiKey}` }, body, signal, refineError })
  let hasText = false
  let sawDone = false
  let refusal = ''
  let finishReason: string | undefined
  for await (const data of readSseData(response, signal)) {
    const event = parseChatCompletionsEvent(data)
    if (event === 'done') {
      sawDone = true
      break
    }
    refusal += event.refusal
    // O pedaço de consumo que vem antes do [DONE] pode chegar sem finish_reason.
    finishReason = event.finishReason ?? finishReason
    if (event.text) {
      hasText = true
      yield event.text
    }
  }
  const notice = refusal
    ? streamEndNotice('blocked', hasText, refusal)
    : streamEndNotice(chatCompletionsOutcome(finishReason, sawDone), hasText)
  if (notice) yield notice
}
