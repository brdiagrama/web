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

export interface CardinalityDemoItem {
  id: string;
  label: string;
  badge: string;
  title: string;
  description: string;
  sqlSnippet: string;
  videoSrc: string;
}

export interface MethodStepItem {
  step: string;
  title: string;
  summary: string;
  artifact: string;
}

export interface ArchitectureLayerItem {
  id: string;
  layer: string;
  title: string;
  stack: string[];
  responsibility: string;
}

export const SLIDES_METADATA: SlideMetadata[] = [
  {
    id: 'capa',
    number: '01',
    shortTitle: 'Capa',
    sectionLabel: 'Abertura',
    speakerNote:
      'Apresentar o BrDiagrama como ferramenta CASE web desenvolvida na FMP pelos autores Davi Lima, Leonardo Andrade e Lucas Blank, sob orientação da Profa. Daniela Amorim, com foco em sincronização bidirecional entre SQL DDL e DER.',
  },
  {
    id: 'problema',
    number: '02',
    shortTitle: 'Justificativa',
    sectionLabel: '1. Introdução & Justificativa',
    speakerNote:
      'Contextualizar a presença dos bancos relacionais (57,3% em 2025) e a Lei da Evolução Contínua de Meir "Manny" Lehman: um software do mundo real nunca está pronto, evolui continuamente junto à estrutura de dados, mas as empresas raramente atualizam a modelagem inicial do banco, tornando a documentação legada e incoerente.',
  },
  {
    id: 'uml',
    number: '03',
    shortTitle: 'UML & Requisitos',
    sectionLabel: '4.1–4.2 Discussão',
    speakerNote:
      'Mostrar o Diagrama de Casos de Uso centrado no ator Usuário: escrever ou importar SQL aciona automaticamente a geração do DER («include»), com exportação de imagem («extend»), exportação SQL e instalação PWA offline.',
  },
  /* SLIDES RESERVADOS PARA REVISÃO POSTERIOR:
  {
    id: 'justificativa',
    number: '03',
    shortTitle: 'Justificativa',
    sectionLabel: '1.1 Justificativa',
    speakerNote:
      'Explicar os dois públicos beneficiados: profissionais de engenharia de software (Devs, DBAs e analistas com engenharia direta e reversa integrada) e estudantes de bancos de dados (aprendizado visual imediato dos efeitos DDL).',
  },
  {
    id: 'objetivos',
    number: '04',
    shortTitle: 'Objetivos',
    sectionLabel: '1.2 Objetivos',
    speakerNote:
      'Apresentar o objetivo geral da ferramenta CASE web com sincronização em tempo real e sintetizar os 8 objetivos específicos em 4 entregas concretas: concepção, motor SQL DDL, sincronização bidirecional e validação.',
  },
  {
    id: 'fundamentacao',
    number: '05',
    shortTitle: 'Fundamentação',
    sectionLabel: '2. Fundamentação',
    speakerNote:
      'Posicionar o trabalho na literatura: modelo relacional e integridade por chaves (Elmasri & Navathe; Silberschatz), DER (Chen; Heuser), SQL DDL e classificação de Fuggetta como ferramenta CASE de projeto e engenharia reversa.',
  },
  {
    id: 'metodologia',
    number: '06',
    shortTitle: 'Metodologia',
    sectionLabel: '3. Metodologia',
    speakerNote:
      'Detalhar o enquadramento metodológico (pesquisa aplicada, quali-quantitativa, descritiva, bibliográfica e experimental) e percorrer as 6 etapas do ciclo de desenvolvimento adotado.',
  },
  {
    id: 'prototipacao',
    number: '08',
    shortTitle: 'Interface & UI/UX',
    sectionLabel: '4.3 Prototipação',
    speakerNote:
      'Demonstrar a evolução do wireframe no Figma até a interface Live Split-Screen final, e alternar entre os modos reais de detecção automática de cardinalidades (1:1, 1:N, N:N e Herança).',
  },
  {
    id: 'arquitetura',
    number: '09',
    shortTitle: 'Arquitetura',
    sectionLabel: '4.4 Arquitetura',
    speakerNote:
      'Explicar a arquitetura 100% client-side em 3 camadas (Apresentação, Processamento AST + Pinia e Hospedagem Vercel/PWA) e interagir com o simulador de sincronização bidirecional ao vivo no slide.',
  },
  {
    id: 'validacao',
    number: '10',
    shortTitle: 'Validação & Conclusão',
    sectionLabel: '4.5–5. Conclusão',
    speakerNote:
      'Apresentar o protocolo planejado para os testes de validação (tarefa prática SQL/DER, fases Alfa/Beta e formulário), retomar como o BrDiagrama responde ao problema de pesquisa e apontar trabalhos futuros.',
  },
  */
];

