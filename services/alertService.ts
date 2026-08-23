import { ref } from 'vue';

export interface AlertConfig {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttonText?: string;
  hasCancel?: boolean;
}

export interface ActiveAlertModal extends AlertConfig {
  isVisible: boolean;
  resolve?: (value: boolean) => void;
}

export const activeAlert = ref<ActiveAlertModal>({
  isVisible: false,
  title: 'Aviso',
  message: '',
  type: 'info',
  buttonText: 'OK',
  hasCancel: false,
});

export const showAlert = (config: AlertConfig | string): Promise<boolean> => {
  const alertData: AlertConfig = typeof config === 'string'
    ? { title: "Aviso", message: config, type: "info", buttonText: "OK", hasCancel: false }
    : { title: "Aviso", buttonText: "OK", type: "info", hasCancel: false, ...config };

  return new Promise((resolve) => {
    activeAlert.value = {
      ...alertData,
      isVisible: true,
      resolve,
    };
  });
};

export const closeAlert = (result: boolean): void => {
  if (activeAlert.value.resolve) {
    activeAlert.value.resolve(result);
  }
  activeAlert.value.isVisible = false;
  activeAlert.value.resolve = undefined;
};

export const showError = (message: string, title = "Erro"): Promise<boolean> => {
  return showAlert({ title, message, type: "error", buttonText: "OK" });
};

export const showSuccess = (message: string, title = "Sucesso"): Promise<boolean> => {
  return showAlert({ title, message, type: "success", buttonText: "OK" });
};

export const showWarning = (message: string, title = "Atenção"): Promise<boolean> => {
  return showAlert({ title, message, type: "warning", buttonText: "OK" });
};

export const showInfo = (message: string, title = "Informação"): Promise<boolean> => {
  return showAlert({ title, message, type: "info", buttonText: "OK" });
};
