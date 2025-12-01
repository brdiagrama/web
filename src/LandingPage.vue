<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { RefreshCw, ArrowLeft } from "lucide-vue-next";
import InstallButton from './components/InstallButton.vue';

// Registra o plugin do ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// --- ESTADO REATIVO ---
const hasScrolled = ref(false);
const activeTab = ref("1:1");
const typeWriterText = ref("");

// Dados das Abas
const tabs = [
  { id: "1:1", label: "Um para Um" },
  { id: "1:N", label: "Um para Muitos" },
  { id: "apenas1:N", label: "Somente 1:N" },
  { id: "N:N", label: "Muitos para Muitos" },
  { id: "heranca", label: "Herança" },
];

const contents = {
  "1:1": {
    title: "Conexão Exclusiva (1:1)",
    description:
      "O diagrama detecta automaticamente a constraint UNIQUE e NOT NULL na chave estrangeira, criando um vínculo exclusivo entre as tabelas.",
    videoSrc: "/videos/1-1.mp4",
  },
  "1:N": {
    title: "Um para Muitos (Opcional)",
    description:
      "Quando a chave estrangeira aceita NULL, o diagrama representa visualmente que o relacionamento não é obrigatório (0..N).",
    videoSrc: "/videos/1-N.mp4",
  },
  "apenas1:N": {
    title: "Um para Muitos (Estrito)",
    description: "Ao definir a chave como NOT NULL, o sistema desenha a obrigatoriedade do vínculo, impedindo registros órfãos no seu modelo.",
    videoSrc: "/videos/apenas1-N.mp4",
  },
  "N:N": {
    title: "Muitos para Muitos (N:N)",
    description: "Detecção inteligente de tabelas de junção. O sistema reconhece Chaves Primárias Compostas para desenhar associações complexas sem poluição visual.",
    videoSrc: "/videos/N-N.mp4",
  },
  "heranca": {
    title: "Herança e Especialização",
    description: "Arquitetura hierárquica visualizada. Quando a PK também é uma FK, o diagrama entende a extensão da tabela e desenha a estrutura de \"Pai e Filho\".",
    videoSrc: "/videos/heranca.mp4",
  },
};

const currentTabContent = computed(() => contents[activeTab.value]);

// Navegação para o gerador (força navegação completa)
const goToGerador = async (e) => {
  e.preventDefault();
  
  // Tenta limpar cache de navegação antes de ir
  if ('caches' in window) {
    try {
      const cache = await caches.open('html-cache');
      await cache.delete('/gerador');
      console.log('Cache /gerador limpo antes de navegar');
    } catch (err) {
      console.warn('Não foi possível limpar cache:', err);
    }
  }
  
  window.location.href = '/gerador';
};

// Máquina de Escrever
const typewriterStarted = ref(false);
const _typewriterTimeouts = [];
const startTypewriter = () => {
  const fullText = "BrDiagrama é a solução para transformar SQL em visual.";

  // Se já terminou ou já foi iniciado, não reinicia (evita multiplicação em resize)
  if (typewriterStarted.value) return;
  if (typeWriterText.value === fullText) return;

  typewriterStarted.value = true;
  typeWriterText.value = "";

  let i = 0;
  const speed = 50;

  const type = () => {
    if (i < fullText.length) {
      typeWriterText.value += fullText.charAt(i);
      i++;
      const t = setTimeout(type, speed);
      _typewriterTimeouts.push(t);
    }
  };
  const first = setTimeout(type, 700);
  _typewriterTimeouts.push(first);
};

// Video controls
const previewVideo = ref(null);
const videoEnded = ref(false);
const onVideoEnded = () => {
  videoEnded.value = true;
};
const restartVideo = () => {
  try {
    const v = previewVideo.value;
    if (!v) return;
    v.currentTime = 0;
    const playPromise = v.play();
    if (playPromise && typeof playPromise.catch === 'function') playPromise.catch(()=>{});
    videoEnded.value = false;
  } catch (e) {}
};

watch(activeTab, () => {
  videoEnded.value = false;
});

onBeforeUnmount(() => {
  // limpa timeouts da máquina de escrever
  _typewriterTimeouts.forEach((id) => clearTimeout(id));
  _typewriterTimeouts.length = 0;
});

