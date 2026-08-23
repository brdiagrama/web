import { ref } from 'vue';

export interface ToastConfig {
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export interface ActiveToast extends ToastConfig {
  id: number;
  isVisible: boolean;
}

export const activeToast = ref<ActiveToast>({
  id: 0,
  isVisible: false,
  title: '',
  description: '',
  type: 'info',
  duration: 4000,
});

let toastTimer: any = null;

export const showToast = (config: ToastConfig | string): void => {
  const toastData: ToastConfig = typeof config === 'string'
    ? { title: config, type: 'info', duration: 4000 }
    : config;

  if (toastTimer) clearTimeout(toastTimer);

  activeToast.value = {
    id: Date.now(),
    isVisible: true,
    title: toastData.title,
    description: toastData.description || '',
    type: toastData.type || 'info',
    duration: toastData.duration || 4000,
  };

  toastTimer = setTimeout(() => {
    activeToast.value.isVisible = false;
  }, activeToast.value.duration);
};

export const closeToast = (): void => {
  if (toastTimer) clearTimeout(toastTimer);
  activeToast.value.isVisible = false;
};

export const toastSuccess = (title: string, description = "", duration = 4000): void => {
  showToast({ title, description, type: "success", duration });
};

export const toastError = (title: string, description = "", duration = 5000): void => {
  showToast({ title, description, type: "error", duration });
};

export const toastWarning = (title: string, description = "", duration = 4500): void => {
  showToast({ title, description, type: "warning", duration });
};

export const toastInfo = (title: string, description = "", duration = 4000): void => {
  showToast({ title, description, type: "info", duration });
};
