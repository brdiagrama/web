import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import '@/assets/styles/variables.css';
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Nova versão disponível!');
    if (confirm('Nova versão disponível! Recarregar agora?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('✅ PWA pronto! Editor funciona offline agora.');
  },
  onRegistered(registration) {
    console.log('✅ Service Worker registrado!', registration);
  },
  onRegisterError(error) {
    console.error('❌ Erro ao registrar Service Worker:', error);
  },
});

const pinia = createPinia();

const app = createApp(App);

app.use(pinia);

app.mount('#app');
