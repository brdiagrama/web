# BrDiagrama

Gerador de Diagramas de Banco de Dados com Canvas Infinito

## Funcionalidades

- 📝 **Editor SQL**: Interface para escrever comandos CREATE TABLE
- 🎨 **Canvas Infinito**: Navegação e zoom suaves no diagrama
- 🔄 **Sincronização em Tempo Real**: Atualização automática do diagrama
- 🎛️ **Controles de Zoom**: Slider e botão "Ajustar à Tela"
- 🔗 **Relacionamentos Visuais**: Linhas conectando Foreign Keys

## Tecnologias

- **Frontend**: Vue 3 + Pinia + Vite
- **Canvas**: SVG com svg-pan-zoom
- **Backend**: Node.js + Vercel Serverless
- **Parser SQL**: node-sql-parser

## Instalação e Execução

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## Estrutura do Projeto

```
src/
├── components/
│   ├── DiagramCanvas.vue      # Canvas SVG com zoom/pan e grid infinito
│   ├── DiagramToolbar.vue     # Controles de zoom e ajuste de tela
│   └── RelationshipLine.vue   # Componente para linhas de relacionamento com cardinalidade
├── models/
│   └── sqlParser.service.js   # Parser SQL para extrair tabelas e relacionamentos
├── services/
│   └── mockApi.service.js     # Mock da API para desenvolvimento local
├── stores/
│   └── diagram.js             # Estado global (Pinia) - tabelas, zoom, posições
├── utils/
│   ├── geometry.js            # Funções de ancoragem e posicionamento de linhas
│   └── mathUtils.js           # Utilitários matemáticos (distância, grid, IDs)
├── assets/
│   └── styles/
│       └── variables.css      # Variáveis CSS globais
├── App.vue                    # Componente principal com editor e canvas
└── main.js                    # Ponto de entrada da aplicação

api/
└── parse.js                   # API serverless de parsing SQL (Vercel)

editor.html                    # Versão HTML pura standalone (legado)
index.html                     # Template HTML principal
vite.config.js                 # Configuração do Vite
vercel.json                    # Configuração de deploy Vercel
```

## Como Usar

1. Digite comandos CREATE TABLE no painel esquerdo
2. O diagrama será gerado automaticamente no painel direito  
3. Use a roda do mouse para zoom
4. Arraste para mover o canvas
5. Use os controles na barra inferior para ajustes