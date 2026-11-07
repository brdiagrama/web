<script setup>
import { ref, onMounted } from "vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Header from "~/components/layout/Header.vue";
import Footer from "~/components/layout/Footer.vue";
import {
  Lightbulb,
  Users,
  Palette,
  Zap,
  Flag,
  Sparkles,
  Settings,
  Brain,
} from "lucide-vue-next";

useHead({
  title: 'Sobre o BrDiagrama - História e Equipe | Ferramenta Brasileira de Diagramas ER',
  meta: [
    { name: 'description', content: 'Conheça a história do BrDiagrama: 3 estudantes de ADS da FMP criaram a ferramenta brasileira que transforma SQL em diagramas ER de forma prática, rápida e gratuita.' }
  ]
})

gsap.registerPlugin(ScrollTrigger);

const isMounted = ref(false);

onMounted(() => {
  // Aguarda renderização completa antes de iniciar animações
  setTimeout(() => {
    isMounted.value = true;
  }, 10);

  // Animações GSAP tem que ser leves, mas ainda parecer moderna blz
  const tl = gsap.timeline({ delay: 0.2 });

  // Hero: fade + slide suave
  tl.from('.hero-about h1', {
    opacity: 0,
    y: 30,
    duration: 0.8,
    ease: 'power2.out'
  })
    .from('.hero-about p', {
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: 'power2.out'
    }, '-=0.4');

  // ScrollTrigger responsivo
  ScrollTrigger.matchMedia({
    // Desktop: animações com scroll
    "(min-width: 769px)": function () {
      // Story card
      gsap.from('.story-card', {
        scrollTrigger: {
          trigger: '.story-card',
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 50,
        duration: 0.8,
        ease: 'power2.out',
        clearProps: 'opacity,y,transform'
      });

      // Identity cards com stagger
      gsap.from('.identity-card', {
        scrollTrigger: {
          trigger: '.identity-grid',
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 40,
        stagger: 0.15,
        duration: 0.7,
        ease: 'power2.out',
        clearProps: 'opacity,y,transform'
      });

      // Team cards com stagger
      gsap.from('.team-card', {
        scrollTrigger: {
          trigger: '.team-grid',
          start: 'top 80%',
          toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 40,
        stagger: 0.2,
        duration: 0.7,
        ease: 'power2.out',
        clearProps: 'opacity,y,transform'
      });

      // Collaboration card
      gsap.from('.collaboration-card', {
        scrollTrigger: {
          trigger: '.collaboration-card',
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: 'power2.out',
        clearProps: 'opacity,y,transform'
      });

      // CTA final
      gsap.from('.cta-final', {
        scrollTrigger: {
          trigger: '.cta-final',
          start: 'top 90%',
          toggleActions: 'play none none reverse'
        },
        opacity: 0,
        y: 30,
        duration: 0.7,
        ease: 'power2.out',
        clearProps: 'opacity,y,transform'
      });
    },

    // Mobile: animações simples sem scroll trigger
    "(max-width: 768px)": function () {
      // Animações sequenciais leves no mobile
      const mobileTl = gsap.timeline({ delay: 0.8 });

      mobileTl
        .from('.story-card', {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: 'power2.out'
        })
        .from('.identity-card', {
          opacity: 0,
          y: 20,
          stagger: 0.1,
          duration: 0.5,
          ease: 'power2.out'
        }, '-=0.2')
        .from('.team-card', {
          opacity: 0,
          y: 20,
          stagger: 0.1,
          duration: 0.5,
          ease: 'power2.out'
        }, '-=0.2');
    }
  });
});
</script>

<template>
  <div id="about-page">
    <Header active-page="sobre" />

    <section class="hero-about pt-32 pb-20 px-6" role="main" aria-labelledby="page-title">
      <div class="max-w-4xl mx-auto text-center">
        <h1 id="page-title" class="text-5xl md:text-6xl font-bold mb-6">
          <span class="text-primary-title">Sobre o BrDiagrama</span>
        </h1>
        <p class="hero-desc text-xl leading-relaxed">
          A ferramenta brasileira que transforma SQL em diagramas visuais de forma
          prática, rápida e gratuita.
        </p>
      </div>
    </section>

    <section class="story-section py-20 px-6" aria-labelledby="story-title">
      <div class="max-w-6xl mx-auto">
        <article class="story-card">
          <div class="story-icon" aria-hidden="true">
            <Lightbulb :size="64" :stroke-width="1.5" />
          </div>
          <h2 id="story-title" class="section-title">Como Tudo Começou</h2>
          <div class="story-content">
            <p>
              Tudo começou na faculdade, quando estávamos aprendendo modelagem de dados.
              Era necessário ficar arrastando elementos, criando relacionamentos
              manualmente... Foi aí que surgiu uma ideia brilhante:
              <strong>e se existisse um sistema que transformasse SQL diretamente em
                diagrama?</strong>
            </p>
            <p>
              Pesquisamos e descobrimos que já existiam algumas soluções no mercado.
              Porém, todas tinham algo em comum:
              <strong>nenhuma usava SQL de verdade, ou quando usava, não tinha a mágica de ser offline e gerado em tempo
                real!</strong> Algumas exigiam linguagens proprietárias, outras precisavam importar o banco de dados
              inteiro, e nenhuma oferecia a combinação perfeita de simplicidade, velocidade e privacidade.
            </p>
            <p>
              Foi aí que identificamos nossa <strong>oportunidade de inovação</strong>:
              criar uma ferramenta que seja
              <span class="highlight">prática, rápida, offline e 100% gratuita</span>
              permitindo que você cole seu código SQL e visualize o diagrama
              instantaneamente!
            </p>
          </div>
        </article>
      </div>
    </section>

    <section class="identity-section py-20 px-6" aria-labelledby="identity-title">
      <div class="max-w-6xl mx-auto">
        <h2 id="identity-title" class="section-title text-center mb-12">Por que BrDiagrama?</h2>
        <div class="identity-grid" role="list">
          <article class="identity-card" role="listitem">
            <div class="identity-icon-circle" aria-hidden="true">
              <Flag :size="32" />
            </div>
            <h3>Orgulhosamente Brasileiro</h3>
            <p>
              Inspirados pelo <strong>brModelo</strong>, queríamos um nome que fosse fácil
              de lembrar e pesquisar. Assim como draw.io, bastava digitar
              <code>brdiagrama.com</code> e pronto! Além disso, conseguimos o domínio
              <strong>.com</strong> não precisamos nem de .br!
            </p>
          </article>
          <article class="identity-card" role="listitem">
            <div class="identity-icon-circle" aria-hidden="true">
              <Palette :size="32" />
            </div>
            <h3>Identidade Visual Única</h3>
            <p>
              Inicialmente pensamos em azul, mas seria clichê demais. Escolhemos o
              <strong>turquesa</strong> uma cor que lembra tecnologia, inovação e ainda
              carrega o verde do Brasil. O resultado? Uma identidade visual moderna e
              memorável!
            </p>
          </article>
          <article class="identity-card" role="listitem">
            <div class="identity-icon-circle" aria-hidden="true">
              <Zap :size="32" />
            </div>
            <h3>Foco em Agilidade</h3>
            <p>
              Nosso diferencial está na <strong>praticidade</strong>: sem cadastros, sem
              instalação, sem complicação. Cole seu SQL, visualize o diagrama, exporte e
              pronto. Simples assim!
            </p>
          </article>
        </div>
      </div>
    </section>

    <section class="team-section py-20 px-6" aria-labelledby="team-title">
      <div class="max-w-6xl mx-auto">
        <div class="flex items-center justify-center gap-3 mb-4">
          <Users :size="32" class="text-[var(--clr-primary)]" aria-hidden="true" />
          <h2 id="team-title" class="section-title text-center mb-0">Equipe de Desenvolvimento</h2>
        </div>
        <p class="section-desc text-center mb-12 max-w-2xl mx-auto">
          Três estudantes de ADS (Análise e Desenvolvimento de Sistemas) unidos pela
          paixão por criar soluções práticas e inovadoras.
        </p>

        <div class="team-grid" role="list">
          <div class="team-card">
            <a href="https://www.linkedin.com/in/daviamorimdelima/" target="_blank" class="linkedin-btn"
              title="LinkedIn">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <div class="team-avatar">
              <img src="/team/membro1.jpg" alt="Davi Lima" class="avatar-image"
                @error="(e) => (e.target.style.display = 'none')" />
              <div class="avatar-placeholder"><span>👨‍💻</span></div>
            </div>
            <div class="team-info">
              <h3 class="team-name">Davi Lima</h3>
              <p class="team-role">Desenvolvedor e Analista</p>
            </div>
          </div>
          <div class="team-card">
            <a href="https://www.linkedin.com/in/leonardo-souza-088410224/" target="_blank" class="linkedin-btn"
              title="LinkedIn">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <div class="team-avatar">
              <img src="/team/membro2.jpg" alt="Leonardo Andrade" class="avatar-image"
                @error="(e) => (e.target.style.display = 'none')" />
              <div class="avatar-placeholder"><span>👨‍💻</span></div>
            </div>
            <div class="team-info">
              <h3 class="team-name">Leonardo Andrade</h3>
              <p class="team-role">Desenvolvedor e Analista</p>
            </div>
          </div>
          <div class="team-card">
            <a href="https://www.linkedin.com/in/lucas-da-cruz-blank-9110b1189/" target="_blank" class="linkedin-btn"
              title="LinkedIn">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <div class="team-avatar">
              <img src="/team/membro3.jpg" alt="Lucas Blank" class="avatar-image"
                @error="(e) => (e.target.style.display = 'none')" />
              <div class="avatar-placeholder"><span>👨‍💻</span></div>
            </div>
            <div class="team-info">
              <h3 class="team-name">Lucas Blank</h3>
              <p class="team-role">Desenvolvedor e Analista</p>
            </div>
          </div>
        </div>

        <!-- Card de Colaboração -->
        <article class="collaboration-card">
          <h3 class="collaboration-title">Desenvolvimento Colaborativo</h3>
          <p class="collaboration-text">
            Trabalhamos juntos em todas as etapas do projeto, desde o planejamento da
            arquitetura até a implementação final. Cada decisão, seja sobre
            <strong>UX/UI</strong>, <strong>estrutura de dados</strong>,
            <strong>escolha de linguagem</strong> ou
            <strong>otimização de performance</strong>, foi pensada e discutida em equipe.
          </p>
          <p class="collaboration-text">
            Acreditamos que o melhor software nasce da colaboração genuína, onde todos
            contribuem com ideias e compartilham o aprendizado. Não dividimos tarefas por
            "áreas", dividimos responsabilidades por
            <strong>funcionalidades completas</strong>, garantindo que todos tenham visão
            do sistema como um todo.
          </p>
          <div class="collaboration-highlights" role="list">
            <div class="highlight-item" role="listitem">
              <Sparkles :size="24" class="highlight-icon" aria-hidden="true" />
              <span>Design de Interfaces</span>
            </div>
            <div class="highlight-item" role="listitem">
              <Settings :size="24" class="highlight-icon" aria-hidden="true" />
              <span>Arquitetura do Sistema</span>
            </div>
            <div class="highlight-item" role="listitem">
              <Brain :size="24" class="highlight-icon" aria-hidden="true" />
              <span>Algoritmos e Parser SQL</span>
            </div>
            <div class="highlight-item" role="listitem">
              <Zap :size="24" class="highlight-icon" aria-hidden="true" />
              <span>Performance e UX</span>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="cta-final py-20 px-6" aria-labelledby="cta-title">
      <div class="max-w-4xl mx-auto text-center">
        <h2 id="cta-title" class="text-4xl font-bold mb-6">Pronto para experimentar?</h2>
        <p class="text-xl mb-8">
          Transforme seu SQL em diagramas visuais em segundos. Gratuito e sem cadastro!
        </p>
        <v-btn
          to="/gerador"
          color="primary"
          rounded="pill"
          size="large"
          elevation="0"
          class="font-semibold text-none px-8 text-base"
          aria-label="Começar a usar o BrDiagrama agora"
        >
          Começar Agora
        </v-btn>
      </div>
    </section>

    <!-- Rodapé -->
    <Footer />
  </div>
</template>

<style scoped>
#about-page {
  min-height: 100vh;
  background-color: var(--clr-bg);
  color: var(--clr-text);
}

.hero-desc,
.section-desc {
  color: var(--clr-text-muted);
}

.text-primary-title {
  color: var(--clr-primary);
  font-weight: 800;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--clr-text);
}

.story-card {
  background: var(--clr-bg-surface);
  border-radius: 24px;
  padding: 3rem;
  border: none;
  position: relative;
  overflow: hidden;
}

.story-icon {
  text-align: center;
  margin-bottom: 1.5rem;
  color: var(--clr-primary);
  display: flex;
  justify-content: center;
}

.story-content {
  font-size: 1.125rem;
  line-height: 1.8;
  color: var(--clr-text-muted);
}

.story-content p {
  margin-bottom: 1.5rem;
}

.story-content p:last-child {
  margin-bottom: 0;
}

.story-content strong {
  color: var(--clr-text);
  font-weight: 600;
}

.story-content .highlight {
  color: var(--clr-primary);
  font-weight: 600;
}

.story-content code {
  background: rgba(26, 188, 156, 0.1);
  color: var(--clr-primary);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.95em;
}

.identity-section {
  background-color: transparent;
}

.identity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.identity-card {
  background: var(--clr-bg-surface);
  border-radius: 16px;
  padding: 2rem;
  border: none;
  transition: background-color 0.2s ease;
}

.identity-card:hover {
  background-color: var(--clr-hover);
}

.identity-icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(26, 188, 156, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--clr-primary);
  margin-bottom: 1.5rem;
}

.identity-card h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--clr-text);
}

