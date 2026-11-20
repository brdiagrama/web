const EVENT_SEPARATOR = /\r\n\r\n|\n\n|\r\r/
const LINE_SEPARATOR = /\r\n|\r|\n/

/**
 * Lê um corpo Server-Sent Events e devolve o conteúdo de cada evento "data:".
 * Quem chama decide o que é fim ([DONE]); se a leitura cair no meio, a função só para,
 * e quem chama percebe que faltou o sinal de fim.
 */
export async function* readSseData(response: Response, signal: AbortSignal): AsyncGenerator<string> {
  const reader = response.body!.getReader()
  // Um único decoder com stream: true, para letra acentuada dividida entre dois pedaços não virar lixo.
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  while (true) {
    let chunk: ReadableStreamReadResult<Uint8Array>
    try {
      chunk = await reader.read()
    } catch (error) {
      if (signal.aborted) throw error
      return
    }
    // No fim, o resto sem linha em branco é um evento incompleto e é descartado (especificação SSE).
    if (chunk.done) return
    buffer += decoder.decode(chunk.value, { stream: true })
    const events = buffer.split(EVENT_SEPARATOR)
    buffer = events.pop() ?? ''
    for (const event of events) {
      const data = eventData(event)
      if (data !== undefined) yield data
    }
  }
}

/** Junta as linhas "data:" do evento; comentários (":"), "event:" e "id:" ficam de fora. */
function eventData(event: string): string | undefined {
  const lines = event
    .split(LINE_SEPARATOR)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(line.startsWith('data: ') ? 6 : 5))
  return lines.length ? lines.join('\n') : undefined
}
