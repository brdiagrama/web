<script setup lang="ts">
import { AlertCircle, CheckCircle, XCircle, Info } from "lucide-vue-next";
import { activeAlert, closeAlert } from "@/services/alertService";

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
  <v-dialog
    v-model="activeAlert.isVisible"
    max-width="440"
    scrim="rgba(0, 0, 0, 0.65)"
    transition="dialog-transition"
    @click:outside="closeAlert(false)"
  >
    <v-card class="alert-dialog-card" rounded="xl" elevation="12">
      <div class="pa-6 d-flex gap-4 align-start">
        <div class="alert-icon-box" :class="`is-${activeAlert.type || 'info'}`">
          <component :is="getIcon(activeAlert.type)" :size="24" />
        </div>

        <div class="flex-grow-1">
          <h3 class="text-h6 font-weight-bold mb-1 alert-title">{{ activeAlert.title || 'Aviso' }}</h3>
          <p class="text-body-2 alert-message">{{ activeAlert.message }}</p>
        </div>
      </div>

      <v-divider class="alert-divider" />

      <v-card-actions class="pa-4 justify-end gap-2">
        <v-btn
          v-if="activeAlert.hasCancel"
          variant="tonal"
          rounded="lg"
          class="alert-btn"
          @click="closeAlert(false)"
        >
          Cancelar
        </v-btn>
        <v-btn
          :color="activeAlert.type === 'error' ? 'error' : 'primary'"
          variant="flat"
          rounded="lg"
          class="alert-btn"
          @click="closeAlert(true)"
        >
          {{ activeAlert.buttonText || 'OK' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.alert-dialog-card {
  background-color: var(--clr-bg-surface) !important;
  border: 1px solid var(--clr-border) !important;
  color: var(--clr-text) !important;
}

.alert-title {
  color: var(--clr-text);
  line-height: 1.3;
}

.alert-message {
  color: var(--clr-text-muted);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.alert-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.alert-icon-box.is-success {
  background-color: rgba(26, 186, 156, 0.15);
  color: var(--clr-primary, #1aba9c);
}

.alert-icon-box.is-error {
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.alert-icon-box.is-warning {
  background-color: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.alert-icon-box.is-info {
  background-color: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.alert-divider {
  border-color: var(--clr-border) !important;
  opacity: 0.8;
}

.alert-btn {
  font-weight: 600 !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
}
</style>