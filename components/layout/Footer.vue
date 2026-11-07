<script setup>
import { Github, Heart } from 'lucide-vue-next';

const props = defineProps({
  animated: {
    type: Boolean,
    default: false
  }
});

const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="app-footer" :class="{ animated: animated }">
    <div class="footer-content">
      <div class="footer-logo">
        <img 
          src="~/assets/images/logo/logo-completa.svg" 
          alt="BrDiagrama" 
          class="logo-image"
        />
      </div>

      <div class="footer-info">
        <p class="copyright">
          © {{ currentYear }} BrDiagrama. Todos os direitos reservados.
        </p>
        <p class="made-with-love">
          Feito com <Heart :size="16" class="heart-icon" fill="currentColor" /> no Brasil
        </p>
        
        <v-btn 
          href="https://github.com/brdiagrama/web" 
          target="_blank" 
          rel="noopener noreferrer"
          variant="outlined"
          rounded="lg"
          size="small"
          class="font-weight-bold text-none mt-2"
          aria-label="Dar estrela no repositório do GitHub da BrDiagrama"
        >
          <template #prepend>
            <Github :size="18" />
          </template>
          Star on GitHub
          <template #append>
            <svg class="star-icon transition-transform duration-300 hover:rotate-72 hover:scale-125" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
            </svg>
          </template>
        </v-btn>
      </div>
    </div>

    <div class="footer-line"></div>
  </footer>
</template>

<style scoped>
.app-footer {
  background: var(--clr-bg);
  border-top: 1px solid var(--clr-border);
  padding: 4rem 2rem 2rem;
  position: relative;
  overflow: hidden;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.footer-logo {
  margin-bottom: 1rem;
}

.logo-image {
  height: 120px;
  width: auto;
  filter: drop-shadow(0 0 30px rgba(26, 188, 156, 0.3));
  transition: transform 0.3s ease, filter 0.3s ease;
}

.logo-image:hover {
  transform: scale(1.05);
  filter: drop-shadow(0 0 40px rgba(26, 188, 156, 0.5));
}

.footer-info {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

/* Animação CSS simples quando prop animated=true */
.app-footer.animated .footer-logo {
  animation: fadeInScale 0.8s ease-out;
}

.app-footer.animated .footer-info {
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.copyright {
  color: var(--clr-text-muted);
  font-size: 0.9375rem;
  font-weight: 500;
  margin: 0;
}

.made-with-love {
  color: var(--clr-text);
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.heart-icon {
  color: #10b981;
  animation: heartbeat 1.5s ease-in-out infinite;
}

@keyframes heartbeat {
  0%, 100% {
    transform: scale(1);
  }
  10%, 30% {
    transform: scale(1.1);
  }
  20%, 40% {
    transform: scale(1);
  }
}

.footer-line {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, #1abc9c, transparent);
  opacity: 0.5;
}

@media (max-width: 768px) {
  .app-footer {
    padding: 3rem 1.5rem 1.5rem;
  }

  .logo-image {
    height: 80px;
  }

  .copyright,
  .made-with-love {
    font-size: 0.875rem;
  }
}
</style>
