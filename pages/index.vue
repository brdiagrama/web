<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowLeft } from "lucide-vue-next";
import CallToAction from "~/components/landing/CallToAction.vue";
import FeaturesShowcase from "~/components/landing/FeaturesShowcase.vue";
import Header from "~/components/layout/Header.vue";
import HeroSection from "~/components/landing/HeroSection.vue";
import Footer from "~/components/layout/Footer.vue";

useHead({
  title: 'BrDiagrama - Modelagem de Banco de Dados e Diagramas ER Online',
  meta: [
    { name: 'description', content: 'A ferramenta gratuita e 100% brasileira para você transformar scripts SQL (DDL) em diagramas ER de forma automática e offline.' }
  ]
})

gsap.registerPlugin(ScrollTrigger);

const hasScrolled = ref(false);

const typeWriterText = ref("");
const phrases = ["BrDiagrama é a solução para transformar SQL em visual."];
const _typewriterTimeouts = [];

const startTypewriter = () => {
  let delay = 0;
  const phrase = phrases[0];

  const scheduleTyping = (text, currentDelay) => {
    const id = setTimeout(() => {
      typeWriterText.value += text;
    }, currentDelay);
    _typewriterTimeouts.push(id);
  };

  for (let i = 0; i < phrase.length; i++) {
    scheduleTyping(phrase[i], delay);
    delay += 40; // velocidade de digitação
  }
};
onBeforeUnmount(() => {
  // Limpa timeouts do typewriter
  _typewriterTimeouts.forEach((id) => clearTimeout(id));
  _typewriterTimeouts.length = 0;
});

onMounted(() => {


  // Ativa animações completas só em telas maiores; no mobile tem que usar uma versão mais leve
  ScrollTrigger.matchMedia({
    // Desktop / tablet grandes: animações completas
    "(min-width: 769px)": function () {
      const heroTl = gsap.timeline({ delay: 0.1 });

      // Esconde a bolinha antes de começar
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
          strokeDashoffset: length - 0.4, // bagulho foi maluco pra conseguir um efeito suave
        });

        heroTl.to(connectionLine, { opacity: 0.15, duration: 0.01 }, "<");

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

        heroTl.to(".travel-dot", { autoAlpha: 1, duration: 0.3 }, "<");

        heroTl.to(
          "#right-icon-diagram",
          { opacity: 0.3, duration: 0.8, ease: "power2.out" },
          "-=0.8"
        );
      }

      heroTl.call(
        startTypewriter,
        [],
        "-=2.8"
      );

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

      scrollTl.to(".showcase-layer", { y: "0%", ease: "none", duration: 3 }, 0);

      scrollTl.to(".hero-layer", { scale: 0.95, opacity: 0, y: -100, duration: 3 }, 0);

      scrollTl.to(".bg-overlay", { opacity: 0.8, duration: 2.5, ease: "none" }, 0.5);

      // Atualiza hasScrolled (funciona em desktop também)
      const _onScroll = () => {
        hasScrolled.value = window.scrollY > 50;
      };
      window.addEventListener("scroll", _onScroll);

      // cleanup — quando o media query deixar de combinar, mata timelines e listeners
      return () => {
        try {
          heroTl && heroTl.kill();
        } catch (e) { }
        try {
          if (scrollTl && scrollTl.scrollTrigger) scrollTl.scrollTrigger.kill();
        } catch (e) { }
        try {
          scrollTl && scrollTl.kill();
        } catch (e) { }
        window.removeEventListener("scroll", _onScroll);
      };
    },

    // Mobile: versão mais leve, sem pin
    "(max-width: 768px)": function () {
      // Fade-in simples dos títulos e inicia o typewriter
      gsap.set(".travel-dot", { autoAlpha: 0 });

      const heroTl = gsap.timeline();
      heroTl.to("#left-database", { opacity: 0.25, duration: 0.3, ease: "power1.out" });
      heroTl.to(
        "#hero-title-top",
        { y: 0, opacity: 1, duration: 0.45, ease: "power1.out" },
        "-=0.1"
      );
      heroTl.to(
        "#hero-title-keyword",
        { y: 0, opacity: 1, duration: 0.45, ease: "power1.out" },
        "-=0.35"
      );

      heroTl.call(
        startTypewriter,
        [],
        "+=0.1"
      );

      const _onScrollMobile = () => {
        hasScrolled.value = window.scrollY > 50;
      };
      window.addEventListener("scroll", _onScrollMobile);

      return () => {
        try {
          heroTl && heroTl.kill();
        } catch (e) { }
        window.removeEventListener("scroll", _onScrollMobile);
      };
    },
  });
});
</script>

<template>
  <div id="landing-app" class="bg-slate-950 min-h-screen">
    <!-- HEADER -->
    <Header />

    <!-- WRAPPER DO SCROLL ANIMADO -->
    <div class="pin-wrapper">
      <div class="bg-overlay absolute inset-0 bg-slate-950 z-[5] opacity-0 pointer-events-none"></div>
      <!-- CAMADA 1: HERO (Fundo) -->
      <HeroSection :typeWriterText="typeWriterText" />

      <FeaturesShowcase />
    </div>

    <!-- Seção de rodapé (CallToAction) -->
    <CallToAction />

    <!-- Rodapé -->
    <Footer animated />
  </div>
</template>

