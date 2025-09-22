import React from 'react';
import { 
  FaInbox, 
  FaFileInvoice, 
  FaMoneyBillWave, 
  FaBell, 
  FaGavel, 
  FaUser,
  FaSearch,
  FaExclamationCircle 
} from 'react-icons/fa';
import Button from '../Button';

/**
 * Componente de estado vacío centralizado
 * Contextualizado para diferentes módulos de BOB Subastas
 */
export default function EmptyState({
  type = 'general', // 'general' | 'transactions' | 'auctions' | 'refunds' | 'billing' | 'notifications' | 'search' | 'noData'
  title,
  message,
  actionText,
  onAction,
  secondaryText,
  onSecondary,
  className = '',
  compact = false,
}) {
  const emptyTypes = {
    general: {
      icon: FaInbox,
      color: 'text-text-secondary',
      defaultTitle: 'No hay datos',
      defaultMessage: 'No se encontró información para mostrar.',
    },
    transactions: {
      icon: FaMoneyBillWave,
      color: 'text-primary-600',
      defaultTitle: 'Sin transacciones',
      defaultMessage: 'Aún no tienes movimientos registrados. Las transacciones aparecerán aquí una vez que realices pagos o reembolsos.',
    },
    auctions: {
      icon: FaGavel,
      color: 'text-warning',
      defaultTitle: 'Sin subastas',
      defaultMessage: 'No hay subastas disponibles en este momento.',
    },
    refunds: {
      icon: FaMoneyBillWave,
      color: 'text-info',
      defaultTitle: 'Sin reembolsos',
      defaultMessage: 'No tienes solicitudes de reembolso registradas.',
    },
    billing: {
      icon: FaFileInvoice,
      color: 'text-success',
      defaultTitle: 'Sin facturaciones',
      defaultMessage: 'No tienes facturaciones pendientes o completadas.',
    },
    notifications: {
      icon: FaBell,
      color: 'text-text-muted',
      defaultTitle: 'Sin notificaciones',
      defaultMessage: 'No tienes notificaciones por ahora. Los eventos importantes aparecerán aquí.',
    },
    search: {
      icon: FaSearch,
      color: 'text-text-secondary',
      defaultTitle: 'Sin resultados',
      defaultMessage: 'No se encontraron resultados que coincidan con tu búsqueda.',
    },
    noData: {
      icon: FaExclamationCircle,
      color: 'text-text-muted',
      defaultTitle: 'Sin información',
      defaultMessage: 'No hay datos disponibles para mostrar.',
    },
    users: {
      icon: FaUser,
      color: 'text-text-secondary',
      defaultTitle: 'Sin usuarios',
      defaultMessage: 'No hay usuarios registrados en el sistema.',
    },
  };

  const config = emptyTypes[type] || emptyTypes.general;
  const IconComponent = config.icon;

  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || config.defaultMessage;

  const containerClasses = compact
    ? 'p-4 text-center'
    : 'p-8 text-center';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex flex-col items-center">
        <IconComponent className={`${config.color} ${compact ? 'w-8 h-8' : 'w-16 h-16'} mb-4`} />
        
        <h3 className={`font-semibold text-text-primary ${compact ? 'text-base' : 'text-lg'} mb-2`}>
          {displayTitle}
        </h3>
        
        <p className={`text-text-secondary ${compact ? 'text-sm' : ''} mb-6 max-w-md`}>
          {displayMessage}
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          {onAction && (
            <Button 
              variant="primary" 
              size={compact ? 'sm' : 'md'}
              onClick={onAction}
            >
              {actionText || 'Comenzar'}
            </Button>
          )}
          
          {onSecondary && (
            <Button 
              variant="outline" 
              size={compact ? 'sm' : 'md'}
              onClick={onSecondary}
            >
              {secondaryText || 'Ver todo'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}