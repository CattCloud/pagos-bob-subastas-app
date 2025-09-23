import { useState, useMemo } from 'react';
import { FaCheckCircle, FaCircle, FaCloudUploadAlt, FaDownload } from 'react-icons/fa';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AuctionSelector from '../../components/forms/AuctionSelector';
import PaymentForm from '../../components/forms/PaymentForm';
import FileUpload from '../../components/forms/FileUpload';
import { calculateGuaranteeAmount, formatCurrency } from '../../utils/formatters';
import MovementService from '../../services/movementService';
import { showToast } from '../../utils/toast';
import useAuth from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const STEPS = {
  VALIDATION: 0,
  AUCTION: 1,
  PAYMENT: 2,
  CONFIRM: 3,
};

function Stepper({ current }) {
  const steps = [
    { id: STEPS.VALIDATION, label: 'Validación' },
    { id: STEPS.AUCTION, label: 'Subasta' },
    { id: STEPS.PAYMENT, label: 'Pago' },
    { id: STEPS.CONFIRM, label: 'Confirmación' },
  ];
  return (
    <div className="flex items-center justify-between">
      {steps.map((s, idx) => {
        const active = current === s.id;
        const done = current > s.id;
        return (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${active ? 'text-primary-600' : 'text-text-secondary'}`}>
              {done ? (
                <FaCheckCircle className="w-4 h-4" />
              ) : (
                <FaCircle className="w-3 h-3" />
              )}
              <span className="text-sm font-medium">{s.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className="mx-3 h-px w-10 bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PaymentRegistration() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(STEPS.VALIDATION);

  // Estado del flujo
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [voucherFile, setVoucherFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  const expectedGuarantee = useMemo(() => {
    if (!selectedAuction) return 0;
    const offer = selectedAuction.monto_oferta ?? selectedAuction.offer_amount ?? 0;
    const g = selectedAuction.monto_garantia ?? calculateGuaranteeAmount(offer);
    return g;
  }, [selectedAuction]);

  // Step handlers
  const next = () => setStep((s) => Math.min(s + 1, STEPS.CONFIRM));
  const back = () => setStep((s) => Math.max(s - 1, STEPS.VALIDATION));

  // Submit final
  const handleSubmitMovement = async () => {
    if (!selectedAuction) {
      showToast.error('Selecciona una subasta.');
      setStep(STEPS.AUCTION);
      return;
    }
    if (!paymentData) {
      showToast.error('Completa los datos del pago.');
      setStep(STEPS.PAYMENT);
      return;
    }
    if (!voucherFile) {
      showToast.error('Adjunta el comprobante de pago (voucher).');
      setStep(STEPS.PAYMENT);
      return;
    }

    // RN02: validar 8%
    const offerAmount = selectedAuction.monto_oferta ?? selectedAuction.offer_amount ?? 0;
    const expected = selectedAuction.monto_garantia ?? calculateGuaranteeAmount(offerAmount);
    const entered = Number(paymentData.monto);
    if (Math.abs(entered - expected) > 0.009) {
      showToast.error(`El monto debe ser exactamente el 8%: ${formatCurrency(expected)}.`);
      setStep(STEPS.PAYMENT);
      return;
    }

    try {
      setSubmitting(true);

      const form = new FormData();
      form.append('auction_id', selectedAuction.id);
      form.append('monto', String(entered));
      form.append('tipo_pago', paymentData.tipo_pago);
      form.append('numero_cuenta_origen', paymentData.numero_cuenta_origen);
      form.append('numero_operacion', paymentData.numero_operacion);
      form.append('fecha_pago', new Date(paymentData.fecha_pago).toISOString());
      form.append('moneda', paymentData.moneda || 'USD');
      if (paymentData.concepto) form.append('concepto', paymentData.concepto);
      form.append('voucher', voucherFile, voucherFile.name);

      if (import.meta?.env?.DEV) {
        // Volcado mínimo de campos FormData (sin leer el binario)
        try {
          for (const [k, v] of form.entries()) {
            if (v && typeof v === 'object' && 'name' in v) {
              console.debug('createMovement field:', k, `[File:${v.name}, ${v.type || 'unknown'}]`);
            } else {
              console.debug('createMovement field:', k, String(v));
            }
          }
        } catch (e) {
          console.debug('createMovement debug logging skipped:', e?.message || e);
        }
      }
      const res = await MovementService.createMovement(form);

      if (res?.success) {
        showToast.success('Pago registrado exitosamente. Pendiente de validación.');
        // Redirigir al historial de transacciones para seguimiento
        navigate('/pago-subastas/transactions', { replace: true });
        return;
      }

      showToast.error(res?.message || 'No se pudo registrar el pago.');

    } catch (err) {
      // Manejo específico de errores del backend (códigos según DocumentacionAPI.md)
      const code = err?.code || err?.data?.code || err?.data?.error?.code;
      const details = err?.details || err?.data?.details || err?.data?.error?.details;
      const msgLower = err?.message?.toLowerCase?.() || '';

      if (err?.status === 409 && (code === 'DUPLICATE_OPERATION_NUMBER' || code === 'DUPLICATE_OPERATION')) {
        showToast.error('El número de operación ya está registrado. Verifica e intenta con otro.');
        setStep(STEPS.PAYMENT);
      } else if (err?.status === 409 && code === 'NOT_CURRENT_WINNER') {
        showToast.error('No eres el ganador actual de esta subasta (NOT_CURRENT_WINNER).');
        setStep(STEPS.AUCTION);
      } else if ((err?.status === 422 || err?.status === 400) && code === 'INVALID_FILE_TYPE') {
        showToast.error('Tipo de archivo no permitido. Aceptados: PDF, JPG o PNG.');
        setStep(STEPS.PAYMENT);
      } else if ((err?.status === 422 || err?.status === 400) && code === 'FILE_TOO_LARGE') {
        showToast.error('El archivo excede el tamaño máximo (5MB).');
        setStep(STEPS.PAYMENT);
      } else if ((err?.status === 422 || err?.status === 400) && (code === 'INVALID_OPERATION_NUMBER')) {
        showToast.error('Número de operación inválido. Usa solo letras, números o guiones (mín. 6).');
        setStep(STEPS.PAYMENT);
      } else if ((err?.status === 422 || err?.status === 400) && (code === 'INVALID_AMOUNT' || msgLower.includes('monto'))) {
        showToast.error('El monto no coincide con el 8% (RN02).');
        setStep(STEPS.PAYMENT);
      } else if ((err?.status === 422 || err?.status === 400) && (details?.field === 'fecha_pago' || err?.data?.errors?.fecha_pago || msgLower.includes('fecha'))) {
        showToast.error('Fecha de pago inválida. No debe ser futura.');
        setStep(STEPS.PAYMENT);
      } else {
        const fallback = err?.message || 'Error al registrar el pago. Verifica los datos e inténtalo nuevamente.';
        showToast.error(fallback);
      }

      // Log detallado para depurar 400/422
      console.error('PaymentRegistration submit error:', {
        status: err?.status,
        code,
        details,
        raw: err
      });
    } finally {
      setSubmitting(false);
    }
  };
 
  // Descargar/visualizar el comprobante adjunto (cliente-side)
  const handleDownloadSelectedVoucher = () => {
    if (!voucherFile) return;
    try {
      const url = URL.createObjectURL(voucherFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = voucherFile.name || 'voucher';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error al descargar comprobante adjunto:', e);
    }
  };
 
   return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Registro de Pago de Garantía</h1>
          <p className="text-text-secondary mt-1">
            Completa los pasos para registrar tu pago. El monto de garantía es el 8% de tu oferta ganadora.
          </p>
        </div>
      </div>

      {/* Stepper */}
      <Card>
        <Card.Body>
          <Stepper current={step} />
        </Card.Body>
      </Card>

      {/* Steps */}
      {step === STEPS.VALIDATION && (
        <Card>
          <Card.Header>
            <Card.Title>Validación de Cliente</Card.Title>
            <Card.Subtitle>Verifica que tus datos sean correctos antes de continuar</Card.Subtitle>
          </Card.Header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
            <div>
              <p className="text-xs text-text-secondary">Nombre</p>
              <p className="text-sm font-medium text-text-primary">
                {user?.first_name} {user?.last_name}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Documento</p>
              <p className="text-sm font-medium text-text-primary">
                {user?.document_type || '—'} {user?.document_number || ''}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Email</p>
              <p className="text-sm font-medium text-text-primary">
                {user?.email || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Teléfono</p>
              <p className="text-sm font-medium text-text-primary">
                {user?.phone_number || '—'}
              </p>
            </div>
          </div>
          <div className="p-4 flex justify-end">
            <Button variant="primary" onClick={next}>
              Continuar
            </Button>
          </div>
        </Card>
      )}

      {step === STEPS.AUCTION && (
        <AuctionSelector
          value={selectedAuction}
          onChange={setSelectedAuction}
          onNext={() => {
            if (!selectedAuction) {
              showToast.error('Selecciona una subasta para continuar.');
              return;
            }
            next();
          }}
        />
      )}

      {step === STEPS.PAYMENT && (
        <Card>
          <Card.Header>
            <Card.Title>Datos de Pago y Comprobante</Card.Title>
          </Card.Header>
          <div className="p-4 space-y-6">
            <div className="text-sm text-text-secondary">
              Monto esperado (8%):{' '}
              <span className="font-semibold text-text-primary">
                {formatCurrency(expectedGuarantee)}
              </span>
            </div>
            <PaymentForm
              auction={selectedAuction}
              value={paymentData}
              onChange={setPaymentData}
              onNext={() => {
                if (!voucherFile) {
                  showToast.error('Adjunta el comprobante de pago (voucher).');
                  return;
                }
                setStep(STEPS.CONFIRM);
              }}
              onBack={back}
            />
            <div>
              <label className="block text-sm font-medium text-text-primary">
                Adjuntar Comprobante (Voucher) <span className="text-error">*</span>
              </label>
              <FileUpload
                className="mt-2"
                value={voucherFile}
                onChange={setVoucherFile}
                description="PDF, JPG o PNG. Máximo 5MB."
              />
            </div>
          </div>
        </Card>
      )}

      {step === STEPS.CONFIRM && (
        <Card>
          <Card.Header>
            <Card.Title>Confirmación</Card.Title>
            <Card.Subtitle>Verifica los datos antes de enviar</Card.Subtitle>
          </Card.Header>
          <div className="p-4 space-y-6">
            {/* DATOS DEL USUARIO */}
            <div className="p-4 border border-border rounded-lg">
              <div className="text-xs font-semibold text-text-secondary uppercase mb-3">
                Datos del Usuario
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-secondary">Nombre y Apellido</p>
                  <p className="text-sm font-medium text-text-primary">
                    {user?.first_name} {user?.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Documento</p>
                  <p className="text-sm font-medium text-text-primary">
                    {user?.document_type || '—'} {user?.document_number || ''}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Email</p>
                  <p className="text-sm font-medium text-text-primary">
                    {user?.email || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Teléfono</p>
                  <p className="text-sm font-medium text-text-primary">
                    {user?.phone_number || '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* DATOS DEL VEHICULO SUBASTADO */}
            <div className="p-4 border border-border rounded-lg">
              <div className="text-xs font-semibold text-text-secondary uppercase mb-3">
                Datos del Vehículo Subastado
              </div>
              <div>
                <p className="text-xs text-text-secondary">Marca Modelo Año / Placa</p>
                <p className="text-sm font-medium text-text-primary">
                  {selectedAuction?.asset?.marca
                    ? `${selectedAuction.asset.marca || ''} ${selectedAuction.asset.modelo || ''} ${selectedAuction.asset?.['año'] || selectedAuction.asset?.anio || selectedAuction.asset?.year || ''}`.trim()
                    : `Subasta ${selectedAuction?.id}`}
                  {selectedAuction?.asset?.placa ? ` / ${selectedAuction.asset.placa}` : ''}
                </p>
              </div>
            </div>

            {/* DATOS DE PAGO INGRESADOS */}
            <div className="p-4 border border-border rounded-lg">
              <div className="text-xs font-semibold text-text-secondary uppercase mb-3">
                Datos de Pago Ingresados
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-secondary">Tipo de pago</p>
                  <p className="text-sm font-medium text-text-primary">{paymentData?.tipo_pago || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Monto (8%)</p>
                  <p className="text-sm font-medium text-text-primary">{formatCurrency(expectedGuarantee)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Moneda</p>
                  <p className="text-sm font-medium text-text-primary">{paymentData?.moneda || 'USD'}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">N° Cuenta Origen</p>
                  <p className="text-sm font-medium text-text-primary">{paymentData?.numero_cuenta_origen || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">N° Operación</p>
                  <p className="text-sm font-medium text-text-primary">{paymentData?.numero_operacion || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary text-white">Fecha de pago</p>
                  <p className="text-sm font-medium text-text-primary text-white">{paymentData?.fecha_pago || '—'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-text-secondary">Concepto</p>
                  <p className="text-sm font-medium text-text-primary break-words">{paymentData?.concepto || '—'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 text-sm text-text-secondary">
              <div className="flex items-center gap-2">
                <FaCloudUploadAlt className="w-4 h-4" />
                Se enviará el comprobante adjuntado junto con la información de pago para validación.
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleDownloadSelectedVoucher}
                disabled={!voucherFile}
                title="Descargar/visualizar comprobante adjunto"
              >
                <FaDownload className="w-4 h-4 mr-2" />
                Descargar comprobante adjunto
              </Button>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(STEPS.PAYMENT)} disabled={submitting}>
                Atrás
              </Button>
              <Button variant="primary" onClick={handleSubmitMovement} loading={submitting}>
                Enviar Pago
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}