export const ARTICLE_COVER_INFO = {
  title:
    'Ferramenta para Apoio à Modelagem de Dados com Sincronização Bidirecional entre Scripts SQL e Diagramas de Entidade e Relacionamento',
  institution: 'Faculdade Municipal de Palhoça (FMP)',
  course: 'Análise e Desenvolvimento de Sistemas',
  year: '2026',
  authors: ['Davi Lima', 'Leonardo Andrade', 'Lucas Blank'],
  advisors: ['Daniela Amorim', 'Sérgio Schutz'],
  emails: ['davi.lima@aluno.fmpsc.edu.br', 'daniela.amorim@fmpsc.edu.br'],
};

export const COVER_SQL_SNIPPET = `CREATE TABLE clientes (
  id INT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL
);

CREATE TABLE pedidos (
  id INT PRIMARY KEY,
  total DECIMAL(10,2) NOT NULL,
  data DATE NOT NULL,
  cliente_id INT NOT NULL,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);`;

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

export const JUSTIFICATION_AXES = [
  {
    id: 'industria',
    audience: 'Indústria e Engenharia de Software',
    roles: 'Desenvolvedores · DBAs · Analistas',
    summary:
      'Integra engenharia direta e reversa em tempo real, eliminando a desincronização entre o script implementado e a documentação visual.',
    points: [
      'Alterações no SQL atualizam o DER instantaneamente.',
      'Edições visuais no diagrama refletem de volta no código DDL.',
      'Reduz retrabalho em evoluções contínuas do esquema.',
    ],
  },
  {
    id: 'ensino',
    audience: 'Ensino de Bancos de Dados',
    roles: 'Estudantes · Docentes · Laboratórios',
    summary:
      'Aproxima conceitos teóricos de modelagem relacional da prática em SQL por meio de feedback visual imediato.',
    points: [
      'Visualização instantânea dos efeitos de CREATE, PK e FK.',
      'Compreensão prática de cardinalidades 1:1, 1:N e N:N.',
      'Acesso direto no navegador e offline, sem instalação complexa.',
    ],
  },
];

export const OBJECTIVES_DATA = {
  general:
    'Desenvolver uma ferramenta CASE web para modelagem de bancos de dados relacionais que permita a sincronização bidirecional e em tempo real entre scripts SQL DDL e Diagramas de Entidade-Relacionamento.',
  pillars: [
    {
      code: '01_concepcao',
      title: 'Pesquisa, Requisitos e Prototipação',
      items: [
        'Pesquisar tecnologias viáveis para execução web e offline.',
        'Levantar requisitos e modelar fluxos UML e wireframes no Figma.',
      ],
    },
    {
      code: '02_motor_ddl',
      title: 'Interpretação SQL DDL e Chaves',
      items: [
        'Processar scripts SQL DDL para estrutura intermediária (AST).',
        'Identificar PKs, FKs e cardinalidades para compor relacionamentos.',
      ],
    },
    {
      code: '03_sync_engine',
      title: 'Sincronização Bidirecional Real-Time',
      items: [
        'Refletir alterações do editor SQL imediatamente no DER.',
        'Propagar edições visuais no diagrama de volta ao código SQL.',
      ],
    },
    {
      code: '04_interface_testes',
      title: 'Interface Interativa e Validação',
      items: [
        'Entregar editor e canvas SVG com navegação, zoom e exportação.',
        'Executar testes funcionais e validação prática da sincronização.',
      ],
    },
  ],
};

