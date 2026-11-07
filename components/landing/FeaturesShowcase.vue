<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { Play, Pause, RotateCcw } from "lucide-vue-next";

interface ShowcaseContent {
  title: string;
  description: string;
  videoSrc: string;
}

const activeTab = ref("1:1");

const tabs = [
  { id: "1:1", label: "Um para Um" },
  { id: "1:N", label: "Um para Muitos" },
  { id: "apenas1:N", label: "Somente 1:N" },
  { id: "N:N", label: "Muitos para Muitos" },
  { id: "heranca", label: "Herança" },
];

const contents: Record<string, ShowcaseContent> = {
  "1:1": {
    title: "Conexão Exclusiva (1:1)",
    description:
      "O diagrama detecta automaticamente a constraint UNIQUE e NOT NULL na chave estrangeira, criando um vínculo exclusivo entre as tabelas.",
    videoSrc: "https://media.brdiagrama.com/1-1.mp4",
  },
  "1:N": {
    title: "Um para Muitos (Opcional)",
    description:
      "Quando a chave estrangeira aceita NULL, o diagrama representa visualmente que o relacionamento não é obrigatório (0..N).",
    videoSrc: "https://media.brdiagrama.com/1-N.mp4",
  },
  "apenas1:N": {
    title: "Um para Muitos (Estrito)",
    description:
      "Ao definir a chave como NOT NULL, o sistema desenha a obrigatoriedade do vínculo, impedindo registros órfãos no seu modelo.",
    videoSrc: "https://media.brdiagrama.com/apenas1-N.mp4",
  },
  "N:N": {
    title: "Muitos para Muitos (N:N)",
    description:
      "Detecção inteligente de tabelas de junção. O sistema reconhece Chaves Primárias Compostas para desenhar associações complexas sem poluição visual.",
    videoSrc: "https://media.brdiagrama.com/N-N.mp4",
  },
  heranca: {
    title: "Herança e Especialização",
    description:
      'Arquitetura hierárquica visualizada. Quando a PK também é uma FK, o diagrama entende a extensão da tabela e desenha a estrutura de "Pai e Filho".',
    videoSrc: "https://media.brdiagrama.com/heranca.mp4",
  },
};

const currentTabContent = computed(() => contents[activeTab.value]);

const previewVideo = ref<HTMLVideoElement | null>(null);
const videoEnded = ref(false);
const videoLoading = ref(true);
const isPlaying = ref(true);

const onVideoLoaded = () => {
  videoLoading.value = false;
};

const onVideoPlaying = () => {
  videoLoading.value = false;
  isPlaying.value = true;
  videoEnded.value = false;
};

const onVideoEnded = () => {
  videoEnded.value = true;
  isPlaying.value = false;
};

const onVideoLoadStart = () => {
  videoLoading.value = true;
};

const onTimeUpdate = () => {
  if (videoLoading.value) {
    videoLoading.value = false;
  }
};

const togglePlayPause = () => {
  const v = previewVideo.value;
  if (!v) return;
  if (v.paused || videoEnded.value) {
    if (videoEnded.value) {
      v.currentTime = 0;
      videoEnded.value = false;
    }
    v.play().catch(() => {});
    isPlaying.value = true;
  } else {
    v.pause();
    isPlaying.value = false;
  }
};

const restartVideo = () => {
  const v = previewVideo.value;
  if (!v) return;
  v.currentTime = 0;
  v.play().catch(() => {});
  videoEnded.value = false;
  isPlaying.value = true;
};

const checkVideoStatus = () => {
  const v = previewVideo.value;
  if (!v) return;
  if (v.readyState >= 2 || v.currentTime > 0) {
    videoLoading.value = false;
  }
  if (v.paused && !videoEnded.value) {
    v.play().catch(() => {});
  }
  isPlaying.value = !v.paused;
};

onMounted(() => {
  nextTick(() => {
    checkVideoStatus();
  });
  // Fallback de segurança para nunca travar o spinner no F5 se o carregamento já ocorreu
  setTimeout(() => {
    if (videoLoading.value) {
      videoLoading.value = false;
    }
  }, 600);
});

watch(activeTab, () => {
  videoEnded.value = false;
  videoLoading.value = true;
  isPlaying.value = true;
  nextTick(() => {
    const v = previewVideo.value;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  });
});
</script>

