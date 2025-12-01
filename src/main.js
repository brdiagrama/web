import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import '@/assets/styles/variables.css';
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    if (confirm('Nova versão disponível! Recarregar agora?')) {
      updateSW(true);
    }
  },
});

const pinia = createPinia();

const app = createApp(App);

app.use(pinia);

app.mount('#app');
