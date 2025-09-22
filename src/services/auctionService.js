import apiService from './api';

/**
 * Servicio de Subastas (mínimo requerido para Fase 5)
 */
export default class AuctionService {
  /**
   * Listar subastas ganadas por el usuario autenticado
   * GET /users/:id/won-auctions
   * @param {string} userId
   * @returns {Promise<Array>} Lista de subastas ganadas
   */
  static async getUserWonAuctions(userId) {
    try {
      const res = await apiService.get(`/users/${userId}/won-auctions`);
      if (res.success && res.data) {
        // Backend devuelve: { success: true, data: { won_auctions: [...] } }
        const wonAuctions = res.data.won_auctions || res.data.auctions || res.data.wonAuctions || res.data || [];
        
        // Normalizar estructura: cada item tiene { auction, guarantee_details|offer_details, payment_status }
        return wonAuctions
          .filter(item => {
            // Solo mostrar subastas pendientes de pago (estado pendiente y sin pago)
            return item.auction?.estado === 'pendiente' &&
                   item.payment_status?.has_payment === false;
          })
          .map(item => {
            const details = item.guarantee_details || item.offer_details || item.guarantee || item.offer || {};
            return {
              // Estructura normalizada que espera AuctionSelector
              id: item.auction.id,
              estado: item.auction.estado,
              monto_oferta: Number(details.monto_oferta || 0),
              monto_garantia: Number(details.monto_garantia || 0),
              fecha_limite_pago: item.auction.fecha_limite_pago,
              asset: {
                placa: item.auction.asset?.placa,
                marca: item.auction.asset?.marca,
                modelo: item.auction.asset?.modelo,
                año: item.auction.asset?.año,
                empresa_propietaria: item.auction.asset?.empresa_propietaria,
              },
              // Mantener datos originales por si son necesarios
              _original: item,
            };
          });
      }
      throw new Error(res.message || 'No se pudieron obtener subastas ganadas');
    } catch (err) {
      console.error('AuctionService.getUserWonAuctions error:', err);
      throw err;
    }
  }
  /**
   * Listar TODAS las subastas ganadas por el usuario (sin filtrar por pago)
   * GET /users/:id/won-auctions
   * HU-SUB-01 — Mis Subastas (Cliente)
   * @param {string} userId
   * @returns {Promise<Array>} Lista de items con { auction, payment_status?, guarantee_details? }
   */
  static async getUserWonAuctionsAll(userId) {
    try {
      const res = await apiService.get(`/users/${userId}/won-auctions`);
      if (res?.success && res?.data) {
        // El backend expone { won_auctions: [ { auction, payment_status, guarantee_details } ] }
        // Devolvemos el arreglo tal cual para máxima compatibilidad.
        return res.data.won_auctions || res.data.auctions || res.data.wonAuctions || res.data || [];
      }
      throw new Error(res?.message || 'No se pudieron obtener subastas ganadas');
    } catch (err) {
      console.error('AuctionService.getUserWonAuctionsAll error:', err);
      throw err;
    }
  }

  /**
   * Listar subastas con filtros (Admin)
   * GET /auctions
   * @param {object} filters { estado, search, page, limit }
   * - estado: string separado por comas. Si no se envía o es 'todos', se envían todos los estados válidos
   * - search: buscar por marca/modelo/placa
   * - page, limit: paginación
   * @returns {Promise<{auctions: Array, pagination: Object}>}
   */
  static async listAuctions(filters = {}) {
    try {
      const query = new URLSearchParams();

      // Estados por defecto si no se especifica (según DocumentacionAPI)
      const estadosTodos = 'activa,pendiente,en_validacion,finalizada,ganada,perdida,penalizada,vencida,cancelada';
      const estado = filters?.estado;
      const estadoParam = (!estado || estado === 'todos' || estado === 'all') ? estadosTodos : String(estado);
      query.set('estado', estadoParam);

      if (filters.search) query.set('search', String(filters.search));
      if (filters.page) query.set('page', String(filters.page));
      if (filters.limit) query.set('limit', String(filters.limit));

      const endpoint = `/auctions?${query.toString()}`;
      const res = await apiService.get(endpoint);

      if (res?.success && res?.data) {
        return {
          auctions: res.data.auctions || res.data || [],
          pagination: res.data.pagination || { page: 1, limit: 20, total: 0, total_pages: 0 }
        };
      }
      throw new Error(res?.message || 'Error al listar subastas');
    } catch (err) {
      console.error('AuctionService.listAuctions error:', err);
      throw err;
    }
  }

  /**
   * Obtener detalle de una subasta (Admin)
   * GET /auctions/:id
   * @param {string} auctionId
   * @returns {Promise<Object>}
   */
  static async getAuction(auctionId) {
    try {
      const res = await apiService.get(`/auctions/${auctionId}`);
      if (res?.success && res?.data) {
        return res.data.auction || res.data;
      }
      throw new Error(res?.message || 'No se pudo obtener el detalle de la subasta');
    } catch (err) {
      console.error('AuctionService.getAuction error:', err);
      throw err;
    }
  }

