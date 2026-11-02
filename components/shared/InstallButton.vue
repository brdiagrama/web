<template>
  <v-btn
    v-if="showInstallPrompt"
    color="primary"
    rounded="lg"
    size="small"
    class="fixed bottom-6 right-6 z-50 font-weight-bold shadow-lg text-none"
    title="Instalar App"
    aria-label="Instalar BrDiagrama como aplicativo"
    @click="installApp"
  >
    <template #prepend>
      <Download :size="18" />
    </template>
    <span class="hidden md:inline">Instalar</span>
  </v-btn>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Download } from 'lucide-vue-next';

const showInstallPrompt = ref(false);
let deferredPrompt = null;

onMounted(() => {
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt.value = true;
  });

  window.addEventListener('appinstalled', () => {
    showInstallPrompt.value = false;
    deferredPrompt = null;
  });
});

const installApp = async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  if (outcome === 'accepted') {
    showInstallPrompt.value = false;
  }

  deferredPrompt = null;
};
</script>

<style scoped>
</style>
