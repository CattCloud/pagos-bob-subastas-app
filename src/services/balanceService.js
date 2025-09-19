import apiService from './api.js';

/**
 * Servicio para gestión de saldos
 * Implementa la fórmula: Disponible = Total - Retenido - Aplicado
 */
export class BalanceService {
  
  /**
   * Obtener saldo de un usuario específico
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - Datos de saldo del usuario
   */
  static async getUserBalance(userId) {
    try {
      const response = await apiService.get(`/users/${userId}/balance`);
      
      if (response.success && response.data) {
        return response.data.balance;
      } else {
        throw new Error(response.message || 'Error al obtener saldo');
      }
      
    } catch (error) {
      console.error('Error en getUserBalance:', error);
      throw error;
    }
  }
  
  /**
   * Obtener resumen de saldos de todos los usuarios (admin)
   * @returns {Promise<Object>} - Resumen de saldos del sistema
   */
  static async getBalancesSummary() {
    try {
      const response = await apiService.get('/balances/summary');
      
      if (response.success && response.data) {
        // Calcular estadísticas desde los balances obtenidos
        const balances = response.data.balances || [];
        const stats = this.calculateBalanceStats(balances);
        
        return {
          ...response.data,
          stats
        };
      } else {
        throw new Error(response.message || 'Error al obtener resumen de saldos');
      }
      
    } catch (error) {
      console.error('Error en getBalancesSummary:', error);
      throw error;
    }
  }
  
  /**
   * Calcular saldo disponible usando la fórmula oficial
   * @param {Object} balance - Objeto balance del backend
   * @returns {number} - Saldo disponible calculado
   */
  static calculateAvailableBalance(balance) {
    if (!balance) return 0;
    
    const total = parseFloat(balance.saldo_total || 0);
    const retenido = parseFloat(balance.saldo_retenido || 0);
    const aplicado = parseFloat(balance.saldo_aplicado || 0);
    
    // Fórmula oficial: Disponible = Total - Retenido - Aplicado
    const disponible = total - retenido - aplicado;
    
    // Asegurar que nunca sea negativo (RN11)
    return Math.max(0, disponible);
  }
  
  /**
   * Validar integridad de saldo
   * @param {Object} balance - Objeto balance del backend
   * @returns {Object} - Resultado de validación
   */
  static validateBalance(balance) {
    if (!balance) {
      return { 
        isValid: false, 
        errors: ['Balance object is required'] 
      };
    }
    
    const errors = [];
    const total = parseFloat(balance.saldo_total || 0);
    const retenido = parseFloat(balance.saldo_retenido || 0);
    const aplicado = parseFloat(balance.saldo_aplicado || 0);
    const disponible = parseFloat(balance.saldo_disponible || 0);
    
    // Validar que los valores no sean negativos
    if (total < 0) errors.push('Saldo total no puede ser negativo');
    if (retenido < 0) errors.push('Saldo retenido no puede ser negativo');
    if (aplicado < 0) errors.push('Saldo aplicado no puede ser negativo');
    if (disponible < 0) errors.push('Saldo disponible no puede ser negativo');
    
    // Validar la fórmula
    const calculatedDisponible = this.calculateAvailableBalance(balance);
    if (Math.abs(disponible - calculatedDisponible) > 0.01) {
      errors.push(`Fórmula incorrecta: esperado ${calculatedDisponible}, recibido ${disponible}`);
    }
    
    // Validar que retenido + aplicado no exceda total
    if ((retenido + aplicado) > total + 0.01) {
      errors.push('Suma de retenido y aplicado excede el total');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      calculated: {
        total,
        retenido,
        aplicado,
        disponible: calculatedDisponible
      }
    };
  }
  
  /**
   * Obtener estadísticas de balance para dashboard admin
   * @param {Array} allBalances - Array de balances de todos los usuarios
   * @returns {Object} - Estadísticas calculadas
   */
  static calculateBalanceStats(allBalances) {
    if (!Array.isArray(allBalances) || allBalances.length === 0) {
      return {
        totalUsers: 0,
        totalAmount: 0,
        totalRetained: 0,
        totalApplied: 0,
        totalAvailable: 0,
        averageBalance: 0
      };
    }
    
    const stats = allBalances.reduce((acc, balanceObj) => {
      // El balance viene dentro de un objeto con user y balance
      const balance = balanceObj.balance || balanceObj;
      
      acc.totalAmount += parseFloat(balance.saldo_total || 0);
      acc.totalRetained += parseFloat(balance.saldo_retenido || 0);
      acc.totalApplied += parseFloat(balance.saldo_aplicado || 0);
      acc.totalAvailable += parseFloat(balance.saldo_disponible || 0);
      return acc;
    }, {
      totalUsers: allBalances.length,
      totalAmount: 0,
      totalRetained: 0,
      totalApplied: 0,
      totalAvailable: 0
    });
    
    stats.averageBalance = allBalances.length > 0 ? stats.totalAmount / allBalances.length : 0;
    
    return stats;
  }
}

export default BalanceService;