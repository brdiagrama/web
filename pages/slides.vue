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
  Database,
  Code2,
  GitCompareArrows,
  Briefcase,
  GraduationCap,
  Check,
  AlertCircle,
  Layers,
  Cpu,
  Globe,
  ClipboardCheck,
  ArrowUpRight,
  RefreshCw,
  FileCode2,
  Image as ImageIcon,
  Smartphone,
  Key,
} from 'lucide-vue-next';
import SlideDiagramCard from '@/components/slides/SlideDiagramCard.vue';
import {
  SLIDES_METADATA,
  ARTICLE_COVER_INFO,
  COVER_SQL_SNIPPET,
  COVER_TABLES,
  PROBLEM_BREAKDOWN,
  JUSTIFICATION_AXES,
  OBJECTIVES_DATA,
  THEORY_TABLES,
  METHODOLOGY_CLASSIFICATION,
  METHOD_STEPS,
  UML_USE_CASES,
  CARDINALITY_DEMOS,
  ARCHITECTURE_LAYERS,
  VALIDATION_PROTOCOL,
  FUTURE_ROADMAP,
  type DiagramTableData,
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

const activeTheoryId = ref('ferramenta_case');
const activeCardinalityId = ref('1:1');

const hasEmailColumn = ref(false);
const isFkRequired = ref(true);
const isTableRenamed = ref(false);
const lastSyncSource = ref<'SQL' | 'DER'>('SQL');

const totalSlides = SLIDES_METADATA.length;

const currentSlide = computed(() => {
  return SLIDES_METADATA[currentSlideIndex.value];
});

const progressPercent = computed(() => {
  return Math.round(((currentSlideIndex.value + 1) / totalSlides) * 100);
});

const activeCardinality = computed(() => {
  const found = CARDINALITY_DEMOS.find((item) => item.id === activeCardinalityId.value);
  return found ?? CARDINALITY_DEMOS[0];
});

const theoryInsights: Record<string, { title: string; summary: string; tags: string[] }> = {
  modelo_relacional: {
    title: 'Organização Relacional e Integridade por Chaves',
    summary:
      'SGBDs estruturam dados em tabelas (tuplas e atributos) com integridade garantida por chaves primárias e estrangeiras (Elmasri; Navathe, 2015; Silberschatz et al., 2020).',
    tags: ['Tabelas', 'Chave Primária (PK)', 'Chave Estrangeira (FK)'],
  },
  mer_e_sql_ddl: {
    title: 'Do Modelo Entidade-Relacionamento ao Código DDL',
    summary:
      'O MER (Chen, 1976) expressa entidades e cardinalidades (1:1, 1:N, N:N), enquanto comandos DDL (CREATE, ALTER, DROP) materializam a estrutura no SGBD (Heuser, 2009; Oracle, 2026).',
    tags: ['MER / DER', 'Cardinalidade', 'SQL DDL'],
  },
  ferramenta_case: {
    title: 'Classificação CASE (Fuggetta, 1993)',
    summary:
      'Situa-se no nível de ferramenta (Tool), unindo as categorias de projeto (geração visual do DER) e engenharia reversa (extração direta do SQL DDL), eliminando desenho manual.',
    tags: ['Nivel Tool', 'Projeto Visual', 'Engenharia Reversa'],
  },
};

const activeTheoryDetail = computed(() => {
  return theoryInsights[activeTheoryId.value] ?? theoryInsights.ferramenta_case;
});

const dialectBadges = [
  { name: 'PostgreSQL', icon: postgresqlIcon },
  { name: 'MySQL', icon: mysqlIcon },
  { name: 'MariaDB', icon: mariadbDarkIcon },
  { name: 'SQLite', icon: sqliteIcon },
  { name: 'SQL Server', icon: sqlserverIcon },
];

const demoTargetTableName = computed(() => {
  return isTableRenamed.value ? 'matriculas' : 'pedidos';
});

const demoSqlCode = computed(() => {
  const emailLine = hasEmailColumn.value ? '\n  email VARCHAR(120) NOT NULL,' : '';
  const fkConstraint = isFkRequired.value ? 'INT NOT NULL' : 'INT NULL';
  return `CREATE TABLE clientes (
  id INT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,${emailLine}
);

CREATE TABLE ${demoTargetTableName.value} (
  id INT PRIMARY KEY,
  cliente_id ${fkConstraint},
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);`;
});

const demoAstSummary = computed(() => {
  const columnsCount = hasEmailColumn.value ? 3 : 2;
  const cardinalityLabel = isFkRequired.value ? '1 : 1..N (Estrito)' : '1 : 0..N (Opcional)';
  return {
    tables: ['clientes', demoTargetTableName.value],
    columnsCount,
    cardinalityLabel,
  };
});

const demoClientsTable = computed<DiagramTableData>(() => {
  const columns = [
    { name: 'id', type: 'INT', isPk: true },
    { name: 'nome', type: 'VARCHAR(100)' },
  ];
  if (hasEmailColumn.value) {
    columns.push({ name: 'email', type: 'VARCHAR(120)' });
  }
  return {
    id: 'demo_clientes',
    name: 'clientes',
    columns,
  };
});

const demoTargetTable = computed<DiagramTableData>(() => {
  return {
    id: 'demo_target',
    name: demoTargetTableName.value,
    columns: [
      { name: 'id', type: 'INT', isPk: true },
      {
        name: 'cliente_id',
        type: isFkRequired.value ? 'INT NOT NULL' : 'INT NULL',
        isFk: true,
      },
    ],
  };
});

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
          duration: 0.42,
          stagger: 0.055,
          ease: 'power2.out',
          clearProps: 'opacity,y,transform',
        }
      );
    }

    const connectorPaths = slideBodyRef.value.querySelectorAll<SVGPathElement>('.draw-connector');
    connectorPaths.forEach((pathEl) => {
      const length = pathEl.getTotalLength();
      gsap.set(pathEl, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(pathEl, {
        strokeDashoffset: 0,
        duration: 0.75,
        delay: 0.15,
        ease: 'power2.inOut',
      });
    });
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

const handleToggleEmailFromSql = () => {
  hasEmailColumn.value = !hasEmailColumn.value;
  lastSyncSource.value = 'SQL';
};

const handleToggleFkFromSql = () => {
  isFkRequired.value = !isFkRequired.value;
  lastSyncSource.value = 'SQL';
};

const handleRenameFromDiagram = () => {
  isTableRenamed.value = !isTableRenamed.value;
  lastSyncSource.value = 'DER';
};

const handleResetSyncDemo = () => {
  hasEmailColumn.value = false;
  isFkRequired.value = true;
  isTableRenamed.value = false;
  lastSyncSource.value = 'SQL';
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
    } else if (event.key === '0') {
      goToSlide(9);
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
      <div ref="slideBodyRef" :key="currentSlide.id" class="slide-container">
        <!-- SLIDE 01: CAPA -->
        <section v-if="currentSlide.id === 'capa'" class="slide-grid slide-cover">
          <div class="cover-editorial">
            <h1 class="cover-title slide-stagger">
              {{ ARTICLE_COVER_INFO.title }}
            </h1>

            <p class="cover-subtitle slide-stagger">
              <strong class="brand-word">BrDiagrama</strong> a ferramenta web que mantém scripts SQL DDL e Diagramas de Entidade-Relacionamento sincronizados em tempo real no navegador.
            </p>

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
              <!-- Bloco SQL Editor oficial do BrDiagrama (BrDiagramaDarkModern) -->
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

              <!-- Garfo de sincronização que sai do SQL e encosta no header das duas tabelas -->
              <div class="cover-sync-fork" aria-hidden="true">
                <svg class="fork-svg" viewBox="0 0 540 84" preserveAspectRatio="none" fill="none">
                  <!-- Ramo esquerdo: sai do SQL com descida harmônica até o header de orientacao -->
                  <path
                    d="M 270 0 L 270 36 Q 270 50 254 50 L 130 50 Q 114 50 114 64 L 114 84"
                    stroke="#192747"
                    stroke-width="1.8"
                    stroke-linecap="round"
                  />
                  <!-- Ramo direito: sai do SQL com descida harmônica até o header de projeto_brdiagrama -->
                  <path
                    d="M 270 0 L 270 36 Q 270 50 286 50 L 410 50 Q 426 50 426 64 L 426 84"
                    stroke="#192747"
                    stroke-width="1.8"
                    stroke-linecap="round"
                  />

                  <!-- Ponto de conexão na base do SQL -->
                  <circle cx="270" cy="2" r="3.5" fill="#192747" />
                  <!-- Pontos de conexão encostando nos headers das tabelas -->
                  <circle cx="114" cy="82" r="3.5" fill="#192747" />
                  <circle cx="426" cy="82" r="3.5" fill="#192747" />

                  <!-- Bolinha animada 1: Sincronização SQL <-> orientacao -->
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

                  <!-- Bolinha animada 2: Sincronização SQL <-> projeto_brdiagrama -->
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

              <!-- Diagrama DER fiel ao BrDiagrama (clientes 1 ──< N pedidos) -->
              <div class="cover-der-stage">
                <div class="cover-card-slot is-left">
                  <SlideDiagramCard :table="COVER_TABLES[0]" compact />
                </div>

                <!-- Linha de relacionamento 1:N fiel ao canvas do BrDiagrama -->
                <div class="cover-der-rel" aria-hidden="true">
                  <svg class="der-rel-svg" viewBox="0 0 84 158" fill="none">
                    <!-- Linha principal de relacionamento saindo de clientes.id (PK) até pedidos.cliente_id (FK) -->
                    <path
                      d="M 0 43 L 34 43 Q 42 43 42 51 L 42 135 Q 42 143 50 143 L 84 143"
                      stroke="#192747"
                      stroke-width="2"
                    />
                    <!-- Fluxo tracejado azul oficial do BrDiagrama (connector-flow) -->
                    <path
                      class="der-flow-line"
                      d="M 0 43 L 34 43 Q 42 43 42 51 L 42 135 Q 42 143 50 143 L 84 143"
                      stroke="#4facfe"
                      stroke-width="2"
                      stroke-dasharray="3 10"
                    />

                    <!-- Marcador 1 (duas barras verticais de obrigatório 1..1) -->
                    <line x1="11" y1="36" x2="11" y2="50" stroke="#192747" stroke-width="2" />
                    <line x1="16" y1="36" x2="16" y2="50" stroke="#192747" stroke-width="2" />
                    <text x="10" y="29" class="der-card-text">1</text>

                    <!-- Marcador N (círculo + pé de galinha Crow's Foot encostando na FK) -->
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

        <!-- SLIDE 02: JUSTIFICATIVA & PROBLEMA -->
        <section v-else-if="currentSlide.id === 'problema'" class="slide-stack">
          <div class="slide-title-group slide-stagger">
            <h2 class="slide-heading">
              Contexto: Evolução Contínua do Software e dos Dados
            </h2>
          </div>

          <div class="problem-layout">
            <div class="problem-left">
              <!-- Estatística 57,3% com visual métrico moderno de mercado -->
              <div class="stat-highlight-card slide-stagger">
                <div class="stat-gauge-wrap" aria-hidden="true">
                  <svg viewBox="0 0 64 64" class="stat-donut-svg">
                    <circle cx="32" cy="32" r="26" class="donut-bg" />
                    <circle cx="32" cy="32" r="26" class="donut-fill" stroke-dasharray="163.36" stroke-dashoffset="69.75" />
                  </svg>
                  <span class="donut-center-tag">SGBD</span>
                </div>

                <div class="stat-content">
                  <span class="stat-number">57,3%</span>
                  <p class="stat-desc">
                    dos bancos em ambientes produtivos corporativos são <strong>Relacionais</strong>.
                  </p>
                  <span class="stat-source">Mordor Intelligence (2026)</span>
                </div>
              </div>

              <!-- Primeira Lei de Meir "Manny" Lehman (Citação editorial com foto histórica) -->
              <div class="lehman-quote-wrap slide-stagger">
                <p class="lehman-quote-text">
                  &ldquo;Um programa deve mudar continuamente para continuar sendo útil.&rdquo;
                </p>
                <div class="lehman-author-row">
                  <img
                    src="~/assets/images/slides/lehman.jpg"
                    alt="Meir Manny Lehman"
                    class="lehman-avatar"
                    width="44"
                    height="44"
                  />
                  <div class="lehman-meta-wrap">
                    <span class="lehman-name">Meir &ldquo;Manny&rdquo; Lehman</span>
                    <span class="lehman-role-desc">Pioneiro da Computação - 1ª Lei da Evolução de Software</span>
                  </div>
                </div>
              </div>

              <!-- Três Dores Centrais (Lista fluida e limpa sem repetição de caixas pesadas) -->
              <div class="problem-flow-list slide-stagger">
                <div v-for="(item, idx) in PROBLEM_BREAKDOWN" :key="item.title" class="problem-flow-item">
                  <div class="flow-num">{{ idx + 1 }}</div>
                  <div class="flow-text">
                    <h3 class="flow-title">{{ item.title }}</h3>
                    <p class="flow-desc">{{ item.detail }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="problem-right slide-stagger">
              <div class="canvas-panel-box">
                <div class="box-header-line">
                  <span class="box-label">Desincronização na evolução manual do banco</span>
                </div>

                <div class="desync-evolution-stage">
                  <!-- Lado 1: Banco SQL Evoluído (Editor Oficial BrDiagrama) -->
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

                  <!-- Conector de Ruptura (Linha tracejada vermelha de desconexão) -->
                  <div class="evo-break-bridge" aria-hidden="true">
                    <svg viewBox="0 0 88 64" class="evo-break-svg" fill="none">
                      <line x1="0" y1="32" x2="28" y2="32" stroke="#EF4444" stroke-width="2" stroke-dasharray="4 4" />
                      <line x1="60" y1="32" x2="88" y2="32" stroke="#EF4444" stroke-width="2" stroke-dasharray="4 4" />
                      <circle cx="44" cy="32" r="13" fill="#FEF2F2" stroke="#EF4444" stroke-width="1.75" />
                      <path d="M 39 27 L 49 37 M 49 27 L 39 37" stroke="#EF4444" stroke-width="2" stroke-linecap="round" />
                    </svg>
                    <span class="connector-caption">Sem atualização</span>
                  </div>

                  <!-- Lado 2: Diagrama DER Legado / Congelado -->
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

                <!-- Solução BrDiagrama (Barra fina e minimalista, sem card pesado) -->
                <div class="resolution-line">
                  <GitCompareArrows :size="15" class="resolution-icon" aria-hidden="true" />
                  <span class="resolution-text">
                    <strong>Solução BrDiagrama:</strong> sincronização automática e bidirecional que acompanha a evolução do esquema sem retrabalho.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- SLIDE 07: UML E REQUISITOS (Agora Slide 03 ativo) -->
        <section v-else-if="currentSlide.id === 'uml'" class="slide-stack">
          <h2 class="slide-heading slide-stagger">
            UML: Diagrama de Casos de Uso 
          </h2>

          <div class="uml-layout">
            <div class="surface-card uml-canvas-card slide-stagger">
              <img
                src="~/assets/images/slides/usecase.jpeg"
                alt="Diagrama de Casos de Uso do BrDiagrama"
                class="uml-image-diagram"
              />
            </div>

            <div class="uml-details-col">
              <div v-for="(uc, idx) in UML_USE_CASES" :key="uc.name" class="surface-card uc-card slide-stagger">
                <div class="uc-head">
                  <div class="uc-icon" aria-hidden="true">
                    <FileCode2 v-if="idx === 0" :size="16" />
                    <GitCompareArrows v-else-if="idx === 1" :size="16" />
                    <ImageIcon v-else-if="idx === 2" :size="16" />
                    <Smartphone v-else :size="16" />
                  </div>
                </div>
                <h3 class="uc-title">{{ uc.name }}</h3>
                <p class="uc-desc">{{ uc.description }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- SLIDE 08: PROTOTIPAÇÃO E UI/UX -->
        <section v-else-if="currentSlide.id === 'prototipacao'" class="slide-stack">
          <h2 class="slide-heading slide-stagger">
            Do wireframe no Figma à interface Live Split-Screen
          </h2>

          <div class="proto-layout">
            <div class="proto-left slide-stagger">
              <div class="surface-card proto-evolution-card">
                <h3 class="proto-subtitle">Evolução da Estrutura de Tela</h3>
                <div class="wireframe-compare">
                  <div class="wire-box">
                    <span class="wire-tag">Figura 2 · Wireframe Figma</span>
                    <div class="wire-mini-layout" aria-hidden="true">
                      <div class="wire-left">SQL</div>
                      <div class="wire-right">DER</div>
                    </div>
                    <p class="wire-caption">Divisão inicial: texto à esquerda e espaço quadriculado à direita.</p>
                  </div>

                  <div class="wire-arrow" aria-hidden="true">
                    <ChevronRight :size="18" />
                  </div>

                  <div class="wire-box is-final">
                    <span class="wire-tag is-teal">Figura 3 · Produto Final</span>
                    <div class="wire-mini-layout is-final" aria-hidden="true">
                      <div class="wire-top-bar">Toolbar + SGBD</div>
                      <div class="wire-panes">
                        <div class="wire-monaco">Monaco</div>
                        <div class="wire-svg-pane">Canvas SVG</div>
                        <div class="wire-assist">Painel</div>
                      </div>
                    </div>
                    <p class="wire-caption">Temas independentes, edição inline, pan/zoom e exportação PNG/SVG/SQL.</p>
                  </div>
                </div>
              </div>

              <div class="surface-card dialects-card">
                <span class="dialects-label">Dialetos SGBD suportados no seletor</span>
                <div class="dialects-row">
                  <div v-for="db in dialectBadges" :key="db.name" class="dialect-pill">
                    <img :src="db.icon" :alt="db.name" width="16" height="16" class="dialect-img" />
                    <span>{{ db.name }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="proto-right slide-stagger">
              <div class="surface-card showcase-video-card">
                <div class="showcase-tabs" role="tablist" aria-label="Demonstrações de cardinalidade">
                  <button
                    v-for="demo in CARDINALITY_DEMOS"
                    :key="demo.id"
                    type="button"
                    role="tab"
                    :aria-selected="activeCardinalityId === demo.id"
                    class="cardinality-tab"
                    :class="{ 'is-active': activeCardinalityId === demo.id }"
                    @click="activeCardinalityId = demo.id"
                  >
                    {{ demo.label }}
                  </button>
                </div>

                <div class="video-viewport">
                  <video
                    :key="activeCardinality.videoSrc"
                    :src="activeCardinality.videoSrc"
                    autoplay
                    loop
                    muted
                    playsinline
                    class="demo-video"
                  ></video>
                </div>

                <div class="showcase-caption">
                  <div class="caption-top">
                    <h3 class="caption-title">{{ activeCardinality.title }}</h3>
                    <span class="mono-chip">{{ activeCardinality.badge }}</span>
                  </div>
                  <p class="caption-desc">{{ activeCardinality.description }}</p>
                  <code class="caption-sql">{{ activeCardinality.sqlSnippet }}</code>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- SLIDE 09: ARQUITETURA E SINCRONIZAÇÃO -->
        <section v-else-if="currentSlide.id === 'arquitetura'" class="slide-stack">
          <h2 class="slide-heading slide-stagger">
            Arquitetura em três camadas e motor bidirecional client-side
          </h2>

          <div class="layers-grid">
            <article
              v-for="(layer, idx) in ARCHITECTURE_LAYERS"
              :key="layer.id"
              class="surface-card layer-card slide-stagger"
            >
              <div class="layer-head">
                <span class="layer-tag">{{ layer.layer }}</span>
                <Layers v-if="idx === 0" :size="16" class="text-slate-600" aria-hidden="true" />
                <Cpu v-else-if="idx === 1" :size="16" class="text-teal-700" aria-hidden="true" />
                <Globe v-else :size="16" class="text-blue-700" aria-hidden="true" />
              </div>
              <h3 class="layer-title">{{ layer.title }}</h3>
              <p class="layer-desc">{{ layer.responsibility }}</p>
              <div class="layer-stack-list">
                <span v-for="tech in layer.stack" :key="tech" class="stack-pill">{{ tech }}</span>
              </div>
            </article>
          </div>

          <div class="surface-card sync-playground slide-stagger">
            <div class="playground-header">
              <div>
                <h3 class="playground-title">Simulação da Sincronização Bidirecional em Tempo Real</h3>
                <p class="playground-sub">
                  Origem da última mutação: <strong>{{ lastSyncSource === 'SQL' ? 'Editor SQL → AST → DER' : 'Canvas DER → Store → SQL' }}</strong>
                </p>
              </div>
              <div class="playground-actions">
                <button type="button" class="action-btn" :class="{ 'is-on': hasEmailColumn }" @click="handleToggleEmailFromSql">
                  {{ hasEmailColumn ? 'Remover coluna email (SQL)' : '+ Coluna email (SQL)' }}
                </button>
                <button type="button" class="action-btn" :class="{ 'is-on': !isFkRequired }" @click="handleToggleFkFromSql">
                  {{ isFkRequired ? 'FK Opcional NULL (SQL)' : 'FK Obrigatória NOT NULL (SQL)' }}
                </button>
                <button type="button" class="action-btn is-navy" @click="handleRenameFromDiagram">
                  Renomear tabela no DER
                </button>
                <button type="button" class="action-reset-btn" aria-label="Resetar simulação" @click="handleResetSyncDemo">
                  <RefreshCw :size="14" />
                </button>
              </div>
            </div>

            <div class="playground-split">
              <div class="playground-sql">
                <span class="pane-badge">Monaco SQL DDL</span>
                <pre class="sql-code-pre is-compact"><code>{{ demoSqlCode }}</code></pre>
              </div>

              <div class="playground-ast">
                <span class="pane-badge is-teal">AST + Pinia Store</span>
                <div class="ast-kv">
                  <span class="ast-k">tables[]</span>
                  <span class="ast-v">{{ demoAstSummary.tables.join(', ') }}</span>
                </div>
                <div class="ast-kv">
                  <span class="ast-k">clientes.cols</span>
                  <span class="ast-v">{{ demoAstSummary.columnsCount }} colunas</span>
                </div>
                <div class="ast-kv">
                  <span class="ast-k">cardinalidade</span>
                  <span class="ast-v is-accent">{{ demoAstSummary.cardinalityLabel }}</span>
                </div>
              </div>

              <div class="playground-der">
                <span class="pane-badge is-navy">Canvas SVG</span>
                <div class="der-pair">
                  <SlideDiagramCard :table="demoClientsTable" compact />
                  <div class="der-rel-indicator">
                    <span class="rel-card-text">{{ isFkRequired ? '1 : 1..N' : '1 : 0..N' }}</span>
                    <svg viewBox="0 0 68 18" class="w-16 h-4" fill="none" aria-hidden="true">
                      <line x1="0" y1="9" x2="68" y2="9" stroke="#192747" stroke-width="1.5" />
                      <line x1="8" y1="3" x2="8" y2="15" stroke="#192747" stroke-width="1.6" />
                      <line v-if="isFkRequired" x1="50" y1="3" x2="50" y2="15" stroke="#192747" stroke-width="1.6" />
                      <circle v-else cx="48" cy="9" r="3.5" fill="#FAF9F9" stroke="#192747" stroke-width="1.5" />
                      <path d="M 68 3 L 56 9 L 68 15" stroke="#192747" stroke-width="1.5" fill="none" />
                    </svg>
                  </div>
                  <SlideDiagramCard :table="demoTargetTable" compact :active="isTableRenamed" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- SLIDE 10: VALIDAÇÃO E CONCLUSÃO -->
        <section v-else-if="currentSlide.id === 'validacao'" class="slide-stack">
          <h2 class="slide-heading slide-stagger">
            Protocolo de validação, conclusão e trabalhos futuros
          </h2>

          <div class="final-layout">
            <div class="surface-card final-validation-card slide-stagger">
              <div class="final-card-head">
                <ClipboardCheck :size="18" class="text-teal-700" aria-hidden="true" />
                <h3>Seção 4.5 — Protocolo de Validação Estruturado</h3>
              </div>
              <p class="final-note">
                Estrutura definida para coleta e registro empírico dos resultados de uso da ferramenta:
              </p>

              <div class="protocol-list">
                <div v-for="item in VALIDATION_PROTOCOL" :key="item.tag" class="protocol-row">
                  <span class="protocol-tag">{{ item.tag }}</span>
                  <div>
                    <h4 class="protocol-title">{{ item.title }}</h4>
                    <p class="protocol-detail">{{ item.detail }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="final-right-col">
              <div class="surface-card final-conclusion-card slide-stagger">
                <h3 class="conclusion-title">Resposta ao Problema de Pesquisa</h3>
                <p class="conclusion-text">
                  O BrDiagrama integra engenharia reversa e engenharia direta em tempo real no navegador, reduzindo o trabalho manual e garantindo que scripts SQL DDL e Diagramas de Entidade-Relacionamento permaneçam consistentes durante toda a evolução do modelo.
                </p>
              </div>

              <div class="surface-card final-roadmap-card slide-stagger">
                <h3 class="roadmap-title">Trabalhos Futuros</h3>
                <ul class="clean-check-list">
                  <li v-for="item in FUTURE_ROADMAP" :key="item">
                    <Check :size="15" class="check-icon" aria-hidden="true" />
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>

              <div class="final-cta-row slide-stagger">
                <span class="closing-authors">
                  Davi Lima · Leonardo Andrade · Lucas Blank · Orientador: Daniela Amorim · FMP 2026
                </span>
                <NuxtLink to="/gerador" class="live-tool-link">
                  <span>Abrir BrDiagrama ao vivo</span>
                  <ArrowUpRight :size="16" />
                </NuxtLink>
              </div>
            </div>
          </div>
        </section>

        <!-- Logos Institucionais no Canto Inferior Direito (Acompanham a transição de cada slide) -->
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
            <h2 class="overview-title">Visão Geral da Apresentação (10 Slides)</h2>
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
  font-family: 'Google Sans Flex', system-ui, -apple-system, sans-serif;
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

.toolbar-context {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
}

.context-section {
  color: var(--slide-text-muted);
  font-weight: 500;
}

.context-separator {
  color: rgba(0, 0, 0, 0.24);
}

.context-title {
  color: var(--slide-navy);
  font-weight: 600;
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
  padding: 32px 56px 72px 56px;
}

.slide-container {
  width: 100%;
  max-width: 1440px;
}

.slide-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.slide-heading {
  font-size: clamp(1.85rem, 2.8vw, 2.6rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.025em;
  color: var(--slide-navy);
  margin: 0;
  max-width: 32ch;
}

.surface-card {
  background-color: var(--slide-surface);
  border: 1px solid var(--slide-border);
  border-radius: 12px;
  padding: 22px;
}

/* SLIDE 01: CAPA */
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

.meta-text {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--slide-navy);
  line-height: 1.4;
}

.meta-subtext {
  margin: 0;
  font-size: 0.875rem;
  color: var(--slide-text-muted);
  line-height: 1.45;
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
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
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

/* Tokens calibrados com o tema oficial BrDiagramaDarkModern do Monaco */
.sql-kw {
  color: #5EEAD4; /* Keyword oficial BrDiagrama */
  font-weight: 600;
}

.sql-type {
  color: #FDBA74; /* dataType oficial BrDiagrama */
}

.sql-ident {
  color: #F0F0F0; /* identifier oficial BrDiagrama */
}

.sql-num {
  color: #FCA5A5; /* number oficial BrDiagrama */
}

.sql-delim {
  color: #9AA0A6; /* delimiter oficial BrDiagrama */
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

/* Logos no canto inferior direito de todas as páginas (animam junto com a troca de slide) */
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
  background-color: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  display: block;
  filter: contrast(1.02);
}

/* SLIDE 02: JUSTIFICATIVA & PROBLEMA */
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

/* Métrica 57,3% com Donut Chart Elegante e Respiro Amplo */
.stat-highlight-card {
  background-color: var(--slide-surface);
  border: 1px solid var(--slide-border);
  border-radius: 12px;
  padding: 22px 24px;
  display: flex;
  align-items: center;
  gap: 22px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
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
  transition: stroke-dashoffset 1s ease;
}

.donut-center-tag {
  position: absolute;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--slide-navy);
  letter-spacing: 0.02em;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
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
  line-height: 1.2;
}

.lehman-role-desc {
  font-size: 0.78rem;
  color: var(--slide-text-muted);
}

/* Lista Fluida de Dores (Linhas limpas conectadas sem peso visual de caixas) */
.problem-flow-list {
  display: flex;
  flex-direction: column;
  gap: 0;
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
  transition: background-color 0.15s ease;
}

.problem-flow-item:first-child {
  border-top: none;
}

.problem-flow-item:hover {
  background-color: #fcfcfd;
}

.flow-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--slide-primary-ink);
  background-color: #edfefc;
  border: none;
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
  min-width: 0;
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

.status-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 9999px;
}

.status-tag.is-error {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.3);
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

.evo-meta-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.evo-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--slide-navy);
}

.evo-version {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.evo-version.is-current {
  background-color: #edfefc;
  color: #0f766e;
}

.evo-version.is-legacy {
  background-color: #f3f4f6;
  color: #6b7280;
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
  background-color: transparent;
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
  font-weight: 600;
}

/* SLIDE 03: JUSTIFICATIVA */
.justification-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.justification-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card-top-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.axis-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.axis-icon.is-navy {
  background-color: #eff6ff;
  color: #192747;
}

.axis-icon.is-teal {
  background-color: #edfefc;
  color: #0f766e;
}

.axis-roles {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--slide-text-muted);
}

.axis-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--slide-navy);
}

.axis-summary {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--slide-text-muted);
}

