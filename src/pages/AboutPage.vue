<script setup>
import { ref, onMounted } from "vue";
import gsap from "gsap";
import {
  Lightbulb,
  Users,
  Palette,
  Zap,
  Code2,
  Cpu,
  Database,
  Rocket,
  Cloud,
  Flag,
  Sparkles,
  Settings,
  Brain,
  Linkedin,
} from "lucide-vue-next";
import AppHeader from "../components/AppHeader.vue";
import AppFooter from "../components/AppFooter.vue";

const isMounted = ref(false);

onMounted(() => {
  setTimeout(() => {
    isMounted.value = true;
  }, 10);
});

const technologies = [
  {
    icon: Code2,
    name: "Vue 3",
    description:
      "Framework progressivo para interfaces reativas e dinâmicas com Composition API.",
    color: "#42b883",
    features: ["Composition API", "Reatividade", "Virtual DOM"],
  },
  {
    icon: Palette,
    name: "Tailwind CSS",
    description:
      "Utility-first CSS framework para criação rápida de interfaces modernas.",
    color: "#06b6d4",
    features: ["Utility Classes", "Responsivo", "Customizável"],
  },
  {
    icon: Cpu,
    name: "Canvas API",
    description:
      "Renderização nativa de diagramas com performance otimizada no navegador.",
    color: "#f59e0b",
    features: ["Alta Performance", "Zoom", "Exportação"],
  },
  {
    icon: Database,
    name: "Custom SQL Parser",
    description:
      "Engine proprietário que analisa e interpreta comandos DDL SQL em tempo real.",
    color: "#8b5cf6",
    features: ["DDL Support", "Validação", "AST Generation"],
  },
  {
    icon: Zap,
    name: "Vite",
    description:
      "Build tool de próxima geração com HMR instantâneo e otimização automática.",
    color: "#a855f7",
    features: ["Hot Reload", "Tree Shaking", "Fast Build"],
  },
  {
    icon: Cloud,
    name: "Vercel",
    description: "Plataforma de deploy serverless com CDN global e SSL automático.",
    color: "#0ea5e9",
    features: ["Edge Network", "Auto Deploy", "Analytics"],
  },
];
</script>

