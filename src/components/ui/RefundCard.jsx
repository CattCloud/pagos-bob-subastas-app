import { FaClock, FaCheckCircle, FaTimes, FaEye } from 'react-icons/fa';
import { formatCurrency, formatRelativeDate } from '../../utils/formatters';
import { FaUserTie, FaMoneyCheckAlt, FaGavel, FaExclamationTriangle, FaCalendarAlt, FaClipboardCheck } from "react-icons/fa";

const REFUND_STATES = {
  solicitado: {
    label: 'En Revisión',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    icon: FaClock,
    description: 'Se contactarán para confirmar detalles'
  },
  confirmado: {
    label: 'Confirmado',
    color: 'text-info',
    borderColor: 'border-info/30',
    icon: FaCheckCircle,
    description: 'En proceso de transferencia/aplicación'
  },
  procesado: {
    label: 'Completado',
    color: 'text-success',
    borderColor: 'border-success/30',
    icon: FaCheckCircle,
    description: 'Reembolso completado exitosamente'
  },
  rechazado: {
    label: 'Rechazado',
    color: 'text-error',
    
    borderColor: 'border-error/30',
    icon: FaTimes,
    description: 'Ver motivo en detalle'
  }
};


/**
 * Tarjeta de reembolso para listados (HU-REEM-04)
 * - Estados visuales distintivos
 * - Información contextual según tipo
 * - Click para ir a detalle
 */
export default function RefundCard({ 
  refund,
  onClick,
  showClientInfo = false, // Para vista admin
  compact = false
}) {
  const {
    monto_solicitado,
    estado,
    motivo,
    created_at,
    fecha_respuesta_empresa,
    fecha_procesamiento,
  } = refund;

  // Preferir datos enriquecidos por include=user,auction
  const relatedUser = refund?.related?.user || refund?.user || null;
  const relatedAuction = refund?.related?.auction || refund?.auction || null;

  // Usuario (solo Admin: showClientInfo = true)
  const userFirst = relatedUser?.first_name || '';
  const userLast = relatedUser?.last_name || '';
  const userDocType = relatedUser?.document_type || '';
  const userDocNumber = relatedUser?.document_number || '';
  const userFullName = [userFirst, userLast].filter(Boolean).join(' ');
  const userDocLine = userDocNumber ? `${userDocType ? userDocType + ' ' : ''}${userDocNumber}` : '';

  // Subasta (Admin y Cliente)
  // Backend para refunds entrega auction con campos planos (marca, modelo, año, placa)
  // pero soportamos fallback a auction.asset.* si existiera
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

  const stateConfig = REFUND_STATES[estado] || REFUND_STATES.solicitado;
  
  const StateIcon = stateConfig.icon;
  
  const createdDate = created_at ? formatRelativeDate(created_at) : '—';
  const monto = Number(monto_solicitado || 0);

  // Calcular urgencia (solicitudes >3 días)
  const isUrgent = estado === 'solicitado' && created_at && 
    (Date.now() - new Date(created_at).getTime()) > (3 * 24 * 60 * 60 * 1000);

  return (
    <div 
      className={`
        p-4 border rounded-lg cursor-pointer transition-colors hover:shadow-md
        ${stateConfig.borderColor} ${stateConfig.bgColor}
        ${isUrgent ? 'ring-2 ring-warning/50' : ''}
        ${compact ? 'p-3' : 'p-4'}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4 ">
        <div className="flex-1 min-w-0">
          {/* Header con estado y tipo */}
          <div className="flex items-center gap-3 mb-2">
            <div className={`flex items-center gap-1 ${stateConfig.color}`}>
              <StateIcon className="w-4 h-4" />
              <span className="font-semibold text-sm">{stateConfig.label}</span>
            </div>
            

            {isUrgent && (
              <span className="px-2 py-1 text-xs font-medium bg-warning text-white rounded-full">
                Urgente
              </span>
            )}
          </div>

          {/* Información principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-text-secondary">Monto solicitado:</p>
              <p className="font-bold text-lg text-text-primary">{formatCurrency(monto)}</p>
            </div>
            
            {showClientInfo && (userFullName || userDocLine) && (
              <div>
                <p className="text-text-secondary">Cliente:</p>
                <p className="font-medium text-text-primary">
                  {userFullName || '—'}
                </p>
                {userDocLine && (
                  <p className="text-xs text-text-muted">
                    {userDocLine}
                  </p>
                )}
              </div>
            )}

            {hasAuctionInfo && (
              <div className={showClientInfo ? 'md:col-span-2' : ''}>
                <p className="text-text-secondary">Subasta:</p>
                <p className="font-medium text-text-primary">
                  {auctionLine}
                </p>
              </div>
            )}
          </div>

          {/* Motivo (truncado) */}
          {motivo && (
            <div className="mt-3">
              <p className="text-text-secondary text-xs">Motivo:</p>
              <p className="text-sm text-text-primary line-clamp-2">
                {motivo.length > 100 ? `${motivo.slice(0, 100)}...` : motivo}
              </p>
            </div>
          )}

          {/* Footer con fechas */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <div className="text-xs text-text-muted">
              Solicitado: {createdDate}
            </div>
            
            <div className="flex items-center gap-2">
              {fecha_respuesta_empresa && (
                <span className="text-xs text-text-secondary">
                  Revisado: {formatRelativeDate(fecha_respuesta_empresa)}
                </span>
              )}
              {fecha_procesamiento && (
                <span className="text-xs text-success">
                  Procesado: {formatRelativeDate(fecha_procesamiento)}
                </span>
              )}
            </div>
          </div>

          {/* Descripción del estado */}
          <div className="mt-2">
            <p className="text-xs text-text-muted">{stateConfig.description}</p>
          </div>
        </div>


      </div>
    </div>
  );
}
