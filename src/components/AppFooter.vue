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
      <!-- Logo grande -->
      <div class="footer-logo">
        <img 
          src="../assets/images/logo/logo-completa.svg" 
          alt="BrDiagrama" 
          class="logo-image"
        />
      </div>

      <!-- Texto e informações -->
      <div class="footer-info">
        <p class="copyright">
          © {{ currentYear }} BrDiagrama. Todos os direitos reservados.
        </p>
        <p class="made-with-love">
          Feito com <Heart :size="16" class="heart-icon" fill="currentColor" /> no Brasil
        </p>
        
        <!-- Botão GitHub Star -->
        <a 
          href="https://github.com/brdiagrama/web" 
          target="_blank" 
          rel="noopener noreferrer"
          class="github-button"
          title="Star us on GitHub"
        >
          <Github :size="20" />
          <span>Star on GitHub</span>
          <svg class="star-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>
          </svg>
        </a>
      </div>
    </div>

    <!-- Linha decorativa -->
    <div class="footer-line"></div>
  </footer>
</template>

<style scoped>
.app-footer {
  background: linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.8) 100%);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
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
  color: #94a3b8;
  font-size: 0.9375rem;
  font-weight: 500;
  margin: 0;
}

.made-with-love {
  color: #cbd5e1;
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

.github-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
}

.github-button:hover {
  background: rgba(26, 188, 156, 0.1);
  border-color: #1abc9c;
  color: #1abc9c;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 188, 156, 0.2);
}

.github-button .star-icon {
  transition: transform 0.3s ease;
}

.github-button:hover .star-icon {
  transform: rotate(72deg) scale(1.2);
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

  .github-button {
    font-size: 0.8125rem;
    padding: 0.5rem 1rem;
  }
}
</style>
