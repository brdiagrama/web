import type { AiChatRequest, AiProviderConfig, ProviderController, ProviderService } from '../types'
import { validateApiKey } from '../shared/api-key'
import { AiError } from '../shared/errors'
import { orchestrateChat } from '../services/orchestrator.service'

/** Validação igual para todos os provedores: chave e modelo, antes de passar para o orquestrador. */
export function createProviderController(config: AiProviderConfig, service: ProviderService): ProviderController {
  return async function* (request: AiChatRequest) {
    const apiKey = validateApiKey(request.apiKey, config)
    const model = config.models.find((item) => item.id === request.model)
    if (!model) throw new AiError('model_not_found')
    yield* orchestrateChat({ ...request, apiKey }, model, service)
  }
}
