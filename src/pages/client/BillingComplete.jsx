import React, { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import BillingCompleteForm from '../../components/forms/BillingCompleteForm';
import BillingStatusBadge from '../../components/ui/BillingStatusBadge';
import useBilling from '../../hooks/useBilling';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { showToast } from '../../utils/toast';

export default function ClientBillingComplete() {
  const { billingId } = useParams();
  const navigate = useNavigate();
  const { useBillingDetail } = useBilling();
  const {
    data: billing,
    isLoading,
    isError,
    error,
    refetch,
  } = useBillingDetail(billingId, 'auction');

  const isPending =
    !billing?.billing_document_type ||
    !billing?.billing_document_number ||
    !billing?.billing_name;

  // Si la facturación ya está completada, redirigir a detalle (VN-01)
  useEffect(() => {
    if (!isLoading && billing && !isPending) {
      showToast.info('Esta facturación ya fue completada.');
      navigate(`/pago-subastas/billing/${billing.id}`);
    }
  }, [isLoading, billing, isPending, navigate]);

  const auction = billing?.related?.auction || {};
  const monto = Number(billing?.monto ?? billing?.amount ?? 0);
  const moneda = billing?.moneda ?? billing?.currency ?? 'USD';
  const concepto = billing?.concepto ?? billing?.concept ?? 'Compra vehículo subasta';
  const imageUrl = auction?.imagen_url || auction?.image_url || auction?.asset?.image_url || null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Completar Datos de Facturación</h1>
            <p className="text-success font-semibold mt-1">¡Felicitaciones! BOB ganó la competencia</p>
            <p className="text-text-secondary mt-1">
              Ingresa los datos solicitados para completar la facturación. Este paso es definitivo.
            </p>
          </div>
          {billing && <BillingStatusBadge billing={billing} />}
        </div>
      </div>

      {/* Imagen destacada del vehículo (UX-02) */}
      {imageUrl && (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
          <img
            src={imageUrl}
            alt="Vehículo ganado"
            className="w-full max-h-64 object-cover"
          />
        </div>
      )}

      <Card>
        <Card.Header>
          <Card.Title className="!m-0">Resumen</Card.Title>
        </Card.Header>

        <div className="p-4">
          {isLoading && (
            <div className="p-4 border border-border rounded-lg animate-pulse">
              <div className="h-4 bg-border rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-border rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-border rounded w-1/3"></div>
            </div>
          )}

          {!isLoading && isError && (
            <div className="p-4 border border-error/30 bg-error/5 text-error rounded-lg text-sm">
              {error?.message || 'Error al cargar la facturación'}
              <div className="mt-2">
                <Button size="sm" variant="outline" onClick={refetch}>Reintentar</Button>
              </div>
            </div>
          )}

          {!isLoading && !isError && billing && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-text-secondary">ID Facturación</p>
                  <p className="font-semibold text-text-primary">{billing.id}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Creado</p>
                  <p className="font-medium">{formatDate(billing.created_at)}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Monto</p>
                  <p className="font-bold text-text-primary">
                    {formatCurrency(monto, { currency: moneda })}
                  </p>
                </div>
                <div>
                  <p className="text-text-secondary">Concepto</p>
                  <p className="font-medium text-text-primary">{concepto}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Placa</p>
                  <p className="font-medium text-text-primary">{auction.placa || '—'}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Vehículo</p>
                  <p className="font-medium text-text-primary">
                    {[auction.marca, auction.modelo, auction.año].filter(Boolean).join(' ') || '—'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-text-secondary">Empresa Propietaria</p>
                  <p className="font-medium text-text-primary">{auction.empresa_propietaria || '—'}</p>
                </div>
              </div>

              <div className="border-t border-border my-3" />

              <BillingCompleteForm
                billing={billing}
                mode="client"
                onSuccess={() => navigate(`/pago-subastas/billing/${billing.id}`)}
              />

              <div className="flex justify-between mt-4">
                <Link to="/pago-subastas/billing">
                  <Button variant="outline">Volver al listado</Button>
                </Link>
                {!isPending && (
                  <Button variant="secondary" onClick={() => navigate(`/pago-subastas/billing/${billing.id}`)}>
                    Ver detalle
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}