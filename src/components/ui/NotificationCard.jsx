import { 
  FaTrophy, FaCheckCircle, FaTimes, FaBullseye, FaFrown, 
  FaExclamationTriangle, FaDollarSign, FaFileInvoice, FaClock 
} from 'react-icons/fa';
import { formatRelativeDate } from '../../utils/formatters';

const NOTIFICATION_TYPES = {
  ganador_subasta: {
    icon: FaTrophy,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    label: 'Ganaste la subasta'
  },
  pago_registrado: {
    icon: FaClock,
    color: 'text-info',
    bgColor: 'bg-info/10',
    label: 'Pago pendiente validación'
  },
  pago_validado: {
    icon: FaCheckCircle,
    color: 'text-success',
    bgColor: 'bg-success/10',
    label: 'Pago aprobado'
  },
  pago_rechazado: {
    icon: FaTimes,
    color: 'text-error',
    bgColor: 'bg-error/10',
    label: 'Pago rechazado'
  },
  competencia_ganada: {
    icon: FaBullseye,
    color: 'text-success',
    bgColor: 'bg-success/10',
    label: 'BOB ganó la competencia'
  },
  competencia_perdida: {
    icon: FaFrown,
    color: 'text-secondary-600',
    bgColor: 'bg-secondary-100',
    label: 'BOB no ganó'
  },
  penalidad_aplicada: {
    icon: FaExclamationTriangle,
    color: 'text-error',
    bgColor: 'bg-error/10',
    label: 'Penalidad aplicada'
  },
  reembolso_procesado: {
    icon: FaDollarSign,
    color: 'text-success',
    bgColor: 'bg-success/10',
    label: 'Reembolso completado'
  },
  facturacion_completada: {
    icon: FaFileInvoice,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
    label: 'Facturación procesada'
  }
};

/**
 * Tarjeta individual de notificación con tipos específicos de BOB Subastas
 */
export default function NotificationCard({ 
  notification, 
  onClick,
  onMarkAsRead,
  showActions = true,
  compact = false
}) {
  const {
    id,
    title,
    message,
    created_at,
    read,
    tipo
  } = notification;

  const typeConfig = NOTIFICATION_TYPES[tipo] || {
    icon: FaClock,
    color: 'text-text-secondary',
    bgColor: 'bg-bg-tertiary',
    label: 'Notificación'
  };

  const IconComponent = typeConfig.icon;
  const relativeDate = created_at ? formatRelativeDate(created_at) : '—';

  return (
    <div 
      className={`
        p-4 rounded-lg border transition-colors cursor-pointer
        ${read 
          ? 'border-border bg-white hover:bg-bg-secondary' 
          : 'border-primary-200 bg-primary-50/50 hover:bg-primary-50'
        }
        ${compact ? 'p-3' : 'p-4'}
      `}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Icono del tipo */}
        <div className={`
          flex items-center justify-center rounded-full p-2 shrink-0
          ${typeConfig.bgColor}
        `}>
          <IconComponent className={`w-4 h-4 ${typeConfig.color}`} />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={`text-sm font-semibold ${read ? 'text-text-primary' : 'text-text-primary'}`}>
                {title || typeConfig.label}
              </p>
              
              {message && (
                <p className={`mt-1 text-sm ${read ? 'text-text-secondary' : 'text-text-primary'} ${compact ? 'line-clamp-2' : ''}`}>
                  {message}
                </p>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs ${typeConfig.color} font-medium`}>
                  {typeConfig.label}
                </span>
                <span className="text-xs text-text-muted">•</span>
                <span className="text-xs text-text-muted">{relativeDate}</span>
              </div>
            </div>

            {/* Indicador de estado */}
            {!read && (
              <div className="shrink-0 mt-1">
                <span className="inline-block w-2 h-2 rounded-full bg-primary-600" />
              </div>
            )}
          </div>

          {/* Acciones (solo mostrar si no es compact) */}
          {showActions && !compact && !read && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead?.(id);
                }}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Marcar como leída
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}