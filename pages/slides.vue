<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import gsap from 'gsap';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  FileText,
  Maximize2,
  Minimize2,
  X,
  GitCompareArrows,
  Briefcase,
  GraduationCap,
  Check,
  ArrowUpRight,
  Key,
  Printer,
  User,
  ArrowRight,
  Download,
  Loader2,
} from 'lucide-vue-next';
import SlideDiagramCard from '@/components/slides/SlideDiagramCard.vue';
import {
  SLIDES_METADATA,
  ARTICLE_COVER_INFO,
  COVER_TABLES,
  PROBLEM_BREAKDOWN,
  METHOD_PIPELINE,
  FUNDAMENTACAO_CONCEPTS,
  BETA_METRICS,
  BETA_IMPROVEMENTS,
  CONCLUSION_FUTURE,
} from '@/data/slidesPresentationData';
import mysqlIcon from '@/assets/images/sgbd/mysql.svg';
import postgresqlIcon from '@/assets/images/sgbd/postgresql.svg';
import sqliteIcon from '@/assets/images/sgbd/sqlite.svg';
import mariadbDarkIcon from '@/assets/images/sgbd/mariadb.svg';
import sqlserverIcon from '@/assets/images/sgbd/sqlserver.svg';

useHead({
  title: 'Apresentação — BrDiagrama | Defesa Acadêmica FMP',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    {
      name: 'description',
      content: 'Apresentação acadêmica da ferramenta BrDiagrama (FMP).',
    },
  ],
});

const slidesShellRef = ref<HTMLElement | null>(null);
const slideBodyRef = ref<HTMLElement | null>(null);
const currentSlideIndex = ref(0);
const isOverviewOpen = ref(false);
const isNotesOpen = ref(false);
const isFullscreen = ref(false);
const isExportingPptx = ref(false);
const isPrintAllMode = ref(false);

const totalSlides = SLIDES_METADATA.length;

const currentSlide = computed(() => {
  return SLIDES_METADATA[currentSlideIndex.value];
});

const progressPercent = computed(() => {
  return Math.round(((currentSlideIndex.value + 1) / totalSlides) * 100);
});

const dialectBadges = [
  { name: 'PostgreSQL', icon: postgresqlIcon },
  { name: 'MySQL', icon: mysqlIcon },
  { name: 'MariaDB', icon: mariadbDarkIcon },
  { name: 'SQLite', icon: sqliteIcon },
  { name: 'SQL Server', icon: sqlserverIcon },
];

const animateCurrentSlide = () => {
  if (import.meta.client && slideBodyRef.value) {
    const items = slideBodyRef.value.querySelectorAll('.slide-stagger');
    if (items.length > 0) {
      gsap.fromTo(
        items,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.05,
          ease: 'power2.out',
          clearProps: 'opacity,y,transform',
        }
      );
    }
  }
};

const goToSlide = (targetIndex: number) => {
  if (targetIndex >= 0 && targetIndex < totalSlides) {
    currentSlideIndex.value = targetIndex;
    isOverviewOpen.value = false;
  }
};

const goToNextSlide = () => {
  if (currentSlideIndex.value < totalSlides - 1) {
    currentSlideIndex.value += 1;
  }
};

const goToPrevSlide = () => {
  if (currentSlideIndex.value > 0) {
    currentSlideIndex.value -= 1;
  }
};

const toggleOverview = () => {
  isOverviewOpen.value = !isOverviewOpen.value;
};

const toggleNotes = () => {
  isNotesOpen.value = !isNotesOpen.value;
};

const printSlides = () => {
  if (!import.meta.client) return;
  window.print();
};

const exportPptx = async () => {
  if (!import.meta.client || isExportingPptx.value) return;
  isExportingPptx.value = true;

  try {
    const pptxgen = (await import('pptxgenjs')).default;
    const html2canvas = (await import('html2canvas')).default;

    const pres = new pptxgen();
    pres.layout = 'LAYOUT_16x9';

    const origIndex = currentSlideIndex.value;
    const wasOverviewOpen = isOverviewOpen.value;
    const wasNotesOpen = isNotesOpen.value;

    isOverviewOpen.value = false;
    isNotesOpen.value = false;

    for (let i = 0; i < totalSlides; i++) {
      currentSlideIndex.value = i;
      await nextTick();
      await new Promise((r) => setTimeout(r, 450));

      const stageEl = document.querySelector('.slides-stage') as HTMLElement | null;
      if (stageEl) {
        const canvas = await html2canvas(stageEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFFFF',
        });
        const imgData = canvas.toDataURL('image/png');
        const slide = pres.addSlide();
        slide.addImage({ data: imgData, x: 0, y: 0, w: '100%', h: '100%' });
      }
    }

    currentSlideIndex.value = origIndex;
    isOverviewOpen.value = wasOverviewOpen;
    isNotesOpen.value = wasNotesOpen;

    await pres.writeFile({ fileName: 'brdiagrama-apresentacao.pptx' });
  } catch (err) {
    console.error('Erro ao exportar PPTX:', err);
  } finally {
    isExportingPptx.value = false;
  }
};

const toggleFullscreen = async () => {
  if (import.meta.client) {
    if (!document.fullscreenElement && slidesShellRef.value) {
      try {
        await slidesShellRef.value.requestFullscreen();
      } catch {
        isFullscreen.value = false;
      }
    } else if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        isFullscreen.value = false;
      }
    }
  }
};

const handleFullscreenChange = () => {
  if (import.meta.client) {
    isFullscreen.value = Boolean(document.fullscreenElement);
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null;
  const tagName = target ? target.tagName.toUpperCase() : '';
  const isFormElement = tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';

  if (!isFormElement && !event.ctrlKey && !event.metaKey && !event.altKey) {
    if (event.key === 'Escape' && isOverviewOpen.value) {
      isOverviewOpen.value = false;
    } else if (event.key === 'ArrowRight' || event.key === 'PageDown') {
      event.preventDefault();
      goToNextSlide();
    } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
      event.preventDefault();
      goToPrevSlide();
    } else if (event.key === 'g' || event.key === 'G') {
      event.preventDefault();
      toggleOverview();
    } else if (event.key === 'n' || event.key === 'N') {
      event.preventDefault();
      toggleNotes();
    } else if (event.key === 'f' || event.key === 'F') {
      event.preventDefault();
      toggleFullscreen();
    } else if (event.key >= '1' && event.key <= '9') {
      goToSlide(Number(event.key) - 1);
    }
  }
};

watch(currentSlideIndex, () => {
  nextTick(() => {
    animateCurrentSlide();
  });
});

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  nextTick(() => {
    animateCurrentSlide();
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
});
</script>

