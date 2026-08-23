<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { RefreshCw } from "lucide-vue-next";

const activeTab = ref("1:1");

const tabs = [
  { id: "1:1", label: "Um para Um" },
  { id: "1:N", label: "Um para Muitos" },
  { id: "apenas1:N", label: "Somente 1:N" },
  { id: "N:N", label: "Muitos para Muitos" },
  { id: "heranca", label: "Herança" },
];

const contents: Record<string, any> = {
  "1:1": {
    title: "Conexão Exclusiva (1:1)",
    description: "O diagrama detecta automaticamente a constraint UNIQUE e NOT NULL na chave estrangeira, criando um vínculo exclusivo entre as tabelas.",
    youtubeId: "rJdxLFanZoo",
  },
  "1:N": {
    title: "Um para Muitos (Opcional)",
    description: "Quando a chave estrangeira aceita NULL, o diagrama representa visualmente que o relacionamento não é obrigatório (0..N).",
    youtubeId: "2y40czV1KKw",
  },
  "apenas1:N": {
    title: "Um para Muitos (Estrito)",
    description: "Ao definir a chave como NOT NULL, o sistema desenha a obrigatoriedade do vínculo, impedindo registros órfãos no seu modelo.",
    youtubeId: "AbAfLUhv5Ys",
  },
  "N:N": {
    title: "Muitos para Muitos (N:N)",
    description: "Detecção inteligente de tabelas de junção. O sistema reconhece Chaves Primárias Compostas para desenhar associações complexas sem poluição visual.",
    youtubeId: "Dqx2GfKxH7M",
  },
  "heranca": {
    title: "Herança e Especialização",
    description: 'Arquitetura hierárquica visualizada. Quando a PK também é uma FK, o diagrama entende a extensão da tabela e desenha a estrutura de "Pai e Filho".',
    youtubeId: "_SvCiD54R4w",
  },
};

const currentTabContent = computed(() => contents[activeTab.value]);

const previewVideo = ref<HTMLVideoElement | null>(null);
const videoEnded = ref(false);
const videoLoading = ref(true);

const onVideoEnded = () => { videoEnded.value = true; };
const onVideoLoaded = () => { videoLoading.value = false; };
const onVideoLoadStart = () => { videoLoading.value = true; };

const restartVideo = () => {
  try {
    const v = previewVideo.value;
    if (!v) return;
    v.currentTime = 0;
    const playPromise = v.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
    videoEnded.value = false;
  } catch (e) {}
};

watch(activeTab, () => {
  videoEnded.value = false;
  videoLoading.value = true;
  if (contents[activeTab.value].youtubeId) {
    setTimeout(() => { videoLoading.value = false; }, 400);
  }
});

onMounted(() => {
  if (contents[activeTab.value].youtubeId) {
    setTimeout(() => { videoLoading.value = false; }, 800);
  }
});
</script>

