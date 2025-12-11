import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useAuthSafe } from '../../contexts/AuthContext';

// ============================================================================
// PROTECTED ROUTE TYPES
// ============================================================================

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

// ============================================================================
// PROTECTED ROUTE COMPONENT
// ============================================================================

export function ProtectedRoute({
  children,
  requiredRole,
  fallback,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  // Use safe version to avoid throwing during navigation transitions
  // This allows graceful handling when context is temporarily unavailable
  const authContext = useAuthSafe();
  const location = useLocation();
  
  // If auth context is not available (during transition), show loading
  if (!authContext) {
    console.warn('🔐 ProtectedRoute: Auth context not available, showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }
  
  const { isAuthenticated, isLoading, user, hasRole, hasAnyRole } = authContext;
  const isOnboardingPath = location.pathname.startsWith('/onboarding')
    || location.pathname.startsWith('/profile-completion')
    || location.pathname.startsWith('/family-setup');

  console.log('🔐 ProtectedRoute: Check - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user, 'requiredRole:', requiredRole);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // AUTHENTICATION CHECK
  // ============================================================================

  if (!isAuthenticated) {
    // Redirect to login with the current location
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Enforce profile selection before accessing protected content
  // If user is authenticated but has no activeProfileId, redirect to onboarding
  if (isAuthenticated && !user?.profileId && !isOnboardingPath && location.pathname !== '/onboarding') {
    console.log('🔐 ProtectedRoute: User authenticated but no active profile, redirecting to onboarding');
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  // ============================================================================
  // ROLE-BASED ACCESS CONTROL
  // ============================================================================

  if (requiredRole && user) {
    const hasRequiredRole = Array.isArray(requiredRole) 
      ? hasAnyRole(requiredRole)
      : hasRole(requiredRole);

    if (!hasRequiredRole) {
      // User is authenticated but doesn't have required role
      if (fallback) {
        return <>{fallback}</>;
      }

      // Default unauthorized page
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="text-6xl">🔒</div>
            <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
            <p className="text-muted-foreground max-w-md">
              You don't have permission to access this page. Please contact an administrator if you believe this is an error.
            </p>
            <div className="space-x-4">
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Go Back
              </button>
              <Navigate to="/admin" replace />
            </div>
          </div>
        </div>
      );
    }
  }

  // ============================================================================
  // RENDER PROTECTED CONTENT
  // ============================================================================

  return <>{children}</>;
}

// ============================================================================
// ROLE-SPECIFIC PROTECTED ROUTE COMPONENTS
// ============================================================================

export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  console.log('🔐 AdminRoute: Checking admin access');
  return (
    <ProtectedRoute requiredRole="admin" {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function ModeratorRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole={['admin', 'moderator']} {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function MemberRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRole'>) {
  return (
    <ProtectedRoute requiredRole={['admin', 'moderator', 'member']} {...props}>
      {children}
    </ProtectedRoute>
  );
}

// ============================================================================
// PUBLIC ROUTE COMPONENT (Redirects authenticated users)
// ============================================================================

export interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function PublicRoute({ children, redirectTo = '/dashboard' }: PublicRouteProps) {
  // Use safe version to avoid throwing during navigation transitions
  const authContext = useAuthSafe();
  const location = useLocation();

  // If auth context is not available (during transition), render children
  // Public routes should be accessible even if context is initializing
  if (!authContext) {
    console.warn('🔄 PublicRoute: Auth context not available, rendering children');
    return <>{children}</>;
  }
  
  const { isAuthenticated, isLoading, user } = authContext;

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // REDIRECT AUTHENTICATED USERS
  // ============================================================================

  if (isAuthenticated) {
    // Get the intended destination from location state
    const from = (location.state as any)?.from?.pathname;

    // Only use 'from' if it exists and is NOT a public route (login, register, etc.)
    // This prevents infinite loops when navigating back from protected routes
    const publicRoutes = ['/login', '/register', '/forgot-password', '/verify-otp'];
    const isFromPublicRoute = from && publicRoutes.includes(from);

    // Use 'from' only if it's a valid protected route, otherwise use default redirectTo
    const destination = from && !isFromPublicRoute ? from : redirectTo;

    // If the user has no active profile, force them to onboarding regardless of destination
    const finalDestination = !user?.profileId ? '/onboarding' : destination;

    console.log('🔄 PublicRoute: Redirecting authenticated user from', location.pathname, 'to', finalDestination);

    return <Navigate to={finalDestination} replace />;
  }

  // ============================================================================
  // RENDER PUBLIC CONTENT
  // ============================================================================

  return <>{children}</>;
}

// ============================================================================
// ROUTE GUARD HOOK
// ============================================================================

export function useRouteGuard() {
  const { isAuthenticated, user, hasRole, hasAnyRole } = useAuth();

  const canAccess = (requiredRole?: string | string[]): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }

    if (!requiredRole) {
      return true;
    }

    return Array.isArray(requiredRole) 
      ? hasAnyRole(requiredRole)
      : hasRole(requiredRole);
  };

  const getAccessLevel = (): 'guest' | 'member' | 'moderator' | 'admin' => {
    if (!isAuthenticated || !user) {
      return 'guest';
    }

    return user.role as 'member' | 'moderator' | 'admin';
  };

  return {
    canAccess,
    getAccessLevel,
    isAuthenticated,
    user
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ProtectedRoute;
