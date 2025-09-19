import { Toaster } from 'react-hot-toast';

// Componente Toaster configurado para BOB Subastas
const ToastContainer = ({ 
  position = 'top-right',
  reverseOrder = false,
  gutter = 8,
  containerClassName = '',
  containerStyle = {},
  toastOptions = {}
}) => {
  return (
    <Toaster
      position={position}
      reverseOrder={reverseOrder}
      gutter={gutter}
      containerClassName={containerClassName}
      containerStyle={containerStyle}
      toastOptions={{
        duration: 4000,
        ...toastOptions,
        className: `shadow-lg border rounded-lg ${toastOptions.className || ''}`,
        style: {
          maxWidth: '500px',
          fontFamily: 'inherit',
          fontSize: '14px',
          fontWeight: '500',
          ...toastOptions.style,
        },
      }}
    />
  );
};

// Componente Toast personalizado para casos especiales
export const CustomToast = ({ 
  title, 
  message, 
  type = 'info',
  onClose,
  actions
}) => {
  const typeStyles = {
    success: 'border-success bg-success/10 text-success',
    error: 'border-error bg-error/10 text-error',
    warning: 'border-warning bg-warning/10 text-warning',
    info: 'border-info bg-info/10 text-info',
  };

  const icons = {
    success: '✅',
    error: '❌', 
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div className={`
      p-4 rounded-lg border-l-4 shadow-lg
      ${typeStyles[type]}
    `}>
      <div className="flex items-start">
        <span className="text-lg mr-3 flex-shrink-0">
          {icons[type]}
        </span>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold mb-1">
              {title}
            </h4>
          )}
          <p className="text-sm opacity-90">
            {message}
          </p>
          {actions && (
            <div className="mt-3 flex gap-2">
              {actions}
            </div>
          )}
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="ml-3 flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ToastContainer;