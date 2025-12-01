import { createApp } from 'vue'
import LandingPage from './LandingPage.vue'
import './assets/styles/global.css'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nova versão disponível! Recarregar agora?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App pronto para funcionar offline!');
  },
});

const app = createApp(LandingPage)

app.mount('#app-landing')