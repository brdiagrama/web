<template>
  <Teleport to="body">
    <div v-if="isVisible" class="alert-overlay" @click="handleBackdropClick">
      <div class="alert-card">
        <!-- Header com ícone -->
        <div class="alert-header" :class="`alert-${type}`">
          <component :is="getIcon()" :size="24" class="alert-icon" />
        </div>

        <!-- Body -->
        <div class="alert-body">
          <h2 class="alert-title">{{ title }}</h2>
          <p class="alert-message">{{ message }}</p>
        </div>

        <!-- Footer -->
        <div class="alert-footer">
          <button class="btn btn-primary" @click="confirm">
            {{ buttonText }}
          </button>
        </div>
      </div>
    </div>
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

const handleBackdropClick = (e) => {
  if (e.target === e.currentTarget) {
    confirm();
  }
};

defineExpose({ showAlert });
</script>

<style scoped>
/* Transitions */
.alert-fade-enter-active,
.alert-fade-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}
.alert-fade-enter-from,
.alert-fade-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.995);
}
.alert-fade-enter-to,
.alert-fade-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* Backdrop */
.alert-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(2, 6, 23, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  backdrop-filter: blur(4px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.alert-card {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 1px solid #334155;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
              0 0 40px rgba(45, 212, 191, 0.1);
  width: 90%;
  max-width: 450px;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert-header {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, rgba(45, 212, 191, 0.05) 100%);
  border-bottom: 1px solid #334155;
}

.alert-header.alert-info {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
}

.alert-header.alert-success {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
}

.alert-header.alert-error {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
}

.alert-header.alert-warning {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%);
}

.alert-icon {
  color: #2dd4bf;
}

.alert-header.alert-info .alert-icon {
  color: #3b82f6;
}

.alert-header.alert-success .alert-icon {
  color: #10b981;
}

.alert-header.alert-error .alert-icon {
  color: #ef4444;
}

.alert-header.alert-warning .alert-icon {
  color: #f59e0b;
}

.alert-body {
  padding: 24px;
  text-align: center;
}

.alert-title {
  font-size: 18px;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0 0 12px 0;
  letter-spacing: -0.3px;
}

.alert-message {
  color: #cbd5e1;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
  font-family: "Segoe UI", sans-serif;
}

.alert-footer {
  display: flex;
  padding: 16px 24px;
  border-top: 1px solid #334155;
  background-color: rgba(0, 0, 0, 0.2);
  justify-content: center;
}

.btn {
  padding: 10px 28px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: "Segoe UI", sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-primary {
  background: linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%);
  color: #020617;
  box-shadow: 0 4px 12px rgba(45, 212, 191, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #1dd4bf 0%, #0d9488 100%);
  box-shadow: 0 6px 16px rgba(45, 212, 191, 0.4);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(45, 212, 191, 0.3);
}
</style>