import { CLAUDE_CONFIG } from '../../providers/claude/claude.config'
import { streamClaude } from '../../services/providers/claude.service'
import { createProviderController } from '../provider-controller'

export const claudeController = createProviderController(CLAUDE_CONFIG, streamClaude)
