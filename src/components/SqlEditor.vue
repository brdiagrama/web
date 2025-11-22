<template>
  <div class="editor-container">
    <VueMonacoEditor
      v-model:value="localCode"
      language="br-sql"
      :theme="themeName"
      :options="editorOptions"
      @mount="handleMount"
      @change="handleChange"
      class="monaco-editor-instance"
    />
  </div>
</template>

<script setup>
import { ref, watch, shallowRef } from "vue";
import { VueMonacoEditor } from "@guolao/vue-monaco-editor";

const props = defineProps({
  modelValue: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue"]);

const localCode = ref(props.modelValue);
const editorRef = shallowRef();
const themeName = "BrDiagramaSoft";

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== localCode.value) {
      localCode.value = newValue;
    }
  }
);

const editorOptions = {
  automaticLayout: true,
  formatOnType: true,
  formatOnPaste: true,
  minimap: { enabled: false },
  fontSize: 15,
  fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
  fontLigatures: true,
  scrollBeyondLastLine: false,
  roundedSelection: false,
  cursorStyle: "line",
  renderLineHighlight: "line",
  lineNumbers: "on",
  guides: { indentation: true },
  
  // 🔥 CORREÇÃO DOS DUPLICADOS:
  // Desliga a sugestão baseada em texto do arquivo. 
  // Agora só aparece o que a gente configurou no provider.
  wordBasedSuggestions: "off", 
  
  suggest: {
    showKeywords: true,
    showSnippets: true,
  },
  cursorBlinking: "smooth",          // O cursor pisca suavemente (fade in/out)
  cursorSmoothCaretAnimation: "on",  // O cursor "desliza" ao digitar em vez de pular
  smoothScrolling: true,             // Rolagem macia
  mouseWheelZoom: true,
};

const handleMount = (editor, monaco) => {
  editorRef.value = editor;

  // Registrar Linguagem
  monaco.languages.register({ id: 'br-sql' });

  // Regras de Cores (Tokenizer)
  monaco.languages.setMonarchTokensProvider('br-sql', {
    ignoreCase: true,
    tokenizer: {
      root: [
        [/\b(create|table|primary|foreign|key|references|not|null|insert|update|delete|select|from|where|join|on|order|by|group|limit|distinct|as|values|set|drop|alter|add|constraint|unique|default|check|index|view)\b/, 'keyword'],
        [/\b(int|integer|varchar|text|date|timestamp|boolean|float|double|decimal|char|serial|bigint|json|uuid|money|time)\b/, 'dataType'],
        [/\b(count|sum|avg|min|max|now|coalesce|concat|substring)\b/, 'function'],
        [/[a-z_][\w$]*/, 'identifier'],
        [/'[^']*'/, 'string'],
        [/\d+/, 'number'],
        [/--.*$/, 'comment'],
        [/\/\*/, 'comment', '@comment'],
        [/[(),.]/, 'delimiter'],
      ],
      comment: [
        [/[^/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[/*]/, 'comment']
      ]
    }
  });

  // Autocomplete
  monaco.languages.registerCompletionItemProvider('br-sql', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions = [
        // Snippets
        {
          label: 'create table',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'CREATE TABLE ${1:nome_tabela} (\n\tid INT PRIMARY KEY,\n\t${2:coluna} VARCHAR(100)\n);',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Estrutura completa de tabela',
          range
        },
        {
          label: 'fk',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'FOREIGN KEY (${1:coluna_id}) REFERENCES ${2:tabela}(id)',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Snippet de Chave Estrangeira',
          range
        },
        
        // Keywords
        ...['CREATE', 'TABLE', 'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES', 'NOT NULL', 'INSERT INTO', 'VALUES', 'SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'LIMIT', 'JOIN', 'LEFT JOIN', 'INNER JOIN', 'UPDATE', 'DELETE', 'DROP TABLE', 'ALTER TABLE', 'CONSTRAINT', 'UNIQUE', 'DEFAULT']
          .map(k => ({
            label: k,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: k,
            range
          })),

        // Types
        ...['INT', 'VARCHAR', 'TEXT', 'TIMESTAMP', 'DATE', 'BOOLEAN', 'DECIMAL', 'FLOAT', 'SERIAL', 'JSON', 'UUID']
          .map(t => ({
            label: t,
            kind: monaco.languages.CompletionItemKind.TypeParameter,
            insertText: t,
            range
          })),
      ];
      return { suggestions };
    }
  });

  // TEMA "BR DIAGRAMA SOFT"
  monaco.editor.defineTheme("BrDiagramaSoft", {
    base: "vs-dark",
    inherit: true,
    rules: [
      // 🔥 REMOVI O FONT-STYLE: BOLD DE TUDO
      // Isso deixa a cor mais "flat" e menos agressiva
      
      { token: "keyword", foreground: "5EEAD4" }, // Teal Pastel (Marca Suave)
      { token: "dataType", foreground: "FDBA74" }, // Pêssego
      { token: "function", foreground: "93C5FD" }, // Azul Pastel
      { token: "identifier", foreground: "F1F5F9" }, // Branco
      { token: "string", foreground: "86EFAC" }, // Verde Menta
      { token: "number", foreground: "FCA5A5" }, // Vermelho Pastel
      { token: "comment", foreground: "64748B", fontStyle: "italic" }, 
      { token: "delimiter", foreground: "94A3B8" }, 
    ],
    colors: {
      "editor.background": "#0F172A",
      "editor.foreground": "#E2E8F0",
      "editorCursor.foreground": "#F8FAFC", // Cursor Branco (Neutro)
      "editor.lineHighlightBackground": "#1E293B",
      "editorLineNumber.foreground": "#475569",
      "editor.selectionBackground": "#334155",
      "editorSuggestWidget.background": "#1E293B",
      "editorSuggestWidget.border": "#334155",
      "editorSuggestWidget.selectedBackground": "#334155",
    },
  });

  monaco.editor.setTheme("BrDiagramaSoft");
};

const handleChange = (value) => {
  emit("update:modelValue", value);
};
</script>

<style scoped>
.editor-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.monaco-editor-instance {
  width: 100%;
  height: 100%;
}
</style>