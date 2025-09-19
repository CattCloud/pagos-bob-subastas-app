import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import MovementService from '../services/movementService';

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

  // Datos derivados seguros
  const movements = data?.movements || [];
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
    return MovementService.getMovement(movementId);
  }, []);

  // Acciones admin
  const approve = useCallback(async (movementId, data = {}) => {
    const res = await MovementService.approveMovement(movementId, data);
    await refetch();
    return res;
  }, [refetch]);

  const reject = useCallback(async (movementId, data) => {
    const res = await MovementService.rejectMovement(movementId, data);
    await refetch();
    return res;
  }, [refetch]);

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