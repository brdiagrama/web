<script setup lang="ts">
import { computed } from 'vue';
import { ChevronDown } from 'lucide-vue-next';
import { useDiagramStore } from '@/stores/diagram';
import { useGeneratorTheme } from '@/composables/useGeneratorTheme';
import DropdownSelect, { type DropdownItem } from '@/components/shared/DropdownSelect.vue';
import type { SqlDialect } from '@/domain/sql/parser';

import mysqlIcon from '@/assets/images/sgbd/mysql.svg';
import postgresqlIcon from '@/assets/images/sgbd/postgresql.svg';
import sqliteIcon from '@/assets/images/sgbd/sqlite.svg';
import mariadbDarkIcon from '@/assets/images/sgbd/mariadb.svg';
import mariadbLightIcon from '@/assets/images/sgbd/mariadblight.svg';
import sqlserverIcon from '@/assets/images/sgbd/sqlserver.svg';

const diagramStore = useDiagramStore();
const { isEditorDark } = useGeneratorTheme();

const sgbdItems = computed<DropdownItem[]>(() => [
  { id: 'MySQL', label: 'MySQL', icon: mysqlIcon, iconType: 'image' },
  { id: 'PostgreSQL', label: 'PostgreSQL', icon: postgresqlIcon, iconType: 'image' },
  { id: 'SQLite', label: 'SQLite', icon: sqliteIcon, iconType: 'image' },
  { id: 'MariaDB', label: 'MariaDB', icon: isEditorDark.value ? mariadbLightIcon : mariadbDarkIcon, iconType: 'image' },
  { id: 'TransactSQL', label: 'SQL Server', icon: sqlserverIcon, iconType: 'image' },
]);

const currentOption = computed(() => {
  return sgbdItems.value.find((opt) => opt.id === diagramStore.sqlDialect) || sgbdItems.value[0];
});

const handleSelect = (item: DropdownItem) => {
  diagramStore.setDialect(item.id as SqlDialect);
};
</script>

<template>
  <div class="sgbd-selector-wrapper">
    <DropdownSelect
      :model-value="diagramStore.sqlDialect"
      :items="sgbdItems"
      :theme="isEditorDark ? 'dark' : 'light'"
      location="bottom start"
      :offset="6"
      @select="handleSelect"
    >
      <template #activator="{ props: menuProps, isOpen }">
        <v-tooltip text="Selecionar Banco de Dados" location="bottom" :disabled="isOpen" :theme="isEditorDark ? 'dark' : 'light'">
          <template #activator="{ props: tooltipProps }">
            <button
              v-bind="{ ...menuProps, ...tooltipProps }"
              type="button"
              class="sgbd-trigger-btn"
              :class="[
                isEditorDark ? 'theme-dark' : 'theme-light',
                { 'is-active': isOpen }
              ]"
              aria-label="Selecionar dialeto de banco de dados"
            >
              <Transition name="sgbd-quick-fade" mode="out-in">
                <div :key="currentOption.id" class="sgbd-content-wrap">
                  <div class="sgbd-icon-box">
                    <img :src="currentOption.icon" :alt="currentOption.label" class="sgbd-icon-img" />
                  </div>
                  <span class="sgbd-name">{{ currentOption.label }}</span>
                </div>
              </Transition>
              <ChevronDown :size="13" class="sgbd-chevron" :class="{ 'is-rotated': isOpen }" />
            </button>
          </template>
        </v-tooltip>
      </template>
    </DropdownSelect>
  </div>
</template>

<style scoped>
.sgbd-selector-wrapper {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.sgbd-trigger-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 8px;
  border-radius: 8px;
  border: none !important;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background-color 0.15s ease, color 0.15s ease;
  user-select: none;
  background: transparent !important;
  white-space: nowrap;
  flex-shrink: 0;
}

.sgbd-content-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

/* Transição rápida e sutil de opacidade (80ms) */
.sgbd-quick-fade-enter-active,
.sgbd-quick-fade-leave-active {
  transition: opacity 0.08s ease-out;
}

.sgbd-quick-fade-enter-from,
.sgbd-quick-fade-leave-to {
  opacity: 0.2;
}

.sgbd-trigger-btn.theme-dark {
  color: #9AA0A6;
}

.sgbd-trigger-btn.theme-dark:hover,
.sgbd-trigger-btn.theme-dark.is-active {
  background-color: rgba(26, 186, 156, 0.15) !important;
  color: #1ABA9C !important;
}

.sgbd-trigger-btn.theme-light {
  color: #5E6368;
}

.sgbd-trigger-btn.theme-light:hover,
.sgbd-trigger-btn.theme-light.is-active {
  background-color: rgba(26, 186, 156, 0.12) !important;
  color: #1ABA9C !important;
}

.sgbd-icon-box {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sgbd-icon-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.sgbd-name {
  font-weight: 500;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.sgbd-chevron {
  opacity: 0.6;
  transition: transform 0.2s ease, opacity 0.2s ease;
  flex-shrink: 0;
}

.sgbd-trigger-btn:hover .sgbd-chevron,
.sgbd-trigger-btn.is-active .sgbd-chevron {
  opacity: 1;
}

.sgbd-chevron.is-rotated {
  transform: rotate(180deg);
}
</style>
