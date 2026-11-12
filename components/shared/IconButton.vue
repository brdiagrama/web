<template>
  <v-tooltip 
    v-if="tooltip"
    :text="tooltip" 
    :location="tooltipLocation" 
    :theme="theme"
    :disabled="disabled"
  >
    <template #activator="{ props: tooltipProps }">
      <v-btn
        v-bind="tooltipProps"
        icon
        variant="text"
        :size="size"
        class="action-icon-btn"
        :class="[
          theme === 'dark' ? 'btn-dark' : 'btn-light',
          { 'is-active': active }
        ]"
        :disabled="disabled"
        :aria-label="ariaLabel || tooltip"
        @click.stop="handleClick"
      >
        <slot />
      </v-btn>
    </template>
  </v-tooltip>

  <v-btn
    v-else
    icon
    variant="text"
    :size="size"
    class="action-icon-btn"
    :class="[
      theme === 'dark' ? 'btn-dark' : 'btn-light',
      { 'is-active': active }
    ]"
    :disabled="disabled"
    :aria-label="ariaLabel"
    @click.stop="handleClick"
  >
    <slot />
  </v-btn>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    tooltip?: string;
    tooltipLocation?: 'top' | 'bottom' | 'left' | 'right';
    theme?: 'dark' | 'light';
    size?: 'x-small' | 'small' | 'default' | 'large';
    active?: boolean;
    disabled?: boolean;
    ariaLabel?: string;
  }>(),
  {
    tooltipLocation: 'bottom',
    theme: 'dark',
    size: 'small',
    active: false,
    disabled: false,
  }
);

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

const handleClick = (event: MouseEvent) => {
  emit('click', event);
};
</script>

<style scoped>
.action-icon-btn {
  border-radius: 8px !important;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.15s ease !important;
  flex-shrink: 0;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  vertical-align: middle !important;
}

.action-icon-btn.btn-dark {
  color: #9AA0A6 !important;
}

.action-icon-btn.btn-dark:hover,
.action-icon-btn.btn-dark.is-active {
  background-color: rgba(26, 186, 156, 0.15) !important;
  color: #1ABA9C !important;
}

.action-icon-btn.btn-light {
  color: #5E6368 !important;
}

.action-icon-btn.btn-light:hover,
.action-icon-btn.btn-light.is-active {
  background-color: rgba(26, 186, 156, 0.12) !important;
  color: #1ABA9C !important;
}

.action-icon-btn:active {
  transform: scale(0.94);
}
</style>

