import { FaDownload, FaInfoCircle, FaMoneyBill, FaHashtag, FaCalendarAlt, FaCheck, FaTimesCircle, FaUser, FaIdCard, FaCar, FaCreditCard } from 'react-icons/fa';
import Modal from '../Modal';
import Button from '../Button';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import useAuth from '../../../hooks/useAuth';

function Row({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 text-text-secondary">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="text-sm font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}

export default function TransactionDetail({
  isOpen,
  onClose,
  movement,
  onDownloadVoucher,
  downloading = false,
  // Nuevos props para acciones admin
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
}) {
  const { user } = useAuth();
  const isAdmin = user?.user_type === 'admin';

  if (!movement) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Detalle de Transacción">
        <div className="flex items-center gap-2 text-text-secondary">
          <FaInfoCircle className="w-4 h-4" />
          No se encontró información del movimiento.
        </div>
      </Modal>
    );
  }

  const {
    tipo_movimiento_general,
    tipo_movimiento_especifico,
    monto,
    moneda = 'USD',
    estado,
    concepto,
    numero_operacion,
    created_at,
  } = movement;

  const isEntrada = tipo_movimiento_general === 'entrada';

  // Helpers
  const pick = (obj, keys = []) => {
    for (const k of keys) {
      const v = k.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return '';
  };

  // Usuario (preferir related.user)
  const ru = movement?.related?.user || {};
  const userFirst = ru.first_name || pick(movement, ['user.first_name', 'cliente.first_name', 'owner.first_name', 'first_name', 'nombres']);
  const userLast = ru.last_name || pick(movement, ['user.last_name', 'cliente.last_name', 'owner.last_name', 'last_name', 'apellidos']);
  const userDocType = ru.document_type || pick(movement, ['user.document_type', 'cliente.document_type', 'owner.document_type', 'document_type']);
  const userDocNumber = ru.document_number || pick(movement, ['user.document_number', 'cliente.document_number', 'owner.document_number', 'document_number']);
  const userFullName = [userFirst, userLast].filter(Boolean).join(' ');
  const userDocLine = userDocNumber ? `${userDocType ? userDocType + ' ' : ''}${userDocNumber}` : '';


  // Subasta (preferir related.auction o related.auction.asset)
  const ra = movement?.related?.auction || {};
  const raAsset = ra.asset || ra;
  const aMarca = raAsset?.marca || raAsset?.brand || pick(movement, ['auction.asset.marca', 'asset.marca', 'auction.asset.brand', 'asset.brand', 'marca', 'brand']);
  const aModelo = raAsset?.modelo || raAsset?.model || pick(movement, ['auction.asset.modelo', 'asset.modelo', 'auction.asset.model', 'asset.model', 'modelo', 'model']);
  const aAnio = raAsset?.['año'] || raAsset?.anio || raAsset?.year || pick(movement, ['auction.asset.año', 'asset.año', 'auction.asset.anio', 'asset.anio', 'auction.asset.year', 'asset.year', 'año', 'anio', 'year']);
  const aPlaca = raAsset?.placa || raAsset?.plate || pick(movement, ['auction.asset.placa', 'asset.placa', 'auction.asset.plate', 'asset.plate', 'placa', 'plate']);
  const vehiculoLine = aMarca + " " + aModelo + " " + aAnio + "--" + aPlaca

  // Datos de pago
  const tipoPago = pick(movement, ['tipo_pago', 'payment_type', 'details.tipo_pago', 'detalles.tipo_pago']);
  const cuentaOrigen = pick(movement, ['numero_cuenta_origen', 'cuenta_origen', 'account_from', 'numero_cuenta']);
  const fechaPago = pick(movement, ['fecha_pago', 'payment_date', 'fecha']) || created_at;

  const displayConcept =
    concepto ??
    movement?.concept ??
    movement?.descripcion ??
    movement?.description ??
    movement?.glosa ??
    movement?.detalle ??
    movement?.metadata?.concepto ??
    movement?.metadata?.description ??
    movement?.details?.concepto ??
    movement?.details?.description ??
    '';

  const conceptText = displayConcept || `Pago de garantía${numero_operacion ? ' - N° Operación ' + numero_operacion : ''}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" showCloseButton={false}>
      <Modal.Header>
        <div className="flex items-center justify-between w-full">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Detalle de Pago de Garantía</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {tipo_movimiento_general?.toUpperCase()} • {tipo_movimiento_especifico}
            </p>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sección izquierda: Usuario + Subasta */}
          <div className="space-y-4">
            <div className="p-4 rounded border border-border">
              <div className="flex items-center gap-2 mb-2 text-text-secondary text-xs font-bold uppercase">
                Usuario que realizó el pago
              </div>
              <div className="space-y-3">
                <Row
                  icon={<FaUser className="w-4 h-4" />}
                  label="Nombre y Apellido"
                  value={userFullName || '—'}
                />
                <Row
                  icon={<FaIdCard className="w-4 h-4" />}
                  label="Documento"
                  value={userDocLine || '—'}
                />
              </div>
            </div>

            <div className="p-4 rounded border border-border">
              <div className="flex items-center gap-2 mb-2 text-text-secondary text-xs font-bold uppercase">

                Subasta relacionada
              </div>
              <div className="space-y-3">
                <Row
                  icon={<FaCar className="w-4 h-4" />}
                  label="Vehiculo"
                  value={vehiculoLine || '—'}
                />

              </div>
            </div>
          </div>

          {/* Sección derecha: Datos del pago */}
          <div className="space-y-4">
            <div className="p-4 rounded border border-border">
              <div className='mb-2'>
                <p
                  className={`inline-flex text-xs font-medium px-2 py-1 rounded border ${estado === 'validado'
                    ? 'text-success bg-success/10 border-success/20'
                    : estado === 'rechazado'
                      ? 'text-error bg-error/10 border-error/20'
                      : 'text-warning bg-warning/10 border-warning/20'
                    }`}
                >
                  {estado}
                </p>
              </div>
              <div className="flex items-center gap-2 mb-2 text-text-secondary text-xs font-bold uppercase">

                Datos del pago
              </div>
              <div className="space-y-3">
                <Row
                  icon={<FaCreditCard className="w-4 h-4" />}
                  label="Tipo de Pago"
                  value={tipoPago || '—'}
                />
                <Row
                  icon={<FaMoneyBill className="w-4 h-4" />}
                  label="Monto pagado"
                  value={formatCurrency(monto, { currency: moneda })}
                />
                <Row
                  icon={<FaHashtag className="w-4 h-4" />}
                  label="N° de Cuenta Origen"
                  value={cuentaOrigen || '—'}
                />
                <Row
                  icon={<FaHashtag className="w-4 h-4" />}
                  label="N° de Operación"
                  value={numero_operacion || '—'}
                />
                <Row
                  icon={<FaCalendarAlt className="w-4 h-4" />}
                  label="Fecha de pago"
                  value={fechaPago ? formatDate(fechaPago, { includeTime: true }) : '—'}
                />
                <div>
                  <p className="text-xs text-text-secondary">Concepto</p>
                  <p className="text-sm font-medium text-text-primary break-words">
                    {conceptText}
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <div className="flex justify-end items-center w-full gap-2 flex-wrap">
          <Button variant="error" onClick={onClose}>
            Cerrar
          </Button>
          <div className="flex gap-2">
            <Button
              variant={isEntrada ? 'secondary' : 'outline'}
              onClick={onDownloadVoucher}
              loading={downloading}
            >
              <FaDownload className="w-4 h-4 mr-2" />
              Descargar Comprobante
            </Button>
          </div>
            {isAdmin && estado === 'pendiente' && (
              <div className="flex gap-2">
                <Button variant="success" onClick={onApprove} loading={isApproving}>
                  <FaCheck className="w-4 h-4 mr-2" />
                  Aprobar
                </Button>
                <Button variant="error" onClick={onReject} loading={isRejecting}>
                  <FaTimesCircle className="w-4 h-4 mr-2" />
                  Rechazar
                </Button>
              </div>
            )}

        </div>
      </Modal.Footer>
    </Modal>
  );
}