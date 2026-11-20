export type ProviderId = 'chatgpt' | 'gemini' | 'grok' | 'deepseek' | 'claude' | 'openrouter'
export type Creativity = 'preciso' | 'equilibrado' | 'criativo'
export type StreamOutcome = 'complete' | 'cut' | 'stopped' | 'interrupted' | 'blocked'

export type AiErrorKind =
  | 'missing_key'
  | 'invalid_key_format'
  | 'invalid_key'
  | 'no_credits'
  | 'rate_limit'
  | 'model_not_found'
  | 'context_too_long'
  | 'forbidden'
  | 'blocked'
  | 'bad_request'
  | 'timeout'
  | 'unavailable'
  | 'network'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  error?: boolean
}

/** O que vai para a API: só papel e texto. */
export type ChatTurn = Pick<ChatMessage, 'role' | 'content'>

export interface AiModel {
  id: string
  label: string
  supportsTemperature: boolean
  /** Enviado só quando existe; cada provedor sabe em qual campo colocar. */
  reasoningEffort?: string
}

export interface AiProviderConfig {
  id: ProviderId
  label: string
  icon: string
  iconOnDark?: string
  /** O Claude não tem: o SDK usa o endereço dele. */
  endpoint?: string
  keyPrefix?: string
  keyConsoleUrl: string
  keyHint: string
  models: AiModel[]
  defaultModel: string
}

export interface AiChatRequest {
  provider: ProviderId
  model: string
  apiKey: string
  creativity: Creativity
  /** Já termina com a pergunta nova do usuário. */
  messages: ChatMessage[]
  context: { sql: string; dialect: string }
  signal: AbortSignal
}

export interface PreparedChat {
  model: AiModel
  apiKey: string
  systemPrompt: string
  messages: ChatTurn[]
  /** Só existe se o modelo aceitar temperatura. */
  temperature?: number
  signal: AbortSignal
}

export type ProviderService = (chat: PreparedChat) => AsyncGenerator<string>
export type ProviderController = (request: AiChatRequest) => AsyncGenerator<string>

/** Ajuste de erro próprio de um provedor; `undefined` quando não há regra. */
export type RefineError = (status: number, body: unknown) => { kind: AiErrorKind; detail?: string } | undefined
