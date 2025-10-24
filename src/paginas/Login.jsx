import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, UserPlus, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexto/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();
  const [modo, setModo] = useState('login'); // 'login' o 'register'
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  // Si ya está autenticado, redirigir
  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let result;
    if (modo === 'login') {
      result = await login(formData.email, formData.password);
    } else {
      result = await register(
        formData.name,
        formData.email,
        formData.password,
        formData.password_confirmation
      );
    }

    setLoading(false);

    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 relative flex items-center justify-center p-8">
      
      {/* Botón volver */}
      <Link
        to="/"
        className="absolute top-8 left-8 z-20 flex items-center gap-2 text-slate-600 hover:text-purple-600 transition"
      >
        <ArrowLeft className="w-5 h-5" />
        Volver
      </Link>

      {/* Tarjeta de Login/Register */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
              {modo === 'login' ? (
                <LogIn className="w-8 h-8" />
              ) : (
                <UserPlus className="w-8 h-8" />
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {modo === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h1>
            <p className="text-purple-100">
              {modo === 'login'
                ? 'Accede a conversiones ilimitadas'
                : 'Regístrate y convierte sin límites'}
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {/* Nombre (solo en registro) */}
            {modo === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="Tu nombre"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  placeholder="••••••••"
                />
              </div>
              {modo === 'register' && (
                <p className="text-xs text-slate-500 mt-1">
                  Mínimo 8 caracteres
                </p>
              )}
            </div>

            {/* Confirmar contraseña (solo en registro) */}
            {modo === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {/* Botón submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    {modo === 'login' ? (
                      <>
                        <LogIn className="w-5 h-5" />
                        Iniciar Sesión
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        Crear Cuenta
                      </>
                    )}
                  </>
                )}
              </button>

            {/* Cambiar modo */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setModo(modo === 'login' ? 'register' : 'login');
                  setFormData({
                    name: '',
                    email: '',
                    password: '',
                    password_confirmation: '',
                  });
                }}
                className="text-purple-600 hover:text-purple-700 font-medium transition"
              >
                {modo === 'login'
                  ? '¿No tienes cuenta? Regístrate'
                  : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </form>

          {/* Footer con beneficios */}
          <div className="bg-slate-50 p-6 border-t border-slate-200">
            <p className="text-sm text-slate-600 text-center mb-3 font-semibold">
              ✨ Beneficios de crear una cuenta:
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                Conversiones ilimitadas
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                Historial de documentos
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                Acceso desde cualquier dispositivo
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                Soporte prioritario
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
