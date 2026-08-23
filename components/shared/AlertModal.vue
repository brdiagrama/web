<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="activeAlert.isVisible" class="alert-overlay" @click="handleBackdropClick">
        <Transition name="modal-scale">
          <div v-if="activeAlert.isVisible" class="alert-card" :class="`alert-${activeAlert.type}`">
            <div class="alert-content">
              <!-- Ícone à esquerda -->
              <div class="alert-icon-side">
                <div class="alert-icon-wrapper">
                  <component :is="getIcon(activeAlert.type)" :size="28" class="alert-icon" />
                </div>
              </div>

              <!-- Texto à direita -->
              <div class="alert-text-side">
                <h2 class="alert-title">{{ activeAlert.title }}</h2>
                <p class="alert-message">{{ activeAlert.message }}</p>
              </div>
            </div>

            <!-- Footer -->
            <div class="alert-footer">
              <button class="btn btn-secondary" @click="closeAlert(false)" v-if="activeAlert.hasCancel">
                Cancelar
              </button>
              <button 
                class="btn" 
                :class="activeAlert.type === 'error' ? 'btn-danger' : 'btn-primary'" 
                @click="closeAlert(true)"
              >
                {{ activeAlert.buttonText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { AlertCircle, CheckCircle, XCircle, Info } from "lucide-vue-next";
import { activeAlert, closeAlert } from "@/services/alertService";

const getIcon = (type) => {
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

const handleBackdropClick = (e) => {
  if (e.target === e.currentTarget) {
    closeAlert(false);
  }
};
</script>

<style scoped>
.alert-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 99998;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.alert-card {
  background: #1e293b;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.7),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  width: 100%;
  max-width: 440px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.alert-content {
  display: flex;
  gap: 16px;
  padding: 24px;
}

.alert-icon-side {
  flex-shrink: 0;
}

.alert-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.alert-text-side {
  flex: 1;
}

.alert-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 700;
  color: #f8fafc;
  line-height: 1.3;
}

.alert-message {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.alert-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: rgba(15, 23, 42, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: #10b981;
  color: white;
}
.btn-primary:hover {
  background: #059669;
  transform: translateY(-1px);
}

.btn-danger {
  background: #ef4444;
  color: white;
}
.btn-danger:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
}

/* Cores dos Ícones e Wrappers */
.alert-success .alert-icon-wrapper {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}
.alert-error .alert-icon-wrapper {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}
.alert-warning .alert-icon-wrapper {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}
.alert-info .alert-icon-wrapper {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

/* Animações */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-scale-enter-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-scale-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-scale-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}

.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>