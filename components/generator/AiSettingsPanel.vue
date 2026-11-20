<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { ChevronDown, ExternalLink } from "lucide-vue-next";
import DropdownSelect, { type DropdownItem } from "@/components/shared/DropdownSelect.vue";
import { useGeneratorTheme } from "@/composables/useGeneratorTheme";
import { useAiSettingsStore } from "@/ai/store/ai-settings.store";
import { validateApiKey } from "@/ai/shared/api-key";
import { describeAiError } from "@/ai/shared/errors";
import type { Creativity } from "@/ai/types";

const CREATIVITY_OPTIONS: { id: Creativity; label: string }[] = [
  { id: "preciso", label: "Preciso" },
  { id: "equilibrado", label: "Equilibrado" },
  { id: "criativo", label: "Criativo" },
];

const settings = useAiSettingsStore();
const { isModelingDark } = useGeneratorTheme();
const keyDraft = ref("");
const keyError = ref("");
const keyInput = ref<HTMLInputElement | null>(null);

const modelItems = computed<DropdownItem[]>(() =>
  settings.config.models.map((model) => ({ id: model.id, label: model.label })),
);
const currentModelLabel = computed(
  () => settings.config.models.find((model) => model.id === settings.model)?.label,
);

watch(
  () => settings.provider,
  () => {
    keyDraft.value = "";
    keyError.value = "";
  },
);

function saveKey() {
  try {
    settings.setApiKey(validateApiKey(keyDraft.value, settings.config));
    keyDraft.value = "";
    keyError.value = "";
  } catch (error) {
    keyError.value = describeAiError(error, settings.config);
  }
}

function forgetKey() {
  settings.forgetApiKey();
  nextTick(() => keyInput.value?.focus());
}
</script>

<template>
  <section class="ai-settings" aria-label="Configurações da IA">
    <div class="ai-settings-row">
      <span class="ai-settings-label">Modelo</span>
      <DropdownSelect
        :model-value="settings.model"
        :items="modelItems"
        :theme="isModelingDark ? 'dark' : 'light'"
        min-width="240px"
        @select="(item) => settings.setModel(String(item.id))"
      >
        <template #activator="{ props: menuProps, isOpen }">
          <button
            v-bind="menuProps"
            type="button"
            class="ai-settings-select"
            :class="{ 'is-active': isOpen }"
            :aria-label="`Escolher modelo (atual: ${currentModelLabel})`"
          >
            <span class="ai-settings-select-text">{{ currentModelLabel }}</span>
            <ChevronDown :size="13" class="ai-settings-chevron" :class="{ 'is-rotated': isOpen }" />
          </button>
        </template>
      </DropdownSelect>
    </div>

    <div class="ai-settings-row">
      <span id="ai-creativity-label" class="ai-settings-label">Criatividade</span>
      <div class="ai-settings-segmented" role="radiogroup" aria-labelledby="ai-creativity-label">
        <button
          v-for="option in CREATIVITY_OPTIONS"
          :key="option.id"
          type="button"
          role="radio"
          :aria-checked="settings.creativity === option.id"
          :class="{ 'is-selected': settings.creativity === option.id }"
          @click="settings.setCreativity(option.id)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div class="ai-settings-key">
      <span class="ai-settings-label">Chave de API do {{ settings.config.label }}</span>

      <div v-if="settings.apiKey" class="ai-settings-key-row">
        <span class="ai-settings-masked">••••{{ settings.apiKey.slice(-4) }}</span>
        <button type="button" class="ai-settings-btn" @click="forgetKey">Esquecer chave</button>
      </div>

      <!-- Input nativo fora de <form>: assim o navegador não oferece salvar a chave como senha. -->
      <div v-else class="ai-settings-key-row">
        <input
          ref="keyInput"
          v-model="keyDraft"
          type="password"
          autocomplete="off"
          spellcheck="false"
          data-1p-ignore
          data-lpignore="true"
          data-bwignore
          data-form-type="other"
          class="ai-settings-input"
          :aria-label="`Chave de API do ${settings.config.label}`"
          :placeholder="settings.config.keyPrefix ? `${settings.config.keyPrefix}…` : 'Cole sua chave aqui'"
          @keydown.enter.prevent="saveKey"
        />
        <button type="button" class="ai-settings-btn is-primary" :disabled="!keyDraft.trim()" @click="saveKey">
          Salvar chave
        </button>
      </div>

      <p v-if="keyError" class="ai-settings-error" role="alert">{{ keyError }}</p>

      <a :href="settings.config.keyConsoleUrl" target="_blank" rel="noopener noreferrer" class="ai-settings-link">
        Onde pego minha chave?
        <ExternalLink :size="11" />
      </a>
      <p class="ai-settings-note">{{ settings.config.keyHint }}</p>
      <p class="ai-settings-note">
        Sua chave fica só na memória desta página e é apagada quando você recarrega ou fecha a aba. Ela vai direto
        para o {{ settings.config.label }}; os servidores do BrDiagrama não recebem sua chave. Suas mensagens e o SQL
        do editor vão para o {{ settings.config.label }} a cada pergunta e, ao trocar de IA, a conversa vai junto.
        Dica: crie uma chave só para o BrDiagrama e, se o provedor permitir, defina um limite de gastos.
      </p>
    </div>
  </section>
