import React from 'react';
import { ClipLoader, PulseLoader, BarLoader } from 'react-spinners';

/**
 * Componente de estado de carga centralizado
 * Usa react-spinners para loaders consistentes
 */
export default function LoadingState({
  type = 'spinner', // 'spinner' | 'pulse' | 'bar' | 'skeleton'
  size = 'md',
  color = '#0e7490', // primary-600
  message = 'Cargando...',
  inline = false,
  className = '',
  showMessage = true,
  count = 3, // para skeleton
}) {
  const sizes = {
    sm: { spinner: 20, pulse: 8, bar: 100 },
    md: { spinner: 35, pulse: 12, bar: 150 },
    lg: { spinner: 50, pulse: 16, bar: 200 },
  };

  const currentSize = sizes[size] || sizes.md;

  const renderLoader = () => {
    switch (type) {
      case 'pulse':
        return <PulseLoader color={color} size={currentSize.pulse} />;
      case 'bar':
        return <BarLoader color={color} width={currentSize.bar} height={4} />;
      case 'skeleton':
        return (
          <div className="space-y-3">
            {[...Array(count)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-border rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-border rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-border rounded w-1/2"></div>
              </div>
            ))}
          </div>
        );
      case 'spinner':
      default:
        return <ClipLoader color={color} size={currentSize.spinner} />;
    }
  };

  if (inline) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {renderLoader()}
        {showMessage && type !== 'skeleton' && (
          <span className="text-sm text-text-secondary">{message}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      {renderLoader()}
      {showMessage && type !== 'skeleton' && (
        <p className="text-text-secondary mt-4 text-center">{message}</p>
      )}
    </div>
  );
}