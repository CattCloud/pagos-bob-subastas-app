import { useMemo } from 'react';

/**
 * Hook para simplificar el manejo de estados de página
 * Determina automáticamente qué estado mostrar basado en props comunes de React Query
 */
export default function usePageStates({
  isLoading = false,
  isFetching = false,
  isError = false,
  error = null,
  data = null,
  isEmpty = null, // función o boolean para determinar si está vacío
  includeRefetching = false, // si incluir isFetching como loading
}) {
  const states = useMemo(() => {
    const loading = includeRefetching ? (isLoading || isFetching) : isLoading;
    
    // Determinar si está vacío
    let empty = false;
    if (typeof isEmpty === 'function') {
      empty = isEmpty(data);
    } else if (isEmpty !== null) {
      empty = Boolean(isEmpty);
    } else if (data) {
      // Auto-detectar vacío para estructuras comunes
      if (Array.isArray(data)) {
        empty = data.length === 0;
      } else if (data && typeof data === 'object') {
        // Para objetos como { items: [], pagination: {} }
        const items = data.items || data.results || data.data || data.auctions || data.movements || data.refunds || data.billings || data.notifications;
        if (Array.isArray(items)) {
          empty = items.length === 0;
        }
      }
    }

    return {
      isLoading: loading,
      isError: !loading && isError,
      isEmpty: !loading && !isError && empty,
      isReady: !loading && !isError && !empty,
      error,
    };
  }, [isLoading, isFetching, isError, error, data, isEmpty, includeRefetching]);

  return states;
}