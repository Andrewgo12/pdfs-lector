// Normalización de errores para mostrar mensajes consistentes en UI

export class PDFProcessingError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'PDFProcessingError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export function fromHttpResponse(res) {
  const bodyText = res?.text || '';
  let serverMessage = res?.json?.error || res?.json?.message;
  // Si el body es HTML (404 de Laravel), no mostrarlo en bruto
  const isHtml = bodyText.trim().startsWith('<!DOCTYPE') || bodyText.trim().startsWith('<html');
  const details = {
    status: res?.status,
    body: isHtml ? 'HTML response (omitted)' : bodyText,
    json: res?.json,
  };

  if (res?.status === 404) {
    return new PDFProcessingError('Endpoint no encontrado (404). Verifica el proxy de Vite y que Laravel esté corriendo.', 'HTTP_404', details);
  }
  if (res?.status === 413) {
    return new PDFProcessingError('El archivo es demasiado grande para el servidor (413).', 'HTTP_413', details);
  }
  if (res?.status === 422) {
    return new PDFProcessingError('Validación fallida en el servidor (422). Revisa tipo/tamaño.', 'HTTP_422', details);
  }
  if (res?.status >= 500) {
    return new PDFProcessingError('Error interno en el servidor (500). Revisa logs de Laravel.', 'HTTP_500', details);
  }
  return new PDFProcessingError(`Error HTTP ${res?.status}: ${res?.statusText}`, 'HTTP_ERROR', details);
}

export function fromTimeout(ms) {
  return new PDFProcessingError(`La operación excedió el tiempo límite (${Math.round(ms / 1000)}s).`, 'TIMEOUT', { timeout: ms });
}

export function fromAbort() {
  return new PDFProcessingError('La operación fue cancelada', 'ABORTED');
}

export function fromUnknown(err) {
  return new PDFProcessingError(err?.message || 'Error inesperado', 'UNKNOWN_ERROR', { originalError: String(err) });
}
