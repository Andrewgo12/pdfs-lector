import { Clock } from 'lucide-react';
import BarraProgreso from '@/componentes/BarraProgreso';

export default function ProgressPanel({ progreso, etapaActual, tiempoTranscurrido }) {
  return (
    <>
      <BarraProgreso progreso={progreso} />
      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span className="font-medium text-slate-700">{etapaActual}</span>
        {tiempoTranscurrido > 0 && (
          <div className="flex items-center gap-1 text-slate-500">
            <Clock className="w-4 h-4" />
            <span>{tiempoTranscurrido}s</span>
          </div>
        )}
      </div>
    </>
  );
}
