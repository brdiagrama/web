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
  setTimeout(type, 700);
};

onMounted(() => {
  // 1. ANIMAÇÃO DE ENTRADA (HERO)
  const heroTl = gsap.timeline({ delay: 0.1 });

  // NOVO: Esconde a bolinha ANTES de tudo (resolve o pontinho)
  gsap.set(".travel-dot", { autoAlpha: 0 });



  // Anima os títulos (continua normal)
  heroTl.to("#left-database", {
    opacity: 0.3, // Ou 1 se você quiser ele sólido também!
    y: 0,         // Se quiser um efeitinho de subida, use um .from com y:20 antes
    duration: 1,
    ease: "power2.out"
  });

  heroTl
    .from("#hero-title-top", {
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
    }, "-=0.5") // Pequeno delay para o database aparecer primeiro
    .from("#hero-title-keyword", {
      y: 40,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out",
    }, "-=0.6");


  // Agora anima a linha de conexão
  const connectionLine = document.querySelector(".connection-line");
  if (connectionLine) {
    const length = connectionLine.getTotalLength();
    
    gsap.set(connectionLine, {
      strokeDasharray: length,
      strokeDashoffset: length,
      autoAlpha: 0.3
    });
    
    // Desenha a linha
    heroTl.to(connectionLine, {
      strokeDashoffset: 0,
      autoAlpha: 0.3,
      duration: 2.5,
      ease: "power2.inOut"
    }, "-=0.4"); // Começa um pouco antes do título terminar
    
    // A bolinha viaja
    heroTl.call(() => {
      const motion = document.querySelector(".travel-dot animateMotion");
      if (motion) motion.beginElement();
    }, null, "<"); // "<" significa "no mesmo tempo que a animação anterior"
    
    heroTl.to(".travel-dot", {
      autoAlpha: 1,
      duration: 0.3
    }, "<");
    
    // Revela o diagrama da direita
    heroTl.to("#right-icon-diagram", {
      opacity: 0.3,
      duration: 0.8,
      ease: "power2.out"
    }, "-=0.8");
  }

  startTypewriter();

  // 2. SCROLLTRIGGER (resto do código igual)
  let scrollTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".pin-wrapper",
      start: "top top",
      end: "+=80%",
      scrub: true,
      pin: true,
    },
  });

  scrollTl.to(".showcase-layer", {
    y: "0%",
    ease: "none",
    duration: 3,
  }, 0);

  scrollTl.to(".hero-layer", {
    scale: 0.95,
    opacity: 0,
    y: -100,
    duration: 3,
  }, 0);

  scrollTl.to(".bg-overlay", {
    opacity: 0.8,
    duration: 2.5,
    ease: "none",
  }, 0.5);

  window.addEventListener("scroll", () => {
    hasScrolled.value = window.scrollY > 50;
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
</style>
