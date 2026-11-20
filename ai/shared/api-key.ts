import type { AiProviderConfig } from '../types'
import { AI_PROVIDERS } from '../catalog'
import { AiError } from './errors'

const VISIBLE_ASCII = /^[\x21-\x7E]+$/

/** Devolve a chave limpa ou lança AiError explicando por que ela não serve para este provedor. */
export function validateApiKey(rawKey: string, config: AiProviderConfig): string {
  const key = rawKey.trim()
  if (!key) throw new AiError('missing_key')
  if (!VISIBLE_ASCII.test(key)) {
    throw new AiError('invalid_key_format', 'A chave tem espaço, quebra de linha ou caractere inválido.')
  }
  if (config.keyPrefix && !key.startsWith(config.keyPrefix)) throw new AiError('invalid_key_format')
  const owners = providersOwningKey(key, config)
  if (owners.length) throw new AiError('invalid_key_format', `Ela parece ser do ${owners.join(' ou do ')}.`)
  return key
}

/**
 * Outros provedores cujo prefixo, mais longo que o deste, casa com a chave.
 * Fica só com o prefixo mais longo, e cita todos os provedores que o usam (ex.: `sk-`: ChatGPT e DeepSeek).
 */
function providersOwningKey(key: string, config: AiProviderConfig): string[] {
  const ownLength = config.keyPrefix?.length ?? 0
  const matches = AI_PROVIDERS.flatMap((provider) => {
    const prefix = provider.keyPrefix
    const owns = provider.id !== config.id && prefix && prefix.length > ownLength && key.startsWith(prefix)
    return owns ? [{ label: provider.label, length: prefix.length }] : []
  })
  const longest = Math.max(0, ...matches.map((match) => match.length))
  return matches.filter((match) => match.length === longest).map((match) => match.label)
}
