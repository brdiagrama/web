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
  // Verifica se já está instalado
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('App já instalado');
    return;
  }

  // Escuta o evento
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('✅ beforeinstallprompt disparou!');
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt.value = true;
  });

  window.addEventListener('appinstalled', () => {
    console.log('App instalado com sucesso!');
    showInstallPrompt.value = false;
    deferredPrompt = null;
  });

  // Debug: avisa se não disparar
  setTimeout(() => {
    if (!showInstallPrompt.value && !window.matchMedia('(display-mode: standalone)').matches) {
      console.warn('⚠️ beforeinstallprompt não disparou. Possíveis motivos:');
      console.warn('1. App já foi instalado antes');
      console.warn('2. Usuário rejeitou 3 vezes');
      console.warn('3. Chrome decidiu não mostrar');
      console.warn('4. Critérios PWA não atendidos');
      console.warn('');
      console.warn('Para testar novamente:');
      console.warn('1. Desinstale o app');
      console.warn('2. chrome://flags/#bypass-app-banner-engagement-checks → Enabled');
      console.warn('3. Limpe cookies e cache');
      console.warn('4. Recarregue a página');
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
