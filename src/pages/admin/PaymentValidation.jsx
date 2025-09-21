import { useEffect, useState, useMemo } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TransactionFilters from '../../components/ui/transactions/TransactionFilters';
import TransactionCard from '../../components/ui/transactions/TransactionCard';
import TransactionDetail from '../../components/ui/transactions/TransactionDetail';
import Modal from '../../components/ui/Modal';
import useAdminMovements from '../../hooks/useAdminMovements';
import { showToast } from '../../utils/toast';

const REJECT_REASONS = [
  'Monto incorrecto',
  'Comprobante ilegible',
  'Número de operación inválido',
  'Fecha inválida',
  'No coincide con 8%',
];

function PaymentValidation() {
  // Hook principal (admin): por defecto enfocado en pagos de garantía pendientes
  const {
    movements,
    pagination,
    filters,
    updateFilters,
    setPage,
    setLimit,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    downloadVoucher,
    getMovementDetail,
    approve,
    reject,
  } = useAdminMovements({
    filters: {
      tipo_especifico: 'pago_garantia',
      estado: '',
    },
    pagination: {
      page: 1,
      limit: 10,
    },
  });

  // Detalle de movimiento seleccionado
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedMovementId, setSelectedMovementId] = useState(null);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [downloading, setDownloading] = useState(false);

  // Estados para acciones
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveComments, setApproveComments] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReasons, setRejectReasons] = useState([]);
  const [rejectOther, setRejectOther] = useState('');
  const [rejectComments, setRejectComments] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Cargar detalle cuando se abre el modal
  useEffect(() => {
    const loadDetail = async () => {
      if (!selectedMovementId) return;
      try {
        const detail = await getMovementDetail(selectedMovementId);
        setSelectedMovement(detail);
      } catch (e) {
        showToast.error(e?.message || 'Error al cargar detalle del movimiento');
        setSelectedMovement(null);
      }
    };
    if (detailOpen && selectedMovementId) {
      loadDetail();
    }
  }, [detailOpen, selectedMovementId, getMovementDetail]);

  const handleOpenDetail = (movementId) => {
    setSelectedMovementId(movementId);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedMovementId(null);
    setSelectedMovement(null);
  };

  const handleDownloadVoucher = async () => {
    if (!selectedMovementId) return;
    try {
      setDownloading(true);
      await downloadVoucher(selectedMovementId);
      setDownloading(false);
    } catch (e) {
      setDownloading(false);
      showToast.error(e?.message || 'Error al descargar comprobante');
    }
  };

  // Aprobar
  const handleApproveClick = () => {
    setApproveComments('');
    setApproveOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedMovementId) return;
    try {
      setIsApproving(true);
      await approve(selectedMovementId, approveComments ? { comentarios: approveComments } : {});
      setIsApproving(false);
      setApproveOpen(false);
      showToast.success('Movimiento aprobado exitosamente');
      // Refrescar listado y detalle
      await refetch();
      // Volver a cargar detalle por si cambió estado
      if (detailOpen) {
        const detail = await getMovementDetail(selectedMovementId);
        setSelectedMovement(detail);
      }
    } catch (e) {
      setIsApproving(false);
      showToast.error(e?.message || 'Error al aprobar movimiento');
    }
  };

  // Rechazar
  const handleRejectClick = () => {
    setRejectReasons([]);
    setRejectOther('');
    setRejectComments('');
    setRejectOpen(true);
  };

  const toggleRejectReason = (reason) => {
    setRejectReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleConfirmReject = async () => {
    if (!selectedMovementId) return;
    if (rejectReasons.length === 0 && !rejectOther.trim()) {
      showToast.error('Seleccione al menos un motivo o ingrese otro motivo');
      return;
    }
    try {
      setIsRejecting(true);
      const payload = {
        motivos: rejectReasons,
        ...(rejectOther.trim() ? { otros_motivos: rejectOther.trim() } : {}),
        ...(rejectComments.trim() ? { comentarios: rejectComments.trim() } : {}),
      };
      await reject(selectedMovementId, payload);
      setIsRejecting(false);
      setRejectOpen(false);
      showToast.success('Movimiento rechazado');
      // Refrescar listado y detalle
      await refetch();
      if (detailOpen) {
        const detail = await getMovementDetail(selectedMovementId);
        setSelectedMovement(detail);
      }
    } catch (e) {
      setIsRejecting(false);
      showToast.error(e?.message || 'Error al rechazar movimiento');
    }
  };

  // Orden personalizado: pendiente -> validado -> resto (por fecha desc)
  const sortedMovements = useMemo(() => {
    const rank = (estado) => (estado === 'pendiente' ? 0 : estado === 'validado' ? 1 : 2);
    return [...(movements || [])].sort((a, b) => {
      const ra = rank(a?.estado || '');
      const rb = rank(b?.estado || '');
      if (ra !== rb) return ra - rb;
      const da = new Date(a?.created_at || 0).getTime();
      const db = new Date(b?.created_at || 0).getTime();
      return db - da; // reciente primero
    });
  }, [movements]);

  // Render
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Pagos de Garantía</h1>
          <p className="text-text-secondary mt-1">
            Consulta y gestiona todos los pagos de garantía del sistema.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} loading={isFetching}>
            Refrescar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <TransactionFilters
        showType={false}
        value={{
          tipo_especifico: filters.tipo_especifico,
          estado: filters.estado,
          fecha_desde: filters.fecha_desde,
          fecha_hasta: filters.fecha_hasta,
          search: filters.search,
          sort: filters.sort,
          limit: pagination.limit,
        }}
        onChange={(v) => {
          updateFilters({
            tipo_especifico: 'pago_garantia',
            estado: v.estado,
            fecha_desde: v.fecha_desde,
            fecha_hasta: v.fecha_hasta,
            search: v.search,
            sort: v.sort,
          });
          setLimit(v.limit);
        }}
        onReset={() => {
          updateFilters({
            tipo_especifico: 'pago_garantia',
            estado: '',
            fecha_desde: '',
            fecha_hasta: '',
            search: '',
            sort: 'created_at:desc',
          });
          setLimit(10);
        }}
        disabled={isLoading || isFetching}
      />

      {/* Lista de movimientos */}
      <Card>
        <Card.Header>
          <Card.Title>Pagos de Garantía</Card.Title>
        </Card.Header>

        <div className="space-y-4">
          {isLoading && (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border border-border rounded-lg animate-pulse">
                  <div className="h-4 bg-border rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-border rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-border rounded w-1/3"></div>
                </div>
              ))}
            </>
          )}

          {!isLoading && isError && (
            <div className="p-4 border border-error/30 bg-error/5 text-error rounded-lg text-sm">
              {error?.message || 'Error al cargar movimientos'}
              <div className="mt-2">
                <Button size="sm" variant="outline" onClick={() => refetch()}>
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !isError && movements.length === 0 && (
            <div className="p-8 border border-border rounded-lg text-center text-text-secondary">
              No hay movimientos que coincidan con los filtros.
            </div>
          )}

          {!isLoading && !isError && movements.length > 0 && (
            <div className="space-y-3">
              {sortedMovements.map((m) => (
                <TransactionCard key={m.id} movement={m} onDetail={() => handleOpenDetail(m.id)} />
              ))}
            </div>
          )}

          {/* Paginación */}
          {!isLoading && !isError && pagination?.total_pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-text-secondary">
                Página {pagination.page} de {pagination.total_pages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage(Math.max(1, pagination.page - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= (pagination.total_pages || 1)}
                  onClick={() => setPage(Math.min((pagination.total_pages || 1), pagination.page + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de Detalle */}
      <TransactionDetail
        isOpen={detailOpen}
        onClose={handleCloseDetail}
        movement={selectedMovement}
        onDownloadVoucher={handleDownloadVoucher}
        downloading={downloading}
        onApprove={handleApproveClick}
        onReject={handleRejectClick}
        isApproving={isApproving}
        isRejecting={isRejecting}
      />

      {/* Modal Aprobar */}
      <Modal
        isOpen={approveOpen}
        onClose={() => setApproveOpen(false)}
        title="Aprobar Movimiento"
        size="md"
      >
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            Confirmar aprobación del pago de garantía. Puedes incluir comentarios (opcional).
          </p>
          <label className="block text-sm font-medium text-text-primary">Comentarios (opcional)</label>
          <textarea
            className="w-full px-3 py-2 border border-border rounded-md focus:ring-primary-500 focus:border-primary-500"
            rows={3}
            value={approveComments}
            onChange={(e) => setApproveComments(e.target.value)}
            placeholder="Ej. Pago verificado en cuenta bancaria"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Cancelar
            </Button>
            <Button variant="success" onClick={handleConfirmApprove} loading={isApproving}>
              Aprobar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Rechazar */}
      <Modal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Rechazar Movimiento"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-text-secondary mb-2">
              Selecciona al menos un motivo o escribe otro motivo.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {REJECT_REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={rejectReasons.includes(r)}
                    onChange={() => toggleRejectReason(r)}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">Otro motivo (opcional)</label>
            <input
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Describe otro motivo"
              value={rejectOther}
              onChange={(e) => setRejectOther(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary">Comentarios (opcional)</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              placeholder="Observaciones adicionales"
              value={rejectComments}
              onChange={(e) => setRejectComments(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
            <Button variant="error" onClick={handleConfirmReject} loading={isRejecting}>
              Rechazar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default PaymentValidation;