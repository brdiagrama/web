let alertModalRef = null;

export const setAlertModalRef = (ref) => {
  alertModalRef = ref;
};

export const showAlert = async (config) => {
  if (!alertModalRef) {
    // Fallback para alert nativo se não estiver inicializado
    alert(typeof config === 'string' ? config : config.message);
    return;
  }

  // Se for string, converte para objeto
  if (typeof config === 'string') {
    config = {
      title: "Aviso",
      message: config,
      type: "info",
      buttonText: "OK"
    };
  }

  return await alertModalRef.showAlert(config);
};

// Atalhos convenientes
export const showError = (message, title = "Erro") => {
  return showAlert({
    title,
    message,
    type: "error",
    buttonText: "OK"
  });
};

export const showSuccess = (message, title = "Sucesso") => {
  return showAlert({
    title,
    message,
    type: "success",
    buttonText: "OK"
  });
};

export const showWarning = (message, title = "Atenção") => {
  return showAlert({
    title,
    message,
    type: "warning",
    buttonText: "OK"
  });
};

export const showInfo = (message, title = "Informação") => {
  return showAlert({
    title,
    message,
    type: "info",
    buttonText: "OK"
  });
};