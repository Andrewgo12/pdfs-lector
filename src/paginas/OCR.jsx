import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Languages, Loader2, Download } from 'lucide-react';
import Navigation from '@/componentes/Navigation';
import toast from '@/lib/toast';

export default function OCR() {
  const navigate = useNavigate();
  const [archivo, setArchivo] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [idiomas, setIdiomas] = useState('eng+spa');

  const procesarOCR = async () => {
    if (!archivo) return;

    try {
      setProcesando(true);
      toast.info('Procesando OCR... Esto puede tardar varios minutos');

      const formData = new FormData();
      formData.append('file', archivo);
      formData.append('languages', idiomas);

      const response = await fetch('/api/pdf/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Error en OCR');

      const data = await response.json();
      setResultado(data);
      toast.success('OCR completado exitosamente');
    } catch (error) {
      toast.error('Error: ' + error.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-8 relative">
      <Navigation />

      <div className="max-w-4xl mx-auto relative z-10">
        <header className="mb-8">
          <h1 className="text-3xl mb-2 font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            OCR - Reconocimiento Óptico
          </h1>
          <p className="text-slate-600">
            Extrae texto de PDFs escaneados o imágenes
          </p>
        </header>

        <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Selector de archivo */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Seleccionar PDF
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setArchivo(e.target.files[0])}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Selector de idiomas */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Idiomas
              </label>
              <select
                value={idiomas}
                onChange={(e) => setIdiomas(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="eng">Inglés</option>
                <option value="spa">Español</option>
                <option value="eng+spa">Inglés + Español</option>
                <option value="fra">Francés</option>
                <option value="deu">Alemán</option>
              </select>
            </div>

            {/* Botón */}
            <button
              onClick={procesarOCR}
              disabled={!archivo || procesando}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {procesando ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando OCR (puede tardar varios minutos)...
                </>
              ) : (
                <>
                  <Languages className="w-5 h-5" />
                  Procesar con OCR
                </>
              )}
            </button>

            {/* Resultados */}
            {resultado && (
              <div className="mt-6 p-6 bg-slate-50 rounded-xl">
                <h3 className="font-bold text-lg mb-3">Resultados OCR</h3>
                <div className="space-y-2 text-sm mb-4">
                  <p><strong>Páginas procesadas:</strong> {resultado.paginasProcesadas} de {resultado.totalPaginas}</p>
                  <p><strong>Confianza:</strong> {resultado.confianza?.toFixed(2)}%</p>
                  <p><strong>Idiomas:</strong> {resultado.idiomas?.join(', ')}</p>
                </div>

                <div className="max-h-96 overflow-auto bg-white rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm">
                    {resultado.texto}
                  </pre>
                </div>

                <button
                  onClick={() => navigate('/editor', { state: { datos: { text: resultado.texto, numPages: resultado.totalPaginas } } })}
                  className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Ir al Editor
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
