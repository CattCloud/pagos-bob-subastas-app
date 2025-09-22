import React from 'react';

function isPending(billing) {
  if (!billing) return true;
  const t = billing.billing_document_type;
  const n = billing.billing_document_number;
  const name = billing.billing_name;
  return !t || !n || !name;
}

export default function BillingStatusBadge({ billing, className = '' }) {
  const pending = isPending(billing);

  return (
    <span
      className={[
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border',
        pending
          ? 'bg-error/10 text-error border-error/20'
          : 'bg-success/10 text-success border-success/20',
        className,
      ].join(' ')}
      title={pending ? 'Datos de facturación pendientes' : 'Facturación completada'}
    >
      {pending ? 'Pendiente' : 'Completada'}
    </span>
  );
}