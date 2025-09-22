import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FaArrowLeft, FaUser, FaTrophy, FaClock, FaFileInvoice, FaExclamationTriangle } from 'react-icons/fa';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import WinnerAssignment from '../../components/forms/WinnerAssignment';
import AuctionService from '../../services/auctionService';
import useAuctions from '../../hooks/useAuctions';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { showToast } from '../../utils/toast';
import BillingService from '../../services/billing';

const AUCTION_STATES = {
  activa: { label: 'Activa', color: 'text-success', bgColor: 'bg-success/10' },
  pendiente: { label: 'Pendiente', color: 'text-warning', bgColor: 'bg-warning/10' },
  en_validacion: { label: 'En Validación', color: 'text-info', bgColor: 'bg-info/10' },
  finalizada: { label: 'Finalizada', color: 'text-primary-600', bgColor: 'bg-primary-50' },
  ganada: { label: 'Ganada', color: 'text-success', bgColor: 'bg-success/20' },
  perdida: { label: 'Perdida', color: 'text-text-muted', bgColor: 'bg-text-muted/10' },
  penalizada: { label: 'Penalizada', color: 'text-error', bgColor: 'bg-error/10' },
  vencida: { label: 'Vencida', color: 'text-secondary-600', bgColor: 'bg-secondary-50' },
  cancelada: { label: 'Cancelada', color: 'text-error', bgColor: 'bg-error/10' },
};

