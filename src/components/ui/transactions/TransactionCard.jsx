import { FaArrowDown, FaArrowUp, FaCheckCircle, FaTimesCircle, FaClock, FaFileInvoice, FaMoneyBillWave } from 'react-icons/fa';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import Button from '../Button';
import Card from '../Card';
import { useEffect, useState } from 'react';
import useAuth from '../../../hooks/useAuth';
import AuctionService from '../../../services/auctionService';

const StateBadge = ({ estado }) => {
  const states = {
    pendiente: { text: 'Pendiente', className: 'text-warning bg-warning/10 border-warning/20' },
    validado: { text: 'Validado', className: 'text-success bg-success/10 border-success/20' },
    rechazado: { text: 'Rechazado', className: 'text-error bg-error/10 border-error/20' },
  };
  const s = states[estado] || { text: estado, className: 'text-text-secondary bg-bg-tertiary border-border' };
  const Icon = estado === 'validado' ? FaCheckCircle : estado === 'rechazado' ? FaTimesCircle : FaClock;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border ${s.className}`}>
      <Icon className="w-3 h-3" />
      {s.text}
    </span>
  );
};

const TypeBadge = ({ general, especifico }) => {
  const isEntrada = general === 'entrada';
  const Icon = isEntrada ? FaArrowDown : FaArrowUp;
  const color = isEntrada ? 'text-success' : 'text-error';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border ${color} ${isEntrada ? 'bg-success/10 border-success/20' : 'bg-error/10 border-error/20'}`}>
      <Icon className="w-3 h-3" />
      {especifico || general}
    </span>
  );
};

