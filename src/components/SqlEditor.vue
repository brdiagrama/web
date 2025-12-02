<template>
  <div class="editor-container">
    <div v-if="!editorMounted" class="editor-loading">
      <div class="editor-loading-box">
        <div class="spinner" aria-hidden="true"></div>
        <div class="loading-text">Carregando...</div>
      </div>
    </div>

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
import { ref, watch, shallowRef, toRaw, onUnmounted } from "vue";
import { VueMonacoEditor } from "@guolao/vue-monaco-editor";

const props = defineProps({
  modelValue: { type: String, default: "" },
  markers: { type: Array, default: () => [] },
  dbTables: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "editor-ready"]);

const localCode = ref(props.modelValue);
const editorRef = shallowRef();
const monacoRef = shallowRef();
const themeName = "BrDiagramaSoft";
const editorMounted = ref(false);

defineExpose({
  gotoLine: (lineNumber) => {
    const editor = toRaw(editorRef.value);
    if (!editor) return;

    const model = editor.getModel();
    if (!model) return;

    const safeLine = Math.max(1, Math.min(lineNumber, model.getLineCount()));

    setTimeout(() => {
      try {
        editor.revealLineInCenter(safeLine);
        editor.setPosition({ lineNumber: safeLine, column: 1 });
        editor.focus();
      } catch (e) {}
    }, 50);
  },
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== localCode.value) {
      localCode.value = newValue;
    }
  }
);

watch(
  () => props.markers,
  (newProblems) => {
    const editor = toRaw(editorRef.value);
    const monaco = toRaw(monacoRef.value);

    if (!editor || !monaco) return;

    const model = editor.getModel();

    const markersData = newProblems.map((p) => ({
      startLineNumber: p.line,
      startColumn: 1,
      endLineNumber: p.line,
      endColumn: 1000,
      message: p.message,
      severity:
        p.type === "error" ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
    }));

    monaco.editor.setModelMarkers(model, "br-sql", markersData);
  },
  { deep: true }
);

const editorOptions = {
  automaticLayout: true,
  wordWrap: "off",
  fixedOverflowWidgets: true,
  formatOnType: true,
  formatOnPaste: true,
  minimap: { enabled: false },
  fontSize: 14,
  fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
  fontLigatures: true,
  scrollBeyondLastLine: false,
  roundedSelection: false,
  cursorStyle: "line",
  renderLineHighlight: "line",
  lineNumbers: "on",
  guides: { indentation: true },

  wordBasedSuggestions: "off",

  suggest: {
    showKeywords: true,
    showSnippets: true,
  },
  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: "on",
  smoothScrolling: true,
  mouseWheelZoom: true,
  renderValidationDecorations: "on",
  scrollbar: {
    horizontal: "auto",
    vertical: "auto",
    handleMouseWheel: true,
    horizontalScrollbarSize: 12,
    verticalScrollbarSize: 12,
  },
};

