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
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Download } from 'lucide-vue-next';

const showInstallPrompt = ref(false);
let deferredPrompt = null;

// Tracking de engajamento
const engagement = {
  scrolled: false,
  clicked: false,
  timeOnPage: 0,
  startTime: Date.now()
};

const checkEngagement = () => {
  // Mostra botão se o usuário demonstrou interesse
  // (scrollou OU clicou OU ficou 5s+ na página)
  const timeSpent = (Date.now() - engagement.startTime) / 1000;
  return engagement.scrolled || engagement.clicked || timeSpent >= 5;
};

const trackScroll = () => {
  if (window.scrollY > 100) {
    engagement.scrolled = true;
    tryShowPrompt();
  }
};

const trackClick = () => {
  engagement.clicked = true;
  tryShowPrompt();
};

const tryShowPrompt = () => {
  if (deferredPrompt && checkEngagement() && !showInstallPrompt.value) {
    showInstallPrompt.value = true;
  }
};

onMounted(() => {
  // Verifica se já está instalado
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return;
  }

  // Captura o evento quando o Chrome permitir
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Tenta mostrar imediatamente se já houver engajamento
    tryShowPrompt();
  });

  // Listeners de engajamento
  window.addEventListener('scroll', trackScroll, { passive: true });
  document.addEventListener('click', trackClick);

  // Fallback: mostra após 8s se o evento não disparou
  const fallbackTimer = setTimeout(() => {
    if (deferredPrompt && checkEngagement()) {
      tryShowPrompt();
    }
  }, 8000);

  // Cleanup do timer
  onBeforeUnmount(() => clearTimeout(fallbackTimer));

  window.addEventListener('appinstalled', () => {
    showInstallPrompt.value = false;
    deferredPrompt = null;
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', trackScroll);
  document.removeEventListener('click', trackClick);
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
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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