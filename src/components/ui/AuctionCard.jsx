import { formatRelativeDate } from '../../utils/formatters';
import { FaTrophy, FaInfoCircle, FaFileInvoice } from "react-icons/fa";
import Button from './Button';

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
    p-5 rounded-xl border border-border bg-white shadow-sm hover:shadow-lg transition
    ${onClick ? "cursor-pointer" : ""}
    ${compact ? "p-4" : "p-5"}
  `}
      onClick={onClick}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
        {/* Bloque de información principal */}
        <div className="flex-1 min-w-0 space-y-3">

          {/* Estado con badge */}
          <div className="flex items-center gap-2">
            <span
              className={`
            px-3 py-1 text-xs font-semibold rounded-full border shadow-sm
            ${stateConfig.bgColor} ${stateConfig.color} ${stateConfig.borderColor}
          `}
            >
              {stateConfig.label}
            </span>
          </div>

          {/* Título principal */}
          <h3 className="text-xl font-bold text-text-primary leading-snug">
            {auction.asset?.marca} {auction.asset?.modelo} {auction.asset?.["año"]} —{auction.asset?.placa}
          </h3>

          {/* Empresa propietaria */}
          {auction.asset?.empresa_propietaria && (
            <div className="flex items-center text-sm text-text-secondary gap-2">
              <span className="font-medium text-text-primary">Empresa Propietaria:</span>
              <span>{auction.asset.empresa_propietaria}</span>
            </div>
          )}
          {/* Ganador */}
          {auction.winner ? (
            <div className="flex items-center text-sm gap-2">
              <FaTrophy className="text-success w-4 h-4" />
              <span>
                Ganador:{" "}
                <span className="font-semibold text-text-primary">
                  {auction.winner?.name || "—"}
                </span>
              </span>
            </div>
          ) : (
            <div className="flex items-center text-sm gap-2 text-text-muted">
              <FaInfoCircle className="w-4 h-4" />
              Sin ganador asignado
            </div>
          )}
          {/* Fechas */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <span className="font-medium text-text-primary">Creado:{" "}</span>
              {auction.created_at ? formatRelativeDate(auction.created_at) : "No definido"}
            </span>
            <span className="flex items-center gap-1 sm:ml-4">
              <span className="font-medium text-text-primary">Límite pago:{" "}</span>
              {auction.fecha_limite_pago
                ? formatRelativeDate(auction.fecha_limite_pago)
                : "No definido"}
            </span>
          </div>



          {/* Descripción */}
          {!compact && auction.asset?.descripcion && (
            <p className="text-sm text-text-secondary leading-relaxed">
              {auction.asset.descripcion.length > 100
                ? `${auction.asset.descripcion.slice(0, 100)}...`
                : auction.asset.descripcion}
            </p>
          )}
        </div>

        {/* Acciones */}
        {actions.length > 0 && (
          <div className="flex flex-col gap-2 shrink-0 md:text-right">
            {actions.map((action, index) => {
              const isDetail = /detalle/i.test(String(action?.label || action?.title || ''));
              const handleClick = (e) => {
                e.stopPropagation();
                if (!action?.disabled && action?.onClick) {
                  action.onClick(auction);
                }
              };

              if (isDetail) {
                return (
                  <Button
                    key={index}
                    size="sm"
                    variant="secondary"
                    onClick={handleClick}
                    title={action.title || action.label || 'Ver detalle de subasta'}
                    className="w-full md:w-auto"
                  >
                    <FaFileInvoice className="w-4 h-4 mr-2" />
                    {action.label || 'Ver Detalle'}
                  </Button>
                );
              }

              return (
                <button
                  key={index}
                  className={`
                  flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm
                  ${action.variant === "primary"
                      ? "bg-primary-500 hover:bg-primary-600 text-white"
                      : action.variant === "success"
                        ? "bg-success hover:bg-success/80 text-white"
                        : action.variant === "warning"
                          ? "bg-warning hover:bg-warning/80 text-white"
                          : action.variant === "error"
                            ? "bg-error hover:bg-error/80 text-white"
                            : "border border-border hover:bg-gray-50 text-text-primary"
                    }
                  ${action.disabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
                  onClick={handleClick}
                  disabled={action.disabled}
                  title={action.title || action.label}
                >
                  {action.icon && <action.icon className="w-4 h-4" />}
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}