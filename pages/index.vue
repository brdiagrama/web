<script setup lang="ts">
import { onMounted } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-vue-next";
import FeaturesShowcase from "~/components/landing/FeaturesShowcase.vue";
import Header from "~/components/layout/Header.vue";
import HeroSection from "~/components/landing/HeroSection.vue";
import Footer from "~/components/layout/Footer.vue";

useHead({
  title: "BrDiagrama - Modelagem de Banco de Dados e Diagramas ER Online",
  meta: [
    {
      name: "description",
      content:
        "A ferramenta gratuita e 100% brasileira para você transformar scripts SQL (DDL) em diagramas ER de forma automática e offline.",
    },
  ],
});

gsap.registerPlugin(ScrollTrigger);

function createHeroIntro(suffix = "", duration = 2.5) {
  const heroTl = gsap.timeline({ delay: 0.05 });
  const dotSel = `.travel-dot${suffix}`;
  const dbSel = `#left-database${suffix}`;
  const lineSel = `.connection-line${suffix}`;
  const diagramSel = `#right-icon-diagram${suffix}`;

  gsap.set(dotSel, { autoAlpha: 0 });
  heroTl.to(dbSel, { opacity: 0.3, y: 0, duration: 0.4, ease: "power2.out" });

  const line = document.querySelector<SVGPathElement>(lineSel);
  if (line) {
    const length = line.getTotalLength();
    gsap.set(line, { strokeDasharray: length, strokeDashoffset: length });
    heroTl.to(line, { opacity: 0.2, duration: 0.01 }, "-=0.2");
    heroTl.to(line, { strokeDashoffset: 0, autoAlpha: 0.35, duration, ease: "power2.inOut" }, "<");
    heroTl.call(
      () => {
        const motion = document.querySelector<SVGAnimationElement>(`${dotSel} animateMotion`);
        if (motion) motion.beginElement();
      },
      [],
      "<"
    );
    heroTl.to(dotSel, { autoAlpha: 1, duration: 0.2 }, "<");
    heroTl.to(diagramSel, { opacity: 0.3, duration: 0.5, ease: "power2.out" }, "-=0.6");
  }

  return heroTl;
}

onMounted(() => {
  ScrollTrigger.matchMedia({
    "(min-width: 769px)": function () {
      const heroTl = createHeroIntro("", 2.5);

      const scrollTl = gsap.timeline({
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
      scrollTl.to(".bg-overlay", { opacity: 0.85, duration: 2.5, ease: "none" }, 0.5);

      return () => {
        heroTl.kill();
        if (scrollTl.scrollTrigger) scrollTl.scrollTrigger.kill();
        scrollTl.kill();
      };
    },

    "(max-width: 768px)": function () {
      const heroTl = createHeroIntro("-mobile", 2.0);
      return () => {
        heroTl.kill();
      };
    },
  });
});
</script>

<template>
  <div id="landing-app" class="bg-[var(--clr-bg)] min-h-screen text-[var(--clr-text)]">
    <Header />

    <div class="pin-wrapper">
      <div class="bg-overlay absolute inset-0 bg-[var(--clr-depth-overlay)] z-[5] opacity-0 pointer-events-none"></div>
      <HeroSection />
      <FeaturesShowcase />
    </div>

    <section
      class="h-[50vh] bg-[var(--clr-bg-surface)] flex items-center justify-center relative z-20 border-t border-[var(--clr-border)]"
      aria-labelledby="cta-title"
    >
      <div class="text-center px-4">
        <h2 id="cta-title" class="text-4xl font-bold tracking-[-0.025em] text-[var(--clr-text)] mb-4">
          Pronto para começar?
        </h2>
        <p class="text-[var(--clr-text-muted)] mb-6">
          O seu banco de dados nunca foi tão visual.
        </p>
        <v-btn
          to="/gerador"
          color="primary"
          size="x-large"
          rounded="pill"
          elevation="0"
          class="rounded-full cta-button-final font-bold font-weight-bold text-none px-8 text-lg"
          aria-label="Acessar gerador de diagramas agora"
        >
          <span>Acessar Gerador</span>
          <template #append>
            <ArrowRight :size="20" class="ml-1" />
          </template>
        </v-btn>
      </div>
    </section>

    <Footer animated />
  </div>
</template>

<style scoped>
.cta-button-final,
.cta-button-final :deep(.v-btn__content),
.cta-button-final span {
  font-weight: 700 !important;
  border-radius: 9999px !important;
  box-shadow: none !important;
}

.pin-wrapper {
  height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--clr-hero-stage);
}

@media (max-width: 768px) {
  .pin-wrapper {
    height: auto !important;
    display: block !important;
    overflow: visible !important;
  }
}
</style>