.clean-check-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.clean-check-list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.9375rem;
  line-height: 1.45;
  color: var(--slide-text);
}

.check-icon {
  color: var(--slide-primary-ink);
  margin-top: 3px;
  flex-shrink: 0;
}

.surface-strip {
  background-color: var(--slide-surface);
  border: 1px solid var(--slide-border);
  border-radius: 12px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.strip-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--slide-navy);
}

.mono-op {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 6px;
  background-color: #f3f4f6;
  color: var(--slide-primary-ink);
}

/* SLIDE 04: OBJETIVOS */
.objectives-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.general-objective-node {
  width: 100%;
  max-width: 780px;
  background-color: var(--slide-surface);
  border: 1px solid rgba(25, 39, 71, 0.22);
  border-radius: 10px;
  overflow: hidden;
}

.node-table-header {
  background-color: var(--slide-navy);
  color: #ffffff;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem;
  font-weight: 600;
}

.node-cardinality {
  background-color: rgba(255, 255, 255, 0.16);
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 0.75rem;
}

.node-cardinality.is-light {
  background-color: #edfefc;
  color: var(--slide-primary-ink);
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
}

.general-objective-text {
  margin: 0;
  padding: 16px 20px;
  font-size: 1rem;
  line-height: 1.55;
  color: var(--slide-text);
  font-weight: 500;
  text-align: center;
}

