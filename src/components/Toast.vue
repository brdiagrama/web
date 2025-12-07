<template>
  <Teleport to="body">
    <Transition name="toast-slide" appear>
      <div v-if="isVisible" class="toast-container" :class="`toast-${type}`">
        <div class="toast-content">
          <div class="toast-icon">
            <component :is="getIcon()" :size="20" />
          </div>
          <div class="toast-message">
            <p class="toast-title">{{ title }}</p>
            <p v-if="description" class="toast-description">{{ description }}</p>
          </div>
          <button class="toast-close" @click="close" title="Fechar">✕</button>
        </div>
        <div class="toast-progress" :style="{ animation: `progressBar ${duration}ms linear` }"></div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { CheckCircle, AlertCircle, XCircle, Info } from "lucide-vue-next";

const isVisible = ref(false);
const title = ref("");
const description = ref("");
const type = ref("success"); // success, error, warning, info
const duration = ref(4000); // 4 segundos por padrão
let timeoutId = null;

const getIcon = () => {
  switch (type.value) {
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

const show = (config) => {
  title.value = config.title || "Notificação";
  description.value = config.description || "";
  type.value = config.type || "info";
  duration.value = config.duration || 4000;
  isVisible.value = true;

  // Auto-fecha após o tempo
  if (timeoutId) clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    isVisible.value = false;
  }, duration.value);
};

const close = () => {
  isVisible.value = false;
  if (timeoutId) clearTimeout(timeoutId);
};

defineExpose({ show, close });
</script>

<style scoped>
.toast-slide-enter-active {
  animation: toastSlideIn 600ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-slide-leave-active {
  animation: toastSlideOut 300ms cubic-bezier(0.55, 0.085, 0.68, 0.53);
}

/* Animação de ENTRADA (Arrasta lateral com bounce e impacto) */
@keyframes toastSlideIn {
  0% {
    transform: translateX(120%) scale(0.8);
    opacity: 0;
  }
  60% {
    transform: translateX(-8px) scale(1.02);
    opacity: 1;
  }
  80% {
    transform: translateX(4px) scale(0.98);
  }
  100% {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
}

/* Animação de SAÍDA (Desliza suave para direita) */
@keyframes toastSlideOut {
  0% {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateX(120%) scale(0.9);
    opacity: 0;
  }
}

/* Container */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 99999;
  min-width: 320px;
  max-width: 420px;
  background: #1e293b;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05);
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, currentColor, transparent);
  opacity: 0.5;
}

/* Tipos de Toast */
.toast-success {
  border-left: 4px solid #10b981;
  color: #10b981;
}

.toast-error {
  border-left: 4px solid #ef4444;
  color: #ef4444;
}

.toast-warning {
  border-left: 4px solid #f59e0b;
  color: #f59e0b;
}

.toast-info {
  border-left: 4px solid #3b82f6;
  color: #3b82f6;
}

/* Conteúdo do Toast */
.toast-content {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  padding: 1rem 1.25rem;
}

.toast-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: bold;
}

.toast-success .toast-icon {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.toast-error .toast-icon {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.toast-warning .toast-icon {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.toast-info .toast-icon {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.toast-message {
  flex: 1;
  min-width: 0;
}

.toast-title {
  margin: 0 0 0.25rem 0;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.4;
  color: #e2e8f0;
}

.toast-description {
  margin: 0;
  font-size: 0.875rem;
  color: #94a3b8;
  line-height: 1.4;
}

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 16px;
  width: 24px;
  height: 24px;
}

.toast-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
}

.toast-progress {
  height: 3px;
  background: currentColor;
  width: 100%;
  opacity: 0.3;
}

@keyframes progressBar {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

@media (max-width: 640px) {
  .toast-container {
    bottom: 16px;
    right: 16px;
    left: 16px;
    max-width: none;
  }

  .toast-slide-enter-from,
  .toast-slide-leave-to {
    transform: translateX(calc(100% + 32px));
  }
}
</style>