import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import BillingStatusBadge from '../../components/ui/BillingStatusBadge';
import BillingCompleteForm from '../../components/forms/BillingCompleteForm';
import useBilling from '../../hooks/useBilling';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function AdminBillingDetail() {
  const { billingId } = useParams();
  const { useBillingDetail, refetchAllBillings } = useBilling();
  const { data: billing, isLoading, isError, error, refetch } = useBillingDetail(billingId, 'user,auction');
  const [open, setOpen] = useState(false);

  const isPending =
    !billing?.billing_document_type ||
    !billing?.billing_document_number ||
    !billing?.billing_name;

  const auction = billing?.related?.auction || {};
  const user = billing?.related?.user || {};
  const monto = Number(billing?.monto ?? billing?.amount ?? 0);
  const moneda = billing?.moneda ?? billing?.currency ?? 'USD';
  const concepto = billing?.concepto ?? billing?.concept ?? 'Compra vehículo subasta';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Detalle de Facturación</h1>
            <p className="text-text-secondary mt-1">Visualiza y completa los datos de facturación del cliente.</p>
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
                <div className="md:col-span-2">
                  <p className="text-text-secondary">Cliente</p>
                  <p className="font-medium text-text-primary">
                    {(user.first_name || '') + ' ' + (user.last_name || '')}
                    {(user.document_type || user.document_number) ? ' — ' : ''}
                    {user.document_type} {user.document_number}
                  </p>
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
                Nota: La garantía ya fue aplicada cuando se marcó la subasta como ganada.
              </div>

              <div className="flex justify-between gap-2">
                <Link to="/admin-subastas/billing">
                  <Button variant="outline">Volver a gestión</Button>
                </Link>

                {isPending && (
                  <Button variant="primary" onClick={() => setOpen(true)}>
                    Completar (Admin)
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </Card>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Completar Datos de Facturación (Admin)" size="lg">
        {billing && (
          <div className="p-2">
            <BillingCompleteForm
              billing={billing}
              mode="admin"
              onSuccess={async () => {
                setOpen(false);
                await refetch();
                await refetchAllBillings?.();
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}