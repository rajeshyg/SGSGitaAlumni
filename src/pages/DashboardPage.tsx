// ============================================================================
// DASHBOARD PAGE
// ============================================================================
// Main dashboard page component

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MemberDashboard } from '../components/dashboard/MemberDashboard';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  console.log('[DashboardPage] Render - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user);

  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const hasValidUser = Boolean(user?.id && user?.email);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('[DashboardPage] User not authenticated, redirecting to /login');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && isAdmin) {
      console.log('[DashboardPage] Admin user detected, redirecting to /admin');
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    console.log('[DashboardPage] Showing loading state');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[DashboardPage] Awaiting redirect for unauthenticated user');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    console.log('[DashboardPage] Admin user, showing redirect loading');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Redirecting to admin panel...</p>
        </div>
      </div>
    );
  }

  if (!hasValidUser) {
    console.log('[DashboardPage] Authenticated but user profile incomplete, showing fallback');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">
            We&apos;re loading your profile details. If this message persists, please refresh the page or contact support.
          </p>
        </div>
      </div>
    );
  }

  const currentUser = user!;

  console.log('[DashboardPage] Authenticated member user, rendering MemberDashboard with userId:', currentUser.id);
  return <MemberDashboard userId={currentUser.id} />;
};

export default DashboardPage;