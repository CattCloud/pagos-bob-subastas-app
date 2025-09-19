import toast from 'react-hot-toast';

// Configuración personalizada para los toasts
const toastConfig = {
  duration: 4000,
  position: 'top-right',
  
  // Estilos personalizados
  style: {},
  
  // Clases personalizadas
  className: '',
  
  // Iconos personalizados
  success: '✅',
  error: '❌',
  loading: '⏳',
  blank: 'ℹ️',
};

// Funciones de utilidad para diferentes tipos de toast
export const showToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      ...toastConfig,
      icon: '✅',
      style: {
        border: '1px solid #10b981',
        backgroundColor: '#f0fdf4',
        color: '#166534',
        ...toastConfig.style,
      },
      ...options,
    });
  },
  
  error: (message, options = {}) => {
    return toast.error(message, {
      ...toastConfig,
      icon: '❌',
      style: {
        border: '1px solid #ef4444',
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        ...toastConfig.style,
      },
      ...options,
    });
  },
  
  loading: (message, options = {}) => {
    return toast.loading(message, {
      ...toastConfig,
      icon: '⏳',
      style: {
        border: '1px solid #f59e0b',
        backgroundColor: '#fffbeb',
        color: '#d97706',
        ...toastConfig.style,
      },
      ...options,
    });
  },
  
  info: (message, options = {}) => {
    return toast(message, {
      ...toastConfig,
      icon: 'ℹ️',
      style: {
        border: '1px solid #3b82f6',
        backgroundColor: '#eff6ff',
        color: '#1d4ed8',
        ...toastConfig.style,
      },
      ...options,
    });
  },
  
  warning: (message, options = {}) => {
    return toast(message, {
      ...toastConfig,
      icon: '⚠️',
      style: {
        border: '1px solid #f59e0b',
        backgroundColor: '#fffbeb',
        color: '#d97706',
        ...toastConfig.style,
      },
      ...options,
    });
  },
  
  // Para promesas (útil para operaciones async)
  promise: (promise, messages, options = {}) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Cargando...',
        success: messages.success || 'Operación exitosa',
        error: messages.error || 'Error en la operación',
      },
      {
        ...toastConfig,
        ...options,
      }
    );
  },
  
  // Cerrar toast específico
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },
  
  // Cerrar todos los toasts
  dismissAll: () => {
    toast.dismiss();
  },
};

export default showToast;