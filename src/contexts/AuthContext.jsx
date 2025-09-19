import { createContext, useReducer, useEffect } from 'react';
import AuthService from '../services/authService';
import { showToast } from '../utils/toast';

// Estados del contexto de autenticación
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
      
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        userType: action.payload.userType,
        sessionId: action.payload.sessionId,
        isLoading: false,
        error: null
      };
      
    case 'LOGIN_ERROR':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        userType: null,
        sessionId: null,
        isLoading: false,
        error: action.payload
      };
      
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        userType: null,
        sessionId: null,
        isLoading: false,
        error: null
      };
      
    case 'SESSION_RESTORED':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        userType: action.payload.userType,
        sessionId: action.payload.sessionId,
        isLoading: false
      };
      
    case 'SESSION_EXPIRED':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        userType: null,
        sessionId: null,
        isLoading: false,
        error: 'Sesión expirada'
      };
      
    default:
      return state;
  }
};

// Estado inicial
const initialState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  userType: null, // 'client' | 'admin'
  sessionId: null,
  error: null
};

// Crear contexto
const AuthContext = createContext(null);

// Provider del contexto
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Función para login de cliente
  const clientLogin = async (documentType, documentNumber) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await AuthService.clientLogin(documentType, documentNumber);
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: {
          user: response.data.user,
          userType: 'client',
          sessionId: response.data.session.session_id
        }
      });
      
      return response;
      
    } catch (error) {
      dispatch({ 
        type: 'LOGIN_ERROR', 
        payload: error.message 
      });
      throw error;
    }
  };
  
  // Función para acceso admin
  const adminAccess = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await AuthService.adminAccess();
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: {
          user: response.data.user,
          userType: 'admin',
          sessionId: response.data.session.session_id
        }
      });
      
      return response;
      
    } catch (error) {
      dispatch({ 
        type: 'LOGIN_ERROR', 
        payload: error.message 
      });
      throw error;
    }
  };
  
  // Función para logout
  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
      showToast.info('Sesión cerrada exitosamente');
    }
  };
  
  // Función para validar sesión
  const validateSession = async () => {
    try {
      const sessionData = await AuthService.validateSession();
      
      if (sessionData) {
        const user = AuthService.getCurrentUser();
        const userType = AuthService.getUserType();
        const sessionId = AuthService.getSessionId();
        
        if (user && userType && sessionId) {
          dispatch({
            type: 'SESSION_RESTORED',
            payload: { user, userType, sessionId }
          });
          return true;
        }
      }
      
      // Si no hay sesión válida, limpiar estado
      dispatch({ type: 'LOGOUT' });
      return false;
      
    } catch (error) {
      console.error('Error validando sesión:', error);
      dispatch({ type: 'SESSION_EXPIRED' });
      return false;
    }
  };
  
  // Función para verificar si el usuario tiene permisos
  const hasPermission = (requiredUserType) => {
    if (!state.isAuthenticated) return false;
    if (requiredUserType === 'any') return true;
    return state.userType === requiredUserType;
  };
  
  // Función para obtener información del usuario actual
  const getCurrentUser = () => {
    return state.user;
  };
  
  // Función para verificar si es admin
  const isAdmin = () => {
    return state.userType === 'admin';
  };
  
  // Función para verificar si es cliente
  const isClient = () => {
    return state.userType === 'client';
  };
  
  // Auto-validar sesión al cargar la aplicación
  useEffect(() => {
    const checkSession = async () => {
      if (AuthService.isAuthenticated()) {
        await validateSession();
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    checkSession();
  }, []);
  
  // Auto-renovar sesión cada 30 minutos (antes de que expire)
  useEffect(() => {
    if (!state.isAuthenticated) return;
    
    const renewSession = async () => {
      try {
        await validateSession();
      } catch (error) {
        console.error('Error renovando sesión:', error);
        showToast.warning('Tu sesión expirará pronto. Vuelve a iniciar sesión.');
      }
    };
    
    // Renovar cada 30 minutos
    const interval = setInterval(renewSession, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [state.isAuthenticated]);
  
  // Valor del contexto
  const contextValue = {
    // Estado
    ...state,
    
    // Acciones
    clientLogin,
    adminAccess,
    logout,
    validateSession,
    
    // Utilidades
    hasPermission,
    getCurrentUser,
    isAdmin,
    isClient
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;