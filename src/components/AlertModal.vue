<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isVisible" class="alert-overlay" @click="handleBackdropClick">
        <Transition name="modal-scale">
          <div v-if="isVisible" class="alert-card" :class="`alert-${type}`">
            <div class="alert-content">
              <!-- Ícone à esquerda -->
              <div class="alert-icon-side">
                <div class="alert-icon-wrapper">
                  <component :is="getIcon()" :size="28" class="alert-icon" />
                </div>
              </div>

              <!-- Texto à direita -->
              <div class="alert-text-side">
                <h2 class="alert-title">{{ title }}</h2>
                <p class="alert-message">{{ message }}</p>
              </div>
            </div>

            <!-- Footer -->
            <div class="alert-footer">
              <button class="btn btn-secondary" @click="cancel" v-if="hasCancel">
                Cancelar
              </button>
              <button 
                class="btn" 
                :class="type === 'error' ? 'btn-danger' : 'btn-primary'" 
                @click="confirm"
              >
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
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
              0 0 0 1px rgba(255, 255, 255, 0.05);
  max-width: 480px;
  width: 100%;
  overflow: hidden;
  position: relative;
}

.alert-content {
  display: flex;
  padding: 1.5rem;
  gap: 1.25rem;
  align-items: flex-start;
}

.alert-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.alert-text-side {
  flex: 1;
  padding-top: 0.125rem;
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
  font-size: 1.125rem;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.alert-message {
  color: #94a3b8;
  line-height: 1.6;
  font-size: 0.9375rem;
  margin: 0;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
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
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.btn-primary {
  background: #1abc9c;
  color: #0f172a;
}

.btn-primary:hover {
  background: #31e0bd;
}

.btn-secondary {
  background: transparent;
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

/* Mobile responsivo */
@media (max-width: 768px) {
  .alert-card {
    max-width: 100%;
    margin: 1rem;
  }

  .alert-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1rem;
  }
  
  .alert-text-side {
    padding-top: 0;
  }

  .alert-footer {
    flex-direction: column-reverse; /* Botão principal em cima no mobile */
  }

  .btn {
    width: 100%;
    justify-content: center;
    padding: 0.75rem;
  }
}
</style>