<script setup>
import { ref, onMounted } from "vue";

const props = defineProps({
  activePage: {
    type: String,
    default: "", // 'sobre', 'faq', ou vazio para home
  },
});

const hasScrolled = ref(false);

onMounted(() => {
  const handleScroll = () => {
    hasScrolled.value = window.scrollY > 50;
  };
  window.addEventListener("scroll", handleScroll);
});
</script>

<template>
  <header
    class="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-4 transition-all duration-500"
    :class="{ 'header-scrolled': hasScrolled }"
    role="banner"
  >
    <a href="/" class="flex items-center gap-2" aria-label="BrDiagrama - Página Inicial">
      <img
        src="../assets/images/logo/logo-completa.svg"
        alt="BrDiagrama - Transforme SQL em Diagramas ER"
        class="logo-img transition-all"
        width="auto"
        height="48"
      />
    </a>
    <nav class="flex gap-4 md:gap-6 items-center" role="navigation" aria-label="Menu principal">
      <a
        href="/sobre"
        class="nav-link text-sm font-medium hover:text-[var(--clr-primary)] transition-colors"
        :class="{ active: activePage === 'sobre' }"
        :aria-current="activePage === 'sobre' ? 'page' : undefined"
        >Sobre</a
      >
      <a
        href="/faq"
        class="nav-link text-sm font-medium hover:text-[var(--clr-primary)] transition-colors"
        :class="{ active: activePage === 'faq' }"
        :aria-current="activePage === 'faq' ? 'page' : undefined"
        >FAQ</a
      >
      <a href="/gerador" class="cta-button-small" aria-label="Acessar gerador de diagramas"
        >Acessar Gerador</a
      >
    </nav>
  </header>
</template>

<style scoped>
.header-scrolled {
  background-color: rgba(15, 23, 42, 0.95);
  animation: border-neutral-flash 0.8s ease-out forwards;
}

@keyframes border-neutral-flash {
  0% {
    border-bottom: 1px solid transparent;
  }
  40% {
    border-bottom: 1px solid rgba(148, 163, 184, 0.4);
  }
  100% {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
}

.logo-img {
  height: 40px;
}

@media (min-width: 768px) {
  .logo-img {
    height: 48px;
  }
}

.nav-link {
  position: relative;
  color: #94a3b8;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: #e2e8f0;
}

.nav-link.active {
  color: var(--clr-primary);
}

.nav-link.active::after {
  content: "";
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--clr-primary);
  border-radius: 2px;
}

.cta-button-small {
  background-color: #1abc9c;
  color: #0f172a;
  font-weight: 700;
  padding: 8px 20px;
  border-radius: 9999px;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(26, 188, 156, 0.4);
  position: relative;
  overflow: hidden;
  font-size: 0.875rem;
}

.cta-button-small:hover {
  background-color: #31e0bd;
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(26, 188, 156, 0.6);
}

.cta-button-small::after {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  transform: skewX(-20deg);
  transition: none;
}

.cta-button-small:hover::after {
  left: 200%;
  transition: left 0.6s ease-in-out;
}

@media (max-width: 768px) {
  header {
    padding: 12px 16px;
  }

  .logo-img {
    height: 32px;
  }

  nav {
    gap: 0.5rem;
  }

  .nav-link {
    font-size: 0.75rem;
  }

  .cta-button-small {
    padding: 6px 12px;
    font-size: 0.6875rem;
  }
}
</style>
