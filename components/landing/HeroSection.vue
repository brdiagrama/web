<script setup lang="ts">
defineProps<{
  typeWriterText: string;
}>();

const goToGerador = (e: Event) => {
  e.preventDefault();
  window.location.href = "/gerador";
};
</script>

<template>
  <section class="hero-layer text-center px-4" role="main" aria-labelledby="hero-title">
    <!-- BACKGROUND DECORATIVO (Diagrama Sutil) -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden hidden lg:block" aria-hidden="true">
      <svg class="connection-svg w-full h-full" viewBox="0 0 1153 233" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg" role="presentation">
        <!-- Database Icon (Esquerda) -->
        <g class="static-element" id="left-database" opacity="0">
          <path d="M92 77C138.944 77 177 61.33 177 42C177 22.67 138.944 7 92 7C45.0558 7 7 22.67 7 42C7 61.33 45.0558 77 92 77Z" stroke="#334155" stroke-width="4" />
          <path d="M7 42V192C7.39283 196.603 9.98041 201.161 14.615 205.414C19.2496 209.667 25.8404 213.531 34.0112 216.786C42.1819 220.041 51.7726 222.622 62.2356 224.384C72.6986 226.146 83.829 227.052 94.9914 227.052C106.154 227.052 117.129 226.146 127.292 224.384C137.454 222.622 146.604 220.041 154.219 216.786C161.835 213.531 167.766 209.667 171.675 205.414C175.583 201.161 177.393 196.603 177 192V42M7 92C7.39283 96.6031 9.98041 101.161 14.615 105.414C19.2496 109.667 25.8404 113.531 34.0112 116.786C42.1819 120.041 51.7726 122.622 62.2356 124.384C72.6986 126.146 83.829 127.052 94.9914 127.052C106.154 127.052 117.129 126.146 127.292 124.384C137.454 122.622 146.604 120.041 154.219 116.786C161.835 113.531 167.766 109.667 171.675 105.414C175.583 101.161 177.393 96.6031 177 92M7 142C7.39283 146.603 9.98041 151.161 14.615 155.414C19.2496 159.667 25.8404 163.531 34.0112 166.786C42.1819 170.041 51.7726 172.622 62.2356 174.384C72.6986 176.146 83.829 177.052 94.9914 177.052C106.154 177.052 117.129 176.146 127.292 174.384C137.454 172.622 146.604 170.041 154.219 166.786C161.835 163.531 167.766 159.667 171.675 155.414C175.583 151.161 177.393 146.603 177 142" stroke="#334155" stroke-width="4" />
        </g>
        <!-- Linha de Conexão Curva -->
        <path class="connection-line" opacity="0" d="M178 99.6105C757.573 405.738 375.005 -121.72 970 109.598" stroke="#334155" stroke-width="3" stroke-linecap="round" fill="none" />
        <!-- Diagram Icon -->
        <g class="static-element" id="right-icon-diagram" opacity="0">
          <rect x="969" y="20" width="181" height="207" stroke="#334155" stroke-width="4" />
          <rect x="969" y="20" width="181" height="41" stroke="#334155" stroke-width="4" />
        </g>
        <circle r="5" fill="#334155" class="travel-dot" opacity="0">
          <animateMotion dur="2.5s" begin="indefinite" fill="freeze" path="M178 99.6105C757.573 405.738 375.005 -121.72 970 109.598" />
        </circle>
      </svg>
    </div>

    <div class="hero-content relative z-10 max-w-4xl mx-auto flex flex-col items-center">
      <h1 class="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
        <span class="text-white inline-block" id="hero-title-top">Do SQL ao</span><br />
        <span class="text-gradient inline-block transform origin-bottom text-6xl md:text-8xl mt-2" id="hero-title-keyword">
          Diagrama.
        </span>
      </h1>
      <p class="text-lg md:text-2xl text-gray-400 mb-10 h-16 code-font" aria-live="polite">
        {{ typeWriterText }}<span class="cursor-blink" aria-hidden="true">|</span>
      </p>
      <a href="/gerador" @click="goToGerador" class="cta-button text-lg inline-flex items-center justify-center relative z-20" id="hero-cta">
        Começar a modelar
      </a>
    </div>
  </section>
</template>

<style scoped>
.hero-layer {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1;
  padding-top: 3.5rem;
  padding-bottom: 1.5rem;
}

.hero-content {
  margin-top: 1.25rem;
  margin-bottom: 1.25rem;
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

.code-font {
  font-family: "JetBrains Mono", monospace;
}

.cursor-blink {
  display: inline-block;
  width: 10px;
  background-color: var(--clr-primary);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
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
}

.cta-button:hover::after {
  left: 200%;
  transition: left 0.6s ease-in-out;
}

.connection-svg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 95%;
  height: auto;
}

.connection-line {
  fill: none;
  stroke-linecap: round;
  filter: drop-shadow(0 0 10px rgba(26, 188, 156, 0.4));
}

.travel-dot { filter: drop-shadow(0 0 8px rgba(26, 188, 156, 0.8)); }
.static-element { fill: none; transition: opacity 0.8s ease; }

@media (max-width: 768px) {
  .hero-layer {
    position: relative !important;
    height: auto !important;
    padding-top: calc(3.5rem + 1rem);
    padding-bottom: 1rem;
    z-index: 5;
  }
  .connection-svg {
    width: 250%;
    max-width: none;
  }
  .static-element, .travel-dot { display: none !important; }
  .connection-line { opacity: 0.25 !important; stroke-width: 2 !important; }
  .absolute.inset-0.pointer-events-none.overflow-hidden { display: block !important; }
}
</style>
