import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import LoadingState from '../../components/ui/states/LoadingState';
import ErrorState from '../../components/ui/states/ErrorState';
import EmptyState from '../../components/ui/states/EmptyState';
import useAuth from '../../hooks/useAuth';
import AuctionService from '../../services/auctionService';
import MovementService from '../../services/movementService';
import BillingService from '../../services/billing';
import { formatDate } from '../../utils/formatters';
import { showToast } from '../../utils/toast';
import TransactionDetail from '../../components/ui/transactions/TransactionDetail';

const STATE_STYLE = {
  activa: { text: 'text-success', bg: 'bg-success/10', border: 'border-success/20', label: 'Activa' },
  pendiente: { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', label: 'Pendiente' },
  en_validacion: { text: 'text-info', bg: 'bg-info/10', border: 'border-info/20', label: 'En Validación' },
  finalizada: { text: 'text-primary-600', bg: 'bg-primary-50', border: 'border-primary-100', label: 'Finalizada' },
  ganada: { text: 'text-success', bg: 'bg-success/20', border: 'border-success/30', label: 'Ganada' },
  facturada: { text: 'text-primary-700', bg: 'bg-primary-50', border: 'border-primary-100', label: 'Facturada' },
  perdida: { text: 'text-text-secondary', bg: 'bg-bg-tertiary', border: 'border-border', label: 'Perdida' },
  penalizada: { text: 'text-error', bg: 'bg-error/10', border: 'border-error/20', label: 'Penalizada' },
  vencida: { text: 'text-secondary-600', bg: 'bg-secondary-100', border: 'border-secondary-100', label: 'Vencida' },
  cancelada: { text: 'text-error', bg: 'bg-error/10', border: 'border-error/20', label: 'Cancelada' },
};

export default function MyAuctions() {
  const { user } = useAuth();
  const userId = user?.id;
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState(null);

  // Modal de Detalle de Pago
  const [paymentModal, setPaymentModal] = useState({ open: false, movement: null });
  const closePaymentModal = () => setPaymentModal({ open: false, movement: null });

  const loadAuctions = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await AuctionService.getUserWonAuctionsAll(userId);
      // Ordenar por created_at de auction si disponible (desc)
      const sorted = [...list].sort((a, b) => {
        const da = new Date(a?.auction?.created_at || 0).getTime();
        const db = new Date(b?.auction?.created_at || 0).getTime();
        return db - da;
      });
      setAuctions(sorted);
    } catch (e) {
      setError(e?.message || 'Error al cargar subastas ganadas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuctions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleViewPayment = async (auctionId) => {
    if (!userId || !auctionId) return;
    setLoadingAction(true);
    try {
      // Traer movimientos del usuario y encontrar el pago de garantía para esta subasta
      const res = await MovementService.getUserMovements(userId, {
        tipo_especifico: 'pago_garantia',
        include: 'auction,user,guarantee,refund',
        page: 1,
        limit: 100,
      });
      const items = res?.movements || res || [];
      // matches by references.auction_id (users endpoint returns references object)
      const match = items.find((m) => {
        const ref = m.references || {};
        const auctionRefId = ref.auction_id || (Array.isArray(m.references) ? (m.references.find(r => r.type === 'auction')?.id) : null);
        return auctionRefId === auctionId;
      });

      if (!match) {
        showToast.error('No se encontró el pago de garantía asociado a esta subasta');
        return;
      }

      // Obtener detalle completo con include
      const detail = await MovementService.getMovement(match.id, { include: 'auction,user,guarantee,refund' });
      setPaymentModal({ open: true, movement: detail });
    } catch (e) {
      showToast.error(e?.message || 'Error al cargar detalle de pago');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleViewBilling = async (auctionId) => {
    if (!userId || !auctionId) return;
    setLoadingAction(true);
    try {
      const { billings = [] } = await BillingService.listByUser(userId, { include: 'auction', page: 1, limit: 100 });
      const match = billings.find(b => b?.related?.auction?.id === auctionId);
      if (!match) {
        showToast.error('No se encontró facturación asociada a esta subasta');
        return;
      }
      // Navegar a detalle de billing
      window.location.href = `/pago-subastas/billing/${match.id}`;
    } catch (e) {
      showToast.error(e?.message || 'Error al cargar detalle de facturación');
    } finally {
      setLoadingAction(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <LoadingState
          type="skeleton"
          count={4}
          message="Cargando tus subastas ganadas..."
        />
      );
    }

    if (error) {
      return (
        <ErrorState
          type="general"
          title="Error al cargar subastas"
          message={error}
          onRetry={loadAuctions}
          compact
        />
      );
    }

    if (!auctions.length) {
      return (
        <EmptyState
          type="auctions"
          title="Sin subastas ganadas"
          message="Aún no tienes subastas donde seas ganador. Las subastas aparecerán aquí cuando resultes ganador en una competencia."
        />
      );
    }

    return (
      <div className="space-y-3">
        {auctions.map((item) => {
          const a = item.auction || item;
          const asset = a.asset || {};
          const estado = a.estado;
          const style = STATE_STYLE[estado] || STATE_STYLE.activa;
          const fechaLimite = a.fecha_limite_pago ? formatDate(a.fecha_limite_pago, { includeTime: false }) : '—';

          const isFinalizadaPlus = ['finalizada', 'ganada', 'perdida', 'penalizada', 'facturada'].includes(estado);
          const canBilling = estado === 'ganada';

          return (
            <div key={a.id} className="p-4 border border-border rounded-lg bg-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-text-primary truncate">
                      {asset.marca} {asset.modelo} {asset['año']} — {asset.placa}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${style.text} ${style.bg} ${style.border}`}>
                      {style.label}
                    </span>
                  </div>
                  <div className="text-sm text-text-secondary mt-1">
                    <span className="font-medium text-text-primary">Fecha límite de pago:</span> {fechaLimite}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  {isFinalizadaPlus && (
                    <Button
                      variant="secondary"
                      disabled={loadingAction}
                      onClick={() => handleViewPayment(a.id)}
                    >
                      Detalle de Pago de Garantía
                    </Button>
                  )}
                  {canBilling && (
                    <Button
                      variant="primary"
                      disabled={loadingAction}
                      onClick={() => handleViewBilling(a.id)}
                    >
                      Detalle de Facturación
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-text-primary">Mis Subastas</h1>
        <p className="text-text-secondary mt-1">
          Aquí verás las subastas donde eres ganador, con acceso rápido al detalle de pago de garantía y facturación.
        </p>
      </div>

      <Card>
        <Card.Header>
          <Card.Title className="!m-0">Subastas ganadas</Card.Title>
        </Card.Header>
        <div className="space-y-4">
          {renderContent()}
        </div>
      </Card>

      {/* Modal de Detalle de Pago de Garantía */}
      <TransactionDetail
        isOpen={paymentModal.open}
        onClose={closePaymentModal}
        movement={paymentModal.movement}
        onDownloadVoucher={async () => {
          try {
            const mv = paymentModal.movement;
            if (!mv?.id) return;
            const blob = await MovementService.downloadVoucher(mv.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `voucher-${mv.id}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          } catch (e) {
            showToast.error(e?.message || 'Error al descargar comprobante');
          }
        }}
        downloading={false}
      />
    </div>
  );
}