.tree-branches-svg {
  width: 100%;
}

.pillars-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.pillar-card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pillar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pillar-code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--slide-primary-ink);
}

.pillar-title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--slide-navy);
}

.pillar-list {
  margin: 0;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--slide-text-muted);
}

/* SLIDE 05: FUNDAMENTAÇÃO */
.theory-tables-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.theory-detail-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.theory-detail-left {
  max-width: 68ch;
}

.theory-detail-title {
  margin: 0 0 6px 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--slide-navy);
}

.theory-detail-summary {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--slide-text-muted);
}

.theory-tags {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.mono-chip {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: #edfefc;
  color: var(--slide-primary-ink);
  border: 1px solid rgba(26, 186, 156, 0.35);
  border-radius: 6px;
  padding: 4px 10px;
}

.hint-interactive {
  font-size: 0.75rem;
  color: var(--slide-text-muted);
}

/* SLIDE 06: METODOLOGIA */
.classification-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.classification-cell {
  background-color: var(--slide-surface);
  border: 1px solid var(--slide-border);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.class-label {
  font-size: 0.75rem;
  color: var(--slide-text-muted);
  font-weight: 500;
}

.class-value {
  font-size: 1rem;
  color: var(--slide-navy);
  font-weight: 700;
}

.class-ref {
  font-size: 0.75rem;
  color: var(--slide-primary-ink);
  font-weight: 600;
}

.method-steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.method-step-card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.step-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--slide-primary-ink);
  background-color: #edfefc;
  padding: 2px 8px;
  border-radius: 6px;
}

