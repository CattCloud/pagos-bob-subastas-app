import { useState } from 'react';
import { FaFilter, FaPhone, FaCheck, FaTimes, FaCogs, FaEye } from 'react-icons/fa';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import RefundCard from '../../components/ui/RefundCard';
import FileUpload from '../../components/forms/FileUpload';
import { LoadingState, ErrorState, EmptyState } from '../../components/ui/states';
import useRefunds from '../../hooks/useRefunds';
import { formatCurrency, formatRelativeDate } from '../../utils/formatters';
import { showToast } from '../../utils/toast';

export default function AdminRefundManagement() {
  const [filters, setFilters] = useState({
    estado: 'todos',
    search: ''
  });

  const {
    allRefunds,
    isLoadingAllRefunds,
    isErrorAllRefunds,
    errorAllRefunds,
    refetchAllRefunds,
    manageRefund,
    processRefund,
    isManaging,
    isProcessing
  } = useRefunds(filters);

  const [selectedRefund, setSelectedRefund] = useState(null);
  const [action, setAction] = useState(null); // 'confirm', 'reject', 'process'
  const [formData, setFormData] = useState({
    motivo: '',
    numero_operacion: '',
    voucher: null,
    tipo_transferencia: 'transferencia',
    banco_destino: '',
    numero_cuenta_destino: ''
  });

  // Estadísticas
  const stats = {
    total: allRefunds.length,
    solicitados: allRefunds.filter(r => r.estado === 'solicitado').length,
    confirmados: allRefunds.filter(r => r.estado === 'confirmado').length,
    procesados: allRefunds.filter(r => r.estado === 'procesado').length,
    rechazados: allRefunds.filter(r => r.estado === 'rechazado').length
  };

  const handleConfirm = async () => {
    if (!selectedRefund || !formData.motivo.trim()) {
      showToast.error('El motivo de confirmación es requerido');
      return;
    }

    try {
      await manageRefund(selectedRefund.id, {
        estado: 'confirmado',
        motivo: formData.motivo
      });
      showToast.success('Solicitud confirmada exitosamente');
      closeModal();
      refetchAllRefunds();
    } catch (error) {
      showToast.error(error?.message || 'Error al confirmar solicitud');
    }
  };

  const handleReject = async () => {
    if (!selectedRefund || !formData.motivo.trim()) {
      showToast.error('El motivo de rechazo es requerido');
      return;
    }

    try {
      await manageRefund(selectedRefund.id, {
        estado: 'rechazado',
        motivo: formData.motivo
      });
      showToast.success('Solicitud rechazada');
      closeModal();
      refetchAllRefunds();
    } catch (error) {
      showToast.error(error?.message || 'Error al rechazar solicitud');
    }
  };

  const handleProcess = async () => {
    if (!selectedRefund) return;

    try {
      // Nuevo flujo: único tipo = devolver_dinero
      if (!formData.numero_operacion.trim()) {
        showToast.error('Número de operación es requerido para procesar la devolución de dinero');
        return;
      }

      const form = new FormData();
      // Obligatorio
      form.append('numero_operacion', formData.numero_operacion.trim());
      // Opcionales (según contrato de API)
      if (formData.tipo_transferencia) {
        form.append('tipo_transferencia', formData.tipo_transferencia);
      }
      if (formData.banco_destino?.trim()) {
        form.append('banco_destino', formData.banco_destino.trim());
      }
      if (formData.numero_cuenta_destino?.trim()) {
        form.append('numero_cuenta_destino', formData.numero_cuenta_destino.trim());
      }
      if (formData.voucher) {
        form.append('voucher', formData.voucher, formData.voucher.name);
      }

      await processRefund(selectedRefund.id, form);
      showToast.success('Reembolso procesado exitosamente (dinero transferido)');

      closeModal();
      refetchAllRefunds();
    } catch (error) {
      showToast.error(error?.message || 'Error al procesar reembolso');
    }
  };

  const openModal = (refund, actionType) => {
    setSelectedRefund(refund);
    setAction(actionType);
    setFormData({
      motivo: '',
      numero_operacion: '',
      voucher: null,
      tipo_transferencia: 'transferencia',
      banco_destino: '',
      numero_cuenta_destino: ''
    });
  };

  const closeModal = () => {
    setSelectedRefund(null);
    setAction(null);
    setFormData({ motivo: '', numero_operacion: '', voucher: null });
  };

  const getActionButton = (refund) => {
    switch (refund.estado) {
      case 'solicitado':
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="success"
              onClick={(e) => {
                e.stopPropagation();
                openModal(refund, 'confirm');
              }}
            >
              <FaCheck className="w-4 h-4 mr-1" />
              Confirmar
            </Button>
            <Button
              size="sm"
              variant="error"
              onClick={(e) => {
                e.stopPropagation();
                openModal(refund, 'reject');
              }}
            >
              <FaTimes className="w-4 h-4 mr-1" />
              Rechazar
            </Button>
          </div>
        );
      case 'confirmado':
        return (
          <Button
            size="sm"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              openModal(refund, 'process');
            }}
          >
            <FaCogs className="w-4 h-4 mr-1" />
            Procesar
          </Button>
        );
      
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Gestión de Reembolsos</h1>
          <p className="text-text-secondary mt-1">
            Administra las solicitudes de reembolso de los clientes
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card variant="outlined" padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
            <div className="text-sm text-text-secondary">Total</div>
          </div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{stats.solicitados}</div>
            <div className="text-sm text-text-secondary">Pendientes</div>
          </div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-info">{stats.confirmados}</div>
            <div className="text-sm text-text-secondary">Confirmados</div>
          </div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{stats.procesados}</div>
            <div className="text-sm text-text-secondary">Procesados</div>
          </div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-error">{stats.rechazados}</div>
            <div className="text-sm text-text-secondary">Rechazados</div>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Estado"
            value={filters.estado}
            onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
            options={[
              { value: 'todos', label: 'Todos los estados' },
              { value: 'solicitado', label: 'Pendientes de Confirmación' },
              { value: 'confirmado', label: 'Confirmados (a procesar)' },
              { value: 'procesado', label: 'Procesados' },
              { value: 'rechazado', label: 'Rechazados' }
            ]}
          />


          <Input
            label="Buscar Cliente"
            placeholder="Nombre, documento..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
      </Card>

      {/* Lista de solicitudes */}
      <Card>
        <Card.Header>
          <Card.Title>Solicitudes de Reembolso</Card.Title>
        </Card.Header>

        <div className="space-y-4">
          {isLoadingAllRefunds && (
            <LoadingState
              type="skeleton"
              count={4}
              message="Cargando solicitudes de reembolso..."
            />
          )}

          {!isLoadingAllRefunds && isErrorAllRefunds && (
            <ErrorState
              type="general"
              title="Error al cargar solicitudes"
              message={errorAllRefunds?.message || 'Error al cargar solicitudes de reembolso'}
              error={errorAllRefunds}
              onRetry={refetchAllRefunds}
              compact
            />
          )}

          {!isLoadingAllRefunds && !isErrorAllRefunds && allRefunds.length === 0 && (
            <EmptyState
              type="refunds"
              title="Sin solicitudes de reembolso"
              message="No hay solicitudes de reembolso para gestionar en este momento."
              compact
            />
          )}

          {!isLoadingAllRefunds && !isErrorAllRefunds && allRefunds.length > 0 && (
            <div className="space-y-3">
              {allRefunds.map((refund) => (
                <div key={refund.id} className="relative">
                  <RefundCard
                    refund={refund}
                    showClientInfo={true}
                    onClick={() => {/* Ver detalle si implementamos */}}
                  />
                  
                  {/* Botones de acción superpuestos */}
                  <div className="absolute top-4 right-4">
                    {getActionButton(refund)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Modal para acciones */}
      <Modal
        isOpen={!!selectedRefund}
        onClose={closeModal}
        title={
          action === 'confirm' ? 'Confirmar Solicitud de Reembolso' :
          action === 'reject' ? 'Rechazar Solicitud de Reembolso' :
          action === 'process' ? 'Procesar Reembolso' : 'Gestionar Solicitud'
        }
        size="lg"
      >
        {selectedRefund && (
          <div className="space-y-4 p-2">
            {/* Información de la solicitud */}
            <Card variant="outlined" padding="sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-text-secondary">Cliente:</p>
                  <p className="font-semibold">
                    {(selectedRefund?.related?.user?.first_name || selectedRefund?.user?.first_name) || '—'} {(selectedRefund?.related?.user?.last_name || selectedRefund?.user?.last_name) || ''}
                  </p>
                  <p className="text-text-muted">
                    {(selectedRefund?.related?.user?.document_type || selectedRefund?.user?.document_type) || ''} {(selectedRefund?.related?.user?.document_number || selectedRefund?.user?.document_number) || ''}
                  </p>
                </div>
                <div>
                  <p className="text-text-secondary">Monto Solicitado:</p>
                  <p className="font-bold text-lg">{formatCurrency(Number(selectedRefund.monto_solicitado || 0))}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Solicitado:</p>
                  <p className="font-medium">{formatRelativeDate(selectedRefund.created_at)}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-text-secondary">Motivo del cliente:</p>
                  <p className="text-text-primary mt-1 p-2 bg-bg-secondary rounded">
                    {selectedRefund.motivo}
                  </p>
                </div>
              </div>
            </Card>

            {/* Campos específicos por acción */}
            {(action === 'confirm' || action === 'reject') && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {action === 'confirm' ? 'Motivo de Confirmación' : 'Motivo de Rechazo'} <span className="text-error">*</span>
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-primary-500 focus:border-primary-500"
                  rows="3"
                  placeholder={
                    action === 'confirm' 
                      ? 'Ej. Cliente confirmó telefónicamente el tipo de reembolso'
                      : 'Ej. Saldo insuficiente, información incorrecta...'
                  }
                  value={formData.motivo}
                  onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                />
              </div>
            )}

            {action === 'process' && (
              <div className="space-y-4">
                <Select
                  label="Tipo de Transferencia"
                  value={formData.tipo_transferencia}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo_transferencia: e.target.value }))}
                  options={[
                    { value: 'transferencia', label: 'Transferencia bancaria' },
                    { value: 'deposito', label: 'Depósito en cuenta' }
                  ]}
                />

                <Input
                  label="Banco Destino (opcional)"
                  placeholder="Ej. BCP, BBVA, Scotiabank"
                  value={formData.banco_destino}
                  onChange={(e) => setFormData(prev => ({ ...prev, banco_destino: e.target.value }))}
                />

                <Input
                  label="Número de Cuenta Destino (opcional)"
                  placeholder="Ej. 001-1234567890"
                  value={formData.numero_cuenta_destino}
                  onChange={(e) => setFormData(prev => ({ ...prev, numero_cuenta_destino: e.target.value }))}
                />

                <Input
                  label="Número de Operación"
                  placeholder="Ej. OP-REF-123456"
                  required
                  value={formData.numero_operacion}
                  onChange={(e) => setFormData(prev => ({ ...prev, numero_operacion: e.target.value }))}
                />

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Comprobante de Transferencia
                  </label>
                  <FileUpload
                    value={formData.voucher}
                    onChange={(file) => setFormData(prev => ({ ...prev, voucher: file }))}
                    description="PDF, JPG o PNG. Máximo 5MB."
                    required={false}
                  />
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              
              {action === 'confirm' && (
                <Button 
                  variant="success" 
                  onClick={handleConfirm}
                  disabled={!formData.motivo.trim() || isManaging}
                  loading={isManaging}
                >
                  <FaCheck className="w-4 h-4 mr-2" />
                  Confirmar Solicitud
                </Button>
              )}

              {action === 'reject' && (
                <Button 
                  variant="error" 
                  onClick={handleReject}
                  disabled={!formData.motivo.trim() || isManaging}
                  loading={isManaging}
                >
                  <FaTimes className="w-4 h-4 mr-2" />
                  Rechazar Solicitud
                </Button>
              )}

              {action === 'process' && (
                <Button
                  variant="primary"
                  onClick={handleProcess}
                  disabled={!formData.numero_operacion.trim() || isProcessing}
                  loading={isProcessing}
                >
                  <FaCogs className="w-4 h-4 mr-2" />
                  Procesar Reembolso
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}