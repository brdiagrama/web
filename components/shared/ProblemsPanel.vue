<template>
  <transition name="slide-up">
    <div v-if="isVisible && hasProblems" class="problems-panel">
      <div class="problems-header" @click="$emit('toggle')">
        <div class="header-left">
          <span class="panel-title">
            <FileWarning :size="14" /> PROBLEMAS
          </span>
          
          <div class="badges-container">
            <span class="count-badge error" v-if="errorCount > 0">
              <XCircle :size="12" />
              {{ errorCount }} {{ errorCount > 1 ? 'erros' : 'erro' }}
            </span>
            
            <span class="count-badge warning" v-if="warningCount > 0">
              <AlertTriangle :size="12" />
              {{ warningCount }} {{ warningCount > 1 ? 'avisos' : 'aviso' }}
            </span>
          </div>
        </div>
        
        <div class="header-right">
          <button class="icon-btn close-btn" @click.stop="$emit('close')" title="Fechar Painel">
            <X :size="16" />
          </button>
        </div>
      </div>

      <div class="problems-list">
        <div
          v-for="(problem, index) in sortedProblems"
          :key="index"
          class="problem-item"
          :class="problem.type"
          @click="$emit('goto-line', problem.line)"
        >
          <div class="problem-status-strip"></div>
          
          <div class="problem-icon">
            <XCircle v-if="problem.type === 'error'" :size="15" class="icon-error" />
            <AlertTriangle v-else :size="15" class="icon-warning" />
          </div>
          
          <div class="problem-content">
            <div class="problem-header-line">
               <span class="problem-message">{{ problem.message }}</span>
               <span v-if="problem.code" class="code-tag">{{ problem.code }}</span>
            </div>
            <div class="problem-location">
              <span class="location-link">Linha {{ problem.line }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue';
import { X, XCircle, AlertTriangle, FileWarning } from 'lucide-vue-next';

const props = defineProps({
  problems: { type: Array, default: () => [] },
  isVisible: { type: Boolean, default: false }
});

defineEmits(['close', 'toggle', 'goto-line']);

const hasProblems = computed(() => props.problems.length > 0);
const errorCount = computed(() => props.problems.filter(p => p.type === 'error').length);
const warningCount = computed(() => props.problems.filter(p => p.type === 'warning').length);

const sortedProblems = computed(() => {
  return [...props.problems].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'error' ? -1 : 1;
    return a.line - b.line;
  });
});
</script>

<style scoped>
.problems-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 180px;
  max-height: 50%;
  display: flex;
  flex-direction: column;
  z-index: 30;
  background-color: var(--panel-surface, var(--clr-bg-surface));
  border-top: 1px solid var(--panel-border, var(--clr-border));
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.22);
  font-family: var(--diagram-font, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif);
  will-change: transform;
}

.problems-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  height: 34px;
  min-height: 34px;
  background-color: var(--panel-bg, var(--clr-bg));
  border-bottom: 1px solid var(--panel-border, var(--clr-border));
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
}

.problems-header:hover {
  background-color: var(--panel-hover, var(--clr-hover));
}

.problems-header:hover .panel-title {
  color: var(--panel-text, var(--clr-text));
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  color: var(--panel-text-muted, var(--clr-text-muted));
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
}

.badges-container {
  display: flex;
  gap: 6px;
}

.count-badge {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 4px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background 0.2s;
}

.count-badge.error {
  background-color: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.count-badge.warning {
  background-color: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--panel-text-muted, var(--clr-text-muted));
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-btn:hover {
  background-color: var(--panel-hover, var(--clr-hover));
  color: var(--panel-text, var(--clr-text));
}

.problem-item {
  display: flex;
  position: relative;
  padding: 8px 12px;
  border-bottom: 1px solid var(--panel-border, var(--clr-border));
  cursor: pointer;
  transition: background-color 0.15s ease;
  align-items: flex-start;
  gap: 10px;
  background-color: var(--panel-surface, var(--clr-bg-surface));
}

.problem-item:hover {
  background-color: var(--panel-hover, var(--clr-hover));
}

.problem-status-strip {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}
.problem-item.error .problem-status-strip { background-color: #ef4444; }
.problem-item.warning .problem-status-strip { background-color: #f59e0b; }

.problem-icon {
  margin-top: 1px;
  flex-shrink: 0;
}
.icon-error { color: #ef4444; }
.icon-warning { color: #f59e0b; }

.problem-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.problem-header-line {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.problem-message {
  font-size: 12.5px;
  color: var(--panel-text, var(--clr-text));
  font-family: inherit;
  line-height: 1.35;
  word-break: break-word;
}

.code-tag {
  font-family: 'Fira Code', 'JetBrains Mono', monospace;
  font-size: 10.5px;
  background: var(--panel-hover, var(--clr-hover));
  padding: 1px 5px;
  border-radius: 3px;
  color: var(--panel-text, var(--clr-text));
}

.location-link {
  font-size: 11px;
  color: var(--panel-text-muted, var(--clr-text-muted));
  font-family: "Fira Code", monospace;
  text-decoration: underline;
  text-decoration-color: transparent;
  transition: all 0.2s;
}

.problem-item:hover .location-link {
  color: var(--clr-primary, #1aba9c);
  text-decoration-color: var(--clr-primary, #1aba9c);
}

.problems-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* Transição acelerada por hardware GPU com transform */
.slide-up-enter-active {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.18s ease-out;
}

.slide-up-leave-active {
  transition: transform 0.16s cubic-bezier(0.4, 0, 1, 1), opacity 0.14s ease-in;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>