.step-artifact {
  font-size: 0.75rem;
  color: var(--slide-text-muted);
  font-weight: 500;
}

.step-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--slide-navy);
}

.step-summary {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--slide-text-muted);
}

/* SLIDE 07: UML */
.uml-layout {
  display: grid;
  grid-template-columns: 1.2fr 0.85fr;
  gap: 20px;
  align-items: stretch;
}

.uml-canvas-card {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.uml-svg {
  width: 100%;
  height: auto;
  max-height: 390px;
}

.uml-image-diagram {
  max-width: 100%;
  max-height: 400px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 6px;
}

.uml-details-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.uc-card {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.uc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.uc-icon {
  color: var(--slide-primary-ink);
}

.uc-relation {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6875rem;
  color: var(--slide-text-muted);
}

.uc-title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--slide-navy);
}

.uc-desc {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--slide-text-muted);
}

/* SLIDE 08: PROTOTIPAÇÃO */
.proto-layout {
  display: grid;
  grid-template-columns: 0.95fr 1.05fr;
  gap: 20px;
  align-items: stretch;
}

.proto-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.proto-evolution-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.proto-subtitle {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--slide-navy);
}

.wireframe-compare {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 10px;
  align-items: center;
}

.wire-box {
  background-color: #faf9f9;
  border: 1px solid var(--slide-border);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.wire-box.is-final {
  background-color: #ffffff;
  border-color: rgba(26, 186, 156, 0.45);
}

.wire-tag {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--slide-text-muted);
}

