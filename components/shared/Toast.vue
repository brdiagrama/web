<script setup lang="ts">
import { CheckCircle, AlertCircle, XCircle, Info, X } from "lucide-vue-next";
import { activeToast, closeToast } from "@/services/toastService";

const getIcon = (type?: string) => {
  switch (type) {
    case "success":
      return CheckCircle;
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
    location="bottom end"
    class="custom-app-snackbar"
    rounded="lg"
    elevation="10"
  >
    <div class="toast-body">
      <div class="toast-icon-wrapper" :class="`is-${activeToast.type || 'info'}`">
        <component :is="getIcon(activeToast.type)" :size="20" />
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
        <X :size="16" />
      </v-btn>
    </template>
  </v-snackbar>
</template>

<style scoped>
:deep(.v-snackbar__wrapper) {
  background-color: var(--clr-bg-surface) !important;
  border: 1px solid var(--clr-border) !important;
  color: var(--clr-text) !important;
  min-width: 300px !important;
  max-width: 440px !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25) !important;
}

.toast-body {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toast-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toast-icon-wrapper.is-success {
  color: var(--clr-primary, #1aba9c);
}

.toast-icon-wrapper.is-error {
  color: #ef4444;
}

.toast-icon-wrapper.is-warning {
  color: #f59e0b;
}

.toast-icon-wrapper.is-info {
  color: #3b82f6;
}

.toast-text-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toast-main-title {
  font-weight: 600;
  font-size: 13.5px;
  color: var(--clr-text);
  line-height: 1.3;
}

.toast-desc-text {
  font-size: 12.5px;
  color: var(--clr-text-muted);
  line-height: 1.3;
}

.toast-close-btn {
  color: var(--clr-text-muted) !important;
}

.toast-close-btn:hover {
  color: var(--clr-text) !important;
}
</style>