import { AlertTriangle, RefreshCw, Server, Terminal } from 'lucide-react';

export default function ErrorPanel({ error, onRetry, onBack }) {
  if (!error) return null;

  const isBackendOffline = error?.code === 'BACKEND_OFFLINE';
  const isUnprocessable = error?.code === 'HTTP_422';

  return (
    <div className="mt-4 p-6 bg-red-50 border-2 border-red-200 rounded-xl space-y-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-red-800 mb-1">Error al procesar el archivo</h4>
          <p className="text-red-700 text-sm">{error.message || String(error)}</p>
          {error.code && (
            <p className="text-red-600 text-xs mt-2 font-mono">Código: {error.code}</p>
          )}
          {isUnprocessable && (
            <div className="mt-3 p-4 bg-amber-50 border border-amber-300 rounded-lg">
              <p className="text-amber-800 text-sm">
                El documento no pudo ser procesado con el extractor básico. 
                Puede ser un PDF escaneado o con formato complejo.
              </p>
              <a
                href="/ocr"
                className="inline-block mt-3 px-3 py-2 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 transition"
              >
                Probar OCR avanzado
              </a>
            </div>
          )}
          
          {/* Instrucciones específicas para backend offline */}
          {isBackendOffline && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-300 rounded-lg">
              <div className="flex items-start gap-2 mb-3">
                <Server className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800 text-sm">Servidor Backend no disponible</p>
                  <p className="text-amber-700 text-xs mt-1">
                    El servidor Laravel no está respondiendo. Por favor, inicia el backend:
                  </p>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Terminal className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-xs font-mono">Terminal:</span>
                </div>
                <code className="text-white text-xs font-mono block">
                  <div>cd backend</div>
                  <div className="mt-1">php artisan serve</div>
                </code>
              </div>
              
              <p className="text-amber-600 text-xs mt-3">
                📍 El backend debe estar corriendo en <code className="bg-amber-100 px-1 rounded">http://localhost:8000</code>
              </p>
            </div>
          )}
          
          {error.details && Object.keys(error.details).length > 0 && !isBackendOffline && (
            <details className="mt-3 text-xs text-red-600">
              <summary className="cursor-pointer hover:text-red-700 font-medium">Detalles técnicos</summary>
              <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto max-h-40">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
