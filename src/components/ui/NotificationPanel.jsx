import { useState, useMemo } from 'react';
import { FaBell, FaFilter, FaTimes } from 'react-icons/fa';
import Card from './Card';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import NotificationCard from './NotificationCard';
import { useNavigate } from 'react-router-dom';

const NOTIFICATION_ACTIONS = {
  ganador_subasta: '/pago-subastas/payment',
  pago_validado: '/pago-subastas',
  pago_rechazado: '/pago-subastas/payment',
  competencia_ganada: '/pago-subastas', // TODO: billing cuando esté implementado
  competencia_perdida: '/pago-subastas/refunds',
  penalidad_aplicada: '/pago-subastas/refunds',
  reembolso_procesado: '/pago-subastas/transactions',
  facturacion_completada: '/pago-subastas/transactions',
  // Admin actions
  pago_registrado: '/admin-subastas', // validation dashboard
  reembolso_solicitado: '/admin-subastas/refunds',
  billing_generado: '/admin-subastas/billing',
};

/**
 * Panel de notificaciones reutilizable para cliente y admin
 * Incluye filtros, paginación y navegación contextual
 */
export default function NotificationPanel({
  notifications = [],
  unreadCount = 0,
  isLoading = false,
  isError = false,
  error = null,
  onMarkAsRead,
  onMarkAllAsRead,
  onRefetch,
  isMarkingAll = false,
  userType = 'client', // 'client' | 'admin'
  className = ''
}) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    estado: 'todas', // todas | no_leidas | leidas
    tipo: 'todos', // todos | tipo específico
    periodo: 'todos', // todos | 7d | 30d
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Filtros rápidos para cliente
  const clientQuickFilters = [
    { key: 'todas', label: 'Todas', count: notifications.length },
    { key: 'no_leidas', label: 'No leídas', count: unreadCount },
    { key: '7d', label: 'Últimos 7 días', count: notifications.filter(n => {
      if (!n.created_at) return false;
      const days = (Date.now() - new Date(n.created_at).getTime()) / (1000 * 60 * 60 * 24);
      return days <= 7;
    }).length }
  ];

  // Tipos disponibles para filtrar
  const notificationTypes = useMemo(() => {
    const types = [...new Set(notifications.map(n => n.tipo).filter(Boolean))];
    return types.map(tipo => ({
      value: tipo,
      label: tipo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }));
  }, [notifications]);

  // Aplicar filtros
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    // Filtro por estado
    if (filters.estado === 'no_leidas') {
      filtered = filtered.filter(n => !n.read);
    } else if (filters.estado === 'leidas') {
      filtered = filtered.filter(n => n.read);
    }

    // Filtro por tipo
    if (filters.tipo !== 'todos') {
      filtered = filtered.filter(n => n.tipo === filters.tipo);
    }

    // Filtro por período
    if (filters.periodo !== 'todos') {
      const now = Date.now();
      const days = filters.periodo === '7d' ? 7 : 30;
      const cutoff = now - (days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(n => {
        if (!n.created_at) return false;
        return new Date(n.created_at).getTime() >= cutoff;
      });
    }

    // Filtro por búsqueda
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase().trim();
      filtered = filtered.filter(n => 
        (n.title || '').toLowerCase().includes(searchLower) ||
        (n.message || '').toLowerCase().includes(searchLower)
      );
    }

    // Ordenar: admin por prioridad, cliente por fecha
    if (userType === 'admin') {
      const priorityOrder = {
        pago_registrado: 1,
        reembolso_solicitado: 1,
        billing_generado: 2,
        penalidad_procesada: 2,
        competencia_perdida_procesada: 2
      };
      
      filtered.sort((a, b) => {
        const prioA = priorityOrder[a.tipo] || 3;
        const prioB = priorityOrder[b.tipo] || 3;
        
        if (prioA !== prioB) return prioA - prioB;
        
        // Mismo nivel de prioridad: ordenar por fecha desc
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
    } else {
      // Cliente: ordenar por fecha desc
      filtered.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
    }

    return filtered;
  }, [notifications, filters, userType]);

  const handleNotificationClick = (notification) => {
    // Marcar como leída al hacer click
    if (!notification.read) {
      onMarkAsRead?.(notification.id);
    }

    // Navegación contextual según tipo
    const action = NOTIFICATION_ACTIONS[notification.tipo];
    if (action) {
      navigate(action);
    }
  };

  const clearFilters = () => {
    setFilters({
      estado: 'todas',
      tipo: 'todos', 
      periodo: 'todos',
      search: ''
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FaBell className="w-5 h-5 text-primary-600" />
          <h2 className="text-xl font-semibold text-text-primary">
            {userType === 'admin' ? 'Notificaciones del Sistema' : 'Mis Notificaciones'}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary">
            {userType === 'admin' ? `${unreadCount} requieren atención` : `${unreadCount} no leídas`}
          </span>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            title="Filtros"
          >
            <FaFilter className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0 || isMarkingAll}
            loading={isMarkingAll}
          >
            Marcar todas como leídas
          </Button>
        </div>
      </div>

      {/* Filtros rápidos para cliente */}
      {userType === 'client' && (
        <div className="flex gap-2 overflow-x-auto">
          {clientQuickFilters.map(filter => (
            <button
              key={filter.key}
              onClick={() => {
                if (filter.key === '7d') {
                  setFilters(prev => ({ ...prev, periodo: '7d', estado: 'todas' }));
                } else if (filter.key === 'no_leidas') {
                  setFilters(prev => ({ ...prev, estado: 'no_leidas', periodo: 'todos' }));
                } else {
                  setFilters(prev => ({ ...prev, estado: 'todas', periodo: 'todos' }));
                }
              }}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                ${(filter.key === 'todas' && filters.estado === 'todas' && filters.periodo === 'todos') ||
                  (filter.key === 'no_leidas' && filters.estado === 'no_leidas') ||
                  (filter.key === '7d' && filters.periodo === '7d')
                  ? 'bg-primary-600 text-white' 
                  : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                }
              `}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      )}

      {/* Filtros avanzados (colapsable) */}
      {showFilters && (
        <Card variant="outlined" padding="sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Estado"
              value={filters.estado}
              onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
              options={[
                { value: 'todas', label: 'Todas' },
                { value: 'no_leidas', label: 'No leídas' },
                { value: 'leidas', label: 'Leídas' }
              ]}
            />

            <Select
              label="Tipo"
              value={filters.tipo}
              onChange={(e) => setFilters(prev => ({ ...prev, tipo: e.target.value }))}
              options={[
                { value: 'todos', label: 'Todos los tipos' },
                ...notificationTypes
              ]}
            />

            <Select
              label="Período"
              value={filters.periodo}
              onChange={(e) => setFilters(prev => ({ ...prev, periodo: e.target.value }))}
              options={[
                { value: 'todos', label: 'Todas las fechas' },
                { value: '7d', label: 'Últimos 7 días' },
                { value: '30d', label: 'Últimos 30 días' }
              ]}
            />

            <Input
              label="Buscar"
              placeholder="Título o mensaje..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={clearFilters}>
              Limpiar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowFilters(false)}>
              <FaTimes className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Contenido */}
      <Card>
        <div className="space-y-3">
          {isLoading && (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border border-border rounded-lg animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-border rounded-full shrink-0"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-border rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-border rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {!isLoading && isError && (
            <div className="p-4 border border-error/30 bg-error/5 text-error rounded-lg text-sm">
              {error?.message || 'Error al cargar notificaciones.'}
              <div className="mt-2">
                <Button size="sm" variant="outline" onClick={onRefetch}>
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !isError && filteredNotifications.length === 0 && (
            <div className="p-6 border border-border rounded-lg text-center text-text-secondary">
              {notifications.length === 0 ? (
                <div>
                  <FaBell className="w-8 h-8 mx-auto mb-2 text-text-muted" />
                  <p className="font-medium">No tienes notificaciones por ahora</p>
                  <p className="text-sm mt-1">
                    {userType === 'admin' 
                      ? 'Los eventos importantes del sistema aparecerán aquí.'
                      : 'Las notificaciones sobre tus subastas y pagos aparecerán aquí.'
                    }
                  </p>
                </div>
              ) : (
                <p>No hay notificaciones que coincidan con los filtros seleccionados.</p>
              )}
            </div>
          )}

          {!isLoading && !isError && filteredNotifications.length > 0 && (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onMarkAsRead={onMarkAsRead}
                  showActions={!notification.read}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Info de filtros activos */}
      {(filters.estado !== 'todas' || filters.tipo !== 'todos' || filters.periodo !== 'todos' || filters.search) && (
        <div className="text-xs text-text-secondary">
          Mostrando {filteredNotifications.length} de {notifications.length} notificaciones
          {filters.search && ` • Búsqueda: "${filters.search}"`}
        </div>
      )}
    </div>
  );
}