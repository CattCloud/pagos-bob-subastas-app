import { useForm } from 'react-hook-form';
import { FaDollarSign, FaInfoCircle } from 'react-icons/fa';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { formatCurrency } from '../../utils/formatters';
import useBalance from '../../hooks/useBalance';

/**
 * Formulario de solicitud de reembolso (HU-REEM-01)
 * - auction_id opcional (solo trazabilidad)
 * - Validaciones: saldo disponible, max 2 decimales
 * - Único tipo: devolver_dinero (no se selecciona en UI)
 */
export default function RefundForm({
  eligibleAuctions = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
  className = ''
}) {
  const { balance } = useBalance();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      auction_id: '',
      monto_solicitado: '',
      motivo: '',
    },
  });

  const watchedMonto = watch('monto_solicitado');
  const watchedAuction = watch('auction_id');
  const saldoDisponible = balance?.saldo_disponible || 0;

  // Encontrar subasta seleccionada para mostrar contexto
  const selectedAuction = eligibleAuctions.find(a => a.id === watchedAuction);

  // (Sin selector de tipo: único flujo devolver_dinero)

  const handleFormSubmit = (data) => {
    // Validaciones adicionales antes de enviar
    const monto = Number(data.monto_solicitado);
    
    if (monto <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }
    
    if (monto > saldoDisponible) {
      alert(`El monto no puede exceder su saldo disponible (${formatCurrency(saldoDisponible)})`);
      return;
    }

    // auction_id ahora es opcional (solo trazabilidad)
    onSubmit?.(data);
  };

  const montoNumerico = Number(watchedMonto || 0);
  const impactoEstimado = saldoDisponible - montoNumerico;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={`p-4 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda */}
        <div className="space-y-4">
          {/* Información de saldo */}
          <Card variant="info" padding="sm">
            <div className="flex items-center gap-3">
              <FaDollarSign className="w-5 h-5 text-primary-600" />
              <div>
                <p className="font-semibold text-text-primary">
                  Saldo Disponible: {formatCurrency(saldoDisponible)}
                </p>
                <p className="text-xs text-text-secondary">
                  Total - Retenido - Aplicado = Disponible
                </p>
              </div>
            </div>
          </Card>

          {/* Selección de subasta */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Subasta Asociada
            </label>
            {eligibleAuctions.length === 0 ? (
              <div className="p-3 border border-info/30 bg-info/5 text-info rounded-lg text-sm">
                <FaInfoCircle className="w-4 h-4 inline mr-2" />
                Puedes solicitar devolución de dinero de tu saldo disponible sin seleccionar subasta.
              </div>
            ) : (
              <Select
                disabled={isSubmitting}
                options={[
                  { value: '', label: 'Sin subasta específica...' },
                  ...eligibleAuctions.map(auction => ({
                    value: auction.id,
                    label: `${auction.asset.marca} ${auction.asset.modelo} - ${auction.asset.placa}`
                  }))
                ]}
                {...register('auction_id')}
                error={errors.auction_id?.message}
              />
            )}

            {selectedAuction && (
              <div className="mt-2 p-2 bg-bg-secondary rounded text-xs text-text-secondary">
                {selectedAuction.asset.marca} {selectedAuction.asset.modelo} ({selectedAuction.asset.año}) -
                Placa: {selectedAuction.asset.placa}
              </div>
            )}
          </div>

          {/* Monto */}
          <Input
            label="Monto Solicitado"
            type="number"
            step="0.01"
            min="0.01"
            max={saldoDisponible}
            placeholder="0.00"
            required
            disabled={isSubmitting}
            {...register('monto_solicitado', {
              required: 'Monto es requerido',
              min: { value: 0.01, message: 'Monto debe ser mayor a 0' },
              max: { value: saldoDisponible, message: `No puede exceder ${formatCurrency(saldoDisponible)}` },
              validate: (value) => {
                const num = Number(value);
                if (isNaN(num)) return 'Monto inválido';
                if (num.toFixed(2) !== num.toString() && num.toString().split('.')[1]?.length > 2) {
                  return 'Máximo 2 decimales';
                }
                return true;
              }
            })}
            error={errors.monto_solicitado?.message}
          />

          {montoNumerico > 0 && (
            <div className="text-xs text-text-secondary">
              Saldo restante estimado: {formatCurrency(impactoEstimado)}
            </div>
          )}
        </div>

        {/* Columna derecha */}
        <div className="space-y-4">
          {/* Motivo (opcional) */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Motivo de la Solicitud (opcional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-primary-500 focus:border-primary-500 resize-none"
              rows="5"
              placeholder="Opcional: explica el motivo de tu solicitud..."
              disabled={isSubmitting}
              {...register('motivo', {
                minLength: { value: 0, message: '' },
                maxLength: { value: 500, message: 'Máximo 500 caracteres' }
              })}
            />
            {errors.motivo?.message && (
              <p className="text-sm text-error mt-1">{errors.motivo.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Resumen (abajo, ancho completo) */}
      {montoNumerico > 0 && (
        <Card variant="outlined" padding="sm" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-text-secondary">Monto:</p>
              <p className="font-semibold">{formatCurrency(montoNumerico)}</p>
            </div>
            {selectedAuction && (
              <div>
                <p className="text-text-secondary">Subasta:</p>
                <p className="font-semibold">{selectedAuction.asset.marca} {selectedAuction.asset.modelo}</p>
              </div>
            )}
            <div>
              <p className="text-text-secondary">Saldo restante:</p>
              <p className="font-semibold">{formatCurrency(impactoEstimado)}</p>
            </div>
          </div>
          <div className="mt-2 p-2 bg-info/10 border border-info/30 rounded text-xs text-info">
            <FaInfoCircle className="w-3 h-3 inline mr-1" />
            Se solicitará devolución de dinero por el monto indicado.
          </div>
        </Card>
      )}

      {/* Botones */}
      <div className="flex justify-between mt-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
        >
          Solicitar Devolución de Dinero
        </Button>
      </div>
    </form>
  );
}