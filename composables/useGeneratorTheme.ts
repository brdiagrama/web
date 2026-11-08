import { ref, computed, nextTick } from 'vue';

export type Theme = 'dark' | 'light';

const editorTheme = ref<Theme>('dark');
const isEditorThemeInitialized = ref(false);

const canvasTheme = ref<Theme>('light');
const isCanvasThemeInitialized = ref(false);

const modelingTheme = ref<Theme>('dark');
const isModelingThemeInitialized = ref(false);

function runRegionalTransition(
  targetElement: HTMLElement | null,
  transitionName: string,
  applyTheme: () => void,
  event?: MouseEvent
) {
  const supportsViewTransition =
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!supportsViewTransition || !targetElement) {
    applyTheme();
    return;
  }

  const rect = targetElement.getBoundingClientRect();
  const btnRect = (event?.currentTarget as HTMLElement | null)?.getBoundingClientRect?.();

  const clientX =
    event && event.clientX
      ? event.clientX
      : btnRect
        ? btnRect.left + btnRect.width / 2
        : rect.left + rect.width / 2;

  const clientY =
    event && event.clientY
      ? event.clientY
      : btnRect
        ? btnRect.top + btnRect.height / 2
        : rect.top + 28;

  const localX = clientX - rect.left;
  const localY = clientY - rect.top;

  const endRadius = Math.hypot(
    Math.max(localX, rect.width - localX),
    Math.max(localY, rect.height - localY)
  );

  targetElement.style.viewTransitionName = transitionName;
  document.documentElement.classList.add('is-theme-transitioning');

  const transition = (document as any).startViewTransition(async () => {
    applyTheme();
    await nextTick();
  });

  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${localX}px ${localY}px)`,
          `circle(${endRadius}px at ${localX}px ${localY}px)`,
        ],
      },
      {
        duration: 650,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        pseudoElement: `::view-transition-new(${transitionName})`,
      }
    );
  });

  transition.finished.finally(() => {
    document.documentElement.classList.remove('is-theme-transitioning');
    targetElement.style.viewTransitionName = '';
  });
}

export function useGeneratorTheme() {
  const initEditorTheme = () => {
    if (import.meta.server || isEditorThemeInitialized.value) return;

    try {
      const stored = localStorage.getItem('brdiagrama-editor-theme') as Theme | null;
      if (stored === 'dark' || stored === 'light') {
        editorTheme.value = stored;
      } else {
        editorTheme.value = 'dark';
      }
    } catch {
      editorTheme.value = 'dark';
    }

    isEditorThemeInitialized.value = true;
  };

  const setEditorTheme = (theme: Theme) => {
    editorTheme.value = theme;
    try {
      localStorage.setItem('brdiagrama-editor-theme', theme);
    } catch {}
  };

  const toggleEditorTheme = (event?: MouseEvent) => {
    const nextTheme: Theme = editorTheme.value === 'dark' ? 'light' : 'dark';
    const targetElement =
      typeof document !== 'undefined'
        ? ((document.querySelector('.panel-shell.is-editor') as HTMLElement | null) ||
          (document.querySelector('.editor-shell') as HTMLElement | null) ||
          (document.querySelector('.editor-panel') as HTMLElement | null))
        : null;

    runRegionalTransition(targetElement, 'editor-panel', () => setEditorTheme(nextTheme), event);
  };

  const initCanvasTheme = () => {
    if (import.meta.server || isCanvasThemeInitialized.value) return;

    try {
      const stored = localStorage.getItem('brdiagrama-canvas-theme') as Theme | null;
      if (stored === 'dark' || stored === 'light') {
        canvasTheme.value = stored;
      } else {
        canvasTheme.value = 'light';
      }
    } catch {
      canvasTheme.value = 'light';
    }

    isCanvasThemeInitialized.value = true;
  };

  const setCanvasTheme = (theme: Theme) => {
    canvasTheme.value = theme;
    try {
      localStorage.setItem('brdiagrama-canvas-theme', theme);
    } catch {}
  };

  const toggleCanvasTheme = (event?: MouseEvent) => {
    const nextTheme: Theme = canvasTheme.value === 'dark' ? 'light' : 'dark';
    const targetElement =
      typeof document !== 'undefined'
        ? (document.querySelector('.canvas-panel') as HTMLElement | null)
        : null;

    runRegionalTransition(targetElement, 'canvas-stage', () => setCanvasTheme(nextTheme), event);
  };

  const isEditorDark = computed(() => editorTheme.value === 'dark');
  const isCanvasDark = computed(() => canvasTheme.value === 'dark');

  const initModelingTheme = () => {
    if (import.meta.server || isModelingThemeInitialized.value) return;

    try {
      const stored = localStorage.getItem('brdiagrama-modeling-theme') as Theme | null;
      if (stored === 'dark' || stored === 'light') {
        modelingTheme.value = stored;
      } else {
        modelingTheme.value = 'dark';
      }
    } catch {
      modelingTheme.value = 'dark';
    }

    isModelingThemeInitialized.value = true;
  };

  const setModelingTheme = (theme: Theme) => {
    modelingTheme.value = theme;
    try {
      localStorage.setItem('brdiagrama-modeling-theme', theme);
    } catch {}
  };

  const toggleModelingTheme = (event?: MouseEvent) => {
    const nextTheme: Theme = modelingTheme.value === 'dark' ? 'light' : 'dark';
    const targetElement =
      typeof document !== 'undefined'
        ? ((document.querySelector('.panel-shell.is-modeling') as HTMLElement | null) ||
          (document.querySelector('.modeling-panel') as HTMLElement | null))
        : null;

    runRegionalTransition(targetElement, 'modeling-panel', () => setModelingTheme(nextTheme), event);
  };

  const isModelingDark = computed(() => modelingTheme.value === 'dark');

  return {
    canvasTheme,
    isCanvasDark,
    initCanvasTheme,
    setCanvasTheme,
    toggleCanvasTheme,
    editorTheme,
    isEditorDark,
    initEditorTheme,
    setEditorTheme,
    toggleEditorTheme,
    modelingTheme,
    isModelingDark,
    initModelingTheme,
    setModelingTheme,
    toggleModelingTheme,
  };
}
