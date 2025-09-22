import React, { useMemo, useState } from 'react';
import { FaFilter } from 'react-icons/fa';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import BillingCard from '../../components/ui/BillingCard';
import BillingCompleteForm from '../../components/forms/BillingCompleteForm';
import useBilling from '../../hooks/useBilling';

/**
 * Gestión de Facturación (FASE 9)
 * - Lista global de billings (admin)
 * - Filtros: rango de fechas, estado (pendiente/completa), búsqueda
 * - Acción "Completar (Admin)" mediante modal con BillingCompleteForm
 */
export default function BillingManagement() {
  const [filters, setFilters] = useState({
    estado: 'todos', // pendiente | completa | todos (computado en frontend)
    search: '',
    fecha_desde: '',
    fecha_hasta: '',
  });

  const {
    allBillings,
    isLoadingAllBillings,
    isErrorAllBillings,
    errorAllBillings,
    refetchAllBillings,
  } = useBilling(
    {},
    {
      fecha_desde: filters.fecha_desde || undefined,
      fecha_hasta: filters.fecha_hasta || undefined,
      estado: filters.estado || undefined, // si el backend soporta estado, se envía; de todas formas filtramos local
      search: filters.search || undefined,
    }
  );

  const [selectedBilling, setSelectedBilling] = useState(null);
  const [open, setOpen] = useState(false);

  const openCompleteModal = (billing) => {
    setSelectedBilling(billing);
    setOpen(true);
  };

  const closeCompleteModal = () => {
    setOpen(false);
    setSelectedBilling(null);
  };

  const displayedBillings = useMemo(() => {
    const term = (filters.search || '').trim().toLowerCase();
    return (allBillings || []).filter((b) => {
      const isPending = !b?.billing_document_type || !b?.billing_document_number || !b?.billing_name;
      if (filters.estado === 'pendiente' && !isPending) return false;
      if (filters.estado === 'completa' && isPending) return false;

      if (!term) return true;

      const a = b?.related?.auction || {};
      const u = b?.related?.user || {};
      const placa = (a.placa || '').toLowerCase();
      const vehiculo = [a.marca, a.modelo, a.año].filter(Boolean).join(' ').toLowerCase();
      const empresa = (a.empresa_propietaria || '').toLowerCase();
      const cliente = `${u.first_name || ''} ${u.last_name || ''} ${u.document_type || ''} ${u.document_number || ''}`.toLowerCase();

      return (
        placa.includes(term) ||
        vehiculo.includes(term) ||
        empresa.includes(term) ||
        cliente.includes(term)
      );
    });
  }, [allBillings, filters.estado, filters.search]);

  const stats = useMemo(() => {
    const total = (allBillings || []).length;
    const pendientes = (allBillings || []).filter(
      (b) => !b?.billing_document_type || !b?.billing_document_number || !b?.billing_name
    ).length;
    const completas = total - pendientes;
    return { total, pendientes, completas };
  }, [allBillings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-text-primary">Gestión de Facturación</h1>
        <p className="text-text-secondary mt-1">
          Administra todas las facturaciones generadas por subastas ganadas. Puedes completar los datos
          de facturación del cliente cuando estén pendientes.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="outlined" padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
            <div className="text-sm text-text-secondary">Total</div>
          </div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{stats.pendientes}</div>
            <div className="text-sm text-text-secondary">Pendientes</div>
          </div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{stats.completas}</div>
            <div className="text-sm text-text-secondary">Completadas</div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <FaFilter className="w-4 h-4 text-primary-600" />
            <Card.Title className="!m-0">Filtros</Card.Title>
          </div>
        </Card.Header>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Select
            label="Estado"
            value={filters.estado}
            onChange={(e) => setFilters((prev) => ({ ...prev, estado: e.target.value }))}
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'pendiente', label: 'Pendientes' },
              { value: 'completa', label: 'Completadas' },
            ]}
          />

          <Input
            label="Buscar"
            placeholder="Placa, vehículo, empresa, cliente, documento..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          />

          <Input
            label="Desde"
            type="date"
            value={filters.fecha_desde}
            onChange={(e) => setFilters((prev) => ({ ...prev, fecha_desde: e.target.value }))}
          />

          <Input
            label="Hasta"
            type="date"
            value={filters.fecha_hasta}
            onChange={(e) => setFilters((prev) => ({ ...prev, fecha_hasta: e.target.value }))}
          />

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() =>
                setFilters({ estado: 'todos', search: '', fecha_desde: '', fecha_hasta: '' })
              }
            >
              Limpiar
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista */}
      <Card>
        <Card.Header>
          <Card.Title className="!m-0">Facturaciones</Card.Title>
        </Card.Header>

        <div className="space-y-4">
          {isLoadingAllBillings && (
            <>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 border border-border rounded-lg animate-pulse">
                  <div className="h-4 bg-border rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-border rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-border rounded w-1/3"></div>
                </div>
              ))}
            </>
          )}

          {!isLoadingAllBillings && isErrorAllBillings && (
            <div className="p-4 border border-error/30 bg-error/5 text-error rounded-lg text-sm">
              {errorAllBillings?.message || 'Error al cargar facturaciones'}
              <div className="mt-2">
                <Button size="sm" variant="outline" onClick={refetchAllBillings}>
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {!isLoadingAllBillings && !isErrorAllBillings && displayedBillings.length === 0 && (
            <div className="p-8 border border-border rounded-lg text-center text-text-secondary">
              No hay facturaciones para mostrar.
            </div>
          )}

          {!isLoadingAllBillings && !isErrorAllBillings && displayedBillings.length > 0 && (
            <div className="space-y-3">
              {displayedBillings.map((billing) => (
                <BillingCard
                  key={billing.id}
                  billing={billing}
                  basePath="/admin-subastas"
                  showUser
                  showCompleteAction
                  onCompleteClick={openCompleteModal}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Modal Completar (Admin) */}
      <Modal
        isOpen={open}
        onClose={closeCompleteModal}
        title="Completar Datos de Facturación (Admin)"
        size="lg"
      >
        {selectedBilling && (
          <div className="p-2">
            <BillingCompleteForm
              billing={selectedBilling}
              mode="admin"
              onSuccess={async () => {
                closeCompleteModal();
                await refetchAllBillings();
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}