<template>
  <div id="about-page">
    <AppHeader active-page="sobre" />

    <section class="hero-about pt-32 pb-20 px-6" role="main" aria-labelledby="page-title">
      <div class="max-w-4xl mx-auto text-center">
        <h1 id="page-title" class="text-5xl md:text-6xl font-bold mb-6">
          <span class="text-gradient">Sobre o BrDiagrama</span>
        </h1>
        <p class="text-xl text-gray-400 leading-relaxed">
          A ferramenta brasileira que transforma SQL em diagramas visuais de forma
          prática, rápida e gratuita.
        </p>
      </div>
    </section>

    <section class="story-section py-20 px-6" aria-labelledby="story-title">
      <div class="max-w-6xl mx-auto">
        <article class="story-card">
          <div class="story-icon" aria-hidden="true"><Lightbulb :size="64" :stroke-width="1.5" /></div>
          <h2 id="story-title" class="section-title">Como Tudo Começou</h2>
          <div class="story-content">
            <p>
              Tudo começou na faculdade, quando estávamos aprendendo modelagem de dados.
              Era necessário ficar arrastando elementos, criando relacionamentos
              manualmente... Foi aí que surgiu uma ideia brilhante:
              <strong
                >e se existisse um sistema que transformasse SQL diretamente em
                diagrama?</strong
              >
            </p>
            <p>
              Pesquisamos e descobrimos que já existiam algumas soluções no mercado.
              Porém, todas tinham algo em comum:
              <strong>nenhuma usava SQL de verdade, ou quando usava, não tinha a mágica de ser offline e gerado em tempo real!</strong> Algumas exigiam linguagens proprietárias, outras precisavam importar o banco de dados inteiro, e nenhuma oferecia a combinação perfeita de simplicidade, velocidade e privacidade.
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

    <section class="identity-section py-20 px-6 bg-[#1e293b]/30" aria-labelledby="identity-title">
      <div class="max-w-6xl mx-auto">
        <h2 id="identity-title" class="section-title text-center mb-12">Por que BrDiagrama?</h2>
        <div class="identity-grid" role="list">
          <article class="identity-card" role="listitem">
            <div class="identity-icon-circle" aria-hidden="true"><Flag :size="32" /></div>
            <h3>Orgulhosamente Brasileiro</h3>
            <p>
              Inspirados pelo <strong>brModelo</strong>, queríamos um nome que fosse fácil
              de lembrar e pesquisar. Assim como draw.io, bastava digitar
              <code>brdiagrama.com</code> e pronto! Além disso, conseguimos o domínio
              <strong>.com</strong> não precisamos nem de .br!
            </p>
          </article>
          <article class="identity-card" role="listitem">
            <div class="identity-icon-circle" aria-hidden="true"><Palette :size="32" /></div>
            <h3>Identidade Visual Única</h3>
            <p>
              Inicialmente pensamos em azul, mas seria clichê demais. Escolhemos o
              <strong>turquesa</strong> uma cor que lembra tecnologia, inovação e ainda
              carrega o verde do Brasil. O resultado? Uma identidade visual moderna e
              memorável!
            </p>
          </article>
          <article class="identity-card" role="listitem">
            <div class="identity-icon-circle" aria-hidden="true"><Zap :size="32" /></div>
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
        <p class="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
          Três estudantes de ADS (Análise e Desenvolvimento de Sistemas) unidos pela
          paixão por criar soluções práticas e inovadoras.
        </p>

        <div class="team-grid" role="list">
          <div class="team-card">
            <a href="https://www.linkedin.com/in/daviamorimdelima/" target="_blank" class="linkedin-btn" title="LinkedIn">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <div class="team-avatar">
              <img
                src="/team/membro1.jpg"
                alt="Davi Lima"
                class="avatar-image"
                @error="(e) => (e.target.style.display = 'none')"
              />
              <div class="avatar-placeholder"><span>👨‍💻</span></div>
            </div>
            <div class="team-info">
              <h3 class="team-name">Davi Lima</h3>
              <p class="team-role">Desenvolvedor e Analista</p>
            </div>
          </div>
          <div class="team-card">
            <a href="https://www.linkedin.com/in/leonardo-souza-088410224/" target="_blank" class="linkedin-btn" title="LinkedIn">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <div class="team-avatar">
              <img
                src="/team/membro2.jpg"
                alt="Leonardo Andrade"
                class="avatar-image"
                @error="(e) => (e.target.style.display = 'none')"
              />
              <div class="avatar-placeholder"><span>👨‍💻</span></div>
            </div>
            <div class="team-info">
              <h3 class="team-name">Leonardo Andrade</h3>
              <p class="team-role">Desenvolvedor e Analista</p>
            </div>
          </div>
          <div class="team-card">
            <a href="https://www.linkedin.com/in/lucas-da-cruz-blank-9110b1189/" target="_blank" class="linkedin-btn" title="LinkedIn">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <div class="team-avatar">
              <img
                src="/team/membro3.jpg"
                alt="Lucas Blank"
                class="avatar-image"
                @error="(e) => (e.target.style.display = 'none')"
              />
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

    <section class="tech-section py-20 px-6 bg-[#1e293b]/30" aria-labelledby="tech-title">
      <div class="max-w-6xl mx-auto">
        <div class="flex items-center justify-center gap-3 mb-4">
          <Rocket :size="32" class="text-[var(--clr-primary)]" aria-hidden="true" />
          <h2 id="tech-title" class="section-title text-center mb-0">Tecnologias Utilizadas</h2>
        </div>
        <p class="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
          Stack moderna e poderosa para criar a melhor experiência possível
        </p>
        <div class="tech-grid" role="list">
          <div
            v-for="tech in technologies"
            :key="tech.name"
            class="tech-card"
            :style="{ '--tech-color': tech.color }"
          >
            <div class="tech-header">
              <div class="tech-icon-circle"><component :is="tech.icon" :size="28" /></div>
              <h3>{{ tech.name }}</h3>
            </div>
            <p class="tech-description">{{ tech.description }}</p>
            <div class="tech-features">
              <span v-for="feature in tech.features" :key="feature" class="feature-tag">{{
                feature
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="cta-final py-20 px-6" aria-labelledby="cta-title">
      <div class="max-w-4xl mx-auto text-center">
        <h2 id="cta-title" class="text-4xl font-bold mb-6">Pronto para experimentar?</h2>
        <p class="text-xl text-gray-400 mb-8">
          Transforme seu SQL em diagramas visuais em segundos. Gratuito e sem cadastro!
        </p>
        <a href="/gerador" class="cta-button text-lg" role="button" aria-label="Começar a usar o BrDiagrama agora">Começar Agora</a>
      </div>
    </section>

    <!-- Rodapé -->
    <AppFooter />
  </div>
</template>

<style scoped>
#about-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #e2e8f0;
}
.header-scrolled {
  background-color: rgba(15, 23, 42, 0.95);
  animation: border-neutral-flash 0.8s ease-out forwards;
}
@keyframes border-neutral-flash {
  0% {
    border-bottom: 1px solid transparent;
  }
  40% {
    border-bottom: 1px solid rgba(148, 163, 184, 0.4);
  }
  100% {
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
}
.text-gradient {
  background: linear-gradient(to right, #1abc9c, #a5f3fc);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
}
.section-title {
  font-size: 2rem;
  font-weight: 700;
  color: #e2e8f0;
}
.story-card {
  background: #1e293b;
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;
}
.story-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #1abc9c, #a5f3fc);
}
.story-icon {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #1abc9c;
  display: flex;
  justify-content: center;
  filter: drop-shadow(0 0 20px rgba(26, 188, 156, 0.3));
}
.story-content {
  font-size: 1.125rem;
  line-height: 1.8;
  color: #94a3b8;
}
.story-content p {
  margin-bottom: 1.5rem;
}
.story-content p:last-child {
  margin-bottom: 0;
}
.story-content strong {
  color: #e2e8f0;
  font-weight: 600;
}
.story-content .highlight {
  color: #1abc9c;
  font-weight: 600;
}
.story-content code {
  background: rgba(26, 188, 156, 0.1);
  color: #1abc9c;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: "JetBrains Mono", monospace;
  font-size: 0.95em;
}
.identity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}
.identity-card {
  background: #1e293b;
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}
.identity-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(26, 188, 156, 0.15);
  border-color: rgba(26, 188, 156, 0.3);
}
.identity-icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(26, 188, 156, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1abc9c;
  margin-bottom: 1.5rem;
  transition: transform 0.3s ease;
}
.identity-card:hover .identity-icon-circle {
  transform: scale(1.1) rotate(5deg);
}
.identity-card h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #e2e8f0;
}
.identity-card p {
  color: #94a3b8;
  line-height: 1.7;
}
.identity-card strong {
  color: #1abc9c;
}
.identity-card code {
  background: rgba(26, 188, 156, 0.1);
  color: #1abc9c;
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
  background: #1e293b;
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
}
.team-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(26, 188, 156, 0.1);
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
  color: #1abc9c;
  transition: all 0.3s ease;
  z-index: 10;
}
.linkedin-btn:hover {
  background: rgba(26, 188, 156, 0.2);
  border-color: #1abc9c;
  transform: scale(1.1);
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
  border: 4px solid rgba(26, 188, 156, 0.3);
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
}
.avatar-placeholder {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(26, 188, 156, 0.2), rgba(59, 130, 246, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4.5rem;
  border: 4px solid rgba(26, 188, 156, 0.3);
  z-index: 1;
}
.team-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 0.5rem;
}
.team-role {
  color: #1abc9c;
  font-weight: 600;
  margin-bottom: 0;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.collaboration-card {
  margin-top: 4rem;
  background: #1e293b;
  border-radius: 20px;
  padding: 3rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}
.collaboration-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 1.5rem;
  text-align: center;
}
.collaboration-text {
  color: #94a3b8;
  line-height: 1.8;
  font-size: 1.0625rem;
  margin-bottom: 1.5rem;
  text-align: center;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}
