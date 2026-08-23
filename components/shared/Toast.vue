<template>
  <Teleport to="body">
    <Transition name="toast-slide" appear>
      <div v-if="activeToast.isVisible" :key="activeToast.id" class="toast-container" :class="`toast-${activeToast.type}`">
        <div class="toast-content">
          <div class="toast-icon">
            <component :is="getIcon(activeToast.type)" :size="20" />
          </div>
          <div class="toast-message">
            <p class="toast-title">{{ activeToast.title }}</p>
            <p v-if="activeToast.description" class="toast-description">{{ activeToast.description }}</p>
          </div>
          <button class="toast-close" @click="closeToast" title="Fechar">✕</button>
        </div>
        <div class="toast-progress" :style="{ animation: `progressBar ${activeToast.duration}ms linear` }"></div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { CheckCircle, AlertCircle, XCircle, Info } from "lucide-vue-next";
import { activeToast, closeToast } from "@/services/toastService";

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

.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 99999;
  min-width: 320px;
  max-width: 440px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 
    0 10px 25px -5px rgba(0, 0, 0, 0.5),
    0 8px 10px -6px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  color: #f8fafc;
  font-family: inherit;
}

.toast-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
}

.toast-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.toast-message {
  flex: 1;
}

.toast-title {
  margin: 0;
  font-weight: 600;
  font-size: 14px;
  color: #f8fafc;
  line-height: 1.4;
}

.toast-description {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s ease;
  line-height: 1;
  margin: -4px -4px 0 0;
}

.toast-close:hover {
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.1);
}

.toast-progress {
  height: 3px;
  width: 100%;
  transform-origin: left;
}

@keyframes progressBar {
  0% {
    transform: scaleX(1);
  }
  100% {
    transform: scaleX(0);
  }
}

/* Cores por tipo */
.toast-success .toast-icon {
  color: #10b981;
}
.toast-success .toast-progress {
  background: #10b981;
}
.toast-success {
  border-left: 4px solid #10b981;
}

.toast-error .toast-icon {
  color: #ef4444;
}
.toast-error .toast-progress {
  background: #ef4444;
}
.toast-error {
  border-left: 4px solid #ef4444;
}

.toast-warning .toast-icon {
  color: #f59e0b;
}
.toast-warning .toast-progress {
  background: #f59e0b;
}
.toast-warning {
  border-left: 4px solid #f59e0b;
}

.toast-info .toast-icon {
  color: #3b82f6;
}
.toast-info .toast-progress {
  background: #3b82f6;
}
.toast-info {
  border-left: 4px solid #3b82f6;
}
</style>