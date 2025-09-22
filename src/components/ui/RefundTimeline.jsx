import { FaClock, FaCheckCircle, FaTimes, FaPhone, FaCogs } from 'react-icons/fa';
import { formatRelativeDate } from '../../utils/formatters';

const TIMELINE_STEPS = [
  {
    key: 'solicitado',
    label: 'Solicitud Enviada',
    icon: FaClock,
    color: 'text-primary-600',
    description: 'Su solicitud fue registrada en el sistema'
  },
  {
    key: 'revision',
    label: 'En Revisión',
    icon: FaPhone,
    color: 'text-warning',
    description: 'Contacto telefónico para confirmar detalles'
  },
  {
    key: 'confirmado',
    label: 'Confirmado',
    icon: FaCheckCircle,
    color: 'text-info',
    description: 'Solicitud confirmada, en procesamiento'
  },
  {
    key: 'procesado',
    label: 'Completado',
    icon: FaCheckCircle,
    color: 'text-success',
    description: 'Reembolso procesado exitosamente'
  }
];

const TIMELINE_REJECTED = [
  {
    key: 'solicitado',
    label: 'Solicitud Enviada',
    icon: FaClock,
    color: 'text-primary-600',
    description: 'Su solicitud fue registrada en el sistema'
  },
  {
    key: 'revision',
    label: 'En Revisión',
    icon: FaPhone,
    color: 'text-warning',
    description: 'Revisión de la solicitud'
  },
  {
    key: 'rechazado',
    label: 'Rechazado',
    icon: FaTimes,
    color: 'text-error',
    description: 'Solicitud rechazada'
  }
];

/**
 * Timeline visual del proceso de reembolso (HU-REEM-05)
 * - Stepper con estados del proceso
 * - Fechas específicas cuando están disponibles
 * - Manejo de flujo normal vs rechazado
 */
export default function RefundTimeline({ 
  refund,
  className = '' 
}) {
  const {
    estado,
    created_at,
    fecha_respuesta_empresa,
    fecha_procesamiento,
    motivo_rechazo
  } = refund;

  const isRejected = estado === 'rechazado';
  const steps = isRejected ? TIMELINE_REJECTED : TIMELINE_STEPS;

  // Determinar paso actual
  const getCurrentStep = () => {
    switch (estado) {
      case 'solicitado': return 0;
      case 'confirmado': return 2;
      case 'procesado': return 3;
      case 'rechazado': return 2;
      default: return 0;
    }
  };

  const currentStep = getCurrentStep();

  // Obtener fecha para cada paso
  const getStepDate = (stepKey) => {
    switch (stepKey) {
      case 'solicitado':
        return created_at;
      case 'confirmado':
      case 'rechazado':
        return fecha_respuesta_empresa;
      case 'procesado':
        return fecha_procesamiento;
      default:
        return null;
    }
  };

  return (
    <div className={`py-4 ${className}`}>
      <div className="relative">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const stepDate = getStepDate(step.key);
          
          const StepIcon = step.icon;
          
          return (
            <div key={step.key} className="flex items-start gap-4 pb-6 last:pb-0">

              
              {/* Icono del paso */}
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 z-10
                ${isCompleted 
                  ? 'bg-success border-success text-white' 
                  : isActive 
                    ? `bg-white border-current ${step.color}`
                    : 'bg-white border-border text-text-muted'
                }
              `}>
                <StepIcon className="w-4 h-4" />
              </div>
              
              {/* Contenido del paso */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`
                    font-semibold text-sm
                    ${isCompleted 
                      ? 'text-success' 
                      : isActive 
                        ? step.color
                        : 'text-text-muted'
                    }
                  `}>
                    {step.label}
                  </h4>
                  
                  {stepDate && (
                    <span className="text-xs text-text-secondary">
                      {formatRelativeDate(stepDate)}
                    </span>
                  )}
                </div>
                
                <p className={`
                  text-sm mt-1
                  ${isCompleted || isActive ? 'text-text-secondary' : 'text-text-muted'}
                `}>
                  {step.description}
                </p>

                {/* Información adicional según el estado */}
                {isActive && estado === 'solicitado' && (
                  <div className="mt-2 p-2 bg-warning/10 border border-warning/30 rounded text-xs text-warning">
                    <FaCogs className="w-3 h-3 inline mr-1" />
                    Esperando revisión y contacto telefónico
                  </div>
                )}

                {isActive && estado === 'confirmado' && (
                  <div className="mt-2 p-2 bg-info/10 border border-info/30 rounded text-xs text-info">
                    <FaCogs className="w-3 h-3 inline mr-1" />
                    En proceso de {refund.tipo_reembolso === 'devolver_dinero' ? 'transferencia bancaria' : 'aplicación al saldo'}
                  </div>
                )}

                {step.key === 'rechazado' && isActive && motivo_rechazo && (
                  <div className="mt-2 p-2 bg-error/10 border border-error/30 rounded text-xs">
                    <strong className="text-error">Motivo del rechazo:</strong>
                    <p className="text-text-secondary mt-1">{motivo_rechazo}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}