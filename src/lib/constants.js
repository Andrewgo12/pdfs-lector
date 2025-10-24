// Configuración centralizada para procesamiento de PDFs
export const PDF_CONFIG = {
  MAX_RETRIES: 3,
  TIMEOUT_MS: 0, // 0 = sin límite de tiempo
  RETRY_DELAY_MS: 2000,
  MAX_FILE_SIZE: Infinity, // Sin límite de tamaño
  MIN_FILE_SIZE: 0, // Sin mínimo
  SUPPORTED_MIME_TYPES: ['application/pdf', 'application/x-pdf', '*'], // Acepta cualquier tipo
  PROGRESS_STEPS: {
    INIT: 5,
    VALIDATION: 10,
    UPLOAD: 30,
    PROCESSING: 70,
    FINALIZING: 90,
    COMPLETE: 100,
  },
  // Endpoints
  ENDPOINTS: {
    PING: '/api/ping',
    EXTRACT: '/api/pdf/extract',
  },
};
