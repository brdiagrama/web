<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { Sun, Moon, ArrowRight } from "lucide-vue-next";
import { useTheme } from "~/composables/useTheme";

defineProps({
  activePage: {
    type: String,
    default: "",
  },
});

const { isDark, toggleTheme } = useTheme();
const isHidden = ref(false);
let lastScrollY = 0;

const handleScroll = () => {
  const currentScrollY = window.scrollY;

  if (currentScrollY <= 15) {
    isHidden.value = false;
  } else if (currentScrollY > lastScrollY + 6 && currentScrollY > 50) {
    isHidden.value = true;
  } else if (currentScrollY < lastScrollY - 6) {
    isHidden.value = false;
  }

  lastScrollY = currentScrollY;
};

onMounted(() => {
  lastScrollY = window.scrollY;
  window.addEventListener("scroll", handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <header
    class="site-header fixed top-0 left-0 w-full z-50"
    :class="{ 'header-hidden': isHidden }"
    role="banner"
  >
    <div class="max-w-[1380px] mx-auto px-3 sm:px-6 md:px-10 h-14 md:h-[72px] flex items-center justify-between">
      <div class="flex items-center gap-2 sm:gap-4 md:gap-10">
        <NuxtLink to="/" class="flex items-center shrink-0" aria-label="BrDiagrama - Página Inicial">
          <img
            src="~/assets/images/logo/logo-completa.svg"
            alt="BrDiagrama - Transforme SQL em Diagramas ER"
            class="logo-img"
            width="auto"
            height="36"
          />
        </NuxtLink>

        <nav class="flex items-center gap-0.5 sm:gap-1 md:gap-2" role="navigation" aria-label="Menu principal">
          <NuxtLink
            to="/sobre"
            class="nav-link px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm md:text-[15px] font-medium"
            :class="{ active: activePage === 'sobre' }"
            :aria-current="activePage === 'sobre' ? 'page' : undefined"
          >
            Sobre
          </NuxtLink>
          <NuxtLink
            to="/faq"
            class="nav-link px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm md:text-[15px] font-medium"
            :class="{ active: activePage === 'faq' }"
            :aria-current="activePage === 'faq' ? 'page' : undefined"
          >
            FAQ
          </NuxtLink>
        </nav>
      </div>

      <div class="flex items-center gap-1 sm:gap-2 md:gap-3">
        <v-tooltip :text="isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'" location="bottom">
          <template #activator="{ props: tooltipProps }">
            <v-btn
              v-bind="tooltipProps"
              icon
              variant="text"
              size="small"
              :aria-label="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'"
              @click="(e: MouseEvent) => toggleTheme(e)"
            >
              <Sun v-if="isDark" :size="18" class="text-[var(--clr-text-muted)] hover:text-[var(--clr-text)] transition-colors" />
              <Moon v-else :size="18" class="text-[var(--clr-text-muted)] hover:text-[var(--clr-text)] transition-colors" />
            </v-btn>
          </template>
        </v-tooltip>

        <v-btn
          to="/gerador"
          color="primary"
          rounded="pill"
          height="34"
          elevation="0"
          class="rounded-full header-cta-btn font-semibold font-weight-semibold text-none px-3 sm:px-5 text-xs sm:text-sm tracking-normal md:h-[38px]"
          aria-label="Acessar gerador de diagramas"
        >
          <span><span class="hidden sm:inline">Acessar </span>Gerador</span>
          <template #append>
            <ArrowRight :size="15" class="ml-0.5 sm:ml-1" />
          </template>
        </v-btn>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  background-color: var(--clr-hero-stage);
  transform: translateY(0);
  transition: transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
}

.header-hidden {
  transform: translateY(-100%);
}

.header-cta-btn,
.header-cta-btn :deep(.v-btn__content),
.header-cta-btn span {
  border-radius: 9999px !important;
  font-weight: 600 !important;
}

.logo-img {
  height: 28px;
  width: auto;
}

@media (min-width: 768px) {
  .logo-img {
    height: 38px;
  }
}

.nav-link {
  color: var(--clr-text-muted);
  text-decoration: none;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.nav-link:hover {
  color: var(--clr-text);
  background-color: var(--clr-border);
}

.nav-link.active {
  color: var(--clr-text);
  font-weight: 600;
}
</style>
