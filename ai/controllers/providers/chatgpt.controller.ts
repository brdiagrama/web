import { CHATGPT_CONFIG } from '../../providers/chatgpt/chatgpt.config'
import { streamChatgpt } from '../../services/providers/chatgpt.service'
import { createProviderController } from '../provider-controller'

export const chatgptController = createProviderController(CHATGPT_CONFIG, streamChatgpt)
