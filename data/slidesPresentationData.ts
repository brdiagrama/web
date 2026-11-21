export interface SlideMetadata {
  id: string;
  number: string;
  shortTitle: string;
  sectionLabel: string;
  speakerNote: string;
}

export interface DiagramColumnData {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
}

export interface DiagramTableData {
  id: string;
  name: string;
  subtitle?: string;
  columns: DiagramColumnData[];
}

export interface MethodPipelinePhase {
  number: string;
  title: string;
  description: string;
}

export interface BetaMetricItem {
  value: string;
  label: string;
  detail: string;
  highlight?: boolean;
}

export const SLIDES_METADATA: SlideMetadata[] = [
  {
    id: 'capa',
    number: '01',
    shortTitle: 'Capa',
    sectionLabel: 'Abertura',
    speakerNote:
      'Apresentar o BrDiagrama como ferramenta CASE web desenvolvida na FMP pelos autores Davi Lima, Leonardo Andrade e Lucas Blank, sob orientação da Profa. Daniela Amorim e Prof. Sérgio Schutz.',
  },
  {
    id: 'contexto',
    number: '02',
    shortTitle: 'Contexto e Relevância',
    sectionLabel: '1. Contexto e Relevância',
    speakerNote:
      'Contextualizar a presença maciça dos bancos relacionais em produção corporativa (57,3%) e a 1ª Lei de Lehman: software e dados devem evoluir continuamente para permanecerem úteis.',
  },
  {
    id: 'problema',
    number: '03',
    shortTitle: 'O Problema da Desincronização',
    sectionLabel: '1.1 Problematização',
    speakerNote:
      'Apresentar a desincronização entre o script SQL em evolução contínua e a documentação DER desatualizada, destacando as 3 principais dores: atualização manual dupla, divergência estrutural e retrabalho.',
  },
  {
    id: 'visao',
    number: '04',
    shortTitle: 'A Solução BrDiagrama',
    sectionLabel: '1.2 Solução Proposta',
    speakerNote:
      'Apresentar a solução do BrDiagrama: sincronização bidirecional e em tempo real entre scripts SQL e diagramas DER, atendendo à indústria de engenharia de software e ao ensino de bancos de dados.',
  },
  {
    id: 'objetivo',
    number: '05',
    shortTitle: 'Objetivo Geral',
    sectionLabel: '1.3 Objetivo e Metodologia',
    speakerNote:
      'Apresentar o objetivo geral do artigo e suas dimensões metodológicas: natureza aplicada, abordagem quali-quantitativa e execução client-side web.',
  },
  {
    id: 'metodo',
    number: '06',
    shortTitle: 'Método Proposto',
    sectionLabel: '3. Metodologia de Desenvolvimento',
    speakerNote:
      'Apresentar o método proposto estruturado em 4 etapas concretas de Engenharia de Software: Requisitos e Casos de Uso, Prototipação no Figma, Desenvolvimento do Sistema e Testes e Validação com estudantes.',
  },
  {
    id: 'fundamentacao',
    number: '07',
    shortTitle: 'Fundamentação',
    sectionLabel: '2. Fundamentação Teórica',
    speakerNote:
      'Explicar os conceitos teóricos essenciais: o Modelo Entidade-Relacionamento (nível conceitual e lógico) e a Linguagem SQL DDL (nível físico e estrutural).',
  },
  {
    id: 'engenharia_case',
    number: '08',
    shortTitle: 'Engenharia CASE',
    sectionLabel: '2.1 Engenharia Direta e Reversa',
    speakerNote:
      'Demonstrar os dois fluxos de transformação da ferramenta CASE: Engenharia Direta (DER gerando SQL DDL) e Engenharia Reversa (SQL DDL sendo interpretado para desenhar o DER).',
  },
  {
    id: 'desenvolvimento',
    number: '09',
    shortTitle: 'Desenvolvimento',
    sectionLabel: '4. Ações do Usuário',
    speakerNote:
      'Apresentar o perfil de usuário atendido pelo BrDiagrama e o ciclo de ações práticas: importação e escrita de código SQL DDL, manipulação interativa no canvas visual, exportação em múltiplos formatos e execução PWA sem servidor local.',
  },
  {
    id: 'arquitetura',
    number: '10',
    shortTitle: 'Arquitetura',
    sectionLabel: '4.1 Arquitetura em 3 Camadas',
    speakerNote:
      'Explicar detalhadamente a arquitetura client-side em 3 camadas do BrDiagrama: Apresentação (Nuxt, Monaco, SVG, LocalStorage), Processamento Client-Side (node-sql-parser, AST e Pinia) e Hospedagem em Nuvem (Vercel e PWA).',
  },
  {
    id: 'teste_beta',
    number: '11',
    shortTitle: 'Teste Beta',
    sectionLabel: '4.5 Validação Empírica',
    speakerNote:
      'Apresentar os resultados do Teste Beta com 25 estudantes da 2ª e 3ª fase de ADS: 96% geraram o diagrama completo, 100% aprovaram tipos/chaves/relacionamentos, 92% tabelas/colunas e 96% de satisfação geral, além das melhorias mapeadas.',
  },
  {
    id: 'conclusao',
    number: '12',
    shortTitle: 'Conclusão',
    sectionLabel: '5. Conclusão e Agradecimentos',
    speakerNote:
      'Encerrar apresentando as principais conclusões alcançadas pelo projeto BrDiagrama e fazer os agradecimentos à banca examinadora, orientadores e instituição.',
  },
];