const handleMount = (editor, monaco) => {
  editorRef.value = editor;
  monacoRef.value = monaco;

  monaco.languages.register({ id: "br-sql" });
  monaco.languages.setMonarchTokensProvider("br-sql", {
    ignoreCase: true,
    tokenizer: {
      root: [
        [/`[^`]+`/, "identifier.quoted"],
        [/"[^"]+"/, "identifier.quoted"],

        [
          /\b(create|table|primary|foreign|key|references|not|null|insert|update|delete|select|from|where|join|on|order|by|group|limit|distinct|as|values|set|drop|alter|add|constraint|unique|default|check|index|view)\b/,
          "keyword",
        ],
        [
          /\b(int|integer|varchar|text|date|timestamp|boolean|float|double|decimal|char|serial|bigint|json|uuid|money|time)\b/,
          "dataType",
        ],
        [/\b(count|sum|avg|min|max|now|coalesce|concat|substring)\b/, "function"],
        [/[a-z_][\w$]*/, "identifier"],
        [/'[^']*'/, "string"],
        [/\d+/, "number"],
        [/--.*$/, "comment"],
        [/\/\*/, "comment", "@comment"],
        [/[(),.]/, "delimiter"],
      ],
      comment: [
        [/[^/*]+/, "comment"],
        [/\*\//, "comment", "@pop"],
        [/[/*]/, "comment"],
      ],
    },
  });

  // Autocomplete
  monaco.languages.registerCompletionItemProvider("br-sql", {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const tableSuggestions = props.dbTables.map((tableName) => ({
        label: tableName,
        kind: monaco.languages.CompletionItemKind.Class,
        insertText: tableName,
        detail: "Tabela existente",
        range,
      }));

      const suggestions = [
        ...tableSuggestions,
        {
          label: "CREATE TABLE",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText:
            "CREATE TABLE ${1:nome_tabela} (\n\tid INT PRIMARY KEY,\n\t${2:coluna} VARCHAR(100)\n);",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Estrutura completa de tabela",
          range,
        },
        {
          label: "FK",
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: "FOREIGN KEY (${1:coluna_id}) REFERENCES ${2:tabela}(id)",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Snippet de Chave Estrangeira",
          range,
        },
        ...[
          "CREATE",
          "TABLE",
          "PRIMARY KEY",
          "FOREIGN KEY",
          "REFERENCES",
          "NOT NULL",
          "INSERT INTO",
          "VALUES",
          "SELECT",
          "FROM",
          "WHERE",
          "ORDER BY",
          "GROUP BY",
          "LIMIT",
          "JOIN",
          "LEFT JOIN",
          "INNER JOIN",
          "UPDATE",
          "DELETE",
          "DROP TABLE",
          "ALTER TABLE",
          "CONSTRAINT",
          "UNIQUE",
          "DEFAULT",
        ].map((k) => ({
          label: k,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: k,
          range,
        })),
        ...[
          "INT",
          "VARCHAR",
          "TEXT",
          "TIMESTAMP",
          "DATE",
          "BOOLEAN",
          "DECIMAL",
          "FLOAT",
          "SERIAL",
          "JSON",
          "UUID",
        ].map((t) => ({
          label: t,
          kind: monaco.languages.CompletionItemKind.TypeParameter,
          insertText: t,
          range,
        })),
      ];
      return { suggestions };
    },
  });

  monaco.editor.defineTheme("BrDiagramaSoft", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "5EEAD4" },
      { token: "dataType", foreground: "FDBA74" },
      { token: "function", foreground: "93C5FD" },
      { token: "identifier.quoted", foreground: "FCA5A5" },
      { token: "identifier", foreground: "F1F5F9" },
      { token: "string", foreground: "86EFAC" },
      { token: "number", foreground: "FCA5A5" },
      { token: "comment", foreground: "64748B", fontStyle: "italic" },
      { token: "delimiter", foreground: "94A3B8" },
    ],
    colors: {
      "editor.background": "#0F172A",
      "editor.foreground": "#E2E8F0",
      "editorCursor.foreground": "#F8FAFC",
      "editor.lineHighlightBackground": "#1E293B",
      "editorLineNumber.foreground": "#475569",
      "editor.selectionBackground": "#334155",
      "editorError.foreground": "#EF4444",
      "editorWarning.foreground": "#F59E0B",
      "editorWidget.background": "#020617",
      "editorWidget.border": "#1E293B",
      "editorWidget.foreground": "#E2E8F0",
      "input.background": "#0F172A",
      "input.foreground": "#E2E8F0",
      "input.border": "#334155",
      "inputOption.activeBorder": "#5EEAD4",
      "list.hoverBackground": "#1E293B",
      "list.activeSelectionBackground": "#334155",
      "list.activeSelectionForeground": "#FFFFFF",
      "menu.background": "#020617",
      "menu.foreground": "#E2E8F0",
      "menu.selectionBackground": "#1E293B",
      "menu.selectionForeground": "#5EEAD4",
      "menu.separatorBackground": "#334155",
      "scrollbarSlider.background": "#33415580",
      "scrollbarSlider.hoverBackground": "#475569",
      "scrollbarSlider.activeBackground": "#64748B",
    },
  });

  monaco.editor.setTheme("BrDiagramaSoft");

  emit("editor-ready", { editor: toRaw(editor), monaco: toRaw(monaco) });

  // marca que o editor está pronto para esconder o placeholder
  editorMounted.value = true;

  // Ajusta o layout quando visualViewport muda (teclado virtual em iOS/Android)
  if (window.visualViewport) {
    const onVVResize = () => {
      try {
        // Força o editor a recalcular o layout
        const ed = toRaw(editorRef.value);
        if (ed && ed.layout) ed.layout();
      } catch (err) {
        // visualViewport layout error (suppressed)
      }
    };

    window.visualViewport.addEventListener("resize", onVVResize);
    window.visualViewport.addEventListener("scroll", onVVResize);

    // Cleanup on unmount
    onUnmounted(() => {
      try {
        window.visualViewport.removeEventListener("resize", onVVResize);
        window.visualViewport.removeEventListener("scroll", onVVResize);
      } catch (e) {}
    });
  }
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

.editor-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.editor-loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: rgba(2, 6, 23, 0.98);
  color: #e2e8f0;
  padding: 12px 18px;
  border-radius: 10px;
  box-shadow: 0 8px 20px rgba(2, 6, 23, 0.5);
}
.editor-loading .spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.12);
  border-top-color: #2dd4bf;
  animation: spin 1s linear infinite;
}
.loading-text {
  font-weight: 600;
  font-family: 'Segoe UI', sans-serif;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Sim, deixei essa bomba desse jeito pois nao consegui de jeito nenhum fazer com que o hover do monaco ficasse acima do header fixo
então ele fica no cantinho e ai só não aparece os hovers */
:deep(.find-widget) {
  right: auto !important;
  left: 0 !important;
}

:deep(.find-widget),
:deep(.monaco-hover),
:deep(.suggest-widget),
:deep(.context-view) {
  z-index: 100 !important;
}
</style>
