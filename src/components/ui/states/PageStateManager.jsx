import React from 'react';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';

/**
 * Gestor de estados de página centralizado
 * Maneja los 3 estados principales: loading, error, empty
 * Simplifica el manejo de estados en páginas y componentes
 */
export default function PageStateManager({
  isLoading = false,
  isError = false,
  error = null,
  isEmpty = false,
  children,
  
  // Props para LoadingState
  loadingType = 'spinner',
  loadingMessage = 'Cargando...',
  loadingSize = 'md',
  
  // Props para ErrorState
  errorType = 'general',
  errorTitle,
  errorMessage,
  onRetry,
  onGoBack,
  showRetryButton = true,
  showBackButton = false,
  
  // Props para EmptyState
  emptyType = 'general',
  emptyTitle,
  emptyMessage,
  emptyActionText,
  onEmptyAction,
  emptySecondaryText,
  onEmptySecondary,
  
  // Configuración general
  className = '',
  wrapperClassName = '',
}) {
  // Prioridad: Loading > Error > Empty > Children
  
  if (isLoading) {
    return (
      <div className={wrapperClassName}>
        <LoadingState
          type={loadingType}
          message={loadingMessage}
          size={loadingSize}
          className={className}
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={wrapperClassName}>
        <ErrorState
          type={errorType}
          title={errorTitle}
          message={errorMessage}
          error={error}
          onRetry={onRetry}
          onGoBack={onGoBack}
          showRetry={showRetryButton}
          showBack={showBackButton}
          className={className}
        />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={wrapperClassName}>
        <EmptyState
          type={emptyType}
          title={emptyTitle}
          message={emptyMessage}
          actionText={emptyActionText}
          onAction={onEmptyAction}
          secondaryText={emptySecondaryText}
          onSecondary={onEmptySecondary}
          className={className}
        />
      </div>
    );
  }

  // Estado normal - renderizar children
  return (
    <div className={wrapperClassName}>
      {children}
    </div>
  );
}