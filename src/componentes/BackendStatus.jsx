import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { checkBackendHealth } from '@/lib/errorHandler';

export default function BackendStatus() {
  const [status, setStatus] = useState('checking'); // checking, online, offline
  const [lastCheck, setLastCheck] = useState(null);

  const checkStatus = async () => {
    const isOnline = await checkBackendHealth();
    setStatus(isOnline ? 'online' : 'offline');
    setLastCheck(new Date());
  };

  useEffect(() => {
    // Verificar al montar
    checkStatus();

    // Verificar cada 30 segundos
    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  if (status === 'online') {
    return null; // No mostrar nada si está online
  }

  if (status === 'checking') {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg flex items-center gap-3 max-w-sm z-50">
        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
        <div>
          <p className="text-sm font-medium text-yellow-900">
            Verificando conexión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <div className="flex items-start gap-3">
        <WifiOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-bold text-red-900 mb-1">
            ⚠️ Servidor Desconectado
          </p>
          <p className="text-xs text-red-700 mb-2">
            No se puede conectar al backend en http://localhost:8000
          </p>
          <div className="bg-red-100 rounded p-2 text-xs text-red-800 mb-2">
            <p className="font-medium mb-1">🔧 Solución:</p>
            <code className="block bg-red-200 px-2 py-1 rounded">
              cd backend && php artisan serve
            </code>
          </div>
          <button
            onClick={checkStatus}
            className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}