<template>
  <section class="showcase-layer">
    <div class="flex flex-col w-full h-full max-w-[1200px] items-center justify-end">
      <div class="glass-card w-full flex-1 rounded-2xl md:rounded-3xl flex flex-col overflow-hidden relative z-10">
        <div class="monitor-top-bezel w-full h-7 md:h-8 flex items-center justify-center shrink-0" aria-hidden="true">
          <div class="monitor-camera"></div>
        </div>
        <div class="video-screen flex-1 relative w-full h-full overflow-hidden">
          <transition name="spinner-fade">
            <div v-if="videoLoading" class="absolute inset-0 flex items-center justify-center bg-[var(--clr-monitor-screen)] z-30">
              <div class="spinner"></div>
            </div>
          </transition>

          <transition name="fade" mode="out-in">
            <video
              ref="previewVideo"
              :key="activeTab"
              autoplay
              muted
              playsinline
              preload="auto"
              class="object-cover"
              :src="currentTabContent.videoSrc"
              :aria-label="`Demonstração: ${currentTabContent.title}`"
              @ended="onVideoEnded"
              @loadeddata="onVideoLoaded"
              @canplay="onVideoLoaded"
              @playing="onVideoPlaying"
              @timeupdate="onTimeUpdate"
              @pause="isPlaying = false"
              @play="isPlaying = true"
              @loadstart="onVideoLoadStart"
            >
              <track kind="captions" label="Português" srclang="pt-BR" />
              Seu navegador não suporta vídeos HTML5.
            </video>
          </transition>

          <div class="video-overlay">
            <h3 class="video-overlay-title">
              {{ currentTabContent.title }}
            </h3>
            <p class="video-overlay-desc">
              {{ currentTabContent.description }}
            </p>
          </div>

          <div class="video-controls">
            <v-tooltip :text="isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'" location="top" scroll-strategy="none">
              <template #activator="{ props: tooltipProps }">
                <v-btn
                  v-bind="tooltipProps"
                  icon
                  variant="text"
                  size="small"
                  class="video-ctrl-btn"
                  :aria-label="isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'"
                  @click="togglePlayPause"
                >
                  <Pause v-if="isPlaying" :size="18" />
                  <Play v-else :size="18" />
                </v-btn>
              </template>
            </v-tooltip>

            <v-tooltip text="Reiniciar vídeo" location="top" scroll-strategy="none">
              <template #activator="{ props: tooltipProps }">
                <v-btn
                  v-bind="tooltipProps"
                  icon
                  variant="text"
                  size="small"
                  class="video-ctrl-btn"
                  aria-label="Reiniciar vídeo de demonstração"
                  @click="restartVideo"
                >
                  <RotateCcw :size="18" />
                </v-btn>
              </template>
            </v-tooltip>
          </div>
        </div>
      </div>

      <div class="floating-dock-container w-full relative z-20 flex justify-center py-4 md:py-6">
        <nav
          class="floating-dock flex flex-wrap justify-center items-center gap-1 sm:gap-2 p-1.5 rounded-full"
          role="tablist"
          aria-label="Tipos de relacionamento"
        >
          <v-btn
            v-for="tab in tabs"
            :key="tab.id"
            :variant="activeTab === tab.id ? 'flat' : 'text'"
            :color="activeTab === tab.id ? 'primary' : undefined"
            rounded="pill"
            size="small"
            elevation="0"
            class="dock-tab-btn font-weight-semibold text-none"
            :class="{ active: activeTab === tab.id }"
            role="tab"
            :aria-selected="activeTab === tab.id"
            :aria-controls="`panel-${tab.id}`"
            :aria-label="`Exibir exemplo de ${tab.label}`"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </v-btn>
        </nav>
      </div>
    </div>
  </section>
</template>

<style scoped>
.floating-dock-container {
  margin-top: 1rem;
}

.floating-dock {
  background-color: var(--clr-bg-surface);
  box-shadow: none !important;
}

.dock-tab-btn {
  font-size: 0.875rem !important;
  font-weight: 600 !important;
  letter-spacing: normal !important;
  padding: 0 16px !important;
  height: 34px !important;
  border-radius: 9999px !important;
  transition: background-color 0.2s ease, color 0.2s ease !important;
  text-align: center;
}

.dock-tab-btn:not(.active) {
  color: var(--clr-text-muted) !important;
  background-color: transparent !important;
}

.dock-tab-btn:not(.active):hover {
  background-color: var(--clr-hover) !important;
  color: var(--clr-text) !important;
}