<template>
  <div ref="slidesShellRef" class="slides-shell canvas-light">
    <header class="slides-toolbar" role="banner">
      <div class="toolbar-left">
        <NuxtLink to="/" class="logo-link" aria-label="Voltar para a página inicial do BrDiagrama">
          <img
            src="~/assets/images/logo/logo-completa.svg"
            alt="BrDiagrama"
            class="toolbar-logo"
            width="118"
            height="28"
          />
        </NuxtLink>
      </div>

      <nav class="toolbar-progress" aria-label="Navegação entre slides">
        <v-tooltip
          v-for="(slide, idx) in SLIDES_METADATA"
          :key="slide.id"
          :text="`${slide.number}. ${slide.shortTitle}`"
          location="bottom"
          theme="light"
        >
          <template #activator="{ props: tooltipProps }">
            <button
              v-bind="tooltipProps"
              type="button"
              class="progress-step"
              :class="{
                'is-active': idx === currentSlideIndex,
                'is-visited': idx < currentSlideIndex,
              }"
              :aria-label="`Ir para slide ${slide.number}: ${slide.shortTitle}`"
              :aria-current="idx === currentSlideIndex ? 'step' : undefined"
              @click="goToSlide(idx)"
            >
              <span v-if="idx === currentSlideIndex" class="progress-step-label">{{ slide.number }}</span>
            </button>
          </template>
        </v-tooltip>
      </nav>

      <div class="toolbar-right">
        <v-tooltip text="Visão geral (G)" location="bottom" theme="light">
          <template #activator="{ props: tooltipProps }">
            <button
              v-bind="tooltipProps"
              type="button"
              class="tool-btn"
              :class="{ 'is-active': isOverviewOpen }"
              aria-label="Alternar grade de slides"
              @click="toggleOverview"
            >
              <LayoutGrid :size="16" />
            </button>
          </template>
        </v-tooltip>

        <v-tooltip text="Notas de apresentação (N)" location="bottom" theme="light">
          <template #activator="{ props: tooltipProps }">
            <button
              v-bind="tooltipProps"
              type="button"
              class="tool-btn"
              :class="{ 'is-active': isNotesOpen }"
              aria-label="Alternar notas de apresentação"
              @click="toggleNotes"
            >
              <FileText :size="16" />
            </button>
          </template>
        </v-tooltip>

        <v-tooltip text="Exportar para PPTX (PowerPoint)" location="bottom" theme="light">
          <template #activator="{ props: tooltipProps }">
            <button
              v-bind="tooltipProps"
              type="button"
              class="tool-btn pptx-btn"
              :class="{ 'is-loading': isExportingPptx }"
              :disabled="isExportingPptx"
              aria-label="Exportar para PPTX"
              @click="exportPptx"
            >
              <Loader2 v-if="isExportingPptx" :size="16" class="spin-icon" />
              <Download v-else :size="16" />
            </button>
          </template>
        </v-tooltip>

        <v-tooltip text="Exportar para PDF / Imprimir (Ctrl+P)" location="bottom" theme="light">
          <template #activator="{ props: tooltipProps }">
            <button
              v-bind="tooltipProps"
              type="button"
              class="tool-btn"
              aria-label="Exportar para PDF ou Imprimir"
              @click="printSlides"
            >
              <Printer :size="16" />
            </button>
          </template>
        </v-tooltip>

        <v-tooltip :text="isFullscreen ? 'Sair da tela cheia (F)' : 'Tela cheia (F)'" location="bottom" theme="light">
          <template #activator="{ props: tooltipProps }">
            <button
              v-bind="tooltipProps"
              type="button"
              class="tool-btn"
              aria-label="Alternar tela cheia"
              @click="toggleFullscreen"
            >
              <Minimize2 v-if="isFullscreen" :size="16" />
              <Maximize2 v-else :size="16" />
            </button>
          </template>
        </v-tooltip>

        <div class="toolbar-divider" aria-hidden="true"></div>

        <div class="nav-controls">
          <button
            type="button"
            class="tool-btn"
            :disabled="currentSlideIndex === 0"
            aria-label="Slide anterior"
            @click="goToPrevSlide"
          >
            <ChevronLeft :size="17" />
          </button>
          <span class="slide-counter">{{ currentSlide.number }} / {{ totalSlides }}</span>
          <button
            type="button"
            class="tool-btn"
            :disabled="currentSlideIndex === totalSlides - 1"
            aria-label="Próximo slide"
            @click="goToNextSlide"
          >
            <ChevronRight :size="17" />
          </button>
        </div>
      </div>
    </header>

    <div class="progress-rail" aria-hidden="true">
      <div class="progress-rail-fill" :style="{ width: `${progressPercent}%` }"></div>
    </div>

    <main class="slides-stage" role="main">
      <div v-for="slide in SLIDES_METADATA" :key="slide.id" class="slide-container" :class="{ 'screen-hidden': slide.id !== currentSlide.id }">
        <!-- SLIDE 01: CAPA (MANTIDO E APROVADO) -->
        <section v-if="slide.id === 'capa'" class="slide-grid slide-cover">
          <div class="cover-editorial">
            <h1 class="cover-title slide-stagger">
              Desenvolvimento de uma Ferramenta para Apoio à Modelagem de Dados com Sincronização Bidirecional entre Scripts SQL e Diagramas de Entidade e Relacionamento: <span class="brand-word">BrDiagrama</span>
            </h1>

            <div class="cover-meta-grid slide-stagger">
              <div class="meta-block">
                <span class="meta-label">Autores</span>
                <div class="meta-people">
                  <span v-for="author in ARTICLE_COVER_INFO.authors" :key="author" class="person-name-item">
                    {{ author }}
                  </span>
                </div>
              </div>

              <div class="meta-block">
                <span class="meta-label">Orientação</span>
                <div class="meta-people">
                  <span v-for="adv in ARTICLE_COVER_INFO.advisors" :key="adv" class="person-name-item">
                    {{ adv }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="cover-visual slide-stagger">
            <div class="cover-canvas-clean">
              <div class="cover-code-surface">
                <pre class="sql-code-pre"><code><span class="sql-kw">CREATE TABLE</span> <span class="sql-ident">clientes</span> <span class="sql-delim">(</span>
  <span class="sql-ident">id</span> <span class="sql-type">INT</span> <span class="sql-kw">PRIMARY KEY</span><span class="sql-delim">,</span>
  <span class="sql-ident">nome</span> <span class="sql-type">VARCHAR</span><span class="sql-delim">(</span><span class="sql-num">100</span><span class="sql-delim">)</span> <span class="sql-kw">NOT NULL</span>
<span class="sql-delim">);</span>

<span class="sql-kw">CREATE TABLE</span> <span class="sql-ident">pedidos</span> <span class="sql-delim">(</span>
  <span class="sql-ident">id</span> <span class="sql-type">INT</span> <span class="sql-kw">PRIMARY KEY</span><span class="sql-delim">,</span>
  <span class="sql-ident">total</span> <span class="sql-type">DECIMAL</span><span class="sql-delim">(</span><span class="sql-num">10</span><span class="sql-delim">,</span><span class="sql-num">2</span><span class="sql-delim">)</span> <span class="sql-kw">NOT NULL</span><span class="sql-delim">,</span>
  <span class="sql-ident">data</span> <span class="sql-type">DATE</span> <span class="sql-kw">NOT NULL</span><span class="sql-delim">,</span>
  <span class="sql-ident">cliente_id</span> <span class="sql-type">INT</span> <span class="sql-kw">NOT NULL</span><span class="sql-delim">,</span>
  <span class="sql-kw">FOREIGN KEY</span> <span class="sql-delim">(</span><span class="sql-ident">cliente_id</span><span class="sql-delim">)</span> <span class="sql-kw">REFERENCES</span> <span class="sql-ident">clientes</span><span class="sql-delim">(</span><span class="sql-ident">id</span><span class="sql-delim">)</span>
<span class="sql-delim">);</span></code></pre>
              </div>

              <div class="cover-sync-fork" aria-hidden="true">
                <svg class="fork-svg" viewBox="0 0 540 84" preserveAspectRatio="none" fill="none">
                  <path
                    d="M 270 0 L 270 36 Q 270 50 254 50 L 130 50 Q 114 50 114 64 L 114 84"
                    stroke="#192747"
                    stroke-width="1.8"
                    stroke-linecap="round"
                  />
                  <path
                    d="M 270 0 L 270 36 Q 270 50 286 50 L 410 50 Q 426 50 426 64 L 426 84"
                    stroke="#192747"
                    stroke-width="1.8"
                    stroke-linecap="round"
                  />

                  <circle cx="270" cy="2" r="3.5" fill="#192747" />
                  <circle cx="114" cy="82" r="3.5" fill="#192747" />
                  <circle cx="426" cy="82" r="3.5" fill="#192747" />

                  <circle r="4.5" fill="#1ABA9C">
                    <animateMotion
                      dur="3s"
                      repeatCount="indefinite"
                      keyPoints="0;1;0"
                      keyTimes="0;0.5;1"
                      calcMode="spline"
                      keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
                      path="M 270 2 L 270 36 Q 270 50 254 50 L 130 50 Q 114 50 114 64 L 114 82"
                    />
                  </circle>

                  <circle r="4.5" fill="#1ABA9C">
                    <animateMotion
                      dur="3s"
                      repeatCount="indefinite"
                      keyPoints="0;1;0"
                      keyTimes="0;0.5;1"
                      calcMode="spline"
                      keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
                      path="M 270 2 L 270 36 Q 270 50 286 50 L 410 50 Q 426 50 426 64 L 426 82"
                    />
                  </circle>
                </svg>
              </div>

              <div class="cover-der-stage">
                <div class="cover-card-slot is-left">
                  <SlideDiagramCard :table="COVER_TABLES[0]" compact />
                </div>

                <div class="cover-der-rel" aria-hidden="true">
                  <svg class="der-rel-svg" viewBox="0 0 84 158" fill="none">
                    <path
                      d="M 0 43 L 34 43 Q 42 43 42 51 L 42 135 Q 42 143 50 143 L 84 143"
                      stroke="#192747"
                      stroke-width="2"
                    />
                    <path
                      class="der-flow-line"
                      d="M 0 43 L 34 43 Q 42 43 42 51 L 42 135 Q 42 143 50 143 L 84 143"
                      stroke="#4facfe"
                      stroke-width="2"
                      stroke-dasharray="3 10"
                    />

                    <line x1="11" y1="36" x2="11" y2="50" stroke="#192747" stroke-width="2" />
                    <line x1="16" y1="36" x2="16" y2="50" stroke="#192747" stroke-width="2" />
                    <text x="10" y="29" class="der-card-text">1</text>

                    <circle cx="67" cy="143" r="4" fill="#ffffff" stroke="#192747" stroke-width="2" />
                    <path d="M 84 136 L 72 143 L 84 150" stroke="#192747" stroke-width="1.8" fill="none" />
                    <text x="63" y="130" class="der-card-text">N</text>
                  </svg>
                </div>

                <div class="cover-card-slot is-right">
                  <SlideDiagramCard :table="COVER_TABLES[1]" compact />
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- SLIDE 02: CONTEXTO E RELEVÂNCIA (ESTATÍSTICA + LEI DE LEHMAN) -->
        <section v-else-if="slide.id === 'contexto'" class="slide-stack">
          <div class="slide-title-group slide-stagger">
            <h2 class="slide-heading">
              Contexto: Evolução Contínua do Software e dos Dados
            </h2>
          </div>

          <div class="context-split-grid slide-stagger">
            <!-- Bloco 1: Big Number 57,3% dos Bancos Relacionais -->
            <div class="surface-card context-stat-hero">
            

              <div class="stat-content-hero">
                <span class="stat-number-hero">57,3%</span>
                <p class="stat-desc-hero">
                  dos bancos em ambientes produtivos corporativos são <strong>Relacionais</strong>.
                </p>
                <span class="stat-source-hero">Mordor Intelligence (2026)</span>
              </div>
            </div>

            <!-- Bloco 2: 1ª Lei de Lehman com Foto e Citação com Destaque Amplo -->
            <div class="surface-card context-lehman-card">
              <blockquote class="lehman-quote-hero">
                &ldquo;Um programa deve mudar continuamente para continuar sendo útil.&rdquo;
              </blockquote>

              <div class="lehman-profile-row">
                <img
                  src="~/assets/images/slides/lehman.jpg"
                  alt="Meir Manny Lehman"
                  class="lehman-avatar-lg"
                  width="56"
                  height="56"
                />
                <div class="lehman-meta-wrap">
                  <strong class="lehman-name-lg">Meir &ldquo;Manny&rdquo; Lehman</strong>
                  <span class="lehman-role-lg">Pioneiro da Computação - 1ª Lei da Evolução de Software</span>
                  <p class="lehman-expl">
                    Sistemas de software corporativos e seus esquemas de banco de dados não são estáticos; passam por alterações frequentes de colunas, restrições e regras de negócio para acompanhar o mercado.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- SLIDE 03: PROBLEMA DA DESINCRONIZAÇÃO (DOIS ELEMENTOS + 3 DORES) -->
        <section v-else-if="slide.id === 'problema'" class="slide-stack">
          <div class="slide-title-group slide-stagger">
            <h2 class="slide-heading">
              O Problema: Desincronização entre SQL e DER
            </h2>
          </div>

          <div class="problem-layout">
            <!-- Esquerda: As 3 Dores Centrais -->
            <div class="problem-left slide-stagger">
              <div class="problem-flow-list">
                <div v-for="(item, idx) in PROBLEM_BREAKDOWN" :key="item.title" class="surface-card problem-flow-item-hero">
                  <div class="flow-num-hero">{{ idx + 1 }}</div>
                  <div class="flow-text-hero">
                    <h3 class="flow-title-hero">{{ item.title }}</h3>
                    <p class="flow-desc-hero">{{ item.detail }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Direita: Comparativo Visual da Desincronização -->
            <div class="problem-right slide-stagger">
              <div class="canvas-panel-box">
                <div class="box-header-line">
                  <span class="box-label">Desincronização na evolução manual do banco</span>
                </div>

                <div class="desync-evolution-stage">
                  <div class="evo-panel">
                    <span class="evo-title">Banco em Produção (SQL)</span>

                    <div class="evo-code-box">
                      <pre class="sql-code-pre is-compact"><code><span class="sql-kw">CREATE TABLE</span> <span class="sql-ident">clientes</span> <span class="sql-delim">(</span>
  <span class="sql-ident">id</span> <span class="sql-type">INT</span> <span class="sql-kw">PRIMARY KEY</span><span class="sql-delim">,</span>
  <span class="sql-ident">nome</span> <span class="sql-type">VARCHAR</span><span class="sql-delim">(</span><span class="sql-num">100</span><span class="sql-delim">)</span> <span class="sql-kw">NOT NULL</span><span class="sql-delim">,</span>
<span class="sql-diff-line">  <span class="sql-ident">telefone</span> <span class="sql-type">VARCHAR</span><span class="sql-delim">(</span><span class="sql-num">20</span><span class="sql-delim">),</span></span>
<span class="sql-diff-line">  <span class="sql-ident">plano_id</span> <span class="sql-type">INT</span> <span class="sql-kw">REFERENCES</span> <span class="sql-ident">planos</span><span class="sql-delim">(</span><span class="sql-ident">id</span><span class="sql-delim">)</span></span>
<span class="sql-delim">);</span></code></pre>
                    </div>
                  </div>

                  <div class="evo-break-bridge" aria-hidden="true">
                    <svg viewBox="0 0 88 64" class="evo-break-svg" fill="none">
                      <line x1="0" y1="32" x2="28" y2="32" stroke="#EF4444" stroke-width="2" stroke-dasharray="4 4" />
                      <line x1="60" y1="32" x2="88" y2="32" stroke="#EF4444" stroke-width="2" stroke-dasharray="4 4" />
                      <circle cx="44" cy="32" r="13" fill="#FEF2F2" stroke="#EF4444" stroke-width="1.75" />
                      <path d="M 39 27 L 49 37 M 49 27 L 39 37" stroke="#EF4444" stroke-width="2" stroke-linecap="round" />
                    </svg>
                    <span class="connector-caption">Sem atualização</span>
                  </div>

                  <div class="evo-panel">
                    <span class="evo-title">Documentação DER</span>

                    <div class="evo-der-card">
                      <div class="evo-der-header">
                        <span>clientes</span>
                      </div>
                      <div class="evo-der-rows">
                        <div class="evo-der-row is-pk">
                          <span class="evo-col-left">
                            <Key :size="12" class="icon-pk-inline" />
                            <strong>id</strong>
                          </span>
                          <span class="evo-col-type">INT</span>
                        </div>
                        <div class="evo-der-row">
                          <span class="evo-col-left">nome</span>
                          <span class="evo-col-type">VARCHAR(100)</span>
                        </div>
                        <div class="evo-der-missing">
                          <span>− telefone (não documentado)</span>
                          <span>− FK plano_id (relação invisível)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="resolution-line">
                  <GitCompareArrows :size="16" class="resolution-icon" aria-hidden="true" />
                  <span class="resolution-text">
                    <strong>Solução <span class="brand-word">BrDiagrama</span>:</strong> sincronização automática e bidirecional que acompanha a evolução do esquema sem retrabalho.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- SLIDE 04: A SOLUÇÃO BRDIAGRAMA (MOTOR + PÚBLICOS) -->
        <section v-else-if="slide.id === 'visao'" class="slide-stack">
          <div class="slide-title-group slide-stagger">
            <h2 class="slide-heading">
              A Solução: Sincronização Bidirecional em Tempo Real
            </h2>
          </div>

          <div class="visao-solution-grid slide-stagger">
            <!-- Diagrama Ilustrado Fiel ao Padrão dos Slides (SQL Dark Modern ⇄ Motor ⇄ DER) -->
            <div class="surface-card sync-engine-hero-card">
              <div class="sync-engine-visual-lg">
                <!-- Bloco 1: Editor de Código -->
                <div class="sync-code-box">
                  <pre class="sql-code-pre"><code><span class="sql-kw">CREATE TABLE</span> <span class="sql-ident">clientes</span> <span class="sql-delim">(</span>
  <span class="sql-ident">id</span> <span class="sql-type">INT</span> <span class="sql-kw">PRIMARY KEY</span><span class="sql-delim">,</span>
  <span class="sql-ident">nome</span> <span class="sql-type">VARCHAR</span><span class="sql-delim">(</span><span class="sql-num">100</span><span class="sql-delim">)</span>
<span class="sql-delim">);</span></code></pre>
                </div>

                <!-- Conexão Central: Flechas Bidirecionais -->
                <div class="sync-engine-core" aria-hidden="true">
                  <svg viewBox="0 0 100 36" class="engine-arrows-svg" fill="none">
                    <path d="M 8 12 L 92 12" stroke="#1C1C1C" stroke-width="2.4" stroke-linecap="round" />
                    <path d="M 84 6 L 92 12 L 84 18" stroke="#1C1C1C" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M 92 24 L 8 24" stroke="#192747" stroke-width="2.4" stroke-linecap="round" />
                    <path d="M 16 18 L 8 24 L 16 30" stroke="#192747" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>

                <!-- Bloco 2: Card DER oficial dos slides -->
                <div class="sync-der-box">
                  <SlideDiagramCard :table="COVER_TABLES[0]" />
                </div>
              </div>
            </div>

            <!-- Dois Públicos Alvo Ampliados -->
            <div class="audience-grid-split">
              <div class="surface-card audience-card-hero">
                <div class="audience-title-line-hero">
                  <Briefcase :size="20" class="icon-teal" />
                  <strong>Indústria e Engenharia</strong>
                </div>
                <p>Elimina retrabalho manual na manutenção e evolução contínua do banco em equipes de desenvolvimento ágil.</p>
              </div>

              <div class="surface-card audience-card-hero">
                <div class="audience-title-line-hero">
                  <GraduationCap :size="20" class="icon-teal" />
                  <strong>Ensino de Bancos de Dados</strong>
                </div>
                <p>Apoio pedagógico com feedback visual imediato para cada comando SQL DDL executado em sala de aula.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- SLIDE 05: OBJETIVO GERAL DA PESQUISA -->
        <section v-else-if="slide.id === 'objetivo'" class="slide-stack">
          <div class="slide-title-group slide-stagger">
            <h2 class="slide-heading">
              Objetivo Geral da Pesquisa
            </h2>
          </div>

          <div class="objetivo-full-card surface-card slide-stagger">
            <blockquote class="objetivo-quote-hero">
              &ldquo;Desenvolver uma ferramenta CASE web para modelagem de bancos de dados relacionais que permita a <strong>sincronização bidirecional e em tempo real</strong> entre scripts SQL DDL e Diagramas de Entidade-Relacionamento, processando comandos SQL para gerar o diagrama e vice-versa.&rdquo;
            </blockquote>

            <div class="research-scope-tags-hero">
              <div class="scope-tag-hero">
                <span class="scope-label-hero">Natureza</span>
                <span class="scope-val-hero">Aplicada</span>
                <span class="scope-sub-hero">Geração de ferramenta funcional voltada a problemas reais de modelagem.</span>
              </div>

              <div class="scope-tag-hero">
                <span class="scope-label-hero">Abordagem</span>
                <span class="scope-val-hero">Quali-Quantitativa</span>
                <span class="scope-sub-hero">Avaliação empírica com métricas objetivas e percepção qualitativa dos usuários.</span>
              </div>

              <div class="scope-tag-hero">
                <span class="scope-label-hero">Execução</span>
                <span class="scope-val-hero">Client-Side Web</span>
                <span class="scope-sub-hero">Processamento de código 100% no navegador, sem servidor local de banco.</span>
              </div>
            </div>
          </div>
        </section>

        <!-- SLIDE 04: MÉTODO PROPOSTO -->
        <section v-else-if="slide.id === 'metodo'" class="slide-stack">
          <div class="slide-title-group slide-stagger">
            <h2 class="slide-heading">
              Método Proposto: Etapas de Desenvolvimento
            </h2>
          </div>

          <div class="method-pipeline-grid">
            <article
              v-for="item in METHOD_PIPELINE"
              :key="item.number"
              class="surface-card pipeline-card slide-stagger"
            >
              <span class="pipeline-num">{{ item.number }}</span>
              <h3 class="pipeline-title">{{ item.title }}</h3>
              <p class="pipeline-desc">{{ item.description }}</p>
            </article>
          </div>
        </section>

        <!-- SLIDE 05: FUNDAMENTAÇÃO TEÓRICA -->
        <section v-else-if="slide.id === 'fundamentacao'" class="slide-stack">
          <div class="slide-title-group slide-stagger">
            <h2 class="slide-heading">
              Fundamentação: Conceitos de Modelagem e SQL
            </h2>
          </div>

          <!-- Dois Grandes Pilares Conceituais: DER e SQL DDL -->
          <div class="fundamentacao-dual-grid">
            <article
              v-for="concept in FUNDAMENTACAO_CONCEPTS"
              :key="concept.title"
              class="surface-card concept-card slide-stagger"
            >
              <div class="concept-header">
                <h3 class="concept-title">{{ concept.title }}</h3>
                <span class="concept-subtitle">{{ concept.subtitle }}</span>
              </div>

              <p class="concept-desc">{{ concept.description }}</p>

              <div class="concept-items-list">
                <div v-for="item in concept.items" :key="item.label" class="concept-item-row">
                  <span class="concept-dot"></span>
                  <div class="concept-item-text">
                    <strong>{{ item.label }}</strong>
                    <span>{{ item.detail }}</span>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- SLIDE 06: ENGENHARIA DIRETA E REVERSA (FERRAMENTAS CASE) -->
        <section v-else-if="slide.id === 'engenharia_case'" class="slide-stack">
          <div class="slide-title-group slide-stagger">
            <h2 class="slide-heading">
              Fundamentação: Engenharia Direta e Reversa
            </h2>
          </div>

          <div class="case-two-flows-layout">
            <!-- Bloco 1: Engenharia Direta (DER -> SQL) -->
            <article class="surface-card case-flow-card slide-stagger">
              <div class="flow-card-head">
                <h3 class="flow-card-title">Engenharia Direta</h3>
                <span class="flow-card-direction">
                  <span>DER</span>
                  <ArrowRight :size="14" class="direction-icon" />
                  <span>Script SQL</span>
                </span>
              </div>
              <p class="flow-card-desc">
                Transforma o modelo visual (tabelas, atributos e cardinalidades) no script SQL DDL correspondente de forma automatizada.
              </p>

              <div class="flow-visual-duo">
                <div class="flow-visual-box is-der">
                  <SlideDiagramCard :table="COVER_TABLES[0]" compact />
                </div>
                <div class="flow-arrow-mid">
                  <ArrowRight :size="20" />
                </div>
                <div class="flow-visual-box is-sql">
                  <pre class="flow-code-pre"><code><span class="sql-kw">CREATE TABLE</span> clientes (
  id <span class="sql-type">INT</span> <span class="sql-kw">PRIMARY KEY</span>,
  nome <span class="sql-type">VARCHAR</span>(100)
);</code></pre>
                </div>
              </div>
            </article>

            <!-- Bloco 2: Engenharia Reversa (SQL -> DER) -->
            <article class="surface-card case-flow-card slide-stagger">
              <div class="flow-card-head">
                <h3 class="flow-card-title">Engenharia Reversa</h3>
                <span class="flow-card-direction">
                  <span>Script SQL</span>
                  <ArrowRight :size="14" class="direction-icon" />
                  <span>DER</span>
                </span>
              </div>
              <p class="flow-card-desc">
                Interpreta comandos SQL DDL existentes e reconstrói visualmente a estrutura de tabelas, chaves e relacionamentos no diagrama.
              </p>

              <div class="flow-visual-duo">
                <div class="flow-visual-box is-sql">
                  <pre class="flow-code-pre"><code><span class="sql-kw">CREATE TABLE</span> pedidos (
  id <span class="sql-type">INT</span> <span class="sql-kw">PRIMARY KEY</span>,
  total <span class="sql-type">DECIMAL</span>(10,2),
  cliente_id <span class="sql-type">INT</span>
);</code></pre>
                </div>
                <div class="flow-arrow-mid">
                  <ArrowRight :size="20" />
                </div>
                <div class="flow-visual-box is-der">
                  <SlideDiagramCard :table="COVER_TABLES[1]" compact />
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- SLIDE 07: DESENVOLVIMENTO (AÇÕES DO USUÁRIO) -->
        <section v-else-if="slide.id === 'desenvolvimento'" class="slide-stack">
          <div class="dev-top-row slide-stagger">
            <h2 class="slide-heading">
              Desenvolvimento: Ciclo de Ações do Usuário
            </h2>
          </div>

          <div class="persona-full-layout slide-stagger">
            <div class="actor-hero-wide">
              <div class="actor-avatar-box-lg">
                <User :size="32" />
              </div>
              <div>
                <h3 class="actor-title-lg">Usuário do Sistema</h3>
                <span class="actor-roles-lg">Estudantes, Desenvolvedores e Professores</span>
              </div>
            </div>

            <div class="actor-actions-grid">
              <div class="surface-card user-action-card">
                <div class="action-card-header">
                  <span class="action-dot"></span>
                  <strong>1. Escrever ou Importar SQL</strong>
                </div>
                <p>Inserção e leitura de scripts SQL DDL em tempo real pelo editor Monaco integrado.</p>
              </div>

              <div class="surface-card user-action-card">
                <div class="action-card-header">
                  <span class="action-dot"></span>
                  <strong>2. Visualizar e Editar DER</strong>
                </div>
                <p>Manipulação interativa de entidades e cardinalidades no canvas com sincronização reversa contínua.</p>
              </div>

              <div class="surface-card user-action-card">
                <div class="action-card-header">
                  <span class="action-dot"></span>
                  <strong>3. Exportar Diagrama e Código</strong>
                </div>
                <p>Geração imediata de artefatos visuais (PNG, SVG) e script SQL padronizado sem retrabalho.</p>
              </div>

              <div class="surface-card user-action-card">
                <div class="action-card-header">
                  <span class="action-dot"></span>
                  <strong>4. Execução no Navegador (PWA)</strong>
                </div>
                <p>Aplicação 100% acessível via web, permitindo uso offline e instalação nativa sem banco local.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- SLIDE 08: ARQUITETURA EM 3 CAMADAS (SLIDE DEDICADO 100% VISUAL) -->
        <section v-else-if="slide.id === 'arquitetura'" class="slide-stack slide-arch-dedicated">
          <div class="arch-top-header slide-stagger">
            <h2 class="slide-heading">
              Arquitetura em 3 Camadas
            </h2>
          </div>

          <div class="arch-full-cover-stage slide-stagger">
            <img
              src="~/assets/images/slides/architecture.jpg"
              alt="Arquitetura em 3 camadas do BrDiagrama: Apresentação, Processamento e Hospedagem"
              class="arch-hero-img"
            />
          </div>
        </section>

        <!-- SLIDE 08: TESTE PRÁTICO COM ESTUDANTES -->
        <section v-else-if="slide.id === 'teste_beta'" class="slide-stack">
          <div class="beta-header-row slide-stagger">
            <div>
              <h2 class="slide-heading">
                Teste Prático com Estudantes
              </h2>
            </div>
            <div class="beta-sample-info">
              <span class="sample-num">25</span>
              <span class="sample-text">Alunos de ADS participantes (2ª e 3ª fase, FMP)</span>
            </div>
          </div>

          <!-- Roteiro de Teste Limpo sem Borda de Caixa -->
          <div class="beta-protocol-line slide-stagger">
            <span class="protocol-strip-label">Roteiro de validação:</span>
            <div class="protocol-steps-inline">
              <span class="p-step">1. Inserir script SQL</span>
              <ArrowRight :size="14" class="p-arrow" />
              <span class="p-step">2. Conferir o diagrama gerado</span>
              <ArrowRight :size="14" class="p-arrow" />
              <span class="p-step">3. Modificar o DER visualmente</span>
              <ArrowRight :size="14" class="p-arrow" />
              <span class="p-step">4. Exportar e avaliar</span>
            </div>
          </div>

          <!-- 3 Big Numbers Limpos e Equilibrados -->
          <div class="beta-metrics-grid">
            <article
              v-for="metric in BETA_METRICS"
              :key="metric.label"
              class="surface-card beta-metric-card slide-stagger"
            >
              <span class="beta-big-value">{{ metric.value }}</span>
              <h3 class="beta-metric-title">{{ metric.label }}</h3>
              <p class="beta-metric-desc">{{ metric.detail }}</p>
            </article>
          </div>
        </section>

        <!-- SLIDE 12: CONCLUSÃO E AGRADECIMENTOS -->
        <section v-else-if="slide.id === 'conclusao'" class="slide-stack conclusao-section-wrap">
          <div class="slide-title-group slide-stagger">
            <h2 class="slide-heading">
              Conclusão
            </h2>
          </div>

          <div class="conclusao-narrative-flow slide-stagger">
            <p class="conclusao-lead-text">
              O <strong><span class="brand-word">BrDiagrama</span></strong> comprovou a viabilidade técnica de uma ferramenta CASE moderna com sincronização bidirecional em tempo real entre scripts SQL e diagramas relacionais. Ao processar código inteiramente no navegador e manter consistência imediata entre a visão gráfica e estrutural, o projeto elimina o retrabalho manual na evolução de esquemas e fornece suporte direto tanto para a engenharia de software na indústria quanto para a prática pedagógica no ensino de bancos de dados.
            </p>
          </div>

          <!-- Agradecimento Marcante e Solto -->
          <div class="thanks-banner slide-stagger">
            <h3 class="thanks-title">Obrigado!</h3>
          </div>
        </section>

        <!-- Logos Institucionais no Canto Inferior Direito -->
        <aside class="slide-corner-logos slide-stagger" aria-label="Logos institucionais FMP e ADS">
          <img
            src="~/assets/images/logo/fmp.jpeg"
            alt="Faculdade Municipal de Palhoça"
            class="corner-logo-img"
          />
          <img
            src="~/assets/images/logo/ads.jpeg"
            alt="Análise e Desenvolvimento de Sistemas"
            class="corner-logo-img"
          />
        </aside>
      </div>
    </main>

    <!-- DRAWER DE NOTAS DO APRESENTADOR -->
    <Transition name="notes-slide">
      <aside v-if="isNotesOpen" class="notes-drawer" aria-label="Notas do apresentador">
        <div class="notes-inner">
          <div class="notes-header">
            <span class="notes-label">Roteiro de fala · Slide {{ currentSlide.number }} ({{ currentSlide.shortTitle }})</span>
            <button type="button" class="tool-btn" aria-label="Fechar notas" @click="isNotesOpen = false">
              <X :size="15" />
            </button>
          </div>
          <p class="notes-text">{{ currentSlide.speakerNote }}</p>
        </div>
      </aside>
    </Transition>

    <!-- MODAL DE VISÃO GERAL -->
    <Transition name="overview-fade">
      <div v-if="isOverviewOpen" class="overview-backdrop" role="dialog" aria-modal="true" aria-label="Grade de slides">
        <div class="overview-panel">
          <div class="overview-header">
            <h2 class="overview-title">Visão Geral da Apresentação ({{ totalSlides }} Slides)</h2>
            <button type="button" class="tool-btn" aria-label="Fechar grade" @click="isOverviewOpen = false">
              <X :size="18" />
            </button>
          </div>
          <div class="overview-grid">
            <button
              v-for="(slide, idx) in SLIDES_METADATA"
              :key="slide.id"
              type="button"
              class="overview-card"
              :class="{ 'is-current': idx === currentSlideIndex }"
              @click="goToSlide(idx)"
            >
              <div class="overview-card-top">
                <span class="overview-num">{{ slide.number }}</span>
                <span class="overview-sec">{{ slide.sectionLabel }}</span>
              </div>
              <strong class="overview-name">{{ slide.shortTitle }}</strong>
              <p class="overview-note">{{ slide.speakerNote }}</p>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slides-shell {
  --slide-bg: #ffffff;
  --slide-surface: #ffffff;
  --slide-border: rgba(0, 0, 0, 0.08);
  --slide-text: #1f1f1f;
  --slide-text-muted: #5e6368;
  --slide-navy: #192747;
  --slide-primary: #1aba9c;
  --slide-primary-ink: #0f766e;
  --slide-fk: #3b82f6;
  --slide-code-bg: #141414;

  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--slide-bg);
  background-image: radial-gradient(circle, rgba(115, 120, 130, 0.22) 1.2px, transparent 1.2px);
  background-size: 26px 26px;
  color: var(--slide-text);
  font-family: 'Google Sans Flex', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-variant-numeric: tabular-nums;
  overflow-x: hidden;
  position: relative;
}

.slides-shell ::selection {
  background-color: rgba(26, 186, 156, 0.22);
  color: #111827;
}

.slides-toolbar {
  height: 56px;
  background-color: var(--slide-surface);
  border-bottom: 1px solid var(--slide-border);
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 40;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-link {
  display: inline-flex;
  align-items: center;
}

.toolbar-logo {
  height: 26px;
  width: auto;
  display: block;
}

.toolbar-divider {
  width: 1px;
  height: 18px;
  background-color: var(--slide-border);
}

.toolbar-progress {
  display: flex;
  align-items: center;
  gap: 6px;
}

.progress-step {
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  border: none;
  background-color: rgba(25, 39, 71, 0.16);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: width 0.2s ease, background-color 0.2s ease;
}

.progress-step:hover {
  background-color: rgba(25, 39, 71, 0.42);
}

.progress-step.is-visited {
  background-color: rgba(26, 186, 156, 0.55);
}

.progress-step.is-active {
  width: 30px;
  height: 22px;
  background-color: var(--slide-navy);
  color: #ffffff;
}

.progress-step-label {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.tool-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--slide-text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.tool-btn:hover:not(:disabled) {
  background-color: #f1f3f5;
  color: var(--slide-text);
}

.tool-btn.is-active {
  background-color: #edfefc;
  border-color: rgba(26, 186, 156, 0.45);
  color: var(--slide-primary-ink);
}

.tool-btn:disabled {
  opacity: 0.35;
}

.pptx-btn {
  color: var(--slide-primary-ink);
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.nav-controls {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.slide-counter {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--slide-navy);
  min-width: 52px;
  text-align: center;
}

.progress-rail {
  height: 2px;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.05);
}

.progress-rail-fill {
  height: 100%;
  background-color: var(--slide-primary);
  transition: width 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

.slides-stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 56px 72px 56px;
}

.slide-container {
  width: 100%;
  max-width: 1440px;
}

.slide-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.slide-heading {
  font-size: clamp(1.85rem, 2.6vw, 2.45rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.025em;
  color: var(--slide-navy);
  margin: 0;
}

.surface-card {
  background-color: var(--slide-surface);
  border: 1px solid var(--slide-border);
  border-radius: 12px;
  padding: 22px 24px;
}

.section-mono-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--slide-primary-ink);
  text-transform: uppercase;
}

.icon-teal {
  color: var(--slide-primary-ink);
  flex-shrink: 0;
}

/* =========================================
   SLIDE 01: CAPA
   ========================================= */
.slide-cover {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 40px;
  align-items: center;
}

.cover-editorial {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cover-title {
  font-size: clamp(2.1rem, 3.4vw, 3.25rem);
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.03em;
  color: var(--slide-navy);
  margin: 0;
}

.cover-subtitle {
  font-size: clamp(1.1rem, 1.45vw, 1.3rem);
  line-height: 1.55;
  color: var(--slide-text-muted);
  max-width: 62ch;
  margin: 0;
}

.brand-word {
  color: var(--slide-primary-ink);
  font-weight: 700;
}

.cover-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--slide-border);
}

.meta-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-label {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--slide-text-muted);
}

