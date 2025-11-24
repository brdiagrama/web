<script setup>
import { ref, computed, onMounted } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
  { id: "only1:N", label: "Somente 1:N" },
  { id: "N:N", label: "Muitos para Muitos" },
  { id: "heritage", label: "Herança" },
];

const contents = {
  "1:1": {
    title: "Relacionamento 1:1",
    description:
      "Visualize chaves únicas transformando duas tabelas em uma conexão direta.",
    codeBg: "CREATE TABLE User (\n  id INT PRIMARY KEY,\n  profile_id INT UNIQUE\n);",
  },
  "1:N": {
    title: "Relacionamento 1:N",
    description:
      "O clássico pai-filho. Veja como uma categoria abriga múltiplos produtos.",
    codeBg:
      "CREATE TABLE Order (\n  customer_id INT\n  FOREIGN KEY REFERENCES Customers(id)\n);",
  },
  "only1:N": {
    title: "Restrição Estrita",
    description: "Constraints avançadas garantindo integridade referencial.",
    codeBg: "ALTER TABLE ...\nADD CONSTRAINT ...\nNOT NULL;",
  },
  "N:N": {
    title: "Tabela Pivô (N:N)",
    description: "Criação automática da tabela associativa entre duas entidades.",
    codeBg: "CREATE TABLE StudentCourses (\n  student_id INT,\n  course_id INT\n);",
  },
  heritage: {
    title: "Especialização / Herança",
    description: "Diagramas que entendem hierarquia de classes e tabelas estendidas.",
    codeBg: "CREATE TABLE Vehicle (...);\nCREATE TABLE Car INHERITS (Vehicle);",
  },
};

const currentTabContent = computed(() => contents[activeTab.value]);

// Máquina de Escrever
const startTypewriter = () => {
  const fullText = "BrDiagrama é a solução para transformar SQL em visual.";
  let i = 0;
  const speed = 50;

  const type = () => {
    if (i < fullText.length) {
      typeWriterText.value += fullText.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  };
  setTimeout(type, 1000);
};

onMounted(() => {
  // 1. ANIMAÇÃO DE ENTRADA (HERO)
  // Garante que o botão apareça definindo autoAlpha inicial
 const heroTl = gsap.timeline({ delay: 0.1 });

  heroTl
    .from("#hero-title-keyword", {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    })

  startTypewriter();

  // 2. SCROLLTRIGGER (A Transição "GitHub")
  let scrollTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".pin-wrapper",
      start: "top top",
      // +=150% deixa o scroll mais curto e leve (antes estava 250%)
      end: "+=80%",
      scrub: true, // Suavidade leve (responsivo)
      pin: true,
    },
  });

  // LOGICA DA SEQUENCIA SOBREPOSTA:
  // Queremos que o card suba o tempo todo, mas o texto só apaga no começo.

  // A. O Card sobe desde o início até o fim da timeline
  scrollTl.to(
    ".showcase-layer",
    {
      y: "0%", // Vai para a posição final (topo/centro)
      ease: "none", // Linear para seguir o dedo do usuário fielmente
      duration: 3, // Duração "relativa" longa para ocupar toda a timeline
    },
    0
  );

  // B. O Texto da Hero some logo no início (sobreposto)
  // O parâmetro "<" (start) ou "0" garante que comece junto com o card
  scrollTl.to(
    ".hero-layer",
    {
      scale: 0.95, // Scale mais sutil
      opacity: 0,
      y: -100,
      duration: 3, // Ocupa apenas os primeiros 30% do scroll (3 de 10)
    },
    0
  ); // O "0" aqui força começar no tempo zero da timeline

  scrollTl.to(
    ".bg-overlay",
    {
      opacity: 0.8,
      duration: 2.5,
      ease: "none",
    },
    0.5
  );

  // Listener para o Header mudar de cor
  window.addEventListener("scroll", () => {
    hasScrolled.value = window.scrollY > 50;
  });
});
</script>

<template>
  <div id="landing-app">
    <!-- HEADER -->
    <header
      class="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center transition-all duration-300"
      :class="{
        'bg-slate-900/80 border-b border-slate-700/30': hasScrolled,
      }"
    >
      <div class="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1ABC9C"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
          />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span class="font-bold text-xl tracking-tight text-white">BR DIAGRAMA</span>
      </div>
      <nav class="hidden md:flex gap-6">
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
      </nav>
    </header>

    <!-- WRAPPER DO SCROLL ANIMADO -->
    <div class="pin-wrapper">
      <div
        class="bg-overlay absolute inset-0 bg-slate-950 z-[5] opacity-0 pointer-events-none"
      ></div>
      <!-- CAMADA 1: HERO (Fundo) -->
      <section class="hero-layer text-center px-4">
        <!-- Decoration BG -->
        <div
          class="absolute left-10 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none hidden lg:block"
        >
          <svg
            width="400"
            height="400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="0.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="text-white"
          >
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
        </div>

        <div
          class="hero-content relative z-10 max-w-4xl mx-auto flex flex-col items-center"
        >
          <h1 class="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            <span class="text-white">Do SQL ao</span> <br />
            <span
              class="text-primary inline-block transform origin-bottom"
              id="hero-title-keyword"
              >Diagrama.</span
            >
          </h1>

          <p
            class="text-lg md:text-2xl text-gray-400 mb-10 h-16 code-font"
            aria-live="polite"
          >
            {{ typeWriterText }}<span class="cursor-blink" aria-hidden="true">|</span>
          </p>

          <!-- Botão CTA (ID Importante para o GSAP) -->
          <a
            href="/editor.html"
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
              <div class="code-window shadow-2xl flex flex-col">
                <div class="window-header">
                  <div class="dot red"></div>
                  <div class="dot yellow"></div>
                  <div class="dot green"></div>
                  <span class="text-xs text-gray-500 ml-2 font-mono"
                    >demo_{{ activeTab }}.sql</span
                  >
                </div>
                <div
                  class="flex-1 bg-[#0d1117] p-6 font-mono text-sm md:text-base relative overflow-hidden"
                >
                  <transition name="fade" mode="out-in">
                    <div
                      :key="activeTab"
                      class="absolute inset-0 p-6 flex flex-col items-center justify-center text-center"
                    >
                      <div class="mb-4 text-[var(--clr-primary)] animate-bounce">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                      <h3 class="text-xl text-white font-bold mb-2">
                        {{ currentTabContent.title }}
                      </h3>
                      <p class="text-gray-400 max-w-md">
                        {{ currentTabContent.description }}
                      </p>
                    </div>
                  </transition>
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
  /* Sombra apontando apenas para cima para não vazar embaixo */
  box-shadow: 0 -15px 40px -10px rgba(0, 0, 0, 0.5);
  /* CRUCIAL: Remove borda e arredondamento de baixo */
  border-bottom: none;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
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

  /* PEEK EFFECT: Começa escondido (40% visível) */
  transform: translateY(70%);

  display: flex;
  justify-content: center;
  align-items: flex-end;
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
  /* Garante que o botão ocupe espaço mesmo antes da animação */
  opacity: 1;
  display: visible;
}
.cta-button:hover {
  box-shadow: 0 0 20px rgba(26, 188, 156, 0.4);
  transform: translateY(-2px);
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

/* Mobile Adjustments */
@media (max-width: 768px) {
  .showcase-layer {
    transform: translateY(65%);
    height: 70vh;
    width: 100%;
  }
  .glass-card {
    border-radius: 0; /* Quadrado no mobile */
  }
}

@media (max-width: 768px) {
  .dock-strip nav {
    padding-top: 1rem;
    padding-bottom: 1.5rem;
  }
}
</style>
