<script setup>
import { ref, onMounted } from "vue";
import { ChevronDown, MessageCircleQuestion, HelpCircle, Mail, FileCode, Code, Shield, Zap, Download } from "lucide-vue-next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Header from "~/components/layout/Header.vue";
import Footer from "~/components/layout/Footer.vue";

useHead({
  title: 'FAQ - Dúvidas Frequentes | BrDiagrama',
  meta: [
    { name: 'description', content: 'Dúvidas frequentes sobre o BrDiagrama. Saiba como exportar, como o parser funciona e nossa política de privacidade (offline first).' }
  ]
})

gsap.registerPlugin(ScrollTrigger);

const isMounted = ref(false);
const openIndex = ref(null);

onMounted(() => {
  setTimeout(() => {
    isMounted.value = true;
  }, 10);

  // Animações GSAP tem que ser leves, mas ainda parecer moderna blz
  const tl = gsap.timeline({ delay: 0.2 });

  tl.from('.hero-faq h1', {
    opacity: 0,
    y: 30,
    duration: 0.8,
    ease: 'power2.out'
  })
    .from('.hero-faq p', {
      opacity: 0,
      y: 20,
      duration: 0.6,
      ease: 'power2.out'
    }, '-=0.4');

  // ScrollTrigger apenas no desktop (matchMedia)
  ScrollTrigger.matchMedia({
    // Desktop: animações com scroll
    "(min-width: 769px)": function () {
      // Categorias aparecem com stagger ao rolar
      gsap.utils.toArray('.category-section').forEach((section, i) => {
        gsap.from(section, {
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none none'
          },
          opacity: 0,
          y: 40,
          duration: 0.7,
          ease: 'power2.out'
        });
      });
    },

    // Mobile: animação simples de entrada (sem scroll trigger)
    "(max-width: 768px)": function () {
      gsap.from('.category-section', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
        delay: 0.8
      });
    }
  });

  // CTA final: fade simples
  gsap.from('.cta-final', {
    scrollTrigger: {
      trigger: '.cta-final',
      start: 'top 90%',
      toggleActions: 'play none none none'
    },
    opacity: 0,
    y: 30,
    duration: 0.7,
    ease: 'power2.out'
  });
});

const toggleFaq = (index) => {
  openIndex.value = openIndex.value === index ? null : index;
};

