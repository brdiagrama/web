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
/* Transição de SLIDE (arrastar lateral) */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 320ms ease;
}

.toast-slide-enter-from {
  transform: translateX(400px);
  opacity: 0;
}

.toast-slide-leave-to {
  transform: translateX(400px);
  opacity: 0;
}

/* Container */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 99999;
  min-width: 320px;
  max-width: 420px;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

/* Tipos de Toast */
.toast-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.toast-error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.toast-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.toast-info {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

/* Conteúdo do Toast */
.toast-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 16px;
  color: #ffffff;
}

.toast-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.toast-message {
  flex: 1;
  min-width: 0;
}

.toast-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.2px;
}

.toast-description {
  margin: 0;
  font-size: 12px;
  opacity: 0.9;
  line-height: 1.4;
}

.toast-close {
  flex-shrink: 0;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-size: 18px;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.toast-close:hover {
  color: rgba(255, 255, 255, 1);
}

/* Barra de progresso */
.toast-progress {
  height: 3px;
  background: rgba(255, 255, 255, 0.4);
  width: 100%;
}

@keyframes progressBar {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

/* Mobile responsivo */
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