<style>
:root {
  --clr-primary: #1abc9c;
  --clr-bg: #0f172a;
  --clr-text: #e0e0e0;
  --clr-card-bg: rgba(30, 41, 59, 0.7);
}
</style>

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

.code-font {
  font-family: "JetBrains Mono", monospace;
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

  background: linear-gradient(to top,
      rgba(2, 6, 23, 0.95) 0%,
      rgba(2, 6, 23, 0.6) 50%,
      transparent 100%);

  padding: 4rem 2rem 2rem 2rem;
  pointer-events: none;
  z-index: 20;
}

@media (max-width: 768px) {
  .glass-card {
    width: 100%;
    min-width: 0;
    aspect-ratio: 4/3;
  }

  .video-overlay {
    padding: 3rem 1.5rem 1.5rem 1.5rem;
  }

  .video-overlay h3 {
    font-size: 1rem;
    line-height: 1.15;
    margin-bottom: 0.5rem;
  }

  .video-overlay p {
    font-size: 0.5rem;
    max-width: 90%;
    margin: 0;
    line-height: 1.3;
  }

  .dock-strip {
    display: block;
    margin-top: 0.75rem;
    padding: 0 1rem;
  }

  .dock-strip .tab-btn {
    padding: 8px 12px;
    font-size: 13px;
  }

  .showcase-layer {
    transform: translateY(0%) !important;
    height: auto;
    position: relative;
  }

  .pin-wrapper {
    height: auto;
    display: block;
    overflow: visible;
  }
}

.hero-layer {
  padding-top: 3.5rem;
  padding-bottom: 1.5rem;
}

.hero-content {
  margin-top: 1.25rem;
  margin-bottom: 1.25rem;
}

.glass-card {
  margin-left: auto;
  margin-right: auto;
}

.code-window {
  margin-left: auto;
  margin-right: auto;
  max-width: 100%;
}

@media (max-width: 768px) {
  .hero-layer {
    margin-top: calc(3.5rem + 1rem);
  }

  .glass-card {
    width: calc(100% - 2rem);
    max-width: 720px;
  }
}

@media (min-width: 769px) and (max-height: 800px) {
  .pin-wrapper .showcase-layer {
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

.dot1 {
  background: #0d9488;
  box-shadow: 0 0 8px rgba(13, 148, 136, 0.4);
}

.dot2 {
  background: #1abc9c;
  box-shadow: 0 0 8px rgba(26, 188, 156, 0.4);
}

.dot3 {
  background: #5eead4;
  box-shadow: 0 0 8px rgba(94, 234, 212, 0.4);
}

.cta-button {
  background-color: var(--clr-primary);
  color: #0f172a;
  font-weight: 700;
  padding: 12px 32px;
  border-radius: 9999px;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  box-shadow: 0 0 20px rgba(26, 188, 156, 0.4);
  position: relative;
  overflow: hidden;
}

.cta-button:hover {
  background-color: #31e0bd;
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(26, 188, 156, 0.6);
}

.cta-button::after {
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

.cta-button:hover::after {
  left: 200%;
  transition: left 0.6s ease-in-out;
}

.cta-button-small {
  background-color: #1abc9c;
  color: #0f172a;
  font-weight: 700;
  padding: 8px 20px;
  font-size: 0.875rem;
  border-radius: 9999px;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(26, 188, 156, 0.4);
  position: relative;
  overflow: hidden;
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
  /* borda ciano suave */
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.video-restart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(16, 185, 129, 0.14);
}

.video-restart-btn svg {
  color: var(--clr-primary) !important;
  stroke: currentColor !important;
  fill: none !important;
}

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
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  padding-bottom: 0.2em;
  display: inline-block;
  font-weight: 800;

  filter: drop-shadow(0 0 20px rgba(26, 188, 156, 0.3));
}

.connection-svg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 95%;
  height: auto;
}

@media (max-width: 768px) {
  .connection-svg {
    width: 250%;
    max-width: none;
  }

  .static-element,
  .travel-dot {
    display: none !important;
  }

  .connection-line {
    opacity: 0.25 !important;
    stroke-width: 2 !important;
  }
}

@media (max-width: 768px) {
  .code-window video {
    object-fit: contain !important;
    background: #000;
  }

  .video-placeholder h4 {
    color: #e6f7f4;
  }
}

@media (max-width: 768px) {
  .absolute.inset-0.pointer-events-none.overflow-hidden {
    display: block !important;
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

@media (max-width: 768px) {
  header nav {
    gap: 0.5rem;
  }

  .nav-link {
    font-size: 0.75rem;
  }

  .cta-button-small {
    padding: 5px 10px;
    font-size: 0.6875rem;
  }

  .glass-card {
    aspect-ratio: auto;
    height: 55vh;
    max-height: 70vh;
    min-height: 300px;
    width: 100%;
    min-width: 0;
  }

  .code-window video {
    object-fit: cover !important;
    width: 100%;
    height: 100%;
    background: hsl(0, 0%, 0%);
  }

  .video-placeholder {
    padding: 1.25rem;
  }

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

/* Spinner de Carregamento */
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
  to {
    transform: rotate(360deg);
  }
}

.spinner-fade-enter-active {
  transition: opacity 0.3s ease-out;
}

.spinner-fade-leave-active {
  transition: opacity 0.25s ease-in;
}

.spinner-fade-enter-from {
  opacity: 0;
}

.spinner-fade-leave-to {
  opacity: 0;
}
</style>
