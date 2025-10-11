import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { APIService, type User, type LoginCredentials, type RegisterData, type AuthResponse } from '../services/APIService';
import { AuthErrorHandler, type AuthError } from '../lib/auth/errorHandling';
import { apiClient } from '../lib/api';

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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Safely construct user display name with fallbacks
const getUserDisplayName = (user: User): string => {
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || 'User'; // Fallback to 'User' if both names are empty
};

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
  console.log('[AuthProvider] Initializing AuthProvider');
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

      // Add timeout to login request
      const response: AuthResponse = await Promise.race([
        APIService.login(credentials),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Login request timeout after 30 seconds')), 30000)
        )
      ]);

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('[AuthContext] Login response user:', response.user, 'role:', response.user.role);
        console.log('[AuthContext] User role type:', typeof response.user.role, 'Value:', JSON.stringify(response.user.role));
      }

      // Store tokens securely
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);

      // Initialize API client with auth tokens
      apiClient.initializeAuth(response.token, response.refreshToken);

      // Store user profile in localStorage for admin components
      const profile = {
        id: typeof response.user.id === 'string' ? parseInt(response.user.id) || 1 : response.user.id,
        name: getUserDisplayName(response.user),
        role: response.user.role,
        avatar: null,
        preferences: {
          professionalStatus: response.user.role === 'admin' ? 'Administrator' :
                             response.user.role === 'moderator' ? 'Moderator' : 'Member'
        }
      };
      localStorage.setItem('currentProfile', JSON.stringify(profile));

      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('[AuthContext] Login successful, stored profile:', profile);
      }

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

      // Initialize API client with auth tokens
      apiClient.initializeAuth(response.token, response.refreshToken);

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
      // Clear tokens, profile, and state regardless of API call success
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentProfile');

      // Clear API client auth tokens
      apiClient.clearAuth();

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
    const userRole = authState.user?.role?.toLowerCase();
    const requiredRole = role.toLowerCase();
    const result = userRole === requiredRole;
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[AuthContext] hasRole check:', { userRole, requiredRole, result });
    }
    return result;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    const userRole = authState.user?.role?.toLowerCase();
    const result = userRole ? roles.map(r => r.toLowerCase()).includes(userRole) : false;
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[AuthContext] hasAnyRole check:', { userRole, roles, result });
    }
    return result;
  };

  // ============================================================================
  // AUTHENTICATION CHECK ON MOUNT
  // ============================================================================

   useEffect(() => {
       const checkAuth = async () => {
         console.log('[AuthContext] Starting auth check on mount');
         const token = localStorage.getItem('authToken');
         const storedRefreshToken = localStorage.getItem('refreshToken');

         console.log('[AuthContext] Token exists:', !!token);
         console.log('[AuthContext] Refresh token exists:', !!storedRefreshToken);

         if (token) {
           console.log('[AuthContext] Found stored token, initializing API client');
           // Initialize API client with stored tokens
           apiClient.initializeAuth(token, storedRefreshToken || undefined);
           try {
             console.log('[AuthContext] About to call APIService.getCurrentUser()');
             const user = await APIService.getCurrentUser();
             console.log('[AuthContext] APIService.getCurrentUser() returned:', user);
             console.log('[AuthContext] User role from API:', user?.role);

           // Store user profile in localStorage for admin components
           const profile = {
             id: typeof user.id === 'string' ? parseInt(user.id) || 1 : user.id,
             name: getUserDisplayName(user),
             role: user.role,
             avatar: null,
             preferences: {
               professionalStatus: user.role === 'admin' ? 'Administrator' :
                                  user.role === 'moderator' ? 'Moderator' : 'Member'
             }
           };
           localStorage.setItem('currentProfile', JSON.stringify(profile));

           if (import.meta.env.DEV) {
             // eslint-disable-next-line no-console
             console.log('[AuthContext] Restored auth, stored profile:', profile);
           }

           console.log('[AuthContext] Auth check successful, setting authenticated state');
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

             // Store user profile in localStorage for admin components
             const profile = {
               id: typeof user.id === 'string' ? parseInt(user.id) || 1 : user.id,
               name: getUserDisplayName(user),
               role: user.role,
               avatar: null,
               preferences: {
                 professionalStatus: user.role === 'admin' ? 'Administrator' :
                                    user.role === 'moderator' ? 'Moderator' : 'Member'
               }
             };
             localStorage.setItem('currentProfile', JSON.stringify(profile));

             if (import.meta.env.DEV) {
               // eslint-disable-next-line no-console
               console.log('[AuthContext] Refreshed auth, stored profile:', profile);
             }

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
         console.log('[AuthContext] No stored token found, setting unauthenticated state');
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
