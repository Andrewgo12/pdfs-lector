import { createContext, useContext, useState, useEffect } from 'react';
import toast from '@/lib/toast';

const AuthContext = createContext(null);

const API_BASE_URL = 'http://localhost:8000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [archivosGratis, setArchivosGratis] = useState(0);

  // Al cargar, verificar si hay sesión guardada
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedArchivos = localStorage.getItem('archivos_gratis');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    if (storedArchivos) {
      setArchivosGratis(parseInt(storedArchivos, 10));
    }

    setLoading(false);
  }, []);

  // Login con Laravel API
  const login = async (email, password) => {
    try {
      // Validación simple
      if (!email || !password) {
        throw new Error('Email y contraseña son requeridos');
      }

      // Llamar al backend Laravel
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Error al iniciar sesión');
      }

      // Guardar token y usuario
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      toast.success(`¡Bienvenido, ${data.user.name}!`);
      return { success: true };
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  // Register con Laravel API
  const register = async (name, email, password, passwordConfirmation) => {
    try {
      // Validaciones
      if (!name || !email || !password) {
        throw new Error('Todos los campos son requeridos');
      }

      if (password !== passwordConfirmation) {
        throw new Error('Las contraseñas no coinciden');
      }

      if (password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }

      // Llamar al backend Laravel
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          email, 
          password,
          password_confirmation: passwordConfirmation 
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || 'Error al registrar usuario');
      }

      // Auto-login después de registro
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      toast.success('¡Cuenta creada exitosamente!');
      return { success: true };
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      // Intentar llamar al backend para revocar token
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }).catch(() => {});
      }
    } catch (error) {
      // Ignorar errores de logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.info('Sesión cerrada');
    }
  };

  // Incrementar contador de archivos gratis
  const incrementarArchivosGratis = () => {
    const nuevo = archivosGratis + 1;
    setArchivosGratis(nuevo);
    localStorage.setItem('archivos_gratis', nuevo.toString());
  };

  // Verificar si puede procesar archivo
  // Sin login: 3 archivos gratis
  // Con login: 3 + 3 = 6 archivos totales
  const puedeProcesar = () => {
    const limiteMaximo = user ? 6 : 3;
    const restantes = limiteMaximo - archivosGratis;
    
    return {
      puede: archivosGratis < limiteMaximo,
      restantes,
      limiteTotal: limiteMaximo,
      procesados: archivosGratis,
      mensaje: user 
        ? (restantes > 0 
          ? `Te quedan ${restantes} de ${limiteMaximo} conversiones (Usuario registrado)` 
          : 'Has alcanzado tu límite de 6 conversiones')
        : (restantes > 0 
          ? `Te quedan ${restantes} conversiones gratis (Registrate para obtener 3 más)` 
          : 'Has alcanzado el límite gratuito. ¡Regístrate para obtener 3 conversiones adicionales!')
    };
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    archivosGratis,
    incrementarArchivosGratis,
    puedeProcesar,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
