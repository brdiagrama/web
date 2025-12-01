import { createApp } from 'vue'
import LandingPage from './LandingPage.vue'
import './assets/styles/global.css'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Nova versão disponível!');
    if (confirm('Nova versão disponível! Recarregar agora?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log(' PWA pronto! App funciona offline agora.');
  },
  onRegistered(registration) {
    console.log(' Service Worker registrado!', registration);
  },
  onRegisterError(error) {
    console.error(' Erro ao registrar Service Worker:', error);
  },
});

const app = createApp(LandingPage)

app.mount('#app-landing')