import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, UserPlus, Mail, Lock, User, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexto/AuthContext';
import Input from '@/componentes/ui/Input';
import Button from '@/componentes/ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '@/componentes/ui/Card';

export default function Login() {
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
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
    setError('');

    try {
      let result;
      if (activeTab === 'login') {
        result = await login(formData.email, formData.password);
      } else {
        // Validar contraseñas
        if (formData.password !== formData.password_confirmation) {
          setError('Las contraseñas no coinciden');
          setLoading(false);
          return;
        }
        result = await register(
          formData.name,
          formData.email,
          formData.password,
          formData.password_confirmation
        );
      }

      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Error al procesar la solicitud');
      }
    } catch (err) {
      setError('Error de conexión. Verifica que el backend esté activo.');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError('');
    setFormData({
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
      
      {/* Botón volver */}
      <Link
        to="/"
        className="absolute top-4 left-4 flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Link>

      {/* Card compacto */}
      <div className="w-full max-w-sm">
        <Card>
          
          {/* Header */}
          <CardHeader className="bg-slate-900 dark:bg-slate-950 text-center">
            <h1 className="text-2xl font-bold text-white mb-1">
              PDFMaster Pro
            </h1>
            <p className="text-sm text-slate-400">
              Sistema de autenticación
            </p>
          </CardHeader>

          {/* Tabs compactos */}
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 py-3 text-sm font-semibold transition ${
                activeTab === 'login'
                  ? 'text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => switchTab('register')}
              className={`flex-1 py-3 text-sm font-semibold transition ${
                activeTab === 'register'
                  ? 'text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              
              {/* Mensaje de error */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Nombre (solo en registro) */}
              {activeTab === 'register' && (
                <Input
                  label="Nombre completo"
                  type="text"
                  name="name"
                  icon={User}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                />
              )}

              {/* Email */}
              <Input
                label="Correo electrónico"
                type="email"
                name="email"
                icon={Mail}
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                required
              />

              {/* Contraseña */}
              <Input
                label="Contraseña"
                type="password"
                name="password"
                icon={Lock}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                minLength={8}
                required
              />

              {/* Confirmar contraseña (solo en registro) */}
              {activeTab === 'register' && (
                <Input
                  label="Confirmar contraseña"
                  type="password"
                  name="password_confirmation"
                  icon={Lock}
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  placeholder="••••••••"
                  minLength={8}
                  required
                />
              )}

              {/* Botón submit */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                icon={activeTab === 'login' ? LogIn : UserPlus}
                className="w-full mt-2"
              >
                {activeTab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </Button>
            </CardContent>
          </form>

          {/* Footer */}
          <CardFooter>
            <p className="text-xs text-center text-slate-600 dark:text-slate-400 w-full">
              {activeTab === 'login' 
                ? 'Al iniciar sesión, accedes a funciones ilimitadas'
                : 'Al registrarte, aceptas nuestros términos de servicio'}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
