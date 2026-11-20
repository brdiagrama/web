import { DEEPSEEK_CONFIG } from '../../providers/deepseek/deepseek.config'
import { streamDeepseek } from '../../services/providers/deepseek.service'
import { createProviderController } from '../provider-controller'

export const deepseekController = createProviderController(DEEPSEEK_CONFIG, streamDeepseek)
