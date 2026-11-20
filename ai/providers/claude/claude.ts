import type Anthropic from '@anthropic-ai/sdk'
import type { AiErrorKind, PreparedChat, StreamOutcome } from '../../types'
import { statusToErrorKind } from '../../shared/errors'

const SPEND_LIMIT_CODES = new Set(['enforced_spend_limit_reached', 'contract_spend_limit_reached'])

const TYPE_KINDS: Record<string, AiErrorKind> = {
  billing_error: 'no_credits',
  rate_limit_error: 'rate_limit',
  authentication_error: 'invalid_key',
  permission_error: 'forbidden',
  not_found_error: 'model_not_found',
  timeout_error: 'timeout',
}

interface ClaudeErrorShape {
  name?: unknown
  status?: unknown
  type?: unknown
  errorCode?: unknown
}

/** Não envie temperature, top_p, top_k nem thinking: esses modelos respondem 400. */
export function buildClaudeParams(chat: PreparedChat): Anthropic.MessageStreamParams {
  return {
    model: chat.model.id,
    max_tokens: 64000,
    system: chat.systemPrompt,
    messages: chat.messages,
    output_config: { effort: chat.model.reasoningEffort as Anthropic.OutputConfig['effort'] },
  }
}

export function claudeOutcome(stopReason: string | null | undefined): StreamOutcome {
  if (stopReason === 'max_tokens' || stopReason === 'model_context_window_exceeded') return 'cut'
  if (stopReason === 'refusal') return 'blocked'
  return 'complete'
}

/**
 * Traduz os erros do SDK pelo name/errorCode/status/type, sem importar as classes
 * (importar tiraria o SDK do carregamento sob demanda).
 * `undefined` = a conexão caiu no meio ou o stream fechou antes do fim.
 */
export function claudeErrorKind(error: unknown): AiErrorKind | undefined {
  const { name, status, type, errorCode } = (error ?? {}) as ClaudeErrorShape
  if (name === 'APIConnectionTimeoutError') return 'timeout'
  if (name === 'APIConnectionError') return 'network'
  if (typeof errorCode === 'string' && SPEND_LIMIT_CODES.has(errorCode)) return 'no_credits'
  if (typeof status === 'number') return statusToErrorKind(status)
  if (typeof type === 'string') return TYPE_KINDS[type] ?? 'unavailable'
  return undefined
}
