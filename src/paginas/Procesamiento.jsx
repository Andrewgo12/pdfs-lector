import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, FileText, RefreshCw, AlertTriangle, Clock, ArrowLeft } from 'lucide-react';
import Navigation from '@/componentes/Navigation';
import VisorPDF from '@/componentes/VisorPDF';
import BarraProgreso from '@/componentes/BarraProgreso';
import toast from '@/lib/toast';
import { useAuth } from '@/contexto/AuthContext';
import { usePdfProcessingLite } from '@/hooks/usePdfProcessingLite';
import ProgressPanel from '@/componentes/procesamiento/ProgressPanel';
import StatusIndicator from '@/componentes/procesamiento/StatusIndicator';
import ErrorPanel from '@/componentes/procesamiento/ErrorPanel';
import StatsPanel from '@/componentes/procesamiento/StatsPanel';

export default function Procesamiento() {
  const location = useLocation();
  const navigate = useNavigate();
  const { incrementarArchivosGratis } = useAuth();
  const archivo = location.state?.archivo;
  const iniciadoRef = useRef(false); // Bandera para evitar doble inicio
  
  const {
    CONFIG,
    progreso,
    estado,
    datos,
    error,
    etapaActual,
    iniciar,
    reintentar,
  } = usePdfProcessingLite({
    archivo,
    onSuccess: (resultado) => {
      setTimeout(() => {
        navigate('/resultados', {
          state: {
            datos: resultado,
            archivo: {
              name: archivo.name,
              size: archivo.size,
              type: archivo.type,
            },
            documentoId: resultado.documento_id, // ID del documento
            extraccionId: resultado.extraccion_id, // ID de la extracción para exportación
          },
        });
      }, 800);
    },
  });

  // Placeholders para props opcionales de UI
  const tiempoTranscurrido = 0;
  const reintentos = 0;
  const estaReintentando = false;

  // Validar y redirigir si no hay archivo
  useEffect(() => {
    if (!archivo && !iniciadoRef.current) {
      toast.error('No se proporcionó ningún archivo');
      navigate('/', { replace: true });
    }
  }, [archivo, navigate]);

  // Iniciar procesamiento una sola vez cuando archivo esté disponible
  useEffect(() => {
    if (archivo && !iniciadoRef.current) {
      iniciadoRef.current = true;
      console.log('[Procesamiento] Iniciando extracción...', archivo.name);
      iniciar();
    }
    // NO hay cleanup aquí - el hook maneja su propio cleanup
  }, [archivo, iniciar]); // Solo depende de archivo e iniciar

  if (!archivo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-8">
      <Navigation />

      <div className="max-w-7xl mx-auto mt-8">
        {/* Header con botón de volver */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 hover:bg-white rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al inicio
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel izquierdo - Visor PDF */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-purple-600" />
              Vista Previa del PDF
            </h2>
            <VisorPDF archivo={archivo} />
          </div>

          {/* Panel derecho - Estado del procesamiento */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Procesamiento del Documento
              </h2>
              {/* Progreso y estado */}
              <ProgressPanel progreso={progreso} etapaActual={etapaActual} tiempoTranscurrido={tiempoTranscurrido} />
              <StatusIndicator
                estado={estado}
                etapaActual={etapaActual}
                estaReintentando={estaReintentando}
                reintentos={reintentos}
                maxRetries={CONFIG.MAX_RETRIES}
              />

              {/* Detalles del archivo */}
              <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                <h3 className="font-semibold text-slate-700 mb-2">
                  Información del archivo:
                </h3>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li><strong>Nombre:</strong> {archivo.name}</li>
                  <li><strong>Tamaño:</strong> {(archivo.size / 1024 / 1024).toFixed(2)} MB</li>
                  {datos && (
                    <>
                      <li><strong>Páginas:</strong> {datos.numPages}</li>
                      <li><strong>Caracteres extraídos:</strong> {datos.stats?.textLength || 0}</li>
                      <li><strong>Imágenes:</strong> {datos.stats?.imagesCount || 0}</li>
                      <li><strong>Tablas:</strong> {datos.stats?.tablesCount || 0}</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Mensaje de error mejorado */}
              <ErrorPanel error={error} onRetry={reintentar} onBack={() => navigate('/')} />
            </div>

            {/* Información adicional */}
            {estado === 'procesando' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 mt-0.5 animate-spin flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium mb-1">
                      {etapaActual}
                    </p>
                    <p className="text-xs text-blue-700">
                      Estamos extrayendo el texto, imágenes y tablas de tu documento. 
                      Esto puede tomar hasta 2 minutos dependiendo del tamaño del archivo.
                    </p>
                  </div>
                </div>
                
                {tiempoTranscurrido > 60 && (
                  <div className="text-xs text-blue-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Documentos grandes pueden tardar más tiempo...</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Estadísticas en tiempo real */}
            {estado === 'procesando' && tiempoTranscurrido > 0 && (
              <StatsPanel tiempoTranscurrido={tiempoTranscurrido} progreso={progreso} reintentos={reintentos} maxRetries={CONFIG.MAX_RETRIES} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
