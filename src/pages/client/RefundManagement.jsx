import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaFilter, FaFileAlt, FaDollarSign } from 'react-icons/fa';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import RefundCard from '../../components/ui/RefundCard';
import RefundForm from '../../components/forms/RefundForm';
import Modal from '../../components/ui/Modal';
import useRefunds from '../../hooks/useRefunds';
import useBalance from '../../hooks/useBalance';
import { formatCurrency } from '../../utils/formatters';
import { showToast } from '../../utils/toast';

export default function RefundManagement() {
  const navigate = useNavigate();
  const { balance } = useBalance();
  const [filters, setFilters] = useState({
    estado: 'todos',
    tipo_reembolso: 'todos'
  });
  
  const {
    refunds,
    eligibleAuctions,
    isLoadingRefunds,
    isErrorRefunds,
    errorRefunds,
    refetchRefunds,
    createRefund,
    isCreating
  } = useRefunds(filters);

  const [showCreateForm, setShowCreateForm] = useState(false);

  // Estadísticas del historial
  const stats = {
    total: refunds.length,
    pendientes: refunds.filter(r => ['solicitado', 'confirmado'].includes(r.estado)).length,
    procesados: refunds.filter(r => r.estado === 'procesado').length,
    montoTotal: refunds
      .filter(r => r.estado === 'procesado')
      .reduce((acc, r) => acc + Number(r.monto_solicitado || 0), 0)
  };

  const handleCreateRefund = async (data) => {
    try {
      await createRefund(data);
      showToast.success('Solicitud de reembolso enviada exitosamente');
      setShowCreateForm(false);
      refetchRefunds();
    } catch (error) {
      const message = error?.message || 'Error al crear solicitud de reembolso';
      showToast.error(message);
    }
  };

  const handleViewDetail = (refund) => {
    navigate(`/pago-subastas/refunds/${refund.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header con stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Mis Reembolsos</h1>
          <p className="text-text-secondary mt-1">
            Gestiona tus solicitudes de reembolso y revisa su estado
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setShowCreateForm(true)}
          disabled={!eligibleAuctions.length || (balance?.saldo_disponible || 0) <= 0}
        >
          <FaPlus className="w-4 h-4 mr-2" />
          Nueva Solicitud
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="outlined" padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
            <div className="text-sm text-text-secondary">Total Solicitudes</div>
          </div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{stats.pendientes}</div>
            <div className="text-sm text-text-secondary">En Proceso</div>
          </div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{stats.procesados}</div>
            <div className="text-sm text-text-secondary">Completados</div>
          </div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{formatCurrency(stats.montoTotal)}</div>
            <div className="text-sm text-text-secondary">Monto Procesado</div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Estado"
            value={filters.estado}
            onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
            options={[
              { value: 'todos', label: 'Todos los estados' },
              { value: 'solicitado', label: 'En Revisión' },
              { value: 'confirmado', label: 'Confirmado' },
              { value: 'procesado', label: 'Completado' },
              { value: 'rechazado', label: 'Rechazado' }
            ]}
          />

          <Select
            label="Tipo"
            value={filters.tipo_reembolso}
            onChange={(e) => setFilters(prev => ({ ...prev, tipo_reembolso: e.target.value }))}
            options={[
              { value: 'todos', label: 'Todos los tipos' },
              { value: 'mantener_saldo', label: 'Mantener Saldo' },
              { value: 'devolver_dinero', label: 'Devolver Dinero' }
            ]}
          />
        </div>
      </Card>

      {/* Lista de reembolsos */}
      <Card>
        <Card.Header>
          <Card.Title>Historial de Solicitudes</Card.Title>
        </Card.Header>

        <div className="space-y-4">
          {isLoadingRefunds && (
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

          {!isLoadingRefunds && isErrorRefunds && (
            <div className="p-4 border border-error/30 bg-error/5 text-error rounded-lg text-sm">
              {errorRefunds?.message || 'Error al cargar historial de reembolsos'}
              <div className="mt-2">
                <Button size="sm" variant="outline" onClick={refetchRefunds}>
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {!isLoadingRefunds && !isErrorRefunds && refunds.length === 0 && (
            <div className="p-8 border border-border rounded-lg text-center">
              <FaFileAlt className="w-12 h-12 mx-auto mb-4 text-text-muted" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                No tienes solicitudes de reembolso
              </h3>
              <p className="text-text-secondary mb-4">
                Cuando tengas saldo disponible o BOB pierda una competencia, podrás solicitar reembolsos aquí.
              </p>
              <Button
                variant="primary"
                onClick={() => setShowCreateForm(true)}
                disabled={!eligibleAuctions.length || (balance?.saldo_disponible || 0) <= 0}
              >
                <FaPlus className="w-4 h-4 mr-2" />
                Solicitar Reembolso
              </Button>
            </div>
          )}

          {!isLoadingRefunds && !isErrorRefunds && refunds.length > 0 && (
            <div className="space-y-3">
              {refunds.map((refund) => (
                <RefundCard
                  key={refund.id}
                  refund={refund}
                  onClick={() => handleViewDetail(refund)}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Modal formulario nueva solicitud */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="Nueva Solicitud de Reembolso"
        size="lg"
      >
        <RefundForm
          eligibleAuctions={eligibleAuctions}
          onSubmit={handleCreateRefund}
          onCancel={() => setShowCreateForm(false)}
          isSubmitting={isCreating}
        />
      </Modal>

      {/* Info de saldo actual */}
      {balance && (
        <Card variant="outlined" padding="sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaDollarSign className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium">Saldo Disponible:</span>
              <span className="font-bold text-text-primary">{formatCurrency(balance.saldo_disponible)}</span>
            </div>
            {eligibleAuctions.length > 0 && (
              <span className="text-xs text-success">
                {eligibleAuctions.length} subasta(s) elegible(s) para reembolso
              </span>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}