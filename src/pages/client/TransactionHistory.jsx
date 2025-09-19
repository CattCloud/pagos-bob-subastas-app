import { useState, useMemo } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TransactionFilters from '../../components/ui/transactions/TransactionFilters';
import TransactionCard from '../../components/ui/transactions/TransactionCard';
import TransactionDetail from '../../components/ui/transactions/TransactionDetail';
import useMovements from '../../hooks/useMovements';
import { FaChevronLeft, FaChevronRight, FaSync } from 'react-icons/fa';

function Pagination({ pagination, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-text-secondary">
        Página {pagination.page} de {pagination.total_pages || 1} • Total {pagination.total || 0} items
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onPrev} 
          disabled={!pagination.has_prev}
        >
          <FaChevronLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onNext} 
          disabled={!pagination.has_next}
        >
          Siguiente
          <FaChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

export default function TransactionHistory() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState(null);

  const {
    movements,
    pagination,
    paginationState,
    filters,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    setPage,
    setLimit,
    updateFilters,
    resetFilters,
    downloadVoucher,
    getMovementDetail,
  } = useMovements({
    pagination: { page: 1, limit: 10 },
    filters: { sort: 'created_at:desc' },
  });

  const handleApplyFilters = (values) => {
    if (values.limit && values.limit !== paginationState.limit) {
      setLimit(Number(values.limit));
    }
    updateFilters(values);
  };

  const handleResetFilters = () => {
    resetFilters();
  };

  const handlePrev = () => {
    if (pagination.page > 1) setPage(pagination.page - 1);
  };

  const handleNext = () => {
    if (pagination.has_next) setPage(pagination.page + 1);
  };

  const openDetail = async (movementId) => {
    setDetailLoading(true);
    try {
      const data = await getMovementDetail(movementId);
      setSelectedMovement(data);
      setDetailOpen(true);
    } catch (e) {
      console.error('Error abriendo detalle:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownloadVoucher = async () => {
    if (!selectedMovement?.id) return;
    try {
      setDetailLoading(true);
      await downloadVoucher(selectedMovement.id);
    } catch (e) {
      console.error('Error descargando voucher:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const emptyState = useMemo(() => (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 rounded-full bg-bg-tertiary border border-border flex items-center justify-center mb-4">
        <div className="w-8 h-8 rounded-full bg-border" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary">Sin transacciones</h3>
      <p className="text-sm text-text-secondary mt-1">
        Aún no registras movimientos o no hay resultados con los filtros actuales.
      </p>
      <div className="mt-4">
        <Button variant="outline" onClick={handleResetFilters}>
          Limpiar filtros
        </Button>
      </div>
    </div>
  ), []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Historial de Transacciones</h1>
          <p className="text-text-secondary mt-1">
            Consulta tus movimientos con filtros avanzados y detalles.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            loading={isFetching}
          >
            <FaSync className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      <TransactionFilters
        value={{
          tipo_especifico: filters.tipo_especifico,
          estado: filters.estado,
          fecha_desde: filters.fecha_desde,
          fecha_hasta: filters.fecha_hasta,
          search: filters.search,
          sort: filters.sort,
          limit: paginationState.limit,
        }}
        onChange={handleApplyFilters}
        onReset={handleResetFilters}
        disabled={isLoading || isFetching}
      />

      {isError && (
        <Card variant="error" title="Error al cargar transacciones">
          <div className="text-sm text-error">
            {error?.message || 'Ocurrió un error al obtener tus movimientos.'}
          </div>
          <div className="mt-4">
            <Button variant="error" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title>Resultados</Card.Title>
            <div className="text-xs text-text-secondary">
              {isFetching ? 'Actualizando…' : ''}
            </div>
          </div>
        </Card.Header>

        <div className="space-y-3">
          {isLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border border-border rounded-lg animate-pulse">
                  <div className="h-4 bg-border rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-border rounded w-1/2 mb-1"></div>
                  <div className="h-3 bg-border rounded w-1/3"></div>
                </div>
              ))}
            </>
          ) : movements.length === 0 ? (
            emptyState
          ) : (
            movements.map((m) => (
              <TransactionCard key={m.id} movement={m} onDetail={openDetail} />
            ))
          )}
        </div>

        {movements.length > 0 && (
          <div className="mt-6">
            <Pagination 
              pagination={pagination} 
              onPrev={handlePrev} 
              onNext={handleNext} 
            />
          </div>
        )}
      </Card>

      <TransactionDetail
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        movement={selectedMovement}
        onDownloadVoucher={handleDownloadVoucher}
        downloading={detailLoading}
      />
    </div>
  );
}