import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BillingService from '../services/billing';
import useAuth from './useAuth';

/**
 * Hook Billing (Fase 9)
 * - Lista por usuario (cliente)
 * - Lista global (admin)
 * - Detalle por id
 * - Completar datos de facturación
 */
export default function useBilling(userFilters = {}, adminFilters = {}) {
  const queryClient = useQueryClient();
  const { user, userType } = useAuth();
  const userId = user?.id;

  // Cliente: listado de billing del usuario logueado
  const {
    data: userListData,
    isLoading: isLoadingUserBillings,
    isError: isErrorUserBillings,
    error: errorUserBillings,
    refetch: refetchUserBillings,
  } = useQuery({
    queryKey: ['billing-user-list', userId, userFilters],
    queryFn: async () => {
      if (!userId) return { billings: [], pagination: {} };
      return BillingService.listByUser(userId, { ...userFilters, include: 'auction' });
    },
    enabled: Boolean(userId && userType !== 'admin'),
    staleTime: 30_000,
    keepPreviousData: true,
  });

  // Admin: listado global
  const {
    data: allListData,
    isLoading: isLoadingAllBillings,
    isError: isErrorAllBillings,
    error: errorAllBillings,
    refetch: refetchAllBillings,
  } = useQuery({
    queryKey: ['billing-all-list', adminFilters],
    queryFn: async () => BillingService.listAll({ ...adminFilters, include: 'user,auction' }),
    enabled: userType === 'admin',
    staleTime: 30_000,
    keepPreviousData: true,
  });

  // Detalle (para ambos roles)
  const useBillingDetail = (billingId, include = 'user,auction') => {
    return useQuery({
      queryKey: ['billing-detail', billingId, include],
      queryFn: async () => {
        if (!billingId) return null;
        return BillingService.getById(billingId, include);
      },
      enabled: Boolean(billingId),
      staleTime: 60_000,
    });
  };

  // Completar datos de facturación (cliente/admin)
  const completeMutation = useMutation({
    mutationFn: async ({ billingId, payload }) => BillingService.complete(billingId, payload),
    onSuccess: () => {
      // Refrescar listados y detalle
      queryClient.invalidateQueries({ queryKey: ['billing-user-list'] });
      queryClient.invalidateQueries({ queryKey: ['billing-all-list'] });
      queryClient.invalidateQueries({ queryKey: ['billing-detail'] });
      // Notificaciones por si hay eventos de facturación
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      // Badges del cliente: facturaciones pendientes
      queryClient.invalidateQueries({ queryKey: ['client-badges', 'pending-billings'] });
    },
  });

  return {
    // Cliente
    userBillings: userListData?.billings || [],
    userBillingsPagination: userListData?.pagination || { page: 1, limit: 20, total: 0, total_pages: 0 },
    isLoadingUserBillings,
    isErrorUserBillings,
    errorUserBillings,
    refetchUserBillings,

    // Admin
    allBillings: allListData?.billings || [],
    allBillingsPagination: allListData?.pagination || { page: 1, limit: 20, total: 0, total_pages: 0 },
    isLoadingAllBillings,
    isErrorAllBillings,
    errorAllBillings,
    refetchAllBillings,

    // Detalle
    useBillingDetail,

    // Acciones
    completeBilling: (billingId, payload) => completeMutation.mutateAsync({ billingId, payload }),

    // Estados de acción
    isCompleting: completeMutation.isPending,
  };
}