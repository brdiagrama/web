import { ref, computed } from 'vue';

export type Theme = 'dark' | 'light';

const currentTheme = ref<Theme>('dark');
const isInitialized = ref(false);

export function useTheme() {
  const initTheme = () => {
    if (import.meta.server || isInitialized.value) return;

    try {
      const stored = localStorage.getItem('brdiagrama-theme') as Theme | null;
      if (stored === 'dark' || stored === 'light') {
        currentTheme.value = stored;
      } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        currentTheme.value = prefersDark ? 'dark' : 'light';
      }
    } catch {
      currentTheme.value = 'dark';
    }

    applyThemeClass(currentTheme.value);
    isInitialized.value = true;
  };

  const applyThemeClass = (theme: Theme) => {
    if (import.meta.server) return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const setTheme = (theme: Theme) => {
    currentTheme.value = theme;
    applyThemeClass(theme);
    try {
      localStorage.setItem('brdiagrama-theme', theme);
    } catch {}
  };

  const toggleTheme = (event?: MouseEvent) => {
    const nextTheme: Theme = currentTheme.value === 'dark' ? 'light' : 'dark';

    const supportsViewTransition =
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!supportsViewTransition) {
      setTheme(nextTheme);
      return;
    }

    const x = event?.clientX ?? window.innerWidth / 2;
    const y = event?.clientY ?? 0;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const animatedSvgs = document.querySelectorAll<SVGSVGElement>('svg');
    animatedSvgs.forEach((svg) => {
      if (typeof svg.pauseAnimations === 'function') svg.pauseAnimations();
    });

    document.documentElement.classList.add('is-theme-transitioning');

    const transition = (document as any).startViewTransition(() => {
      setTheme(nextTheme);
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 750,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });

    transition.finished.finally(() => {
      document.documentElement.classList.remove('is-theme-transitioning');
      animatedSvgs.forEach((svg) => {
        if (typeof svg.unpauseAnimations === 'function') svg.unpauseAnimations();
      });
    });
  };

  const isDark = computed(() => currentTheme.value === 'dark');

  return {
    theme: currentTheme,
    isDark,
    initTheme,
    setTheme,
    toggleTheme,
  };
}
