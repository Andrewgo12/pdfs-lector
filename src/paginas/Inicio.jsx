import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileUp, Download, Loader2, LogIn, User, AlertCircle, X } from 'lucide-react';
import Navigation from '@/componentes/Navigation';
import VisorPDF from '@/componentes/VisorPDF';
import toast from '@/lib/toast';
import { useAuth } from '@/contexto/AuthContext';

export default function Inicio() {
  const navigate = useNavigate();
  const { user, isAuthenticated, puedeProcesar, logout } = useAuth();
  const [archivo, setArchivo] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const inputRef = useRef(null);

  const { puede, restantes, mensaje } = puedeProcesar();

  const manejarArrastre = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setArrastrando(e.type === 'dragenter' || e.type === 'dragover');
  };

  const manejarSoltar = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setArrastrando(false);

    const archivos = e.dataTransfer.files;
    if (archivos && archivos[0]?.type === 'application/pdf') {
      setArchivo(archivos[0]);
    }
  };

  const manejarSeleccion = (e) => {
    const archivos = e.target.files;
    if (archivos && archivos[0]?.type === 'application/pdf') {
      setArchivo(archivos[0]);
      toast.success('PDF cargado correctamente');
    } else if (archivos && archivos[0]) {
      toast.error('Solo se permiten archivos PDF');
    }
  };

  const extraerPDF = () => {
    if (!archivo) return;
    
    // Verificar límite de archivos gratis
    if (!puede) {
      toast.error('Has alcanzado el límite gratuito. Crea una cuenta para continuar.');
      return;
    }
    
    // Navegar a procesamiento
    navigate('/procesamiento', { state: { archivo } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-8 relative">
      <Navigation />
      
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600">
              <FileUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                PDFMaster Pro
              </h1>
              <p className="text-slate-600 dark:text-slate-400">Procesamiento Avanzado de PDFs</p>
            </div>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                  <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{user?.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
                >
                  Salir
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
              >
                <LogIn className="w-5 h-5" />
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Banner de límite de archivos (solo para usuarios no autenticados) */}
      {!isAuthenticated && (
        <div className="max-w-6xl mx-auto mb-8 relative z-10">
          <div className={`p-4 rounded-xl border-2 ${
            puede 
              ? 'bg-blue-50 border-blue-200' 
              : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-center gap-3">
              <AlertCircle className={`w-6 h-6 ${puede ? 'text-blue-600' : 'text-orange-600'}`} />
              <div className="flex-1">
                <p className={`font-semibold ${puede ? 'text-blue-900' : 'text-orange-900'}`}>
                  {mensaje}
                </p>
                <p className={`text-sm ${puede ? 'text-blue-700' : 'text-orange-700'}`}>
                  {puede 
                    ? 'Crea una cuenta gratuita para conversiones ilimitadas'
                    : 'Regístrate ahora para continuar usando PDFMaster Pro'}
                </p>
              </div>
              <Link
                to="/login"
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  puede
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-orange-600 text-white hover:bg-orange-700 animate-pulse'
                }`}
              >
                {puede ? 'Crear Cuenta' : 'Registrarme Ahora'}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto relative z-10">
        {!archivo ? (
          /* Zona de carga */
          <div
            onDragEnter={manejarArrastre}
            onDragLeave={manejarArrastre}
            onDragOver={manejarArrastre}
            onDrop={manejarSoltar}
            className={`border-2 border-dashed rounded-2xl p-20 text-center transition-all cursor-pointer ${
              arrastrando
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-105'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-400 dark:hover:border-purple-500'
            }`}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              onChange={manejarSeleccion}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-4">
              <div className="p-6 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <FileUp className="w-16 h-16 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Sube tu PDF
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-md">
                Arrastra y suelta tu archivo PDF aquí, o haz clic para seleccionar
              </p>
              <p className="text-sm text-slate-500">
                Hasta 500 páginas • 100 MB máximo
              </p>
            </div>
          </div>
        ) : (
          /* Previsualización del PDF */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel izquierdo - Visor PDF (2/3) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden" style={{ height: '700px' }}>
              <VisorPDF archivo={archivo} />
            </div>

            {/* Panel derecho - Información y acciones (1/3) */}
            <div className="space-y-6">
              {/* Información del archivo */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 break-words">
                      {archivo.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Tamaño: {(archivo.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => setArchivo(null)}
                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    title="Eliminar archivo"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 py-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span>PDF cargado correctamente</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Revisa la vista previa y presiona "Extraer" para comenzar el procesamiento.
                  </p>
                </div>
              </div>

              {/* Botón de extracción */}
              <button
                onClick={extraerPDF}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Extraer Contenido
              </button>

              {/* Info adicional */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 text-sm">
                  ¿Qué se extraerá?
                </h4>
                <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                  <li>✓ Texto completo del documento</li>
                  <li>✓ Metadatos (autor, título, fecha)</li>
                  <li>✓ Imágenes detectadas</li>
                  <li>✓ Tablas y links</li>
                  <li>✓ Formato profesional APA</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
