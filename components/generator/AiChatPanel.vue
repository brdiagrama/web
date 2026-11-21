<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from "vue";
import { Bot, Send, X, Trash2, Square, Settings } from "lucide-vue-next";
import { useDiagramStore } from "@/stores/diagram";
import { useAiSettingsStore } from "@/ai/store/ai-settings.store";
import { sendChatMessage } from "@/ai/controllers/ai.controller";
import { extractEditorSql } from "@/ai/services/orchestrator.service";
import { AiError, describeAiError } from "@/ai/shared/errors";
import type { AiChatRequest, AiProviderConfig, ChatMessage } from "@/ai/types";
import AiProviderSelector from "@/components/generator/AiProviderSelector.vue";
import AiSettingsPanel from "@/components/generator/AiSettingsPanel.vue";

const emit = defineEmits<{ (e: "close"): void }>();

const diagram = useDiagramStore();
const settings = useAiSettingsStore();
const messages = ref<ChatMessage[]>([]);
const input = ref("");
const loading = ref(false);
const settingsOpen = ref(!settings.apiKey);
const listRef = ref<HTMLElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const chatRef = ref<HTMLElement | null>(null);
// Altura definida arrastando a barra do topo; null = altura padrão (45% do painel).
const chatHeight = ref<number | null>(null);
let controller: AbortController | null = null;

const MIN_CHAT_HEIGHT = 240;
const MIN_LIST_ABOVE = 120;

function startChatResize(e: PointerEvent) {
  const panel = chatRef.value?.parentElement;
  if (!panel) return;
  e.preventDefault();
  const handle = e.currentTarget as HTMLElement;
  handle.setPointerCapture(e.pointerId);
  const panelBottom = panel.getBoundingClientRect().bottom;
  const maxHeight = panel.clientHeight - MIN_LIST_ABOVE;
  const onMove = (move: PointerEvent) => {
    chatHeight.value = Math.min(maxHeight, Math.max(MIN_CHAT_HEIGHT, panelBottom - move.clientY));
  };
  const onUp = () => {
    handle.removeEventListener("pointermove", onMove);
    handle.removeEventListener("pointerup", onUp);
  };
  handle.addEventListener("pointermove", onMove);
  handle.addEventListener("pointerup", onUp);
}

const hasKey = computed(() => Boolean(settings.apiKey));
const canSend = computed(() => hasKey.value && Boolean(input.value.trim()) && !loading.value);
const placeholder = computed(() =>
  hasKey.value
    ? "Pergunte algo à IA… (Enter envia)"
    : `Configure sua chave do ${settings.config.label} na engrenagem para conversar`,
);

// Sem chave, as configurações abrem sozinhas; ao salvar a chave, fecham e o foco vai para a mensagem.
watch(hasKey, (value) => {
  settingsOpen.value = !value;
  if (value) nextTick(() => textareaRef.value?.focus());
});
watch(
  () => settings.provider,
  () => {
    if (!hasKey.value) settingsOpen.value = true;
  },
);
watch(() => [settings.provider, settings.model], stop);
onBeforeUnmount(stop);

function scrollToBottom() {
  nextTick(() => {
    if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight;
  });
}

async function send() {
  if (!canSend.value) return;

  messages.value.push({ role: "user", content: input.value.trim() });
  input.value = "";
  controller = new AbortController();
  const config = settings.config;
  const request: AiChatRequest = {
    provider: settings.provider,
    model: settings.model,
    apiKey: settings.apiKey,
    creativity: settings.creativity,
    messages: messages.value.slice(),
    // O SQL atual do editor vai junto em toda mensagem, para a IA ter o contexto.
    context: { sql: diagram.sqlCode, dialect: diagram.sqlDialect, canEditSql: settings.canEditSql },
    signal: controller.signal,
  };
  messages.value.push({ role: "assistant", content: "" });
  // Lida de volta do array para ser o objeto reativo: assim o Vue redesenha a cada pedaço.
  const reply = messages.value[messages.value.length - 1];
  loading.value = true;
  scrollToBottom();

  try {
    for await (const piece of sendChatMessage(request)) {
      reply.content += piece;
      scrollToBottom();
    }
    if (request.context.canEditSql) applyEditorSql(reply);
  } catch (error) {
    if (!request.signal.aborted) showError(reply, error, config);
  } finally {
    // Parado antes do primeiro pedaço: some a resposta vazia.
    if (request.signal.aborted && !reply.content) {
      messages.value = messages.value.filter((message) => message !== reply);
    }
    loading.value = false;
    controller = null;
    scrollToBottom();
  }
}

/** Só com a resposta completa e a permissão ligada: troca o SQL do editor e tira o bloco do texto do chat. */
function applyEditorSql(reply: ChatMessage) {
  const { text, sql } = extractEditorSql(reply.content);
  if (!sql) return;
  reply.previousSql = diagram.sqlCode;
  diagram.setSql(sql);
  reply.content = `${text}\n\n[SQL do editor atualizado pela IA.]`.trim();
}

function undoEditorSql(message: ChatMessage) {
  diagram.setSql(message.previousSql ?? "");
  message.previousSql = undefined;
  message.content += "\n[Alteração desfeita: o SQL anterior voltou para o editor.]";
}

function showError(reply: ChatMessage, error: unknown, config: AiProviderConfig) {
  const text = describeAiError(error, config);
  const blocked = error instanceof AiError && error.kind === "blocked";
  // Resposta recusada é descartada; nos outros erros, o texto que já chegou fica.
  if (reply.content && !blocked) {
    messages.value.push({ role: "assistant", content: text, error: true });
    return;
  }
  reply.content = text;
  reply.error = true;
}

function stop() {
  controller?.abort();
}

function clearChat() {
  stop();
  messages.value = [];
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }
}
</script>

