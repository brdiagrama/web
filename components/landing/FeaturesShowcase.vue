<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { RefreshCw } from "lucide-vue-next";

interface ShowcaseContent {
  title: string;
  description: string;
  youtubeId?: string;
  videoSrc?: string;
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
    youtubeId: "rJdxLFanZoo",
  },
  "1:N": {
    title: "Um para Muitos (Opcional)",
    description:
      "Quando a chave estrangeira aceita NULL, o diagrama representa visualmente que o relacionamento não é obrigatório (0..N).",
    youtubeId: "2y40czV1KKw",
  },
  "apenas1:N": {
    title: "Um para Muitos (Estrito)",
    description:
      "Ao definir a chave como NOT NULL, o sistema desenha a obrigatoriedade do vínculo, impedindo registros órfãos no seu modelo.",
    youtubeId: "AbAfLUhv5Ys",
  },
  "N:N": {
    title: "Muitos para Muitos (N:N)",
    description:
      "Detecção inteligente de tabelas de junção. O sistema reconhece Chaves Primárias Compostas para desenhar associações complexas sem poluição visual.",
    youtubeId: "Dqx2GfKxH7M",
  },
  heranca: {
    title: "Herança e Especialização",
    description:
      'Arquitetura hierárquica visualizada. Quando a PK também é uma FK, o diagrama entende a extensão da tabela e desenha a estrutura de "Pai e Filho".',
    youtubeId: "_SvCiD54R4w",
  },
};

const currentTabContent = computed(() => contents[activeTab.value]);

const previewVideo = ref<HTMLVideoElement | null>(null);
const videoEnded = ref(false);
const videoLoading = ref(true);

const onVideoEnded = () => {
  videoEnded.value = true;
};

const onVideoLoaded = () => {
  videoLoading.value = false;
};

const onVideoLoadStart = () => {
  videoLoading.value = true;
};

const restartVideo = () => {
  const v = previewVideo.value;
  if (!v) return;
  v.currentTime = 0;
  v.play();
  videoEnded.value = false;
};

watch(activeTab, () => {
  videoEnded.value = false;
  videoLoading.value = true;
});
</script>

<template>
  <section class="showcase-layer">
    <div class="flex flex-col w-full h-full max-w-[1200px] items-center justify-end">
      <div class="glass-card w-full flex-1 rounded-2xl md:rounded-3xl flex flex-col overflow-hidden relative z-10">
        <div class="monitor-top-bezel w-full h-7 md:h-8 flex items-center justify-center shrink-0" aria-hidden="true">
          <div class="monitor-camera"></div>
        </div>
        <div class="flex-1 relative w-full h-full bg-[var(--clr-bg-card)] overflow-hidden">
          <transition name="spinner-fade">
            <div v-if="videoLoading" class="absolute inset-0 flex items-center justify-center bg-[var(--clr-bg-card)] z-30">
              <div class="spinner"></div>
            </div>
          </transition>

          <transition name="fade" mode="out-in">
            <template v-if="currentTabContent.youtubeId">
              <iframe
                :key="activeTab"
                class="w-full h-full"
                :src="`https://www.youtube.com/embed/${currentTabContent.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${currentTabContent.youtubeId}&controls=0&modestbranding=1&rel=0`"
                frameborder="0"
                allow="autoplay; encrypted-media"
                allowfullscreen
                loading="eager"
                :aria-label="`Demonstração: ${currentTabContent.title}`"
                @load="onVideoLoaded"
              ></iframe>
            </template>
            <template v-else-if="currentTabContent.videoSrc">
              <video
                ref="previewVideo"
                :key="activeTab"
                autoplay
                muted
                playsinline
                class="w-full h-full object-cover"
                :src="currentTabContent.videoSrc"
                :aria-label="`Demonstração: ${currentTabContent.title}`"
                @ended="onVideoEnded"
                @loadeddata="onVideoLoaded"
                @loadstart="onVideoLoadStart"
              >
                <track kind="captions" label="Português" srclang="pt-BR" />
                Seu navegador não suporta vídeos HTML5.
              </video>
            </template>
          </transition>

          <div class="video-overlay">
            <h3 class="text-xl md:text-2xl text-white font-bold mb-2">
              {{ currentTabContent.title }}
            </h3>
            <p class="text-gray-200 text-sm md:text-base max-w-lg leading-relaxed">
              {{ currentTabContent.description }}
            </p>
          </div>

          <v-tooltip v-if="currentTabContent.videoSrc && !currentTabContent.youtubeId" text="Reiniciar vídeo" location="top">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                v-bind="tooltipProps"
                icon
                size="small"
                variant="tonal"
                color="primary"
                class="absolute right-3 bottom-5 z-40 rounded-lg bg-slate-900/80"
                :aria-pressed="videoEnded"
                aria-label="Reiniciar vídeo de demonstração"
                @click="restartVideo"
              >
                <RefreshCw :size="16" />
              </v-btn>
            </template>
          </v-tooltip>
        </div>
      </div>

      <div class="floating-dock-container w-full relative z-20 flex justify-center py-4 md:py-6">
        <nav
          class="floating-dock flex flex-wrap justify-center items-center gap-1 sm:gap-2 p-1.5 rounded-full"
          role="tablist"
          aria-label="Tipos de relacionamento"
        >
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="dock-tab-btn"
            :class="{ active: activeTab === tab.id }"
            role="tab"
            :aria-selected="activeTab === tab.id"
            :aria-controls="`panel-${tab.id}`"
            :aria-label="`Exibir exemplo de ${tab.label}`"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
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
  border: none !important;
  box-shadow: none !important;
}

.dock-tab-btn {
  color: var(--clr-text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 9999px;
  transition: background-color 0.2s ease, color 0.2s ease;
  text-align: center;
}

.dock-tab-btn:hover {
  color: var(--clr-text);
}

.dock-tab-btn.active {
  background-color: var(--clr-primary);
  color: #0F0F0F;
}

.monitor-top-bezel {
  background-color: var(--clr-monitor-bezel);
  border: none;
}

.monitor-camera {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--clr-monitor-camera);
  border: none;
}

.glass-card {
  background: var(--clr-card-bg);
  border: none !important;
  border-radius: 1.5rem;
  box-shadow: none !important;
  pointer-events: auto;
  width: auto;
  max-width: 65vh;
  aspect-ratio: 16 / 9;
  min-width: 1100px;
  flex-shrink: 0;
  position: relative;
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;
}

.video-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.6) 50%, transparent 100%);
  padding: 4rem 2rem 2rem 2rem;
  pointer-events: none;
  z-index: 20;
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
    min-width: 900px;
    height: 55vh;
    width: auto;
    min-height: 600px;
  }
}

@media (max-width: 768px) {
  .glass-card {
    width: 100%;
    min-width: 0;
    aspect-ratio: 4/3;
  }
  .video-overlay { padding: 3rem 1.5rem 1.5rem 1.5rem; }
  .video-overlay h3 { font-size: 1rem; line-height: 1.15; margin-bottom: 0.5rem; }
  .video-overlay p { font-size: 0.75rem; max-width: 90%; margin: 0; line-height: 1.3; }
  .floating-dock-container { margin-top: 0.75rem; padding: 0 0.5rem; }
  .dock-tab-btn { padding: 4px 10px; font-size: 0.75rem; }
  .showcase-layer {
    transform: translateY(0%) !important;
    height: auto;
    position: relative !important;
    bottom: auto !important;
    padding-bottom: 1rem;
  }
}
</style>