const faqs = [
  {
    category: "Geral",
    icon: HelpCircle,
    color: "#1abc9c",
    questions: [
      {
        q: "O que é o BrDiagrama?",
        a: "BrDiagrama é uma ferramenta online gratuita que transforma código SQL (DDL) em diagramas ER (Entidade-Relacionamento) de forma automática e instantânea. Basta colar seu código SQL e visualizar o diagrama imediatamente."
      },
      {
        q: "Preciso me cadastrar para usar?",
        a: "Não! O BrDiagrama é 100% gratuito e não requer cadastro. Você pode usar todas as funcionalidades sem criar conta, fazer login ou fornecer dados pessoais."
      },
      {
        q: "O BrDiagrama funciona offline?",
        a: "Sim! Todo o processamento acontece no seu navegador. Após carregar a página, você pode usar o BrDiagrama mesmo sem conexão com a internet. Seus dados SQL nunca saem do seu computador."
      },
      {
        q: "Qual a diferença para outras ferramentas?",
        a: "Existem outras ferramentas que geram diagramas a partir de SQL, mas o BrDiagrama une o melhor de cada uma: geração em tempo real, funcionamento offline, totalmente gratuito e principalmente detecção automática de cardinalidade (1:1, 1:N, N:N) com base nas constraints SQL. Tudo isso sem instalação ou configuração!"
      }
    ]
  },
  {
    category: "Funcionalidades",
    icon: Zap,
    color: "#a855f7",
    questions: [
      {
        q: "Quais tipos de relacionamento são suportados?",
        a: "O BrDiagrama detecta automaticamente: 1:1 (um-para-um), 1:N (um-para-muitos), N:N (muitos-para-muitos) e Herança (especialização). O sistema analisa constraints como UNIQUE, NOT NULL e chaves compostas para determinar o tipo correto."
      },
      {
        q: "Como funciona a detecção de herança?",
        a: "Quando uma tabela possui uma Primary Key (PK) que também é Foreign Key (FK) apontando para outra tabela, o BrDiagrama identifica automaticamente a estrutura de herança e desenha a relação \"Pai-Filho\" no diagrama."
      },
      {
        q: "Posso exportar o diagrama?",
        a: "Sim! Você pode exportar o diagrama em formato PNG de alta qualidade, ideal para documentação, apresentações e trabalhos acadêmicos. A exportação preserva toda a qualidade visual do diagrama."
      },
      {
        q: "O diagrama é interativo?",
        a: "Sim! Você pode arrastar tabelas para reorganizar o layout, aplicar zoom (scroll do mouse ou pinch no touch), e mover a visualização para explorar diagramas grandes. Todas as alterações são temporárias e não afetam seu SQL."
      }
    ]
  },
  {
    category: "SQL e Compatibilidade",
    icon: Code,
    color: "#06b6d4",
    questions: [
      {
        q: "Quais comandos SQL são suportados?",
        a: "Atualmente o BrDiagrama suporta CREATE TABLE com PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL e tipos de dados comuns. Comandos como ALTER TABLE e DROP TABLE ainda não são suportados, mas estão no roadmap! Comandos DML (INSERT, SELECT, UPDATE, DELETE) são ignorados pelo parser."
      },
      {
        q: "Funciona com qualquer banco de dados?",
        a: "Atualmente o BrDiagrama é otimizado para sintaxe MySQL, que serve como base para o parser. Sintaxes específicas de outros bancos de dados (PostgreSQL, SQL Server, Oracle) podem não funcionar perfeitamente, mas estamos trabalhando para melhorar a compatibilidade no futuro!"
      },
      {
        q: "E se meu SQL tiver erros de sintaxe?",
        a: "O sistema possui validação inteligente e mostra mensagens de erro claras apontando o problema. Em muitos casos, o BrDiagrama consegue interpretar SQL com pequenos erros e ainda gerar o diagrama parcial."
      },
      {
        q: "Posso usar comentários no SQL?",
        a: "Sim! Comentários de linha (--) e de bloco (/* */) são totalmente suportados e ignorados durante o parsing. Isso permite documentar seu SQL sem afetar a geração do diagrama."
      }
    ]
  },
  {
    category: "Segurança e Privacidade",
    icon: Shield,
    color: "#10b981",
    questions: [
      {
        q: "Meus dados SQL são enviados para algum servidor?",
        a: "Não! Todo o processamento acontece localmente no seu navegador usando JavaScript. Seu código SQL nunca é enviado para servidores externos, garantindo total privacidade e segurança dos seus dados."
      },
      {
        q: "O BrDiagrama armazena meu SQL em algum lugar?",
        a: "Sim, mas apenas localmente no seu navegador! Utilizamos localStorage para salvar automaticamente seu código SQL, permitindo que você retome o trabalho mesmo após fechar a aba ou atualizar a página. Os dados ficam salvos apenas no seu dispositivo e nunca são enviados para servidores externos. Para limpar, basta apagar o conteúdo do editor ou limpar o histórico/cache do navegador."
      },
      {
        q: "Posso usar com dados sensíveis?",
        a: "Sim! Como todo processamento é local, você pode usar o BrDiagrama com confiança mesmo para esquemas de bancos de dados corporativos ou acadêmicos que contenham informações sensíveis."
      }
    ]
  },
  {
    category: "Extra e Melhorias",
    icon: Download,
    color: "#f59e0b",
    questions: [
      {
        q: "O BrDiagrama é open source?",
        a: "Sim! Nosso repositório é público e você pode ficar à vontade para explorar e entender nossa arquitetura. Desenvolvemos este projeto como trabalho acadêmico na Faculdade Municipal de Palhoça (FMP) durante o terceiro semestre, com apenas 1 ano de experiência em programação. Embora reconheçamos que não seguimos todas as melhores práticas, estamos orgulhosos do resultado!"
      },
      {
        q: "Usaram IA para desenvolver o projeto?",
        a: "Sim! A IA foi nosso principal pincel, junto com nossa criatividade e conhecimentos técnicos. Utilizamos Claude, ChatGPT e Gemini como ferramentas auxiliares, combinando com experiência de mercado, pesquisas em sites especializados, e todo o conteúdo aprendido na faculdade. A IA não substitui conhecimento, mas potencializa a produtividade!"
      },
      {
        q: "Haverá novas funcionalidades?",
        a: "Sim! Planejamos adicionar suporte para outros bancos de dados (PostgreSQL, SQL Server, Oracle), alinhamento automático de tabelas no diagrama, e suporte completo ao DDL incluindo ALTER TABLE e DROP TABLE. Queremos tornar o BrDiagrama cada vez mais robusto!"
      },
      {
        q: "Funciona em dispositivos móveis?",
        a: "Sim! O BrDiagrama é responsivo e funciona em smartphones e tablets. A interface se adapta automaticamente ao tamanho da tela, e você pode usar gestos touch para zoom e navegação."
      }
    ]
  }
];
</script>

