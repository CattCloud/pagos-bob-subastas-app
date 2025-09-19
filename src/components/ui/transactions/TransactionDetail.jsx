import { FaTimes, FaDownload, FaInfoCircle, FaMoneyBill, FaHashtag, FaCalendarAlt, FaCheck, FaTimesCircle } from 'react-icons/fa';
import Modal from '../Modal';
import Button from '../Button';
import { formatCurrency, formatDate } from '../../../utils/formatters';

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
    id,
    tipo_movimiento_general,
    tipo_movimiento_especifico,
    monto,
    moneda = 'USD',
    estado,
    concepto,
    numero_operacion,
    created_at,
    fecha_resolucion,
  } = movement;

  const isEntrada = tipo_movimiento_general === 'entrada';

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <Modal.Header>
        <div className="flex items-center justify-between w-full">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Detalle de Transacción</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {tipo_movimiento_general?.toUpperCase()} • {tipo_movimiento_especifico}
            </p>
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Row
            icon={<FaMoneyBill className="w-4 h-4" />}
            label="Monto"
            value={formatCurrency(monto, { currency: moneda })}
          />
          <Row
            icon={<FaHashtag className="w-4 h-4" />}
            label="N° de Operación"
            value={numero_operacion || '—'}
          />
          <Row
            icon={<FaCalendarAlt className="w-4 h-4" />}
            label="Fecha de creación"
            value={formatDate(created_at, { includeTime: true })}
          />
          <Row
            icon={<FaCalendarAlt className="w-4 h-4" />}
            label="Fecha de resolución"
            value={fecha_resolucion ? formatDate(fecha_resolucion, { includeTime: true }) : '—'}
          />
          <div className="md:col-span-2">
            <p className="text-xs text-text-secondary">Concepto</p>
            <p className="text-sm font-medium text-text-primary">
              {concepto || 'Sin concepto'}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs text-text-secondary">Estado</p>
            <p
              className={`inline-flex mt-1 text-xs font-medium px-2 py-1 rounded border ${
                estado === 'validado'
                  ? 'text-success bg-success/10 border-success/20'
                  : estado === 'rechazado'
                  ? 'text-error bg-error/10 border-error/20'
                  : 'text-warning bg-warning/10 border-warning/20'
              }`}
            >
              {estado}
            </p>
          </div>

          {/* Información adicional compacta */}
          <div className="md:col-span-2">
            <p className="text-xs text-text-secondary">ID de Transacción</p>
            <p className="text-xs font-mono text-text-primary mt-1 break-all">{id}</p>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <div className="flex justify-between items-center w-full gap-2 flex-wrap">
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
          <div className="flex gap-2">
            {estado === 'pendiente' && (
              <>
                <Button variant="success" onClick={onApprove} loading={isApproving}>
                  <FaCheck className="w-4 h-4 mr-2" />
                  Aprobar
                </Button>
                <Button variant="error" onClick={onReject} loading={isRejecting}>
                  <FaTimesCircle className="w-4 h-4 mr-2" />
                  Rechazar
                </Button>
              </>
            )}
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
}