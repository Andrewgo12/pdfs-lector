import { useState, useCallback } from 'react';
import { PDF_CONFIG } from '@/lib/constants';
import { extractPdf } from '@/lib/pdf-api';
import { PDFProcessingError, fromHttpResponse, fromUnknown } from '@/lib/errors';
import toast from '@/lib/toast';

export function usePdfProcessingLite({ archivo, onSuccess }) {
  const [estado, setEstado] = useState('idle'); // idle | procesando | completado | error
  const [progreso, setProgreso] = useState(0);
  const [etapaActual, setEtapaActual] = useState('');
  const [error, setError] = useState(null);
  const [datos, setDatos] = useState(null);

  const iniciar = useCallback(async () => {
    try {
      if (!archivo) {
        throw new PDFProcessingError('No se proporcionó archivo', 'NO_FILE');
      }

      setEstado('procesando');
      setProgreso(PDF_CONFIG.PROGRESS_STEPS.INIT);
      setEtapaActual('Validando archivo...');

      // FormData
      setProgreso(PDF_CONFIG.PROGRESS_STEPS.VALIDATION);
      setEtapaActual('Preparando archivo...');
      const formData = new FormData();
      formData.append('file', archivo);
      formData.append('filename', archivo.name);

      // Enviar (estrategia A: extractor básico)
      setProgreso(PDF_CONFIG.PROGRESS_STEPS.UPLOAD);
      setEtapaActual('Subiendo archivo al servidor...');
      let response = await extractPdf(archivo, { filename: archivo.name });

      setProgreso(PDF_CONFIG.PROGRESS_STEPS.PROCESSING);
      setEtapaActual('Procesando PDF...');

      // Si falla, lanzar error
      if (!response.ok) {
        throw fromHttpResponse(response);
      }

      const resultado = response.json;
      if (!resultado?.success) {
        throw new PDFProcessingError(resultado?.error || 'Error desconocido', 'SERVER_ERROR');
      }

      setProgreso(PDF_CONFIG.PROGRESS_STEPS.FINALIZING);
      setEtapaActual('Finalizando...');

      setDatos(resultado);
      setEstado('completado');
      setProgreso(PDF_CONFIG.PROGRESS_STEPS.COMPLETE);
      setEtapaActual('¡Completado!');
      toast.success('¡Extracción completada!');

      onSuccess?.(resultado);
    } catch (err) {
      const finalErr = err instanceof PDFProcessingError ? err : fromUnknown(err);
      setError(finalErr);
      setEstado('error');
      setEtapaActual('Error en la extracción');
      toast.error(finalErr.message || 'Error al procesar el archivo');
    }
  }, [archivo, onSuccess]);

  const reintentar = useCallback(() => {
    setEstado('idle');
    setProgreso(0);
    setEtapaActual('');
    setError(null);
    setDatos(null);
    iniciar();
  }, [iniciar]);

  return {
    CONFIG: PDF_CONFIG,
    estado,
    progreso,
    etapaActual,
    error,
    datos,
    iniciar,
    reintentar,
  };
}