.meta-people {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.person-name-item {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--slide-navy);
  line-height: 1.4;
}

.cover-visual {
  display: flex;
  justify-content: center;
}

.cover-canvas-clean {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  max-width: 580px;
}

.cover-code-surface {
  background-color: #1C1C1C;
  border-radius: 10px;
  padding: 16px 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
  z-index: 2;
}

.sql-code-pre {
  margin: 0;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: #F0F0F0;
  white-space: pre-wrap;
}

.sql-kw {
  color: #5EEAD4;
  font-weight: 600;
}

.sql-type {
  color: #FDBA74;
}

.sql-ident {
  color: #F0F0F0;
}

.sql-num {
  color: #FCA5A5;
}

.sql-delim {
  color: #9AA0A6;
}

.sql-code-pre.is-compact {
  font-size: 0.78rem;
  line-height: 1.48;
}

.cover-sync-fork {
  width: 100%;
  height: 84px;
  position: relative;
  z-index: 1;
}

.fork-svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}

.cover-der-stage {
  display: grid;
  grid-template-columns: 1fr 68px 1fr;
  align-items: start;
  position: relative;
  z-index: 2;
}

.cover-card-slot {
  min-width: 0;
}

.cover-der-rel {
  width: 68px;
  height: 130px;
  position: relative;
}

