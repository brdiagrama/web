import type { PreparedChat, RefineError, StreamOutcome } from '../../types'
import { AiError, statusToErrorKind } from '../../shared/errors'

const BLOCKED_REASONS = new Set([
  'SAFETY',
  'PROHIBITED_CONTENT',
  'RECITATION',
  'SPII',
  'BLOCKLIST',
  'LANGUAGE',
  'OTHER',
  'ESCALATION',
  'PUP_LIMITED_DISABLED',
])

interface GeminiPart {
  text?: string
  thought?: boolean
}

export function buildGeminiBody(chat: PreparedChat) {
  return {
    systemInstruction: { parts: [{ text: chat.systemPrompt }] },
    contents: chat.messages.map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    })),
    generationConfig: { thinkingConfig: { thinkingLevel: chat.model.reasoningEffort } },
  }
}

export function parseGeminiEvent(data: string): { text: string; finishReason?: string } {
  const chunk = JSON.parse(data)
  if (chunk.error) throw new AiError(statusToErrorKind(chunk.error.code), chunk.error.message)
  const candidate = chunk.candidates?.[0]
  if (!candidate && chunk.promptFeedback?.blockReason) throw new AiError('blocked', chunk.promptFeedback.blockReason)
  const parts: GeminiPart[] = candidate?.content?.parts ?? []
  return {
    // Partes de raciocínio (thought) e partes só com thoughtSignature não entram no texto.
    text: parts.filter((part) => !part.thought && part.text).map((part) => part.text).join(''),
    finishReason: candidate?.finishReason,
  }
}

export function geminiOutcome(finishReason: string | undefined): StreamOutcome {
  if (!finishReason) return 'interrupted'
  if (finishReason === 'STOP') return 'complete'
  if (finishReason === 'MAX_TOKENS') return 'cut'
  return BLOCKED_REASONS.has(finishReason) ? 'blocked' : 'stopped'
}

export const refineGeminiError: RefineError = (status, body) => {
  if (status !== 400) return undefined
  const error = (body as { error?: { status?: string; details?: { reason?: string }[] } } | undefined)?.error
  // O Gemini responde 400 (e não 401) para chave errada.
  if (error?.details?.some((detail) => detail.reason === 'API_KEY_INVALID')) return { kind: 'invalid_key' }
  if (error?.status === 'FAILED_PRECONDITION') {
    return {
      kind: 'bad_request',
      detail: 'O nível gratuito do Gemini não está disponível no seu país. Ative o faturamento no Google AI Studio.',
    }
  }
  return undefined
}
