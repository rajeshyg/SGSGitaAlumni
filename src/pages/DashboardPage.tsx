// ============================================================================
// DASHBOARD PAGE
// ============================================================================
// Main dashboard page component

import React from 'react';
import { MemberDashboard } from '../components/dashboard/MemberDashboard';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  console.log('[DashboardPage] Render - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user);

  // Show loading state while auth is being checked
  if (isLoading) {
    console.log('[DashboardPage] Showing loading state');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    console.log('[DashboardPage] Not authenticated, showing login prompt');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  console.log('[DashboardPage] Authenticated, rendering MemberDashboard with userId:', user.id);
  return <MemberDashboard userId={user.id} />;
};

export default DashboardPage;