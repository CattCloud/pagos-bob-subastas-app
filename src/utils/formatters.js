/**
 * Utilidades de formato para BOB Subastas
 */

/**
 * Formatear cantidad como moneda USD
 * @param {number|string} amount - Cantidad a formatear
 * @param {Object} options - Opciones de formato
 * @returns {string} - Cantidad formateada
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    currency = 'USD',
    locale = 'en-US',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSymbol = true,
    compact = false
  } = options;
  
  const numAmount = parseFloat(amount) || 0;
  
  if (compact && numAmount >= 1000) {
    return formatCompactCurrency(numAmount, options);
  }
  
  const formatter = new Intl.NumberFormat(locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: showSymbol ? currency : undefined,
    minimumFractionDigits,
    maximumFractionDigits,
  });
  
  return formatter.format(numAmount);
};

/**
 * Formatear moneda en formato compacto (1K, 1M, etc.)
 * @param {number} amount - Cantidad a formatear
 * @param {Object} options - Opciones de formato
 * @returns {string} - Cantidad formateada en formato compacto
 */
export const formatCompactCurrency = (amount, options = {}) => {
  const { currency = 'USD', showSymbol = true } = options;
  const numAmount = parseFloat(amount) || 0;
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: showSymbol ? currency : undefined,
    notation: 'compact',
    maximumFractionDigits: 1,
  });
  
  return formatter.format(numAmount);
};

/**
 * Formatear solo el número sin símbolo de moneda
 * @param {number|string} amount - Cantidad a formatear
 * @param {number} decimals - Número de decimales
 * @returns {string} - Número formateado
 */
export const formatNumber = (amount, decimals = 2) => {
  const numAmount = parseFloat(amount) || 0;
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numAmount);
};

/**
 * Formatear porcentaje
 * @param {number} value - Valor entre 0-100
 * @param {number} decimals - Número de decimales
 * @returns {string} - Porcentaje formateado
 */
export const formatPercentage = (value, decimals = 1) => {
  const numValue = parseFloat(value) || 0;
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue / 100);
};

/**
 * Formatear fecha relativa (hace 2 horas, ayer, etc.)
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Fecha relativa formateada
 */
export const formatRelativeDate = (date) => {
  if (!date) return 'Fecha no disponible';
  
  const dateObj = new Date(date);
  const now = new Date();
  const diffMs = now - dateObj;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 1) return 'Ahora mismo';
  if (diffMinutes < 60) return `Hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  
  // Para fechas más antiguas, mostrar fecha formateada
  return dateObj.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Formatear fecha completa
 * @param {string|Date} date - Fecha a formatear
 * @param {Object} options - Opciones de formato
 * @returns {string} - Fecha formateada
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'Fecha no disponible';
  
  const {
    includeTime = false,
    locale = 'es-PE',
    dateStyle = 'medium',
    timeStyle = 'short'
  } = options;
  
  const dateObj = new Date(date);
  
  if (includeTime) {
    return dateObj.toLocaleString(locale, {
      dateStyle,
      timeStyle
    });
  } else {
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
};

/**
 * Validar y formatear monto de entrada
 * @param {string} value - Valor ingresado por el usuario
 * @param {number} maxDecimals - Máximo número de decimales permitidos
 * @returns {Object} - Objeto con valor formateado y validación
 */
export const validateAndFormatAmount = (value, maxDecimals = 2) => {
  if (!value || value === '') {
    return { value: '', isValid: true, error: null };
  }
  
  // Remover caracteres no numéricos excepto punto decimal
  const cleanValue = value.replace(/[^0-9.]/g, '');
  
  // Verificar que no tenga múltiples puntos
  const dotCount = (cleanValue.match(/\./g) || []).length;
  if (dotCount > 1) {
    return { value: cleanValue.slice(0, -1), isValid: false, error: 'Formato inválido' };
  }
  
  // Verificar decimales
  const parts = cleanValue.split('.');
  if (parts[1] && parts[1].length > maxDecimals) {
    const truncated = parts[0] + '.' + parts[1].substring(0, maxDecimals);
    return { value: truncated, isValid: true, error: null };
  }
  
  // Verificar límite máximo (999,999.99 según reglas de negocio)
  const numValue = parseFloat(cleanValue);
  if (numValue > 999999.99) {
    return { value: '999999.99', isValid: false, error: 'Monto máximo: $999,999.99' };
  }
  
  return { value: cleanValue, isValid: true, error: null };
};

/**
 * Calcular garantía (8% según RN02)
 * @param {number|string} offerAmount - Monto de la oferta
 * @returns {number} - Monto de garantía calculado
 */
export const calculateGuaranteeAmount = (offerAmount) => {
  const amount = parseFloat(offerAmount) || 0;
  return Math.round(amount * 0.08 * 100) / 100; // 8% con redondeo a 2 decimales
};

/**
 * Formatear estado de saldo con color
 * @param {number} amount - Cantidad
 * @returns {Object} - Clase CSS y texto para el estado
 */
export const getBalanceStatusStyle = (amount) => {
  const numAmount = parseFloat(amount) || 0;
  
  if (numAmount > 0) {
    return {
      textClass: 'text-success',
      bgClass: 'bg-success/10',
      borderClass: 'border-success/20',
      status: 'positive'
    };
  } else if (numAmount === 0) {
    return {
      textClass: 'text-text-secondary',
      bgClass: 'bg-bg-tertiary',
      borderClass: 'border-border',
      status: 'neutral'
    };
  } else {
    return {
      textClass: 'text-error',
      bgClass: 'bg-error/10',
      borderClass: 'border-error/20',
      status: 'negative'
    };
  }
};

/**
 * Truncar texto con ellipsis
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} - Texto truncado
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};