import { formatCurrency, formatPercentage, getBalanceStatusStyle } from '../../utils/formatters';
import {
  FaDollarSign,
  FaLock,
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaChartPie
} from 'react-icons/fa';

/**
 * Componente reutilizable para mostrar información de saldos
 * @param {Object} props - Propiedades del componente
 */
function BalanceCard({
  title,
  amount,
  type = 'default',
  percentage = null,
  subtitle = null,
  showIcon = true,
  icon = null,
  action = null,
  loading = false,
  className = '',
  onClick = null
}) {
  
  const balanceStyle = getBalanceStatusStyle(amount);
  
  const typeStyles = {
    total: {
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      textColor: 'text-primary-600',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      defaultIcon: <FaDollarSign className="w-6 h-6" />
    },
    retenido: {
      iconBg: 'bg-warning/20',
      iconColor: 'text-warning',
      textColor: 'text-warning',
      bgColor: 'bg-warning/5',
      borderColor: 'border-warning/20',
      defaultIcon: <FaLock className="w-6 h-6" />
    },
    aplicado: {
      iconBg: 'bg-info/20',
      iconColor: 'text-info',
      textColor: 'text-info',
      bgColor: 'bg-info/5',
      borderColor: 'border-info/20',
      defaultIcon: <FaFileInvoiceDollar className="w-6 h-6" />
    },
    disponible: {
      iconBg: 'bg-success/20',
      iconColor: 'text-success',
      textColor: 'text-success',
      bgColor: 'bg-success/5',
      borderColor: 'border-success/20',
      defaultIcon: <FaCheckCircle className="w-6 h-6" />
    },
    default: balanceStyle
  };
  
  const style = typeStyles[type] || typeStyles.default;
  const displayIcon = icon || style.defaultIcon;
  
  const cardClasses = `
    relative p-6 rounded-lg border-2 transition-all duration-200
    ${style.bgColor || balanceStyle.bgClass}
    ${style.borderColor || balanceStyle.borderClass}
    ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''}
    ${className}
  `.trim();
  
  const handleClick = () => {
    if (onClick) onClick();
  };
  
  return (
    <div className={cardClasses} onClick={handleClick}>
      {loading ? (
        // Estado de loading
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-border rounded w-20"></div>
            <div className="h-8 w-8 bg-border rounded-full"></div>
          </div>
          <div className="h-8 bg-border rounded w-24"></div>
        </div>
      ) : (
        <>
          {/* Header con título e ícono */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-text-secondary">
              {title}
            </h3>
            {showIcon && displayIcon && (
              <div className={`p-2 rounded-full ${style.iconBg}`}>
                <div className={style.iconColor}>
                  {displayIcon}
                </div>
              </div>
            )}
          </div>
          
          {/* Monto principal */}
          <div className="mb-2">
            <p className={`text-2xl font-bold ${style.textColor || balanceStyle.textClass}`}>
              {formatCurrency(amount)}
            </p>
            {subtitle && (
              <p className="text-sm text-text-secondary mt-1">
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Porcentaje si se proporciona */}
          {percentage !== null && (
            <div className="flex items-center">
              <span className="text-xs text-text-secondary">
                {formatPercentage(percentage)} del total
              </span>
            </div>
          )}
          
          {/* Acción personalizada */}
          {action && (
            <div className="mt-4 pt-4 border-t border-border">
              {action}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Componente especializado para mostrar la fórmula de saldo disponible
 */
export function BalanceFormulaCard({ balance, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border-2 border-border p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-border rounded w-32 mb-4"></div>
          <div className="space-y-2">
            <div className="h-6 bg-border rounded"></div>
            <div className="h-6 bg-border rounded"></div>
            <div className="h-6 bg-border rounded"></div>
            <div className="h-8 bg-border rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!balance) {
    return (
      <div className="bg-white rounded-lg border-2 border-border p-6">
        <p className="text-text-secondary text-center">
          No se pudo cargar la información del saldo
        </p>
      </div>
    );
  }
  
  const total = parseFloat(balance.saldo_total || 0);
  const retenido = parseFloat(balance.saldo_retenido || 0);
  const aplicado = parseFloat(balance.saldo_aplicado || 0);
  const disponible = parseFloat(balance.saldo_disponible || 0);
  
  return (
    <div className="bg-white rounded-lg border-2 border-primary-200 p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Cálculo de Saldo
      </h3>
      
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">Saldo Total:</span>
          <span className="font-semibold text-primary-600">
            {formatCurrency(total)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">- Saldo Retenido:</span>
          <span className="font-semibold text-warning">
            {formatCurrency(retenido)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">- Saldo Aplicado:</span>
          <span className="font-semibold text-info">
            {formatCurrency(aplicado)}
          </span>
        </div>
        
        <hr className="border-border" />
        
        <div className="flex items-center justify-between text-lg">
          <span className="font-semibold text-text-primary">= Saldo Disponible:</span>
          <span className="font-bold text-success">
            {formatCurrency(disponible)}
          </span>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-bg-tertiary rounded-md">
        <p className="text-xs text-text-secondary text-center">
          <strong>Fórmula:</strong> Disponible = Total - Retenido - Aplicado
        </p>
      </div>
    </div>
  );
}

export default BalanceCard;