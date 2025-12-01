<template>
  <button
    v-if="showInstallPrompt"
    @click="installApp"
    class="install-btn"
    title="Instalar App"
  >
    <Download :size="20" />
    <span class="install-text">Instalar</span>
  </button>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Download } from 'lucide-vue-next';

const showInstallPrompt = ref(false);
let deferredPrompt = null;

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt.value = true;
  });

  window.addEventListener('appinstalled', () => {
    showInstallPrompt.value = false;
    deferredPrompt = null;
  });
});

const installApp = async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();

  const { outcome } = await deferredPrompt.userChoice;

  if (outcome === 'accepted') {
    showInstallPrompt.value = false;
  }

  deferredPrompt = null;
};
</script>

<style scoped>
.install-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #1abc9c 0%, #16a085 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(26, 188, 156, 0.3);
}

.install-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 188, 156, 0.4);
}

.install-btn:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .install-text {
    display: none;
  }
  
  .install-btn {
    padding: 8px;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    justify-content: center;
  }
}
</style>
