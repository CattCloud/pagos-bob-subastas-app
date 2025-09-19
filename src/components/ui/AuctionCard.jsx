import { formatRelativeDate } from '../../utils/formatters';

const AUCTION_STATES = {
  activa: {
    label: 'Activa',
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30'
  },
  pendiente: {
    label: 'Pendiente',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30'
  },
  en_validacion: {
    label: 'En Validación',
    color: 'text-info',
    bgColor: 'bg-info/10',
    borderColor: 'border-info/30'
  },
  finalizada: {
    label: 'Finalizada',
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
    borderColor: 'border-primary-200'
  },
  ganada: {
    label: 'Ganada',
    color: 'text-success',
    bgColor: 'bg-success/20',
    borderColor: 'border-success/30'
  },
  perdida: {
    label: 'Perdida',
    color: 'text-text-muted',
    bgColor: 'bg-text-muted/10',
    borderColor: 'border-border'
  },
  penalizada: {
    label: 'Penalizada',
    color: 'text-error',
    bgColor: 'bg-error/10',
    borderColor: 'border-error/30'
  },
  vencida: {
    label: 'Vencida',
    color: 'text-secondary-600',
    bgColor: 'bg-secondary-50',
    borderColor: 'border-secondary-200'
  },
  cancelada: {
    label: 'Cancelada',
    color: 'text-error',
    bgColor: 'bg-error/10',
    borderColor: 'border-error/30'
  }
};

/**
 * Tarjeta de subasta para listados
 * @param {Object} auction - Datos de la subasta
 * @param {Function} onClick - Callback al hacer click
 * @param {Array} actions - Array de botones de acción
 * @param {boolean} compact - Versión compacta
 */
export default function AuctionCard({ 
  auction, 
  onClick,
  actions = [],
  compact = false 
}) {
  const stateConfig = AUCTION_STATES[auction.estado] || AUCTION_STATES.activa;

  return (
    <div 
      className={`
        p-4 border rounded-lg transition-colors bg-white hover:shadow-md
        ${onClick ? 'cursor-pointer' : ''}
        ${compact ? 'p-3' : 'p-4'}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Estado */}
          <div className="flex items-center gap-2 mb-2">
            <span 
              className={`
                px-2 py-0.5 text-xs rounded-full border
                ${stateConfig.bgColor} ${stateConfig.color} ${stateConfig.borderColor}
              `}
            >
              {stateConfig.label}
            </span>
          </div>

          {/* Información principal */}
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            {auction.asset?.marca} {auction.asset?.modelo} {auction.asset?.['año']} — {auction.asset?.placa}
          </h3>

          {/* Empresa propietaria */}
          {auction.asset?.empresa_propietaria && (
            <div className="text-sm text-text-secondary mb-1">
              {auction.asset.empresa_propietaria}
            </div>
          )}

          {/* Fechas */}
          <div className="text-sm text-text-secondary mb-1">
            Inicio: {auction.fecha_inicio ? formatRelativeDate(auction.fecha_inicio) : '—'} | 
            Fin: {auction.fecha_fin ? formatRelativeDate(auction.fecha_fin) : '—'}
          </div>

          {/* Ganador */}
          {auction.winner ? (
            <div className="text-sm">
              Ganador: <span className="font-medium text-text-primary">{auction.winner?.name || '—'}</span>
            </div>
          ) : (
            <div className="text-sm text-text-muted">Sin ganador asignado</div>
          )}

          {/* Descripción si existe y no es compacto */}
          {!compact && auction.asset?.descripcion && (
            <div className="text-sm text-text-secondary mt-2">
              {auction.asset.descripcion.length > 100 
                ? `${auction.asset.descripcion.slice(0, 100)}...` 
                : auction.asset.descripcion
              }
            </div>
          )}
        </div>

        {/* Botones de acción */}
        {actions.length > 0 && (
          <div className="shrink-0 flex items-center gap-2">
            {actions.map((action, index) => (
              <button
                key={index}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                  ${action.variant === 'primary' 
                    ? 'bg-primary-500 hover:bg-primary-600 text-white' 
                    : action.variant === 'success'
                    ? 'bg-success hover:bg-success/80 text-white'
                    : action.variant === 'warning'
                    ? 'bg-warning hover:bg-warning/80 text-white'
                    : action.variant === 'error'
                    ? 'bg-error hover:bg-error/80 text-white'
                    : 'border border-border hover:bg-bg-secondary text-text-primary'
                  }
                  ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!action.disabled && action.onClick) {
                    action.onClick(auction);
                  }
                }}
                disabled={action.disabled}
                title={action.title || action.label}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}