const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Servicio base API usando fetch nativo
 * Configurado para BOB Subastas backend
 */
class ApiService {
  constructor() {
    this.baseURL = API_BASE;
  }

  /**
   * Método base para realizar peticiones fetch
   * @param {string} endpoint 
   * @param {object} options 
   * @returns {Promise}
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const sessionId = localStorage.getItem('session_id');

    // No forzar Content-Type cuando es FormData (multipart)
    const isFormData = typeof FormData !== 'undefined' && options?.body instanceof FormData;

    const defaultOptions = {
      headers: {
        ...(sessionId && { 'X-Session-ID': sessionId }),
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    };

    const config = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Manejo de errores HTTP
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Soportar estructura estándar: { success:false, error:{ code, message, details } }
        const stdErr = errorData && typeof errorData === 'object' ? errorData.error : undefined;
        const message =
          errorData?.message ||
          stdErr?.message ||
          `HTTP Error: ${response.status}`;
        const code = errorData?.code || stdErr?.code;
        const details = errorData?.details || stdErr?.details;

        const error = new Error(message);
        error.status = response.status;
        error.data = errorData;
        if (code) error.code = code;
        if (details) error.details = details;
        throw error;
      }

      // Si la respuesta está vacía, retornar objeto vacío
      const text = await response.text();
      return text ? JSON.parse(text) : {};
      
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * GET request
   * @param {string} endpoint 
   * @param {object} options 
   * @returns {Promise}
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * POST request
   * @param {string} endpoint 
   * @param {object} data 
   * @param {object} options 
   * @returns {Promise}
   */
  async post(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
      ...options,
    });
  }

  /**
   * PATCH request
   * @param {string} endpoint 
   * @param {object} data 
   * @param {object} options 
   * @returns {Promise}
   */
  async patch(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : null,
      ...options,
    });
  }

  /**
   * DELETE request
   * @param {string} endpoint 
   * @param {object} options 
   * @returns {Promise}
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  /**
   * Método para uploads multipart/form-data
   * @param {string} endpoint 
   * @param {FormData} formData 
   * @param {object} options 
   * @returns {Promise}
   */
  async uploadFile(endpoint, formData, options = {}) {
    const sessionId = localStorage.getItem('session_id');
    
    return this.request(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        // No incluir Content-Type para multipart/form-data
        // El browser lo establece automáticamente con boundary
        ...(sessionId && { 'X-Session-ID': sessionId }),
        ...options.headers,
      },
      ...options,
    });
  }
}

// Instancia singleton
const apiService = new ApiService();

export default apiService;

// Métodos de conveniencia exportados
export const { get, post, patch, delete: del, uploadFile } = apiService;