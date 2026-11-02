<script setup lang="ts">
</script>

<template>
  <section class="hero-layer text-center px-4" role="main" aria-labelledby="hero-title">
    <div class="hidden md:block absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <svg
        class="connection-svg w-full h-full"
        viewBox="0 0 1153 233"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        <g class="static-element" id="left-database" opacity="0">
          <path
            d="M92 77C138.944 77 177 61.33 177 42C177 22.67 138.944 7 92 7C45.0558 7 7 22.67 7 42C7 61.33 45.0558 77 92 77Z"
            stroke="rgba(140, 140, 140, 0.45)"
            stroke-width="4"
          />
          <path
            d="M7 42V192C7.39283 196.603 9.98041 201.161 14.615 205.414C19.2496 209.667 25.8404 213.531 34.0112 216.786C42.1819 220.041 51.7726 222.622 62.2356 224.384C72.6986 226.146 83.829 227.052 94.9914 227.052C106.154 227.052 117.129 226.146 127.292 224.384C137.454 222.622 146.604 220.041 154.219 216.786C161.835 213.531 167.766 209.667 171.675 205.414C175.583 201.161 177.393 196.603 177 192V42M7 92C7.39283 96.6031 9.98041 101.161 14.615 105.414C19.2496 109.667 25.8404 113.531 34.0112 116.786C42.1819 120.041 51.7726 122.622 62.2356 124.384C72.6986 126.146 83.829 127.052 94.9914 127.052C106.154 127.052 117.129 126.146 127.292 124.384C137.454 122.622 146.604 120.041 154.219 116.786C161.835 113.531 167.766 109.667 171.675 105.414C175.583 101.161 177.393 96.6031 177 92M7 142C7.39283 146.603 9.98041 151.161 14.615 155.414C19.2496 159.667 25.8404 163.531 34.0112 166.786C42.1819 170.041 51.7726 172.622 62.2356 174.384C72.6986 176.146 83.829 177.052 94.9914 177.052C106.154 177.052 117.129 176.146 127.292 174.384C137.454 172.622 146.604 170.041 154.219 166.786C161.835 163.531 167.766 159.667 171.675 155.414C175.583 151.161 177.393 146.603 177 142"
            stroke="rgba(140, 140, 140, 0.45)"
            stroke-width="4"
          />
        </g>

        <path
          class="connection-line"
          opacity="0"
          d="M178 99.6105C757.573 405.738 375.005 -121.72 970 109.598"
          stroke="rgba(140, 140, 140, 0.45)"
          stroke-width="3"
          stroke-linecap="round"
          fill="none"
        />

        <g class="static-element" id="right-icon-diagram" opacity="0">
          <rect x="969" y="20" width="181" height="207" stroke="rgba(140, 140, 140, 0.45)" stroke-width="4" />
          <rect x="969" y="20" width="181" height="41" stroke="rgba(140, 140, 140, 0.45)" stroke-width="4" />
        </g>

        <circle r="5" fill="#1ABA9C" class="travel-dot" opacity="0">
          <animateMotion
            dur="5s"
            begin="indefinite"
            repeatCount="indefinite"
            calcMode="spline"
            keyPoints="0;1;0"
            keyTimes="0;0.5;1"
            keySplines="0.455 0.03 0.515 0.955; 0.455 0.03 0.515 0.955"
            path="M178 99.6105C757.573 405.738 375.005 -121.72 970 109.598"
          />
        </circle>
      </svg>
    </div>

    <div class="block md:hidden absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <svg
        class="connection-svg-mobile"
        viewBox="0 0 520 233"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        <g class="static-element" id="left-database-mobile" opacity="0">
          <path
            d="M92 77C138.944 77 177 61.33 177 42C177 22.67 138.944 7 92 7C45.0558 7 7 22.67 7 42C7 61.33 45.0558 77 92 77Z"
            stroke="rgba(140, 140, 140, 0.45)"
            stroke-width="4"
          />
          <path
            d="M7 42V192C7.39283 196.603 9.98041 201.161 14.615 205.414C19.2496 209.667 25.8404 213.531 34.0112 216.786C42.1819 220.041 51.7726 222.622 62.2356 224.384C72.6986 226.146 83.829 227.052 94.9914 227.052C106.154 227.052 117.129 226.146 127.292 224.384C137.454 222.622 146.604 220.041 154.219 216.786C161.835 213.531 167.766 209.667 171.675 205.414C175.583 201.161 177.393 196.603 177 192V42M7 92C7.39283 96.6031 9.98041 101.161 14.615 105.414C19.2496 109.667 25.8404 113.531 34.0112 116.786C42.1819 120.041 51.7726 122.622 62.2356 124.384C72.6986 126.146 83.829 127.052 94.9914 127.052C106.154 127.052 117.129 126.146 127.292 124.384C137.454 122.622 146.604 120.041 154.219 116.786C161.835 113.531 167.766 109.667 171.675 105.414C175.583 101.161 177.393 96.6031 177 92M7 142C7.39283 146.603 9.98041 151.161 14.615 155.414C19.2496 159.667 25.8404 163.531 34.0112 166.786C42.1819 170.041 51.7726 172.622 62.2356 174.384C72.6986 176.146 83.829 177.052 94.9914 177.052C106.154 177.052 117.129 176.146 127.292 174.384C137.454 172.622 146.604 170.041 154.219 166.786C161.835 163.531 167.766 159.667 171.675 155.414C175.583 151.161 177.393 146.603 177 142"
            stroke="rgba(140, 140, 140, 0.45)"
            stroke-width="4"
          />
        </g>

        <path
          class="connection-line-mobile"
          opacity="0"
          d="M178 99.6105C230 210 290 20 340 109.598"
          stroke="rgba(140, 140, 140, 0.45)"
          stroke-width="3"
          stroke-linecap="round"
          fill="none"
        />

        <g class="static-element" id="right-icon-diagram-mobile" opacity="0">
          <rect x="340" y="20" width="170" height="207" stroke="rgba(140, 140, 140, 0.45)" stroke-width="4" />
          <rect x="340" y="20" width="170" height="41" stroke="rgba(140, 140, 140, 0.45)" stroke-width="4" />
        </g>

        <circle r="5" fill="#1ABA9C" class="travel-dot-mobile" opacity="0">
          <animateMotion
            dur="4s"
            begin="indefinite"
            repeatCount="indefinite"
            calcMode="spline"
            keyPoints="0;1;0"
            keyTimes="0;0.5;1"
            keySplines="0.455 0.03 0.515 0.955; 0.455 0.03 0.515 0.955"
            path="M178 99.6105C230 210 290 20 340 109.598"
          />
        </circle>
      </svg>
    </div>

    <div class="hero-content relative z-10 max-w-4xl mx-auto flex flex-col items-center">
      <h1
        id="hero-title"
        class="text-5xl md:text-7xl font-bold tracking-[-0.03em] text-[var(--clr-text)] mb-6 leading-tight"
      >
        <span class="text-[var(--clr-text)] inline-block" id="hero-title-top">Do SQL ao</span><br />
        <span
          class="text-[var(--clr-primary)] inline-block transform origin-bottom text-6xl md:text-8xl mt-2"
          id="hero-title-keyword"
        >
          Diagrama.
        </span>
      </h1>

      <p id="hero-subtitle" class="text-lg md:text-2xl text-[var(--clr-text-muted)] mb-10 max-w-2xl leading-relaxed">
        BrDiagrama é a solução para transformar SQL em visual.
      </p>

      <v-btn
        to="/gerador"
        color="primary"
        size="x-large"
        rounded="pill"
        elevation="0"
        class="rounded-full font-bold font-weight-bold text-none px-8 text-lg relative z-20"
        id="hero-cta"
        aria-label="Começar a modelar diagramas"
      >
        <span>Começar a modelar</span>
      </v-btn>
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

#hero-cta,
#hero-cta :deep(.v-btn__content),
#hero-cta span {
  font-weight: 700 !important;
  border-radius: 9999px !important;
  box-shadow: none !important;
  opacity: 1 !important;
  visibility: visible !important;
  display: inline-flex !important;
}

.connection-svg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 95%;
  height: auto;
}

.connection-svg-mobile {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 95%;
  max-width: 460px;
  height: auto;
}

.connection-line,
.connection-line-mobile {
  fill: none;
  stroke-linecap: round;
  filter: drop-shadow(0 0 10px rgba(26, 186, 156, 0.4));
}

.static-element {
  fill: none;
}

@media (max-width: 768px) {
  .hero-layer {
    position: relative !important;
    height: auto !important;
    padding-top: calc(4rem + 1rem);
    padding-bottom: 2rem;
    z-index: 5;
  }
}
</style>
