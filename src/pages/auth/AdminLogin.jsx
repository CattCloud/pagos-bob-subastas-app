import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import AuthService from '../../services/authService';
import { showToast } from '../../utils/toast';
import useAuth from '../../hooks/useAuth';

function AdminLogin() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { adminAccess } = useAuth();
  
  const handleAdminAccess = async () => {
    setIsLoading(true);
    
    try {
      console.log('Iniciando acceso admin...');
      const response = await adminAccess();
      
      console.log('Respuesta admin access:', response);
      
      if (response.success) {
        showToast.success('¡Acceso administrativo exitoso!');
        console.log('Navegando a /admin-subastas...');
        
        // Pequeño delay para asegurar que el contexto se actualice
        setTimeout(() => {
          navigate('/admin-subastas', { replace: true });
        }, 100);
      } else {
        throw new Error(response.message || 'Error en respuesta');
      }
      
    } catch (error) {
      console.error('Error en acceso admin:', error);
      showToast.error('Error al acceder como administrador. Inténtalo de nuevo.');
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
            Área Administrativa
          </h2>
          <p className="text-text-secondary">
            Acceso automático al sistema administrativo
          </p>
        </div>
        
        {/* Card de Acceso */}
        <Card>
          <div className="text-center space-y-6">
            {/* Icon */}
            <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-primary-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
                />
              </svg>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Acceso Administrativo
              </h3>
              <p className="text-text-secondary text-sm">
                El acceso administrativo es automático según las especificaciones del sistema. 
                Haz clic en el botón para ingresar al panel de administración.
              </p>
            </div>
            
            {/* Botón de Acceso */}
            <Button
              onClick={handleAdminAccess}
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Accediendo...' : 'Acceder como Administrador'}
            </Button>
          </div>
          
          {/* Footer del Card */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-text-secondary">
              ¿Eres cliente?{' '}
              <button
                type="button"
                onClick={() => navigate('/client-login')}
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                disabled={isLoading}
              >
                Identificarse como Cliente
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

export default AdminLogin;