.collaboration-text strong {
  color: #1abc9c;
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
  background: rgba(26, 188, 156, 0.1);
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid rgba(26, 188, 156, 0.2);
  transition: all 0.3s ease;
}
.highlight-item:hover {
  background: rgba(26, 188, 156, 0.15);
  border-color: rgba(26, 188, 156, 0.4);
  transform: translateY(-2px);
}
.highlight-icon {
  color: #1abc9c;
  flex-shrink: 0;
}
.highlight-item span:last-child {
  color: #e2e8f0;
  font-weight: 600;
  font-size: 0.9375rem;
}
.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}
.tech-card {
  background: #1e293b;
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}
.tech-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--tech-color);
  opacity: 0;
  transition: opacity 0.3s ease;
}
.tech-card:hover::before {
  opacity: 1;
}
.tech-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(26, 188, 156, 0.1);
  border-color: var(--tech-color);
}
.tech-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}
.tech-icon-circle {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: rgba(26, 188, 156, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.3s ease;
  color: var(--tech-color);
}
.tech-card:hover .tech-icon-circle {
  transform: scale(1.1);
}
.tech-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0;
}
.tech-description {
  color: #94a3b8;
  font-size: 0.9375rem;
  line-height: 1.6;
  margin-bottom: 1rem;
}
.tech-features {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.feature-tag {
  background: rgba(255, 255, 255, 0.05);
  color: #94a3b8;
  padding: 0.25rem 0.625rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}
.tech-card:hover .feature-tag {
  border-color: var(--tech-color);
  color: #e2e8f0;
}
/* Estilos do header e navegação movidos para AppHeader.vue */
.cta-button {
  background-color: #1abc9c;
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
  transition: none;
}

.cta-button:hover::after {
  left: 200%;
  transition: left 0.6s ease-in-out;
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
  .team-grid,
  .tech-grid {
    grid-template-columns: 1fr;
  }
  .tech-header {
    flex-direction: column;
    text-align: center;
  }
}
</style>
