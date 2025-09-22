import React from 'react';
import BillingCard from '../../components/ui/BillingCard';
import useBilling from '../../hooks/useBilling';
import Card from '../../components/ui/Card';

export default function BillingList() {
  const {
    userBillings,
    isLoadingUserBillings,
    isErrorUserBillings,
    errorUserBillings,
    refetchUserBillings,
  } = useBilling();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-text-primary">Mis Facturaciones</h1>
        <p className="text-text-secondary mt-1">
          Revisa el estado de tus facturaciones. Si alguna tiene datos pendientes, complétalos para finalizar el proceso.
        </p>
      </div>

      <Card>
        <Card.Header>
          <Card.Title className="!m-0">Listado de Facturaciones</Card.Title>
        </Card.Header>

        <div className="space-y-4">
          {isLoadingUserBillings && (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border border-border rounded-lg animate-pulse">
                  <div className="h-4 bg-border rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-border rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-border rounded w-1/3"></div>
                </div>
              ))}
            </>
          )}

          {!isLoadingUserBillings && isErrorUserBillings && (
            <div className="p-4 border border-error/30 bg-error/5 text-error rounded-lg text-sm">
              {errorUserBillings?.message || 'Error al cargar facturaciones'}
              <div className="mt-2">
                <button
                  className="px-3 py-1.5 rounded border border-border hover:bg-bg-tertiary"
                  onClick={refetchUserBillings}
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {!isLoadingUserBillings && !isErrorUserBillings && userBillings.length === 0 && (
            <div className="p-8 border border-border rounded-lg text-center text-text-secondary">
              No tienes facturaciones registradas.
            </div>
          )}

          {!isLoadingUserBillings && !isErrorUserBillings && userBillings.length > 0 && (
            <div className="space-y-3">
              {userBillings.map((billing) => (
                <BillingCard
                  key={billing.id}
                  billing={billing}
                  basePath="/pago-subastas"
                  showCompleteAction
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}