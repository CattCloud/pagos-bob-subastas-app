import React from 'react';
import { PulseLoader } from 'react-spinners';

/**
 * Splash Screen para cargas iniciales de la aplicación
 * Se muestra al inicializar el sistema o cargar datos críticos
 */
export default function SplashScreen({
  message = 'Cargando BOB Subastas...',
  subtitle,
  showLogo = true,
  className = '',
}) {
  return (
    <div className={`fixed inset-0 bg-white flex flex-col items-center justify-center z-50 ${className}`}>
      <div className="text-center">
        {showLogo && (
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto bg-primary-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">BOB</span>
            </div>
            <h1 className="text-3xl font-bold text-primary-700">BOB Subastas</h1>
            {subtitle && (
              <p className="text-text-secondary mt-2">{subtitle}</p>
            )}
          </div>
        )}

        <div className="flex flex-col items-center gap-4">
          <PulseLoader 
            color="#0e7490" 
            size={12}
            speedMultiplier={0.8}
          />
          
          <p className="text-text-secondary text-sm animate-pulse">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}