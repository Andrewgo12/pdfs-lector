import { useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2 } from 'lucide-react';

export default function EditorTexto({ contenidoInicial = '', onChange }) {
  const [contenido, setContenido] = useState(contenidoInicial);
  const [seleccion, setSeleccion] = useState(null);

  const aplicarFormato = (comando) => {
    document.execCommand(comando, false, null);
  };

  const manejarCambio = (e) => {
    const nuevoContenido = e.target.innerHTML;
    setContenido(nuevoContenido);
    if (onChange) onChange(nuevoContenido);
  };

  const estadisticas = {
    caracteres: contenido.replace(/<[^>]*>/g, '').length,
    palabras: contenido.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length,
    parrafos: contenido.split('</p>').length - 1 || 1,
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-3 border-b bg-slate-50">
        <button
          onClick={() => aplicarFormato('bold')}
          className="p-2 rounded hover:bg-slate-200 transition"
          title="Negrita"
        >
          <Bold className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => aplicarFormato('italic')}
          className="p-2 rounded hover:bg-slate-200 transition"
          title="Cursiva"
        >
          <Italic className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => aplicarFormato('underline')}
          className="p-2 rounded hover:bg-slate-200 transition"
          title="Subrayado"
        >
          <Underline className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-300 mx-2"></div>

        <button
          onClick={() => aplicarFormato('formatBlock', 'h1')}
          className="p-2 rounded hover:bg-slate-200 transition"
          title="Título 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>

        <button
          onClick={() => aplicarFormato('formatBlock', 'h2')}
          className="p-2 rounded hover:bg-slate-200 transition"
          title="Título 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-300 mx-2"></div>

        <button
          onClick={() => aplicarFormato('insertUnorderedList')}
          className="p-2 rounded hover:bg-slate-200 transition"
          title="Lista"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          onClick={() => aplicarFormato('insertOrderedList')}
          className="p-2 rounded hover:bg-slate-200 transition"
          title="Lista numerada"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>

      {/* Editor */}
      <div
        contentEditable
        onInput={manejarCambio}
        className="flex-1 p-6 overflow-auto focus:outline-none prose prose-slate max-w-none"
        dangerouslySetInnerHTML={{ __html: contenido }}
      />

      {/* Estadísticas */}
      <div className="flex items-center justify-between px-6 py-3 border-t bg-slate-50 text-sm text-slate-600">
        <div className="flex gap-6">
          <span>{estadisticas.caracteres} caracteres</span>
          <span>{estadisticas.palabras} palabras</span>
          <span>{estadisticas.parrafos} párrafos</span>
        </div>
      </div>
    </div>
  );
}
