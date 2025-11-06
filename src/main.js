import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

// Cria a instância do Pinia (gerenciamento de estado)
const pinia = createPinia();

// Cria a aplicação Vue
const app = createApp(App);

// Configura o Pinia na aplicação
app.use(pinia);

// Monta a aplicação no elemento #app
app.mount('#app');
