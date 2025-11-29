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
            <XCircle v-if="problem.type === 'error'" :size="16" class="icon-error" />
            <AlertTriangle v-else :size="16" class="icon-warning" />
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
  background-color: #020617; /* Fundo bem escuro */
  border-top: 1px solid #1E293B;
  height: 200px; /* Altura fixa quando aberto */
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
  z-index: 50;
}

.problems-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 12px;
  height: 40px; /* Um pouco mais alto */
  background-color: #0F172A;
  border-bottom: 1px solid #1E293B;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease; /* Suavidade */
}

.problems-header:hover {
  background-color: #1E293B; /* Um pouco mais claro que o fundo */
  border-bottom-color: #334155; /* Destaca a borda */
}

.problems-header:hover .panel-title {
  color: #E2E8F0; /* Texto fica mais branco */
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #94A3B8;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Segoe UI', sans-serif;
}

.badges-container {
  display: flex;
  gap: 8px;
}

/* Badges Estilo Chip */
.count-badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background 0.2s;
  font-family: 'Segoe UI', sans-serif;
}

.count-badge.error {
  background-color: rgba(239, 68, 68, 0.1);
  color: #FCA5A5;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.count-badge.warning {
  background-color: rgba(245, 158, 11, 0.1);
  color: #FCD34D;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

/* Botão Fechar */
.icon-btn {
  background: none;
  border: none;
  color: #64748B;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.icon-btn:hover {
  background-color: #334155;
  color: #F8FAFC;
}

/* Lista de Problemas */
.problem-item {
  display: flex;
  position: relative;
  padding: 10px 12px;
  border-bottom: 1px solid #1E293B;
  cursor: pointer;
  transition: background-color 0.2s ease;
  align-items: flex-start;
  gap: 12px;
  background-color: #020617;
}

.problem-item.error {
  background-color: rgba(239, 68, 68, 0.08);
}

.problem-item.error:hover {
  background-color: rgba(239, 68, 68, 0.15);
}

.problem-item.warning {
  background-color: rgba(245, 158, 11, 0.08);
}
.problem-item.warning:hover {
  background-color: rgba(245, 158, 11, 0.15);
}

/* Faixinha colorida na esquerda (estilo VS Code) */
.problem-status-strip {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}
.problem-item.error .problem-status-strip { background-color: #EF4444; }
.problem-item.warning .problem-status-strip { background-color: #F59E0B; }

.problem-icon {
  margin-top: 2px; /* Alinhar com o texto */
}
.icon-error { color: #EF4444; }
.icon-warning { color: #F59E0B; }

.problem-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.problem-header-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.problem-message {
  font-size: 13px;
  color: #E2E8F0;
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.4;
}

.code-tag {
  font-family: 'Fira Code', 'JetBrains Mono', monospace;
  font-size: 11px;
  background: rgba(255,255,255,0.08);
  padding: 1px 5px;
  border-radius: 3px;
  color: #CBD5E1;
}

.location-link {
  font-size: 11px;
  color: #64748B;
  font-family: monospace;
  text-decoration: underline;
  text-decoration-color: transparent;
  transition: all 0.2s;
}

.problem-item:hover .location-link {
  color: #94A3B8;
  text-decoration-color: #94A3B8;
}

.problems-list {
  flex: 1;           /* Faz a lista ocupar todo o espaço abaixo do header */
  overflow-y: auto;  /* Habilita a rolagem vertical quando necessário */
  min-height: 0;     /* Garante que o scroll funcione corretamente dentro do flexbox */
}

/* Scrollbar */
.problems-list::-webkit-scrollbar { width: 8px; }
.problems-list::-webkit-scrollbar-track { background: #020617; }
.problems-list::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }

/* Animação Slide Up */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  height: 0;
  opacity: 0;
}
</style>