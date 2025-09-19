import { FaWallet, FaUniversity , FaClock, FaCheckCircle, FaTimes, FaEye } from 'react-icons/fa';
import { formatCurrency, formatRelativeDate } from '../../utils/formatters';

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
    bgColor: 'bg-info/10', 
    borderColor: 'border-info/30',
    icon: FaCheckCircle,
    description: 'En proceso de transferencia/aplicación'
  },
  procesado: {
    label: 'Completado',
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
    icon: FaCheckCircle,
    description: 'Reembolso completado exitosamente'
  },
  rechazado: {
    label: 'Rechazado',
    color: 'text-error',
    bgColor: 'bg-error/10',
    borderColor: 'border-error/30',
    icon: FaTimes,
    description: 'Ver motivo en detalle'
  }
};

const REFUND_TYPES = {
  mantener_saldo: {
    label: 'Mantener Saldo',
    icon: FaWallet,
    color: 'text-primary-600'
  },
  devolver_dinero: {
    label: 'Devolver Dinero',
    icon: FaUniversity ,
    color: 'text-secondary-600'
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
    tipo_reembolso,
    estado,
    motivo,
    created_at,
    fecha_respuesta_empresa,
    fecha_procesamiento,
    // Para admin
    user,
    auction
  } = refund;

  const stateConfig = REFUND_STATES[estado] || REFUND_STATES.solicitado;
  const typeConfig = REFUND_TYPES[tipo_reembolso] || REFUND_TYPES.mantener_saldo;
  
  const StateIcon = stateConfig.icon;
  const TypeIcon = typeConfig.icon;
  
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
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header con estado y tipo */}
          <div className="flex items-center gap-3 mb-2">
            <div className={`flex items-center gap-1 ${stateConfig.color}`}>
              <StateIcon className="w-4 h-4" />
              <span className="font-semibold text-sm">{stateConfig.label}</span>
            </div>
            
            <div className={`flex items-center gap-1 ${typeConfig.color}`}>
              <TypeIcon className="w-4 h-4" />
              <span className="text-sm">{typeConfig.label}</span>
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
            
            {showClientInfo && user && (
              <div>
                <p className="text-text-secondary">Cliente:</p>
                <p className="font-medium text-text-primary">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-text-muted">
                  {user.document_type} {user.document_number}
                </p>
              </div>
            )}

            {auction && (
              <div className={showClientInfo ? 'md:col-span-2' : ''}>
                <p className="text-text-secondary">Subasta:</p>
                <p className="font-medium text-text-primary">
                  {auction.asset?.marca} {auction.asset?.modelo} - {auction.asset?.placa}
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

        {/* Indicador visual */}
        <div className="shrink-0">
          <FaEye className="w-4 h-4 text-text-muted" />
        </div>
      </div>
    </div>
  );
}