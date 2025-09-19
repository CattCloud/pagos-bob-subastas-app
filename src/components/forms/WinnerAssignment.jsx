import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { FaInfoCircle, FaDollarSign, FaUser } from 'react-icons/fa';
import AuctionService from '../../services/auctionService';
import { formatCurrency } from '../../utils/formatters';

/**
 * Formulario para asignar ganador de subasta (HU-SUB-03)
 * POST /auctions/:id/winner
 */
export default function WinnerAssignment({
  auction,
  onSubmit,
  onCancel,
  isSubmitting = false,
  className = ''
}) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLimitePago, setShowLimitePago] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      user_id: '',
      monto_oferta: '',
      fecha_oferta: '',
      fecha_limite_pago: ''
    }
  });

  const montoOferta = watch('monto_oferta');
  const montoGarantia = Number(montoOferta || 0) * 0.08;

  // Cargar usuarios inicial
  useEffect(() => {
    loadUsers();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        loadUsers(searchTerm);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadUsers = async (search = '') => {
    try {
      setLoadingUsers(true);
      const result = await AuctionService.listUsers({ 
        search, 
        limit: 50 
      });
      setUsers(result.users || []);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleFormSubmit = (data) => {
    // Validaciones adicionales
    const userId = String(data.user_id || '').trim();
    if (!userId || userId === '' || userId === 'undefined') {
      alert('Debe seleccionar un cliente válido');
      return;
    }

    const monto = Number(data.monto_oferta);
    if (monto <= 0 || monto > 999999.99) {
      alert('Monto debe ser mayor a 0 y menor a 999,999.99');
      return;
    }

    const fechaOferta = new Date(data.fecha_oferta);
    const fechaInicio = new Date(auction.fecha_inicio);
    const fechaFin = new Date(auction.fecha_fin);

    if (fechaOferta < fechaInicio || fechaOferta > fechaFin) {
      alert('La fecha de oferta debe estar entre el inicio y fin de la subasta');
      return;
    }

    // Preparar payload - user_id como string (CUID)
    const payload = {
      user_id: userId,
      monto_oferta: monto,
      fecha_oferta: fechaOferta.toISOString(),
      ...(showLimitePago && data.fecha_limite_pago ? {
        fecha_limite_pago: new Date(data.fecha_limite_pago).toISOString()
      } : {})
    };

    onSubmit?.(payload);
  };

  const userOptions = [
    { value: '', label: 'Seleccionar cliente...' },
    ...users.map(user => ({
      value: String(user.id),
      label: `${user.first_name} ${user.last_name} - ${user.document_type} ${user.document_number}`
    }))
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={`space-y-4 ${className}`}>
      {/* Información de la subasta */}
      <Card variant="info" padding="sm">
        <div className="flex items-center gap-3">
          <FaInfoCircle className="w-5 h-5 text-info" />
          <div>
            <p className="font-semibold text-text-primary">
              {auction?.asset?.marca} {auction?.asset?.modelo} {auction?.asset?.['año']} — {auction?.asset?.placa}
            </p>
            <p className="text-xs text-text-secondary">
              Empresa: {auction?.asset?.empresa_propietaria}
            </p>
          </div>
        </div>
      </Card>

      {/* Selección de cliente */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Cliente Ganador <span className="text-error">*</span>
        </label>
        
        {/* Búsqueda de usuarios */}
        <div className="mb-2">
          <Input
            placeholder="Buscar cliente por nombre o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loadingUsers}
          />
        </div>

        <Select
          required
          disabled={isSubmitting || loadingUsers}
          options={userOptions}
          {...register('user_id', { required: 'Cliente ganador es requerido' })}
          error={errors.user_id?.message}
        />
        {loadingUsers && (
          <p className="text-xs text-text-secondary mt-1">Cargando usuarios...</p>
        )}
      </div>

      {/* Datos de la oferta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Monto de Oferta"
          type="number"
          step="0.01"
          min="0.01"
          max="999999.99"
          placeholder="12000.00"
          required
          disabled={isSubmitting}
          {...register('monto_oferta', {
            required: 'Monto de oferta es requerido',
            min: { value: 0.01, message: 'Monto debe ser mayor a 0' },
            max: { value: 999999.99, message: 'Monto máximo: 999,999.99' }
          })}
          error={errors.monto_oferta?.message}
        />

        <Input
          label="Fecha de Oferta"
          type="datetime-local"
          required
          min={auction?.fecha_inicio?.slice(0, 16)} // Límite inferior: inicio de subasta
          max={auction?.fecha_fin?.slice(0, 16)}     // Límite superior: fin de subasta
          disabled={isSubmitting}
          {...register('fecha_oferta', {
            required: 'Fecha de oferta es requerida',
            validate: (value) => {
              const fechaOferta = new Date(value);
              const fechaInicio = new Date(auction?.fecha_inicio);
              const fechaFin = new Date(auction?.fecha_fin);
              
              if (fechaOferta < fechaInicio) {
                return 'La fecha debe ser posterior al inicio de la subasta';
              }
              if (fechaOferta > fechaFin) {
                return 'La fecha debe ser anterior al fin de la subasta';
              }
              return true;
            }
          })}
          error={errors.fecha_oferta?.message}
        />
      </div>

      {/* Cálculo automático de garantía */}
      {montoOferta > 0 && (
        <Card variant="outlined" padding="sm">
          <div className="flex items-center gap-3">
            <FaDollarSign className="w-5 h-5 text-primary-600" />
            <div>
              <p className="font-semibold text-text-primary">
                Monto Garantía (8%): {formatCurrency(montoGarantia)}
              </p>
              <p className="text-xs text-text-secondary">
                Calculado automáticamente según RN02
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Fecha límite de pago (opcional) */}
      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showLimitePago}
            onChange={(e) => {
              setShowLimitePago(e.target.checked);
              if (!e.target.checked) {
                setValue('fecha_limite_pago', '');
              }
            }}
          />
          <span className="text-text-primary">Asignar fecha límite de pago</span>
        </label>

        {showLimitePago && (
          <div className="mt-2">
            <Input
              label="Fecha Límite de Pago"
              type="datetime-local"
              min={new Date().toISOString().slice(0, 16)} // Esta sí debe ser futura
              disabled={isSubmitting}
              {...register('fecha_limite_pago', {
                validate: (value) => {
                  if (!value) return true; // campo opcional
                  const fechaLimite = new Date(value);
                  const ahora = new Date();
                  if (fechaLimite <= ahora) {
                    return 'La fecha límite debe ser futura';
                  }
                  return true;
                }
              })}
              error={errors.fecha_limite_pago?.message}
            />
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          variant="primary" 
          disabled={!isValid || isSubmitting}
          loading={isSubmitting}
        >
          <FaUser className="w-4 h-4 mr-2" />
          Asignar Ganador
        </Button>
      </div>
    </form>
  );
}