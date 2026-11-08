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
      :theme="activeThemeName"
      :options="editorOptions"
      @mount="handleMount"
      @change="handleChange"
      class="monaco-editor-instance"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, shallowRef, toRaw, onUnmounted } from "vue";
import { VueMonacoEditor } from "@guolao/vue-monaco-editor";
import { useGeneratorTheme } from "@/composables/useGeneratorTheme";

const props = defineProps({
  modelValue: { type: String, default: "" },
  markers: { type: Array, default: () => [] },
  dbTables: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "editor-ready"]);

const { isEditorDark, initEditorTheme } = useGeneratorTheme();
initEditorTheme();

const activeThemeName = computed(() => (isEditorDark.value ? "BrDiagramaDarkModern" : "BrDiagramaLightModern"));

const localCode = ref(props.modelValue);
const editorRef = shallowRef();
const monacoRef = shallowRef();
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
  fontFamily: "'Consolas', 'JetBrains Mono', 'Courier New', monospace",
  letterSpacing: 0,
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
    horizontalScrollbarSize: 10,
    verticalScrollbarSize: 10,
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

  // Tema Escuro Moderno (VS Code Dark Modern / Google M3) - Preserva 100% a sintaxe da marca
  monaco.editor.defineTheme("BrDiagramaDarkModern", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "5EEAD4" },
      { token: "dataType", foreground: "FDBA74" },
      { token: "function", foreground: "93C5FD" },
      { token: "identifier.quoted", foreground: "FCA5A5" },
      { token: "identifier", foreground: "F0F0F0" },
      { token: "string", foreground: "86EFAC" },
      { token: "number", foreground: "FCA5A5" },
      { token: "comment", foreground: "767D86", fontStyle: "italic" },
      { token: "delimiter", foreground: "9AA0A6" },
    ],
    colors: {
      "editor.background": "#1C1C1C",
      "editor.foreground": "#F0F0F0",
      "editorCursor.foreground": "#AEAFAD",
      "editor.lineHighlightBackground": "#28282860",
      "editorLineNumber.foreground": "#5E6368",
      "editorLineNumber.activeForeground": "#F0F0F0",
      "editor.selectionBackground": "#2F2F2F",
      "editorError.foreground": "#EF4444",
      "editorWarning.foreground": "#F59E0B",
      "editorWidget.background": "#242424",
      "editorWidget.border": "#333333",
      "editorWidget.foreground": "#F0F0F0",
      "input.background": "#181818",
      "input.foreground": "#F0F0F0",
      "input.border": "#333333",
      "inputOption.activeBorder": "#1ABA9C",
      "list.hoverBackground": "#262626",
      "list.activeSelectionBackground": "#2F2F2F",
      "list.activeSelectionForeground": "#FFFFFF",
      "menu.background": "#242424",
      "menu.foreground": "#F0F0F0",
      "menu.selectionBackground": "#2F2F2F",
      "menu.selectionForeground": "#1ABA9C",
      "menu.separatorBackground": "#2F2F2F",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#ffffff18",
      "scrollbarSlider.hoverBackground": "#ffffff33",
      "scrollbarSlider.activeBackground": "#ffffff4d",
    },
  });

  // Tema Claro Moderno (Google M3) - Sintaxe da marca calibrada para contraste em fundo claro
  monaco.editor.defineTheme("BrDiagramaLightModern", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "0D9488" },
      { token: "dataType", foreground: "D97706" },
      { token: "function", foreground: "2563EB" },
      { token: "identifier.quoted", foreground: "E11D48" },
      { token: "identifier", foreground: "1F1F1F" },
      { token: "string", foreground: "16A34A" },
      { token: "number", foreground: "E11D48" },
      { token: "comment", foreground: "8C9196", fontStyle: "italic" },
      { token: "delimiter", foreground: "5E6368" },
    ],
    colors: {
      "editor.background": "#FFFFFF",
      "editor.foreground": "#1F1F1F",
      "editorCursor.foreground": "#000000",
      "editor.lineHighlightBackground": "#F8F9FA",
      "editorLineNumber.foreground": "#9AA0A6",
      "editorLineNumber.activeForeground": "#1F1F1F",
      "editor.selectionBackground": "#E8F0FE",
      "editorError.foreground": "#DC2626",
      "editorWarning.foreground": "#D97706",
      "editorWidget.background": "#FFFFFF",
      "editorWidget.border": "#E0E0E0",
      "editorWidget.foreground": "#1F1F1F",
      "input.background": "#FAF9F9",
      "input.foreground": "#1F1F1F",
      "input.border": "#E0E0E0",
      "inputOption.activeBorder": "#1ABA9C",
      "list.hoverBackground": "#F1F3F4",
      "list.activeSelectionBackground": "#E8F0FE",
      "list.activeSelectionForeground": "#1ABA9C",
      "menu.background": "#FFFFFF",
      "menu.foreground": "#1F1F1F",
      "menu.selectionBackground": "#F1F3F4",
      "menu.selectionForeground": "#1ABA9C",
      "menu.separatorBackground": "#E0E0E0",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#0000001f",
      "scrollbarSlider.hoverBackground": "#00000038",
      "scrollbarSlider.activeBackground": "#00000052",
    },
  });

  monaco.editor.setTheme(isEditorDark.value ? "BrDiagramaDarkModern" : "BrDiagramaLightModern");

  watch(isEditorDark, (dark) => {
    const monacoInstance = toRaw(monacoRef.value);
    if (monacoInstance) {
      monacoInstance.editor.setTheme(dark ? "BrDiagramaDarkModern" : "BrDiagramaLightModern");
    }
  });

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
  background: var(--clr-bg-surface, #1F1F1F);
  color: var(--clr-text, #F0F0F0);
  border: 1px solid var(--clr-border, rgba(255, 255, 255, 0.08));
  padding: 12px 18px;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}
.editor-loading .spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid rgba(140, 145, 155, 0.2);
  border-top-color: var(--clr-primary, #1ABA9C);
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
