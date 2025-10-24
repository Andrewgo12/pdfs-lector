import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NoEncontrado() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-9xl font-bold text-purple-600">404</h1>
        <h2 className="text-3xl font-bold text-slate-800">Página no encontrada</h2>
        <p className="text-slate-600 max-w-md mx-auto">
          Lo sentimos, la página que buscas no existe.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
        >
          <Home className="w-5 h-5" />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