<template>
  <div id="faq-page">
    <Header active-page="faq" />

    <section class="hero-faq pt-32 pb-20 px-6" role="main" aria-labelledby="page-title">
      <div class="max-w-4xl mx-auto text-center">
        <h1 id="page-title" class="text-5xl md:text-6xl font-bold mb-6">
          <span class="text-primary-title">Perguntas Frequentes</span>
        </h1>
        <p class="hero-desc text-xl leading-relaxed">
          Tire todas as suas dúvidas sobre o BrDiagrama. Respostas rápidas e diretas.
        </p>
      </div>
    </section>

    <section class="faq-content py-20 px-6" aria-label="Perguntas e respostas">
      <div class="max-w-5xl mx-auto">
        <article v-for="(category, catIndex) in faqs" :key="catIndex" class="category-section"
          :aria-labelledby="`category-${catIndex}`">
          <div class="category-header">
            <div class="category-icon" aria-hidden="true">
              <component :is="category.icon" :size="24" />
            </div>
            <h2 :id="`category-${catIndex}`" class="category-title">{{ category.category }}</h2>
          </div>

          <div class="faq-list" role="list">
            <div v-for="(item, qIndex) in category.questions" :key="qIndex" class="faq-item"
              :class="{ active: openIndex === `${catIndex}-${qIndex}` }" role="listitem">
              <button class="faq-question" @click="toggleFaq(`${catIndex}-${qIndex}`)"
                :aria-expanded="openIndex === `${catIndex}-${qIndex}`" :aria-controls="`answer-${catIndex}-${qIndex}`"
                :id="`question-${catIndex}-${qIndex}`">
                <span class="question-text">{{ item.q }}</span>
                <ChevronDown class="chevron" :class="{ rotated: openIndex === `${catIndex}-${qIndex}` }" :size="20"
                  aria-hidden="true" />
              </button>
              <div class="faq-answer" :id="`answer-${catIndex}-${qIndex}`" role="region"
                :aria-labelledby="`question-${catIndex}-${qIndex}`">
                <div>{{ item.a }}</div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="cta-final py-20 px-6" aria-labelledby="cta-title">
      <div class="max-w-4xl mx-auto text-center">
        <h2 id="cta-title" class="text-4xl font-bold mb-6">Ainda tem dúvidas?</h2>
        <p class="text-xl mb-8">
          Entre em contato com a equipe ou experimente a ferramenta agora mesmo!
        </p>
        <div class="flex gap-4 justify-center flex-wrap">
          <v-btn
            to="/sobre"
            variant="outlined"
            size="large"
            rounded="pill"
            elevation="0"
            class="rounded-full px-8 text-base font-semibold"
            aria-label="Conhecer a equipe BrDiagrama"
          >
            Conhecer a Equipe
          </v-btn>
          <v-btn
            to="/gerador"
            color="primary"
            size="large"
            rounded="pill"
            elevation="0"
            class="rounded-full px-8 text-base font-semibold"
            aria-label="Começar a usar o BrDiagrama agora"
          >
            Começar a Usar
          </v-btn>
        </div>
      </div>
    </section>

    <!-- Rodapé -->
    <Footer />
  </div>
</template>

<style scoped>
#faq-page {
  min-height: 100vh;
  background-color: var(--clr-bg);
  color: var(--clr-text);
}

.hero-desc {
  color: var(--clr-text-muted);
}

.text-primary-title {
  color: var(--clr-primary);
  font-weight: 800;
}

.category-section {
  margin-bottom: 4rem;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--clr-border);
}

.category-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(26, 186, 156, 0.1);
  color: var(--clr-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--clr-text);
  margin: 0;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.faq-item {
  background: var(--clr-bg-surface);
  border-radius: 16px;
  border: none;
  overflow: hidden;
  position: relative;

  display: grid;
  grid-template-rows: auto 0fr;
  transition: grid-template-rows 300ms cubic-bezier(0.4, 0, 0.2, 1),
    background-color 200ms ease;
}

.faq-item.active {
  grid-template-rows: auto 1fr;
  background: var(--clr-bg-surface);
  border: none;
}

.faq-question {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  z-index: 5;
  position: relative;
  transition: background-color 0.15s ease;
}

.faq-question:hover {
  background: var(--clr-hover);
}

.question-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--clr-text);
  flex: 1;
  padding-right: 1rem;
  transition: color 200ms ease;
}

.faq-item.active .question-text {
  color: var(--clr-primary);
}

.chevron {
  color: var(--clr-text-muted);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), color 200ms ease;
  flex-shrink: 0;
}

.faq-item.active .chevron {
  color: var(--clr-primary);
  transform: rotate(180deg);
}

.faq-answer {
  overflow: hidden;
  z-index: 5;
  position: relative;
}

.faq-answer>div {
  padding: 0 1.5rem 1.5rem 1.5rem;
  color: var(--clr-text-muted);
  line-height: 1.8;
  font-size: 1rem;
}

.cta-final {
  background-color: var(--clr-bg);
  border-top: 1px solid var(--clr-border);
}

.cta-final h2 {
  color: var(--clr-text);
}

.cta-final p {
  color: var(--clr-text-muted);
}

@media (max-width: 768px) {

  .category-header {
    flex-direction: column;
    text-align: center;
  }

  .category-title {
    font-size: 1.5rem;
  }

  .question-text {
    font-size: 1rem;
  }

  .faq-answer>div {
    font-size: 0.9375rem;
  }
}
</style>