export const THEORY_TABLES: DiagramTableData[] = [
  {
    id: 'modelo_relacional',
    name: 'modelo_relacional',
    subtitle: 'Base Estrutural',
    columns: [
      { name: 'tabelas_e_tuplas', type: 'Elmasri; Navathe (2015)', isPk: true },
      { name: 'integridade_pk_fk', type: 'Silberschatz et al. (2020)', isFk: true },
      { name: 'sgbds_relacionais', type: 'PostgreSQL; Oracle (2026)' },
    ],
  },
  {
    id: 'mer_e_sql_ddl',
    name: 'mer_e_sql_ddl',
    subtitle: 'Representação e Linguagem',
    columns: [
      { name: 'entidade_relacionamento', type: 'Chen (1976)', isPk: true },
      { name: 'cardinalidade_1_n', type: 'Heuser (2009)' },
      { name: 'create_alter_drop', type: 'ISO SQL; Oracle (2026)', isFk: true },
    ],
  },
  {
    id: 'ferramenta_case',
    name: 'ferramenta_case',
    subtitle: 'Classificação Tecnológica',
    columns: [
      { name: 'nivel_tool', type: 'Fuggetta (1993)', isPk: true },
      { name: 'projeto_e_eng_reversa', type: 'Sommerville (2007)', isFk: true },
      { name: 'automacao_e_apoio', type: 'Pressman (2002); Chen (2002)' },
    ],
  },
];

export const METHODOLOGY_CLASSIFICATION = [
  { label: 'Natureza', value: 'Aplicada', ref: 'Gil, 2019' },
  { label: 'Abordagem', value: 'Quali-Quantitativa', ref: 'Gray, 2012' },
  { label: 'Objetivo', value: 'Descritiva', ref: 'Gil, 2019' },
  { label: 'Procedimentos', value: 'Bibliográfica + Experimental', ref: 'Heuser, 2009' },
];

export const METHOD_STEPS: MethodStepItem[] = [
  {
    step: '01',
    title: 'Requisitos',
    summary: 'Levantamento funcional e não funcional com foco na sincronização bidirecional.',
    artifact: 'Especificação (Apêndice A)',
  },
  {
    step: '02',
    title: 'Modelagem UML',
    summary: 'Definição da arquitetura e fluxos por Diagrama de Casos de Uso.',
    artifact: 'Figura 1 / Apêndice B',
  },
  {
    step: '03',
    title: 'Prototipação',
    summary: 'Wireframes no Figma validando editor à esquerda e canvas à direita.',
    artifact: 'Figura 2 / Apêndice C',
  },
  {
    step: '04',
    title: 'Implementação',
    summary: 'Nuxt 4, Vue 3.5, TypeScript, Monaco Editor, node-sql-parser (AST) e Pinia.',
    artifact: 'Motor SQL ↔ DER',
  },
  {
    step: '05',
    title: 'Canvas e PWA',
    summary: 'Renderização SVG com svg-pan-zoom, Web Storage, exportação PNG/SVG e modo offline.',
    artifact: 'App Instalável',
  },
  {
    step: '06',
    title: 'Testes e Validação',
    summary: 'Testes unitários e de integração do parser, seguidos de avaliação prática de uso.',
    artifact: 'Validação (Seção 4.5)',
  },
];

export const UML_USE_CASES = [
  {
    name: 'Escrever ou Importar SQL',
    relation: 'Gatilho principal',
    description: 'O usuário cria o código do banco na hora ou carrega um arquivo SQL pronto.',
  },
  {
    name: 'Gerar DER',
    relation: '«include» automático',
    description: 'Cria o diagrama visual automaticamente enquanto o código é digitado.',
  },
  {
    name: 'Exportar Imagem',
    relation: '«extend» opcional',
    description: 'Download do diagrama pronto em imagem (PNG) ou vetor (SVG).',
  },
  {
    name: 'Exportar SQL e Instalar APP',
    relation: 'Ações diretas',
    description: 'Baixa o script final e permite usar o aplicativo sem internet direto no computador.',
  },
];