export default function AuctionDetail() {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const { assignWinner, isAssigningWinner } = useAuctions();

  // Estados para modales
  const [showWinnerForm, setShowWinnerForm] = useState(false);

  // Query para cargar detalle de subasta
  const {
    data: auction,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['auction-detail', auctionId],
    queryFn: () => AuctionService.getAuction(auctionId),
    enabled: Boolean(auctionId),
    staleTime: 30_000,
  });

  // Buscar Billing generado para esta subasta (HU-COMP-02)
  const {
    data: billingListData,
  } = useQuery({
    queryKey: ['auction-billing', auctionId],
    queryFn: async () => {
      // Lista global con include para filtrar por auction en cliente
      const res = await BillingService.listAll({ page: 1, limit: 100, include: 'user,auction' });
      return res?.billings || [];
    },
    enabled: Boolean(auctionId),
    staleTime: 30_000,
  });

  const billingForAuction = (billingListData || []).find(
    (b) => b?.related?.auction?.id === auctionId
  );
  const billingId = billingForAuction?.id;

  const handleAssignWinner = async (winnerData) => {
    try {
      await assignWinner(auctionId, winnerData);
      showToast.success('Ganador asignado exitosamente');
      setShowWinnerForm(false);
      refetch();
    } catch (err) {
      showToast.error(err?.message || 'Error al asignar ganador');
    }
  };

  const getActionButtons = (auction) => {
    const buttons = [];
    
    switch (auction?.estado) {
      case 'activa':
        buttons.push({
          label: 'Registrar Ganador',
          variant: 'primary',
          icon: FaUser,
          onClick: () => setShowWinnerForm(true),
        });
        break;
        
      case 'pendiente':
        buttons.push(
          {
            label: 'Marcar como Vencido',
            variant: 'warning',
            icon: FaClock,
            onClick: () => showToast.info('Función en desarrollo'),
          },
          {
            label: 'Extender Plazo de Pago',
            variant: 'outline',
            icon: FaClock,
            onClick: () => showToast.info('Función en desarrollo'),
          },
        );
        break;
        
      case 'en_validacion':
        buttons.push({
          label: 'Ver Pago Registrado',
          variant: 'info',
          icon: FaFileInvoice,
          onClick: () => navigate('/admin-subastas'),
        });
        break;
        
      case 'vencida':
        buttons.push(
          {
            label: 'Reasignar Ganador',
            variant: 'warning',
            icon: FaUser,
            onClick: () => showToast.info('Función en desarrollo'),
          },
          {
            label: 'Cancelar Subasta',
            variant: 'error',
            icon: FaExclamationTriangle,
            onClick: () => showToast.info('Función en desarrollo'),
          }
        );
        break;
        
      case 'finalizada':
        buttons.push(
          {
            label: 'Gestionar Resultado Competencia',
            variant: 'primary',
            icon: FaTrophy,
            onClick: () => navigate('/admin-subastas/competition'),
          },
          {
            label: 'Ver Pago Registrado',
            variant: 'outline',
            icon: FaFileInvoice,
            onClick: () => navigate('/admin-subastas'),
          }
        );
        break;
        
      case 'ganada':
        buttons.push(
          {
            label: 'Ver Estado Facturación',
            variant: 'success',
            icon: FaFileInvoice,
            onClick: () =>
              billingId
                ? navigate(`/admin-subastas/billing/${billingId}`)
                : navigate('/admin-subastas/billing'),
          },
          {
            label: 'Ver Pago Registrado',
            variant: 'outline',
            icon: FaFileInvoice,
            onClick: () => navigate('/admin-subastas'),
          }
        );
        break;
        
      case 'perdida':
        buttons.push(
          {
            label: 'Ver Reembolso Procesado',
            variant: 'info',
            icon: FaFileInvoice,
            onClick: () => navigate('/admin-subastas/refunds'),
          },
          {
            label: 'Ver Pago Registrado',
            variant: 'outline',
            icon: FaFileInvoice,
            onClick: () => navigate('/admin-subastas'),
          }
        );
        break;
        
      case 'penalizada':
        buttons.push(
          {
            label: 'Ver Penalidad y Reembolso',
            variant: 'warning',
            icon: FaExclamationTriangle,
            onClick: () => navigate('/admin-subastas/refunds'),
          },
          {
            label: 'Ver Pago Registrado',
            variant: 'outline',
            icon: FaFileInvoice,
            onClick: () => navigate('/admin-subastas'),
          }
        );
        break;
    }

    // Botón común: Volver a Lista
    buttons.push({
      label: 'Volver a Lista',
      variant: 'outline',
      onClick: () => navigate('/admin-subastas/auctions'),
    });

    return buttons;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-border rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-border rounded w-1/2 mb-8"></div>
          <Card>
            <div className="h-32 bg-border rounded"></div>
          </Card>
        </div>
      </div>
    );
  }

  if (isError || !auction) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/admin-subastas/auctions')}>
            <FaArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold text-text-primary">Detalle de Subasta</h1>
        </div>

        <Card variant="error">
          <div className="text-center p-6">
            <h3 className="text-lg font-semibold text-error mb-2">Error al cargar detalle</h3>
            <p className="text-text-secondary mb-4">
              {error?.message || 'No se pudo encontrar la subasta'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={refetch}>
                Reintentar
              </Button>
              <Button variant="primary" onClick={() => navigate('/admin-subastas/auctions')}>
                Volver a Lista
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const stateConfig = AUCTION_STATES[auction.estado] || AUCTION_STATES.activa;
  const actionButtons = getActionButtons(auction);
  const guarantee = auction.guarantee || auction.offer || auction.offer_details || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/admin-subastas/auctions')}>
          <FaArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Detalle de Subasta 
          </h1>
          <p className="text-text-secondary">
            {auction.asset?.marca} {auction.asset?.modelo} {auction.asset?.['año']} — {auction.asset?.placa}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información general */}
          <Card>
            <Card.Header>
              <Card.Title>Información General</Card.Title>
            </Card.Header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-secondary">Estado</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stateConfig.bgColor} ${stateConfig.color}`}>
                  {stateConfig.label}
                </span>
              </div>

              <div>
                <p className="text-sm text-text-secondary">Tiempos</p>
                <p className="text-sm text-text-primary">
                  <strong>Creado:</strong> {formatDate(auction.created_at, { includeTime: true })}
                </p>
                {auction.fecha_limite_pago && (
                  <p className="text-sm text-text-primary">
                    <strong>Límite de Pago:</strong> {formatDate(auction.fecha_limite_pago, { includeTime: true })}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-text-secondary">Vehículo</p>
                <p className="font-semibold text-text-primary">
                  {auction.asset?.marca} {auction.asset?.modelo} ({auction.asset?.['año']})
                </p>
                <p className="text-sm text-text-secondary">Placa: {auction.asset?.placa}</p>
              </div>

              <div>
                <p className="text-sm text-text-secondary">Empresa Propietaria</p>
                <p className="text-sm text-text-primary">{auction.asset?.empresa_propietaria}</p>
              </div>

              {auction.asset?.descripcion && (
                <div className="md:col-span-2">
                  <p className="text-sm text-text-secondary">Descripción</p>
                  <p className="text-sm text-text-primary">{auction.asset.descripcion}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Información del ganador */}
          {auction.winner && (
            <Card>
              <Card.Header>
                <Card.Title>Ganador Actual</Card.Title>
              </Card.Header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary">Cliente Ganador</p>
                  <p className="font-semibold text-text-primary">
                    {auction.winner?.name || '—'}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {auction.winner?.document || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-text-secondary">Monto de Oferta</p>
                  <p className="text-lg font-bold text-text-primary">
                    {guarantee?.monto_oferta ? formatCurrency(guarantee.monto_oferta) : '—'}
                  </p>
                  <p className="text-sm text-success">
                    Garantía (8%): {guarantee?.monto_garantia ? formatCurrency(guarantee.monto_garantia) : '—'}
                  </p>
                </div>


                <div>
                  <p className="text-sm text-text-secondary">Estado del Pago</p>
                  <p className="text-sm text-text-primary">
                    {auction.payment_status?.has_payment ? 'Registrado' : 'No registrado'}
                  </p>
                  {auction.payment_status?.estado && (
                    <p className={`text-sm ${
                      auction.payment_status.estado === 'validado' ? 'text-success' : 
                      auction.payment_status.estado === 'rechazado' ? 'text-error' : 'text-warning'
                    }`}>
                      Estado: {auction.payment_status.estado}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar con acciones */}
        <div className="space-y-4">


          {/* Botones de acción contextuales */}
          <Card>
            <Card.Header>
              <Card.Title className="text-base">Acciones Disponibles</Card.Title>
            </Card.Header>
            <div className="space-y-2">
              {actionButtons.map((button, index) => {
                const IconComponent = button.icon;
                return (
                  <Button
                    key={index}
                    variant={button.variant}
                    onClick={button.onClick}
                    className="w-full justify-start"
                    disabled={button.disabled}
                  >
                    {IconComponent && <IconComponent className="w-4 h-4 mr-2" />}
                    {button.label}
                  </Button>
                );
              })}
            </div>
          </Card>

          {/* Información adicional */}
          <Card variant="info" padding="sm">
            <div className="text-center">
              <p className="text-sm text-info font-medium">Información</p>
              <p className="text-xs text-text-secondary mt-1">
                {auction.estado === 'activa' && 'Asigna un ganador para iniciar el proceso de pago'}
                {auction.estado === 'pendiente' && 'Esperando pago de garantía del cliente'}
                {auction.estado === 'en_validacion' && 'Pago registrado, pendiente de validación'}
                {auction.estado === 'finalizada' && 'Pago validado, listo para registrar resultado de competencia'}
                {auction.estado === 'ganada' && 'BOB ganó la competencia, cliente debe completar facturación'}
                {auction.estado === 'perdida' && 'BOB perdió, cliente puede solicitar reembolso'}
                {auction.estado === 'penalizada' && 'Cliente no pagó vehículo, penalidad aplicada'}
                {auction.estado === 'vencida' && 'Plazo de pago vencido'}
                {auction.estado === 'cancelada' && 'Subasta cancelada'}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal Asignar Ganador */}
      <Modal
        isOpen={showWinnerForm}
        onClose={() => setShowWinnerForm(false)}
        title="Asignar Ganador"
        size="lg"
      >
        <WinnerAssignment
          auction={auction}
          onSubmit={handleAssignWinner}
          onCancel={() => setShowWinnerForm(false)}
          isSubmitting={isAssigningWinner}
        />
      </Modal>
    </div>
  );
}