.dock-tab-btn.active {
  background-color: var(--clr-primary) !important;
  color: #0F0F0F !important;
}

.video-controls {
  position: absolute;
  right: 1.25rem;
  bottom: 1.25rem;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transform: translateZ(0);
}

.video-ctrl-btn {
  color: #FFFFFF !important;
  background-color: rgba(0, 0, 0, 0.45) !important;
  border: none !important;
  transition: background-color 0.15s ease, color 0.15s ease !important;
}

.video-ctrl-btn:hover {
  background-color: rgba(255, 255, 255, 0.2) !important;
  color: #FFFFFF !important;
}

.monitor-top-bezel {
  background-color: var(--clr-monitor-bezel);
  border: none !important;
  margin-bottom: -1px;
  position: relative;
  z-index: 2;
}

.monitor-camera {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--clr-monitor-camera);
  border: none;
}

.glass-card {
  background: transparent !important;
  border: none !important;
  outline: none !important;
  border-radius: 1.5rem;
  box-shadow: none !important;
  pointer-events: auto;
  width: auto;
  max-width: 65vh;
  aspect-ratio: 16 / 9;
  min-width: min(1100px, 100%);
  flex-shrink: 0;
  position: relative;
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;
}

video {
  position: absolute;
  top: -2px;
  left: -2px;
  width: calc(100% + 4px);
  height: calc(100% + 4px);
  max-width: none;
  display: block;
  object-fit: cover;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  border-bottom-left-radius: 1.75rem;
  border-bottom-right-radius: 1.75rem;
  opacity: 0.995;
}

.video-overlay {
  position: absolute;
  bottom: -1px;
  left: -1px;
  right: -1px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.6) 50%, transparent 100%);
  padding: 4rem 2rem 2rem 2rem;
  pointer-events: none;
  z-index: 20;
}

.video-overlay-title {
  color: #FFFFFF;
  font-weight: 700;
  font-size: 1.5rem;
  line-height: 1.25;
  margin-bottom: 0.5rem;
}

.video-overlay-desc {
  color: #E5E7EB;
  font-size: 0.9375rem;
  line-height: 1.5;
  max-width: 32rem;
  margin: 0;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(26, 186, 156, 0.15);
  border-top-color: var(--clr-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner-fade-enter-active { transition: opacity 0.3s ease-out; }
.spinner-fade-leave-active { transition: opacity 0.25s ease-in; }
.spinner-fade-enter-from, .spinner-fade-leave-to { opacity: 0; }

.showcase-layer {
  position: absolute;
  width: 95%;
  max-width: 1200px;
  height: 85vh;
  bottom: 0;
  z-index: 10;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex-direction: column;
  margin-left: auto;
  margin-right: auto;
  transform: translateY(88%);
}

@media (min-width: 769px) and (max-height: 800px) {
  .showcase-layer {
    justify-content: flex-end;
    transform: translateY(120%);
    padding-bottom: 0;
  }
  .glass-card {
    min-width: min(900px, 100%);
    height: 55vh;
    width: auto;
    min-height: 600px;
  }
}

@media (max-width: 768px) {
  .glass-card {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    flex: none !important;
    height: auto !important;
    aspect-ratio: auto !important;
  }
  .video-screen {
    width: 100%;
    height: auto !important;
    aspect-ratio: 16 / 9;
    flex: none !important;
  }
  video {
    border-bottom-left-radius: 1.15rem;
    border-bottom-right-radius: 1.15rem;
  }
  .video-overlay {
    padding: 0.75rem 4.75rem 0.375rem 0.625rem !important;
  }
  .video-overlay-title {
    font-size: 0.6875rem !important;
    line-height: 1.15 !important;
    margin-bottom: 2px !important;
  }
  .video-overlay-desc {
    font-size: 0.5625rem !important;
    line-height: 1.25 !important;
    max-width: 100% !important;
    margin: 0 !important;
    opacity: 0.9;
  }
  .video-controls { right: 0.75rem; bottom: 0.75rem; }
  .floating-dock-container { margin-top: 0.75rem; padding: 0 0.5rem; }
  .dock-tab-btn { padding: 0 12px !important; height: 30px !important; font-size: 0.75rem !important; }
  .showcase-layer {
    transform: translateY(0%) !important;
    height: auto;
    position: relative !important;
    bottom: auto !important;
    padding-bottom: 1rem;
  }
}
</style>
