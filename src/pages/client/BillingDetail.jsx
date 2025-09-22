import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import BillingStatusBadge from '../../components/ui/BillingStatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import useBilling from '../../hooks/useBilling';

export default function ClientBillingDetail() {
  const { billingId } = useParams();
  const navigate = useNavigate();
  const { useBillingDetail } = useBilling();
  const { data: billing, isLoading, isError, error, refetch } = useBillingDetail(billingId, 'auction');

  const isPending =
    !billing?.billing_document_type ||
    !billing?.billing_document_number ||
    !billing?.billing_name;

  const auction = billing?.related?.auction || {};
  const monto = Number(billing?.monto ?? billing?.amount ?? 0);
  const moneda = billing?.moneda ?? billing?.currency ?? 'USD';
  const concepto = billing?.concepto ?? billing?.concept ?? 'Compra vehículo subasta';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Detalle de Facturación</h1>
            <p className="text-text-secondary mt-1">
              Revisa los datos de tu facturación y complétalos si están pendientes.
            </p>
          </div>
          {billing && <BillingStatusBadge billing={billing} />}
        </div>
      </div>

      <Card>
        <Card.Header>
          <Card.Title className="!m-0">Información</Card.Title>
        </Card.Header>

        <div className="p-4 space-y-4">
          {isLoading && (
            <div className="p-4 border border-border rounded-lg animate-pulse">
              <div className="h-4 bg-border rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-border rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-border rounded w-1/3"></div>
            </div>
          )}

          {!isLoading && isError && (
            <div className="p-4 border border-error/30 bg-error/5 text-error rounded-lg text-sm">
              {error?.message || 'Error al cargar el detalle'}
              <div className="mt-2">
                <Button size="sm" variant="outline" onClick={refetch}>Reintentar</Button>
              </div>
            </div>
          )}

          {!isLoading && !isError && billing && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
              </div>

              <div className="border-t border-border my-2" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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

              <div className="border-t border-border my-2" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-text-secondary">Tipo Documento</p>
                  <p className="font-medium text-text-primary">{billing.billing_document_type || '—'}</p>
                </div>
                <div>
                  <p className="text-text-secondary">N° Documento</p>
                  <p className="font-medium text-text-primary">{billing.billing_document_number || '—'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-text-secondary">Nombre / Razón social</p>
                  <p className="font-medium text-text-primary">{billing.billing_name || '—'}</p>
                </div>
              </div>

              <div className="text-xs text-text-secondary mt-2">
                Nota: Su garantía ya fue aplicada cuando se marcó la subasta como ganada.
              </div>

              <div className="flex justify-end gap-2">
                <Link to="/pago-subastas/billing">
                  <Button variant="outline">Volver al listado</Button>
                </Link>

                {isPending && (
                  <Button variant="primary" onClick={() => navigate(`/pago-subastas/billing/${billing.id}/complete`)}>
                    Completar Datos
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