.der-rel-svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}

@keyframes derFlowDash {
  to {
    stroke-dashoffset: -26px;
  }
}

.der-flow-line {
  animation: derFlowDash 1.8s linear infinite;
}

.der-card-text {
  font-family: 'Google Sans Flex', 'Segoe UI', sans-serif;
  font-size: 13px;
  font-weight: 700;
  fill: #192747;
}

.slide-corner-logos {
  position: fixed;
  right: 36px;
  bottom: 24px;
  z-index: 35;
  display: flex;
  align-items: center;
  gap: 18px;
  pointer-events: none;
}

.corner-logo-img {
  height: 48px;
  width: auto;
  object-fit: contain;
  display: block;
}

/* =========================================
   SLIDE 02: CONTEXTO & PROBLEMA
   ========================================= */
.problem-layout {
  display: grid;
  grid-template-columns: 0.98fr 1.12fr;
  gap: 24px;
  align-items: stretch;
}

.problem-left {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-highlight-card {
  background-color: var(--slide-surface);
  border: 1px solid var(--slide-border);
  border-radius: 12px;
  padding: 22px 24px;
  display: flex;
  align-items: center;
  gap: 22px;
}

.stat-gauge-wrap {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-donut-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.donut-bg {
  fill: none;
  stroke: rgba(25, 39, 71, 0.08);
  stroke-width: 5;
}

.donut-fill {
  fill: none;
  stroke: var(--slide-primary);
  stroke-width: 5;
  stroke-linecap: round;
}

.donut-center-tag {
  position: absolute;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--slide-navy);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-number {
  font-size: 2.65rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--slide-navy);
  line-height: 1;
}

.stat-desc {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.45;
  color: var(--slide-text);
}

.stat-source {
  font-size: 0.78rem;
  color: var(--slide-text-muted);
}

.lehman-quote-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0 4px 14px;
  border-left: 2px solid var(--slide-primary);
}

