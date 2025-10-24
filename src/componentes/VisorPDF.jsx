import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Silenciar warnings de PDF.js
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.('TT: undefined function')) return;
  originalWarn.apply(console, args);
};

export default function VisorPDF({ archivo, onNumeroPaginas }) {
  const [numPaginas, setNumPaginas] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [escala, setEscala] = useState(1.0);
  const [cargando, setCargando] = useState(true);

  const alCargarDocumento = ({ numPages }) => {
    setNumPaginas(numPages);
    if (onNumeroPaginas) onNumeroPaginas(numPages);
    setCargando(false);
  };

  if (!archivo) return null;

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-xl overflow-hidden">
      {/* Controles */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
            disabled={paginaActual <= 1}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="text-sm font-medium min-w-[120px] text-center">
            Página {paginaActual} de {numPaginas || '...'}
          </span>
          
          <button
            onClick={() => setPaginaActual(Math.min(numPaginas, paginaActual + 1))}
            disabled={paginaActual >= numPaginas}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEscala(Math.max(0.5, escala - 0.1))}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(escala * 100)}%
          </span>
          
          <button
            onClick={() => setEscala(Math.min(2.0, escala + 0.1))}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <button
            onClick={() => setEscala(1.0)}
            className="p-2 rounded-lg hover:bg-slate-100"
            title="Ajustar"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Visor PDF */}
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-100">
        <div className="bg-white shadow-2xl rounded-sm">
          <Document
            file={archivo}
            onLoadSuccess={alCargarDocumento}
            loading={
              <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            }
            error={
              <div className="p-20 text-center">
                <p className="text-red-600 font-semibold">Error al cargar PDF</p>
              </div>
            }
          >
            <Page
              pageNumber={paginaActual}
              scale={escala}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              loading={
                <div className="flex items-center justify-center p-20 bg-white">
                  <div className="animate-pulse text-slate-400">Cargando página...</div>
                </div>
              }
            />
          </Document>
        </div>
      </div>

      {/* Input de página */}
      <div className="p-3 bg-white border-t flex items-center justify-center gap-2">
        <label className="text-sm text-slate-600">Ir a:</label>
        <input
          type="number"
          min={1}
          max={numPaginas}
          value={paginaActual}
          onChange={(e) => {
            const pagina = parseInt(e.target.value);
            if (pagina >= 1 && pagina <= numPaginas) {
              setPaginaActual(pagina);
            }
          }}
          className="w-20 px-3 py-1 border border-slate-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
    </div>
  );
}
