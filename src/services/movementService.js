import apiService from './api';

/**
 * Servicio de Movements (Transacciones)
 * - GET /users/:id/movements (con filtros, paginación, orden)
 * - GET /movements (admin: lista global con filtros)
 * - GET /movements/:id
 * - POST /movements (multipart/form-data)
 * - PATCH /movements/:id/approve (aprobar)
 * - PATCH /movements/:id/reject (rechazar)
 * - GET /movements/:id/voucher (descarga comprobante)
 */
export class MovementService {
  /**
   * Obtener movimientos de un usuario con filtros y paginación
   * @param {string} userId
   * @param {object} params { page, limit, tipo_especifico, estado, fecha_desde, fecha_hasta, search, sort }
   */
  static async getUserMovements(userId, params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.page) query.set('page', params.page);
      if (params.limit) query.set('limit', params.limit);
      if (params.tipo_especifico) query.set('tipo_especifico', params.tipo_especifico);
      if (params.estado) query.set('estado', params.estado);
      if (params.fecha_desde) query.set('fecha_desde', params.fecha_desde);
      if (params.fecha_hasta) query.set('fecha_hasta', params.fecha_hasta);
      if (params.search) query.set('search', params.search);
      if (params.sort) query.set('sort', params.sort);

      const qs = query.toString();
      const endpoint = qs ? `/users/${userId}/movements?${qs}` : `/users/${userId}/movements`;

      const response = await apiService.get(endpoint);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Error al obtener movimientos');

    } catch (error) {
      console.error('Error en getUserMovements:', error);
      throw error;
    }
  }

  /**
   * Obtener lista global de movimientos (Admin)
   * Filtros compatibles con DocumentacionAPI: tipo_especifico, estado, fecha_desde, fecha_hasta, page, limit
   * @param {object} params
   */
  static async getMovements(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.page) query.set('page', params.page);
      if (params.limit) query.set('limit', params.limit);
      if (params.tipo_especifico) query.set('tipo_especifico', params.tipo_especifico);
      if (params.estado) query.set('estado', params.estado);
      if (params.fecha_desde) query.set('fecha_desde', params.fecha_desde);
      if (params.fecha_hasta) query.set('fecha_hasta', params.fecha_hasta);
      if (params.search) query.set('search', params.search);
      if (params.sort) query.set('sort', params.sort);

      const qs = query.toString();
      const endpoint = qs ? `/movements?${qs}` : `/movements`;

      const response = await apiService.get(endpoint);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || 'Error al obtener movimientos (admin)');
    } catch (error) {
      console.error('Error en getMovements:', error);
      throw error;
    }
  }

  /**
   * Obtener detalle de un movimiento
   * @param {string} movementId
   */
  static async getMovement(movementId) {
    try {
      const response = await apiService.get(`/movements/${movementId}`);
      if (response.success && response.data) {
        return response.data.movement || response.data;
      }
      throw new Error(response.message || 'Error al obtener detalle del movimiento');
    } catch (error) {
      console.error('Error en getMovement:', error);
      throw error;
    }
  }

  /**
   * Aprobar movimiento (Admin)
   * @param {string} movementId
   * @param {object} data { comentarios?: string }
   */
  static async approveMovement(movementId, data = {}) {
    try {
      const response = await apiService.patch(`/movements/${movementId}/approve`, data);
      if (response.success) return response;
      throw new Error(response.message || 'Error al aprobar movimiento');
    } catch (error) {
      console.error('Error en approveMovement:', error);
      throw error;
    }
  }

  /**
   * Rechazar movimiento (Admin)
   * @param {string} movementId
   * @param {object} data { motivos: string[], otros_motivos?: string, comentarios?: string }
   */
  static async rejectMovement(movementId, data) {
    try {
      const payload = {
        motivos: Array.isArray(data?.motivos) && data.motivos.length ? data.motivos : undefined,
        ...(data?.otros_motivos ? { otros_motivos: data.otros_motivos } : {}),
        ...(data?.comentarios ? { comentarios: data.comentarios } : {}),
      };
      const response = await apiService.patch(`/movements/${movementId}/reject`, payload);
      if (response.success) return response;
      throw new Error(response.message || 'Error al rechazar movimiento');
    } catch (error) {
      console.error('Error en rejectMovement:', error);
      throw error;
    }
  }

  /**
   * Crear un nuevo movimiento (pago de garantía) con multipart/form-data
   * Campos esperados:
   * - auction_id (string)
   * - monto (string|number)
   * - tipo_pago ('deposito' | 'transferencia')
   * - numero_cuenta_origen (string)
   * - numero_operacion (string)
   * - fecha_pago (ISO)
   * - moneda (default 'USD')
   * - concepto (opcional)
   * - voucher (File)
   * @param {FormData} formData
   */
  static async createMovement(formData) {
    try {
      const response = await apiService.uploadFile('/movements', formData);
      if (response.success) return response;
      throw new Error(response.message || 'Error al registrar el movimiento');
    } catch (error) {
      console.error('Error en createMovement:', error);
      throw error;
    }
  }

  /**
   * Descargar comprobante (voucher) de un movimiento
   * Retorna un Blob para que el caller maneje el guardado
   * @param {string} movementId
   */
  static async downloadVoucher(movementId) {
    try {
      // Usar fetch nativo porque necesitamos blob y encabezados de sesión
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const sessionId = localStorage.getItem('session_id');

      const res = await fetch(`${API_BASE}/movements/${movementId}/voucher`, {
        method: 'GET',
        headers: {
          ...(sessionId && { 'X-Session-ID': sessionId }),
        }
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `Error HTTP ${res.status}`);
      }

      const blob = await res.blob();
      return blob;

    } catch (error) {
      console.error('Error en downloadVoucher:', error);
      throw error;
    }
  }
}

export default MovementService;