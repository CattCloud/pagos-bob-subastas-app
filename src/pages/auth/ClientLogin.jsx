import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import { DOCUMENT_TYPES, validateDocumentNumber } from '../../constants/documentTypes';
import AuthService from '../../services/authService';
import { showToast } from '../../utils/toast';
import useAuth from '../../hooks/useAuth';

function ClientLogin() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { clientLogin } = useAuth();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
    clearErrors
  } = useForm({
    defaultValues: {
      document_type: '',
      document_number: ''
    }
  });
  
  const documentType = watch('document_type');
  const documentNumber = watch('document_number');
  
  // Validación personalizada del número de documento
  const validateDocumentField = (value) => {
    if (!documentType) {
      return 'Primero selecciona el tipo de documento';
    }
    return validateDocumentNumber(documentType, value);
  };
  
  const onSubmit = async (data) => {
    setIsLoading(true);
    clearErrors();
    
    try {
      // Validar documento antes de enviar
      const validationError = validateDocumentNumber(data.document_type, data.document_number);
      if (validationError) {
        setError('document_number', { 
          type: 'manual', 
          message: validationError 
        });
        return;
      }
      
      // Intentar login usando el contexto
      console.log('Iniciando login cliente...');
      const response = await clientLogin(
        data.document_type,
        data.document_number.trim()
      );
      
      console.log('Respuesta client login:', response);
      
      if (response.success) {
        showToast.success(`¡Bienvenido ${response.data.user.first_name}!`);
        console.log('Navegando a /pago-subastas...');
        
        // Pequeño delay para asegurar que el contexto se actualice
        setTimeout(() => {
          navigate('/pago-subastas', { replace: true });
        }, 100);
      }
      
    } catch (error) {
      console.error('Error completo en login:', error);
      
      // Intentar parsear la respuesta de error del servidor
      let errorMessage = error.message;
      
      try {
        // Si el error contiene información JSON, intentar extraerla
        if (errorMessage.includes('{')) {
          const jsonMatch = errorMessage.match(/\{.*\}/);
          if (jsonMatch) {
            const errorData = JSON.parse(jsonMatch[0]);
            if (errorData.error?.message) {
              errorMessage = errorData.error.message;
            }
          }
        }
      } catch (parseError) {
        console.error('Error parsing error message:', parseError);
      }
      
      // Manejar diferentes tipos de error
      if (errorMessage.includes('USER_NOT_FOUND') || errorMessage.includes('no se encontró')) {
        setError('document_number', {
          type: 'manual',
          message: 'No se encontró ningún cliente registrado con estos datos'
        });
      } else if (errorMessage.includes('INVALID_DOCUMENT') || errorMessage.includes('documento inválido')) {
        setError('document_number', {
          type: 'manual',
          message: 'Formato de documento inválido'
        });
      } else if (errorMessage.includes('HTTP Error: 404')) {
        setError('document_number', {
          type: 'manual',
          message: 'No se encontró ningún cliente registrado con estos datos'
        });
      } else {
        console.log('Error no categorizado:', errorMessage);
        showToast.error(`Error: ${errorMessage}`);
      }
      
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600 mb-2">
            BOB Subastas
          </h1>
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Área de Cliente
          </h2>
          <p className="text-text-secondary">
            Identifícate con tu documento para acceder
          </p>
        </div>
        
        {/* Formulario de Login */}
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Tipo de Documento */}
            <Select
              label="Tipo de Documento"
              required
              placeholder="Seleccionar tipo de documento..."
              options={DOCUMENT_TYPES}
              error={errors.document_type?.message}
              disabled={isLoading}
              {...register('document_type', {
                required: 'El tipo de documento es requerido'
              })}
            />
            
            {/* Número de Documento */}
            <Input
              label="Número de Documento"
              type="text"
              placeholder="Ingresa tu número de documento"
              required
              error={errors.document_number?.message}
              disabled={isLoading}
              {...register('document_number', {
                required: 'El número de documento es requerido',
                validate: validateDocumentField,
                onChange: () => {
                  // Limpiar errores cuando el usuario empieza a escribir
                  if (errors.document_number) {
                    clearErrors('document_number');
                  }
                }
              })}
            />
            
            {/* Helper text dinámico */}
            {documentType && (
              <div className="text-sm text-text-secondary">
                {documentType === 'DNI' && 'Ingresa 8 dígitos'}
                {documentType === 'CE' && 'Ingresa 9 dígitos'}
                {documentType === 'RUC' && 'Ingresa 11 dígitos'}
                {documentType === 'Pasaporte' && 'Ingresa entre 6 y 12 caracteres alfanuméricos'}
              </div>
            )}
            
            {/* Botón de Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={!documentType || !documentNumber || isLoading}
              className="w-full"
            >
              {isLoading ? 'Verificando...' : 'Ingresar'}
            </Button>
          </form>
          
          {/* Footer del Card */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-text-secondary">
              ¿Eres administrador?{' '}
              <button
                type="button"
                onClick={() => navigate('/admin-login')}
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                disabled={isLoading}
              >
                Acceder como Admin
              </button>
            </p>
          </div>
        </Card>
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-text-muted">
            Sistema de Gestión de Pagos y Saldos - BOB Subastas
          </p>
        </div>
      </div>
    </div>
  );
}

export default ClientLogin;