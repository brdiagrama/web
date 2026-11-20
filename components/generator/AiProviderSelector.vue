<script setup lang="ts">
import { computed, reactive } from "vue";
import { Bot, ChevronDown } from "lucide-vue-next";
import DropdownSelect, { type DropdownItem } from "@/components/shared/DropdownSelect.vue";
import { useGeneratorTheme } from "@/composables/useGeneratorTheme";
import { AI_PROVIDERS } from "@/ai/catalog";
import { useAiSettingsStore } from "@/ai/store/ai-settings.store";
import type { AiProviderConfig, ProviderId } from "@/ai/types";

const settings = useAiSettingsStore();
const { isModelingDark } = useGeneratorTheme();

// Logo que não carregou (ex.: arquivo ainda não colocado em public/ai-providers) vira o ícone de robô.
const brokenLogos = reactive(new Set<string>());

function logoOf(provider: AiProviderConfig): string {
  return isModelingDark.value && provider.iconOnDark ? provider.iconOnDark : provider.icon;
}

const items = computed<DropdownItem[]>(() =>
  AI_PROVIDERS.map((provider) => ({ id: provider.id, label: provider.label, icon: logoOf(provider), iconType: "image" })),
);

const currentLogo = computed(() => logoOf(settings.config));

function handleSelect(item: DropdownItem) {
  settings.setProvider(item.id as ProviderId);
}
</script>

<template>
  <DropdownSelect
    :model-value="settings.provider"
    :items="items"
    :theme="isModelingDark ? 'dark' : 'light'"
    location="bottom start"
    :offset="6"
    @select="handleSelect"
  >
    <template #activator="{ props: menuProps, isOpen }">
      <v-tooltip
        text="Escolher IA"
        location="bottom"
        :disabled="isOpen"
        :theme="isModelingDark ? 'dark' : 'light'"
      >
        <template #activator="{ props: tooltipProps }">
          <button
            v-bind="{ ...menuProps, ...tooltipProps }"
            type="button"
            class="ai-provider-btn"
            :class="[isModelingDark ? 'theme-dark' : 'theme-light', { 'is-active': isOpen }]"
            :aria-label="`Escolher IA (atual: ${settings.config.label})`"
          >
            <span class="ai-logo-box">
              <img
                v-if="!brokenLogos.has(currentLogo)"
                :src="currentLogo"
                alt=""
                width="16"
                height="16"
                @error="brokenLogos.add(currentLogo)"
              />
              <Bot v-else :size="15" />
            </span>
            <span class="ai-provider-name">{{ settings.config.label }}</span>
            <ChevronDown :size="13" class="ai-provider-chevron" :class="{ 'is-rotated': isOpen }" />
          </button>
        </template>
      </v-tooltip>
    </template>

    <template #prepend="{ item }">
      <span class="ai-logo-box ai-logo-item">
        <img
          v-if="!brokenLogos.has(item.icon)"
          :src="item.icon"
          alt=""
          width="16"
          height="16"
          @error="brokenLogos.add(item.icon)"
        />
        <Bot v-else :size="15" />
      </span>
    </template>
  </DropdownSelect>
</template>

<style scoped>
.ai-provider-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 8px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.ai-provider-btn.theme-dark {
  color: #9aa0a6;
}

.ai-provider-btn.theme-light {
  color: #5e6368;
}

.ai-provider-btn.theme-dark:hover,
.ai-provider-btn.theme-dark.is-active {
  background-color: rgba(26, 186, 156, 0.15);
  color: #1aba9c;
}

.ai-provider-btn.theme-light:hover,
.ai-provider-btn.theme-light.is-active {
  background-color: rgba(26, 186, 156, 0.12);
  color: #1aba9c;
}

.ai-logo-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.ai-logo-box img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.ai-logo-item {
  margin-right: 8px;
}

.ai-provider-chevron {
  opacity: 0.6;
  flex-shrink: 0;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.ai-provider-btn:hover .ai-provider-chevron,
.ai-provider-btn.is-active .ai-provider-chevron {
  opacity: 1;
}

.ai-provider-chevron.is-rotated {
  transform: rotate(180deg);
}
</style>
