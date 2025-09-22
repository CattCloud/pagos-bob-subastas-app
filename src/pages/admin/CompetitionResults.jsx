import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import AuctionCard from '../../components/ui/AuctionCard';
import CompetitionResultForm from '../../components/forms/CompetitionResultForm';
import useAuctions from '../../hooks/useAuctions';
import { showToast } from '../../utils/toast';

function CompetitionResults() {
  // Filtrar únicamente subastas finalizadas (según HU-COMP-01)
  const [filters, setFilters] = useState({
    estado: 'finalizada',
    search: '',
    page: 1,
    limit: 20,
  });

  const {
    auctions,
    pagination,
    isLoadingAuctions,
    isErrorAuctions,
    errorAuctions,
    refetchAuctions,
    setCompetitionResult,
    isSettingResult,
  } = useAuctions(filters);

  // Subasta seleccionada para gestionar resultado
  const [selectedAuction, setSelectedAuction] = useState(null);

  const onOpenResultModal = (auction) => {
    setSelectedAuction(auction);
  };

  const onCloseResultModal = () => {
    setSelectedAuction(null);
  };

  const onSubmitResult = async (data) => {
    if (!selectedAuction) return;

    try {
      await setCompetitionResult(selectedAuction.id, data);

      const resultLabels = {
        ganada: 'BOB GANÓ 🏆',
        perdida: 'BOB PERDIÓ ❌',
        penalizada: 'CLIENTE NO PAGÓ VEHÍCULO ⚠️'
      };
      const resultLabel = resultLabels[data.resultado] || data.resultado;
      showToast.success(`Resultado registrado: ${resultLabel}`);
      onCloseResultModal();
      refetchAuctions();
    } catch (err) {
      showToast.error(err?.message || 'Error al registrar resultado de competencia');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Resultados de Competencia</h1>
          <p className="text-text-secondary mt-1">
            Registra el resultado final de subastas con pago de garantía validado (estado: finalizada).
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <Card.Header>
          <Card.Title className="!m-0">Filtros</Card.Title>
        </Card.Header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Estado"
            value={filters.estado}
            onChange={(e) => setFilters((prev) => ({ ...prev, estado: e.target.value, page: 1 }))}
            options={[
              { value: 'finalizada', label: 'Solo finalizadas' },
              { value: 'todos', label: 'Todos' },
              { value: 'activa', label: 'Activa' },
              { value: 'pendiente', label: 'Pendiente' },
              { value: 'en_validacion', label: 'En validación' },
              { value: 'ganada', label: 'Ganada' },
              { value: 'perdida', label: 'Perdida' },
              { value: 'penalizada', label: 'Penalizada' },
            ]}
          />
          <Input
            label="Búsqueda"
            placeholder="Marca, modelo o placa..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
          />
          <Select
            label="Registros por página"
            value={String(filters.limit)}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, limit: Number(e.target.value) || 20, page: 1 }))
            }
            options={[
              { value: '10', label: '10' },
              { value: '20', label: '20' },
              { value: '50', label: '50' },
            ]}
          />
        </div>
      </Card>

      {/* Lista de subastas finalizadas */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between w-full">
            <Card.Title className="!m-0">Subastas elegibles (finalizadas)</Card.Title>
            <Button size="sm" variant="outline" onClick={refetchAuctions}>
              Refrescar
            </Button>
          </div>
        </Card.Header>

        <div className="space-y-4">
          {isLoadingAuctions && (
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

          {!isLoadingAuctions && isErrorAuctions && (
            <div className="p-4 border border-error/30 bg-error/5 text-error rounded-lg text-sm">
              {errorAuctions?.message || 'Error al cargar subastas'}
              <div className="mt-2">
                <Button size="sm" variant="outline" onClick={refetchAuctions}>
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {!isLoadingAuctions && !isErrorAuctions && auctions.length === 0 && (
            <div className="p-8 border border-border rounded-lg text-center text-text-secondary">
              No hay subastas finalizadas para gestionar. Valide pagos pendientes o ajuste filtros.
            </div>
          )}

          {!isLoadingAuctions && !isErrorAuctions && auctions.length > 0 && (
            <div className="space-y-3">
              {auctions.map((a) => (
                <AuctionCard
                  key={a.id}
                  auction={a}
                  actions={[
                    {
                      label: 'Gestionar Resultado',
                      variant: 'primary',
                      onClick: () => onOpenResultModal(a),
                      title: 'Registrar resultado de competencia externa'
                    }
                  ]}
                />
              ))}
            </div>
          )}

          {/* Paginación */}
          {!isLoadingAuctions && !isErrorAuctions && pagination?.total_pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-text-secondary">
                Página {pagination.page} de {pagination.total_pages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page <= 1}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                  }
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page >= (pagination.total_pages || 1)}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      page: Math.min((pagination.total_pages || 1), prev.page + 1),
                    }))
                  }
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Modal: Gestionar Resultado */}
      <Modal
        isOpen={!!selectedAuction}
        onClose={onCloseResultModal}
        title={
          'Resultado Competencia'
        }
        size="xl"
      >
        {selectedAuction && (
          <CompetitionResultForm
            auction={selectedAuction}
            onSubmit={onSubmitResult}
            onCancel={onCloseResultModal}
            isSubmitting={isSettingResult}
          />
        )}
      </Modal>
    </div>
  );
}

export default CompetitionResults;