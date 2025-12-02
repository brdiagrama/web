let toastRef = null;

export const setToastRef = (ref) => {
  toastRef = ref;
};

export const showToast = (config) => {
  if (!toastRef) {
    console.warn("Toast não inicializado");
    return;
  }

  // Se for string, converte para objeto
  if (typeof config === "string") {
    config = {
      title: config,
      type: "info",
      duration: 4000
    };
  }

  toastRef.show(config);
};

// Atalhos convenientes
export const toastSuccess = (title, description = "", duration = 4000) => {
  showToast({
    title,
    description,
    type: "success",
    duration
  });
};

export const toastError = (title, description = "", duration = 5000) => {
  showToast({
    title,
    description,
    type: "error",
    duration
  });
};

export const toastWarning = (title, description = "", duration = 4500) => {
  showToast({
    title,
    description,
    type: "warning",
    duration
  });
};

export const toastInfo = (title, description = "", duration = 4000) => {
  showToast({
    title,
    description,
    type: "info",
    duration
  });
};