<template>
  <section
    ref="chatRef"
    class="ai-chat"
    aria-label="Chat com IA"
    :style="chatHeight ? { height: `${chatHeight}px` } : undefined"
  >
    <div
      class="ai-chat-resizer"
      role="separator"
      aria-orientation="horizontal"
      aria-label="Arraste para ajustar a altura do chat"
      @pointerdown="startChatResize"
    ></div>
    <header class="ai-chat-header">
      <div class="ai-chat-title">
        <Bot :size="16" />
        <span class="ai-chat-title-text">Assistente IA</span>
        <AiProviderSelector />
      </div>
      <div class="ai-chat-actions">
        <button
          type="button"
          title="Configurações da IA"
          aria-label="Configurações da IA"
          :aria-expanded="settingsOpen"
          :class="{ 'is-active': settingsOpen }"
          @click="settingsOpen = !settingsOpen"
        >
          <Settings :size="15" />
        </button>
        <button type="button" title="Limpar conversa" aria-label="Limpar conversa" @click="clearChat">
          <Trash2 :size="14" />
        </button>
        <button type="button" title="Fechar chat" aria-label="Fechar chat" @click="emit('close')">
          <X :size="15" />
        </button>
      </div>
    </header>

    <AiSettingsPanel v-if="settingsOpen" />

    <div ref="listRef" class="ai-chat-list">
      <p v-if="!messages.length" class="ai-chat-empty">
        Pergunte sobre o seu diagrama. A IA vê o SQL que está no editor.
      </p>
      <div
        v-for="(msg, i) in messages"
        :key="i"
        :class="['ai-msg', msg.role === 'user' ? 'ai-msg-user' : 'ai-msg-bot', { 'ai-msg-error': msg.error }]"
      >
        <template v-if="msg.content">{{ msg.content }}</template>
        <span v-else-if="loading && i === messages.length - 1" class="ai-typing">Pensando…</span>
        <button
          v-if="msg.previousSql !== undefined"
          type="button"
          class="ai-undo-btn"
          aria-label="Desfazer a alteração da IA no SQL do editor"
          @click="undoEditorSql(msg)"
        >
          Desfazer
        </button>
      </div>
    </div>

    <form class="ai-chat-input" @submit.prevent="send">
      <textarea
        ref="textareaRef"
        v-model="input"
        rows="2"
        :placeholder="placeholder"
        :disabled="!hasKey"
        aria-label="Mensagem para a IA"
        @keydown="onKeydown"
      />
      <button v-if="loading" type="button" title="Parar" aria-label="Parar resposta" @click="stop">
        <Square :size="14" />
      </button>
      <button v-else type="submit" title="Enviar" aria-label="Enviar mensagem" :disabled="!canSend">
        <Send :size="15" />
      </button>
    </form>
  </section>
</template>

<style scoped>
.ai-chat {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 45%;
  min-height: 240px;
  background: var(--panel-bg);
  user-select: text;
  -webkit-user-select: text;
}
/* Mesma aparência das barras de redimensionar entre os painéis. */
.ai-chat-resizer {
  flex-shrink: 0;
  height: 8px;
  cursor: row-resize;
  touch-action: none;
  background-color: var(--panel-surface);
  border-top: 1px solid var(--panel-border);
  border-bottom: 1px solid var(--panel-border);
  transition: background-color 0.2s ease;
}
.ai-chat-resizer:hover,
.ai-chat-resizer:active {
  background-color: #1aba9c;
}
.ai-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px 6px 14px;
  border-bottom: 1px solid var(--panel-border);
}
.ai-chat-title {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
}
.ai-chat-title-text {
  white-space: nowrap;
}
/* Sem espaço no cabeçalho, o título vira só o ícone. */
@container (max-width: 340px) {
  .ai-chat-title-text {
    display: none;
  }
}
.ai-chat-actions {
  display: flex;
  flex-shrink: 0;
  gap: 2px;
}
.ai-chat-actions button,
.ai-chat-input button {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: var(--panel-text-muted);
  cursor: pointer;
  border-radius: 6px;
  padding: 6px;
}
.ai-chat-actions button:hover,
.ai-chat-actions button.is-active,
.ai-chat-input button:hover:not(:disabled) {
  background: var(--panel-hover);
  color: var(--panel-text);
}
.ai-chat-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ai-chat-empty {
  margin: auto 0;
  text-align: center;
  font-size: 12px;
  color: var(--panel-text-muted);
}
.ai-msg {
  max-width: 90%;
  padding: 8px 11px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}
.ai-msg-user {
  align-self: flex-end;
  background: #0f9d76;
  color: #fff;
}
.ai-msg-bot {
  align-self: flex-start;
  background: var(--panel-surface);
  color: var(--panel-text);
}
.ai-msg-error {
  border: 1px solid rgba(229, 72, 77, 0.45);
  color: #e5484d;
}
.ai-undo-btn {
  display: block;
  margin-top: 8px;
  padding: 4px 10px;
  border: 1px solid #1aba9c;
  border-radius: 6px;
  background: transparent;
  color: #1aba9c;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.ai-undo-btn:hover {
  background: rgba(26, 186, 156, 0.12);
}
.ai-typing {
  color: var(--panel-text-muted);
  font-style: italic;
}
.ai-chat-input {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  margin: 10px 14px 14px;
  padding: 6px 6px 6px 10px;
  border: 1px solid var(--panel-border);
  border-radius: 10px;
  background: var(--panel-input-bg);
}
.ai-chat-input textarea {
  flex: 1;
  resize: none;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--panel-text);
  font: inherit;
  font-size: 13px;
  max-height: 120px;
}
.ai-chat-input textarea:disabled {
  cursor: not-allowed;
}
.ai-chat-input button:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
