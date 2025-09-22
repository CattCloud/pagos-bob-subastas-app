import { useQuery } from '@tanstack/react-query';
import useAuth from './useAuth';
import BillingService from '../services/billing';

/**
 * Hook para badges de cliente:
 * - Facturación pendiente de completar (conteo)
 * Nota: el backend no expone filtro de estado para billing por usuario,
 * por lo que traemos un número acotado (limit=100) y filtramos en cliente.
 */
export default function useClientBadges() {
  const { user, userType } = useAuth();
  const userId = user?.id;
  const enabled = Boolean(userId) && userType !== 'admin';

  const pendingBillingQuery = useQuery({
    queryKey: ['client-badges', 'pending-billings', userId],
    queryFn: async () => {
      const { billings = [] } = await BillingService.listByUser(userId, {
        include: 'auction',
        page: 1,
        limit: 100,
      });
      const pending = billings.filter(
        (b) => !b?.billing_document_type || !b?.billing_document_number || !b?.billing_name
      ).length;
      return { count: pending };
    },
    enabled,
    staleTime: 30_000,
  });

  return {
    pendingBillingCount: pendingBillingQuery.data?.count || 0,
    refetchBadges: () => pendingBillingQuery.refetch(),
    isLoading: pendingBillingQuery.isLoading,
  };
}