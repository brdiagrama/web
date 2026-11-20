import { GROK_CONFIG } from '../../providers/grok/grok.config'
import { streamGrok } from '../../services/providers/grok.service'
import { createProviderController } from '../provider-controller'

export const grokController = createProviderController(GROK_CONFIG, streamGrok)
