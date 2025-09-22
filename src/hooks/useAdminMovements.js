import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import MovementService from '../services/movementService';

 // Normalizador: homologa y aplana movimientos que pueden venir anidados
 // Soporta shape: { movement: {...campos} } o plano directamente
 const normalizeMovement = (m = {}) => {
   const base = m && typeof m.movement === 'object' ? m.movement : m;
   const pickConcept = (obj = {}) =>
     obj?.concepto ??
     obj?.concept ??
     obj?.descripcion ??
     obj?.description ??
     obj?.glosa ??
     obj?.detalle ??
     obj?.concept_text ??
     obj?.title ??
     obj?.observacion ??
     obj?.observaciones ??
     obj?.descripcion_movimiento ??
     obj?.detalle_movimiento ??
     obj?.metadata?.concepto ??
     obj?.metadata?.description ??
     obj?.details?.concepto ??
     obj?.details?.description ??
     '';

   // Intentar primero desde el objeto base (movement), luego desde el wrapper (m)
   const rawConcept = pickConcept(base) || pickConcept(m);
   const concepto = typeof rawConcept === 'string' ? rawConcept.trim() : rawConcept;

   // Aplanar: priorizar campos de base sobre wrapper, conservar extras del wrapper (ej. referencias)
   return { ...m, ...base, concepto };
 };
const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
};

const DEFAULT_FILTERS = {
  tipo_especifico: 'pago_garantia', // por defecto enfocamos validación de pagos garantía
  estado: 'pendiente', // pendientes por defecto
  fecha_desde: '',
  fecha_hasta: '',
  search: '',
  sort: 'created_at:desc',
};

/**
 * Hook para listar movimientos globales (admin) con filtros y paginación,
 * y acciones de aprobación/rechazo y utilidades (voucher, detalle).
 */
export default function useAdminMovements(initial = {}) {
  // Estado local de filtros y paginación
  const [pagination, setPagination] = useState({
    ...DEFAULT_PAGINATION,
    ...(initial.pagination || {}),
  });
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    ...(initial.filters || {}),
  });

  // Para invalidar badges de admin (pendientes) tras aprobar/rechazar
  const queryClient = useQueryClient();

  // Query key memoizada para evitar renders innecesarios
  const queryKey = useMemo(() => ([
    'admin-movements',
    pagination.page,
    pagination.limit,
    filters.tipo_especifico,
    filters.estado,
    filters.fecha_desde,
    filters.fecha_hasta,
    filters.search,
    filters.sort,
  ]), [
    pagination.page,
    pagination.limit,
    filters.tipo_especifico,
    filters.estado,
    filters.fecha_desde,
    filters.fecha_hasta,
    filters.search,
    filters.sort,
  ]);

  // Query principal
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    isSuccess,
  } = useQuery({
    queryKey,
    queryFn: () => MovementService.getMovements({
      page: pagination.page,
      limit: pagination.limit,
      tipo_especifico: filters.tipo_especifico || undefined,
      estado: filters.estado || undefined,
      fecha_desde: filters.fecha_desde || undefined,
      fecha_hasta: filters.fecha_hasta || undefined,
      search: filters.search || undefined,
      sort: filters.sort || undefined,
    }),
    keepPreviousData: true,
    staleTime: 30_000,
  });

  // Datos derivados seguros (normalizar campos como 'concepto')
  const movements = (data?.movements || []).map(normalizeMovement);
  const paginationInfo = data?.pagination || {
    page: pagination.page,
    limit: pagination.limit,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  };

  // Acciones UI
  const setPage = useCallback((page) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit) => {
    setPagination({ page: 1, limit });
  }, []);

  const updateFilters = useCallback((partial) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPagination(DEFAULT_PAGINATION);
  }, []);

  // Utilidades
  const downloadVoucher = useCallback(async (movementId) => {
    const blob = await MovementService.downloadVoucher(movementId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voucher-${movementId}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  const getMovementDetail = useCallback(async (movementId) => {
    // Pedir relacionados para que el modal tenga Usuario/Subasta completos sin retraso
    const m = await MovementService.getMovement(movementId, { include: 'user,auction,guarantee,refund' });
    return normalizeMovement(m);
  }, []);

  // Acciones admin
  const approve = useCallback(async (movementId, data = {}) => {
    const res = await MovementService.approveMovement(movementId, data);
    await refetch();
    // Actualizar contador de "Pagos de Garantía" pendientes en el menú
    queryClient.invalidateQueries({ queryKey: ['admin-badge', 'pending-guarantee-payments'] });
    return res;
  }, [refetch, queryClient]);

  const reject = useCallback(async (movementId, data) => {
    const res = await MovementService.rejectMovement(movementId, data);
    await refetch();
    // Actualizar contador de "Pagos de Garantía" pendientes en el menú
    queryClient.invalidateQueries({ queryKey: ['admin-badge', 'pending-guarantee-payments'] });
    return res;
  }, [refetch, queryClient]);

  return {
    // datos
    movements,
    pagination: paginationInfo,
    raw: data,

    // estados
    isLoading,
    isFetching,
    isError,
    error,
    isSuccess,

    // acciones
    refetch,
    setPage,
    setLimit,
    updateFilters,
    resetFilters,
    downloadVoucher,
    getMovementDetail,
    approve,
    reject,

    // estado UI
    filters,
    paginationState: pagination,
  };
}