<template>
  <section class="showcase-layer">
    <div class="flex flex-col w-full h-full max-w-[1200px] items-center justify-end">
      <!-- JANELA DO VÍDEO -->
      <div class="glass-card w-full flex-1 rounded-t-[2rem] flex flex-col overflow-hidden relative z-10">
        <div class="flex-1 p-4 md:p-8 flex items-center justify-center relative">
          <!-- Janela Interna (Código) -->
          <div class="code-window shadow-2xl flex flex-col bg-[#0d1117] rounded-lg overflow-hidden border border-[#30363d]">
            <div class="window-header bg-[#161b22] p-3 flex gap-2 border-b border-[#30363d] z-10 relative" aria-hidden="true">
              <div class="dot dot1 w-3 h-3 rounded-full"></div>
              <div class="dot dot2 w-3 h-3 rounded-full"></div>
              <div class="dot dot3 w-3 h-3 rounded-full"></div>
              <span class="text-xs text-gray-500 ml-2 font-mono">{{ activeTab }}.sql</span>
            </div>

            <div class="flex-1 relative w-full h-full bg-[#0F172A]">
              <transition name="spinner-fade">
                <div v-if="videoLoading" class="absolute inset-0 flex items-center justify-center bg-[#0F172A] z-30">
                  <div class="spinner"></div>
                </div>
              </transition>

              <transition name="fade" mode="out-in">
                <!-- YouTube Embed -->
                <template v-if="currentTabContent.youtubeId">
                  <iframe
                    :key="activeTab"
                    class="w-full h-full"
                    :src="`https://www.youtube.com/embed/${currentTabContent.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${currentTabContent.youtubeId}&controls=0&modestbranding=1&rel=0&showinfo=0`"
                    frameborder="0"
                    allow="autoplay; encrypted-media"
                    allowfullscreen
                    loading="eager"
                    :aria-label="`Demonstração: ${currentTabContent.title}`"
                  ></iframe>
                </template>
                <!-- Vídeo Local -->
                <template v-else-if="currentTabContent.videoSrc">
                  <video
                    ref="previewVideo"
                    :key="activeTab"
                    autoplay
                    muted
                    playsinline
                    class="w-full h-full object-cover"
                    :src="currentTabContent.videoSrc"
                    @ended="onVideoEnded"
                    @loadeddata="onVideoLoaded"
                    @loadstart="onVideoLoadStart"
                    :aria-label="`Demonstração: ${currentTabContent.title}`"
                  >
                    <track kind="captions" label="Português" srclang="pt-BR" />
                    Seu navegador não suporta vídeos HTML5.
                  </video>
                </template>
                <!-- Placeholder -->
                <template v-else>
                  <div class="video-placeholder w-full h-full flex items-center justify-center bg-[#0F172A] text-gray-300">
                    <div class="px-6 text-center">
                      <h4 class="text-lg font-semibold mb-2">{{ currentTabContent.title }}</h4>
                      <p class="text-sm max-w-xs mx-auto">{{ currentTabContent.description || "Visualização indisponível para esta aba." }}</p>
                    </div>
                  </div>
                </template>
              </transition>

              <div class="video-overlay">
                <h3 class="text-xl md:text-2xl text-white font-bold mb-2 shadow-black drop-shadow-md">
                  {{ currentTabContent.title }}
                </h3>
                <p class="text-gray-200 text-sm md:text-base max-w-lg shadow-black drop-shadow-md leading-relaxed">
                  {{ currentTabContent.description }}
                </p>
              </div>
              <button
                v-if="currentTabContent.videoSrc && !currentTabContent.youtubeId"
                class="video-restart-btn"
                @click="restartVideo"
                :aria-pressed="videoEnded"
                title="Reiniciar vídeo"
              >
                <RefreshCw :size="16" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- A faixa de botões -->
      <div class="w-full relative z-20 dock-strip">
        <div class="h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--clr-primary)] to-transparent opacity-80 shadow-[0_-5px_25px_var(--clr-primary)] relative z-30" aria-hidden="true"></div>
        <nav class="bg-slate-950 w-screen relative left-1/2 -translate-x-1/2 pt-6 pb-8 px-4 flex justify-center items-center border-t border-white/10" role="tablist" aria-label="Tipos de relacionamento">
          <div class="flex flex-wrap justify-center gap-3 md:gap-6 px-6 py-3 rounded-full border border-slate-800 bg-slate-900/80 shadow-lg relative z-40">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="tab-btn px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 hover:text-white"
              :class="{ 'active-pill': activeTab === tab.id }"
              role="tab"
              :aria-selected="activeTab === tab.id"
              :aria-controls="`panel-${tab.id}`"
              :aria-label="`Exibir exemplo de ${tab.label}`"
            >
              {{ tab.label }}
            </button>
          </div>
        </nav>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dock-strip {
  margin-top: -2.4rem;
  position: relative;
  z-index: 20;
}

.dock-strip nav {
  position: relative;
  z-index: 20;
}

.glass-card {
  background: var(--clr-card-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 -15px 40px -10px rgba(0, 0, 0, 0.5);
  border-bottom: none;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
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
  background: linear-gradient(to top, rgba(2, 6, 23, 0.95) 0%, rgba(2, 6, 23, 0.6) 50%, transparent 100%);
  padding: 4rem 2rem 2rem 2rem;
  pointer-events: none;
  z-index: 20;
}

.code-window {
  background: #0d1117;
  border-radius: 8px;
  border: 1px solid #30363d;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;
}

.window-header {
  background: #020617;
  padding: 10px;
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #30363d;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.dot1 { background: #0d9488; box-shadow: 0 0 8px rgba(13, 148, 136, 0.4); }
.dot2 { background: #1abc9c; box-shadow: 0 0 8px rgba(26, 188, 156, 0.4); }
.dot3 { background: #5eead4; box-shadow: 0 0 8px rgba(94, 234, 212, 0.4); }

.tab-btn {
  color: #94a3b8;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.05);
}

.active-pill {
  background-color: rgba(26, 188, 156, 0.15);
  color: var(--clr-primary);
  border-color: var(--clr-primary);
  box-shadow: 0 0 15px rgba(26, 188, 156, 0.15);
}

.active-pill:hover {
  background-color: rgba(26, 188, 156, 0.2);
}

.video-restart-btn {
  position: absolute;
  right: 12px;
  bottom: 20px;
  z-index: 40;
  background: rgba(3, 7, 15, 0.6);
  color: var(--clr-primary);
  border-radius: 10px;
  padding: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(26, 188, 156, 0.25);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.video-restart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(16, 185, 129, 0.14);
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
  border: 4px solid rgba(26, 188, 156, 0.1);
  border-top-color: var(--clr-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  box-shadow: 0 0 20px rgba(26, 188, 156, 0.3);
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
  align-items: flex-end;
  flex-direction: column;
  margin-left: auto;
  margin-right: auto;
  transform: translateY(75%);
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
  .video-overlay p { font-size: 0.5rem; max-width: 90%; margin: 0; line-height: 1.3; }
  .dock-strip { display: block; margin-top: 0.75rem; padding: 0 1rem; }
  .dock-strip .tab-btn { padding: 8px 12px; font-size: 13px; }
  .showcase-layer {
    transform: translateY(0%) !important;
    height: auto;
    position: relative !important;
    bottom: auto !important;
    padding-bottom: 1rem;
  }
}
</style>