.lehman-quote-text {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  font-style: italic;
  line-height: 1.4;
  color: var(--slide-navy);
}

.lehman-author-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.lehman-avatar {
  width: 44px;
  height: 44px;
  border-radius: 9999px;
  object-fit: cover;
  border: 1.5px solid rgba(25, 39, 71, 0.16);
  flex-shrink: 0;
}

.lehman-meta-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lehman-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--slide-navy);
}

.lehman-role-desc {
  font-size: 0.78rem;
  color: var(--slide-text-muted);
}

.problem-flow-list {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border: 1px solid var(--slide-border);
  border-radius: 12px;
  overflow: hidden;
}

.problem-flow-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 13px 18px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.problem-flow-item:first-child {
  border-top: none;
}

.flow-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--slide-primary-ink);
  background-color: #edfefc;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.flow-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.flow-title {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--slide-navy);
}

.flow-desc {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.42;
  color: var(--slide-text-muted);
}

.canvas-panel-box {
  height: 100%;
  background-color: var(--slide-surface);
  border: 1px solid var(--slide-border);
  border-radius: 12px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 18px;
}

.box-header-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.box-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--slide-navy);
}

.desync-evolution-stage {
  display: grid;
  grid-template-columns: 1.1fr auto 0.95fr;
  gap: 14px;
  align-items: center;
}

