import { FaArrowDown, FaArrowUp, FaCheckCircle, FaTimesCircle, FaClock, FaFileInvoice, FaMoneyBillWave } from 'react-icons/fa';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import Button from '../Button';
import Card from '../Card';

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

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary-50 border border-primary-200 text-primary-600">
            <FaMoneyBillWave className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <TypeBadge general={tipo_movimiento_general} especifico={tipo_movimiento_especifico} />
              <StateBadge estado={estado} />
            </div>
            <div className="mt-2 text-sm text-text-secondary">
              {concepto || 'Sin concepto'}
            </div>
            <div className="mt-1 text-xs text-text-secondary">
              Fecha: <span className="font-medium text-text-primary">{formatDate(created_at, { includeTime: true })}</span>
              {numero_operacion && (
                <span className="ml-3"> • N° Operación: <span className="font-medium text-text-primary">{numero_operacion}</span></span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className={`text-lg font-bold ${tipo_movimiento_general === 'entrada' ? 'text-success' : 'text-error'}`}>
            {formatCurrency(monto, { currency: moneda })}
          </div>
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={() => onDetail?.(id)}>
              <FaFileInvoice className="w-4 h-4 mr-2" />
              Ver Detalle
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default TransactionCard;