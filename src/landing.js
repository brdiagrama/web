import { createApp } from 'vue'
import LandingPage from './LandingPage.vue'
import './assets/styles/global.css'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('🔄 Nova versão disponível!');
    if (confirm('Nova versão disponível! Recarregar agora?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('✅ PWA pronto! Landing funciona offline agora.');
  },
  onRegistered(registration) {
    console.log('✅ Service Worker registrado na Landing!', registration);
    console.log('📍 Scope:', registration.scope);
    console.log('📍 Active SW:', registration.active?.scriptURL);
  },
  onRegisterError(error) {
    console.error('❌ Erro ao registrar Service Worker:', error);
  },
});

const app = createApp(LandingPage)

app.mount('#app-landing')