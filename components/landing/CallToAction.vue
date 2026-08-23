<script setup lang="ts">
// CallToAction Component
</script>

<template>
  <section class="h-[50vh] bg-slate-900 flex items-center justify-center relative z-20 border-t border-slate-800" aria-labelledby="cta-title">
    <div class="text-center">
      <h2 id="cta-title" class="text-4xl font-bold text-white mb-4">
        Pronto para começar?
      </h2>
      <p class="text-gray-400 mb-6">
        O seu banco de dados nunca foi tão visual.
      </p>
      <a
        href="/gerador"
        class="cta-button text-lg"
        role="button"
        aria-label="Acessar gerador de diagramas agora"
      >
        Acessar Gerador
      </a>
    </div>
  </section>
</template>

<style scoped>
.cta-button {
  background-color: var(--clr-primary, #1abc9c);
  color: #0f172a;
  font-weight: 700;
  padding: 12px 32px;
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
}

.cta-button:hover::after {
  left: 200%;
  transition: left 0.6s ease-in-out;
}
</style>
