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
│   ├── DiagramCanvas.vue    # Canvas SVG com zoom/pan
│   └── DiagramToolbar.vue   # Controles de zoom
├── stores/
│   └── diagram.js           # Estado global (Pinia)
├── App.vue                  # Componente principal
└── main.js                  # Ponto de entrada

api/
└── parse.js                 # API de parsing SQL

public/
└── editor.html             # Versão HTML pura (legado)
```

## Como Usar

1. Digite comandos CREATE TABLE no painel esquerdo
2. O diagrama será gerado automaticamente no painel direito  
3. Use a roda do mouse para zoom
4. Arraste para mover o canvas
5. Use os controles na barra inferior para ajustes