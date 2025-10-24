import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Image, Download, Edit, Sparkles, FileDown, Link as LinkIcon, Table, ImageIcon, ArrowLeft, FileSpreadsheet, Info, Calendar, User as UserIcon, Hash, Layers } from 'lucide-react';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import toast from '@/lib/toast';

export default function Resultados() {
  const location = useLocation();
  const navigate = useNavigate();
  const datos = location.state?.datos;
  const archivo = location.state?.archivo;
  const documentoId = location.state?.documentoId;
  const extraccionId = location.state?.extraccionId; // ID para exportaciones
  const [exportando, setExportando] = useState(false);
  const [mostrarFormato, setMostrarFormato] = useState(false);

  if (!datos) {
    navigate('/');
    return null;
  }

  const irAEditor = () => {
    navigate('/editor', { 
      state: { 
        datos, 
        archivo,
        documentoId // Pasar ID para funciones del editor
      } 
    });
  };

  const exportarDocumento = async (formato) => {
    if (!extraccionId) {
      toast.error('No se puede exportar: falta ID de la extracción');
      return;
    }

    setExportando(true);
    try {
      const endpoint = formato === 'txt' 
        ? `/api/pdf/export/txt/${extraccionId}`
        : `/api/pdf/export/md/${extraccionId}`;
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const url = `${API_BASE_URL}${endpoint}`;
      
      // Fetch directo para obtener el blob
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': formato === 'txt' ? 'text/plain' : 'text/markdown',
        },
      });

      if (!response.ok) {
        throw new Error(`Error al exportar: ${response.status}`);
      }

      // Obtener el blob del archivo completo
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${archivo?.name?.replace('.pdf', '') || 'documento'}_APA.${formato}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);

      toast.success(`✅ Documento completo exportado en formato ${formato.toUpperCase()} con normas APA`);
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error(`Error al exportar: ${error.message}`);
    } finally {
      setExportando(false);
    }
  };

  // Función auxiliar para analizar el contenido del PDF
  const analizarContenido = (texto) => {
    const lineas = texto.split('\n');
    const analisis = {
      objetivos: [],
      metodologia: [],
      conclusiones: [],
      referencias: [],
      palabrasClave: [],
      seccionesImportantes: []
    };
    
    let enSeccion = null;
    const textoLower = texto.toLowerCase();
    
    // Detectar objetivos
    const regexObjetivos = /(objetivo[s]?|purpose|aim[s]?)[:]/gi;
    lineas.forEach((linea, idx) => {
      if (regexObjetivos.test(linea)) {
        // Capturar las siguientes 3-5 líneas
        const siguientes = lineas.slice(idx, idx + 5).join(' ').trim();
        if (siguientes) analisis.objetivos.push(siguientes);
      }
    });
    
    // Detectar metodología
    const regexMetodo = /(m[ée]todo[s]?|metodolog[íi]a|method[s]?|approach)[:]/gi;
    lineas.forEach((linea, idx) => {
      if (regexMetodo.test(linea)) {
        const siguientes = lineas.slice(idx, idx + 5).join(' ').trim();
        if (siguientes) analisis.metodologia.push(siguientes);
      }
    });
    
    // Detectar conclusiones
    const regexConclusiones = /(conclusi[oó]n[es]?|conclusion[s]?|resultado[s]?|result[s]?)[:]/gi;
    lineas.forEach((linea, idx) => {
      if (regexConclusiones.test(linea)) {
        const siguientes = lineas.slice(idx, idx + 5).join(' ').trim();
        if (siguientes) analisis.conclusiones.push(siguientes);
      }
    });
    
    // Detectar referencias bibliográficas
    const regexReferencias = /(referencia[s]?|bibliograf[íi]a|reference[s]?)[:]/gi;
    const idxReferencias = lineas.findIndex(l => regexReferencias.test(l));
    if (idxReferencias !== -1) {
      const refs = lineas.slice(idxReferencias, Math.min(idxReferencias + 50, lineas.length));
      analisis.referencias = refs.filter(r => r.trim().length > 10);
    }
    
    // Detectar palabras clave
    const regexKeywords = /(palabra[s]? clave|keyword[s]?)[:]/gi;
    lineas.forEach((linea, idx) => {
      if (regexKeywords.test(linea)) {
        const siguientes = lineas.slice(idx, idx + 2).join(' ');
        const palabras = siguientes.split(/[,;]/).map(p => p.trim()).filter(p => p.length > 2);
        analisis.palabrasClave.push(...palabras);
      }
    });
    
    // Detectar secciones importantes (encabezados)
    const regexEncabezados = /^(\d+\.?\s|[A-Z][A-Z\s]{3,}|[#]{1,3}\s)/;
    lineas.forEach(linea => {
      if (regexEncabezados.test(linea.trim()) && linea.length < 100) {
        analisis.seccionesImportantes.push(linea.trim());
      }
    });
    
    return analisis;
  };

  const exportarExcel = () => {
    try {
      const csvData = [];
      const analisis = analizarContenido(datos.text || '');
      
      // ============================================================
      // SECCIÓN 1: PORTADA Y RESUMEN
      // ============================================================
      csvData.push(['═════════════════════════════════════════════════════════']);
      csvData.push(['        REPORTE COMPLETO DE ANÁLISIS DE PDF']);
      csvData.push(['═════════════════════════════════════════════════════════']);
      csvData.push(['Generado:', new Date().toLocaleString('es-ES')]);
      csvData.push(['Sistema:', 'PDFMaster Pro - Análisis Inteligente']);
      csvData.push([]);
      csvData.push([]);
      
      // ============================================================
      // SECCIÓN 2: INFORMACIÓN DEL DOCUMENTO
      // ============================================================
      csvData.push(['┌─────────────────────────────────────────────────────────┐']);
      csvData.push(['│ 1. INFORMACIÓN DEL DOCUMENTO                           │']);
      csvData.push(['└─────────────────────────────────────────────────────────┘']);
      csvData.push([]);
      csvData.push(['Campo', 'Valor']);
      csvData.push(['─────────────────', '─────────────────────────────────────']);
      csvData.push(['Nombre del archivo', archivo?.name || 'Sin nombre']);
      csvData.push(['Tamaño', `${(archivo?.size / (1024 * 1024)).toFixed(2)} MB`]);
      csvData.push(['Número de páginas', datos.numPages]);
      csvData.push(['Total de palabras', datos.text?.split(/\s+/).length || 0]);
      csvData.push(['Total de caracteres', datos.text?.length || 0]);
      csvData.push([]);
      csvData.push([]);
      
      // ============================================================
      // SECCIÓN 3: METADATOS
      // ============================================================
      csvData.push(['┌─────────────────────────────────────────────────────────┐']);
      csvData.push(['│ 2. METADATOS DEL PDF                                   │']);
      csvData.push(['└─────────────────────────────────────────────────────────┘']);
      csvData.push([]);
      csvData.push(['Campo', 'Valor']);
      csvData.push(['─────────────────', '─────────────────────────────────────']);
      csvData.push(['Título', datos.metadata?.title || 'Sin título']);
      csvData.push(['Autor', datos.metadata?.author || 'Desconocido']);
      csvData.push(['Creador/Software', datos.metadata?.creator || 'N/A']);
      csvData.push(['Productor PDF', datos.metadata?.producer || 'N/A']);
      csvData.push(['Fecha de creación', datos.metadata?.creationDate || 'N/A']);
      csvData.push(['Fecha de modificación', datos.metadata?.modificationDate || 'N/A']);
      csvData.push([]);
      csvData.push([]);
      
      // ============================================================
      // SECCIÓN 4: ANÁLISIS INTELIGENTE
      // ============================================================
      csvData.push(['┌─────────────────────────────────────────────────────────┐']);
      csvData.push(['│ 3. ANÁLISIS INTELIGENTE DEL CONTENIDO                  │']);
      csvData.push(['└─────────────────────────────────────────────────────────┘']);
      csvData.push([]);
      
      // Objetivos
      if (analisis.objetivos.length > 0) {
        csvData.push(['───────────────────────────────────────────────────────']);
        csvData.push(['3.1 🎯 OBJETIVOS DETECTADOS']);
        csvData.push(['───────────────────────────────────────────────────────']);
        csvData.push([]);
        analisis.objetivos.forEach((obj, idx) => {
          csvData.push([`Objetivo ${idx + 1}:`, obj]);
          csvData.push([]);
        });
        csvData.push([]);
      }
      
      // Metodología
      if (analisis.metodologia.length > 0) {
        csvData.push(['───────────────────────────────────────────────────────']);
        csvData.push(['3.2 🔬 METODOLOGÍA DETECTADA']);
        csvData.push(['───────────────────────────────────────────────────────']);
        csvData.push([]);
        analisis.metodologia.forEach((met, idx) => {
          csvData.push([`Método ${idx + 1}:`, met]);
          csvData.push([]);
        });
        csvData.push([]);
      }
      
      // Conclusiones
      if (analisis.conclusiones.length > 0) {
        csvData.push(['───────────────────────────────────────────────────────']);
        csvData.push(['3.3 📊 CONCLUSIONES/RESULTADOS']);
        csvData.push(['───────────────────────────────────────────────────────']);
        csvData.push([]);
        analisis.conclusiones.forEach((conc, idx) => {
          csvData.push([`Conclusión ${idx + 1}:`, conc]);
          csvData.push([]);
        });
        csvData.push([]);
      }
      
      // Palabras clave
      if (analisis.palabrasClave.length > 0) {
        csvData.push(['───────────────────────────────────────────────────────']);
        csvData.push(['3.4 🔑 PALABRAS CLAVE']);
        csvData.push(['───────────────────────────────────────────────────────']);
        csvData.push([]);
        csvData.push(['Palabras:', analisis.palabrasClave.join(', ')]);
        csvData.push([]);
        csvData.push([]);
      }
      
      // Estructura
      if (analisis.seccionesImportantes.length > 0) {
        csvData.push(['───────────────────────────────────────────────────────']);
        csvData.push(['3.5 📑 ESTRUCTURA DEL DOCUMENTO']);
        csvData.push(['───────────────────────────────────────────────────────']);
        csvData.push([]);
        csvData.push(['#', 'Sección/Encabezado']);
        csvData.push(['───', '─────────────────────────────────────────────────']);
        analisis.seccionesImportantes.forEach((seccion, idx) => {
          csvData.push([idx + 1, seccion]);
        });
        csvData.push([]);
        csvData.push([]);
      }
      
      // ============================================================
      // SECCIÓN 5: ESTADÍSTICAS
      // ============================================================
      csvData.push(['┌─────────────────────────────────────────────────────────┐']);
      csvData.push(['│ 4. ESTADÍSTICAS DE CONTENIDO                           │']);
      csvData.push(['└─────────────────────────────────────────────────────────┘']);
      csvData.push([]);
      csvData.push(['Tipo de elemento', 'Cantidad']);
      csvData.push(['─────────────────', '──────────']);
      csvData.push(['Imágenes detectadas', datos.stats?.imagesCount || datos.images?.length || 0]);
      csvData.push(['Tablas detectadas', datos.stats?.tablesCount || datos.tables?.length || 0]);
      csvData.push(['Links encontrados', datos.stats?.linksCount || datos.links?.length || 0]);
      csvData.push([]);
      csvData.push([]);
      
      // ============================================================
      // SECCIÓN 6: IMÁGENES DETALLADAS
      // ============================================================
      if (datos.images && datos.images.length > 0) {
        csvData.push(['┌─────────────────────────────────────────────────────────┐']);
        csvData.push(['│ 5. IMÁGENES DETECTADAS - DETALLE COMPLETO              │']);
        csvData.push(['└─────────────────────────────────────────────────────────┘']);
        csvData.push([]);
        csvData.push(['#', 'Página', 'Tipo', 'Ancho (px)', 'Alto (px)', 'Resolución', 'Compresión']);
        csvData.push(['───', '──────', '────────', '──────────', '─────────', '───────────', '──────────']);
        datos.images.forEach(img => {
          const area = img.width && img.height ? (img.width * img.height) : 0;
          const mp = (area / 1000000).toFixed(2);
          csvData.push([
            img.index,
            `Pág. ${img.page}`,
            img.type,
            img.width,
            img.height,
            `${mp} MP`,
            img.filter || 'N/A'
          ]);
        });
        csvData.push([]);
        csvData.push([]);
      }
      
      // ============================================================
      // SECCIÓN 7: TABLAS DETECTADAS
      // ============================================================
      if (datos.tables && datos.tables.length > 0) {
        csvData.push(['┌─────────────────────────────────────────────────────────┐']);
        csvData.push(['│ 6. TABLAS DETECTADAS - CONTENIDO COMPLETO              │']);
        csvData.push(['└─────────────────────────────────────────────────────────┘']);
        csvData.push([]);
        
        datos.tables.forEach((table, idx) => {
          csvData.push(['───────────────────────────────────────────────────────']);
          csvData.push([`TABLA #${idx + 1}`]);
          csvData.push(['───────────────────────────────────────────────────────']);
          csvData.push(['Ubicación:', `Líneas ${table.line_start} - ${table.line_end}`]);
          csvData.push(['Número de filas:', table.rows]);
          csvData.push([]);
          csvData.push(['CONTENIDO DE LA TABLA:']);
          csvData.push([table.preview || table.content || 'Contenido no disponible']);
          csvData.push([]);
          csvData.push([]);
        });
      }
      
      // ============================================================
      // SECCIÓN 8: LINKS ENCONTRADOS
      // ============================================================
      if (datos.links && datos.links.length > 0) {
        csvData.push(['┌─────────────────────────────────────────────────────────┐']);
        csvData.push(['│ 7. ENLACES (LINKS) ENCONTRADOS                         │']);
        csvData.push(['└─────────────────────────────────────────────────────────┘']);
        csvData.push([]);
        csvData.push(['#', 'Texto del enlace', 'URL', 'Tipo']);
        csvData.push(['───', '────────────────', '──────────────────────────────', '──────']);
        datos.links.forEach((link, idx) => {
          csvData.push([
            idx + 1,
            link.text || 'Sin texto',
            link.url,
            link.type || 'URL'
          ]);
        });
        csvData.push([]);
        csvData.push([]);
      }
      
      // ============================================================
      // SECCIÓN 9: REFERENCIAS BIBLIOGRÁFICAS
      // ============================================================
      if (analisis.referencias.length > 0) {
        csvData.push(['┌─────────────────────────────────────────────────────────┐']);
        csvData.push(['│ 8. REFERENCIAS BIBLIOGRÁFICAS                          │']);
        csvData.push(['└─────────────────────────────────────────────────────────┘']);
        csvData.push([]);
        csvData.push(['#', 'Referencia']);
        csvData.push(['───', '─────────────────────────────────────────────────────']);
        analisis.referencias.forEach((ref, idx) => {
          if (ref.trim()) {
            csvData.push([idx + 1, ref]);
          }
        });
        csvData.push([]);
        csvData.push([]);
      }
      
      // ============================================================
      // SECCIÓN 10: TEXTO COMPLETO
      // ============================================================
      csvData.push(['┌─────────────────────────────────────────────────────────┐']);
      csvData.push(['│ 9. TEXTO COMPLETO EXTRAÍDO DEL PDF                     │']);
      csvData.push(['└─────────────────────────────────────────────────────────┘']);
      csvData.push([]);
      csvData.push(['NOTA: A continuación se presenta el texto completo del PDF organizado por párrafos']);
      csvData.push([]);
      csvData.push([]);
      
      // Organizar texto en bloques
      const parrafos = datos.text?.split('\n\n') || [];
      let numParrafo = 1;
      
      parrafos.forEach((parrafo) => {
        const textoLimpio = parrafo.trim();
        if (textoLimpio) {
          // Detectar si es un encabezado
          const esEncabezado = textoLimpio.length < 100 && 
                              (textoLimpio.match(/^[A-Z\u00C0-\u00DC][A-Z\u00C0-\u00DC\s]{3,}$/) ||
                               textoLimpio.match(/^\d+\.?\s+[A-Z]/));
          
          if (esEncabezado) {
            csvData.push([]);
            csvData.push(['═══════════════════════════════════════════════════════']);
            csvData.push([`>>> ${textoLimpio}`]);
            csvData.push(['═══════════════════════════════════════════════════════']);
            csvData.push([]);
          } else {
            csvData.push([`[${numParrafo}]`, textoLimpio]);
            numParrafo++;
          }
        }
      });
      
      csvData.push([]);
      csvData.push([]);
      csvData.push(['═════════════════════════════════════════════════════════']);
      csvData.push(['            FIN DEL REPORTE']);
      csvData.push(['═════════════════════════════════════════════════════════']);
      
      // Convertir a CSV
      const csvContent = csvData.map(row => 
        row.map(cell => 
          `"${String(cell).replace(/"/g, '""').replace(/\n/g, ' ')}"`
        ).join(',')
      ).join('\n');
      
      // Crear blob y descargar
      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${archivo?.name?.replace('.pdf', '') || 'documento'}_reporte_completo.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('✅ Reporte completo exportado con estructura organizada');
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      toast.error('Error al crear el archivo Excel');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl mb-2 font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Resultados de Extracción
            </h1>
            <p className="text-slate-600">
              Archivo: {archivo?.name || 'Documento procesado'}
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 hover:bg-white rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
        </header>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <FileText className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-3xl font-bold mb-2">{datos.numPages}</h3>
            <p className="text-slate-600">Páginas procesadas</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <Sparkles className="w-12 h-12 text-pink-600 mb-4" />
            <h3 className="text-3xl font-bold mb-2">
              {datos.text?.split(' ').length || 0}
            </h3>
            <p className="text-slate-600">Palabras extraídas</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
            <Image className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-3xl font-bold mb-2">
              {datos.stats?.imagesCount || datos.images?.length || 0}
            </h3>
            <p className="text-slate-600">Imágenes detectadas</p>
          </div>
        </div>

        {/* Contenido */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Texto */}
          <div>
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-600" />
                Texto Extraído
              </h3>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setMostrarFormato(!mostrarFormato)}
                  className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                >
                  {mostrarFormato ? '📄 Vista Simple' : '✨ Vista Profesional'}
                </button>
              </div>
              <div className="max-h-[700px] overflow-auto bg-white border-2 border-slate-200 rounded-xl">
                {mostrarFormato && datos.formatted_text ? (
                  /* Vista Profesional - Estilo APA */
                  <div className="prose prose-sm max-w-none p-8" style={{
                    fontFamily: "'Times New Roman', Times, serif",
                    fontSize: '12pt',
                    lineHeight: '2',
                    textAlign: 'justify'
                  }}>
                    {/* Encabezado Estilo APA */}
                    <div className="mb-8 text-center border-b-2 border-slate-300 pb-4">
                      <h1 className="text-2xl font-bold mb-2" style={{ fontSize: '14pt', lineHeight: '1.5' }}>
                        {datos.metadata?.title || archivo?.name?.replace('.pdf', '') || 'Documento'}
                      </h1>
                      {datos.metadata?.author && (
                        <p className="text-sm mb-1" style={{ fontSize: '11pt' }}>
                          {datos.metadata.author}
                        </p>
                      )}
                      <p className="text-xs text-slate-500" style={{ fontSize: '10pt' }}>
                        Extraído el {new Date().toLocaleDateString('es-ES', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>

                    {/* Contenido con formato */}
                    <div style={{ textIndent: '0.5in' }}>
                      {datos.formatted_text.split('\n').map((paragraph, idx) => {
                        // Detectar TÍTULO PRINCIPAL (## - Negrilla)
                        if (paragraph.trim().startsWith('## ')) {
                          return (
                            <h2 
                              key={idx} 
                              className="text-lg font-bold mt-6 mb-3 text-center"
                              style={{ 
                                fontSize: '13pt', 
                                textIndent: '0',
                                lineHeight: '1.5',
                                fontWeight: 'bold'
                              }}
                            >
                              {paragraph.replace('## ', '')}
                            </h2>
                          );
                        }
                        
                        // Detectar SUBTÍTULO (### - Subrayado)
                        if (paragraph.trim().startsWith('### ')) {
                          return (
                            <h3 
                              key={idx} 
                              className="text-base font-semibold mt-4 mb-2"
                              style={{ 
                                fontSize: '12pt', 
                                textIndent: '0',
                                lineHeight: '1.5',
                                textDecoration: 'underline',
                                fontWeight: '600'
                              }}
                            >
                              {paragraph.replace('### ', '')}
                            </h3>
                          );
                        }
                        
                        // Párrafos vacíos
                        if (!paragraph.trim()) {
                          return <div key={idx} className="h-4"></div>;
                        }

                        // Detectar links formato Markdown [texto](url)
                        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                        const parts = [];
                        let lastIndex = 0;
                        let match;

                        while ((match = linkRegex.exec(paragraph)) !== null) {
                          // Texto antes del link
                          if (match.index > lastIndex) {
                            parts.push(paragraph.substring(lastIndex, match.index));
                          }
                          // Link
                          parts.push(
                            <a 
                              key={`link-${idx}-${match.index}`}
                              href={match[2]} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              {match[1]}
                            </a>
                          );
                          lastIndex = match.index + match[0].length;
                        }

                        // Texto después del último link
                        if (lastIndex < paragraph.length) {
                          parts.push(paragraph.substring(lastIndex));
                        }

                        // Si no hay links, usar el párrafo completo
                        const content = parts.length > 0 ? parts : paragraph;

                        return (
                          <p 
                            key={idx} 
                            className="mb-4"
                            style={{ 
                              textIndent: '0.5in',
                              textAlign: 'justify',
                              hyphens: 'auto'
                            }}
                          >
                            {content}
                          </p>
                        );
                      })}
                    </div>

                    {/* Footer estilo APA */}
                    <div className="mt-8 pt-4 border-t-2 border-slate-300 text-center text-xs text-slate-500">
                      <p>
                        Documento procesado: {datos.numPages} páginas | 
                        {' '}{datos.text?.split(/\s+/).length.toLocaleString()} palabras
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Vista Simple - Texto plano */
                  <div className="p-6 bg-slate-50">
                    <pre className="whitespace-pre-wrap font-mono text-xs leading-loose text-slate-800">
                      {datos.text || 'No se extrajo texto'}
                    </pre>
                  </div>
                )}
                
                {datos.text && (
                  <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 text-xs text-slate-600 flex justify-between">
                    <span>📄 {datos.text.length.toLocaleString()} caracteres</span>
                    <span>📝 {datos.text.split(/\s+/).length.toLocaleString()} palabras</span>
                    <span>📖 {datos.numPages} páginas</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Metadatos Ampliados */}
          <div>
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Info className="w-6 h-6 text-purple-600" />
                Información del Documento
              </h3>
              
              {/* Metadatos Principales */}
              <div className="space-y-4 mb-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-purple-600 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Título del Documento</p>
                      <p className="font-semibold text-slate-800">{datos.metadata?.title || archivo?.name?.replace('.pdf', '') || 'Sin título'}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <UserIcon className="w-4 h-4 text-slate-500" />
                      <p className="text-xs font-semibold text-slate-500 uppercase">Autor</p>
                    </div>
                    <p className="font-medium text-slate-700">{datos.metadata?.author || 'Desconocido'}</p>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <p className="text-xs font-semibold text-slate-500 uppercase">Fecha Creación</p>
                    </div>
                    <p className="font-medium text-slate-700 text-sm">
                      {datos.metadata?.creationDate 
                        ? new Date(datos.metadata.creationDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
                        : 'No disponible'}
                    </p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Creador/Software</p>
                  <p className="font-medium text-slate-700">{datos.metadata?.creator || datos.metadata?.producer || 'No especificado'}</p>
                </div>
              </div>

              {/* Análisis del Contenido */}
              <div className="border-t pt-4 mb-4">
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Análisis de Contenido
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <Hash className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-purple-700">{datos.numPages}</p>
                    <p className="text-xs text-purple-600">Páginas</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <FileText className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-blue-700">{datos.text?.split(/\s+/).length.toLocaleString() || 0}</p>
                    <p className="text-xs text-blue-600">Palabras</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <ImageIcon className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-700">{datos.stats?.imagesCount || datos.images?.length || 0}</p>
                    <p className="text-xs text-green-600">Imágenes</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <Table className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-orange-700">{datos.stats?.tablesCount || datos.tables?.length || 0}</p>
                    <p className="text-xs text-orange-600">Tablas</p>
                  </div>
                </div>
              </div>

              {/* Tema/Categoría detectada */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4">
                <h4 className="text-sm font-bold text-slate-700 mb-2">🎯 Análisis Temático</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {(() => {
                    const texto = datos.text?.toLowerCase() || '';
                    const titulo = (datos.metadata?.title || archivo?.name || '').toLowerCase();
                    const palabras = texto.split(/\s+/);
                    
                    // Función para contar ocurrencias de palabras clave
                    const contarPalabras = (keywords) => {
                      return keywords.reduce((count, keyword) => {
                        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                        const matches = texto.match(regex);
                        return count + (matches ? matches.length : 0);
                      }, 0);
                    };
                    
                    // Palabras clave por categoría (más específicas)
                    const categorias = {
                      tecnologia: {
                        keywords: ['react', 'javascript', 'python', 'código', 'programación', 'software', 'desarrollo', 'api', 'framework', 'algoritmo', 'function', 'component', 'hooks', 'jsx', 'typescript', 'node', 'npm', 'github', 'git', 'database', 'frontend', 'backend', 'css', 'html'],
                        emoji: '💻',
                        nombre: 'Tecnología/Programación',
                        desc: 'Contenido técnico sobre desarrollo de software, programación y tecnologías web.'
                      },
                      medico: {
                        keywords: ['paciente', 'diagnóstico', 'tratamiento', 'síntoma', 'enfermedad', 'médico', 'hospital', 'clínica', 'terapia', 'farmacológico', 'dosis', 'cirugía', 'salud', 'anatomía', 'patología'],
                        emoji: '🏥',
                        nombre: 'Médico/Salud',
                        desc: 'Documento relacionado con medicina, salud o procedimientos médicos.'
                      },
                      legal: {
                        keywords: ['contrato', 'cláusula', 'artículo', 'demandado', 'demandante', 'sentencia', 'juez', 'tribunal', 'penal', 'civil', 'código', 'normativa', 'legal', 'jurídico', 'derecho'],
                        emoji: '⚖️',
                        nombre: 'Legal/Jurídico',
                        desc: 'Documento legal con términos jurídicos, contratos o información legal.'
                      },
                      financiero: {
                        keywords: ['inversión', 'acciones', 'bolsa', 'financiero', 'económico', 'capital', 'interés', 'crédito', 'presupuesto', 'balance', 'activo', 'pasivo', 'dividendo', 'rentabilidad'],
                        emoji: '💰',
                        nombre: 'Financiero/Económico',
                        desc: 'Relacionado con finanzas, economía, inversiones o contabilidad.'
                      },
                      educativo: {
                        keywords: ['estudiante', 'profesor', 'curso', 'universidad', 'aprendizaje', 'enseñanza', 'académico', 'tesis', 'investigación', 'metodología', 'objetivo', 'conclusión', 'hipótesis', 'bibliografía'],
                        emoji: '📚',
                        nombre: 'Educativo/Académico',
                        desc: 'Material educativo, investigación académica o contenido de formación.'
                      },
                      marketing: {
                        keywords: ['cliente', 'venta', 'producto', 'mercado', 'campaña', 'publicidad', 'marca', 'estrategia', 'consumidor', 'promoción', 'precio', 'segmento', 'target'],
                        emoji: '📈',
                        nombre: 'Marketing/Negocios',
                        desc: 'Contenido comercial, estrategias de marketing o negocios.'
                      },
                      cientifico: {
                        keywords: ['experimento', 'hipótesis', 'método', 'resultado', 'análisis', 'muestra', 'variable', 'estadístico', 'significativo', 'correlación', 'evidencia', 'abstracto'],
                        emoji: '🔬',
                        nombre: 'Científico/Investigación',
                        desc: 'Artículo científico, investigación o estudio académico.'
                      }
                    };
                    
                    // Calcular puntuación para cada categoría
                    const puntuaciones = {};
                    let maxPuntuacion = 0;
                    let mejorCategoria = null;
                    
                    for (const [key, cat] of Object.entries(categorias)) {
                      const count = contarPalabras(cat.keywords);
                      // Ponderar también el título
                      const tituloBonus = cat.keywords.some(k => titulo.includes(k)) ? 5 : 0;
                      puntuaciones[key] = count + tituloBonus;
                      
                      if (puntuaciones[key] > maxPuntuacion && puntuaciones[key] >= 3) {
                        maxPuntuacion = puntuaciones[key];
                        mejorCategoria = cat;
                      }
                    }
                    
                    if (mejorCategoria) {
                      return `${mejorCategoria.emoji} ${mejorCategoria.nombre} - ${mejorCategoria.desc}`;
                    }
                    
                    // Si no hay categoría clara, analizar contenido general
                    const tieneMuchoTexto = palabras.length > 1000;
                    const tieneImagenes = (datos.images?.length || 0) > 5;
                    const tieneTablas = (datos.tables?.length || 0) > 2;
                    
                    if (tieneMuchoTexto && tieneTablas) {
                      return '📊 Documento Técnico/Informe - Contiene análisis detallado con datos y tablas.';
                    } else if (tieneImagenes) {
                      return '🖼️ Documento Visual/Presentación - Contiene múltiples elementos visuales.';
                    } else if (tieneMuchoTexto) {
                      return '📖 Documento Extenso - Contenido textual amplio, posiblemente manual o guía.';
                    } else {
                      return '📄 Documento General - Contenido de propósito general o mixto.';
                    }
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <button
            onClick={irAEditor}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            <Edit className="w-5 h-5" />
            Editar Contenido
          </button>

          <button 
            onClick={() => exportarDocumento('txt')}
            disabled={exportando}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className="w-5 h-5" />
            {exportando ? 'Exportando...' : 'Exportar TXT (APA)'}
          </button>

          <button 
            onClick={() => exportarDocumento('md')}
            disabled={exportando}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileDown className="w-5 h-5" />
            {exportando ? 'Exportando...' : 'Exportar MD (APA)'}
          </button>

          <button 
            onClick={exportarExcel}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Exportar Excel/CSV
          </button>
        </div>

        {/* Análisis Inteligente del Contenido */}
        <div className="mt-8">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-7 h-7" />
              Análisis Inteligente del Documento
            </h3>
            <p className="text-purple-100 mb-6">
              Análisis automático del contenido extraído del PDF
            </p>

            {(() => {
              const analisis = analizarContenido(datos.text || '');
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Objetivos */}
                  {analisis.objetivos.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <h4 className="font-bold mb-2 flex items-center gap-2">
                        🎯 Objetivos Detectados
                      </h4>
                      <div className="space-y-2 text-sm text-purple-100">
                        {analisis.objetivos.slice(0, 3).map((obj, idx) => (
                          <p key={idx} className="line-clamp-2">• {obj}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metodología */}
                  {analisis.metodologia.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <h4 className="font-bold mb-2 flex items-center gap-2">
                        🔬 Metodología Detectada
                      </h4>
                      <div className="space-y-2 text-sm text-purple-100">
                        {analisis.metodologia.slice(0, 3).map((met, idx) => (
                          <p key={idx} className="line-clamp-2">• {met}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conclusiones */}
                  {analisis.conclusiones.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <h4 className="font-bold mb-2 flex items-center gap-2">
                        📊 Conclusiones/Resultados
                      </h4>
                      <div className="space-y-2 text-sm text-purple-100">
                        {analisis.conclusiones.slice(0, 3).map((conc, idx) => (
                          <p key={idx} className="line-clamp-2">• {conc}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Palabras Clave */}
                  {analisis.palabrasClave.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <h4 className="font-bold mb-2 flex items-center gap-2">
                        🔑 Palabras Clave
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analisis.palabrasClave.slice(0, 10).map((palabra, idx) => (
                          <span key={idx} className="bg-white/20 px-2 py-1 rounded text-xs">
                            {palabra}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Estructura del documento */}
                  {analisis.seccionesImportantes.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:col-span-2">
                      <h4 className="font-bold mb-2 flex items-center gap-2">
                        📑 Estructura del Documento
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-purple-100">
                        {analisis.seccionesImportantes.slice(0, 12).map((seccion, idx) => (
                          <div key={idx} className="truncate">
                            {idx + 1}. {seccion}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Referencias */}
                  {analisis.referencias.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:col-span-2">
                      <h4 className="font-bold mb-2 flex items-center gap-2">
                        📚 Referencias Bibliográficas ({analisis.referencias.length})
                      </h4>
                      <p className="text-xs text-purple-100">
                        Se detectaron {analisis.referencias.length} referencias. Ver detalles en exportación Excel.
                      </p>
                    </div>
                  )}

                  {/* Mensaje si no hay análisis */}
                  {analisis.objetivos.length === 0 && 
                   analisis.metodologia.length === 0 && 
                   analisis.conclusiones.length === 0 &&
                   analisis.palabrasClave.length === 0 &&
                   analisis.seccionesImportantes.length === 0 &&
                   analisis.referencias.length === 0 && (
                    <div className="md:col-span-2 text-center py-6">
                      <p className="text-purple-100">
                        📄 Documento de formato general. El análisis completo está disponible en la exportación.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Información Avanzada */}
        <div className="mt-8 space-y-6">
          
          {/* Imágenes Detectadas */}
          {datos.images && datos.images.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-blue-600" />
                Imágenes Detectadas ({datos.images.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {datos.images.map((img, index) => {
                  const area = img.width && img.height ? (img.width * img.height) : 0;
                  const megapixels = (area / 1000000).toFixed(2);
                  const aspectRatio = img.width && img.height ? (img.width / img.height).toFixed(2) : 'N/A';
                  
                  return (
                    <div key={index} className="border-2 border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-lg transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-blue-600 flex items-center gap-1">
                          <ImageIcon className="w-4 h-4" />
                          Imagen {img.index}
                        </span>
                        <span className="text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 px-3 py-1 rounded-full font-semibold">
                          {img.type}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="bg-slate-50 rounded-lg p-2">
                          <p className="text-xs text-slate-500 mb-1">📍 Ubicación</p>
                          <p className="text-sm font-semibold text-slate-700">Página {img.page}</p>
                        </div>
                        
                        <div className="bg-slate-50 rounded-lg p-2">
                          <p className="text-xs text-slate-500 mb-1">📏 Dimensiones</p>
                          <p className="text-sm font-semibold text-slate-700">{img.width} × {img.height} px</p>
                          {area > 0 && (
                            <p className="text-xs text-slate-500 mt-1">
                              ~{megapixels} MP • Ratio: {aspectRatio}:1
                            </p>
                          )}
                        </div>
                        
                        {img.filter && (
                          <div className="bg-slate-50 rounded-lg p-2">
                            <p className="text-xs text-slate-500 mb-1">🔧 Compresión</p>
                            <p className="text-xs font-medium text-slate-700">{img.filter}</p>
                          </div>
                        )}
                        
                        <div className="pt-2 border-t border-slate-200">
                          <p className="text-xs text-slate-500">
                            {area > 500000 ? '⭐ Alta resolución' : area > 100000 ? '✓ Resolución media' : '📱 Resolución baja'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tablas Detectadas */}
          {datos.tables && datos.tables.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Table className="w-6 h-6 text-green-600" />
                Tablas Detectadas ({datos.tables.length})
              </h3>
              <div className="space-y-4">
                {datos.tables.map((table, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 hover:border-green-400 transition">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-green-600">Tabla {index + 1}</span>
                      <div className="flex gap-2 text-xs text-slate-500">
                        <span>📊 {table.rows} filas</span>
                        <span>📍 Líneas {table.line_start}-{table.line_end}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 overflow-auto">
                      <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap">
                        {table.preview || table.content?.substring(0, 200) + '...'}
                      </pre>
                    </div>
                    {table.content && table.content.length > 200 && (
                      <p className="text-xs text-slate-500 mt-2">
                        Mostrando preview. Tabla completa en el texto extraído.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links Encontrados */}
          {datos.links && datos.links.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <LinkIcon className="w-6 h-6 text-purple-600" />
                Links Encontrados ({datos.links.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-auto">
                {datos.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition group"
                  >
                    <div className="flex-shrink-0">
                      {link.type === 'email' ? (
                        <span className="text-2xl">✉️</span>
                      ) : (
                        <span className="text-2xl">🔗</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate group-hover:text-purple-700">
                        {link.text}
                      </p>
                      <p className="text-xs text-slate-500">
                        {link.type === 'email' ? 'Email' : 'URL'}
                      </p>
                    </div>
                    <LinkIcon className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
                  </a>
                ))}
              </div>
              {datos.links.length > 20 && (
                <p className="text-sm text-slate-500 mt-4 text-center">
                  Mostrando todos los {datos.links.length} links encontrados
                </p>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
