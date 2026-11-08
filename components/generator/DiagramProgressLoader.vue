<script setup lang="ts">
import { computed } from "vue";
import { Database } from "lucide-vue-next";
import { useDiagram } from "@/composables/useDiagram";
import { useGeneratorTheme } from "@/composables/useGeneratorTheme";

const { loadingProgress } = useDiagram();
const { isCanvasDark } = useGeneratorTheme();

const percentage = computed(() => {
  if (!loadingProgress.value.total) return 0;
  return Math.min(100, Math.round((loadingProgress.value.current / loadingProgress.value.total) * 100));
});
</script>

<template>
  <v-slide-y-transition>
    <div
      v-if="loadingProgress.isLoading"
      class="progress-loader-wrapper"
      role="status"
      aria-live="polite"
    >
      <v-sheet
        class="progress-loader-card"
        elevation="0"
        rounded="lg"
      >
        <div class="progress-loader-header">
          <div class="progress-icon-wrap" aria-hidden="true">
            <Database :size="16" class="progress-icon" />
          </div>

          <div class="progress-info">
            <span class="progress-title">Carregando entidades...</span>
            <span class="progress-count">
              {{ loadingProgress.current }} de {{ loadingProgress.total }}
            </span>
          </div>

          <span class="progress-percentage">{{ percentage }}%</span>
        </div>

        <v-progress-linear
          :model-value="percentage"
          height="4"
          rounded="pill"
          color="var(--clr-primary, #1ABA9C)"
          class="progress-bar"
        />
      </v-sheet>
    </div>
  </v-slide-y-transition>
</template>

<style scoped>
.progress-loader-wrapper {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 45;
  pointer-events: none;
}

.progress-loader-card {
  min-width: 280px;
  max-width: 340px;
  padding: 10px 14px 8px;
  border-radius: 12px;
  border: none;
  background: var(--clr-card-bg);
  box-shadow: var(--clr-shadow-floating);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.progress-loader-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.progress-icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 186, 156, 0.12);
  color: var(--clr-primary, #1ABA9C);
  flex-shrink: 0;
}

.progress-icon {
  animation: pulse-icon 1.6s ease-in-out infinite;
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
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--clr-text);
  line-height: 1.2;
}

.progress-count {
  font-size: 0.72rem;
  color: var(--clr-text-muted);
  line-height: 1.2;
  margin-top: 1px;
}

.progress-percentage {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--clr-primary, #1ABA9C);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.progress-bar {
  border-radius: 999px;
  overflow: hidden;
}
</style>

