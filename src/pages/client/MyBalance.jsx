import { Link } from 'react-router-dom';
import { useBalance } from '../../hooks/useBalance';
import BalanceCard, { BalanceFormulaCard } from '../../components/ui/BalanceCard';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { formatDate, formatRelativeDate } from '../../utils/formatters';
import { showToast } from '../../utils/toast';

function MyBalance() {
  const {
    balance,
    isLoading,
    isError,
    error,
    refreshBalance,
    saldoTotal,
    saldoRetenido,
    saldoAplicado,
    saldoDisponible,
    getBalancePercentages,
    balanceValidation,
    updatedAt
  } = useBalance();

  const percentages = getBalancePercentages();

  const handleRefresh = async () => {
    try {
      await refreshBalance();
      showToast.success('Saldo actualizado correctamente');
    } catch (refreshError) {
      console.error('Error al actualizar saldo:', refreshError);
      showToast.error('Error al actualizar saldo');
    }
  };

  // Mostrar error si hay problemas
  if (isError) {
    return (
      <div className="space-y-6">
        <Card variant="error" title="Error al cargar saldo">
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-error mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-error mb-4">
              {error?.message || 'No se pudo cargar la información del saldo'}
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
      {/* Header con título y acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Mi Saldo</h1>
          <p className="text-text-secondary mt-1">
            Consulta tu saldo actual calculado en tiempo real
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            loading={isLoading}
          >
            Actualizar
          </Button>
          <Link to="/pago-subastas/transactions">
            <Button variant="primary" size="sm">
              Ver Historial
            </Button>
          </Link>
        </div>
      </div>

      {/* Cards de saldo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <BalanceCard
          title="Saldo Total"
          amount={saldoTotal}
          type="total"
          percentage={100}
          subtitle="Dinero ingresado al sistema"
          loading={isLoading}
        />
        
        <BalanceCard
          title="Saldo Retenido"
          amount={saldoRetenido}
          type="retenido"
          percentage={percentages.retenido}
          subtitle="En procesos pendientes"
          loading={isLoading}
        />
        
        <BalanceCard
          title="Saldo Aplicado"
          amount={saldoAplicado}
          type="aplicado"
          percentage={percentages.aplicado}
          subtitle="Utilizado en compras"
          loading={isLoading}
        />
        
        <BalanceCard
          title="Saldo Disponible"
          amount={saldoDisponible}
          type="disponible"
          percentage={percentages.disponible}
          subtitle="Puedes usar o solicitar reembolso"
          loading={isLoading}
          action={
            saldoDisponible > 0 ? (
              <Link to="/pago-subastas/refunds">
                <Button variant="success" size="sm" className="w-full">
                  Solicitar Reembolso
                </Button>
              </Link>
            ) : null
          }
        />
      </div>

      {/* Fórmula de cálculo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BalanceFormulaCard balance={balance} loading={isLoading} />
        
        {/* Información adicional */}
        <Card title="Información del Saldo">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Última actualización:</span>
              <span className="text-text-primary font-medium">
                {updatedAt ? formatRelativeDate(updatedAt) : 'N/A'}
              </span>
            </div>
            
            {updatedAt && (
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Fecha exacta:</span>
                <span className="text-text-primary text-sm">
                  {formatDate(updatedAt, { includeTime: true })}
                </span>
              </div>
            )}
            
            <hr className="border-border" />
            
            <div className="space-y-2">
              <h4 className="font-semibold text-text-primary">Enlaces rápidos:</h4>
              <div className="grid grid-cols-1 gap-2">
                <Link 
                  to="/pago-subastas/transactions"
                  className="text-primary-600 hover:text-primary-700 text-sm transition-colors"
                >
                  Ver historial de transacciones
                </Link>
                <Link 
                  to="/pago-subastas/payment"
                  className="text-primary-600 hover:text-primary-700 text-sm transition-colors"
                >
                  Registrar nuevo pago
                </Link>
                {saldoDisponible > 0 && (
                  <Link 
                    to="/pago-subastas/refunds"
                    className="text-success hover:text-success/80 text-sm transition-colors"
                  >
                    Solicitar reembolso
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Alertas de validación si hay problemas */}
      {balanceValidation && !balanceValidation.isValid && (
        <Card variant="warning" title="⚠️ Inconsistencia en Saldo">
          <div className="space-y-2">
            <p className="text-warning text-sm">
              Se detectaron inconsistencias en el cálculo de tu saldo:
            </p>
            <ul className="text-warning text-xs space-y-1 ml-4">
              {balanceValidation.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
            <div className="mt-4">
              <Button 
                variant="warning" 
                size="sm" 
                onClick={handleRefresh}
              >
                Recalcular Saldo
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Información explicativa */}
      <Card variant="ghost" title="¿Cómo funciona mi saldo?">
        <div className="text-sm text-text-secondary space-y-3">
          <div>
            <strong className="text-primary-600">Saldo Total:</strong> Todo el dinero que has ingresado al sistema mediante pagos de garantía validados.
          </div>
          <div>
            <strong className="text-warning">Saldo Retenido:</strong> Dinero temporalmente congelado mientras BOB compite externamente o procesos están pendientes.
          </div>
          <div>
            <strong className="text-info">Saldo Aplicado:</strong> Dinero ya utilizado para compras completadas (cuando BOB gana y se genera factura).
          </div>
          <div>
            <strong className="text-success">Saldo Disponible:</strong> Dinero que puedes usar para nuevas garantías o solicitar reembolso.
          </div>
        </div>
      </Card>
    </div>
  );
}

export default MyBalance;