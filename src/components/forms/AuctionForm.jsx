import { useForm } from 'react-hook-form';
import Input from '../ui/Input';
import Button from '../ui/Button';

/**
 * Formulario de creación de subasta + activo (HU-SUB-01)
 * Campos según DocumentacionAPI: POST /auctions
 */
export default function AuctionForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  className = ''
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      placa: '',
      empresa_propietaria: '',
      marca: '',
      modelo: '',
      anio: '',
      descripcion: '',
    },
  });


  const handleFormSubmit = (data) => {
    // Payload actualizado: sólo datos del activo (sin fechas inicio/fin)
    const payload = {
      asset: {
        placa: data.placa.trim(),
        empresa_propietaria: data.empresa_propietaria.trim(),
        marca: data.marca.trim(),
        modelo: data.modelo.trim(),
        'año': Number(data.anio), // clave con ñ tal como la API
        ...(data.descripcion?.trim() ? { descripcion: data.descripcion.trim() } : {}),
      },
    };
    onSubmit?.(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={`space-y-4  ${className}`}>
      {/* Sección: Datos del Activo */}
      <div >
        <h3 className="text-lg font-semibold text-text-primary mb-3">Datos del Activo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Placa"
            placeholder="ABC-123"
            required
            {...register('placa', {
              required: 'Placa es requerida',
              minLength: { value: 5, message: 'Mínimo 5 caracteres' },
            })}
            error={errors.placa?.message}
          />
          <Input
            label="Empresa Propietaria"
            required
            {...register('empresa_propietaria', {
              required: 'Empresa propietaria es requerida',
              minLength: { value: 2, message: 'Mínimo 2 caracteres' },
            })}
            error={errors.empresa_propietaria?.message}
          />
          <Input
            label="Marca"
            required
            {...register('marca', {
              required: 'Marca es requerida',
              minLength: { value: 2, message: 'Mínimo 2 caracteres' },
            })}
            error={errors.marca?.message}
          />
          <Input
            label="Modelo"
            required
            {...register('modelo', {
              required: 'Modelo es requerido',
              minLength: { value: 1, message: 'Mínimo 1 caracter' },
            })}
            error={errors.modelo?.message}
          />
          <Input
            label="Año"
            type="number"
            placeholder="2020"
            required
            min={1990}
            {...register('anio', {
              required: 'Año es requerido',
              min: { value: 1990, message: 'Año mínimo 1990' },
              max: { value: new Date().getFullYear() + 1, message: 'Año demasiado alto' },
              validate: (v) => String(v).length === 4 || 'Debe ser un año de 4 dígitos',
            })}
            error={errors.anio?.message}
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-primary mb-2">
              Descripción (opcional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              placeholder="Información adicional del activo"
              {...register('descripcion', {
                maxLength: { value: 500, message: 'Máximo 500 caracteres' },
              })}
            />
            {errors.descripcion?.message && (
              <p className="text-sm text-error mt-1">{errors.descripcion.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={!isValid || isSubmitting} loading={isSubmitting}>
          Registrar Subasta
        </Button>
      </div>
    </form>
  );
}