import React from 'react';
import { Link } from 'react-router-dom';
import Card from './Card';
import Button from './Button';
import BillingStatusBadge from './BillingStatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { FaMoneyBillWave, FaCalendarAlt, FaCar, FaBuilding, FaUserTie, FaFileInvoice } from "react-icons/fa";

/**
 * Card para visualizar una facturación (Cliente/Admin)
 * Props:
 * - billing: objeto billing (incluye related.auction cuando include=auction)
 * - basePath: prefijo de ruta para los links (ej: '/pago-subastas' o '/admin-subastas')
 * - showCompleteAction: bool, muestra botón "Completar Datos" si está pendiente
 * - onCompleteClick: callback opcional si se quiere interceptar el click de completar
 * - showUser (admin): muestra datos de usuario si vienen en related.user
 */
export default function BillingCard({
  billing,
  basePath = '/pago-subastas',
  showCompleteAction = false,
  onCompleteClick,
  showUser = false,
}) {
  const id = billing?.id;
  const auction = billing?.related?.auction || {};
  const user = billing?.related?.user || {};
  const isPending =
    !billing?.billing_document_type ||
    !billing?.billing_document_number ||
    !billing?.billing_name;

  const monto = Number(billing?.monto ?? billing?.amount ?? 0);
  const moneda = billing?.moneda ?? billing?.currency ?? 'USD';
  const concepto = billing?.concepto ?? billing?.concept ?? 'Compra vehículo subasta';

  return (
 
<Card
  variant="outlined"
  padding="lg"
  className="w-full bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
>
  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

    {/* Sección principal de información */}
    <div className="flex-1 min-w-0 space-y-3">

      {/* Encabezado con ID y estado */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          to={`${basePath}/billing/${id}`}
          className="text-xl font-bold text-primary-700 hover:underline truncate"
          title={`Ver detalle de facturación ${id}`}
        >
          <FaFileInvoice className="inline-block mr-2 text-primary-500" />
          Facturación #{id?.slice(-6)}
        </Link>

        <BillingStatusBadge billing={billing} />
      </div>

      {/* Grid de detalles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-6 gap-y-3 text-sm">

        {/* Monto */}
        <div className="flex items-center gap-2">
          <FaMoneyBillWave className="text-success w-4 h-4 shrink-0" />
          <span className="font-medium text-text-primary">
            Monto: {formatCurrency(monto, { currency: moneda })}
          </span>
        </div>

        {/* Concepto */}
        <div className="truncate">
          <span className="font-medium text-text-primary">Concepto: </span>
          <span className="text-text-primary">{concepto}</span>
        </div>


        {/* Placa */}
        <div className="flex items-center gap-2">
          <FaCar className="text-text-secondary w-4 h-4 shrink-0" />
          <span className="text-text-primary">{[auction.marca, auction.modelo, auction.año, "/"].filter(Boolean).join(" ") + auction.placa  || "—"}</span>
        </div>


        {/* Empresa */}
        <div className="flex items-center gap-2">
          <FaBuilding className="text-text-secondary w-4 h-4 shrink-0" />
          <span className="text-text-primary">{auction.empresa_propietaria || "—"}</span>
        </div>


  

        {/* Cliente */}
        {showUser && (user?.first_name || user?.last_name) && (
          <div className="col-span-full flex items-center gap-2">
            <FaUserTie className="text-primary-500 w-4 h-4 shrink-0" />
            <span className="text-text-primary">
              {user.first_name} {user.last_name}
              {user.document_type || user.document_number ? " — " : ""}
              {user.document_type} {user.document_number}
            </span>
          </div>
        )}
              {/* Fecha */}
        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-text-secondary w-4 h-4 shrink-0" />
          <span>Creacion: {formatDate(billing?.created_at, { includeTime: false })}</span>
        </div>

      </div>
    </div>

    {/* Acciones */}
    <div className="flex gap-2 flex-wrap justify-end md:justify-start">
      <Link to={`${basePath}/billing/${id}`}>
        <Button variant="secondary">Ver Detalle</Button>
      </Link>

      {showCompleteAction && isPending && (
        onCompleteClick ? (
          <Button variant="primary" onClick={() => onCompleteClick(billing)}>
            Completar Datos
          </Button>
        ) : (
          <Link to={`${basePath}/billing/${id}/complete`}>
            <Button variant="primary">Completar Datos</Button>
          </Link>
        )
      )}
    </div>
  </div>
</Card>

  );
}