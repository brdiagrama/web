import type { PreparedChat } from '../../types'
import { buildClaudeParams, claudeErrorKind, claudeOutcome } from '../../providers/claude/claude'
import { AiError } from '../../shared/errors'
import { streamEndNotice } from '../../shared/notices'

export async function* streamClaude(chat: PreparedChat): AsyncGenerator<string> {
  // Carregado só quando o Claude é usado.
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  // maxRetries: 0 é obrigatório: por padrão o SDK repete sozinho erros 408, 409, 429, 5xx e de rede.
  const client = new Anthropic({ apiKey: chat.apiKey, dangerouslyAllowBrowser: true, maxRetries: 0 })
  let hasText = false
  try {
    const stream = client.messages.stream(buildClaudeParams(chat), { signal: chat.signal })
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        hasText = true
        yield event.delta.text
      }
    }
    // Fica dentro do try: um erro do stream pode aparecer só aqui.
    const message = await stream.finalMessage()
    const notice = streamEndNotice(claudeOutcome(message.stop_reason), hasText)
    if (notice) yield notice
  } catch (error) {
    if (chat.signal.aborted || error instanceof AiError) throw error
    const kind = claudeErrorKind(error)
    if (!kind) {
      yield streamEndNotice('interrupted', hasText)
      return
    }
    throw new AiError(kind, (error as { apiMessage?: string | null }).apiMessage ?? undefined)
  }
}
