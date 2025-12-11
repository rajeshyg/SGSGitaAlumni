import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { APIService, type User, type LoginCredentials, type RegisterData, type AuthResponse } from '../services/APIService';
import { AuthErrorHandler, type AuthError } from '../lib/auth/errorHandling';
import { apiClient } from '../lib/api';
import { chatClient } from '../lib/socket/chatClient';
import { switchProfile } from '../services/familyMemberService';

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

// ============================================================================
// STORAGE UTILITIES FOR MOBILE COMPATIBILITY
// ============================================================================

export const StorageUtils = {
  // Check if localStorage is available and working
  isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },

  // Safe localStorage operations with fallback to sessionStorage
  setItem(key: string, value: string): void {
    try {
      if (this.isLocalStorageAvailable()) {
        localStorage.setItem(key, value);
        console.log(`[StorageUtils] ✅ Stored ${key} in localStorage`);
      } else {
        sessionStorage.setItem(key, value);
        console.log(`[StorageUtils] ⚠️ localStorage unavailable, stored ${key} in sessionStorage`);
      }
    } catch (error) {
      console.error(`[StorageUtils] ❌ Failed to store ${key}:`, error);
      // Try sessionStorage as last resort
      try {
        sessionStorage.setItem(key, value);
        console.log(`[StorageUtils] 🔄 Fallback: stored ${key} in sessionStorage`);
      } catch (fallbackError) {
        console.error(`[StorageUtils] ❌ Critical: Failed to store ${key} in any storage:`, fallbackError);
      }
    }
  },

  getItem(key: string): string | null {
    try {
      // Try localStorage first
      if (this.isLocalStorageAvailable()) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          console.log(`[StorageUtils] ✅ Retrieved ${key} from localStorage`);
          return value;
        }
      }

      // Fallback to sessionStorage
      const sessionValue = sessionStorage.getItem(key);
      if (sessionValue !== null) {
        console.log(`[StorageUtils] 🔄 Retrieved ${key} from sessionStorage`);
        return sessionValue;
      }

      console.log(`[StorageUtils] ❌ ${key} not found in any storage`);
      return null;
    } catch (error) {
      console.error(`[StorageUtils] ❌ Failed to retrieve ${key}:`, error);
      return null;
    }
  },

  removeItem(key: string): void {
    try {
      if (this.isLocalStorageAvailable()) {
        localStorage.removeItem(key);
      }
      sessionStorage.removeItem(key);
      console.log(`[StorageUtils] 🗑️ Removed ${key} from all storage`);
    } catch (error) {
      console.error(`[StorageUtils] ❌ Failed to remove ${key}:`, error);
    }
  }
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
  updateTokensAfterProfileSwitch: (token: string, refreshToken: string, activeProfile: any) => void;
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
      }

      // Store tokens and set authenticated state
      StorageUtils.setItem('authToken', response.token);
      StorageUtils.setItem('refreshToken', response.refreshToken);
      apiClient.initializeAuth(response.token, response.refreshToken);
      setAuthState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        authError: null
      });

      // Handle profile selection requirement
      if (response.requiresProfileSelection) {
        console.log('[AuthContext] 🔄 Profile selection required.');
        if (response.profiles) {
          StorageUtils.setItem('availableProfiles', JSON.stringify(response.profiles));
        }
        return response; // Caller will handle redirect
      }
      
      // If no profile selection is needed, proceed with full session setup
      console.log('[AuthContext] Profile already selected or not required.');

      // Initialize chat socket connection
      chatClient.connect(response.token).catch(error => {
        console.error('[AuthContext] Failed to connect chat socket:', error);
      });

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
        console.log('[AuthContext] Login successful, stored profile:', profile);
      }

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

      // Store tokens securely using StorageUtils
      StorageUtils.setItem('authToken', response.token);
      StorageUtils.setItem('refreshToken', response.refreshToken);

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
      StorageUtils.removeItem('authToken');
      StorageUtils.removeItem('refreshToken');
      StorageUtils.removeItem('currentProfile');
      StorageUtils.removeItem('lastSelectedProfileId');
      StorageUtils.removeItem('availableProfiles');

      // Clear API client auth tokens
      apiClient.clearAuth();

      // Disconnect chat socket
      chatClient.disconnect();

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
      StorageUtils.setItem('authToken', response.token);
      StorageUtils.setItem('refreshToken', response.refreshToken);
      
      // Initialize API client with new tokens
      apiClient.initializeAuth(response.token, response.refreshToken);

      // Reconnect chat socket with new token
      chatClient.disconnect();
      chatClient.connect(response.token).catch(error => {
        console.error('[AuthContext] Failed to reconnect chat socket after token refresh:', error);
      });

      // Use user data from refresh response if available, otherwise fetch
      const user = response.user || await APIService.getCurrentUser();
      
      console.log('[AuthContext.refreshToken] 🔍 Updated user data:', {
        name: `${user.firstName} ${user.lastName}`,
        profileId: user.profileId,
        relationship: user.relationship
      });
      
      // Update profile in storage
      const profile = {
        id: typeof user.id === 'string' ? parseInt(user.id) || 1 : user.id,
        name: getUserDisplayName(user),
        role: user.role,
        avatar: user.profileImageUrl || null,
        preferences: {
          professionalStatus: user.role === 'admin' ? 'Administrator' :
                             user.role === 'moderator' ? 'Moderator' : 'Member'
        }
      };
      StorageUtils.setItem('currentProfile', JSON.stringify(profile));
      
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('[AuthContext] 🔄 Token refreshed, user data updated:', {
          name: getUserDisplayName(user),
          role: user.role,
          relationship: user.relationship
        });
      }
      
      // Update auth state with fresh user data
      setAuthState(prev => ({
        ...prev,
        user
      }));
    } catch (error) {
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  };

  const updateTokensAfterProfileSwitch = (token: string, refreshToken: string, activeProfile: any): void => {
    // Store new tokens
    StorageUtils.setItem('authToken', token);
    StorageUtils.setItem('refreshToken', refreshToken);
    
    // Initialize API client with new tokens
    apiClient.initializeAuth(token, refreshToken);

    // Reconnect chat socket
    chatClient.disconnect();
    chatClient.connect(token).catch(error => {
      console.error('[AuthContext] Failed to reconnect chat socket after profile switch:', error);
    });

    // Update user state
    if (authState.user) {
      const updatedUser = {
        ...authState.user,
        profileId: activeProfile.id,
        firstName: activeProfile.firstName,
        lastName: activeProfile.lastName,
        relationship: activeProfile.relationship,
        accessLevel: activeProfile.accessLevel,
        batch: activeProfile.batch,
        centerName: activeProfile.centerName,
        yearOfBirth: activeProfile.yearOfBirth
      };

      setAuthState(prev => ({
        ...prev,
        user: updatedUser
      }));

      // Update localStorage 'currentProfile'
      const profile = {
        id: typeof updatedUser.id === 'string' ? parseInt(updatedUser.id) || 1 : updatedUser.id,
        name: getUserDisplayName(updatedUser),
        role: updatedUser.role,
        avatar: updatedUser.profileImageUrl || null,
        preferences: {
          professionalStatus: updatedUser.role === 'admin' ? 'Administrator' :
                             updatedUser.role === 'moderator' ? 'Moderator' : 'Member'
        }
      };
      StorageUtils.setItem('currentProfile', JSON.stringify(profile));

      // Store last selected profile ID for future logins
      StorageUtils.setItem('lastSelectedProfileId', activeProfile.id);
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
         console.log('[AuthContext] 🔍 Starting authentication check on app load');
         const token = StorageUtils.getItem('authToken');
         const storedRefreshToken = StorageUtils.getItem('refreshToken');

         console.log('[AuthContext] 🔍 Storage check - authToken exists:', !!token, 'length:', token?.length || 0);
         console.log('[AuthContext] 🔍 Storage check - refreshToken exists:', !!storedRefreshToken, 'length:', storedRefreshToken?.length || 0);
         console.log('[AuthContext] 🔍 Available storage keys: localStorage:', Object.keys(localStorage), 'sessionStorage:', Object.keys(sessionStorage));

         if (token) {
           console.log('[AuthContext] ✅ Found auth token, initializing API client...');
           // Initialize API client with stored tokens
           apiClient.initializeAuth(token, storedRefreshToken || undefined);

           // Initialize chat socket connection on auth restore
           chatClient.connect(token).catch(error => {
             console.error('[AuthContext] Failed to connect chat socket on auth restore:', error);
           });

           try {
             console.log('[AuthContext] 🔄 Fetching current user data...');
             const user = await APIService.getCurrentUser();
             console.log('[AuthContext] ✅ User data fetched successfully:', user.email, user.role);

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
           StorageUtils.setItem('currentProfile', JSON.stringify(profile));

           if (import.meta.env.DEV) {
             // eslint-disable-next-line no-console
             console.log('[AuthContext] 🔄 Restored login from cached tokens, user:', user.email);
             console.log('[AuthContext] is_family_account:', user.is_family_account);
           }

           console.log('[AuthContext] ✅ Setting authenticated state with user:', user.email);
           setAuthState({
             user,
             isAuthenticated: true,
             isLoading: false,
             error: null,
             authError: null
           });

           // Check if we need to auto-switch to last selected profile
           if (!user.profileId) {
             const lastSelectedProfileId = StorageUtils.getItem('lastSelectedProfileId');
             if (lastSelectedProfileId) {
               console.log('[AuthContext] 🔄 Found lastSelectedProfileId, attempting auto-switch:', lastSelectedProfileId);
               try {
                 const result = await switchProfile(lastSelectedProfileId);
                 if (result.success && result.token && result.refreshToken && result.activeProfile) {
                   console.log('[AuthContext] ✅ Auto-switched to last selected profile');
                   updateTokensAfterProfileSwitch(result.token, result.refreshToken, result.activeProfile);
                 } else {
                   console.log('[AuthContext] ❌ Auto-switch failed, will require manual selection');
                 }
               } catch (switchError) {
                 console.error('[AuthContext] ❌ Auto-switch error:', switchError);
               }
             }
           }
         } catch (error) {
           console.error('[AuthContext] ❌ Failed to restore auth from token:', error);
           // Token might be expired, try to refresh
           try {
             console.log('[AuthContext] 🔄 Attempting token refresh...');
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
             StorageUtils.setItem('currentProfile', JSON.stringify(profile));

             if (import.meta.env.DEV) {
               // eslint-disable-next-line no-console
               console.log('[AuthContext] Refreshed auth, stored profile:', profile);
             }

             console.log('[AuthContext] ✅ Auth restored via refresh, setting state');
             setAuthState({
               user,
               isAuthenticated: true,
               isLoading: false,
               error: null,
               authError: null
             });
           } catch (refreshError) {
             console.error('[AuthContext] ❌ Token refresh failed, clearing auth:', refreshError);
             // Refresh failed, clear auth state
             await logout();
           }
         }
       } else {
         console.log('[AuthContext] ❌ No auth token found, user not authenticated');
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
    getErrorSuggestion,
    updateTokensAfterProfileSwitch
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

/**
 * Main authentication hook - throws if used outside AuthProvider.
 * Use this in components that MUST have auth context.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (!context) {
    // Enhanced error with debugging info
    const errorMsg = 'useAuth must be used within an AuthProvider. ' +
      'This error often occurs during navigation when components render before context is ready. ' +
      'Check that AuthProvider wraps your Router and all route components.';
    console.error('[AuthContext] Context not found. Component stack may help identify the issue.');
    throw new Error(errorMsg);
  }
  
  return context;
}

/**
 * Safe version of useAuth that returns null instead of throwing.
 * Use this in components that should gracefully handle missing context
 * (e.g., debug panels, error boundaries, components that render during transitions).
 */
export function useAuthSafe(): AuthContextType | null {
  return useContext(AuthContext);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AuthProvider;