.evo-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.evo-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--slide-navy);
}

.evo-code-box {
  background-color: #1C1C1C;
  border-radius: 8px;
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.sql-diff-line {
  display: inline-block;
  width: 100%;
  background-color: rgba(26, 186, 156, 0.14);
  border-left: 2px solid #1ABA9C;
  padding-left: 4px;
  margin-left: -6px;
}

.evo-break-bridge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 84px;
}

.evo-break-svg {
  width: 84px;
  height: 54px;
}

.evo-der-card {
  border: 1px solid rgba(25, 39, 71, 0.2);
  border-radius: 8px;
  overflow: hidden;
  background-color: #ffffff;
}

.evo-der-header {
  background-color: #192747;
  color: #ffffff;
  padding: 7px 12px;
  font-size: 0.8125rem;
  font-weight: 700;
}

.evo-der-rows {
  display: flex;
  flex-direction: column;
}

.evo-der-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  font-size: 0.78rem;
  color: #1f2937;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.evo-der-row.is-pk {
  background-color: #edfefc;
  border-top: none;
}

.evo-col-left {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.icon-pk-inline {
  color: #1aba9c;
}

.evo-col-type {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6875rem;
  color: #5e6368;
}

.evo-der-missing {
  background-color: #fef2f2;
  border-top: 1px dashed rgba(239, 68, 68, 0.45);
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  font-weight: 600;
  color: #dc2626;
}

.connector-caption {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #dc2626;
  text-align: center;
}

.resolution-line {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-left: 2px solid var(--slide-primary);
}

.resolution-icon {
  color: var(--slide-primary-ink);
  flex-shrink: 0;
}

.resolution-text {
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--slide-text-muted);
}

.resolution-text strong {
  color: var(--slide-navy);
}

/* =========================================
   SLIDE 03: VISÃO DO PRODUTO & OBJETIVO
   ========================================= */
.visao-layout {
  display: grid;
  grid-template-columns: 1.28fr 0.92fr;
  gap: 22px;
  align-items: stretch;
}

.visao-diagram-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 18px;
}

.visao-card-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--slide-navy);
  line-height: 1.25;
}

.sync-engine-visual {
  display: grid;
  grid-template-columns: 1.15fr auto 1fr;
  gap: 16px;
  align-items: center;
  padding: 8px 0;
}

.sync-code-box {
  background-color: #1C1C1C;
  border-radius: 8px;
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.sync-der-box {
  min-width: 0;
}

.sync-engine-core {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
}

.engine-arrows-svg {
  width: 90px;
  height: 36px;
}

.audience-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.audience-item {
  border: 1px solid var(--slide-border);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.audience-title-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--slide-navy);
}

.audience-item p {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.42;
  color: var(--slide-text-muted);
}

.objetivo-callout-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 18px;
}

.objetivo-main-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--slide-navy);
}

.objetivo-quote {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.62;
  color: var(--slide-text);
  font-style: italic;
  padding: 4px 0 4px 14px;
  border-left: 2px solid var(--slide-primary);
  background: transparent;
  border-top: none;
  border-right: none;
  border-bottom: none;
  border-radius: 0;
}

.objetivo-quote strong {
  color: var(--slide-navy);
  font-style: normal;
}

.research-scope-tags {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding-top: 14px;
  border-top: 1px solid var(--slide-border);
}

.scope-tag {
  background: transparent;
  border: 1px solid var(--slide-border);
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.scope-label {
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--slide-text-muted);
}

.scope-val {
  font-family: inherit;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--slide-navy);
}

/* =========================================
   SLIDE 02: CONTEXTO E RELEVÂNCIA (SPLIT AMPLO)
   ========================================= */
.context-split-grid {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 28px;
  align-items: stretch;
}