  /**
   * Crear nueva subasta + activo (Admin)
   * POST /auctions
   * @param {object} payload
   * {
   *   asset: {
   *     placa: string,
   *     empresa_propietaria: string,
   *     marca: string,
   *     modelo: string,
   *     año: number,
   *     descripcion?: string
   *   }
   * }
   * @returns {Promise<Object>} auction creada
   */
  static async createAuction(payload) {
    try {
      const res = await apiService.post('/auctions', payload);
      if (res?.success && res?.data) {
        return res.data.auction || res.data;
      }
      throw new Error(res?.message || 'Error al crear subasta');
    } catch (err) {
      console.error('AuctionService.createAuction error:', err);
      throw err;
    }
  }

  /**
   * Registrar resultado de competencia externa (Admin)
   * PATCH /auctions/:id/competition-result
   * @param {string} auctionId
   * @param {{ resultado: string, observaciones?: string }} data
   * - resultado aceptado: 'ganada' | 'perdida' | 'penalizada'
   *   (Se mapean valores comunes como 'gano', 'perdio', 'no_pago' a estos)
   * @returns {Promise<Object>} respuesta backend (subasta actualizada, notificaciones, etc.)
   */
  static async setCompetitionResult(auctionId, data = {}) {
    try {
      const normalizeResultado = (value) => {
        const v = String(value || '').toLowerCase();
        if (['ganada', 'gano', 'bob_gano'].includes(v)) return 'ganada';
        if (['perdida', 'perdio', 'bob_perdio'].includes(v)) return 'perdida';
        if (['penalizada', 'no_pago', 'cliente_no_pago'].includes(v)) return 'penalizada';
        return v || 'perdida';
      };

      const body = {
        resultado: normalizeResultado(data.resultado),
        ...(data.observaciones ? { observaciones: data.observaciones } : {})
      };

      const res = await apiService.patch(`/auctions/${auctionId}/competition-result`, body);
      if (res?.success) return res;
      throw new Error(res?.message || 'Error al registrar resultado de competencia');
    } catch (err) {
      console.error('AuctionService.setCompetitionResult error:', err);
      throw err;
    }
  }

  /**
   * Registrar ganador de subasta (Guarantee)
   * POST /auctions/:id/winner
   * @param {string} auctionId
   * @param {object} winnerData
   * {
   *   user_id: string,       // CUID del usuario
   *   monto_oferta: number,
   *   fecha_limite_pago?: string ISO (opcional)
   * }
   * @returns {Promise<Object>} guarantee creada + auction actualizada
   */
  static async assignWinner(auctionId, winnerData) {
    try {
      // Validar que user_id sea un CUID válido
      const userId = String(winnerData.user_id || '').trim();
      if (!userId || userId === '' || userId === 'undefined' || userId === 'null') {
        throw new Error('Debe seleccionar un cliente válido');
      }
      
      // Validación básica de formato CUID (comienza con 'c' y tiene longitud apropiada)
      if (userId.length < 10 || !userId.startsWith('c')) {
        throw new Error('ID de cliente inválido (formato CUID requerido)');
      }

      const payload = {
        user_id: userId,
        monto_oferta: Number(winnerData.monto_oferta),
        ...(winnerData.fecha_limite_pago ? { fecha_limite_pago: winnerData.fecha_limite_pago } : {})
      };

      const res = await apiService.post(`/auctions/${auctionId}/winner`, payload);
      if (res?.success && res?.data) {
        return res.data;
      }
      throw new Error(res?.message || 'Error al asignar ganador');
    } catch (err) {
      console.error('AuctionService.assignWinner error:', err);
      throw err;
    }
  }

  /**
   * Listar usuarios para asignación de ganador
   * GET /users (solo admin puede ver lista de clientes)
   * @param {object} filters { search?, page?, limit? }
   * @returns {Promise<{users: Array, pagination: Object}>}
   */
  static async listUsers(filters = {}) {
    try {
      const query = new URLSearchParams();
      if (filters.search) query.set('search', String(filters.search));
      if (filters.page) query.set('page', String(filters.page));
      if (filters.limit) query.set('limit', String(filters.limit));

      const endpoint = query.toString() ? `/users?${query.toString()}` : '/users';
      const res = await apiService.get(endpoint);

      if (res?.success && res?.data) {
        return {
          users: res.data.users || res.data || [],
          pagination: res.data.pagination || { page: 1, limit: 20, total: 0, total_pages: 0 }
        };
      }
      throw new Error(res?.message || 'Error al listar usuarios');
    } catch (err) {
      console.error('AuctionService.listUsers error:', err);
      throw err;
    }
  }
}