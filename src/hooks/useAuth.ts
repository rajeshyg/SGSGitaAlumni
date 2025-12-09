// ============================================================================
// AUTHENTICATION HOOKS - RE-EXPORT FROM CONTEXT
// ============================================================================
// This file re-exports useAuth from AuthContext for backward compatibility.
// All components should use the context-based authentication hook to ensure
// consistent auth state across the application.
//
// IMPORTANT: Do not implement separate auth state here. The AuthContext
// provides the single source of truth for authentication state.
// ============================================================================

export { useAuth, useAuthSafe, type AuthContextType as AuthState } from '../contexts/AuthContext';