.wire-tag.is-teal {
  color: var(--slide-primary-ink);
}

.wire-mini-layout {
  height: 74px;
  display: grid;
  grid-template-columns: 0.42fr 0.58fr;
  gap: 4px;
}

.wire-mini-layout.is-final {
  display: flex;
  flex-direction: column;
}

.wire-left,
.wire-right {
  background-color: #e5e7eb;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #4b5563;
}

.wire-top-bar {
  height: 16px;
  background-color: #192747;
  color: #ffffff;
  border-radius: 4px;
  font-size: 0.625rem;
  display: flex;
  align-items: center;
  padding: 0 6px;
}

.wire-panes {
  flex: 1;
  display: grid;
  grid-template-columns: 0.34fr 0.44fr 0.22fr;
  gap: 4px;
}

.wire-monaco {
  background-color: #141414;
  color: #e5e7eb;
  border-radius: 4px;
  font-size: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wire-svg-pane {
  background-color: #edfefc;
  border: 1px solid rgba(26, 186, 156, 0.4);
  color: #0f766e;
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wire-assist {
  background-color: #f3f4f6;
  color: #4b5563;
  border-radius: 4px;
  font-size: 0.5625rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wire-caption {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: var(--slide-text-muted);
}

.wire-arrow {
  color: var(--slide-text-muted);
}

.dialects-card {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dialects-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--slide-navy);
}

.dialects-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dialect-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid var(--slide-border);
  background-color: #faf9f9;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--slide-text);
}

.showcase-video-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
}

