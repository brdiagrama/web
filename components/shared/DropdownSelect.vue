<template>
  <v-menu
    v-model="isOpen"
    :location="location"
    :offset="offset"
    :close-on-content-click="true"
  >
    <template #activator="{ props: menuProps }">
      <slot
        name="activator"
        :props="menuProps"
        :is-open="isOpen"
        :selected-item="selectedItem"
      />
    </template>

    <v-list
      class="custom-dropdown-list"
      :class="theme === 'dark' ? 'dropdown-dark' : 'dropdown-light'"
      :style="{ minWidth }"
      density="compact"
      rounded="lg"
      elevation="0"
    >
      <slot>
        <v-list-item
          v-for="item in items"
          :key="item.id"
          class="dropdown-item"
          :class="{ 'is-selected': isItemSelected(item) }"
          :disabled="item.disabled"
          rounded="md"
          @click="handleItemClick(item)"
        >
          <template #prepend>
            <slot name="prepend" :item="item">
              <div v-if="item.icon" class="item-icon-wrapper">
                <img
                  v-if="item.iconType === 'image' || isImageUrl(item.icon)"
                  :src="item.icon"
                  :alt="item.label"
                  class="item-icon-img"
                  width="16"
                  height="16"
                />
                <component
                  :is="item.icon"
                  v-else
                  :size="16"
                  class="item-icon-component"
                />
              </div>
            </slot>
          </template>

          <v-list-item-title class="item-title">
            <slot name="label" :item="item">
              {{ item.label }}
            </slot>
          </v-list-item-title>

          <template #append>
            <slot name="append" :item="item" />
          </template>
        </v-list-item>
      </slot>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

export interface DropdownItem {
  id: string | number;
  label: string;
  icon?: any;
  iconType?: 'component' | 'image';
  disabled?: boolean;
  action?: () => void;
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null;
    items?: DropdownItem[];
    theme?: 'dark' | 'light';
    location?: any;
    offset?: number;
    minWidth?: string;
  }>(),
  {
    modelValue: null,
    items: () => [],
    theme: 'dark',
    location: 'bottom start',
    offset: 6,
    minWidth: '170px',
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
  (e: 'select', item: DropdownItem): void;
}>();

const isOpen = ref(false);

const selectedItem = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) return null;
  return props.items.find((item) => item.id === props.modelValue) || null;
});

const isItemSelected = (item: DropdownItem) => {
  return props.modelValue !== null && props.modelValue !== undefined && props.modelValue === item.id;
};

const isImageUrl = (icon: any) => {
  return typeof icon === 'string' && (icon.includes('/') || icon.endsWith('.svg') || icon.startsWith('data:'));
};

const handleItemClick = (item: DropdownItem) => {
  if (item.disabled) return;
  if (props.modelValue !== null && props.modelValue !== undefined) {
    emit('update:modelValue', item.id);
  }
  if (item.action) {
    item.action();
  }
  emit('select', item);
  isOpen.value = false;
};
</script>

<style scoped>
.custom-dropdown-list {
  padding: 6px !important;
  box-sizing: border-box;
}

.custom-dropdown-list.dropdown-dark {
  background-color: #1F1F1F !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  color: #F0F0F0 !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
}

.custom-dropdown-list.dropdown-light {
  background-color: #FFFFFF !important;
  border: 1px solid rgba(0, 0, 0, 0.08) !important;
  color: #1F1F1F !important;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08) !important;
}

.dropdown-item {
  cursor: pointer;
  padding: 8px 12px !important;
  min-height: 36px !important;
  border-radius: 6px !important;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.dropdown-dark .dropdown-item {
  color: #F0F0F0 !important;
}

.dropdown-light .dropdown-item {
  color: #1F1F1F !important;
}

.dropdown-dark .dropdown-item:hover {
  background-color: rgba(26, 186, 156, 0.15) !important;
  color: #1ABA9C !important;
}

.dropdown-light .dropdown-item:hover {
  background-color: rgba(26, 186, 156, 0.12) !important;
  color: #1ABA9C !important;
}

.dropdown-item.is-selected {
  color: #1ABA9C !important;
  font-weight: 600 !important;
}

.dropdown-dark .dropdown-item.is-selected {
  background-color: rgba(26, 186, 156, 0.1) !important;
}

.dropdown-light .dropdown-item.is-selected {
  background-color: rgba(26, 186, 156, 0.08) !important;
}

.item-icon-wrapper {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  flex-shrink: 0;
}

.item-icon-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.item-icon-component {
  flex-shrink: 0;
}

.item-title {
  font-size: 13px !important;
  font-weight: 500 !important;
}
</style>
