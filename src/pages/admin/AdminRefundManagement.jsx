import { useState } from 'react';
import { FaFilter, FaPhone, FaCheck, FaTimes, FaCogs, FaEye } from 'react-icons/fa';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import RefundCard from '../../components/ui/RefundCard';
import FileUpload from '../../components/forms/FileUpload';
import useRefunds from '../../hooks/useRefunds';
import { formatCurrency, formatRelativeDate } from '../../utils/formatters';
import { showToast } from '../../utils/toast';

export default function AdminRefundManagement() {
  const [filters, setFilters] = useState({
    estado: 'todos',
    tipo_reembolso: 'todos',
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
    voucher: null
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
      if (selectedRefund.tipo_reembolso === 'mantener_saldo') {
        // Proceso simple sin archivo
        await processRefund(selectedRefund.id, {});
        showToast.success('Reembolso procesado exitosamente (saldo agregado)');
      } else {
        // devolver_dinero: requiere número de operación y voucher
        if (!formData.numero_operacion.trim()) {
          showToast.error('Número de operación es requerido para devolución de dinero');
          return;
        }

        const form = new FormData();
        form.append('tipo_transferencia', 'transferencia');
        form.append('numero_operacion', formData.numero_operacion);
        if (formData.voucher) {
          form.append('voucher', formData.voucher, formData.voucher.name);
        }

        await processRefund(selectedRefund.id, form);
        showToast.success('Reembolso procesado exitosamente (dinero transferido)');
      }
      
      closeModal();
      refetchAllRefunds();
    } catch (error) {
      showToast.error(error?.message || 'Error al procesar reembolso');
    }
  };

  const openModal = (refund, actionType) => {
    setSelectedRefund(refund);
    setAction(actionType);
    setFormData({ motivo: '', numero_operacion: '', voucher: null });
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
      default:
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => e.stopPropagation()}
          >
            <FaEye className="w-4 h-4" />
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

          {!isLoadingAllRefunds && isErrorAllRefunds && (
            <div className="p-4 border border-error/30 bg-error/5 text-error rounded-lg text-sm">
              {errorAllRefunds?.message || 'Error al cargar solicitudes de reembolso'}
              <div className="mt-2">
                <Button size="sm" variant="outline" onClick={refetchAllRefunds}>
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {!isLoadingAllRefunds && !isErrorAllRefunds && allRefunds.length === 0 && (
            <div className="p-8 border border-border rounded-lg text-center text-text-secondary">
              No hay solicitudes de reembolso para gestionar.
            </div>
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
          <div className="space-y-4">
            {/* Información de la solicitud */}
            <Card variant="outlined" padding="sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-text-secondary">Cliente:</p>
                  <p className="font-semibold">
                    {selectedRefund.user?.first_name} {selectedRefund.user?.last_name}
                  </p>
                  <p className="text-text-muted">
                    {selectedRefund.user?.document_type} {selectedRefund.user?.document_number}
                  </p>
                </div>
                <div>
                  <p className="text-text-secondary">Monto Solicitado:</p>
                  <p className="font-bold text-lg">{formatCurrency(Number(selectedRefund.monto_solicitado || 0))}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Tipo:</p>
                  <p className="font-medium">{selectedRefund.tipo_reembolso === 'mantener_saldo' ? 'Mantener Saldo' : 'Devolver Dinero'}</p>
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
                {selectedRefund.tipo_reembolso === 'devolver_dinero' && (
                  <>
                    <Input
                      label="Número de Operación"
                      placeholder="Ej. OP-REF-123456"
                      required
                      value={formData.numero_operacion}
                      onChange={(e) => setFormData(prev => ({ ...prev, numero_operacion: e.target.value }))}
                    />

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Comprobante de Transferencia (opcional)
                      </label>
                      <FileUpload
                        value={formData.voucher}
                        onChange={(file) => setFormData(prev => ({ ...prev, voucher: file }))}
                        description="PDF, JPG o PNG. Máximo 5MB."
                        required={false}
                      />
                    </div>
                  </>
                )}

                {selectedRefund.tipo_reembolso === 'mantener_saldo' && (
                  <div className="p-4 bg-info/10 border border-info/30 rounded-lg">
                    <p className="text-sm text-info">
                      <FaPhone className="w-4 h-4 inline mr-2" />
                      Proceso automático: el monto se agregará al saldo disponible del cliente.
                    </p>
                  </div>
                )}
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
                  disabled={
                    (selectedRefund?.tipo_reembolso === 'devolver_dinero' && !formData.numero_operacion.trim()) ||
                    isProcessing
                  }
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