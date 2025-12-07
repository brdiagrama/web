<script setup>
import { ref, onMounted } from "vue";
import { ChevronDown, HelpCircle, Zap, Shield, Code, Download } from "lucide-vue-next";
import AppHeader from "../components/AppHeader.vue";
import AppFooter from "../components/AppFooter.vue";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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
    "(min-width: 769px)": function() {
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
    "(max-width: 768px)": function() {
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
    <AppHeader active-page="faq" />

    <section class="hero-faq pt-32 pb-20 px-6" role="main" aria-labelledby="page-title">
      <div class="max-w-4xl mx-auto text-center">
        <h1 id="page-title" class="text-5xl md:text-6xl font-bold mb-6">
          <span class="text-gradient">Perguntas Frequentes</span>
        </h1>
        <p class="text-xl text-gray-400 leading-relaxed">
          Tire todas as suas dúvidas sobre o BrDiagrama. Respostas rápidas e diretas.
        </p>
      </div>
    </section>

    <section class="faq-content py-20 px-6" aria-label="Perguntas e respostas">
      <div class="max-w-5xl mx-auto">
        <article v-for="(category, catIndex) in faqs" :key="catIndex" class="category-section" :aria-labelledby="`category-${catIndex}`">
          <div class="category-header">
            <div class="category-icon" :style="{ color: category.color }" aria-hidden="true">
              <component :is="category.icon" :size="32" />
            </div>
            <h2 :id="`category-${catIndex}`" class="category-title">{{ category.category }}</h2>
          </div>

          <div class="faq-list" role="list">
            <div
              v-for="(item, qIndex) in category.questions"
              :key="qIndex"
              class="faq-item"
              :class="{ active: openIndex === `${catIndex}-${qIndex}` }"
              role="listitem"
            >
              <button
                class="faq-question"
                @click="toggleFaq(`${catIndex}-${qIndex}`)"
                :aria-expanded="openIndex === `${catIndex}-${qIndex}`"
                :aria-controls="`answer-${catIndex}-${qIndex}`"
                :id="`question-${catIndex}-${qIndex}`"
              >
                <span class="question-text">{{ item.q }}</span>
                <ChevronDown
                  class="chevron"
                  :class="{ rotated: openIndex === `${catIndex}-${qIndex}` }"
                  :size="20"
                  aria-hidden="true"
                />
              </button>
              <div 
                class="faq-answer"
                :id="`answer-${catIndex}-${qIndex}`"
                role="region"
                :aria-labelledby="`question-${catIndex}-${qIndex}`"
              >
                <div>{{ item.a }}</div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="cta-final py-20 px-6 bg-[#243447]/30" aria-labelledby="cta-title">
      <div class="max-w-4xl mx-auto text-center">
        <h2 id="cta-title" class="text-4xl font-bold mb-6">Ainda tem dúvidas?</h2>
        <p class="text-xl text-gray-400 mb-8">
          Entre em contato com a equipe ou experimente a ferramenta agora mesmo!
        </p>
        <div class="flex gap-4 justify-center flex-wrap">
          <a href="/sobre" class="cta-button-outline text-lg" role="button" aria-label="Conhecer a equipe BrDiagrama">Conhecer a Equipe</a>
          <a href="/gerador" class="cta-button text-lg" role="button" aria-label="Começar a usar o BrDiagrama agora">Começar a Usar</a>
        </div>
      </div>
    </section>

    <!-- Rodapé -->
    <AppFooter />
  </div>
</template>

<style scoped>
#faq-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b );
  color: #e2e8f0;
}

.text-gradient {
  background: linear-gradient(to right, #1abc9c, #a5f3fc);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
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
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.category-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: rgba(26, 188, 156, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.category-icon:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 188, 156, 0.2);
}

.category-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #e2e8f0;
  margin: 0;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.faq-item {
  background: #1e293b;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  position: relative;
  
  display: grid;
  grid-template-rows: auto 0fr;
  transition: grid-template-rows 400ms cubic-bezier(0.86, 0, 0.07, 1) 200ms,
              border-color 300ms ease,
              box-shadow 300ms ease,
              background-color 600ms ease;
}

.faq-item.active {
  grid-template-rows: auto 1fr;
  background: #0f172a;
  border-color: rgba(26, 188, 156, 0.4);
  box-shadow: 0 8px 24px rgba(26, 188, 156, 0.2);
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
}

.faq-question:hover {
  background: rgba(255, 255, 255, 0.02);
}

.question-text {
  font-size: 1.125rem;
  font-weight: 600;
  color: #cbd5e1;
  flex: 1;
  padding-right: 1rem;
  transition: color 600ms ease;
}

.faq-item.active .question-text {
  color: #1abc9c;
}

.chevron {
  color: #64748b;
  transition: transform 0.4s cubic-bezier(0.86, 0, 0.07, 1) 0.2s, color 600ms ease;
  flex-shrink: 0;
}

.faq-item:hover .chevron {
  color: #94a3b8;
}

.faq-item.active .chevron {
  color: #1abc9c;
  transform: rotate(180deg);
}

.faq-answer {
  overflow: hidden;
  z-index: 5;
  position: relative;
}

.faq-answer > div {
  padding: 0 1.5rem 1.5rem 1.5rem;
  color: #94a3b8;
  line-height: 1.8;
  font-size: 1rem;
}

.cta-button,
.cta-button-outline {
  font-weight: 700;
  padding: 12px 32px;
  border-radius: 9999px;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.cta-button {
  background-color: #1abc9c;
  color: #0f172a;
  box-shadow: 0 0 20px rgba(26, 188, 156, 0.4);
}

.cta-button-outline {
  background-color: transparent;
  color: #1abc9c;
  border: 2px solid #1abc9c;
}

.cta-button:hover {
  background-color: #31e0bd;
  transform: translateY(-2px);
  box-shadow: 0 0 30px rgba(26, 188, 156, 0.6);
}

.cta-button-outline:hover {
  background-color: rgba(26, 188, 156, 0.1);
  border-color: #31e0bd;
  transform: translateY(-2px);
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

  .faq-answer > div {
    font-size: 0.9375rem;
  }
}
</style>
