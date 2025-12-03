<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isVisible" class="alert-overlay" @click="handleBackdropClick">
        <Transition name="modal-scale">
          <div v-if="isVisible" class="alert-card" :class="`alert-${type}`">
            <!-- Body com ícone integrado -->
            <div class="alert-body">
              <div class="alert-icon-wrapper">
                <component :is="getIcon()" :size="32" class="alert-icon" />
              </div>
              <h2 class="alert-title">{{ title }}</h2>
              <p class="alert-message">{{ message }}</p>
            </div>

            <!-- Footer -->
            <div class="alert-footer">
              <button class="btn btn-secondary" @click="cancel" v-if="hasCancel">
                Cancelar
              </button>
              <button class="btn btn-primary" @click="confirm">
                {{ buttonText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from "vue";
import { AlertCircle, CheckCircle, XCircle, Info } from "lucide-vue-next";

const isVisible = ref(false);
const title = ref("");
const message = ref("");
const type = ref("info"); // info, success, error, warning
const buttonText = ref("OK");
const hasCancel = ref(false); // Se tem botão cancelar
let resolveCallback = null;

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

const showAlert = (config) => {
  title.value = config.title || "Aviso";
  message.value = config.message || "";
  type.value = config.type || "info";
  buttonText.value = config.buttonText || "OK";
  hasCancel.value = config.hasCancel || false;
  isVisible.value = true;

  return new Promise((resolve) => {
    resolveCallback = resolve;
  });
};

const confirm = () => {
  isVisible.value = false;
  if (resolveCallback) {
    resolveCallback(true);
    resolveCallback = null;
  }
};

const cancel = () => {
  isVisible.value = false;
  if (resolveCallback) {
    resolveCallback(false);
    resolveCallback = null;
  }
};

const handleBackdropClick = (e) => {
  if (e.target === e.currentTarget) {
    cancel();
  }
};

defineExpose({ showAlert });
</script>

<style scoped>
/* Transições do Backdrop (Fade) */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 250ms ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-to,
.modal-fade-leave-from {
  opacity: 1;
}

/* Transições do Card (Scale + Bounce) */
.modal-scale-enter-active {
  transition: transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), 
              opacity 400ms ease;
}

.modal-scale-leave-active {
  transition: transform 200ms ease-out, 
              opacity 200ms ease-out;
}

.modal-scale-enter-from {
  transform: scale(0.8);
  opacity: 0;
}

.modal-scale-leave-to {
  transform: scale(0.95);
  opacity: 0;
}

.modal-scale-enter-to,
.modal-scale-leave-from {
  transform: scale(1);
  opacity: 1;
}

/* Backdrop - SEM BLUR */
.alert-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 99999;
}

.alert-card {
  background: #1e293b;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 
              0 0 0 1px rgba(255, 255, 255, 0.05);
  max-width: 420px;
  width: 100%;
  overflow: hidden;
  position: relative;
}

.alert-body {
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  text-align: center;
}

.alert-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;
}

.alert-success .alert-icon-wrapper {
  background: rgba(16, 185, 129, 0.15);
}

.alert-success .alert-icon {
  color: #10b981;
}

.alert-error .alert-icon-wrapper {
  background: rgba(239, 68, 68, 0.15);
}

.alert-error .alert-icon {
  color: #ef4444;
}

.alert-warning .alert-icon-wrapper {
  background: rgba(245, 158, 11, 0.15);
}

.alert-warning .alert-icon {
  color: #f59e0b;
}

.alert-info .alert-icon-wrapper {
  background: rgba(59, 130, 246, 0.15);
}

.alert-info .alert-icon {
  color: #3b82f6;
}

.alert-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.alert-message {
  color: #94a3b8;
  line-height: 1.6;
  font-size: 0.9375rem;
  margin: 0;
}

.alert-footer {
  padding: 1rem 1.5rem;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.btn {
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9375rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #1abc9c;
  color: #0f172a;
  box-shadow: 0 0 20px rgba(26, 188, 156, 0.3);
}

.btn-primary:hover {
  background: #31e0bd;
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(26, 188, 156, 0.5);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-danger {
  background: #ef4444;
  color: white;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
}

.btn-danger:hover {
  background: #dc2626;
  transform: translateY(-2px);
}

/* Mobile responsivo */
@media (max-width: 768px) {
  .alert-card {
    max-width: 100%;
  }

  .alert-footer {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>