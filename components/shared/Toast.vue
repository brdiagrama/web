<script setup lang="ts">
import { Check, AlertCircle, XCircle, Info, X } from "lucide-vue-next";
import { activeToast, closeToast } from "@/services/toastService";

const getIcon = (type?: string) => {
  switch (type) {
    case "success":
      return Check;
    case "error":
      return XCircle;
    case "warning":
      return AlertCircle;
    default:
      return Info;
  }
};
</script>

<template>
  <v-snackbar
    v-model="activeToast.isVisible"
    :timeout="activeToast.duration"
    location="top end"
    class="custom-app-snackbar"
    :class="`toast-${activeToast.type || 'info'}`"
    rounded="lg"
  >
    <div class="toast-body">
      <div class="toast-icon-wrapper" :class="`is-${activeToast.type || 'info'}`">
        <component :is="getIcon(activeToast.type)" :size="16" stroke-width="2.5" />
      </div>

      <div class="toast-text-group">
        <span class="toast-main-title">{{ activeToast.title }}</span>
        <span v-if="activeToast.description" class="toast-desc-text">{{ activeToast.description }}</span>
      </div>
    </div>

    <template #actions>
      <v-btn
        icon
        variant="text"
        size="x-small"
        class="toast-close-btn"
        aria-label="Fechar notificação"
        @click="closeToast"
      >
        <X :size="14" />
      </v-btn>
    </template>
  </v-snackbar>
</template>

<style scoped>
:deep(.v-snackbar__wrapper) {
  border: none !important;
  box-shadow: none !important;
  min-width: auto !important;
  max-width: 360px !important;
  min-height: 36px !important;
  border-radius: 10px !important;
  padding: 4px 10px !important;
}

.toast-success :deep(.v-snackbar__wrapper) {
  background-color: var(--clr-primary, #1ABA9C) !important;
}

.toast-error :deep(.v-snackbar__wrapper) {
  background-color: #EF4444 !important;
}

.toast-warning :deep(.v-snackbar__wrapper) {
  background-color: #F59E0B !important;
}

.toast-info :deep(.v-snackbar__wrapper) {
  background-color: #2563EB !important;
}

.toast-main-title {
  color: #FFFFFF !important;
  font-weight: 500;
  font-size: 13px;
  line-height: 1.25;
}

.toast-desc-text {
  color: rgba(255, 255, 255, 0.88) !important;
  font-size: 11.5px;
  line-height: 1.25;
}

.toast-close-btn {
  color: rgba(255, 255, 255, 0.75) !important;
  border: none !important;
  border-radius: 6px !important;
  width: 24px !important;
  height: 24px !important;
  min-width: 24px !important;
  padding: 0 !important;
}

.toast-close-btn:hover {
  background-color: rgba(255, 255, 255, 0.16) !important;
  color: #FFFFFF !important;
}

.toast-body {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toast-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #FFFFFF !important;
}

.toast-text-group {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
</style>