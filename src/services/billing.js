import apiService from './api';

/**
 * Servicio de Facturación (Fase 9)
 * Contratos referenciados en doc/DocumentacionAPI.md (sección Billing)
 * y planning de FASE 9: listado, detalle, completar datos de facturación.
 */
export class BillingService {
  /**
   * Lista de facturaciones por usuario (Cliente)
   * GET /users/:userId/billings?include=auction
   * @param {string} userId
   * @param {object} params { page, limit, fecha_desde, fecha_hasta, include }
   * @returns {Promise<{ billings: Array, pagination: object }>}
   */
  static async listByUser(userId, params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));
      if (params.fecha_desde) query.set('fecha_desde', params.fecha_desde);
      if (params.fecha_hasta) query.set('fecha_hasta', params.fecha_hasta);

      // include=auction por defecto para UI inmediata
      const includeParam = params.include ?? 'auction';
      if (includeParam) {
        query.set('include', Array.isArray(includeParam) ? includeParam.join(',') : includeParam);
      }

      const qs = query.toString();

      // Preferir el contrato documentado oficial primero: /users/:userId/billings
      const endpoint = qs
        ? `/users/${encodeURIComponent(userId)}/billings?${qs}`
        : `/users/${encodeURIComponent(userId)}/billings`;

      // Fallback por compatibilidad (algunas implementaciones usan /billing/users/:id)
      const fallbackEndpoint = qs
        ? `/billing/users/${encodeURIComponent(userId)}?${qs}`
        : `/billing/users/${encodeURIComponent(userId)}`;

      let response = await apiService.get(endpoint).catch(async () => {
        return apiService.get(fallbackEndpoint);
      });

      if (response.success && response.data) {
        const data = response.data;
        const billings = data.billings || data.items || data || [];
        const pagination = data.pagination || { page: 1, total: billings.length, total_pages: 1, limit: billings.length };
        return { billings, pagination };
      }
      throw new Error(response.message || 'Error al obtener facturaciones del usuario');
    } catch (error) {
      console.error('BillingService.listByUser error:', error);
      throw error;
    }
  }

  /**
   * Lista global de facturaciones (Admin)
   * GET /billing?include=user,auction
   * @param {object} params { page, limit, fecha_desde, fecha_hasta, include, search, estado }
   * @returns {Promise<{ billings: Array, pagination: object }>}
   */
  static async listAll(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));
      if (params.fecha_desde) query.set('fecha_desde', params.fecha_desde);
      if (params.fecha_hasta) query.set('fecha_hasta', params.fecha_hasta);
      if (params.search) query.set('search', params.search);

      // include=user,auction por defecto
      const includeParam = params.include ?? 'user,auction';
      if (includeParam) {
        query.set('include', Array.isArray(includeParam) ? includeParam.join(',') : includeParam);
      }

      // Nota: "estado (pendiente|completa)" podría ser computado en frontend.
      // Si backend soporta filtro "estado", lo propagamos:
      if (params.estado) query.set('estado', params.estado);

      const qs = query.toString();
      const endpoint = qs ? `/billing?${qs}` : `/billing`;

      const response = await apiService.get(endpoint);
      if (response.success && response.data) {
        const data = response.data;
        const billings = data.billings || data.items || data || [];
        const pagination = data.pagination || { page: 1, total: billings.length, total_pages: 1, limit: billings.length };
        return { billings, pagination };
      }
      throw new Error(response.message || 'Error al obtener facturaciones (admin)');
    } catch (error) {
      console.error('BillingService.listAll error:', error);
      throw error;
    }
  }

  /**
   * Detalle de una facturación
   * GET /billing/:id?include=user,auction
   * @param {string} id
   * @param {string|string[]} include
   * @returns {Promise<object>} billing
   */
  static async getById(id, include = 'user,auction') {
    try {
      const query = new URLSearchParams();
      if (include) {
        const includeValue = Array.isArray(include) ? include.join(',') : include;
        query.set('include', includeValue);
      }
      const qs = query.toString();
      const endpoint = qs ? `/billing/${encodeURIComponent(id)}?${qs}` : `/billing/${encodeURIComponent(id)}`;

      const response = await apiService.get(endpoint);
      if (response.success && response.data) {
        return response.data.billing || response.data;
      }
      throw new Error(response.message || 'Error al obtener detalle de facturación');
    } catch (error) {
      console.error('BillingService.getById error:', error);
      throw error;
    }
  }

  /**
   * Completar datos de facturación
   * PATCH /billing/:id/complete
   * Body: { billing_document_type: 'RUC'|'DNI', billing_document_number: string, billing_name: string }
   * @param {string} id
   * @param {object} dto
   * @returns {Promise<object>} respuesta con billing actualizado
   */
  static async complete(id, dto) {
    try {
      const endpoint = `/billing/${encodeURIComponent(id)}/complete`;
      const response = await apiService.patch(endpoint, dto);
      if (response.success) return response;
      // Si llega success=false, mapear error
      const err = new Error(mapBillingErrorMessage(response));
      err.data = response;
      throw err;
    } catch (error) {
      // Mapear errores conocidos según FASE 9
      const mappedMessage = mapBillingErrorFromThrown(error);
      if (mappedMessage) {
        const e = new Error(mappedMessage);
        e.original = error;
        e.code = error?.code || error?.data?.error?.code;
        throw e;
      }
      console.error('BillingService.complete error:', error);
      throw error;
    }
  }
}

/**
 * Mapea estructura estándar de error response→mensaje
 */
function mapBillingErrorMessage(response) {
  const stdErr = response?.error || response?.data?.error;
  const code = stdErr?.code || response?.code;
  switch (code) {
    case 'BILLING_ALREADY_COMPLETED':
      return 'Esta facturación ya fue completada.';
    case 'DUPLICATE_BILLING_DOCUMENT':
      return 'El número de documento ya fue usado por este usuario.';
    case 'FORBIDDEN':
    case 'ACCESS_DENIED':
      return 'No tiene permisos sobre esta facturación.';
    default:
      return stdErr?.message || response?.message || 'Error al completar datos de facturación.';
  }
}

/**
 * Mapea Error lanzado (con .data?.error?.code o .code) → mensaje legible
 */
function mapBillingErrorFromThrown(error) {
  const code =
    error?.code ||
    error?.data?.error?.code ||
    error?.data?.code ||
    error?.data?.error_code;

  switch (code) {
    case 'BILLING_ALREADY_COMPLETED':
      return 'Esta facturación ya fue completada.';
    case 'DUPLICATE_BILLING_DOCUMENT':
      return 'El número de documento ya fue usado por este usuario.';
    case 'FORBIDDEN':
    case 'ACCESS_DENIED':
      return 'No tiene permisos sobre esta facturación.';
    default:
      return null;
  }
}

export default BillingService;