.context-stat-hero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 36px 32px;
}

.stat-content-hero {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-number-hero {
  font-size: 3.8rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--slide-navy);
  line-height: 1;
}

.stat-desc-hero {
  margin: 0;
  font-size: 1.15rem;
  line-height: 1.5;
  color: var(--slide-text);
}

.stat-source-hero {
  font-size: 0.9rem;
  color: var(--slide-text-muted);
}

.context-lehman-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  padding: 36px 36px;
}

.lehman-quote-hero {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  font-style: italic;
  line-height: 1.4;
  color: var(--slide-navy);
  padding: 4px 0 4px 18px;
  border-left: 3px solid var(--slide-primary);
}

.lehman-profile-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.lehman-avatar-lg {
  width: 58px;
  height: 58px;
  border-radius: 9999px;
  object-fit: cover;
  border: 2px solid rgba(25, 39, 71, 0.16);
  flex-shrink: 0;
}

.lehman-name-lg {
  font-size: 1.15rem;
  color: var(--slide-navy);
}

.lehman-role-lg {
  font-size: 0.88rem;
  color: var(--slide-primary-ink);
  font-weight: 600;
}

.lehman-expl {
  margin: 8px 0 0 0;
  font-size: 0.96rem;
  line-height: 1.55;
  color: var(--slide-text-muted);
}

/* =========================================
   SLIDE 03: PROBLEMA (DORES AMPLIADAS)
   ========================================= */
.problem-flow-item-hero {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 22px;
  margin-bottom: 14px;
}

.flow-num-hero {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--slide-primary-ink);
  background-color: #edfefc;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.flow-text-hero {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.flow-title-hero {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--slide-navy);
}

.flow-desc-hero {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--slide-text-muted);
}

/* =========================================
   SLIDE 04: A SOLUÇÃO (MOTOR + PÚBLICOS AMPLIADOS)
   ========================================= */
.visao-solution-grid {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.sync-engine-hero-card {
  padding: 24px 32px;
}

.sync-engine-visual-lg {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 32px;
}

.audience-grid-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
}

.audience-card-hero {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 22px 26px;
}

.audience-title-line-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.2rem;
  color: var(--slide-navy);
}

.audience-card-hero p {
  margin: 0;
  font-size: 0.98rem;
  line-height: 1.55;
  color: var(--slide-text-muted);
}

/* =========================================
   SLIDE 05: OBJETIVO GERAL AMPLIADO
   ========================================= */
.objetivo-full-card {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 38px 44px;
}

.objetivo-quote-hero {
  margin: 0;
  font-size: 1.35rem;
  line-height: 1.68;
  color: var(--slide-text);
  font-style: italic;
  padding: 4px 0 4px 22px;
  border-left: 4px solid var(--slide-primary);
}

.objetivo-quote-hero strong {
  color: var(--slide-navy);
  font-style: normal;
}

.research-scope-tags-hero {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding-top: 24px;
  border-top: 1px solid var(--slide-border);
}

.scope-tag-hero {
  background: transparent;
  border: 1px solid var(--slide-border);
  border-radius: 10px;
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.scope-label-hero {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--slide-text-muted);
}

.scope-val-hero {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--slide-navy);
}

.scope-sub-hero {
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--slide-text-muted);
}
.method-pipeline-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.pipeline-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px 22px;
}

.pipeline-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--slide-primary-ink);
}

.pipeline-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--slide-navy);
  line-height: 1.3;
}

.pipeline-desc {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--slide-text-muted);
}

/* =========================================
   SLIDE 04: FUNDAMENTAÇÃO TEÓRICA
   ========================================= */
/* =========================================
   SLIDE 05: FUNDAMENTAÇÃO TEÓRICA
   ========================================= */
.fundamentacao-dual-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.concept-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}

.concept-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-bottom: 1px solid var(--slide-border);
  padding-bottom: 12px;
}

.concept-tag {
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--slide-primary-ink);
}

.concept-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--slide-navy);
}

.concept-subtitle {
  font-size: 0.82rem;
  color: var(--slide-text-muted);
}

.concept-desc {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--slide-text);
}

.concept-items-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 4px;
}

.concept-item-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 0;
  background: transparent;
  border: none;
}

.concept-dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background-color: var(--slide-primary-ink);
  margin-top: 5px;
  flex-shrink: 0;
}

.concept-item-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.concept-item-text strong {
  font-size: 0.95rem;
  color: var(--slide-navy);
}

.concept-item-text span {
  font-size: 0.85rem;
  color: var(--slide-text-muted);
}

/* =========================================
   SLIDE 06: ENGENHARIA DIRETA E REVERSA
   ========================================= */
.case-two-flows-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px;
  align-items: stretch;
}

.case-flow-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}

.flow-card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--slide-border);
  padding-bottom: 12px;
}

.flow-card-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--slide-navy);
}

.flow-card-direction {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--slide-text-muted);
  background: transparent;
  padding: 0;
  border-radius: 0;
}

.direction-icon {
  flex-shrink: 0;
  color: currentColor;
}

.flow-card-desc {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: var(--slide-text-muted);
}

.flow-visual-duo {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 14px;
  margin-top: auto;
  padding-top: 10px;
}

.flow-visual-box {
  min-width: 0;
}

.flow-arrow-mid {
  color: var(--slide-navy);
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  flex-shrink: 0;
  padding: 0 4px;
}

.flow-visual-box.is-sql {
  background-color: #1c1c1c;
  border-radius: 8px;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.code-badge-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #5eead4;
}

.flow-code-pre {
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.76rem;
  line-height: 1.45;
  color: #f0f0f0;
  white-space: pre-wrap;
}

/* =========================================
   SLIDE 05: DESENVOLVIMENTO (PERSONA + ARQUITETURA)
   ========================================= */
.dev-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.run-system-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background-color: var(--slide-navy);
  color: #ffffff;
  font-size: 0.92rem;
  font-weight: 700;
  padding: 11px 20px;
  border-radius: 8px;
  text-decoration: none;
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.run-system-cta:hover {
  background-color: #0f172a;
}

.pulse-dot {
  width: 9px;
  height: 9px;
  border-radius: 9999px;
  background-color: #1aba9c;
}

.dev-layout {
  display: grid;
  grid-template-columns: 0.42fr 1fr;
  gap: 20px;
  align-items: stretch;
}

.persona-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.actor-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--slide-border);
}

.actor-avatar-box {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background-color: #edfefc;
  color: var(--slide-primary-ink);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.actor-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--slide-navy);
}

.actor-roles {
  font-size: 0.8rem;
  color: var(--slide-text-muted);
  font-weight: 500;
}

.actor-actions-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.actor-action-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 0;
  border: none;
  background: transparent;
}

.action-dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background-color: var(--slide-primary-ink);
  margin-top: 5px;
  flex-shrink: 0;
}

.actor-action-item div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.actor-action-item strong {
  font-size: 0.92rem;
  color: var(--slide-navy);
}

.actor-action-item span {
  font-size: 0.82rem;
  color: var(--slide-text-muted);
}

.persona-full-layout {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.actor-hero-wide {
  display: flex;
  align-items: center;
  gap: 16px;
}

.actor-avatar-box-lg {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background-color: #edfefc;
  color: var(--slide-primary-ink);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.actor-title-lg {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--slide-navy);
}

.actor-roles-lg {
  font-size: 0.88rem;
  color: var(--slide-text-muted);
  font-weight: 500;
}

.actor-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.user-action-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px 22px;
}

.action-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-card-header strong {
  font-size: 1.05rem;
  color: var(--slide-navy);
}

.user-action-card p {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: var(--slide-text-muted);
}

/* =========================================
   SLIDE 08: ARQUITETURA EM 3 CAMADAS DEDICADO
   ========================================= */
.slide-arch-dedicated {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.arch-top-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.arch-full-cover-stage {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  border: 1px solid var(--slide-border);
  border-radius: 12px;
  padding: 14px 20px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.arch-hero-img {
  width: 100%;
  max-height: 520px;
  object-fit: contain;
  display: block;
}

/* =========================================
   SLIDE 08: TESTE PRÁTICO COM ESTUDANTES
   ========================================= */
.beta-header-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 20px;
}

.beta-sample-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.sample-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--slide-primary-ink);
  line-height: 1;
}

.sample-text {
  font-size: 0.88rem;
  color: var(--slide-text-muted);
}

.beta-protocol-line {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 0;
  flex-wrap: wrap;
}

.protocol-strip-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--slide-text-muted);
}

.protocol-steps-inline {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 0.88rem;
  color: var(--slide-navy);
}

.p-step {
  font-weight: 500;
}

.p-arrow {
  color: var(--slide-text-muted);
  flex-shrink: 0;
}

.beta-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 10px;
}

.beta-metric-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 36px 30px;
  background-color: var(--slide-surface);
  border: 1px solid var(--slide-border);
  border-radius: 12px;
}

