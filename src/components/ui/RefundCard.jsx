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
    p-5 rounded-xl border shadow-sm bg-white transition hover:shadow-lg hover:border-primary-300
    ${stateConfig.borderColor} ${stateConfig.bgColor}
    ${isUrgent ? "ring-2 ring-warning/40" : ""}
    ${compact ? "p-3" : "p-5"}
  `}
  onClick={onClick}
>
  <div className="flex flex-col gap-4">

    {/* HEADER: Estado + Urgencia */}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className={`flex items-center gap-2 ${stateConfig.color}`}>
        <StateIcon className="w-4 h-4" />
        <span className="font-semibold text-sm">{stateConfig.label}</span>
      </div>

      {isUrgent && (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-warning text-white rounded-full shadow-sm">
          <FaExclamationTriangle className="w-3 h-3" />
          Urgente
        </span>
      )}
    </div>

    {/* BLOQUE PRINCIPAL */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

      {/* Monto solicitado */}
      <div className="flex flex-col">
        <p className="text-xs text-text-secondary uppercase tracking-wide">Monto solicitado</p>
        <div className="flex items-center gap-2">
          <FaMoneyCheckAlt className="text-success w-5 h-5" />
          <span className="font-bold text-xl text-text-primary">{formatCurrency(monto)}</span>
        </div>
      </div>

      {/* Información del cliente */}
      {showClientInfo && (userFullName || userDocLine) && (
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-wide">Cliente</p>
          <div className="flex items-center gap-2">
            <FaUserTie className="text-primary-500 w-4 h-4" />
            <span className="font-medium text-text-primary">{userFullName || "—"}</span>
          </div>
          {userDocLine && (
            <p className="text-xs text-text-muted mt-1">{userDocLine}</p>
          )}
        </div>
      )}

      {/* Información de la subasta */}
      {hasAuctionInfo && (
        <div className={showClientInfo ? "md:col-span-2" : ""}>
          <p className="text-xs text-text-secondary uppercase tracking-wide">Subasta</p>
          <div className="flex items-center gap-2">
            <FaGavel className="text-primary-500 w-4 h-4" />
            <span className="font-medium text-text-primary">{auctionLine}</span>
          </div>
        </div>
      )}
    </div>

    {/* Motivo */}
    {motivo && (
      <div className="bg-primary-50 rounded-md p-3 border border-border/40">
        <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Motivo</p>
        <p className="text-sm text-text-primary leading-relaxed">
          {motivo.length > 100 ? `${motivo.slice(0, 100)}...` : motivo}
        </p>
      </div>
    )}

    {/* FOOTER: Fechas */}
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-3 border-t border-border/30">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <FaCalendarAlt className="w-3 h-3" />
        Solicitado: {createdDate}
      </div>

      <div className="flex items-center flex-wrap gap-3">
        {fecha_respuesta_empresa && (
          <span className="flex items-center gap-1 text-xs text-text-secondary">
            <FaClipboardCheck className="text-primary-500 w-3 h-3" />
            Revisado: {formatRelativeDate(fecha_respuesta_empresa)}
          </span>
        )}
        {fecha_procesamiento && (
          <span className="flex items-center gap-1 text-xs text-success font-semibold">
            <FaClipboardCheck className="w-3 h-3" />
            Procesado: {formatRelativeDate(fecha_procesamiento)}
          </span>
        )}
      </div>
    </div>

    {/* Descripción del estado */}
    <p className="text-xs text-text-muted italic">{stateConfig.description}</p>
  </div>
</div>

  );
}
