import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { APIService, type User, type LoginCredentials, type RegisterData, type AuthResponse } from '../services/APIService';
import { AuthErrorHandler, type AuthError } from '../lib/auth/errorHandling';

// ============================================================================
// AUTHENTICATION CONTEXT TYPES
// ============================================================================

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  authError: AuthError | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (userData: RegisterData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  getErrorSuggestion: () => string | null;
}

// ============================================================================
// AUTHENTICATION CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | null>(null);

// ============================================================================
// AUTHENTICATION PROVIDER COMPONENT
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    authError: null
  });

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null, authError: null }));

      const response: AuthResponse = await APIService.login(credentials);

      // Store tokens securely
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);

      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        authError: null
      });

      return response;
    } catch (error) {
      const authError = AuthErrorHandler.classifyError(error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: authError.message,
        authError
      }));
      throw error;
    }
  };

  const register = async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null, authError: null }));

      const response: AuthResponse = await APIService.register(userData);

      // Store tokens securely
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);

      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        authError: null
      });

      return response;
    } catch (error) {
      const authError = AuthErrorHandler.classifyError(error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: authError.message,
        authError
      }));
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
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
        error: null,
        authError: null
      });
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const response = await APIService.refreshToken();
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
    } catch (error) {
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  };

  const clearError = (): void => {
    setAuthState(prev => ({ ...prev, error: null, authError: null }));
  };

  const getErrorSuggestion = (): string | null => {
    return authState.authError ? AuthErrorHandler.getRecoverySuggestion(authState.authError) : null;
  };

  // ============================================================================
  // ROLE-BASED ACCESS CONTROL METHODS
  // ============================================================================

  const hasRole = (role: string): boolean => {
    return authState.user?.role === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return authState.user ? roles.includes(authState.user.role) : false;
  };

  // ============================================================================
  // AUTHENTICATION CHECK ON MOUNT
  // ============================================================================

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
            error: null,
            authError: null
          });
        } catch {
          // Token might be expired, try to refresh
          try {
            await refreshToken();
            const user = await APIService.getCurrentUser();
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              authError: null
            });
          } catch {
            // Refresh failed, clear auth state
            await logout();
          }
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkAuth();
  }, []);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    refreshToken,
    clearError,
    hasRole,
    hasAnyRole,
    getErrorSuggestion
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// AUTHENTICATION HOOK
// ============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AuthProvider;
