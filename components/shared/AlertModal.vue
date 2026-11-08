<script setup lang="ts">
import { AlertTriangle, CheckCircle2, XCircle, Info } from "lucide-vue-next";
import { activeAlert, closeAlert } from "@/services/alertService";
import { useGeneratorTheme } from "@/composables/useGeneratorTheme";

const { isCanvasDark } = useGeneratorTheme();

const getIcon = (type?: string) => {
  switch (type) {
    case "success":
      return CheckCircle2;
    case "error":
      return XCircle;
    case "warning":
      return AlertTriangle;
    default:
      return Info;
  }
};

const isDestructive = () => {
  const text = (activeAlert.value.buttonText || "").toLowerCase();
  return (
    activeAlert.value.type === "error" ||
    text.includes("limpar") ||
    text.includes("excluir") ||
    text.includes("deletar") ||
    text.includes("apagar")
  );
};
</script>

<template>
  <v-dialog
    v-model="activeAlert.isVisible"
    max-width="390"
    :theme="isCanvasDark ? 'dark' : 'light'"
    scrim="rgba(0, 0, 0, 0.55)"
    transition="dialog-transition"
    @click:outside="closeAlert(false)"
    @keydown.esc="closeAlert(false)"
  >
    <v-card
      class="modal-card"
      :class="isCanvasDark ? 'modal-dark' : 'modal-light'"
      rounded="xl"
    >
      <div class="modal-content">
        <div class="modal-icon" :class="`type-${activeAlert.type || 'info'}`">
          <component :is="getIcon(activeAlert.type)" :size="22" stroke-width="2.2" />
        </div>

        <div class="modal-text">
          <h3 class="modal-title">{{ activeAlert.title || 'Aviso' }}</h3>
          <p class="modal-message">{{ activeAlert.message }}</p>
        </div>
      </div>

      <v-card-actions class="modal-actions">
        <v-btn
          v-if="activeAlert.hasCancel"
          variant="text"
          rounded="lg"
          class="btn-cancel"
          @click="closeAlert(false)"
        >
          Cancelar
        </v-btn>

        <v-btn
          :color="isDestructive() ? 'error' : 'primary'"
          variant="flat"
          rounded="lg"
          class="btn-action"
          @click="closeAlert(true)"
        >
          {{ activeAlert.buttonText || 'OK' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.modal-card {
  border: none !important;
  padding: 8px;
  overflow: hidden;
}

.modal-dark {
  background-color: #1E1E1E !important;
  color: #F0F0F0 !important;
  box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.75), 0 0 1px rgba(255, 255, 255, 0.1) !important;
}

.modal-dark .modal-title {
  color: #F0F0F0;
}

.modal-dark .modal-message {
  color: #9AA0A6;
}

.modal-dark .btn-cancel {
  color: #9AA0A6 !important;
}

.modal-dark .btn-cancel:hover {
  background-color: rgba(255, 255, 255, 0.08) !important;
  color: #FFFFFF !important;
}

.modal-light {
  background-color: #FFFFFF !important;
  color: #1F1F1F !important;
  box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.18), 0 2px 10px rgba(0, 0, 0, 0.06) !important;
}

.modal-light .modal-title {
  color: #1F1F1F;
}

.modal-light .modal-message {
  color: #5E6368;
}

.modal-light .btn-cancel {
  color: #5E6368 !important;
}

.modal-light .btn-cancel:hover {
  background-color: #EBEBEB !important;
  color: #1F1F1F !important;
}

.modal-content {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 16px 12px 16px;
}

.modal-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: none !important;
  flex-shrink: 0;
}

.modal-icon.type-warning {
  background-color: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
}

.modal-icon.type-error {
  background-color: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.modal-icon.type-success {
  background-color: rgba(26, 186, 156, 0.12);
  color: #1aba9c;
}

.modal-icon.type-info {
  background-color: rgba(59, 130, 246, 0.12);
  color: #3b82f6;
}

.modal-text {
  flex: 1;
  min-width: 0;
}

.modal-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 4px 0;
  line-height: 1.3;
}

.modal-message {
  font-size: 13px;
  margin: 0;
  line-height: 1.5;
  word-break: break-word;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 12px 12px 12px;
}

.btn-cancel {
  font-size: 13px !important;
  font-weight: 500 !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
  padding: 0 14px !important;
  height: 34px !important;
  border: none !important;
}

.btn-action {
  font-size: 13px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
  padding: 0 16px !important;
  height: 34px !important;
  border: none !important;
  box-shadow: none !important;
}
</style>