function TransactionCard({ movement, onDetail }) {
  const {
    id,
    tipo_movimiento_general,
    tipo_movimiento_especifico,
    monto,
    moneda = 'USD',
    estado,
    concepto,
    numero_operacion,
    created_at,
  } = movement;

  const { user } = useAuth();
  const isAdmin = user?.user_type === 'admin';

  // Utilidad para extraer alias múltiples
  const pick = (obj, keys = []) => {
    for (const k of keys) {
      const v = k.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return '';
  };

  // Fecha de pago preferente; fallback a created_at
  const pagoDate = pick(movement, ['fecha_pago', 'payment_date', 'fecha']) || created_at;

  // Datos de usuario (solo admin). Soporta objetos y campos aplanados
  const firstName = pick(movement, [
    'user.first_name', 'user.nombres',
    'cliente.first_name', 'cliente.nombres',
    'owner.first_name', 'owner.nombres',
    'user_first_name', 'first_name', 'nombres'
  ]);
  const lastName = pick(movement, [
    'user.last_name', 'user.apellidos',
    'cliente.last_name', 'cliente.apellidos',
    'owner.last_name', 'owner.apellidos',
    'user_last_name', 'last_name', 'apellidos'
  ]);
  const docType = pick(movement, [
    'user.document_type', 'cliente.document_type', 'owner.document_type',
    'user_document_type', 'document_type'
  ]);
  const docNumber = pick(movement, [
    'user.document_number', 'cliente.document_number', 'owner.document_number',
    'user_document_number', 'document_number'
  ]);
  const userLine = [firstName, lastName].filter(Boolean).join(' ');
  const userDoc = docNumber ? `${docType ? docType + ' ' : ''}${docNumber}` : '';

  // Completar datos de usuario por ID si no llegan nombres/documento (solo admin)
  const paymentUserId = pick(movement, ['user_id', 'user.id', 'cliente.id', 'owner.id']);
  const [userFromApi, setUserFromApi] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (isAdmin && !userLine && paymentUserId) {
      AuctionService.listUsers({ search: String(paymentUserId), limit: 5 })
        .then((res) => {
          const list = res?.users || [];
          const exact = list.find(u => String(u?.id) === String(paymentUserId));
          if (!cancelled) setUserFromApi(exact || null);
        })
        .catch(() => { });
    }
    return () => { cancelled = true; };
  }, [isAdmin, userLine, paymentUserId]);

  // Preferir datos directos del backend (include=user) si vienen en movement.related.user
  // Nuevo shape soportado: { first_name, last_name, document_type, document_number }
  const ru = movement?.related?.user || null;
  const relatedUserName = ru
    ? [ru.first_name, ru.last_name].filter(Boolean).join(' ').trim()
    : '';
  const relatedUserDocument = ru?.document_number
    ? `${ru?.document_type ? ru.document_type + ' ' : ''}${ru.document_number}`
    : '';

  const dispFirstName = firstName || userFromApi?.first_name || '';
  const dispLastName = lastName || userFromApi?.last_name || '';
  const dispDocType = docType || userFromApi?.document_type || '';
  const dispDocNumber = docNumber || userFromApi?.document_number || '';

  const computedName = [dispFirstName, dispLastName].filter(Boolean).join(' ');
  const computedDoc = dispDocNumber ? `${dispDocType ? dispDocType + ' ' : ''}${dispDocNumber}` : '';

  const finalUserLine = relatedUserName || computedName;
  const finalUserDoc = relatedUserDocument || computedDoc;

  // Datos de subasta/asset (admin y cliente). Soporta objetos y campos aplanados
  const marca = pick(movement, [
    'auction.asset.marca', 'auction.asset.brand',
    'asset.marca', 'asset.brand',
    'auction_asset.marca', 'auction_asset.brand',
    'auction_marca', 'asset_marca',
    'vehicle_brand', 'vehiculo_marca', 'marca_vehiculo',
    'marca', 'brand'
  ]);
  const modelo = pick(movement, [
    'auction.asset.modelo', 'auction.asset.model',
    'asset.modelo', 'asset.model',
    'auction_asset.modelo', 'auction_asset.model',
    'auction_modelo', 'asset_modelo',
    'vehicle_model', 'vehiculo_modelo', 'modelo_vehiculo',
    'modelo', 'model'
  ]);
  const anio = pick(movement, [
    'auction.asset.año', 'auction.asset.anio', 'auction.asset.year',
    'asset.año', 'asset.anio', 'asset.year',
    'auction_asset.año', 'auction_asset.anio', 'auction_asset.year',
    'auction_anio', 'asset_anio',
    'vehicle_year', 'vehiculo_anio',
    'año', 'anio', 'year'
  ]);
  const placa = pick(movement, [
    'auction.asset.placa', 'auction.asset.plate',
    'asset.placa', 'asset.plate',
    'auction_asset.placa', 'auction_asset.plate',
    'auction_placa', 'asset_placa',
    'license_plate', 'placa_vehiculo', 'matricula', 'matrícula',
    'placa', 'plate'
  ]);

  // Enriquecer asset desde API si no viene embebido
  const [assetFromApi, setAssetFromApi] = useState(null);
  const auctionId =
    // IDs directos
    pick(movement, ['auction.id', 'references.auction_id', 'auction_id', 'auctionId']) ||
    // arreglo references [{type,id}]
    (Array.isArray(movement?.references)
      ? (movement.references.find(r => r?.type === 'auction')?.id || '')
      : '');

  useEffect(() => {
    let cancelled = false;
    const hasAssetInline = Boolean(marca || modelo || anio || placa);
    if (!hasAssetInline && auctionId) {
      AuctionService.getAuction(auctionId)
        .then((a) => {
          if (!cancelled) {
            setAssetFromApi(a?.asset || null);
          }
        })
        .catch(() => { });
    }
    return () => { cancelled = true; };
  }, [auctionId, marca, modelo, anio, placa]);

  // Preferir datos directos del backend (include=auction). El backend puede retornar
  // los datos en related.auction.asset o directamente en related.auction (marca/modelo/año/placa).
  const relAuction = movement?.related?.auction || null;
  const relAsset = relAuction?.asset || relAuction || null;

  const dispMarca = marca || relAsset?.marca || relAsset?.brand || assetFromApi?.marca || assetFromApi?.brand || '';
  const dispModelo = modelo || relAsset?.modelo || relAsset?.model || assetFromApi?.modelo || assetFromApi?.model || '';
  const dispAnio = anio || relAsset?.['año'] || relAsset?.anio || relAsset?.year || assetFromApi?.['año'] || assetFromApi?.anio || assetFromApi?.year || '';
  const dispPlaca = placa || relAsset?.placa || relAsset?.plate || assetFromApi?.placa || assetFromApi?.plate || '';

  const auctionLine = (dispMarca || dispModelo || dispAnio || dispPlaca)
    ? `${[dispMarca, dispModelo, dispAnio].filter(Boolean).join(' ')}`.trim() + (dispPlaca ? ` — ${dispPlaca}` : '')
    : '';

  const displayConcept =
    concepto ??
    movement?.concept ??
    movement?.descripcion ??
    movement?.description ??
    movement?.glosa ??
    movement?.detalle ?? '';

  const conceptText = displayConcept || `Pago de garantía${numero_operacion ? ' - N° Operación ' + numero_operacion : ''}`;

  console.log(conceptText)


  return (
    <Card className="p-5 rounded-2xl border border-border bg-white shadow-md hover:shadow-lg transition">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Header con icono y badges */}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 p-3 rounded-full bg-primary-100 text-primary-700 border border-primary-200 shadow-sm">
            <FaMoneyBillWave className="w-6 h-6" />
          </div>
          <div className="flex flex-wrap gap-2">
            <TypeBadge general={tipo_movimiento_general} especifico={tipo_movimiento_especifico} />
            <StateBadge estado={estado} />
          </div>
        </div>

        {/* Monto destacado */}
        <div className="text-right">
          <span
            className={`block text-2xl font-extrabold ${tipo_movimiento_general === "entrada" ? "text-success" : "text-error"
              }`}
          >
            {formatCurrency(monto, { currency: moneda })}
          </span>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="mt-4 space-y-3 text-sm">
        {/* Concepto principal */}
        <p className="text-lg font-semibold text-text-primary">{conceptText}</p>

        {/* Info extra */}
        {isAdmin && (finalUserLine || userLine) && (
          <p className="text-text-secondary">
            <span className="font-medium text-text-primary">Cliente:</span>{" "}
            {(finalUserLine || userLine)}
            {finalUserDoc ? ` — ${finalUserDoc}` : userDoc ? ` — ${userDoc}` : ""}
          </p>
        )}

        {auctionLine && (
          <p className="text-text-secondary">
            <span className="font-medium text-text-primary">Subasta:</span> {auctionLine}
          </p>
        )}

        <p className="text-text-secondary">
          <span className="font-medium text-text-primary">Fecha de pago:</span>{" "}
          {formatDate(pagoDate, { includeTime: true })}
        </p>
        <p className="text-text-secondary">
          {numero_operacion && (
            <span>
              <span className="font-medium text-text-primary">N° Operación:</span> {numero_operacion}
            </span>
          )}
        </p>

      </div>

      {/* Footer con botón */}
      <div className="flex justify-end mt-5">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onDetail?.(id)}
          title="Ver detalle del pago de garantía"
          className="px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition"
        >
          <FaFileInvoice className="w-4 h-4 mr-2" />
          Ver Detalle
        </Button>
      </div>
    </Card>

  );
}

export default TransactionCard;