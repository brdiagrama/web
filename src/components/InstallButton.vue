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
  console.log('🔧 InstallButton montado! Aguardando beforeinstallprompt...');
  console.log('🔍 User Agent:', navigator.userAgent);
  console.log('🔍 Standalone?', window.matchMedia('(display-mode: standalone)').matches);
  
  // Verifica se já está instalado
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('❌ App já está instalado!');
    return;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('✅ beforeinstallprompt disparado!');
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt.value = true;
  });

  window.addEventListener('appinstalled', () => {
    console.log('✅ App foi instalado!');
    showInstallPrompt.value = false;
    deferredPrompt = null;
  });
  
  // Debug: força mostrar depois de 3 segundos se não disparou
  setTimeout(() => {
    if (!showInstallPrompt.value) {
      console.warn('⚠️ beforeinstallprompt NÃO disparou após 3s. Critérios PWA não atendidos ou app já instalado.');
    }
  }, 3000);
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