.showcase-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cardinality-tab {
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid var(--slide-border);
  background-color: #faf9f9;
  color: var(--slide-text-muted);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.15s ease;
}

.cardinality-tab.is-active {
  background-color: var(--slide-navy);
  border-color: var(--slide-navy);
  color: #ffffff;
}

.video-viewport {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--slide-border);
  background-color: #141414;
}

.demo-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.showcase-caption {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.caption-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.caption-title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--slide-navy);
}

.caption-desc {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--slide-text-muted);
}

.caption-sql {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  background-color: #141414;
  color: #1aba9c;
  padding: 6px 10px;
  border-radius: 6px;
}

/* SLIDE 09: ARQUITETURA */
.layers-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.layer-card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.layer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.layer-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--slide-primary-ink);
}

.layer-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--slide-navy);
}

.layer-desc {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--slide-text-muted);
}

.layer-stack-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: auto;
  padding-top: 4px;
}

.stack-pill {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6875rem;
  background-color: #faf9f9;
  border: 1px solid var(--slide-border);
  border-radius: 6px;
  padding: 2px 8px;
  color: var(--slide-text);
}

.sync-playground {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 20px;
}

.playground-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.playground-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--slide-navy);
}

.playground-sub {
  margin: 2px 0 0 0;
  font-size: 0.8125rem;
  color: var(--slide-text-muted);
}

