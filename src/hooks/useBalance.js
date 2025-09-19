import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import BalanceService from '../services/balanceService';
import useAuth from './useAuth';

/**
 * Hook personalizado para gestión de saldos
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.enabled - Si la query debe ejecutarse automáticamente
 * @param {number} options.refetchInterval - Intervalo de actualización en ms
 * @returns {Object} - Estado y funciones del saldo
 */
export const useBalance = (options = {}) => {
  const { user, isAuthenticated } = useAuth();
  const [balanceValidation, setBalanceValidation] = useState(null);
  
  const {
    enabled = true,
    refetchInterval = 30000, // 30 segundos por defecto
    staleTime = 10000, // 10 segundos
  } = options;
  
  // Query para obtener el saldo del usuario
  const {
    data: balance,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isSuccess
  } = useQuery({
    queryKey: ['balance', user?.id],
    queryFn: () => BalanceService.getUserBalance(user?.id),
    enabled: enabled && isAuthenticated && !!user?.id,
    refetchInterval,
    staleTime,
    gcTime: 300000, // 5 minutos en cache
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  
  // Validar integridad del saldo cuando se obtenga
  useEffect(() => {
    if (balance && isSuccess) {
      const validation = BalanceService.validateBalance(balance);
      setBalanceValidation(validation);
      
      if (!validation.isValid) {
        console.warn('Saldo con inconsistencias:', validation.errors);
      }
    }
  }, [balance, isSuccess]);
  
  // Calcular valores derivados
  const availableBalance = balance ? BalanceService.calculateAvailableBalance(balance) : 0;
  
  // Función para forzar actualización
  const refreshBalance = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Error al actualizar saldo:', error);
      throw error;
    }
  };
  
  // Verificar si hay suficiente saldo disponible
  const hasSufficientBalance = (amount) => {
    return availableBalance >= amount;
  };
  
  // Obtener porcentajes para visualización
  const getBalancePercentages = () => {
    if (!balance || balance.saldo_total === 0) {
      return { retenido: 0, aplicado: 0, disponible: 0 };
    }
    
    const total = parseFloat(balance.saldo_total);
    const retenido = parseFloat(balance.saldo_retenido || 0);
    const aplicado = parseFloat(balance.saldo_aplicado || 0);
    
    return {
      retenido: (retenido / total) * 100,
      aplicado: (aplicado / total) * 100,
      disponible: (availableBalance / total) * 100
    };
  };
  
  return {
    // Datos del saldo
    balance,
    availableBalance,
    
    // Estados de la query
    isLoading,
    isError,
    error,
    isFetching,
    isSuccess,
    
    // Validación
    balanceValidation,
    
    // Funciones utilitarias
    refreshBalance,
    hasSufficientBalance,
    getBalancePercentages,
    
    // Valores individuales para fácil acceso
    saldoTotal: balance?.saldo_total || 0,
    saldoRetenido: balance?.saldo_retenido || 0,
    saldoAplicado: balance?.saldo_aplicado || 0,
    saldoDisponible: availableBalance,
    updatedAt: balance?.updated_at
  };
};

/**
 * Hook para resumen de saldos (admin)
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - Estado y datos del resumen
 */
export const useBalancesSummary = (options = {}) => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  const {
    enabled = true,
    refetchInterval = 60000, // 1 minuto para admin
  } = options;
  
  const {
    data: summary,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['balances-summary'],
    queryFn: () => BalanceService.getBalancesSummary(),
    enabled: enabled && isAuthenticated && isAdmin(),
    refetchInterval,
    staleTime: 30000, // 30 segundos
    gcTime: 600000, // 10 minutos en cache
  });
  
  return {
    summary,
    isLoading,
    isError,
    error,
    refreshSummary: refetch
  };
};

export default useBalance;