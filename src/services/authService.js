import apiService from './api.js';

/**
 * Servicio de autenticación para BOB Subastas
 */
export class AuthService {
  
  /**
   * Login de cliente por documento
   * @param {string} documentType - Tipo de documento (DNI, CE, RUC, Pasaporte)
   * @param {string} documentNumber - Número de documento
   * @returns {Promise<Object>} - Datos de usuario y sesión
   */
  static async clientLogin(documentType, documentNumber) {
    try {
      const response = await apiService.post('/auth/client-login', {
        document_type: documentType,
        document_number: documentNumber
      });
      
      if (response.success && response.data) {
        // Guardar session_id en localStorage
        if (response.data.session?.session_id) {
          localStorage.setItem('session_id', response.data.session.session_id);
          localStorage.setItem('user_data', JSON.stringify(response.data.user));
          localStorage.setItem('user_type', 'client');
        }
        
        return response;
      } else {
        throw new Error(response.message || 'Error en login');
      }
      
    } catch (error) {
      console.error('Error en clientLogin:', error);
      throw error;
    }
  }
  
  /**
   * Login automático de admin
   * @returns {Promise<Object>} - Datos de usuario y sesión de admin
   */
  static async adminAccess() {
    try {
      const response = await apiService.post('/auth/admin-access');
      
      if (response.success && response.data) {
        // Guardar session_id en localStorage
        if (response.data.session?.session_id) {
          localStorage.setItem('session_id', response.data.session.session_id);
          localStorage.setItem('user_data', JSON.stringify(response.data.user));
          localStorage.setItem('user_type', 'admin');
        }
        
        return response;
      } else {
        throw new Error(response.message || 'Error en acceso admin');
      }
      
    } catch (error) {
      console.error('Error en adminAccess:', error);
      throw error;
    }
  }
  
  /**
   * Cerrar sesión
   * @returns {Promise<void>}
   */
  static async logout() {
    try {
      // Intentar cerrar sesión en el backend
      await apiService.post('/auth/logout');
    } catch (error) {
      console.error('Error al cerrar sesión en backend:', error);
      // Continuar con limpieza local aunque falle el backend
    } finally {
      // Limpiar datos locales
      localStorage.removeItem('session_id');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_type');
    }
  }
  
  /**
   * Validar sesión activa
   * @returns {Promise<Object|null>} - Datos de sesión si es válida
   */
  static async validateSession() {
    try {
      const sessionId = localStorage.getItem('session_id');
      if (!sessionId) {
        return null;
      }
      
      const response = await apiService.get('/auth/session');
      
      if (response.success) {
        return response.data;
      } else {
        // Sesión inválida, limpiar datos locales
        this.clearLocalData();
        return null;
      }
      
    } catch (error) {
      console.error('Error validando sesión:', error);
      this.clearLocalData();
      return null;
    }
  }
  
  /**
   * Obtener datos de usuario del localStorage
   * @returns {Object|null} - Datos de usuario
   */
  static getCurrentUser() {
    try {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return null;
    }
  }
  
  /**
   * Obtener tipo de usuario del localStorage
   * @returns {string|null} - Tipo de usuario (client/admin)
   */
  static getUserType() {
    return localStorage.getItem('user_type');
  }
  
  /**
   * Obtener session_id del localStorage
   * @returns {string|null} - Session ID
   */
  static getSessionId() {
    return localStorage.getItem('session_id');
  }
  
  /**
   * Verificar si hay una sesión activa
   * @returns {boolean}
   */
  static isAuthenticated() {
    return !!(this.getSessionId() && this.getCurrentUser());
  }
  
  /**
   * Limpiar datos locales
   */
  static clearLocalData() {
    localStorage.removeItem('session_id');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_type');
  }
}

export default AuthService;