onMounted(() => {
  // Use ScrollTrigger.matchMedia para ativar animações pesadas apenas em telas maiores
  // e manter uma versão leve / sem pin no mobile. Isso evita travamentos e bugs
  // relacionados a 'pin' e transforms em dispositivos touch.
  ScrollTrigger.matchMedia({
    // Desktops/tablets maiores: animações completas
    "(min-width: 769px)": function () {
      // 1. ANIMAÇÃO DE ENTRADA (HERO)
      const heroTl = gsap.timeline({ delay: 0.1 });

      // Esconde a bolinha ANTES de tudo
      gsap.set(".travel-dot", { autoAlpha: 0 });

      heroTl.to("#left-database", {
        opacity: 0.3,
        y: 0,
        duration: 1,
        ease: "power2.out",
      });

      heroTl
        .from(
          "#hero-title-top",
          { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" },
          "-=0.5"
        )
        .from(
          "#hero-title-keyword",
          { y: 40, opacity: 0, duration: 0.8, ease: "power3.out" },
          "-=0.6"
        );

      // Linha de conexão animada (desktop)
      const connectionLine = document.querySelector(".connection-line");
      if (connectionLine) {
        const length = connectionLine.getTotalLength();

        gsap.set(connectionLine, {
          strokeDasharray: length,
          strokeDashoffset: length,
          autoAlpha: 0.3,
        });

        heroTl.to(
          connectionLine,
          { strokeDashoffset: 0, autoAlpha: 0.3, duration: 2.5, ease: "power2.inOut" },
          "-=0.4"
        );

        heroTl.call(
          () => {
            const motion = document.querySelector(".travel-dot animateMotion");
            if (motion) motion.beginElement();
          },
          null,
          "<"
        );

        heroTl.to(
          ".travel-dot",
          { autoAlpha: 1, duration: 0.3 },
          "<"
        );

        heroTl.to(
          "#right-icon-diagram",
          { opacity: 0.3, duration: 0.8, ease: "power2.out" },
          "-=0.8"
        );
      }

      startTypewriter();

      // ScrollTrigger com pin apenas em telas grandes
      let scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".pin-wrapper",
          start: "top top",
          end: "+=80%",
          scrub: true,
          pin: true,
        },
      });

      scrollTl.to(
        ".showcase-layer",
        { y: "0%", ease: "none", duration: 3 },
        0
      );

      scrollTl.to(
        ".hero-layer",
        { scale: 0.95, opacity: 0, y: -100, duration: 3 },
        0
      );

      scrollTl.to(
        ".bg-overlay",
        { opacity: 0.8, duration: 2.5, ease: "none" },
        0.5
      );

      // Atualiza hasScrolled (funciona em desktop também)
      const _onScroll = () => {
        hasScrolled.value = window.scrollY > 50;
      };
      window.addEventListener("scroll", _onScroll);

      // cleanup — quando o media query deixar de combinar, mata timelines e listeners
      return () => {
        try {
          heroTl && heroTl.kill();
        } catch (e) {}
        try {
          if (scrollTl && scrollTl.scrollTrigger) scrollTl.scrollTrigger.kill();
        } catch (e) {}
        try {
          scrollTl && scrollTl.kill();
        } catch (e) {}
        window.removeEventListener("scroll", _onScroll);
      };
    },

    // Mobile: versão leve — sem pin, sem animações pesadas
    "(max-width: 768px)": function () {
      // Versão simplificada: apenas faz um fade-in leve dos títulos e inicia o typewriter
      gsap.set(".travel-dot", { autoAlpha: 0 });

      const heroTl = gsap.timeline();
      heroTl.to("#left-database", { opacity: 0.25, duration: 0.3, ease: "power1.out" });
      heroTl.to("#hero-title-top", { y: 0, opacity: 1, duration: 0.45, ease: "power1.out" }, "-=0.1");
      heroTl.to("#hero-title-keyword", { y: 0, opacity: 1, duration: 0.45, ease: "power1.out" }, "-=0.35");

      // Não criamos ScrollTrigger com pin no mobile — isso costuma causar travamentos
      // e problemas de layout em navegadores móveis.

      startTypewriter();

      const _onScrollMobile = () => {
        hasScrolled.value = window.scrollY > 50;
      };
      window.addEventListener("scroll", _onScrollMobile);

      return () => {
        try {
          heroTl && heroTl.kill();
        } catch (e) {}
        window.removeEventListener("scroll", _onScrollMobile);
      };
    },
  });
});
</script>