.beta-big-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 4.2rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: var(--slide-navy);
  line-height: 1;
}

.beta-metric-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--slide-navy);
}

.beta-metric-desc {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.55;
  color: var(--slide-text-muted);
}

/* =========================================
   SLIDE 12: CONCLUSÃO E AGRADECIMENTOS
   ========================================= */
.conclusao-section-wrap {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 28px;
}

.conclusao-narrative-flow {
  max-width: 960px;
  margin: 12px 0;
}

.conclusao-lead-text {
  margin: 0;
  font-size: 1.45rem;
  line-height: 1.68;
  color: var(--slide-text);
  font-weight: 400;
  letter-spacing: -0.01em;
}

.conclusao-lead-text strong {
  color: var(--slide-navy);
  font-weight: 700;
}

.thanks-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0 10px 0;
  border: none;
  background: transparent;
}

.thanks-title {
  margin: 0;
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--slide-navy);
  text-align: center;
}

/* =========================================
   DRAWER DE NOTAS & MODAL DE VISÃO GERAL
   ========================================= */
.notes-drawer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 45;
  background-color: #ffffff;
  border-top: 1px solid var(--slide-border);
  padding: 14px 24px;
}

.notes-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.notes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notes-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--slide-primary-ink);
}

.notes-text {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--slide-text);
}

.overview-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  background-color: rgba(15, 23, 42, 0.32);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.overview-panel {
  width: 100%;
  max-width: 1120px;
  max-height: 85vh;
  overflow-y: auto;
  background-color: #ffffff;
  border: 1px solid var(--slide-border);
  border-radius: 14px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.overview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.overview-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--slide-navy);
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.overview-card {
  text-align: left;
  background-color: #faf9f9;
  border: 1px solid var(--slide-border);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.overview-card:hover {
  border-color: var(--slide-navy);
}

.overview-card.is-current {
  background-color: #edfefc;
  border-color: var(--slide-primary);
}

.overview-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
}

.overview-num {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  color: var(--slide-primary-ink);
}

.overview-sec {
  color: var(--slide-text-muted);
}

.overview-name {
  font-size: 0.9375rem;
  color: var(--slide-navy);
}

.overview-note {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--slide-text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notes-slide-enter-active,
.notes-slide-leave-active,
.overview-fade-enter-active,
.overview-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.notes-slide-enter-from,
.notes-slide-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.overview-fade-enter-from,
.overview-fade-leave-to {
  opacity: 0;
}

.screen-hidden {
  display: none !important;
}

@media screen and (max-width: 1024px) {
  .slides-stage {
    padding: 20px;
  }

  .slide-cover,
  .problem-layout,
  .visao-layout,
  .method-pipeline-grid,
  .fundamentacao-triad,
  .case-gap-banner,
  .dev-layout,
  .beta-metrics-grid,
  .conclusao-grid {
    grid-template-columns: 1fr;
  }
}

/* =========================================
   ESTILOS DE IMPRESSÃO / EXPORTAÇÃO PARA PDF
   (PADRÃO OFICIAL SLIDES POWERPOINT 16:9 WIDESCREEN: 33.867cm x 19.05cm)
   ========================================= */
@media print {
  @page {
    size: 33.867cm 19.05cm;
    margin: 0;
  }

  html,
  body {
    background-color: #ffffff !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 33.867cm !important;
    height: 19.05cm !important;
    overflow: visible !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    font-size: 14.5px !important;
  }

  /* Força a remoção de qualquer elemento web superior e flutuante */
  .slides-toolbar,
  header,
  .progress-rail,
  .notes-drawer,
  .overview-backdrop,
  .v-overlay-container,
  .v-tooltip {
    display: none !important;
    height: 0 !important;
    max-height: 0 !important;
    opacity: 0 !important;
    pointer-events: none !important;
    visibility: hidden !important;
  }

  .slides-shell {
    background-color: #ffffff !important;
    background-image: none !important;
    width: 33.867cm !important;
    min-height: auto !important;
    height: auto !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    display: block !important;
  }

  .slides-stage {
    padding: 0 !important;
    margin: 0 !important;
    display: block !important;
    width: 33.867cm !important;
    height: auto !important;
    min-height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }

  /* Cada slide ocupa exatamente uma folha 16:9 Widescreen (33.867cm x 19.05cm) */
  .slide-container {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    width: 33.867cm !important;
    height: 19.05cm !important;
    max-width: 33.867cm !important;
    max-height: 19.05cm !important;
    box-sizing: border-box !important;
    padding: 1.8cm 2.6cm !important;
    position: relative !important;
    page-break-before: auto !important;
    page-break-after: always !important;
    break-after: page !important;
    overflow: hidden !important;
    transform: none !important;
    visibility: visible !important;
  }

  .slide-container:last-child {
    page-break-after: auto !important;
    break-after: auto !important;
  }

  .screen-hidden {
    display: flex !important;
  }

  .slide-grid,
  .slide-stack {
    width: 100% !important;
    max-width: 100% !important;
  }

  /* Força colunas lado a lado no padrão Widescreen nativo */
  .slide-cover {
    display: grid !important;
    grid-template-columns: 1.15fr 1fr !important;
    gap: 36px !important;
    align-items: center !important;
  }

  .cover-title {
    font-size: 2.1rem !important;
    line-height: 1.18 !important;
  }

  .cover-meta-grid {
    gap: 20px !important;
  }

  .person-name-item {
    font-size: 1.05rem !important;
  }

  .cover-canvas-clean {
    max-width: 520px !important;
  }

  .sql-code-pre {
    font-size: 0.78rem !important;
    line-height: 1.45 !important;
  }

  .cover-sync-fork {
    height: 72px !important;
  }

  .fork-svg {
    height: 72px !important;
  }

  .cover-der-stage {
    grid-template-columns: 1fr 64px 1fr !important;
  }

  .cover-der-rel {
    width: 64px !important;
    height: 120px !important;
  }

  /* Slide 02: Contexto */
  .context-split-grid {
    display: grid !important;
    grid-template-columns: 0.9fr 1.1fr !important;
    gap: 28px !important;
  }

  .stat-number-hero {
    font-size: 3.6rem !important;
  }

  /* Slide 03: Problema */
  .problem-layout {
    display: grid !important;
    grid-template-columns: 1fr 1.15fr !important;
    gap: 26px !important;
  }

  /* Slide 04: Solução BrDiagrama */
  .visao-solution-grid {
    display: flex !important;
    flex-direction: column !important;
    gap: 20px !important;
  }

  .sync-engine-visual-lg {
    display: grid !important;
    grid-template-columns: 1fr auto 1fr !important;
    gap: 26px !important;
  }

  .audience-grid-split {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 20px !important;
  }

  /* Slide 05: Objetivo Geral */
  .objetivo-full-card {
    display: flex !important;
    flex-direction: column !important;
    gap: 28px !important;
    padding: 32px 38px !important;
  }

  .objetivo-quote-hero {
    font-size: 1.25rem !important;
  }

  /* Slide 06 */
  .method-pipeline-grid {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 18px !important;
  }

  .pipeline-card {
    padding: 18px 20px !important;
  }

  /* Slide 07 */
  .fundamentacao-dual-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 24px !important;
  }

  /* Slide 08 */
  .case-two-flows-layout {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 24px !important;
  }

  .flow-code-pre {
    font-size: 0.76rem !important;
  }

  /* Slide 09: Ações do Usuário */
  .actor-actions-grid {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 18px !important;
  }

  /* Slide 10: Arquitetura */
  .arch-hero-img {
    max-height: 480px !important;
  }

  /* Slide 11: Métricas Beta */
  .beta-metrics-grid {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 20px !important;
  }

  .beta-big-value {
    font-size: 2.6rem !important;
  }

  /* Slide 12: Conclusão */
  .thanks-title {
    font-size: 3.2rem !important;
  }

  .slide-heading {
    font-size: 1.95rem !important;
    line-height: 1.2 !important;
  }

  /* Garante cores de fundo de editores, badges e cards em qualquer navegador */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  .cover-code-surface,
  .evo-code-box,
  .flow-visual-box.is-sql,
  .sync-code-box {
    background-color: #1c1c1c !important;
    border: 1px solid #333333 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .sql-code-pre,
  .flow-code-pre {
    color: #f0f0f0 !important;
  }

  .sql-code-pre span,
  .flow-code-pre span {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .surface-card,
  .evo-der-card {
    background-color: #ffffff !important;
    border: 1px solid rgba(25, 39, 71, 0.16) !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .evo-der-header {
    background-color: #192747 !important;
    color: #ffffff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Garante que SVGs e conectores mantenham visibilidade sem cortes */
  svg {
    overflow: visible !important;
  }

  .slide-corner-logos {
    position: absolute !important;
    right: 28px !important;
    bottom: 20px !important;
    z-index: 50 !important;
  }
}
</style>
