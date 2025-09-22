import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaDownload, FaInfoCircle } from 'react-icons/fa';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import RefundTimeline from '../../components/ui/RefundTimeline';
import useRefunds from '../../hooks/useRefunds';
import { formatCurrency, formatRelativeDate } from '../../utils/formatters';
import { showToast } from '../../utils/toast';
import useAuth from '../../hooks/useAuth';

export default function RefundDetail() {
  const { refundId } = useParams();
  const navigate = useNavigate();
  const { useRefundDetail } = useRefunds();
  const { user } = useAuth();
  const isAdmin = user?.user_type === 'admin' || user?.userType === 'admin';
  
  const {
    data: refund,
    isLoading,
    isError,
    error,
    refetch
  } = useRefundDetail(refundId);

  const handleDownloadVoucher = async () => {
    if (!refund?.voucher_url) return;
    
    try {
      // TODO: Implementar descarga de voucher cuando esté disponible en el backend
      showToast.info('Función de descarga en desarrollo');
    } catch (err) {
      showToast.error(err?.message || 'Error al descargar comprobante');
    }
  };

  const handleNewRequest = () => {
    navigate('/pago-subastas/refunds');
  };

  const goBack = () => {
    navigate('/pago-subastas/refunds');
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

  if (isError || !refund) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={goBack}>
            <FaArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold text-text-primary">Detalle de Reembolso</h1>
        </div>

        <Card variant="error">
          <div className="text-center p-6">
            <h3 className="text-lg font-semibold text-error mb-2">Error al cargar detalle</h3>
            <p className="text-text-secondary mb-4">
              {error?.message || 'No se pudo encontrar la solicitud de reembolso'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={refetch}>
                Reintentar
              </Button>
              <Button variant="primary" onClick={goBack}>
                Volver al Historial
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }


// Datos enriquecidos (related) para usuario y subasta
const relatedUser = refund?.related?.user || refund?.user || null;
const relatedAuction = refund?.related?.auction || refund?.auction || null;

// Usuario (solo admin)
const userFirst = relatedUser?.first_name || '';
const userLast = relatedUser?.last_name || '';
const userDocType = relatedUser?.document_type || '';
const userDocNumber = relatedUser?.document_number || '';
const userFullName = [userFirst, userLast].filter(Boolean).join(' ');
const userDocLine = userDocNumber ? `${userDocType ? userDocType + ' ' : ''}${userDocNumber}` : '';

// Subasta asociada (admin y cliente)
const aMarca = relatedAuction?.marca || relatedAuction?.asset?.marca || '';
const aModelo = relatedAuction?.modelo || relatedAuction?.asset?.modelo || '';
const aAnio = (relatedAuction && (relatedAuction['año'] ?? relatedAuction?.anio ?? relatedAuction?.year))
  || (relatedAuction?.asset && (relatedAuction.asset['año'] ?? relatedAuction.asset?.anio ?? relatedAuction.asset?.year))
  || '';
const aPlaca = relatedAuction?.placa || relatedAuction?.asset?.placa || '';
const hasAuctionInfo = Boolean(aMarca || aModelo || aAnio || aPlaca);
const auctionLine = hasAuctionInfo
  ? `${[aMarca, aModelo, aAnio].filter(Boolean).join(' ')}${aPlaca ? ` / ${aPlaca}` : ''}`
  : '';
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={goBack}>
          <FaArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Solicitud de Reembolso 
          </h1>
          <p className="text-text-secondary">
            Creada el {refund.created_at ? formatRelativeDate(refund.created_at) : '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Usuario que solicitó (solo admin) */}
          {isAdmin && (userFullName || userDocLine) && (
            <Card>
              <Card.Header>
                <Card.Title>Usuario que solicitó</Card.Title>
              </Card.Header>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-text-secondary">Nombre y Apellido</p>
                  <p className="font-semibold text-text-primary">{userFullName || '—'}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Documento</p>
                  <p className="font-semibold text-text-primary">{userDocLine || '—'}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Detalles de la solicitud */}
          <Card>
            <Card.Header>
              <Card.Title>Detalles de la Solicitud</Card.Title>
            </Card.Header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-secondary">Monto Solicitado</p>
                <p className="text-2xl font-bold text-text-primary">
                  {formatCurrency(Number(refund.monto_solicitado || 0))}
                </p>
              </div>


              <div className="md:col-span-2">
                <p className="text-sm text-text-secondary">Motivo de la Solicitud</p>
                <p className="text-sm text-text-primary mt-1 p-3 bg-bg-secondary rounded-lg">
                  {refund.motivo || 'No especificado'}
                </p>
              </div>
            </div>
          </Card>

          {/* Información de la subasta (admin y cliente) */}
          {hasAuctionInfo && (
            <Card>
              <Card.Header>
                <Card.Title>Subasta Asociada</Card.Title>
              </Card.Header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-text-secondary">Vehículo</p>
                  <p className="font-semibold text-text-primary">
                    {auctionLine}
                  </p>
                </div>
                {relatedAuction?.estado && (
                  <div>
                    <p className="text-text-secondary">Estado de la Subasta</p>
                    <p className="font-semibold text-text-primary capitalize">{relatedAuction.estado}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Timeline del proceso */}
          <Card>
            <Card.Header>
              <Card.Title>Seguimiento del Proceso</Card.Title>
            </Card.Header>

            <RefundTimeline refund={refund} />
          </Card>
        </div>

        {/* Sidebar con acciones */}
        <div className="space-y-4">
          {/* Estado actual */}
          <Card variant="outlined" padding="sm">
            <div className="text-center">
              <div className={`
                inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium
                ${refund.estado === 'solicitado' ? 'bg-warning/10 text-warning' :
                  refund.estado === 'confirmado' ? 'bg-info/10 text-info' :
                  refund.estado === 'procesado' ? 'bg-success/10 text-success' :
                  'bg-error/10 text-error'
                }
              `}>
                {refund.estado === 'solicitado' && 'En Revisión'}
                {refund.estado === 'confirmado' && 'Confirmado'}
                {refund.estado === 'procesado' && 'Completado'}
                {refund.estado === 'rechazado' && 'Rechazado'}
              </div>
            </div>
          </Card>

          {/* Acciones contextuales según estado */}
          {refund.estado === 'procesado' && (
            <Card variant="success" padding="sm">
              <div className="text-center">
                <h4 className="font-semibold text-success mb-2">Reembolso Completado</h4>
                <p className="text-sm text-text-secondary mb-3">
                  El dinero fue transferido a su cuenta bancaria
                </p>
                {refund.voucher_url && (
                  <Button size="sm" variant="outline" onClick={handleDownloadVoucher}>
                    <FaDownload className="w-4 h-4 mr-2" />
                    Descargar Comprobante
                  </Button>
                )}
              </div>
            </Card>
          )}

          {refund.estado === 'rechazado' && (
            <Card variant="error" padding="sm">
              <div className="text-center">
                <h4 className="font-semibold text-error mb-2">Solicitud Rechazada</h4>
                {refund.motivo_rechazo && (
                  <p className="text-sm text-text-secondary mb-3">
                    {refund.motivo_rechazo}
                  </p>
                )}
                <Button size="sm" variant="primary" onClick={handleNewRequest}>
                  Nueva Solicitud
                </Button>
              </div>
            </Card>
          )}

          {['solicitado', 'confirmado'].includes(refund.estado) && (
            <Card variant="info" padding="sm">
              <div className="text-center">
                <FaInfoCircle className="w-6 h-6 mx-auto mb-2 text-info" />
                <h4 className="font-semibold text-info mb-2">En Proceso</h4>
                <p className="text-sm text-text-secondary">
                  {refund.estado === 'solicitado' 
                    ? 'La empresa se contactará para confirmar detalles'
                    : 'Su reembolso está siendo procesado'
                  }
                </p>
              </div>
            </Card>
          )}

          {/* Link a transacciones si está procesado */}
          {refund.estado === 'procesado' && (
            <Button
              variant="outline"
              onClick={() => navigate('/pago-subastas/transactions')}
              className="w-full"
            >
              Ver en Historial de Transacciones
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}