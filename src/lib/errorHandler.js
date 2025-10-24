import toast from './toast';

/**
 * Manejar errores de API de forma centralizada
 */
export class APIError extends Error {
  constructor(message, status, code, details = {}) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Analizar y clasificar errores de red/API
 */
export function parseError(error, response = null) {
  // Error de red (servidor caído, sin internet)
  if (!response || error.message === 'Failed to fetch' || error.name === 'TypeError') {
    return new APIError(
      'No se puede conectar al servidor',
      0,
      'NETWORK_ERROR',
      {
        suggestion: '¿Está ejecutándose el backend en http://localhost:8000?',
        action: 'Verifica que el servidor esté corriendo: php artisan serve'
      }
    );
  }
  
  // Timeout
  if (error.name === 'AbortError') {
    return new APIError(
      'La solicitud tardó demasiado',
      408,
      'TIMEOUT',
      {
        suggestion: 'El archivo puede ser muy grande o el servidor está ocupado',
        action: 'Intenta con un PDF más pequeño'
      }
    );
  }
  
  // Rate limiting
  if (response?.status === 429) {
    const retryAfter = response.headers.get('X-RateLimit-Remaining') || 'unos minutos';
    return new APIError(
      'Demasiadas solicitudes',
      429,
      'RATE_LIMITED',
      {
        suggestion: `Espera ${retryAfter} antes de intentar de nuevo`,
        action: 'Reduce la frecuencia de procesamiento'
      }
    );
  }
  
  // Unauthorized
  if (response?.status === 401) {
    return new APIError(
      'Sesión expirada',
      401,
      'UNAUTHORIZED',
      {
        suggestion: 'Tu sesión ha caducado',
        action: 'Inicia sesión nuevamente'
      }
    );
  }
  
  // Forbidden
  if (response?.status === 403) {
    return new APIError(
      'Sin permisos',
      403,
      'FORBIDDEN',
      {
        suggestion: 'No tienes permiso para realizar esta acción',
        action: 'Contacta al administrador'
      }
    );
  }
  
  // Not Found
  if (response?.status === 404) {
    return new APIError(
      'Recurso no encontrado',
      404,
      'NOT_FOUND',
      {
        suggestion: 'El documento o endpoint no existe',
        action: 'Verifica la URL o recarga la página'
      }
    );
  }
  
  // Payload too large
  if (response?.status === 413) {
    return new APIError(
      'Archivo demasiado grande',
      413,
      'FILE_TOO_LARGE',
      {
        suggestion: 'El archivo supera el límite de 100MB',
        action: 'Usa un PDF más pequeño'
      }
    );
  }
  
  // Unprocessable entity
  if (response?.status === 422) {
    return new APIError(
      'Datos inválidos',
      422,
      'VALIDATION_ERROR',
      {
        suggestion: 'El archivo no es un PDF válido',
        action: 'Verifica que sea un archivo PDF real'
      }
    );
  }
  
  // Server error
  if (response?.status >= 500) {
    return new APIError(
      'Error del servidor',
      response.status,
      'SERVER_ERROR',
      {
        suggestion: 'Hubo un problema en el servidor',
        action: 'Intenta de nuevo en unos minutos o contacta soporte'
      }
    );
  }
  
  // Generic error
  return new APIError(
    error.message || 'Error desconocido',
    response?.status || 500,
    'UNKNOWN_ERROR',
    {
      suggestion: 'Ocurrió un error inesperado',
      action: 'Intenta recargar la página'
    }
  );
}

/**
 * Mostrar error con toast mejorado
 */
export function showError(error) {
  if (error instanceof APIError) {
    // Error estructurado
    const message = `
      ❌ ${error.message}
      
      💡 ${error.details.suggestion}
      
      🔧 ${error.details.action}
    `.trim();
    
    toast.error(message, { duration: 6000 });
    
    // Log para debugging
    console.error('[API Error]', {
      status: error.status,
      code: error.code,
      message: error.message,
      details: error.details
    });
  } else {
    // Error genérico
    toast.error(error.message || 'Error desconocido');
    console.error('[Error]', error);
  }
}

/**
 * Wrapper para fetch con manejo de errores mejorado
 */
export async function apiFetch(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 120000); // 2 minutos
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      }
    });
    
    clearTimeout(timeoutId);
    
    // Si la respuesta no es OK, parsear el error
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      
      throw parseError(
        new Error(errorData.error || errorData.message || 'Error en la solicitud'),
        response
      );
    }
    
    return response;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Si ya es un APIError, re-lanzarlo
    if (error instanceof APIError) {
      throw error;
    }
    
    // Parsear y lanzar
    throw parseError(error);
  }
}

/**
 * Retry automático para errores transitorios
 */
export async function retryableFetch(url, options = {}, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiFetch(url, options);
    } catch (error) {
      lastError = error;
      
      // Solo reintentar en errores de red o servidor
      if (error.code === 'NETWORK_ERROR' || error.status >= 500) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff
        console.log(`Reintentando en ${delay}ms... (intento ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Para otros errores, lanzar inmediatamente
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * Validar conectividad del backend
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch('http://localhost:8000/api/health', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    return response.ok;
  } catch {
    return false;
  }
}
