import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

/**
 * Componente para rutas protegidas que requieren autenticación
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componentes hijos a renderizar si está autenticado
 * @param {string} props.requireAuth - Tipo de usuario requerido ('client', 'admin', 'any')
 * @param {string} props.redirectTo - Ruta de redirección si no está autenticado
 */
function ProtectedRoute({
  children,
  requireAuth = 'any',
  redirectTo = '/client-login'
}) {
  const { isAuthenticated, isLoading, hasPermission, userType } = useAuth();
  const location = useLocation();
  
  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-text-secondary">Verificando sesión...</p>
        </div>
      </div>
    );
  }
  
  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }
  
  // Si está autenticado pero no tiene permisos, redirigir según el tipo
  if (!hasPermission(requireAuth)) {
    const defaultRedirect = userType === 'admin' ? '/admin-subastas' : '/pago-subastas';
    return (
      <Navigate
        to={defaultRedirect}
        replace
      />
    );
  }
  
  // Si todo está bien, renderizar los children
  return children;
}

export default ProtectedRoute;