.playground-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.action-btn {
  padding: 6px 11px;
  border-radius: 8px;
  border: 1px solid var(--slide-border);
  background-color: #faf9f9;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--slide-navy);
  transition: all 0.15s ease;
}

.action-btn:hover {
  background-color: #eff6ff;
  border-color: rgba(59, 130, 246, 0.45);
}

.action-btn.is-on {
  background-color: #edfefc;
  border-color: rgba(26, 186, 156, 0.55);
  color: var(--slide-primary-ink);
}

.action-btn.is-navy {
  background-color: var(--slide-navy);
  border-color: var(--slide-navy);
  color: #ffffff;
}

.action-reset-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid var(--slide-border);
  background-color: #ffffff;
  color: var(--slide-text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.action-reset-btn:hover {
  background-color: #f1f3f5;
  color: var(--slide-navy);
}

.playground-split {
  display: grid;
  grid-template-columns: 1.15fr 0.75fr 1.2fr;
  gap: 14px;
  align-items: stretch;
}

.playground-sql,
.playground-ast,
.playground-der {
  border: 1px solid var(--slide-border);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.playground-sql {
  background-color: #141414;
}

.playground-ast,
.playground-der {
  background-color: #faf9f9;
}

.pane-badge {
  align-self: flex-start;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.12);
  color: #e5e7eb;
}

.pane-badge.is-teal {
  background-color: #edfefc;
  color: var(--slide-primary-ink);
}

.pane-badge.is-navy {
  background-color: #eff6ff;
  color: var(--slide-navy);
}

.ast-kv {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  border-radius: 6px;
  background-color: #ffffff;
  border: 1px solid var(--slide-border);
}

.ast-k {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6875rem;
  color: var(--slide-text-muted);
}

.ast-v {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--slide-navy);
}