export const CARDINALITY_DEMOS: CardinalityDemoItem[] = [
  {
    id: '1:1',
    label: '1:1',
    badge: 'UNIQUE + NOT NULL',
    title: 'Conexão Exclusiva (1:1)',
    description:
      'Detecta automaticamente a restrição UNIQUE e NOT NULL na chave estrangeira, desenhando vínculo exclusivo entre entidades.',
    sqlSnippet: 'perfil_id INT NOT NULL UNIQUE REFERENCES usuarios(id)',
    videoSrc: '/videos/1-1.mp4',
  },
  {
    id: '1:N',
    label: '0..N',
    badge: 'FK Opcional',
    title: 'Um para Muitos (Opcional)',
    description:
      'Quando a chave estrangeira aceita valores nulos, o conector representa participação opcional no relacionamento.',
    sqlSnippet: 'departamento_id INT NULL REFERENCES departamentos(id)',
    videoSrc: '/videos/1-N.mp4',
  },
  {
    id: 'apenas1:N',
    label: '1..N',
    badge: 'FK NOT NULL',
    title: 'Um para Muitos (Estrito)',
    description:
      'Ao definir NOT NULL na chave estrangeira, a ferramenta destaca a obrigatoriedade referencial do vínculo.',
    sqlSnippet: 'cliente_id INT NOT NULL REFERENCES clientes(id)',
    videoSrc: '/videos/apenas1-N.mp4',
  },
  {
    id: 'N:N',
    label: 'N:N',
    badge: 'Tabela Associativa',
    title: 'Muitos para Muitos (N:N)',
    description:
      'Reconhece tabelas de junção por chaves primárias compostas que referenciam duas ou mais entidades.',
    sqlSnippet: 'PRIMARY KEY (aluno_id, turma_id) -- Duas FKs compostas',
    videoSrc: '/videos/N-N.mp4',
  },
  {
    id: 'heranca',
    label: 'Herança',
    badge: 'PK = FK',
    title: 'Herança e Especialização',
    description:
      'Identifica quando a chave primária também atua como chave estrangeira da superclasse, representando extensão Pai-Filho.',
    sqlSnippet: 'pessoa_id INT PRIMARY KEY REFERENCES pessoas(id)',
    videoSrc: '/videos/heranca.mp4',
  },
];

export const ARCHITECTURE_LAYERS: ArchitectureLayerItem[] = [
  {
    id: 'apresentacao',
    layer: 'Camada 01',
    title: 'Apresentação (Browser)',
    stack: ['Nuxt 4', 'Vue 3.5', 'TypeScript', 'Monaco Editor', 'SVG + svg-pan-zoom', 'Web Storage'],
    responsibility:
      'Divide a interface em editor SQL e canvas vetorial interativo com manipulação inline, pan/zoom e persistência local.',
  },
  {
    id: 'processamento',
    layer: 'Camada 02',
    title: 'Processamento (Engine Local)',
    stack: ['node-sql-parser (AST)', 'Extratores Semânticos', 'Pinia Store', 'Path Router'],
    responsibility:
      'Decompõe comandos DDL em Árvore Sintática Abstrata (AST), extrai PKs/FKs/cardinalidades e sincroniza estado e coordenadas (X, Y).',
  },
  {
    id: 'hospedagem',
    layer: 'Camada 03',
    title: 'Entrega e Autonomia (PWA)',
    stack: ['Vercel HTTPS', 'Service Worker', 'Progressive Web App'],
    responsibility:
      'Dispensa servidores backend para parsing: entrega estática segura com instalação local e execução integral offline.',
  },
];

export const VALIDATION_PROTOCOL = [
  {
    tag: 'Tarefa Prática',
    title: 'Modelagem Direta e Reversa',
    detail: 'Execução de roteiro com scripts SQL DDL e edição direta no diagrama para aferir correspondência estrutural.',
  },
  {
    tag: 'Ciclo Alfa / Beta',
    title: 'Testes com Participantes',
    detail: 'Validação técnica interna (Alfa) seguida de uso orientado com estudantes/desenvolvedores (Beta).',
  },
  {
    tag: 'Instrumento',
    title: 'Formulário Estruturado',
    detail: 'Coleta de tempo de resposta percebido, clareza do diagrama gerado e facilidade de uso da interface.',
  },
];

export const FUTURE_ROADMAP = [
  'Expansão do suporte completo de comandos ALTER TABLE e DROP TABLE nos diferentes dialetos.',
  'Aprimoramento da geração incremental de scripts de migração a partir de alterações no DER.',
  'Avaliação empírica ampliada em turmas de modelagem de dados e times de engenharia.',
];
