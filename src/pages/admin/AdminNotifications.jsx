import { useState } from 'react';
import { FaFilter, FaUser } from 'react-icons/fa';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import NotificationPanel from '../../components/ui/NotificationPanel';
import useNotifications from '../../hooks/useNotifications';

const PRIORITY_LABELS = {
  1: { label: 'Alta Prioridad', color: 'text-error', bg: 'bg-error/10' },
  2: { label: 'Media Prioridad', color: 'text-warning', bg: 'bg-warning/10' },
  3: { label: 'Baja Prioridad', color: 'text-text-secondary', bg: 'bg-bg-tertiary' }
};

const ADMIN_NOTIFICATION_TYPES = [
  { value: 'pago_registrado', label: 'Pagos Registrados' },
  { value: 'reembolso_solicitado', label: 'Reembolsos Solicitados' },
  { value: 'billing_generado', label: 'Facturas Generadas' },
  { value: 'penalidad_procesada', label: 'Penalidades Procesadas' },
  { value: 'competencia_perdida_procesada', label: 'Competencias Perdidas' }
];

export default function AdminNotifications() {
  const {
    notifications,
    unreadCount,
    isLoading,
    isError,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
    isMarkingAll,
  } = useNotifications();

  const [adminFilters, setAdminFilters] = useState({
    prioridad: 'todas',
    cliente: '',
    tipo: 'todos'
  });

  // Categorizar notificaciones por prioridad
  const categorizedNotifications = notifications.reduce((acc, notif) => {
    const priority = getPriority(notif.tipo);
    if (!acc[priority]) acc[priority] = [];
    acc[priority].push(notif);
    return acc;
  }, {});

  function getPriority(tipo) {
    const highPriority = ['pago_registrado', 'reembolso_solicitado'];
    const mediumPriority = ['billing_generado', 'penalidad_procesada', 'competencia_perdida_procesada'];
    
    if (highPriority.includes(tipo)) return 1;
    if (mediumPriority.includes(tipo)) return 2;
    return 3;
  }

  // Filtrar notificaciones según filtros admin
  const filteredByPriority = adminFilters.prioridad === 'todas' 
    ? notifications 
    : (categorizedNotifications[parseInt(adminFilters.prioridad)] || []);

  const finalFiltered = filteredByPriority.filter(notif => {
    if (adminFilters.tipo !== 'todos' && notif.tipo !== adminFilters.tipo) return false;
    if (adminFilters.cliente && !(
      (notif.title || '').toLowerCase().includes(adminFilters.cliente.toLowerCase()) ||
      (notif.message || '').toLowerCase().includes(adminFilters.cliente.toLowerCase())
    )) return false;
    return true;
  });

  const requireActionCount = (categorizedNotifications[1] || []).filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Stats rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="outlined" padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-error">{requireActionCount}</div>
            <div className="text-sm text-text-secondary">Requieren Acción</div>
          </div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{unreadCount}</div>
            <div className="text-sm text-text-secondary">No Leídas</div>
          </div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary">{notifications.length}</div>
            <div className="text-sm text-text-secondary">Total</div>
          </div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{notifications.filter(n => n.read).length}</div>
            <div className="text-sm text-text-secondary">Procesadas</div>
          </div>
        </Card>
      </div>

      {/* Filtros específicos admin */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <FaFilter className="w-4 h-4 text-primary-600" />
            <Card.Title className="!m-0">Filtros Admin</Card.Title>
          </div>
        </Card.Header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Prioridad"
            value={adminFilters.prioridad}
            onChange={(e) => setAdminFilters(prev => ({ ...prev, prioridad: e.target.value }))}
            options={[
              { value: 'todas', label: 'Todas las prioridades' },
              { value: '1', label: 'Alta Prioridad (Requieren acción)' },
              { value: '2', label: 'Media Prioridad (Informativas)' },
              { value: '3', label: 'Baja Prioridad (Historial)' }
            ]}
          />

          <Select
            label="Tipo de Evento"
            value={adminFilters.tipo}
            onChange={(e) => setAdminFilters(prev => ({ ...prev, tipo: e.target.value }))}
            options={[
              { value: 'todos', label: 'Todos los tipos' },
              ...ADMIN_NOTIFICATION_TYPES
            ]}
          />

          <Input
            label="Buscar Cliente"
            placeholder="Nombre, documento..."
            value={adminFilters.cliente}
            onChange={(e) => setAdminFilters(prev => ({ ...prev, cliente: e.target.value }))}
            icon={FaUser}
          />
        </div>

        <div className="flex justify-end mt-4">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setAdminFilters({ prioridad: 'todas', cliente: '', tipo: 'todos' })}
          >
            Limpiar Filtros
          </Button>
        </div>
      </Card>

      {/* Resumen por prioridad */}
      {adminFilters.prioridad === 'todas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(priority => {
            const notifs = categorizedNotifications[priority] || [];
            const unreadInPriority = notifs.filter(n => !n.read).length;
            const config = PRIORITY_LABELS[priority];
            
            return (
              <Card key={priority} variant="outlined" padding="sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-semibold ${config.color}`}>{config.label}</div>
                    <div className="text-sm text-text-secondary">
                      {notifs.length} total • {unreadInPriority} no leídas
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAdminFilters(prev => ({ ...prev, prioridad: String(priority) }))}
                  >
                    Ver
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Panel de notificaciones con filtros aplicados */}
      <NotificationPanel
        notifications={finalFiltered}
        unreadCount={unreadCount}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onRefetch={refetch}
        isMarkingAll={isMarkingAll}
        userType="admin"
      />

      {/* Info de filtros activos */}
      {(adminFilters.prioridad !== 'todas' || adminFilters.tipo !== 'todos' || adminFilters.cliente) && (
        <Card variant="info" padding="sm">
          <div className="text-sm">
            <strong>Filtros activos:</strong>
            {adminFilters.prioridad !== 'todas' && ` Prioridad: ${PRIORITY_LABELS[parseInt(adminFilters.prioridad)]?.label}`}
            {adminFilters.tipo !== 'todos' && ` • Tipo: ${ADMIN_NOTIFICATION_TYPES.find(t => t.value === adminFilters.tipo)?.label}`}
            {adminFilters.cliente && ` • Cliente: "${adminFilters.cliente}"`}
            <span className="ml-2">({finalFiltered.length} de {notifications.length} notificaciones)</span>
          </div>
        </Card>
      )}
    </div>
  );
}