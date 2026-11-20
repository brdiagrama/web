import type { AiErrorKind, RefineError } from '../types'
import { AiError, extractErrorMessage, statusToErrorKind } from './errors'

interface PostStreamOptions {
  url: string
  headers: Record<string, string>
  body: unknown
  signal: AbortSignal
  refineError?: RefineError
}

/** Faz o POST e só devolve a resposta quando ela é mesmo um stream; senão lança AiError. */
export async function postStream({ url, headers, body, signal, refineError }: PostStreamOptions): Promise<Response> {
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      // Campos com valor undefined (ex.: temperature em modelo sem suporte) somem no JSON.
      body: JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error instanceof TypeError) throw new AiError('network')
    throw error
  }
  if (!response.ok) {
    throw await responseError(response, response.status, statusToErrorKind(response.status), refineError)
  }
  // O Grok pode responder 200 com um JSON de erro no lugar do stream.
  if (!response.headers.get('content-type')?.includes('text/event-stream')) {
    throw await responseError(response, 200, 'unavailable', refineError)
  }
  return response
}

async function responseError(
  response: Response,
  status: number,
  defaultKind: AiErrorKind,
  refineError?: RefineError,
): Promise<AiError> {
  const body = await readJson(response)
  const refined = refineError?.(status, body)
  return new AiError(refined?.kind ?? defaultKind, refined?.detail ?? extractErrorMessage(body))
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}
