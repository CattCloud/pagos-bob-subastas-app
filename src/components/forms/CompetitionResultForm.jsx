import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { FaTrophy, FaTimes, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

const RESULT_OPTIONS = [
  {
    value: 'ganada',
    label: 'BOB GANÓ',
    icon: FaTrophy,
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
    description: 'BOB ganó la competencia externa',
    consequence: 'Se solicitará al cliente completar datos de facturación'
  },
  {
    value: 'perdida',
    label: 'BOB PERDIÓ',
    icon: FaTimes,
    color: 'text-error',
    bgColor: 'bg-error/10',
    borderColor: 'border-error/30',
    description: 'BOB perdió contra otros competidores',
    consequence: 'Se procesará reembolso completo al cliente'
  },
  {
    value: 'penalizada',
    label: 'CLIENTE NO PAGÓ VEHÍCULO',
    icon: FaExclamationTriangle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    description: 'BOB ganó pero cliente no completó pago del vehículo completo',
    consequence: 'Se aplicará penalidad del 30% + reembolso del 70%'
  }
];

/**
 * Formulario para gestionar resultado de competencia externa (HU-COMP-01)
 * PATCH /auctions/:id/competition-result
 */
export default function CompetitionResultForm({
  auction,
  onSubmit,
  onCancel,
  isSubmitting = false,
  className = ''
}) {
  const [selectedResult, setSelectedResult] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      resultado: '',
      observaciones: '',
      confirm_irreversible: false
    }
  });

  const confirmIrreversible = watch('confirm_irreversible');

  const handleResultSelect = (resultValue) => {
    setSelectedResult(resultValue);
    setValue('resultado', resultValue);
  };

  const handleFormSubmit = (data) => {
    if (!confirmIrreversible) {
      alert('Debe confirmar que entiende que esta acción es irreversible');
      return;
    }

    const payload = {
      resultado: data.resultado,
      observaciones: data.observaciones?.trim() || undefined
    };

    onSubmit?.(payload);
  };

  const selectedOption = RESULT_OPTIONS.find(opt => opt.value === selectedResult);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={`space-y-4 p-4 ${className}`}>
      {/* Información de la subasta */}
      <Card variant="info" padding="sm">
        <div className="flex items-center gap-3">
          <FaInfoCircle className="w-5 h-5 text-info" />
          <div>
            <p className="font-semibold text-text-primary">
              {auction?.asset?.marca} {auction?.asset?.modelo} {auction?.asset?.['año']} / {auction?.asset?.placa}
            </p>
            <p className="text-xs text-text-secondary">
              Estado actual: {auction?.estado}
            </p>
            {auction?.winner && (
              <p className="text-xs text-text-secondary">
                Ganador: {auction.winner?.name}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Selección de resultado */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-3">
          Seleccione el resultado de la competencia externa <span className="text-error">*</span>
        </label>
        
        <div className="space-y-3">
          {RESULT_OPTIONS.map((option) => {
            const IconComponent = option.icon;
            const isSelected = selectedResult === option.value;
            
            return (
              <div
                key={option.value}
                className={`
                  p-4 border rounded-lg cursor-pointer transition-colors
                  ${isSelected 
                    ? `${option.borderColor} ${option.bgColor}` 
                    : 'border-border hover:border-primary-300'
                  }
                `}
                onClick={() => handleResultSelect(option.value)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    value={option.value}
                    checked={isSelected}
                    className="mt-1"
                    {...register('resultado', { required: 'Resultado es requerido' })}
                    readOnly
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <IconComponent className={`w-5 h-5 ${option.color}`} />
                      <span className="font-semibold text-text-primary">{option.label}</span>
                    </div>
                    <p className="text-sm text-text-secondary mb-2">{option.description}</p>
                    <p className="text-sm font-medium text-text-primary">{option.consequence}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {errors.resultado?.message && (
          <p className="text-sm text-error mt-2">{errors.resultado.message}</p>
        )}
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Observaciones (opcional)
        </label>
        <textarea
          className="w-full px-3 py-2 border border-border rounded-md focus:ring-primary-500 focus:border-primary-500"
          rows={3}
          placeholder="Notas o comentarios adicionales (máximo 500 caracteres)"
          disabled={isSubmitting}
          {...register('observaciones', {
            maxLength: { value: 500, message: 'Máximo 500 caracteres' }
          })}
        />
        {errors.observaciones?.message && (
          <p className="text-sm text-error mt-1">{errors.observaciones.message}</p>
        )}
      </div>

      {/* Confirmación irreversible */}
      <Card variant="warning" padding="sm">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            {...register('confirm_irreversible', {
              validate: (v) => v || 'Debe confirmar que entiende que esta acción es irreversible'
            })}
          />
          <span className="text-text-primary">
            <strong>Confirmo que entiendo que esta acción es irreversible</strong> y activará automáticamente 
            los procesos correspondientes (facturación, reembolsos, penalidades, notificaciones).
          </span>
        </label>
        {errors.confirm_irreversible?.message && (
          <p className="text-sm text-error mt-2">{errors.confirm_irreversible.message}</p>
        )}
      </Card>

      {/* Preview del resultado seleccionado */}
      {selectedOption && (
        <Card variant="outlined" padding="sm">
          <div className="text-center">
            <selectedOption.icon className={`w-8 h-8 mx-auto mb-2 ${selectedOption.color}`} />
            <h4 className="font-semibold text-text-primary mb-1">{selectedOption.label}</h4>
            <p className="text-sm text-text-secondary">{selectedOption.consequence}</p>
          </div>
        </Card>
      )}

      {/* Botones */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          variant="primary" 
          disabled={!isValid || !confirmIrreversible || isSubmitting}
          loading={isSubmitting}
        >
          Confirmar Resultado
        </Button>
      </div>
    </form>
  );
}