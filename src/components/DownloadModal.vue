<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isVisible" class="download-overlay" @click="handleBackdropClick">
        <Transition name="modal-scale">
          <div v-if="isVisible" class="download-card">
            <!-- Header com checkmark animado -->
            <div class="download-header">
              <div class="download-icon-wrapper success">
                <CheckCircle :size="40" class="download-icon" />
              </div>
            </div>

            <!-- Body -->
            <div class="download-body">
              <h2 class="download-title">{{ title }}</h2>
              <p class="download-subtitle">{{ subtitle }}</p>
              <p class="download-message">{{ message }}</p>
            </div>

            <!-- Footer -->
            <div class="download-footer">
              <button class="btn btn-secondary" @click="close">
                Fechar
              </button>
              <button class="btn btn-primary" @click="openFolder">
                {{ openFolderText }}
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
import { CheckCircle } from "lucide-vue-next";

const isVisible = ref(false);
const title = ref("Download Concluído");
const subtitle = ref("");
const message = ref("");
const openFolderText = ref("Abrir Pasta");
let resolveCallback = null;

const showDownloadModal = (config) => {
  title.value = config.title || "Download Concluído";
  subtitle.value = config.subtitle || "Seu arquivo foi salvo com sucesso!";
  message.value = config.message || "O arquivo está disponível na pasta de downloads do seu navegador.";
  openFolderText.value = config.openFolderText || "Abrir Pasta";
  isVisible.value = true;

  return new Promise((resolve) => {
    resolveCallback = resolve;
  });
};

const close = () => {
  isVisible.value = false;
  if (resolveCallback) {
    resolveCallback(false);
    resolveCallback = null;
  }
};

const openFolder = () => {
  isVisible.value = false;
  if (resolveCallback) {
    resolveCallback(true);
    resolveCallback = null;
  }
};

const handleBackdropClick = (e) => {
  if (e.target === e.currentTarget) {
    close();
  }
};

defineExpose({ showDownloadModal });
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

/* Backdrop */
.download-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 99999;
}

/* Card */
.download-card {
  background: #1e293b;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
              0 0 0 1px rgba(255, 255, 255, 0.05);
  max-width: 480px;
  width: 100%;
  overflow: hidden;
}

/* Header com ícone */
.download-header {
  padding: 2rem 1.5rem 1rem 1.5rem;
  text-align: center;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.03));
}

.download-icon-wrapper {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.download-icon-wrapper.success {
  background: rgba(16, 185, 129, 0.15);
  animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.download-icon {
  color: #10b981;
}

@keyframes scaleIn {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Body */
.download-body {
  padding: 1.5rem;
  text-align: center;
}

.download-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.download-subtitle {
  color: #10b981;
  font-weight: 600;
  font-size: 0.9375rem;
  margin: 0 0 1rem 0;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.download-message {
  color: #94a3b8;
  line-height: 1.6;
  font-size: 0.9375rem;
  margin: 0;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

/* Footer */
.download-footer {
  padding: 1rem 1.5rem;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

/* Botões */
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
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

.btn-primary {
  background: #10b981;
  color: #ffffff;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
}

.btn-primary:hover {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(16, 185, 129, 0.5);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

/* Mobile responsivo */
@media (max-width: 768px) {
  .download-card {
    max-width: 100%;
  }

  .download-footer {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .download-title {
    font-size: 1.1rem;
  }
}
</style>