import { OPENROUTER_CONFIG } from '../../providers/openrouter/openrouter.config'
import { streamOpenrouter } from '../../services/providers/openrouter.service'
import { createProviderController } from '../provider-controller'

export const openrouterController = createProviderController(OPENROUTER_CONFIG, streamOpenrouter)