.identity-card p {
  color: var(--clr-text-muted);
  line-height: 1.7;
}

.identity-card strong {
  color: var(--clr-text);
}

.identity-card code {
  background: rgba(26, 188, 156, 0.1);
  color: var(--clr-primary);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.95em;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.team-card {
  background: var(--clr-bg-surface);
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  border: none;
  transition: background-color 0.2s ease;
  position: relative;
}

.team-card:hover {
  background-color: var(--clr-hover);
}

.linkedin-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(26, 188, 156, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--clr-primary);
  transition: background-color 0.2s ease;
  z-index: 10;
}

.linkedin-btn:hover {
  background: rgba(26, 188, 156, 0.2);
}

.team-avatar {
  margin-bottom: 1.5rem;
  position: relative;
  width: 140px;
  height: 140px;
  margin-left: auto;
  margin-right: auto;
}

.avatar-image {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--clr-primary);
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
}

.avatar-placeholder {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: var(--clr-bg-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4.5rem;
  border: none;
  z-index: 1;
}

.team-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--clr-text);
  margin-bottom: 0.5rem;
}

.team-role {
  color: var(--clr-primary);
  font-weight: 600;
  margin-bottom: 0;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.collaboration-card {
  margin-top: 4rem;
  background: var(--clr-bg-surface);
  border-radius: 20px;
  padding: 3rem;
  border: none;
}

.collaboration-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--clr-text);
  margin-bottom: 1.5rem;
  text-align: center;
}

.collaboration-text {
  color: var(--clr-text-muted);
  line-height: 1.8;
  font-size: 1.0625rem;
  margin-bottom: 1.5rem;
  text-align: center;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

.collaboration-text strong {
  color: var(--clr-text);
  font-weight: 600;
}

.collaboration-highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.highlight-item {
  background: var(--clr-hover);
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: none;
  transition: opacity 0.2s ease;
}

.highlight-icon {
  color: var(--clr-primary);
  flex-shrink: 0;
}

.highlight-item span:last-child {
  color: var(--clr-text);
  font-weight: 600;
  font-size: 0.9375rem;
}

.cta-final h2 {
  color: var(--clr-text);
}

.cta-final p {
  color: var(--clr-text-muted);
}

@media (max-width: 768px) {
  .section-title {
    font-size: 1.75rem;
  }

  .story-card {
    padding: 2rem;
  }

  .story-content {
    font-size: 1rem;
  }

  .identity-grid,
  .team-grid {
    grid-template-columns: 1fr;
  }
}
</style>
