import type { AiErrorKind, AiProviderConfig } from '../types'

export class AiError extends Error {
  kind: AiErrorKind
  detail?: string

  constructor(kind: AiErrorKind, detail?: string) {
    super(kind)
    this.name = 'AiError'
    this.kind = kind
    this.detail = detail
  }
}

const STATUS_KINDS: Record<number, AiErrorKind> = {
  401: 'invalid_key',
  402: 'no_credits',
  403: 'forbidden',
  404: 'model_not_found',
  408: 'timeout',
  413: 'context_too_long',
  429: 'rate_limit',
  504: 'timeout',
  524: 'timeout',
}

export function statusToErrorKind(status: number): AiErrorKind {
  return STATUS_KINDS[status] ?? (status >= 400 && status < 500 ? 'bad_request' : 'unavailable')
}

/** Lê a mensagem dos formatos { error: { message } }, { code, error: "texto" } e { error: "texto" }. */
export function extractErrorMessage(body: unknown): string | undefined {
  const error = (body as { error?: unknown } | null | undefined)?.error
  if (typeof error === 'string') return error
  const { message, metadata } = (error ?? {}) as { message?: unknown; metadata?: { remedy_hint?: unknown } }
  if (typeof metadata?.remedy_hint === 'string') return metadata.remedy_hint
  return typeof message === 'string' ? message : undefined
}

const MESSAGES: Record<AiErrorKind, (config: AiProviderConfig) => string> = {
  missing_key: ({ label }) => `Cole sua chave de API do ${label} para começar.`,
  invalid_key_format: ({ label, keyPrefix }) =>
    `Essa chave não parece ser do ${label}.${keyPrefix ? ` Ela deve começar com ${keyPrefix}.` : ''}`,
  invalid_key: ({ label, keyConsoleUrl }) =>
    `O ${label} recusou a chave. Confira se copiou certo ou gere outra em ${keyConsoleUrl}.`,
  no_credits: ({ label }) => `Sua conta no ${label} está sem créditos ou chegou ao limite de gastos.`,
  rate_limit: ({ label }) => `Limite de uso atingido no ${label}. Espere um pouco e tente de novo.`,
  model_not_found: () => 'Esse modelo não existe ou sua conta não tem acesso a ele. Escolha outro modelo.',
  context_too_long: () => 'A conversa ficou grande demais para este modelo. Limpe o chat e tente de novo.',
  forbidden: ({ label }) => `O ${label} negou o acesso (chave bloqueada, permissão ou região).`,
  blocked: ({ label }) => `O ${label} bloqueou esta resposta pelas regras de conteúdo dele.`,
  bad_request: ({ label }) => `O ${label} recusou o pedido.`,
  timeout: ({ label }) => `O ${label} demorou demais para responder. Tente de novo.`,
  unavailable: ({ label }) => `O ${label} está instável ou sobrecarregado. Tente de novo em instantes.`,
  network: ({ label }) => `Não foi possível conectar ao ${label}. Verifique sua internet.`,
}

export function describeAiError(error: unknown, config: AiProviderConfig): string {
  if (!(error instanceof AiError)) return MESSAGES.unavailable(config)
  const message = MESSAGES[error.kind](config)
  return error.detail ? `${message} Detalhe: ${error.detail}` : message
}
