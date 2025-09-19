// Tipos de documento según DocumentacionAPI.md
export const DOCUMENT_TYPES = [
  { value: 'DNI', label: 'DNI - Documento Nacional de Identidad' },
  { value: 'CE', label: 'CE - Cédula de Extranjería' }, 
  { value: 'RUC', label: 'RUC - Registro Único de Contribuyentes' },
  { value: 'Pasaporte', label: 'Pasaporte' }
];

// Validaciones por tipo de documento
export const DOCUMENT_VALIDATIONS = {
  DNI: {
    length: 8,
    pattern: /^\d{8}$/,
    message: 'DNI debe tener exactamente 8 dígitos'
  },
  CE: {
    length: 9,
    pattern: /^\d{9}$/,
    message: 'Cédula de Extranjería debe tener exactamente 9 dígitos'
  },
  RUC: {
    length: 11,
    pattern: /^\d{11}$/,
    message: 'RUC debe tener exactamente 11 dígitos'
  },
  Pasaporte: {
    minLength: 6,
    maxLength: 12,
    pattern: /^[A-Za-z0-9]{6,12}$/,
    message: 'Pasaporte debe tener entre 6 y 12 caracteres alfanuméricos'
  }
};

// Función para validar número de documento
export const validateDocumentNumber = (documentType, documentNumber) => {
  if (!documentType || !documentNumber) {
    return 'Tipo y número de documento son requeridos';
  }
  
  const validation = DOCUMENT_VALIDATIONS[documentType];
  if (!validation) {
    return 'Tipo de documento no válido';
  }
  
  const trimmedNumber = documentNumber.trim();
  
  if (!validation.pattern.test(trimmedNumber)) {
    return validation.message;
  }
  
  return null; // No hay errores
};