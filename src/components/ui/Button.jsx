import React from 'react';
import { ClipLoader } from 'react-spinners';

/**
 * Componente Button mejorado con estados de loading usando react-spinners
 * Mantiene compatibilidad con la implementación anterior
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  icon,
  loadingText,
  type = 'button',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
    secondary: 'bg-secondary-600 hover:bg-secondary-700 text-white focus:ring-secondary-500',
    outline: 'border border-border bg-white hover:bg-bg-secondary text-text-primary focus:ring-primary-500',
    success: 'bg-success hover:bg-success/90 text-white focus:ring-success/50',
    error: 'bg-error hover:bg-error/90 text-white focus:ring-error/50',
    warning: 'bg-warning hover:bg-warning/90 text-white focus:ring-warning/50',
    info: 'bg-info hover:bg-info/90 text-white focus:ring-info/50',
    ghost: 'hover:bg-bg-tertiary text-text-primary focus:ring-primary-500',
  };

  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  };

  const spinnerSizes = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
  };

  const isDisabled = disabled || loading;
  const spinnerColor = variant === 'outline' || variant === 'ghost' ? '#0e7490' : '#ffffff';

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`
        ${baseClasses}
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <ClipLoader 
          size={spinnerSizes[size]} 
          color={spinnerColor}
          className="mr-2"
        />
      )}
      
      {!loading && icon && (
        <span className="mr-2">
          {icon}
        </span>
      )}
      
      {loading ? (loadingText || 'Cargando...') : children}
    </button>
  );
}