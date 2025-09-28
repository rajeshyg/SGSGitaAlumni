// ============================================================================
// DASHBOARD PAGE
// ============================================================================
// Main dashboard page component

import React from 'react';
import { MemberDashboard } from '../components/dashboard/MemberDashboard';

const DashboardPage: React.FC = () => {
  // TODO: Get user ID from auth context
  const userId = 'current-user-id'; // Placeholder

  return <MemberDashboard userId={userId} />;
};

export default DashboardPage;