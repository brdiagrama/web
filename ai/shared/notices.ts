import type { StreamOutcome } from '../types'
import { AiError } from './errors'

const CUT_NOTICE = '\n\n[Resposta cortada: atingiu o limite de tamanho.]'
const STOPPED_NOTICE = '\n\n[O provedor interrompeu a resposta antes do fim.]'
const INTERRUPTED_NOTICE = '\n\n[A conexão caiu antes do fim da resposta.]'

/** Regra única de fim de resposta: devolve o aviso a somar no texto ('' quando não há) ou lança o erro. */
export function streamEndNotice(outcome: StreamOutcome, hasText: boolean, detail?: string): string {
  switch (outcome) {
    case 'complete':
      // Resposta que terminou sem nenhum texto não serve para o usuário.
      if (!hasText) throw new AiError('unavailable')
      return ''
    case 'cut':
      return CUT_NOTICE
    case 'stopped':
      if (!hasText) throw new AiError('unavailable')
      return STOPPED_NOTICE
    case 'interrupted':
      if (!hasText) throw new AiError('network')
      return INTERRUPTED_NOTICE
    case 'blocked':
      throw new AiError('blocked', detail)
  }
}
