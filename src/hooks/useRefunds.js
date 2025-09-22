import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RefundService from '../services/refundService';
import useAuth from './useAuth';

/**
 * Hook para gestión de reembolsos con React Query
 * Soporta filtros, paginación y acciones CRUD
 */
export default function useRefunds(filters = {}) {
  const queryClient = useQueryClient();
  const { user, userType } = useAuth();
  const userId = user?.id;

  // Obtener historial de reembolsos del cliente
  const {
    data: refundsData,
    isLoading: isLoadingRefunds,
    isError: isErrorRefunds,
    error: errorRefunds,
    refetch: refetchRefunds,
  } = useQuery({
    queryKey: ['user-refunds', userId, filters],
    queryFn: async () => {
      if (!userId) return { refunds: [], pagination: {} };
      return RefundService.getUserRefunds(userId, filters);
    },
    enabled: Boolean(userId),
    staleTime: 60_000, // 1 minuto
  });

  // Obtener subastas elegibles para reembolso
  const {
    data: eligibleAuctions,
    isLoading: isLoadingAuctions,
    isError: isErrorAuctions,
    error: errorAuctions,
    refetch: refetchAuctions,
  } = useQuery({
    queryKey: ['eligible-auctions', userId],
    queryFn: async () => {
      if (!userId) return [];
      return RefundService.getEligibleAuctions(userId);
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  // Crear solicitud de reembolso
  const createRefundMutation = useMutation({
    mutationFn: async (data) => RefundService.createRefund(data),
    onSuccess: () => {
      // Invalidar queries relacionadas
      // Cliente: historial propio y saldos/notificaciones
      queryClient.invalidateQueries({ queryKey: ['user-refunds', userId] });
      queryClient.invalidateQueries({ queryKey: ['balance', userId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      // Admin: lista global (si la vista está abierta debe refrescar)
      queryClient.invalidateQueries({ queryKey: ['all-refunds'] });
      // Badges admin: solicitudes pendientes de confirmación
      queryClient.invalidateQueries({ queryKey: ['admin-badge', 'pending-refunds'] });
    },
  });

  // Para admin: obtener todas las solicitudes
  const {
    data: allRefundsData,
    isLoading: isLoadingAllRefunds,
    isError: isErrorAllRefunds,
    error: errorAllRefunds,
    refetch: refetchAllRefunds,
  } = useQuery({
    queryKey: ['all-refunds', filters],
    queryFn: async () => RefundService.getAllRefunds(filters),
    enabled: userType === 'admin',
    staleTime: 30_000,
  });

  // Gestionar reembolso (admin)
  const manageRefundMutation = useMutation({
    mutationFn: async ({ refundId, data }) => RefundService.manageRefund(refundId, data),
    onSuccess: () => {
      // Refrescar listas y detalle
      queryClient.invalidateQueries({ queryKey: ['all-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['refund'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      // Importante: liberar o mantener retención afecta saldos
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      // Opcional: movimientos podrían reflejar rechazos/procesos previos
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      // Badges admin: solicitudes pendientes de confirmación
      queryClient.invalidateQueries({ queryKey: ['admin-badge', 'pending-refunds'] });
    },
  });

  // Procesar reembolso (admin)
  const processRefundMutation = useMutation({
    mutationFn: async ({ refundId, data }) => RefundService.processRefund(refundId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['user-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['refund'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      // Badges admin: solicitudes pendientes de confirmación
      queryClient.invalidateQueries({ queryKey: ['admin-badge', 'pending-refunds'] });
    },
  });

  // Hook para obtener detalle de un reembolso específico
  const useRefundDetail = (refundId) => {
    return useQuery({
      queryKey: ['refund', refundId],
      queryFn: async () => {
        if (!refundId) return null;
        return RefundService.getRefund(refundId);
      },
      enabled: Boolean(refundId),
      staleTime: 60_000,
    });
  };

  // Métodos de conveniencia (async para poder await en los llamados)
  const createRefund = (data) => createRefundMutation.mutateAsync(data);
  const manageRefund = (refundId, data) => manageRefundMutation.mutateAsync({ refundId, data });
  const processRefund = (refundId, data) => processRefundMutation.mutateAsync({ refundId, data });

  return {
    // Cliente: historial y crear
    refunds: refundsData?.refunds || [],
    refundsPagination: refundsData?.pagination || {},
    isLoadingRefunds,
    isErrorRefunds,
    errorRefunds,
    refetchRefunds,
    
    // Cliente: subastas elegibles
    eligibleAuctions: eligibleAuctions || [],
    isLoadingAuctions,
    isErrorAuctions,
    errorAuctions,
    refetchAuctions,
    
    // Admin: todas las solicitudes
    allRefunds: allRefundsData?.refunds || [],
    allRefundsPagination: allRefundsData?.pagination || {},
    isLoadingAllRefunds,
    isErrorAllRefunds,
    errorAllRefunds,
    refetchAllRefunds,
    
    // Acciones
    createRefund,
    manageRefund,
    processRefund,
    useRefundDetail,
    
    // Estados de carga
    isCreating: createRefundMutation.isPending,
    isManaging: manageRefundMutation.isPending,
    isProcessing: processRefundMutation.isPending,
  };
}