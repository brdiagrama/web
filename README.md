# BrDiagrama

BrDiagrama é uma ferramenta web para geração automática de diagramas de banco de dados a partir de comandos SQL. O projeto oferece uma interface visual interativa com canvas infinito, permitindo que desenvolvedores visualizem e gerenciem a estrutura de seus bancos de dados de forma intuitiva.

## Recursos Principais

O sistema converte automaticamente comandos CREATE TABLE em diagramas visuais, identificando e renderizando relacionamentos entre tabelas através de foreign keys. A interface inclui:

- Editor SQL integrado com validação sintática em tempo real
- Canvas SVG infinito com navegação suave e controles de zoom
- Renderização automática de relacionamentos com notação Crow's Foot
- Sistema de grid configurável para organização visual
- Exportação de diagramas em múltiplos formatos (SQL, PNG, SVG)
- Painel de problemas integrado para validação de comandos
- Interface responsiva adaptada para dispositivos móveis
- Suporte a Progressive Web App (PWA)

## Stack Tecnológica

### Frontend
- **Vue 3** com Composition API
- **Pinia** para gerenciamento de estado
- **Vite** como build tool e dev server
- **Monaco Editor** para edição de código SQL
- **SVG pan-zoom** para manipulação do canvas
- **GSAP** para animações
- **Lucide Vue** para iconografia

### Backend
- **Vercel Serverless Functions** para API
- **node-sql-parser** para análise sintática de SQL

### Desenvolvimento
- **vite-plugin-pwa** para funcionalidades offline
- **html2canvas** para exportação de imagens

## Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/brdiagrama/web.git
cd web
npm install
```

## Execução

### Ambiente de Desenvolvimento

```bash
npm run dev
```

O servidor de desenvolvimento será iniciado em `http://localhost:5173`.

### Build de Produção

```bash
npm run build
```

Os arquivos otimizados serão gerados no diretório `dist/`.

### Preview da Build

```bash
npm run preview
```

## Arquitetura do Projeto

```
src/
├── components/          # Componentes Vue reutilizáveis
│   ├── DiagramCanvas.vue        # Canvas SVG principal com pan/zoom
│   ├── DiagramToolbar.vue       # Barra de ferramentas do canvas
│   ├── RelationshipLine.vue     # Renderização de relacionamentos
│   ├── SqlEditor.vue            # Editor de código SQL
│   ├── ProblemsPanel.vue        # Painel de erros e avisos
│   ├── AlertModal.vue           # Modais de confirmação
│   ├── Toast.vue                # Sistema de notificações
│   ├── AppFooter.vue            # Rodapé da aplicação
│   └── InstallButton.vue        # Botão de instalação PWA
│
├── controllers/         # Lógica de controle
│   └── DiagramController.js     # Controlador principal do diagrama
│
├── models/              # Camada de dados
│   └── SqlParser.service.js     # Parsing e análise de SQL
│
├── services/            # Serviços da aplicação
│   ├── SqlValidator.js          # Validação de comandos SQL
│   ├── alertService.js          # Serviço de alertas
│   └── toastService.js          # Serviço de notificações
│
├── stores/              # Estado global (Pinia)
│   └── diagram.js               # Store do diagrama (zoom, pan, tabelas)
│
├── utils/               # Utilitários
│   ├── geometry.js              # Cálculos geométricos para linhas
│   └── mathUtils.js             # Funções matemáticas auxiliares
│
├── pages/               # Páginas da aplicação
│   ├── AboutPage.vue            # Página sobre
│   └── FaqPage.vue              # Página de FAQ
│
├── assets/              # Recursos estáticos
│   ├── images/                  # Imagens e logos
│   └── styles/                  # Estilos globais
│       ├── global.css
│       └── variables.css
│
├── App.vue              # Componente raiz da aplicação
├── LandingPage.vue      # Página inicial
├── main.js              # Ponto de entrada
├── landing.js           # Script da landing page
├── about.js             # Script da página sobre
└── faq.js               # Script da página FAQ

api/
└── parse.js             # Função serverless para parsing SQL

public/
├── site.webmanifest     # Manifesto PWA
├── team/                # Imagens da equipe
└── videos/              # Vídeos de demonstração
```

## Configuração

### Vercel

O projeto está configurado para deploy automático na Vercel. O arquivo `vercel.json` define:
- Rotas e redirecionamentos
- Configuração de headers de cache
- Função serverless para parsing SQL

### Vite

As configurações do Vite incluem:
- Aliases de path para imports simplificados
- Plugin PWA para funcionamento offline
- Otimizações de build para produção

## Uso

### Editor SQL

Digite ou cole comandos CREATE TABLE no painel esquerdo. O sistema suporta sintaxe SQL padrão incluindo:
- Definição de colunas com tipos de dados
- Constraints (PRIMARY KEY, FOREIGN KEY, NOT NULL, UNIQUE)
- Relacionamentos entre tabelas

### Navegação no Canvas

- **Zoom**: Use a roda do mouse ou os controles da barra inferior
- **Pan**: Clique e arraste com o botão esquerdo do mouse
- **Modo Pan**: Ative para navegação facilitada
- **Ajustar à Tela**: Botão para centralizar e ajustar zoom automaticamente

### Manipulação de Tabelas

- Arraste tabelas para reposicioná-las no canvas
- O sistema mantém relacionamentos conectados durante movimentação
- Posições são persistidas no armazenamento local

### Exportação

O sistema oferece três formatos de exportação:
- **SQL**: Exporta os comandos CREATE TABLE
- **PNG**: Gera imagem do diagrama atual
- **SVG**: Exporta vetor escalável do canvas

## Licença

ISC
