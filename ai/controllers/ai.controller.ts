import type { AiChatRequest, ProviderController, ProviderId } from '../types'
import { chatgptController } from './providers/chatgpt.controller'
import { geminiController } from './providers/gemini.controller'
import { grokController } from './providers/grok.controller'
import { deepseekController } from './providers/deepseek.controller'
import { claudeController } from './providers/claude.controller'
import { openrouterController } from './providers/openrouter.controller'

const PROVIDER_CONTROLLERS: Record<ProviderId, ProviderController> = {
  chatgpt: chatgptController,
  gemini: geminiController,
  grok: grokController,
  deepseek: deepseekController,
  claude: claudeController,
  openrouter: openrouterController,
}

/** Único caminho da tela para enviar mensagens: cada provedor tem endpoint e formato próprios. */
export function sendChatMessage(request: AiChatRequest): AsyncGenerator<string> {
  return PROVIDER_CONTROLLERS[request.provider](request)
}
