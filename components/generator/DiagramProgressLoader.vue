<script setup lang="ts">
import { computed } from "vue";
import { Database, Loader2 } from "lucide-vue-next";
import { useDiagram } from "@/composables/useDiagram";

const { loadingProgress } = useDiagram();

const percentage = computed(() => {
  if (!loadingProgress.value.total) return 0;
  return Math.min(100, Math.round((loadingProgress.value.current / loadingProgress.value.total) * 100));
});

const isParsing = computed(() => loadingProgress.value.phase === 'parsing');
</script>

<template>
  <v-scale-transition origin="center center">
    <div
      v-if="loadingProgress.isLoading"
      class="progress-loader-wrapper"
      role="status"
      aria-live="polite"
    >
      <v-sheet
        class="progress-loader-card"
        elevation="0"
        rounded="xl"
      >
        <div class="progress-loader-header">
          <div class="progress-icon-wrap" aria-hidden="true">
            <Loader2 v-if="isParsing" :size="20" class="progress-icon-spin" />
            <Database v-else :size="20" class="progress-icon" />
          </div>

          <div class="progress-info">
            <span class="progress-title">
              {{ isParsing ? 'Compilando esquema SQL...' : 'Renderizando tabelas...' }}
            </span>
            <span class="progress-count">
              {{ isParsing ? 'Analisando sintaxe em segundo plano...' : `${loadingProgress.current} de ${loadingProgress.total}` }}
            </span>
          </div>

          <span v-if="!isParsing" class="progress-percentage">{{ percentage }}%</span>
        </div>

        <v-progress-linear
          :indeterminate="isParsing"
          :model-value="isParsing ? undefined : percentage"
          height="5"
          rounded="pill"
          color="var(--clr-primary)"
          class="progress-bar"
        />
      </v-sheet>
    </div>
  </v-scale-transition>
</template>

<style scoped>
.progress-loader-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 45;
  pointer-events: none;
}

.progress-loader-card {
  min-width: 320px;
  max-width: 380px;
  padding: 16px 20px 14px;
  border-radius: 16px;
  border: none;
  background: var(--clr-bg-surface);
  box-shadow: var(--clr-shadow-floating);
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.progress-loader-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.progress-icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 186, 156, 0.12);
  color: var(--clr-primary);
  flex-shrink: 0;
}

.progress-icon {
  animation: pulse-icon 1.6s ease-in-out infinite;
}

.progress-icon-spin {
  animation: spin-icon 1s linear infinite;
}

@keyframes spin-icon {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse-icon {
  0%, 100% {
    transform: scale(1);
    opacity: 0.85;
  }
  50% {
    transform: scale(1.12);
    opacity: 1;
  }
}

.progress-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.progress-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--clr-text);
  line-height: 1.25;
}

.progress-count {
  font-size: 0.78rem;
  color: var(--clr-text-muted);
  line-height: 1.25;
  margin-top: 2px;
}

.progress-percentage {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--clr-primary);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.progress-bar {
  border-radius: 999px;
  overflow: hidden;
}
</style>

