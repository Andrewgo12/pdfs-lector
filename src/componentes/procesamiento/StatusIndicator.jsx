import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function StatusIndicator({ estado, etapaActual, estaReintentando, reintentos, maxRetries }) {
  return (
    <div className="mt-4 space-y-2">
      {estado === 'procesando' && (
        <div className="flex items-center gap-3 text-purple-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-lg font-semibold">{etapaActual}</span>
        </div>
      )}

      {estado === 'completado' && (
        <div className="flex items-center gap-3 text-green-600 animate-bounce">
          <CheckCircle className="w-6 h-6" />
          <span className="text-lg font-semibold">¡Extracción completada!</span>
        </div>
      )}

      {estado === 'error' && (
        <div className="flex items-center gap-3 text-red-600">
          <XCircle className="w-6 h-6" />
          <span className="text-lg font-semibold">Error en la extracción</span>
        </div>
      )}

      {estaReintentando && (
        <div className="flex items-center gap-2 text-amber-600 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Reintentando ({reintentos}/{maxRetries})...</span>
        </div>
      )}
    </div>
  );
}