</template>

<style scoped>
.ai-settings {
  /* Fica com no máximo metade da altura do chat e rola por dentro: a conversa e o campo de mensagem continuam visíveis. */
  flex: 0 1 auto;
  min-height: 0;
  max-height: 50%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 14px 12px;
  border-bottom: 1px solid var(--panel-border);
  background: var(--panel-surface);
  font-size: 12px;
}

.ai-settings-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ai-settings-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--panel-text);
}

.ai-settings-select {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 220px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  background: var(--panel-input-bg);
  color: var(--panel-text);
  font-size: 12px;
  cursor: pointer;
}

.ai-settings-select:hover,
.ai-settings-select.is-active {
  border-color: #1aba9c;
}

.ai-settings-select-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-settings-chevron {
  flex-shrink: 0;
  opacity: 0.7;
  transition: transform 0.2s ease;
}

.ai-settings-chevron.is-rotated {
  transform: rotate(180deg);
}

.ai-settings-segmented {
  display: inline-flex;
  padding: 2px;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  background: var(--panel-input-bg);
}

.ai-settings-segmented button {
  padding: 4px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--panel-text-muted);
  font-size: 12px;
  cursor: pointer;
}

.ai-settings-segmented button:hover {
  color: var(--panel-text);
}

.ai-settings-segmented button.is-selected {
  background: #1aba9c;
  color: #0f0f0f;
  font-weight: 600;
}

.ai-settings-key {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ai-settings-key-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-settings-input {
  flex: 1;
  min-width: 0;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  outline: none;
  background: var(--panel-input-bg);
  color: var(--panel-text);
  font: inherit;
  font-size: 12px;
}

.ai-settings-input:focus {
  border-color: #1aba9c;
}

.ai-settings-masked {
  flex: 1;
  font-family: "JetBrains Mono", monospace;
  color: var(--panel-text);
}

.ai-settings-btn {
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  background: transparent;
  color: var(--panel-text);
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
}

.ai-settings-btn:hover:not(:disabled) {
  background: var(--panel-hover);
}

.ai-settings-btn.is-primary {
  border-color: #1aba9c;
  background: #1aba9c;
  color: #0f0f0f;
  font-weight: 600;
}

.ai-settings-btn.is-primary:hover:not(:disabled) {
  background: #17a58a;
}

.ai-settings-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.ai-settings-error {
  margin: 0;
  color: #e5484d;
  line-height: 1.4;
}

.ai-settings-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  color: #1aba9c;
  text-decoration: none;
}

.ai-settings-link:hover {
  text-decoration: underline;
}

.ai-settings-note {
  margin: 0;
  color: var(--panel-text-muted);
  line-height: 1.45;
}
</style>
