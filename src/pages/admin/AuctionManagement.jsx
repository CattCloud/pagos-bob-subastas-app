import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import AuctionCard from '../../components/ui/AuctionCard';
import { useForm } from 'react-hook-form';
import useAuctions from '../../hooks/useAuctions';
import { showToast } from '../../utils/toast';
import { FaPlus } from 'react-icons/fa';
import CompetitionResultForm from '../../components/forms/CompetitionResultForm';


function AuctionManagement() {
  const navigate = useNavigate();
  
  // Filtros básicos
  const [filters, setFilters] = useState({
    estado: 'todos',
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
    createAuction,
    isCreating,
  } = useAuctions(filters);

  // Modal crear subasta
  const [showCreate, setShowCreate] = useState(false);

  // Modal gestionar resultado de competencia (migrado desde Resultados de Competencia)
  const [selectedAuction, setSelectedAuction] = useState(null);

  const onOpenResultModal = (auction) => setSelectedAuction(auction);
  const onCloseResultModal = () => setSelectedAuction(null);

  // Formulario creación subasta + activo
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      placa: '',
      empresa_propietaria: '',
      marca: '',
      modelo: '',
      anio: '',
      descripcion: '',
    },
  });

  

  const { setCompetitionResult, isSettingResult } = useAuctions(filters);

  const onCreateAuction = async (data) => {
    try {
      // Payload actualizado: solo datos del activo (sin fechas)
      const payload = {
        asset: {
          placa: data.placa.trim(),
          empresa_propietaria: data.empresa_propietaria.trim(),
          marca: data.marca.trim(),
          modelo: data.modelo.trim(),
          'año': Number(data.anio), // clave con ñ tal como la API
          ...(data.descripcion?.trim() ? { descripcion: data.descripcion.trim() } : {}),
        },
      };

      await createAuction(payload);
      showToast.success(`Subasta de ${payload.asset.marca} ${payload.asset.modelo} ${payload.asset['año']} creada exitosamente`);
      setShowCreate(false);
      reset();
      refetchAuctions();
    } catch (err) {
      showToast.error(err?.message || 'Error al crear subasta');
    }
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

  const estadosOptions = [
    { value: 'todos', label: 'Todos los estados' },
    { value: 'activa', label: 'Activa' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_validacion', label: 'En validación' },
    { value: 'finalizada', label: 'Finalizada' },
    { value: 'ganada', label: 'Ganada' },
    { value: 'perdida', label: 'Perdida' },
    { value: 'penalizada', label: 'Penalizada' },
    { value: 'vencida', label: 'Vencida' },
    { value: 'cancelada', label: 'Cancelada' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Gestión de Subastas</h1>
          <p className="text-text-secondary mt-1">
            Administra subastas, crea nuevas y filtra por estado o búsqueda.
          </p>
        </div>

        <Button className="gap-2" variant="primary" onClick={() => setShowCreate(true)}>
          <FaPlus />
          Nueva Subasta
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <Card.Header>
          <Card.Title>Filtros</Card.Title>
        </Card.Header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Estado"
            value={filters.estado}
            onChange={(e) => setFilters((prev) => ({ ...prev, estado: e.target.value, page: 1 }))}
            options={estadosOptions}
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

      {/* Lista */}
      <Card>
        <Card.Header>
          <Card.Title>Subastas</Card.Title>
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
              No hay subastas registradas. Crea la primera.
            </div>
          )}

          {!isLoadingAuctions && !isErrorAuctions && auctions.length > 0 && (
            <div className="space-y-3">
              {auctions.map((a) => (
                <AuctionCard
                  key={a.id}
                  auction={a}
                  onClick={() => navigate(`/admin-subastas/auctions/${a.id}`)}
                  actions={[
                    {
                      label: 'Ver Detalle',
                      variant: 'outline',
                      onClick: () => navigate(`/admin-subastas/auctions/${a.id}`)
                    },
                    {
                      label: 'Gestionar Resultado',
                      variant: 'primary',
                      disabled: a.estado !== 'finalizada',
                      title: a.estado !== 'finalizada'
                        ? 'Disponible solo cuando la subasta está finalizada'
                        : 'Registrar resultado de competencia externa',
                      onClick: () => onOpenResultModal(a)
                    }
                  ]}
                />
              ))}
            </div>
          )}

          {/* Paginación simple */}
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

      {/* Modal Crear Subasta */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Crear Nueva Subasta"
        size="xl"
      >
        <form onSubmit={handleSubmit(onCreateAuction)} className="space-y-4 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Activo */}
            <Input
              label="Placa"
              placeholder="ABC-123"
              required
              {...register('placa', {
                required: 'Placa es requerida',
                minLength: { value: 5, message: 'Mínimo 5 caracteres' },
              })}
              error={errors.placa?.message}
            />
            <Input
              label="Empresa Propietaria"
              required
              {...register('empresa_propietaria', {
                required: 'Empresa propietaria es requerida',
                minLength: { value: 2, message: 'Mínimo 2 caracteres' },
              })}
              error={errors.empresa_propietaria?.message}
            />
            <Input
              label="Marca"
              required
              {...register('marca', {
                required: 'Marca es requerida',
                minLength: { value: 2, message: 'Mínimo 2 caracteres' },
              })}
              error={errors.marca?.message}
            />
            <Input
              label="Modelo"
              required
              {...register('modelo', {
                required: 'Modelo es requerido',
                minLength: { value: 1, message: 'Mínimo 1 caracter' },
              })}
              error={errors.modelo?.message}
            />
            <Input
              label="Año"
              type="number"
              placeholder="2020"
              required
              min={1990}
              {...register('anio', {
                required: 'Año es requerido',
                min: { value: 1990, message: 'Año mínimo 1990' },
                max: { value: new Date().getFullYear() + 1, message: 'Año demasiado alto' },
                validate: (v) => String(v).length === 4 || 'Debe ser un año de 4 dígitos',
              })}
              error={errors.anio?.message}
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-2">Descripción (opcional)</label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Información adicional del activo"
                {...register('descripcion', {
                  maxLength: { value: 500, message: 'Máximo 500 caracteres' },
                })}
              />
              {errors.descripcion?.message && (
                <p className="text-sm text-error mt-1">{errors.descripcion.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={!isValid || isCreating} loading={isCreating}>
              Registrar Subasta
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Gestionar Resultado de Competencia (migrado desde Resultados de Competencia) */}
      <Modal
        isOpen={!!selectedAuction}
        onClose={onCloseResultModal}
        title="Resultado Competencia"
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

export default AuctionManagement;