import { defineStore } from 'pinia'
import type { Creativity, ProviderId } from '../types'
import { getProviderConfig, isProviderId } from '../catalog'

const STORAGE_KEYS = {
  provider: 'brdiagrama-ai-provider',
  models: 'brdiagrama-ai-models',
  creativity: 'brdiagrama-ai-creativity',
  canEditSql: 'brdiagrama-ai-can-edit-sql',
}

const CREATIVITY_LEVELS: Creativity[] = ['preciso', 'equilibrado', 'criativo']

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {}
}

function loadProvider(): ProviderId {
  const stored = readStorage(STORAGE_KEYS.provider)
  return isProviderId(stored) ? stored : 'gemini'
}

function loadModels(): Partial<Record<ProviderId, string>> {
  try {
    const parsed = JSON.parse(readStorage(STORAGE_KEYS.models) ?? '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function loadCreativity(): Creativity {
  const stored = readStorage(STORAGE_KEYS.creativity)
  return CREATIVITY_LEVELS.find((level) => level === stored) ?? 'equilibrado'
}

/**
 * Provedor, modelo e criatividade ficam no localStorage (não são sensíveis).
 * As chaves ficam só na memória: nunca vão para nenhum armazenamento do navegador.
 */
export const useAiSettingsStore = defineStore('aiSettings', {
  state: () => ({
    provider: loadProvider(),
    modelByProvider: loadModels(),
    creativity: loadCreativity(),
    // Começa desligado: a IA só altera o SQL do editor se o usuário permitir.
    canEditSql: readStorage(STORAGE_KEYS.canEditSql) === 'true',
    apiKeys: {} as Partial<Record<ProviderId, string>>,
  }),
  getters: {
    config: (state) => getProviderConfig(state.provider),
    /** Se o modelo salvo saiu do catálogo, usa o padrão do provedor. */
    model: (state) => {
      const { models, defaultModel } = getProviderConfig(state.provider)
      const saved = state.modelByProvider[state.provider]
      return saved && models.some((model) => model.id === saved) ? saved : defaultModel
    },
    apiKey: (state) => state.apiKeys[state.provider] ?? '',
  },
  actions: {
    setProvider(provider: ProviderId) {
      this.provider = provider
      writeStorage(STORAGE_KEYS.provider, provider)
    },
    setModel(model: string) {
      this.modelByProvider[this.provider] = model
      writeStorage(STORAGE_KEYS.models, JSON.stringify(this.modelByProvider))
    },
    setCreativity(creativity: Creativity) {
      this.creativity = creativity
      writeStorage(STORAGE_KEYS.creativity, creativity)
    },
    setCanEditSql(value: boolean) {
      this.canEditSql = value
      writeStorage(STORAGE_KEYS.canEditSql, String(value))
    },
    setApiKey(key: string) {
      this.apiKeys[this.provider] = key
    },
    forgetApiKey() {
      delete this.apiKeys[this.provider]
    },
  },
})
