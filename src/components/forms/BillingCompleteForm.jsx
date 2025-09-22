import React, { useMemo, useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';
import { showToast } from '../../utils/toast';
import useBilling from '../../hooks/useBilling';

/**
 * Formulario para completar datos de facturación (FASE 9)
 * Contrato PATCH /billing/:id/complete
 *
 * Props:
 * - billing: objeto billing cargado (requiere at least: id, monto, moneda, concepto, related.auction?, billing_document_*?)
 * - onSuccess: callback al completar exitosamente
 * - mode: 'client' | 'admin' (opcional, sólo para textos)
 */
export default function BillingCompleteForm({ billing, onSuccess, mode = 'client' }) {
  const { completeBilling, isCompleting } = useBilling();
  const [form, setForm] = useState({
    billing_document_type: billing?.billing_document_type || 'DNI',
    billing_document_number: billing?.billing_document_number || '',
    billing_name: billing?.billing_name || '',
  });
  const [errors, setErrors] = useState({});

  // Validación en tiempo real (habilitar botón solo con datos válidos)
  const isFormValid = useMemo(() => {
    const typeOk = ['DNI', 'RUC'].includes(form.billing_document_type);
    const num = String(form.billing_document_number || '').trim();
    const numOk =
      (form.billing_document_type === 'DNI' && /^\d{8}$/.test(num)) ||
      (form.billing_document_type === 'RUC' && /^\d{11}$/.test(num));
    const name = String(form.billing_name || '').trim();
    const nameOk = name.length >= 3 && name.length <= 200;
    return typeOk && numOk && nameOk;
  }, [form.billing_document_type, form.billing_document_number, form.billing_name]);

  
  const isPending = useMemo(() => {
    if (!billing) return true;
    return !billing.billing_document_type || !billing.billing_document_number || !billing.billing_name;
  }, [billing]);

  const auction = billing?.related?.auction || billing?.auction || {};
  const monto = billing?.monto ?? billing?.amount ?? 0;
  const moneda = billing?.moneda ?? billing?.currency ?? 'USD';
  const concepto = billing?.concepto ?? billing?.concept ?? 'Compra vehículo subasta';

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    // Tipo
    if (!['DNI', 'RUC'].includes(form.billing_document_type)) {
      e.billing_document_type = 'Tipo inválido';
    }
    // Número
    const num = String(form.billing_document_number || '').trim();
    if (form.billing_document_type === 'DNI') {
      if (!/^\d{8}$/.test(num)) e.billing_document_number = 'DNI debe tener 8 dígitos';
    } else if (form.billing_document_type === 'RUC') {
      if (!/^\d{11}$/.test(num)) e.billing_document_number = 'RUC debe tener 11 dígitos';
    } else {
      e.billing_document_number = 'Documento requerido';
    }
    // Nombre
    const name = String(form.billing_name || '').trim();
    if (name.length < 3 || name.length > 200) {
      e.billing_name = 'Nombre/Razón social entre 3 y 200 caracteres';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!billing?.id) {
      showToast.error('No se encontró la facturación a completar');
      return;
    }
    if (!validate()) return;

    const confirmed = window.confirm(
      'Confirmación: Una vez enviados, los datos de facturación no podrán modificarse. ¿Deseas continuar?'
    );
    if (!confirmed) return;

    try {
      await completeBilling(billing.id, {
        billing_document_type: form.billing_document_type,
        billing_document_number: String(form.billing_document_number).trim(),
        billing_name: String(form.billing_name).trim(),
      });
      showToast.success('Datos de facturación completados correctamente');
      onSuccess?.();
    } catch (error) {
      const msg =
        error?.message ||
        error?.data?.error?.message ||
        'Error al completar datos de facturación';
      showToast.error(msg);
    }
  };

  const disabled = !isPending; // si ya está completa, inhabilitamos edición

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Resumen de la operación / subasta */}
      <Card variant="outlined" padding="sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-text-secondary">Monto</p>
            <p className="font-semibold text-text-primary">
              {formatCurrency(Number(monto || 0), { currency: moneda || 'USD' })}
            </p>
          </div>
          <div>
            <p className="text-text-secondary">Concepto</p>
            <p className="font-semibold text-text-primary">{concepto}</p>
          </div>
          <div>
            <p className="text-text-secondary">Placa</p>
            <p className="font-medium text-text-primary">{auction.placa || '—'}</p>
          </div>
          <div>
            <p className="text-text-secondary">Vehículo</p>
            <p className="font-medium text-text-primary">
              {[auction.marca, auction.modelo, auction.año].filter(Boolean).join(' ') || '—'}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-text-secondary">Empresa Propietaria</p>
            <p className="font-medium text-text-primary">{auction.empresa_propietaria || '—'}</p>
          </div>
        </div>
      </Card>

      {/* Tipo de documento */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary">
          Tipo de Documento <span className="text-error">*</span>
        </label>
        <div className="flex gap-4">
          {['DNI', 'RUC'].map((type) => (
            <label key={type} className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="billing_document_type"
                value={type}
                disabled={disabled}
                checked={form.billing_document_type === type}
                onChange={(e) => setField('billing_document_type', e.target.value)}
              />
              <span>{type}</span>
            </label>
          ))}
        </div>
        {errors.billing_document_type && (
          <p className="text-xs text-error">{errors.billing_document_type}</p>
        )}
      </div>

      {/* Número de documento */}
      <Input
        label={`Número de ${form.billing_document_type}`}
        placeholder={form.billing_document_type === 'RUC' ? '11 dígitos' : '8 dígitos'}
        value={form.billing_document_number}
        onChange={(e) => setField('billing_document_number', e.target.value.replace(/[^\d]/g, ''))}
        maxLength={form.billing_document_type === 'RUC' ? 11 : 8}
        required
        disabled={disabled}
        error={errors.billing_document_number}
      />

      {/* Nombre / Razón social */}
      <Input
        label="Nombre / Razón social"
        placeholder="Ej. Juan Pérez S.A.C."
        value={form.billing_name}
        onChange={(e) => setField('billing_name', e.target.value)}
        required
        disabled={disabled}
        error={errors.billing_name}
      />

      {/* Nota aclaratoria */}
      <div className="text-xs text-text-secondary">
        Nota: Su garantía ya fue aplicada cuando se marcó la subasta como ganada. Este paso solo
        completa los datos para facturación.
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="submit"
          variant="primary"
          disabled={disabled || isCompleting}
          loading={isCompleting}
        >
          {mode === 'admin' ? 'Completar (Admin)' : 'Completar Datos'}
        </Button>
      </div>
    </form>
  );
}