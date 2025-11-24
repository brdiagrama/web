import { createApp } from 'vue'
import LandingPage from './LandingPage.vue'
import './assets/styles/global.css' // Importa estilos globais se tiver

const app = createApp(LandingPage)

app.mount('#app-landing')