import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { calculateGuaranteeAmount, formatCurrency } from '../../utils/formatters';

/**
 * Formulario de datos de pago
 * - RN02: monto exacto 8% de la oferta ganadora
 * - Fecha válida (no futura)
 * - Número de operación con patrón y longitud mínima
 */
export default function PaymentForm({
  auction,            // subasta seleccionada
  value,              // valores iniciales opcionales
  onChange,           // (data) => void (cada cambio)
  onNext,             // () => void
  onBack,             // () => void
  disabled = false,
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      tipo_pago: value?.tipo_pago ?? 'transferencia',
      numero_cuenta_origen: value?.numero_cuenta_origen ?? '',
      numero_operacion: value?.numero_operacion ?? '',
      fecha_pago: value?.fecha_pago ?? '',
      monto: value?.monto ?? '',
      moneda: value?.moneda ?? 'USD',
      concepto: value?.concepto ?? '',
    },
  });

  // Calcular monto 8% desde subasta (bloqueado para cumplir RN02)
  useEffect(() => {
    if (!auction) return;
    const offer = auction.monto_oferta ?? auction.offer_amount ?? 0;
    const guarantee = auction.monto_garantia ?? calculateGuaranteeAmount(offer);
    setValue('monto', guarantee, { shouldValidate: true });
    setValue('moneda', 'USD', { shouldValidate: true });
    // informar al padre
    onChange?.({ ...watch(), monto: guarantee, moneda: 'USD' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auction]);

  // Sincronizar con el padre en cada cambio significativo
  const subscription = watch((vals) => {
    onChange?.(vals);
  });

  useEffect(() => {
    return () => subscription.unsubscribe();
  }, [subscription]);

  const onSubmit = () => {
    if (!auction) return;
    onNext?.();
  };

  const monto = watch('monto');
  const tipoPago = watch('tipo_pago');

  const todayIso = new Date().toISOString().slice(0, 16);

  // Helper para convertir ISO (UTC) a formato local compatible con input datetime-local
  const toLocalInputValue = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  // Regla de negocio: fecha de pago no puede ser anterior al inicio de la subasta
  const auctionStartISO = auction?._original?.auction?.fecha_inicio || auction?.fecha_inicio || null;
  const minDateLocal = auctionStartISO ? toLocalInputValue(auctionStartISO) : undefined;

  // Prefijar una fecha válida por defecto (máximo entre ahora y inicio de subasta)
  useEffect(() => {
    if (!auction) return;
    const currentVal = watch('fecha_pago');
    if (currentVal) return;
    const now = Date.now();
    const startMs = auctionStartISO ? new Date(auctionStartISO).getTime() : 0;
    const base = new Date(Math.max(now, isNaN(startMs) ? now : startMs));
    const pad = (n) => String(n).padStart(2, '0');
    const localVal = `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}T${pad(base.getHours())}:${pad(base.getMinutes())}`;
    setValue('fecha_pago', localVal, { shouldValidate: true });
    onChange?.({ ...watch(), fecha_pago: localVal });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auction, auctionStartISO]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <Card.Header>
          <Card.Title>Datos del Pago</Card.Title>
          <Card.Subtitle>Ingresa la información exacta del pago realizado</Card.Subtitle>
        </Card.Header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo de Pago"
            required
            disabled={disabled}
            options={[
              { value: 'deposito', label: 'Depósito' },
              { value: 'transferencia', label: 'Transferencia' },
            ]}
            {...register('tipo_pago', { required: 'Tipo de pago es requerido' })}
            error={errors.tipo_pago?.message}
          />

          <Input
            label="Número de Cuenta Origen (mín. 10 dígitos)"
            placeholder="Ej. 1234567890123456"
            required
            disabled={disabled}
            inputMode="numeric"
            {...register('numero_cuenta_origen', {
              required: 'Número de cuenta de origen es requerido',
              minLength: { value: 10, message: 'Debe tener al menos 10 dígitos' },
              pattern: {
                value: /^\d{10,}$/,
                message: 'Solo dígitos, mínimo 10',
              },
            })}
            error={errors.numero_cuenta_origen?.message}
          />

          <Input
            label="Número de Operación"
            placeholder="Ej. OP-ABC12345"
            required
            disabled={disabled}
            {...register('numero_operacion', {
              required: 'Número de operación es requerido',
              minLength: { value: 6, message: 'Debe tener al menos 6 caracteres' },
              pattern: {
                value: /^[\w-]+$/i,
                message: 'Solo letras, números y guiones',
              },
            })}
            error={errors.numero_operacion?.message}
          />

          <div>
            <label className="block text-sm font-medium text-text-primary">
              Fecha de Pago <span className="text-error">*</span>
            </label>
            <input
              type="datetime-local"
              className="mt-1 w-full px-3 py-2 border border-border rounded-md focus:ring-primary-500 focus:border-primary-500"
              max={todayIso}
              min={minDateLocal}
              disabled={disabled}
              {...register('fecha_pago', {
                required: 'Fecha de pago es requerida',
                validate: (v) => {
                  if (!v) return 'Fecha de pago es requerida';
                  const d = new Date(v);
                  if (isNaN(d.getTime())) return 'Fecha inválida';
                  // No futura
                  if (d.getTime() > Date.now()) return 'Fecha no puede ser futura';
                  // No anterior al inicio de la subasta
                  if (auctionStartISO) {
                    const start = new Date(auctionStartISO).getTime();
                    if (!isNaN(start) && d.getTime() < start) {
                      return 'La fecha no puede ser anterior al inicio de la subasta';
                    }
                  }
                  return true;
                },
              })}
            />
            {errors.fecha_pago?.message && (
              <p className="text-sm text-error mt-1">{errors.fecha_pago.message}</p>
            )}
          </div>

          <Input
            label="Monto (8% garantía)"
            required
            disabled
            value={monto}
            error={errors.monto?.message}
          />

          <Input
            label="Moneda"
            required
            disabled
            value="USD"
          />

          <div className="md:col-span-2">
            <Input
              label="Concepto (opcional)"
              placeholder="Ej. Pago garantía subasta Toyota Corolla 2020"
              disabled={disabled}
              {...register('concepto')}
              error={errors.concepto?.message}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <Button type="button" variant="outline" onClick={onBack} disabled={disabled || isSubmitting}>
            Atrás
          </Button>
          <Button type="submit" variant="primary" disabled={!isValid || isSubmitting || !auction}>
            Continuar
          </Button>
        </div>

        <div className="mt-4 text-xs text-text-secondary">
          Monto calculado según RN02 (8% de la oferta ganadora):{' '}
          <span className="font-semibold text-text-primary">
            {formatCurrency(monto)}
          </span>
          {tipoPago && (
            <span className="ml-2"> • Tipo de pago: <span className="font-medium">{tipoPago}</span></span>
          )}
        </div>
      </Card>
    </form>
  );
}