<template>
  <div id="landing-app">
    <!-- HEADER -->
    <!-- 1. HEADER (Logo Maior) -->
    <header
      class="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center transition-all duration-500"
      :class="{ 'header-scrolled': hasScrolled }"
    >
      <div class="flex items-center gap-2">
        <!-- Mudei de h-6 para h-10 (40px) ou h-12 para ficar bem visível -->
        <img
          src="../src/assets/images/logo/logo-completa.svg"
          alt="BrDiagrama Logo"
          class="h-10 md:h-12 transition-all"
        />
      </div>
      <!-- ... nav ... -->
      <nav class="hidden md:flex gap-6 items-center">
        <a
          href="#sobre"
          class="text-sm font-medium hover:text-[var(--clr-primary)] transition-colors"
          >Sobre</a
        >
        <a
          href="#faq"
          class="text-sm font-medium hover:text-[var(--clr-primary)] transition-colors"
          >FAQ</a
        >
        <a
          href="/gerador"
          class="install-btn-fallback"
          title="Ir para o Gerador (onde você pode instalar o app)"
        >
          Instalar App
        </a>
      </nav>
    </header>

    <!-- WRAPPER DO SCROLL ANIMADO -->
    <div class="pin-wrapper">
      <div
        class="bg-overlay absolute inset-0 bg-slate-950 z-[5] opacity-0 pointer-events-none"
      ></div>
      <!-- CAMADA 1: HERO (Fundo) -->
      <!-- Dentro do .pin-wrapper -->

      <section class="hero-layer text-center px-4">
        <!-- BACKGROUND DECORATIVO (Diagrama Sutil) -->
        <!-- Mudei de text-white para text-slate-600 para ficar bem discreto no fundo escuro -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden hidden lg:block">
          <svg
            class="connection-svg w-full h-full"
            viewBox="0 0 1153 233"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <!-- Database Icon (Esquerda) -->
            <g class="static-element" id="left-database" opacity="0">
              <path
                d="M92 77C138.944 77 177 61.33 177 42C177 22.67 138.944 7 92 7C45.0558 7 7 22.67 7 42C7 61.33 45.0558 77 92 77Z"
                stroke="#334155"
                stroke-width="4"
              />
              <path
                d="M7 42V192C7.39283 196.603 9.98041 201.161 14.615 205.414C19.2496 209.667 25.8404 213.531 34.0112 216.786C42.1819 220.041 51.7726 222.622 62.2356 224.384C72.6986 226.146 83.829 227.052 94.9914 227.052C106.154 227.052 117.129 226.146 127.292 224.384C137.454 222.622 146.604 220.041 154.219 216.786C161.835 213.531 167.766 209.667 171.675 205.414C175.583 201.161 177.393 196.603 177 192V42M7 92C7.39283 96.6031 9.98041 101.161 14.615 105.414C19.2496 109.667 25.8404 113.531 34.0112 116.786C42.1819 120.041 51.7726 122.622 62.2356 124.384C72.6986 126.146 83.829 127.052 94.9914 127.052C106.154 127.052 117.129 126.146 127.292 124.384C137.454 122.622 146.604 120.041 154.219 116.786C161.835 113.531 167.766 109.667 171.675 105.414C175.583 101.161 177.393 96.6031 177 92M7 142C7.39283 146.603 9.98041 151.161 14.615 155.414C19.2496 159.667 25.8404 163.531 34.0112 166.786C42.1819 170.041 51.7726 172.622 62.2356 174.384C72.6986 176.146 83.829 177.052 94.9914 177.052C106.154 177.052 117.129 176.146 127.292 174.384C137.454 172.622 146.604 170.041 154.219 166.786C161.835 163.531 167.766 159.667 171.675 155.414C175.583 151.161 177.393 146.603 177 142"
                stroke="#334155"
                stroke-width="4"
              />
            </g>

            <!-- Linha de Conexão Curva (A Animada) -->
            <path
              class="connection-line"
              opacity="0.3"
              d="M178 99.6105C757.573 405.738 375.005 -121.72 970 109.598"
              stroke="#334155"
              stroke-width="3"
              stroke-linecap="round"
              fill="none"
            />

            <!-- Diagram Icon (Direita) - Começa invisível -->
            <g class="static-element" id="right-icon-diagram" opacity="0">
              <rect
                x="969"
                y="20"
                width="181"
                height="207"
                stroke="#334155"
                stroke-width="4"
              />
              <rect
                x="969"
                y="20"
                width="181"
                height="41"
                stroke="#334155"
                stroke-width="4"
              />
            </g>

            <!-- Bolinha que viaja na linha -->
            <circle r="5" fill="#334155" class="travel-dot" opacity="0">
              <animateMotion
                dur="2.5s"
                begin="indefinite"
                fill="freeze"
                path="M178 99.6105C757.573 405.738 375.005 -121.72 970 109.598"
              />
            </circle>
          </svg>
        </div>

        <div
          class="hero-content relative z-10 max-w-4xl mx-auto flex flex-col items-center"
        >
          <!-- TÍTULO UNIFICADO -->
          <!-- Adicionei a classe 'hero-title' aqui para animar o bloco todo -->
          <h1 class="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            <!-- Parte 1: Adicionei ID e inline-block para animar -->
            <span class="text-white inline-block" id="hero-title-top">Do SQL ao</span>
            <br />

            <!-- Parte 2: Aumentei para text-6xl md:text-8xl (Maior que o resto) -->
            <span
              class="text-gradient inline-block transform origin-bottom text-6xl md:text-8xl mt-2"
              id="hero-title-keyword"
            >
              Diagrama.
            </span>
          </h1>

          <p
            class="text-lg md:text-2xl text-gray-400 mb-10 h-16 code-font"
            aria-live="polite"
          >
            {{ typeWriterText }}<span class="cursor-blink" aria-hidden="true">|</span>
          </p>

          <a
            href="/gerador"
            @click="goToGerador"
            class="cta-button text-lg inline-flex items-center justify-center relative z-20"
            id="hero-cta"
          >
            Começar a modelar
          </a>
        </div>
      </section>

      <!-- CAMADA 2: CARD + DOCK (Frente) -->
      <section class="showcase-layer">
        <div class="flex flex-col w-full h-full max-w-[1200px] items-center justify-end">
          <!-- 1. A JANELA DO VÍDEO -->
          <div
            class="glass-card w-full flex-1 rounded-t-[2rem] flex flex-col overflow-hidden relative z-10"
          >
            <div class="flex-1 p-4 md:p-8 flex items-center justify-center relative">
              <!-- Janela Interna (Código) -->
              <div
                class="code-window shadow-2xl flex flex-col bg-[#0d1117] rounded-lg overflow-hidden border border-[#30363d]"
              >
                <div
                  class="window-header bg-[#161b22] p-3 flex gap-2 border-b border-[#30363d] z-10 relative"
                >
                  <div class="dot red w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                  <div class="dot yellow w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                  <div class="dot green w-3 h-3 rounded-full bg-[#27c93f]"></div>
                  <span class="text-xs text-gray-500 ml-2 font-mono"
                    >{{ activeTab }}.sql</span
                  >
                  <!-- header controls (removed back button) -->
                </div>

                <div class="flex-1 relative w-full h-full bg-[#0d1117]">
                  <transition name="fade" mode="out-in">
                    <template v-if="currentTabContent.videoSrc">
                      <video
                        ref="previewVideo"
                        :key="activeTab"
                        autoplay
                        muted
                        playsinline
                        class="w-full h-full object-cover"
                        :src="currentTabContent.videoSrc"
                        @ended="onVideoEnded"
                      ></video>
                    </template>
                    <template v-else>
                      <div class="video-placeholder w-full h-full flex items-center justify-center bg-[#071018] text-gray-300">
                        <div class="px-6 text-center">
                          <h4 class="text-lg font-semibold mb-2">{{ currentTabContent.title }}</h4>
                          <p class="text-sm max-w-xs mx-auto">{{ currentTabContent.description || 'Visualização indisponível para esta aba.' }}</p>
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
                  <button class="video-restart-btn" @click="restartVideo" :aria-pressed="videoEnded" title="Reiniciar vídeo">
                    <RefreshCw :size="16" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. A FAIXA DOS BOTÕES (DOCK) -->
          <!-- Adicionada classe 'dock-strip' para puxar para cima -->
          <div class="w-full relative z-20 dock-strip">
            <!-- Linha Neon Superior (Aumentada) -->
            <div
              class="h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--clr-primary)] to-transparent opacity-80 shadow-[0_-5px_25px_var(--clr-primary)] relative z-30"
            ></div>

            <!-- Background da Faixa (Cor diferente do fundo principal) -->
            <!-- Mudei o bg-[#0F172A] para bg-slate-950 (um pouco mais escuro) -->
            <nav
              class="bg-slate-950 w-screen relative left-1/2 -translate-x-1/2 pt-6 pb-8 px-4 flex justify-center items-center border-t border-white/10"
            >
              <!-- Efeito de Brilho Inferior (Glow) -->

              <!-- Pílula dos Botões (Mantida igual, só aumentei o z-index) -->
              <div
                class="flex flex-wrap justify-center gap-3 md:gap-6 px-6 py-3 rounded-full border border-slate-800 bg-slate-900/80 shadow-lg relative z-40"
              >
                <button
                  v-for="tab in tabs"
                  :key="tab.id"
                  @click="activeTab = tab.id"
                  class="tab-btn px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 hover:text-white"
                  :class="{ 'active-pill': activeTab === tab.id }"
                >
                  {{ tab.label }}
                </button>
              </div>
            </nav>
          </div>
        </div>
      </section>
    </div>

    <!-- SEÇÃO SEGUINTE (FOOTER) -->
    <section
      class="h-[50vh] bg-slate-900 flex items-center justify-center relative z-20 border-t border-slate-800"
    >
      <div class="text-center">
        <h2 class="text-4xl font-bold text-white mb-4">Pronto para começar?</h2>
        <p class="text-gray-400 mb-6">O seu banco de dados nunca foi tão visual.</p>
        <a href="/editor.html" class="cta-button text-lg">Acessar Editor</a>
      </div>
    </section>
  </div>
</template>

<!-- ESTILOS GLOBAIS -->
<style>
:root {
  --clr-primary: #1abc9c;
  --clr-bg: #0f172a;
  --clr-text: #e0e0e0;
  --clr-card-bg: rgba(30, 41, 59, 0.7);
}
</style>

<!-- ESTILOS DO COMPONENTE -->
<style scoped>
.dock-strip {
  margin-top: -2.4rem; /* Seu valor ajustado */
  /* Garante que a dock fique acima do card para a sobreposição funcionar */
  position: relative;
  z-index: 20;
}

.dock-strip nav {
  position: relative;
  z-index: 20;
}

.code-font {
  font-family: "JetBrains Mono", monospace;
}

/* Card de Vidro */
.glass-card {
  background: var(--clr-card-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 -15px 40px -10px rgba(0, 0, 0, 0.5);
  border-bottom: none;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  pointer-events: auto;

  /* --- A REGRA DE OURO DO VÍDEO --- */
  width: auto; 
  max-width: 65vh;
  
  /* 1. Trava a proporção em 16:9 (Cinema). 
     O card vai aumentar/diminuir a altura automaticamente baseado na largura. */
  aspect-ratio: 16 / 9;

  /* 2. Impede que fique muito pequeno em Notebooks.
     Se a tela for menor que 900px, vai aparecer barra de rolagem horizontal 
     (comportamento que você pediu) em vez de esmagar o vídeo. */
  min-width: 1100px;

  /* Flexibilidade */
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
  
  /* Gradiente preto embaixo para o texto branco ler bem em qualquer vídeo */
  background: linear-gradient(to top, rgba(2, 6, 23, 0.95) 0%, rgba(2, 6, 23, 0.6) 50%, transparent 100%);
  
  /* Espaçamento generoso para não colar na borda */
  padding: 4rem 2rem 2rem 2rem;
  
  /* Garante que o mouse atravesse o texto (se quiser clicar no vídeo) */
  pointer-events: none;
  z-index: 20;
}

@media (max-width: 768px) {
  .glass-card {
    width: 100%;       /* Ocupa largura total */
    min-width: 0;      /* Remove a trava de 900px */
    aspect-ratio: 4/3; /* Fica um pouco mais quadrado/alto no celular para ver melhor */
  }
  
  .video-overlay {
    padding: 3rem 1.5rem 1.5rem 1.5rem; /* Ajusta padding */
  }
  /* Texto do overlay menor no mobile para não ocupar tanto espaço */
  .video-overlay h3 {
    font-size: 1rem; /* ~8px */
    line-height: 1.15;
    margin-bottom: 0.5rem;
  }

  .video-overlay p {
    font-size: 0.5rem; /* ~13.6px */
    max-width: 90%;
    margin: 0;
    line-height: 1.3;
  }
  
  /* Mostrar a dock no celular (botões de troca de vídeo) */
  .dock-strip {
    display: block;
    margin-top: 0.75rem;
    padding: 0 1rem;
  }

  /* Ajustes para os botões no mobile: ficam menores e empilháveis */
  .dock-strip .tab-btn {
    padding: 8px 12px;
    font-size: 13px;
  }
  
  /* Se esconder a dock, ajusta o título para aparecer */
  .showcase-layer {
     transform: translateY(0%) !important; /* Mostra o card inteiro */
     height: auto;
     position: relative; /* Muda para fluxo normal no mobile */
  }
  
  /* Ajuste no container pai */
  .pin-wrapper {
    height: auto;
    display: block;
    overflow: visible;
  }
}

/* Espaçamento extra para o HERO e título */
.hero-layer {
  padding-top: 3.5rem;
  padding-bottom: 1.5rem;
}

.hero-content {
  margin-top: 1.25rem;
  margin-bottom: 1.25rem;
}

/* Melhor alinhamento do card de vídeo (centralizar e impedir deslocamento para a esquerda) */
.glass-card {
  margin-left: auto;
  margin-right: auto;
}

/* Garante que o conteúdo interno do card (janela de código) fique centrado e não provoque overflow */
.code-window {
  margin-left: auto;
  margin-right: auto;
  max-width: 100%;
}

@media (max-width: 768px) {
  /* Espaço extra no topo do HERO para não encostar no header fixo */
  .hero-layer {
    margin-top: calc(3.5rem + 1rem); /* empurra abaixo do cabeçalho fixo */
  }

  /* Ajusta largura do card no mobile para evitar lacunas laterais
     e garantir um pequeno gutter à esquerda/direita */
  .glass-card {
    width: calc(100% - 2rem);
    max-width: 720px;
  }
}

/* --- AJUSTE PARA NOTEBOOKS (Telas Baixas) --- */
@media (min-width: 769px) and (max-height: 800px) {
  .pin-wrapper .showcase-layer {
    
    /* 1. Mantenha no chão */
    justify-content: flex-end;
    
    /* 2. O PULO DO GATO: */
    /* Coloque um valor alto (como você testou no original e gostou). */
    /* Isso faz ele começar BEM escondido lá embaixo. */
    /* SEM !important aqui, senão o GSAP não consegue puxar ele de volta! */
    transform: translateY(120%); 
    
    /* Zera o padding para o card descer o máximo possível */
    padding-bottom: 0;
  }
  
  .glass-card {
    /* AQUI ESTAVA O PROBLEMA: */
    /* Removemos a trava de largura e forçamos a altura a caber */
    min-width: 900px; 
    height: 55vh; /* Ocupa pouco mais da metade da tela */
    width: auto;  /* A largura será calculada automaticamente (55vh * 1.77) */
    
    /* Garante que não fique minúsculo também */
    min-height: 600px;
  }
}

/* Cursor piscante */
.cursor-blink {
  display: inline-block;
  width: 10px;
  background-color: var(--clr-primary);
  animation: blink 1s step-end infinite;
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* WRAPPER PRINCIPAL */
.pin-wrapper {
  height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--clr-bg);
}

/* HERO LAYER (Fundo) */
.hero-layer {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1;
}

/* SHOWCASE LAYER (Card) */
.showcase-layer {
  position: absolute;
  width: 95%; /* Um pouco mais largo no mobile */
  max-width: 1200px;
  height: 85vh; /* Altura total do conjunto */
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

/* Janela interna do código */
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
  background: #161b22;
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
.red {
  background: #ff5f56;
}
.yellow {
  background: #ffbd2e;
}
.green {
  background: #27c93f;
}

/* Botão Principal */
.cta-button {
  background-color: var(--clr-primary);
  color: #0f172a;
  font-weight: 700;
  padding: 12px 32px;
  border-radius: 9999px;
  transition: all 0.3s ease;
  text-decoration: none;

  /* Layout e Visibilidade */
  display: inline-flex; /* Corrigido de 'visible' para 'inline-flex' */
  align-items: center;
  justify-content: center;
  opacity: 1;

  /* Sombra Neon Inicial */
  box-shadow: 0 0 20px rgba(26, 188, 156, 0.4);

  /* CRUCIAL PARA O SHINE: */
  position: relative;
  overflow: hidden; /* Garante que o brilho não vaze para fora das bordas redondas */
}

/* Estado de Hover (Levanta e muda cor) */
.cta-button:hover {
  background-color: #31e0bd; /* Um turquesa levemente mais claro */
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(26, 188, 156, 0.6);
}

/* O FACHO DE LUZ (SHINE) */
.cta-button::after {
  content: "";
  position: absolute;
  top: 0;
  left: -100%; /* Começa escondido à esquerda */
  width: 100%;
  height: 100%;

  /* O Brilho em si: Transparente -> Branco -> Transparente */
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);

  /* Inclina o facho de luz */
  transform: skewX(-20deg);

  /* Sem transição na volta (reset instantâneo) */
  transition: none;
}

/* A ANIMAÇÃO AO PASSAR O MOUSE */
.cta-button:hover::after {
  left: 200%; /* Atravessa para a direita */
  transition: left 0.6s ease-in-out; /* Duração da passagem do brilho */
}

/* Botões da Dock (Estilo Pill) */
.tab-btn {
  color: #94a3b8;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.05);
}

/* Estado Ativo do Pill */
.active-pill {
  background-color: rgba(26, 188, 156, 0.15);
  color: var(--clr-primary);
  border-color: var(--clr-primary);
  box-shadow: 0 0 15px rgba(26, 188, 156, 0.15);
}

.active-pill:hover {
  background-color: rgba(26, 188, 156, 0.2);
}

/* Botão de reiniciar vídeo (canto inferior direito do card) */
.video-restart-btn {
  position: absolute;
  right: 12px;
  bottom: 20px;
  z-index: 40;
  /* Fundo escuro similar ao card, com borda e ícone na cor primária (ativo) */
  background: rgba(3, 7, 15, 0.6);
  color: var(--clr-primary);
  border-radius: 10px;
  padding: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(16,185,129,0.06), inset 0 1px 0 rgba(255,255,255,0.02);
  border: 1px solid rgba(26,188,156,0.25); /* borda ciano suave */
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.video-restart-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(16,185,129,0.14); }

/* Força a cor do SVG/ícone para usar a cor primária */
.video-restart-btn svg {
  color: var(--clr-primary) !important;
  stroke: currentColor !important;
  fill: none !important;
}

/* Botão de voltar no header (pequeno) */
/* header-back-btn removed */

/* Transições Vue */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

@media (max-width: 768px) {
  .dock-strip nav {
    padding-top: 1rem;
    padding-bottom: 1.5rem;
  }
}

.text-gradient {
  background: linear-gradient(to right, #1abc9c, #a5f3fc);

  /* --- Configurações Obrigatórias para Gradiente em Texto --- */
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;

  /* Aumenta um pouco a altura da linha para caber o 'g' */
  padding-bottom: 0.2em; /* Cria um espaço extra embaixo para o brilho e a perna do 'g' */
  /* Mantém legibilidade e peso */
  display: inline-block;
  font-weight: 800;

  /* Um leve drop-shadow ajuda a separar o gradiente do fundo escuro */
  filter: drop-shadow(0 0 20px rgba(26, 188, 156, 0.3));
}

.header-scrolled {
  /* Fundo Escuro Sólido (95% opacidade) para substituir o blur */
  background-color: rgba(15, 23, 42, 0.95); /* Slate-950 */

  /* A animação acontece aqui */
  animation: border-neutral-flash 0.8s ease-out forwards;
}

@keyframes border-neutral-flash {
  /* 1. Começa sem borda */
  0% {
    border-bottom: 1px solid transparent;
  }
  /* 2. O "Flash" (Piscada) */
  /* Uma cor neutra, levemente mais clara que o final, mas não branca pura */
  40% {
    border-bottom: 1px solid rgba(148, 163, 184, 0.4); /* Slate-400 com baixa opacidade */
  }
  /* 3. O Assentamento (Estado Final) */
  /* A borda fixa que permanece */
  100% {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08); /* Linha muito sutil */
  }
}

/* SVG de Conexão */
.connection-svg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 95%;
  height: auto;
  /* Garante que o SVG se adapte ao container */
}

@media (max-width: 768px) {
  .connection-svg {
    width: 250%;
    max-width: none;
  }

  /* Esconde tudo exceto a linha no mobile */
  .static-element,
  .travel-dot {
    display: none !important;
  }

  /* A linha fica bem discreta */
  .connection-line {
    opacity: 0.25 !important;
    stroke-width: 2 !important;
  }
}

/* Mobile: evitar crop agressivo do vídeo, mostrar todo o frame */
@media (max-width: 768px) {
  .code-window video {
    object-fit: contain !important;
    background: #000;
  }
  .video-placeholder h4 {
    color: #e6f7f4;
  }
}

/* Remove o display: none do container no mobile */
@media (max-width: 768px) {
  .absolute.inset-0.pointer-events-none.overflow-hidden {
    display: block !important; /* Força aparecer */
  }
}

.connection-line {
  fill: none;
  stroke-linecap: round;
  filter: drop-shadow(0 0 10px rgba(26, 188, 156, 0.4));
}

.travel-dot {
  filter: drop-shadow(0 0 8px rgba(26, 188, 156, 0.8));
}

.static-element {
  fill: none;
  transition: opacity 0.8s ease;
}

/* FIX MOBILE: reduzir 'borda preta' do vídeo e garantir que o HERO apareça
   - Remove aspect-ratio for mobile and define a reasonable height
   - Use object-fit: cover para preencher o frame (menos letterbox)
   - Garante que .hero-layer seja posicionado normalmente no fluxo para aparecer */
@media (max-width: 768px) {
  .glass-card {
    aspect-ratio: auto; /* não forçar 4/3 aqui */
    height: 55vh; /* ocupa boa parte da viewport sem criar bordas gigantes */
    max-height: 70vh;
    min-height: 300px;
    width: 100%;
    min-width: 0;
  }

  /* Preenche o container do card com o vídeo, evitando barras pretas grandes */
  .code-window video {
    object-fit: cover !important;
    width: 100%;
    height: 100%;
    background: #000;
  }

  /* Caso o vídeo não exista, o placeholder fica mais compacto */
  .video-placeholder {
    padding: 1.25rem;
  }

  /* Faz o HERO renderizar em fluxo normal (antes estava absoluto com height:100%) */
  .hero-layer {
    position: relative !important;
    height: auto !important;
    padding-top: 1.5rem;
    padding-bottom: 1rem;
    z-index: 5;
  }

  .showcase-layer {
    position: relative !important;
    transform: translateY(0%) !important;
    height: auto !important;
    bottom: auto !important;
    align-items: flex-end;
    padding-bottom: 1rem;
  }

  .pin-wrapper {
    height: auto !important;
    display: block !important;
    overflow: visible !important;
  }
}

/* Botão de instalar na landing (link para /gerador) */
.install-btn-fallback {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #1abc9c 0%, #16a085 100%);
  color: white !important;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(26, 188, 156, 0.3);
  text-decoration: none;
}

.install-btn-fallback:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 188, 156, 0.4);
}

.install-btn-fallback:active {
  transform: translateY(0);
}
</style>
