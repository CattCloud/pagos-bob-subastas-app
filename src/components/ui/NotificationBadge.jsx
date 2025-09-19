import { FaBell } from 'react-icons/fa';

/**
 * Badge de notificaciones con contador para mostrar en headers
 * Usado en ClientLayout y AdminLayout
 */
export default function NotificationBadge({ 
  count = 0, 
  onClick,
  className = '',
  showZero = false,
  size = 'md'
}) {
  const sizes = {
    sm: { bell: 'w-4 h-4', badge: 'text-xs min-w-4 h-4' },
    md: { bell: 'w-5 h-5', badge: 'text-xs min-w-5 h-5' },
    lg: { bell: 'w-6 h-6', badge: 'text-sm min-w-6 h-6' }
  };

  const showBadge = count > 0 || showZero;
  const displayCount = count > 99 ? '99+' : String(count);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative inline-flex items-center justify-center p-2 rounded-lg
        text-text-secondary hover:text-text-primary hover:bg-bg-tertiary
        transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500
        ${className}
      `}
      title={`${count} notificaciones no leídas`}
    >
      <FaBell className={sizes[size].bell} />
      
      {showBadge && (
        <span className={`
          absolute -top-1 -right-1 inline-flex items-center justify-center
          ${sizes[size].badge} rounded-full bg-error text-white font-bold
          border-2 border-white
        `}>
          {displayCount}
        </span>
      )}
    </button>
  );
}