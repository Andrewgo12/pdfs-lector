import { motion } from 'framer-motion';

export default function BarraProgreso({ progreso, texto }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">{texto || 'Procesando...'}</span>
        <span className="text-sm font-bold text-purple-600">{Math.round(progreso)}%</span>
      </div>
      
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
          initial={{ width: 0 }}
          animate={{ width: `${progreso}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
