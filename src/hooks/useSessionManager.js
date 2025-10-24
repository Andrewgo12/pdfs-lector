import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexto/AuthContext';
import toast from '@/lib/toast';

/**
 * Hook para gestión automática de sesión
 * - Detecta sesiones expiradas
 * - Redirige a login cuando es necesario
 * - Muestra notificaciones apropiadas
 */
export function useSessionManager() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const handleSessionExpired = useCallback(() => {
    logout();
    toast.error('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', {
      duration: 5000
    });
    navigate('/login', { 
      state: { 
        from: window.location.pathname,
        reason: 'session_expired' 
      } 
    });
  }, [logout, navigate]);

  const validateSession = useCallback(async () => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('token');
    if (!token) {
      handleSessionExpired();
      return;
    }

    try {
      // Verificar si el token sigue siendo válido
      const response = await fetch('http://localhost:8000/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        }
      });

      if (response.status === 401) {
        handleSessionExpired();
      }
    } catch (error) {
      // No hacer nada si es error de red, solo si es 401
      console.log('Error validando sesión:', error);
    }
  }, [isAuthenticated, handleSessionExpired]);

  // Validar sesión cada 5 minutos
  useEffect(() => {
    if (!isAuthenticated) return;

    // Validar inmediatamente
    validateSession();

    // Configurar intervalo
    const interval = setInterval(validateSession, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, validateSession]);

  // Interceptor global para manejar 401
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status === 401 && isAuthenticated) {
        // Clonar la respuesta para poder leerla múltiples veces
        const clone = response.clone();
        
        try {
          const data = await clone.json();
          if (data.message === 'Unauthenticated.') {
            handleSessionExpired();
          }
        } catch {
          // Si no se puede parsear, ignorar
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [isAuthenticated, handleSessionExpired]);

  return {
    validateSession,
    handleSessionExpired
  };
}
