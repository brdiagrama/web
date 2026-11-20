import { GEMINI_CONFIG } from '../../providers/gemini/gemini.config'
import { streamGemini } from '../../services/providers/gemini.service'
import { createProviderController } from '../provider-controller'

export const geminiController = createProviderController(GEMINI_CONFIG, streamGemini)
