import apiService from './api';

/**
 * Servicio de Notificaciones - FASE 6 AVANZADO
 * Endpoints según DocumentacionAPI.md:
 * - GET /notifications?estado=pendiente&tipo=pago_registrado&fecha_desde=...
 *   - Cliente: devuelve solo las propias (por sesión)
 *   - Admin: puede filtrar por user_id, search, etc.
 * - PATCH /notifications/:id/read -> { success: true }
 * - PATCH /notifications/mark-all-read -> { success: true }
 */
export class NotificationService {
  /**
   * Obtener notificaciones con filtros avanzados
   * @param {object} params - Filtros { estado, tipo, fecha_desde, fecha_hasta, search, page, limit, user_id }
   * @returns {Promise<{notifications: Array, pagination: object}>}
   */
  static async getNotifications(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.estado) query.set('estado', params.estado);
      if (params.tipo) query.set('tipo', params.tipo);
      if (params.fecha_desde) query.set('fecha_desde', params.fecha_desde);
      if (params.fecha_hasta) query.set('fecha_hasta', params.fecha_hasta);
      if (params.search) query.set('search', params.search);
      if (params.page) query.set('page', params.page);
      if (params.limit) query.set('limit', params.limit);
      if (params.user_id) query.set('user_id', params.user_id); // Solo para admin

      const qs = query.toString();
      const endpoint = qs ? `/notifications?${qs}` : '/notifications';
      const res = await apiService.get(endpoint);
      
      // Normalizar estructura de respuesta
      if (res?.data?.notifications && Array.isArray(res.data.notifications)) {
        return {
          notifications: res.data.notifications,
          pagination: res.data.pagination || { page: 1, total: res.data.notifications.length, total_pages: 1 }
        };
      }
      if (Array.isArray(res?.data)) {
        return { notifications: res.data, pagination: { page: 1, total: res.data.length, total_pages: 1 } };
      }
      if (Array.isArray(res)) {
        return { notifications: res, pagination: { page: 1, total: res.length, total_pages: 1 } };
      }
      
      return { notifications: [], pagination: { page: 1, total: 0, total_pages: 0 } };
    } catch (error) {
      console.error('Error en getNotifications:', error);
      throw error;
    }
  }

  /**
   * Método legacy para compatibilidad (usa getNotifications sin filtros)
   * @returns {Promise<Array>} lista de notificaciones
   */
  static async getUserNotifications() {
    const result = await this.getNotifications();
    return result.notifications;
  }

  /**
   * Marcar una notificación como leída
   * @param {string|number} notificationId
   * @returns {Promise<boolean>}
   */
  static async markAsRead(notificationId) {
    if (!notificationId) return false;
    try {
      const res = await apiService.patch(`/notifications/${notificationId}/read`, {});
      return !!res?.success || true; // ser tolerantes
    } catch (error) {
      console.error('Error en markAsRead:', error);
      throw error;
    }
  }

  /**
   * Marcar todas como leídas para el usuario actual (si backend lo soporta)
   * @returns {Promise<boolean>}
   */
  static async markAllAsRead() {
    try {
      const res = await apiService.patch('/notifications/mark-all-read', {});
      return !!res?.success || true;
    } catch (error) {
      console.error('Error en markAllAsRead:', error);
      throw error;
    }
  }
}

export default NotificationService;