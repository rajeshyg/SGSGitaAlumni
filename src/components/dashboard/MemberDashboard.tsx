// ============================================================================
// MEMBER DASHBOARD COMPONENT
// ============================================================================
// Main dashboard component with personalized content and widgets

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { useAuthSafe } from '../../contexts/AuthContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { DashboardHeader } from './DashboardHeader';
import { DashboardHero } from './DashboardHero';
import { StatsOverview } from './StatsOverview';
import { QuickActions } from './QuickActions';
import { NotificationsList } from './NotificationsList';
import { PendingActions } from './PendingActions';
import { RecommendedConnections } from './RecommendedConnections';
import { OpportunitiesSpotlight } from './OpportunitiesSpotlight';
import { ActivityTimeline } from './ActivityTimeline';
import { DomainFocusCard } from './DomainFocusCard';
import { RecentConversations } from './RecentConversations';
import { PersonalizedPosts } from './PersonalizedPosts';
import FamilyProfileSelector from '../family/FamilyProfileSelector';
import type { User } from '../../services/APIService';

interface MemberDashboardProps {
  userId?: string;
  user?: User;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ userId, user: propUser }) => {
  const { data, loading, error, refetch } = useDashboardData(userId);
  // Use safe version to avoid throwing during navigation transitions
  const authContext = useAuthSafe();
  const authUser = authContext?.user ?? null;
  const logout = authContext?.logout ?? (async () => {});
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);
  const navigate = useNavigate();
  const handleRetry = () => { void refetch(); };

  // Use prop user or auth user
  const currentUser = propUser || authUser;
  
  // Show switch profile button for ALL authenticated users
  // This allows them to access the profile management page even if they have 1 profile
  // MIGRATED: Removed obsolete is_family_account check. All users can manage profiles.
  const isFamilyAccount = true;

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError error={error} onRetry={handleRetry} />;
  }

  if (!data || !currentUser) {
    return <DashboardError error="No dashboard data available" onRetry={handleRetry} />;
  }

  // Prepare profile for DashboardHeader
  const currentProfile = {
    id: currentUser.id,
    name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email || 'User',
    role: currentUser.role || 'member',
    avatar: data.summary?.avatarUrl || undefined,
    preferences: {
      professionalStatus: data.summary?.currentPosition || undefined
    }
  };

  // Prepare stats for DashboardHeader
  const headerStats = {
    notifications: { unread: data.notifications?.length || 0 },
    chat: { totalUnread: 0 } // TODO: Add unread messages count when chat feature is implemented
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Logout failed:', error);
      }
    }
  };

  const handleSwitchProfile = () => {
    console.log('[MemberDashboard] Navigating to profile management...');
    navigate('/onboarding');
  };

  const handleProfileSelected = () => {
    console.log('[MemberDashboard] Profile selected, reloading dashboard...');
    setShowProfileSwitcher(false);
    void refetch(); // Reload dashboard data
  };

  // Show profile switcher modal if active (legacy - can be removed if not needed)
  if (showProfileSwitcher) {
    return (
      <FamilyProfileSelector 
        onProfileSelected={handleProfileSelected}
        showAddButton={false}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <DashboardHeader
        currentProfile={currentProfile}
        stats={headerStats}
        isFamilyAccount={isFamilyAccount}
        onSwitchProfile={handleSwitchProfile}
        onLogout={handleLogout}
      />

      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 w-full">
          <DashboardHero summary={data.summary} />

          {/* Unified Dashboard - No Tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 w-full">
            <div className="lg:col-span-8 xl:col-span-9 space-y-4 sm:space-y-6 order-2 lg:order-1 w-full">
              <StatsOverview stats={data.stats} />
              <PersonalizedPosts userId={userId || ''} limit={5} />
              <OpportunitiesSpotlight
                matched={data.opportunities.matched}
                trending={data.opportunities.trending}
              />
              <ActivityTimeline items={data.recentActivity} />
            </div>

            <div className="lg:col-span-4 xl:col-span-3 space-y-4 sm:space-y-6 order-1 lg:order-2 w-full">
              <QuickActions actions={data.quickActions} />
              <RecentConversations userId={userId} />
              <PendingActions actions={data.pendingActions} />
              <NotificationsList notifications={data.notifications} profileCompletion={data.summary?.profileCompletion} />
              <DomainFocusCard focus={data.domainFocus} />
              <RecommendedConnections connections={data.recommendedConnections} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SKELETON LOADING COMPONENT
// ============================================================================

const DashboardSkeleton: React.FC = () => (
  <div className="min-h-screen bg-background p-4">
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Skeleton */}
      <div className="mb-8">
        <Skeleton className="h-8 w-96 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Dashboard Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Skeleton */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="text-center space-y-2">
                    <Skeleton className="h-8 w-16 mx-auto" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Conversations Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton variant="circular" className="h-10 w-10" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Quick Actions Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// ERROR DISPLAY COMPONENT
// ============================================================================

interface DashboardErrorProps {
  error: string;
  onRetry: () => void;
}

const DashboardError: React.FC<DashboardErrorProps> = ({ error, onRetry }) => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-destructive">Dashboard Error</CardTitle>
        <CardDescription>
          We encountered an issue loading your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button type="button"
          onClick={onRetry}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded"
        >
          Try Again
        </button>
      </CardContent>
    </Card>
  </div>
);