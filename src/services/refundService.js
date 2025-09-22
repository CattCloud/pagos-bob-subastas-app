import apiService from './api';

/**
 * Servicio de Reembolsos - FASE 7
 * Endpoints según DocumentacionAPI.md y HU-REEM-01/02/04/05:
 * - POST /refunds -> Crear solicitud
 * - GET /users/:id/refunds -> Historial cliente 
 * - GET /refunds/:id -> Detalle específico
 * - GET /refunds -> Lista admin (con filtros)
 * - PATCH /refunds/:id/manage -> Confirmar/rechazar (admin)
 * - PATCH /refunds/:id/process -> Procesar reembolso (admin)
 */
export class RefundService {
  /**
   * Crear nueva solicitud de reembolso (HU-REEM-01)
   * @param {object} data - { auction_id, monto_solicitado, tipo_reembolso, motivo }
   * @returns {Promise<object>} respuesta con refund creado
   */
  static async createRefund(data) {
    try {
      const response = await apiService.post('/refunds', data);
      if (response.success) return response;
      throw new Error(response.message || 'Error al crear solicitud de reembolso');
    } catch (error) {
      console.error('Error en createRefund:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de reembolsos del cliente (HU-REEM-04)
   * Usa GET /refunds que filtra automáticamente por sesión del cliente
   * @param {string} _userId - No usado, se mantiene por compatibilidad
   * @param {object} filters - { estado, tipo_reembolso, fecha_desde, fecha_hasta, page, limit }
   * @returns {Promise<object>} { refunds: [], pagination: {} }
   */
  static async getUserRefunds(_userId, filters = {}) {
    try {
      const query = new URLSearchParams();
      // Estado según contrato: lista separada por comas. Si no hay filtro explícito, enviar todos.
      const estado = filters?.estado;
      const estadoParam = (!estado || estado === 'todos' || estado === 'all')
        ? 'solicitado,confirmado,procesado,rechazado,cancelado'
        : estado;
      query.set('estado', estadoParam);
      if (filters.auction_id) query.set('auction_id', filters.auction_id);
      if (filters.fecha_desde) query.set('fecha_desde', filters.fecha_desde);
      if (filters.fecha_hasta) query.set('fecha_hasta', filters.fecha_hasta);
      if (filters.page) query.set('page', String(filters.page));
      if (filters.limit) query.set('limit', String(filters.limit));
      // Enriquecer con datos mínimos relacionados para UI inmediata
      const includeParam = filters.include ?? 'user,auction';
      if (includeParam) {
        query.set('include', Array.isArray(includeParam) ? includeParam.join(',') : includeParam);
      }

      const qs = query.toString();
      const endpoint = qs ? `/refunds?${qs}` : '/refunds';
      
      const response = await apiService.get(endpoint);
      if (response.success && response.data) {
        return {
          refunds: response.data.refunds || response.data || [],
          pagination: response.data.pagination || { page: 1, total: 0, total_pages: 0 }
        };
      }
      throw new Error(response.message || 'Error al obtener historial de reembolsos');
    } catch (error) {
      console.error('Error en getUserRefunds:', error);
      throw error;
    }
  }

  /**
   * Obtener detalle de un reembolso específico (HU-REEM-05)
   * @param {string} refundId
   * @returns {Promise<object>} detalle completo del reembolso
   */
  static async getRefund(refundId) {
    try {
      // Nuevo contrato: GET /refunds/:id con include opt-in
      const query = new URLSearchParams();
      const includeParam = 'user,auction';
      query.set('include', includeParam);
      const qs = query.toString();
      const endpoint = qs ? `/refunds/${refundId}?${qs}` : `/refunds/${refundId}`;

      const response = await apiService.get(endpoint);
      if (response.success && response.data) {
        return response.data.refund || response.data;
      }
      throw new Error(response.message || 'Error al obtener detalle de reembolso');
    } catch (error) {
      console.error('Error en getRefund:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de reembolsos para admin (HU-REEM-02)
   * @param {object} filters - { estado, tipo_reembolso, user_id, search, fecha_desde, fecha_hasta, page, limit }
   * @returns {Promise<object>} { refunds: [], pagination: {} }
   */
  static async getAllRefunds(filters = {}) {
    try {
      const query = new URLSearchParams();
      // Estado según contrato: lista separada por comas. Si no hay filtro explícito, enviar todos.
      const estado = filters?.estado;
      const estadoParam = (!estado || estado === 'todos' || estado === 'all')
        ? 'solicitado,confirmado,procesado,rechazado,cancelado'
        : estado;
      query.set('estado', estadoParam);
      if (filters.user_id) query.set('user_id', filters.user_id);
      if (filters.auction_id) query.set('auction_id', filters.auction_id);
      if (filters.fecha_desde) query.set('fecha_desde', filters.fecha_desde);
      if (filters.fecha_hasta) query.set('fecha_hasta', filters.fecha_hasta);
      if (filters.page) query.set('page', String(filters.page));
      if (filters.limit) query.set('limit', String(filters.limit));
      // Enriquecer con relaciones para admin
      const includeParam = filters.include ?? 'user,auction';
      if (includeParam) {
        query.set('include', Array.isArray(includeParam) ? includeParam.join(',') : includeParam);
      }

      const qs = query.toString();
      const endpoint = qs ? `/refunds?${qs}` : '/refunds';
      
      const response = await apiService.get(endpoint);
      if (response.success && response.data) {
        return {
          refunds: response.data.refunds || response.data || [],
          pagination: response.data.pagination || { page: 1, total: 0, total_pages: 0 }
        };
      }
      throw new Error(response.message || 'Error al obtener lista de reembolsos');
    } catch (error) {
      console.error('Error en getAllRefunds:', error);
      throw error;
    }
  }

  /**
   * Gestionar solicitud de reembolso - Confirmar/Rechazar (Admin, HU-REEM-02)
   * @param {string} refundId
   * @param {object} data - { estado: 'confirmado'|'rechazado', motivo: string }
   * @returns {Promise<object>}
   */
  static async manageRefund(refundId, data) {
    try {
      const response = await apiService.patch(`/refunds/${refundId}/manage`, data);
      if (response.success) return response;
      throw new Error(response.message || 'Error al gestionar reembolso');
    } catch (error) {
      console.error('Error en manageRefund:', error);
      throw error;
    }
  }

  /**
   * Procesar reembolso confirmado (Admin, HU-REEM-03)
   * @param {string} refundId
   * @param {FormData|object} data - FormData con: numero_operacion (obligatorio), tipo_transferencia? ('transferencia'|'deposito'), banco_destino?, numero_cuenta_destino?, voucher?
   * @returns {Promise<object>}
   */
  static async processRefund(refundId, data) {
    try {
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
      const response = isFormData
        ? await apiService.request(`/refunds/${refundId}/process`, { method: 'PATCH', body: data })
        : await apiService.patch(`/refunds/${refundId}/process`, data);

      if (response.success) return response;
      throw new Error(response.message || 'Error al procesar reembolso');
    } catch (error) {
      console.error('Error en processRefund:', error);
      throw error;
    }
  }

  /**
   * Obtener subastas elegibles para reembolso (perdida/penalizada con saldo retenido)
   * @param {string} userId
   * @returns {Promise<Array>} lista de subastas elegibles
   */
  static async getEligibleAuctions(userId) {
    try {
      // Usar endpoint de subastas ganadas pero filtrar por estados elegibles
      const response = await apiService.get(`/users/${userId}/won-auctions`);
      if (response.success && response.data) {
        const wonAuctions = response.data.won_auctions || response.data || [];
        
        // Filtrar solo subastas en estado 'perdida' o 'penalizada' 
        return wonAuctions
          .filter(item => {
            const estado = item.auction?.estado;
            return estado === 'perdida' || estado === 'penalizada';
          })
          .map(item => {
            const details = item.guarantee_details || item.offer_details || item.guarantee || item.offer || {};
            return {
              id: item.auction.id,
              estado: item.auction.estado,
              monto_oferta: Number(details.monto_oferta || 0),
              monto_garantia: Number(details.monto_garantia || 0),
              asset: {
                placa: item.auction.asset?.placa,
                marca: item.auction.asset?.marca,
                modelo: item.auction.asset?.modelo,
                año: item.auction.asset?.año,
              },
              _original: item,
            };
          });
      }
      return [];
    } catch (error) {
      console.error('Error en getEligibleAuctions:', error);
      return []; // No fallar, devolver array vacío
    }
  }
}

export default RefundService;