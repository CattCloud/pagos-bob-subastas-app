import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FaDollarSign, FaUniversity , FaWallet, FaInfoCircle } from 'react-icons/fa';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { formatCurrency } from '../../utils/formatters';
import useBalance from '../../hooks/useBalance';

const REFUND_TYPES = {
  mantener_saldo: {
    label: 'Mantener como Saldo',
    icon: FaWallet,
    color: 'text-primary-600',
    description: 'El dinero se mantiene en su cuenta BOB para futuras subastas',
    info: 'Proceso inmediato sin transferencias bancarias'
  },
  devolver_dinero: {
    label: 'Devolver Dinero',
    icon: FaUniversity ,
    color: 'text-secondary-600', 
    description: 'Se transferirá el dinero a su cuenta bancaria',
    info: 'Proceso de 2-3 días hábiles con comprobante'
  }
};

/**
 * Formulario de solicitud de reembolso (HU-REEM-01)
 * - auction_id obligatorio (subastas perdida/penalizada)
 * - Validaciones: saldo disponible, max 2 decimales
 * - Tipos: mantener_saldo vs devolver_dinero
 */
export default function RefundForm({
  eligibleAuctions = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
  className = ''
}) {
  const { balance } = useBalance();
  const [selectedType, setSelectedType] = useState('mantener_saldo');

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
      tipo_reembolso: 'mantener_saldo',
      motivo: '',
    },
  });

  const watchedMonto = watch('monto_solicitado');
  const watchedAuction = watch('auction_id');
  const saldoDisponible = balance?.saldo_disponible || 0;

  // Encontrar subasta seleccionada para mostrar contexto
  const selectedAuction = eligibleAuctions.find(a => a.id === watchedAuction);

  // Actualizar tipo en estado local
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'tipo_reembolso') {
        setSelectedType(value.tipo_reembolso);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

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

    if (!selectedAuction) {
      alert('Debe seleccionar una subasta asociada');
      return;
    }

    onSubmit?.(data);
  };

  const montoNumerico = Number(watchedMonto || 0);
  const impactoEstimado = saldoDisponible - montoNumerico;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={`${className}`}>
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
              Subasta Asociada <span className="text-error">*</span>
            </label>
            {eligibleAuctions.length === 0 ? (
              <div className="p-3 border border-warning/30 bg-warning/5 text-warning rounded-lg text-sm">
                <FaInfoCircle className="w-4 h-4 inline mr-2" />
                No tienes subastas elegibles para reembolso.
              </div>
            ) : (
              <Select
                required
                disabled={isSubmitting}
                options={[
                  { value: '', label: 'Selecciona una subasta...' },
                  ...eligibleAuctions.map(auction => ({
                    value: auction.id,
                    label: `${auction.asset.marca} ${auction.asset.modelo} - ${auction.asset.placa}`
                  }))
                ]}
                {...register('auction_id', { required: 'Subasta asociada es requerida' })}
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
          {/* Tipo de reembolso */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Tipo de Reembolso <span className="text-error">*</span>
            </label>
            <div className="space-y-2">
              {Object.entries(REFUND_TYPES).map(([value, config]) => {
                const IconComponent = config.icon;
                const isSelected = selectedType === value;
                
                return (
                  <label
                    key={value}
                    className={`
                      block p-3 border rounded-lg cursor-pointer transition-colors
                      ${isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-border hover:border-primary-300'
                      }
                    `}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        value={value}
                        className="mt-1"
                        {...register('tipo_reembolso', { required: 'Tipo de reembolso es requerido' })}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <IconComponent className={`w-4 h-4 ${config.color}`} />
                          <span className="font-semibold text-sm text-text-primary">{config.label}</span>
                        </div>
                        <p className="text-xs text-text-secondary mt-1">{config.description}</p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.tipo_reembolso?.message && (
              <p className="text-sm text-error mt-2">{errors.tipo_reembolso.message}</p>
            )}
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Motivo de la Solicitud <span className="text-error">*</span>
            </label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-primary-500 focus:border-primary-500 resize-none"
              rows="5"
              placeholder="Explica el motivo de tu solicitud de reembolso..."
              disabled={isSubmitting}
              {...register('motivo', {
                required: 'Motivo es requerido',
                minLength: { value: 10, message: 'Mínimo 10 caracteres' },
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
      {montoNumerico > 0 && selectedAuction && (
        <Card variant="outlined" padding="sm" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-text-secondary">Monto:</p>
              <p className="font-semibold">{formatCurrency(montoNumerico)}</p>
            </div>
            <div>
              <p className="text-text-secondary">Tipo:</p>
              <p className="font-semibold">{REFUND_TYPES[selectedType]?.label}</p>
            </div>
            <div>
              <p className="text-text-secondary">Subasta:</p>
              <p className="font-semibold">{selectedAuction.asset.marca} {selectedAuction.asset.modelo}</p>
            </div>
            <div>
              <p className="text-text-secondary">Saldo restante:</p>
              <p className="font-semibold">{formatCurrency(impactoEstimado)}</p>
            </div>
          </div>
          <div className="mt-2 p-2 bg-info/10 border border-info/30 rounded text-xs text-info">
            <FaInfoCircle className="w-3 h-3 inline mr-1" />
            {selectedType === 'mantener_saldo'
              ? 'Proceso inmediato. El monto se agregará a su saldo disponible.'
              : 'Proceso de 2-3 días hábiles. Se contactarán para confirmar.'
            }
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
          disabled={!isValid || isSubmitting || eligibleAuctions.length === 0}
          loading={isSubmitting}
        >
          Enviar Solicitud
        </Button>
      </div>
    </form>
  );
}