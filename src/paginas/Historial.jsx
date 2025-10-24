import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, User, Trash2, Eye, Search, Loader2 } from 'lucide-react';
import Navigation from '@/componentes/Navigation';
import toast from '@/lib/toast';
import { useAuth } from '@/contexto/AuthContext';

export default function Historial() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [documentos, setDocumentos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para ver tu historial');
      navigate('/login');
      return;
    }
    cargarHistorial();
  }, [isAuthenticated, navigate]);

  const cargarHistorial = async () => {
    try {
      setCargando(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/api/pdf/historial', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar historial');
      }

      const data = await response.json();
      
      // Transformar datos del backend al formato esperado
      const documentosFormateados = (data.documentos || []).map(doc => ({
        id: doc.id,
        nombre: doc.nombre_original || doc.nombre,
        fecha: new Date(doc.created_at).toISOString().split('T')[0],
        paginas: doc.num_paginas || 0,
        autor: doc.ultima_extraccion?.metadata?.author || 'Desconocido',
        estado: 'Completado',
        tamano: doc.tamano,
        extraccionId: doc.ultima_extraccion?.id,
        textoExtraido: doc.ultima_extraccion?.texto_extraido,
        metadata: doc.ultima_extraccion?.metadata,
        stats: doc.ultima_extraccion?.stats,
      }));

      setDocumentos(documentosFormateados);
    } catch (error) {
      console.error('Error cargando historial:', error);
      toast.error('Error al cargar el historial');
      setDocumentos([]);
    } finally {
      setCargando(false);
    }
  };

  const documentosFiltrados = documentos.filter(doc =>
    doc.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const eliminarDocumento = async (id) => {
    if (!confirm('¿Eliminar este documento?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/api/pdf/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar documento');
      }

      setDocumentos(docs => docs.filter(d => d.id !== id));
      toast.success('Documento eliminado');
    } catch (error) {
      console.error('Error eliminando documento:', error);
      toast.error('Error al eliminar el documento');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-8">
      <Navigation />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl mb-2 font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Historial de Documentos
          </h1>
          <p className="text-slate-600">
            Documentos procesados recientemente
          </p>
        </header>

        {/* Búsqueda */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar documentos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Lista de documentos */}
        <div className="space-y-4">
          {cargando ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Loader2 className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-spin" />
              <p className="text-slate-600">Cargando documentos...</p>
            </div>
          ) : documentosFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">
                {documentos.length === 0 
                  ? 'No tienes documentos procesados aún' 
                  : 'No se encontraron documentos con ese criterio'}
              </p>
            </div>
          ) : (
            documentosFiltrados.map((doc, index) => (
              <div key={doc.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{doc.nombre}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(doc.fecha).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {doc.autor}
                        </span>
                        <span>{doc.paginas} páginas</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      doc.estado === 'Completado' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {doc.estado}
                    </span>

                    <button
                      onClick={() => navigate('/resultados', {
                        state: {
                          datos: {
                            text: doc.textoExtraido,
                            formatted_text: doc.textoExtraido,
                            numPages: doc.paginas,
                            metadata: doc.metadata,
                            stats: doc.stats,
                            images: doc.stats?.images || [],
                            tables: doc.stats?.tables || [],
                            links: doc.stats?.links || [],
                          },
                          archivo: {
                            name: doc.nombre,
                            size: doc.tamano,
                          },
                          documentoId: doc.id,
                          extraccionId: doc.extraccionId,
                        }
                      })}
                      className="p-2 hover:bg-slate-100 rounded-lg transition"
                      title="Ver detalles"
                    >
                      <Eye className="w-5 h-5 text-slate-600" />
                    </button>

                    <button
                      onClick={() => eliminarDocumento(doc.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Estadísticas */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <p className="text-3xl font-bold text-purple-600">{documentos.length}</p>
            <p className="text-slate-600 mt-2">Documentos procesados</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <p className="text-3xl font-bold text-pink-600">
              {documentos.reduce((sum, doc) => sum + doc.paginas, 0)}
            </p>
            <p className="text-slate-600 mt-2">Páginas totales</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <p className="text-3xl font-bold text-blue-600">
              {documentos.filter(d => d.estado === 'Completado').length}
            </p>
            <p className="text-slate-600 mt-2">Completados</p>
          </div>
        </div>
      </div>
    </div>
  );
}
