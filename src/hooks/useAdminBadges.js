import { useQuery } from '@tanstack/react-query';
import useAuth from './useAuth';
import MovementService from '../services/movementService';
import RefundService from '../services/refundService';

/**
 * Hook para contadores (badges) del menú Admin:
 * - Pagos de Garantía pendientes (movements: pago_garantia, estado=pendiente)
 * - Reembolsos pendientes de confirmación (refunds: estado=solicitado)
 * Usa limit=1 y lee pagination.total para evitar transferencias grandes.
 */
export default function useAdminBadges() {
  const { user, userType } = useAuth();
  const enabled = Boolean(user?.id) && userType === 'admin';

  // Pagos de Garantía pendientes
  const paymentsQuery = useQuery({
    queryKey: ['admin-badge', 'pending-guarantee-payments'],
    queryFn: async () => {
      const data = await MovementService.getMovements({
        tipo_especifico: 'pago_garantia',
        estado: 'pendiente',
        page: 1,
        limit: 1,
      });
      const total = data?.pagination?.total ?? (Array.isArray(data?.movements) ? data.movements.length : 0);
      return { count: total };
    },
    enabled,
    staleTime: 30_000,
  });

  // Reembolsos pendientes de confirmación
  const refundsQuery = useQuery({
    queryKey: ['admin-badge', 'pending-refunds'],
    queryFn: async () => {
      const result = await RefundService.getAllRefunds({
        estado: 'solicitado',
        page: 1,
        limit: 1,
      });
      const total = result?.pagination?.total ?? (Array.isArray(result?.refunds) ? result.refunds.length : 0);
      return { count: total };
    },
    enabled,
    staleTime: 30_000,
  });

  return {
    pendingPaymentsCount: paymentsQuery.data?.count || 0,
    pendingRefundsCount: refundsQuery.data?.count || 0,
    refetchBadges: () => {
      paymentsQuery.refetch();
      refundsQuery.refetch();
    },
    isLoading: paymentsQuery.isLoading || refundsQuery.isLoading,
  };
}