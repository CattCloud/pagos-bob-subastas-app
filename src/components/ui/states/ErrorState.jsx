import React from 'react';
import { FaExclamationTriangle, FaExclamationCircle, FaTimes, FaWifi } from 'react-icons/fa';
import Button from '../Button';

/**
 * Componente de estado de error centralizado
 * Maneja diferentes tipos de errores con acciones de recuperación
 */
export default function ErrorState({
  type = 'general', // 'general' | 'network' | 'auth' | 'notFound' | 'critical'
  title,
  message,
  error,
  onRetry,
  onGoBack,
  retryText = 'Reintentar',
  backText = 'Volver',
  showRetry = true,
  showBack = false,
  className = '',
  compact = false,
}) {
  const errorTypes = {
    general: {
      icon: FaExclamationCircle,
      color: 'text-error',
      bgColor: 'bg-error/5',
      borderColor: 'border-error/20',
      defaultTitle: 'Error',
      defaultMessage: 'Ha ocurrido un error inesperado',
    },
    network: {
      icon: FaWifi,
      color: 'text-warning',
      bgColor: 'bg-warning/5',
      borderColor: 'border-warning/20',
      defaultTitle: 'Error de Conexión',
      defaultMessage: 'No se pudo conectar con el servidor',
    },
    auth: {
      icon: FaExclamationTriangle,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-50',
      borderColor: 'border-secondary-200',
      defaultTitle: 'Error de Autenticación',
      defaultMessage: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente',
    },
    notFound: {
      icon: FaTimes,
      color: 'text-text-secondary',
      bgColor: 'bg-bg-tertiary',
      borderColor: 'border-border',
      defaultTitle: 'No Encontrado',
      defaultMessage: 'El recurso solicitado no existe',
    },
    critical: {
      icon: FaExclamationTriangle,
      color: 'text-error',
      bgColor: 'bg-error/10',
      borderColor: 'border-error/30',
      defaultTitle: 'Error Crítico',
      defaultMessage: 'Se ha producido un error grave en el sistema',
    },
  };

  const config = errorTypes[type] || errorTypes.general;
  const IconComponent = config.icon;

  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || error?.message || config.defaultMessage;

  const containerClasses = compact
    ? `p-4 border rounded-lg ${config.bgColor} ${config.borderColor}`
    : `p-8 border rounded-lg text-center ${config.bgColor} ${config.borderColor}`;

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className={compact ? 'flex items-start gap-3' : 'flex flex-col items-center'}>
        <IconComponent className={`${config.color} ${compact ? 'w-5 h-5 mt-0.5' : 'w-12 h-12 mb-4'}`} />
        
        <div className={compact ? 'flex-1' : ''}>
          <h3 className={`font-semibold ${config.color} ${compact ? 'text-base' : 'text-lg'} mb-2`}>
            {displayTitle}
          </h3>
          
          <p className={`text-text-secondary ${compact ? 'text-sm' : ''} ${compact ? 'mb-3' : 'mb-6'}`}>
            {displayMessage}
          </p>

          {/* Detalles técnicos del error (solo en modo no compact) */}
          {!compact && error?.code && (
            <div className="text-xs text-text-muted mb-4 p-2 bg-bg-secondary rounded">
              <p>Código: {error.code}</p>
              {error.status && <p>Status: {error.status}</p>}
            </div>
          )}

          <div className={`flex gap-2 ${compact ? 'justify-end' : 'justify-center'}`}>
            {showRetry && onRetry && (
              <Button 
                variant="outline" 
                size={compact ? 'sm' : 'md'}
                onClick={onRetry}
              >
                {retryText}
              </Button>
            )}
            
            {showBack && onGoBack && (
              <Button 
                variant="primary" 
                size={compact ? 'sm' : 'md'}
                onClick={onGoBack}
              >
                {backText}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}