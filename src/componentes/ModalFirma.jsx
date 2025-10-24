import { useState, useRef } from 'react';
import { X, Download, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ModalFirma({ abierto, onCerrar, onGuardar }) {
  const canvasRef = useRef(null);
  const [dibujando, setDibujando] = useState(false);
  const [vacio, setVacio] = useState(true);
  const [nombre, setNombre] = useState('');

  const iniciarDibujo = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setDibujando(true);
    setVacio(false);
  };

  const dibujar = (e) => {
    if (!dibujando) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const detenerDibujo = () => {
    setDibujando(false);
  };

  const limpiar = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setVacio(true);
  };

  const guardarFirma = () => {
    if (vacio || !nombre.trim()) {
      alert('Por favor dibuja tu firma e ingresa tu nombre');
      return;
    }

    const canvas = canvasRef.current;
    const firmaData = canvas.toDataURL('image/png');
    
    if (onGuardar) {
      onGuardar({
        imagen: firmaData,
        nombre: nombre,
        fecha: new Date().toISOString(),
      });
    }
    
    onCerrar();
  };

  return (
    <AnimatePresence>
      {abierto && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCerrar}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Firma Digital</h2>
              <button
                onClick={onCerrar}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nombre */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre completo
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ingresa tu nombre"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Canvas */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Dibuja tu firma
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={200}
                  onMouseDown={iniciarDibujo}
                  onMouseMove={dibujar}
                  onMouseUp={detenerDibujo}
                  onMouseLeave={detenerDibujo}
                  className="cursor-crosshair w-full"
                />
              </div>
              {vacio && (
                <p className="text-sm text-slate-500 mt-2 text-center">
                  Usa tu mouse para dibujar tu firma
                </p>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-between">
              <button
                onClick={limpiar}
                disabled={vacio}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Limpiar
              </button>

              <div className="flex gap-2">
                <button
                  onClick={onCerrar}
                  className="px-6 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarFirma}
                  disabled={vacio || !nombre.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Guardar Firma
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
