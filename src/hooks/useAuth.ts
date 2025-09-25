import { useState, useEffect, useCallback } from 'react';
import { APIService } from '../services/APIService';
import type {
  User,
  LoginCredentials,
  AuthResponse
} from '../services/APIService';

// ============================================================================
// AUTHENTICATION HOOKS
// ============================================================================

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response: AuthResponse = await APIService.login(credentials);
      
      // Store tokens in localStorage (in production, consider more secure storage)
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await APIService.logout();
    } catch (logoutError) {
      // Log error for debugging but don't throw
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Logout error:', logoutError);
      }
    } finally {
      // Clear tokens and state regardless of API call success
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const response = await APIService.refreshToken();
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      return response;
    } catch (error) {
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  }, [logout]);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const user = await APIService.getCurrentUser();
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (authError) {
          // Token might be expired, try to refresh
          try {
            await refreshToken();
            const user = await APIService.getCurrentUser();
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } catch (refreshError) {
            // Refresh failed, clear auth state
            await logout();
          }
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkAuth();
  }, [logout, refreshToken]);

  return {
    ...authState,
    login,
    logout,
    refreshToken
  };
}
