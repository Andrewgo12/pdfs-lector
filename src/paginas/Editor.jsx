import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Save, Download, FileSignature, ArrowLeft } from 'lucide-react';
import EditorTexto from '@/componentes/EditorTexto';
import ModalFirma from '@/componentes/ModalFirma';
import toast from '@/lib/toast';
import { apiFetch } from '@/lib/api';

export default function Editor() {
  const location = useLocation();
  const navigate = useNavigate();
  const datos = location.state?.datos;
  const archivo = location.state?.archivo;
  const documentoId = location.state?.documentoId;

  const [contenido, setContenido] = useState(datos?.text || '');
  const [modalFirmaAbierto, setModalFirmaAbierto] = useState(false);
  const [firma, setFirma] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [firmando, setFirmando] = useState(false);

  if (!datos) {
    navigate('/');
    return null;
  }

  const guardarCambios = async () => {
    if (!documentoId) {
      toast.error('No se puede guardar: falta ID del documento');
      return;
    }

    setGuardando(true);
    try {
      toast.info('Guardando cambios...');
      
      const response = await apiFetch(`/api/pdf/${documentoId}/update-content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contenido }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar');
      }

      toast.success('Cambios guardados exitosamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar cambios: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const exportarDOCX = async () => {
    if (!documentoId) {
      toast.error('No se puede exportar: falta ID del documento');
      return;
    }

    setExportando(true);
    try {
      const response = await apiFetch('/api/pdf/export/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documento_id: documentoId,
          title: datos.metadata?.title || 'Documento',
          content: contenido,
          metadata: datos.metadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al exportar');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${datos.metadata?.title || 'documento'}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Documento exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al exportar: ' + error.message);
    } finally {
      setExportando(false);
    }
  };

  const manejarFirma = async (datosFirma) => {
    if (!documentoId) {
      toast.error('No se puede firmar: falta ID del documento');
      return;
    }

    setFirma(datosFirma);
    setFirmando(true);
    
    try {
      toast.info('Aplicando firma al documento...');
      
      const formData = new FormData();
      formData.append('documento_id', documentoId);
      formData.append('firmaBase64', datosFirma.imagen);
      formData.append('nombre', datosFirma.nombre);
      formData.append('x', '50');
      formData.append('y', '100');

      const response = await apiFetch('/api/pdf/sign', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al firmar documento');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${datos.metadata?.title || 'documento'}_firmado.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF firmado descargado exitosamente');
    } catch (error) {
      console.error('Error al firmar:', error);
      toast.error('Error al aplicar firma: ' + error.message);
    } finally {
      setFirmando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl mb-2 font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Editor de Documento
            </h1>
            <p className="text-slate-600">
              {archivo?.name || 'Documento'} • Editando
            </p>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 hover:bg-white rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
        </header>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 flex items-center gap-4 flex-wrap">
          <button
            onClick={guardarCambios}
            disabled={guardando}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
          >
            <Save className="w-5 h-5" />
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>

          <button
            onClick={exportarDOCX}
            disabled={exportando}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
          >
            <Download className="w-5 h-5" />
            {exportando ? 'Exportando...' : 'Exportar DOCX'}
          </button>

          <button
            onClick={() => setModalFirmaAbierto(true)}
            disabled={firmando}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
          >
            <FileSignature className="w-5 h-5" />
            {firmando ? 'Firmando...' : 'Firmar Documento'}
          </button>

          {firma && (
            <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <FileSignature className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">
                Firmado por: {firma.nombre}
              </span>
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ height: '600px' }}>
          <EditorTexto
            contenidoInicial={contenido}
            onChange={setContenido}
          />
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Puedes usar el toolbar para dar formato al texto,
            agregar listas y títulos. Los cambios se guardan automáticamente.
          </p>
        </div>
      </div>

      {/* Modal de Firma */}
      <ModalFirma
        abierto={modalFirmaAbierto}
        onCerrar={() => setModalFirmaAbierto(false)}
        onGuardar={manejarFirma}
      />
    </div>
  );
}