export const ARTICLE_COVER_INFO = {
  title:
    'Desenvolvimento de uma Ferramenta para Apoio à Modelagem de Dados com Sincronização Bidirecional entre Scripts SQL e Diagramas de Entidade e Relacionamento: BrDiagrama',
  institution: 'Faculdade Municipal de Palhoça (FMP)',
  course: 'Análise e Desenvolvimento de Sistemas',
  year: '2026',
  authors: ['Davi Lima', 'Leonardo Andrade', 'Lucas Blank'],
  advisors: ['Daniela Amorim', 'Sérgio Schutz'],
  emails: [
    'davi.lima@aluno.fmpsc.edu.br',
    'leonardo.andrade@aluno.fmpsc.edu.br',
    'lucas.blank@aluno.fmpsc.edu.br',
    'daniela.amorim@fmpsc.edu.br',
  ],
};

export const COVER_TABLES: DiagramTableData[] = [
  {
    id: 'clientes',
    name: 'clientes',
    columns: [
      { name: 'id', type: 'INT', isPk: true },
      { name: 'nome', type: 'VARCHAR(100)' },
    ],
  },
  {
    id: 'pedidos',
    name: 'pedidos',
    columns: [
      { name: 'id', type: 'INT', isPk: true },
      { name: 'total', type: 'DECIMAL(10,2)' },
      { name: 'data', type: 'DATE' },
      { name: 'cliente_id', type: 'INT', isFk: true },
    ],
  },
];

export const PROBLEM_BREAKDOWN = [
  {
    title: 'Atualização manual dupla',
    detail: 'Alterar uma coluna ou chave no banco exige redesenhar o diagrama manualmente.',
  },
  {
    title: 'Divergência estrutural',
    detail: 'Mudanças rápidas em scripts SQL não são replicadas na documentação visual.',
  },
  {
    title: 'Retrabalho na manutenção',
    detail: 'Equipes perdem tempo auditando se o modelo conceitual/lógico ainda reflete o esquema real.',
  },
];

export const METHOD_PIPELINE: MethodPipelinePhase[] = [
  {
    number: '01',
    title: 'Requisitos e Casos de Uso',
    description:
      'Definição das necessidades do sistema e mapeamento das ações do usuário, focando na sincronização em tempo real.',
  },
  {
    number: '02',
    title: 'Prototipação no Figma',
    description:
      'Criação do visual das telas para validar o editor de código à esquerda e o espaço do diagrama à direita.',
  },
  {
    number: '03',
    title: 'Desenvolvimento do Sistema',
    description:
      'Construção do motor que lê o SQL, atualiza o diagrama visual e permite usar o aplicativo mesmo sem internet.',
  },
  {
    number: '04',
    title: 'Testes e Validação',
    description:
      'Verificação técnica do funcionamento e aplicação prática com 25 alunos do curso de ADS da faculdade.',
  },
];

export interface ConceptCardData {
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  items: { label: string; detail: string }[];
}

export const FUNDAMENTACAO_CONCEPTS: ConceptCardData[] = [
  {
    tag: 'Chen (1976) · Heuser (2009)',
    title: 'Modelo Entidade-Relacionamento (DER)',
    subtitle: 'Nível Conceitual e Lógico',
    description:
      'Representação gráfica abstrata das entidades do domínio, seus atributos e as cardinalidades que regem os vínculos entre tabelas.',
    items: [
      { label: 'Entidades e Tabelas', detail: 'Estruturas que representam objetos do mundo real' },
      { label: 'Atributos e Chaves', detail: 'Identificadores únicos (PK) e vínculos externos (FK)' },
      { label: 'Cardinalidades', detail: 'Relações de proporção entre registros (1:1, 1:N e N:N)' },
    ],
  },
  {
    tag: 'Elmasri e Navathe (2015) · ISO/IEC SQL',
    title: 'Linguagem SQL (Subconjunto DDL)',
    subtitle: 'Nível Físico e Estrutural',
    description:
      'Linguagem declarativa padronizada para definir, alterar e estruturar os esquemas de tabelas e regras de integridade relacional.',
    items: [
      { label: 'Definição Estrutural', detail: 'Instruções CREATE TABLE, ALTER TABLE e DROP TABLE' },
      { label: 'Tipos e Restrições', detail: 'Tipagem de colunas (INT, VARCHAR, DATE) e constraints' },
      { label: 'Integridade Referencial', detail: 'Cláusulas REFERENCES e regras de chave estrangeira' },
    ],
  },
];

export const BETA_METRICS: BetaMetricItem[] = [
  {
    value: '100%',
    label: 'Chaves, Tipos e Relações',
    detail: 'Concordância total na representação de PK, FK e tipos de dados.',
    highlight: true,
  },
  {
    value: '96%',
    label: 'Geração Completa e Satisfação',
    detail: '24 de 25 diagramas gerados integralmente e aprovação geral de uso.',
    highlight: true,
  },
  {
    value: '92%',
    label: 'Tabelas, Colunas e Reuso',
    detail: 'Identificação exata da estrutura e intenção de usar em novos projetos.',
  },
];

export const BETA_IMPROVEMENTS = [
  'Salvar múltiplos projetos',
  'Atalho de desfazer ações (Ctrl + Z)',
  'Dicas visuais para erros de sintaxe SQL',
  'Refinamento de organização da interface',
];

export const CONCLUSION_FUTURE = [
  'Ampliar testes com novos perfis (DBAs e times comerciais)',
  'Suporte expandido a comandos DDL complexos e migrações',
  'Novos recursos visuais de sincronização SQL ↔ DER',
];
