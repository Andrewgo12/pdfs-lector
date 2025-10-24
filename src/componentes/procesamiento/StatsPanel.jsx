export default function StatsPanel({ tiempoTranscurrido, progreso, reintentos, maxRetries }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <h4 className="text-sm font-semibold text-slate-700 mb-2">Estadísticas</h4>
      <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
        <div>
          <span className="block text-slate-500">Tiempo transcurrido</span>
          <span className="font-semibold text-slate-800">{tiempoTranscurrido}s</span>
        </div>
        <div>
          <span className="block text-slate-500">Progreso</span>
          <span className="font-semibold text-slate-800">{progreso}%</span>
        </div>
        {reintentos > 0 && (
          <div>
            <span className="block text-slate-500">Reintentos</span>
            <span className="font-semibold text-amber-600">{reintentos}/{maxRetries}</span>
          </div>
        )}
      </div>
    </div>
  );
}
