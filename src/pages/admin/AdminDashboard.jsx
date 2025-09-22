import { useBalancesSummary } from '../../hooks/useBalance';
import BalanceCard from '../../components/ui/BalanceCard';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { showToast } from '../../utils/toast';
import {
  FaSync,
  FaChartBar,
  FaClock,
  FaUsers,
  FaExclamationTriangle
} from 'react-icons/fa';


function AdminDashboard() {
  const {
    summary,
    isLoading,
    isError,
    error,
    refreshSummary
  } = useBalancesSummary();

  const handleRefresh = async () => {
    try {
      await refreshSummary();
      showToast.success('Resumen actualizado correctamente');
    } catch (refreshError) {
      console.error('Error al actualizar resumen:', refreshError);
      showToast.error('Error al actualizar resumen');
    }
  };

  // Mostrar error si hay problemas
  if (isError) {
    return (
      <div className="space-y-6">
        <Card variant="error" title="Error al cargar datos">
          <div className="text-center py-8">
            <FaExclamationTriangle className="w-16 h-16 text-error mx-auto mb-4" />
            <p className="text-error mb-4">
              {error?.message || 'No se pudo cargar la información del sistema'}
            </p>
            <Button onClick={handleRefresh} variant="error">
              Reintentar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">
            Dashboard Administrativo
          </h1>
          <p className="text-text-secondary mt-1">
            Resumen general del sistema BOB Subastas
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            loading={isLoading}
          >
            <FaSync className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="primary" size="sm">
            <FaChartBar className="w-4 h-4 mr-2" />
            Ver Reportes
          </Button>
        </div>
      </div>

      {/* Cards de resumen de saldos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <BalanceCard
          title="Total en Sistema"
          amount={summary?.stats?.totalAmount || 0}
          type="total"
          subtitle={`${summary?.stats?.totalUsers || 0} clientes activos`}
          loading={isLoading}
        />
        
        <BalanceCard
          title="Total Retenido"
          amount={summary?.stats?.totalRetained || 0}
          type="retenido"
          subtitle="En procesos pendientes"
          loading={isLoading}
        />
        
        <BalanceCard
          title="Total Aplicado"
          amount={summary?.stats?.totalApplied || 0}
          type="aplicado"
          subtitle="Ventas completadas"
          loading={isLoading}
        />
        
        <BalanceCard
          title="Total Disponible"
          amount={summary?.stats?.totalAvailable || 0}
          type="disponible"
          subtitle="Disponible para reembolso"
          loading={isLoading}
        />
      </div>

      {/* Sección de Acciones Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <div className="flex items-center">
              <FaClock className="w-5 h-5 text-warning mr-2" />
              <Card.Title>Acciones Prioritarias</Card.Title>
            </div>
          </Card.Header>
          <div className="space-y-3">
            <Button 
              variant="warning" 
              className="w-full justify-start"
              onClick={() => window.location.href = '/admin-subastas/payments'}
            >
              <FaClock className="w-4 h-4 mr-2" />
              Validar Pagos Pendientes
            </Button>
            <Button 
              variant="info" 
              className="w-full justify-start"
              onClick={() => window.location.href = '/admin-subastas/competition'}
            >
              <FaChartBar className="w-4 h-4 mr-2" />
              Gestionar Resultados Competencia
            </Button>
            <Button 
              variant="primary" 
              className="w-full justify-start"
              onClick={() => window.location.href = '/admin-subastas/refunds'}
            >
              <FaUsers className="w-4 h-4 mr-2" />
              Procesar Reembolsos
            </Button>
          </div>
        </Card>

        <Card>
          <Card.Header>
            <div className="flex items-center">
              <FaUsers className="w-5 h-5 text-primary-600 mr-2" />
              <Card.Title>Estadísticas del Sistema</Card.Title>
            </div>
          </Card.Header>
          <div className="space-y-4">
            {isLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-border rounded w-full"></div>
                <div className="h-4 bg-border rounded w-3/4"></div>
                <div className="h-4 bg-border rounded w-1/2"></div>
              </div>
            ) : summary ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Clientes activos:</span>
                  <span className="font-semibold text-text-primary">
                    {summary.stats?.totalUsers || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Promedio por cliente:</span>
                  <span className="font-semibold text-primary-600">
                    {formatCurrency(summary.stats?.averageBalance || 0)}
                  </span>
                </div>
                
                <hr className="border-border" />
                
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Última actualización:</span>
                  <span className="text-text-primary text-sm">
                    {formatDate(new Date(), { includeTime: true })}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-text-secondary text-center">
                No hay datos disponibles
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Acciones rápidas del admin */}
      <Card title="Gestión del Sistema">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            variant="primary" 
            className="w-full"
            onClick={() => window.location.href = '/admin-subastas/auctions'}
          >
            Gestionar Subastas
          </Button>
          
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={() => window.location.href = '/admin-subastas/balances'}
          >
            Ver Saldos
          </Button>
          
          <Button 
            variant="success" 
            className="w-full"
            onClick={() => window.location.href = '/admin-subastas/billing'}
          >
            Facturación
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.href = '/admin-subastas/notifications'}
          >
            Notificaciones
          </Button>
        </div>
      </Card>

    </div>
  );
}

export default AdminDashboard;