.ast-v.is-accent {
  color: var(--slide-primary-ink);
}

.der-pair {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.der-pair > :first-child,
.der-pair > :last-child {
  flex: 1;
}

.der-rel-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.rel-card-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--slide-navy);
}

/* SLIDE 10: VALIDAÇÃO & CONCLUSÃO */
.final-layout {
  display: grid;
  grid-template-columns: 0.95fr 1.05fr;
  gap: 20px;
  align-items: stretch;
}

.final-validation-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.final-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.final-card-head h3 {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--slide-navy);
}

.final-note {
  margin: 0;
  font-size: 0.875rem;
  color: var(--slide-text-muted);
  line-height: 1.5;
}

.protocol-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.protocol-row {
  background-color: #faf9f9;
  border: 1px solid var(--slide-border);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.protocol-tag {
  align-self: flex-start;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--slide-primary-ink);
  background-color: #edfefc;
  padding: 2px 8px;
  border-radius: 6px;
}

.protocol-title {
  margin: 2px 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--slide-navy);
}

.protocol-detail {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--slide-text-muted);
}

.final-right-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.final-conclusion-card {
  background-color: #192747;
  color: #ffffff;
  border-color: #192747;
}

.conclusion-title {
  margin: 0 0 8px 0;
  font-size: 1.0625rem;
  font-weight: 700;
  color: #ffffff;
}

.conclusion-text {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.86);
}

.final-roadmap-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.roadmap-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--slide-navy);
}

.final-cta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: auto;
}

.closing-authors {
  font-size: 0.8125rem;
  color: var(--slide-text-muted);
  font-weight: 500;
}

.live-tool-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: 8px;
  background-color: var(--slide-primary);
  color: #0f172a;
  font-size: 0.875rem;
  font-weight: 700;
  text-decoration: none;
  transition: background-color 0.15s ease;
}

.live-tool-link:hover {
  background-color: #169e85;
}

/* DRAWER DE NOTAS */
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

/* MODAL DE VISÃO GERAL */
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

@media (max-width: 1024px) {
  .slides-stage {
    padding: 20px;
  }

  .slide-cover,
  .problem-layout,
  .justification-grid,
  .uml-layout,
  .proto-layout,
  .final-layout,
  .playground-split {
    grid-template-columns: 1fr;
  }

  .pillars-grid,
  .theory-tables-grid,
  .method-steps-grid,
  .layers-grid,
  .classification-grid {
    grid-template-columns: 1fr 1fr;
  }

  .toolbar-progress,
  .tree-branches-svg,
  .theory-connectors-bar {
    display: none;
  }
}

@media (max-width: 640px) {
  .slides-toolbar {
    padding: 0 12px;
  }

  .toolbar-context {
    display: none;
  }

  .pillars-grid,
  .theory-tables-grid,
  .method-steps-grid,
  .layers-grid,
  .classification-grid,
  .cover-meta-grid,
  .cover-cards-pair,
  .desync-diagram,
  .wireframe-compare {
    grid-template-columns: 1fr;
  }

  .theory-detail-panel {
    flex-direction: column;
    align-items: flex-start;
  }

  .theory-tags {
    align-items: flex-start;
  }
}
</style>
