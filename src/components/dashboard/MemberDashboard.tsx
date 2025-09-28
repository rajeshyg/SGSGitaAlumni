// ============================================================================
// MEMBER DASHBOARD COMPONENT
// ============================================================================
// Main dashboard component with personalized content and widgets

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useDashboardData } from '../../hooks/useDashboardData';
import { StatsOverview } from './StatsOverview';
import { RecentConversations } from './RecentConversations';
import { PersonalizedPosts } from './PersonalizedPosts';
import { QuickActions } from './QuickActions';
import { NotificationsList } from './NotificationsList';

interface MemberDashboardProps {
  userId?: string;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ userId }) => {
  const { data, loading, error, refetch } = useDashboardData(userId);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError error={error} onRetry={refetch} />;
  }

  if (!data) {
    return <DashboardError error="No dashboard data available" onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
            Welcome back, {data.user.firstName}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Here's what's happening in your alumni network
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content Column */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6 order-2 xl:order-1">
            {/* Stats Overview */}
            <StatsOverview stats={data.stats} />

            {/* Recent Conversations */}
            <RecentConversations conversations={data.recentConversations} />

            {/* Personalized Posts */}
            <PersonalizedPosts posts={data.personalizedPosts} />
          </div>

          {/* Sidebar Column */}
          <div className="space-y-4 sm:space-y-6 order-1 xl:order-2">
            {/* Quick Actions */}
            <QuickActions actions={data.quickActions} />

            {/* Notifications */}
            <NotificationsList notifications={data.notifications} />
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
  <div className="min-h-screen bg-gray-50 p-4">
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded w-96 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-64"></div>
      </div>

      {/* Dashboard Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Skeleton */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="text-center">
                    <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Conversations Skeleton */}
          <Card>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-48"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-48"></div>
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
              <div className="h-6 bg-gray-200 rounded w-32"></div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-red-600">Dashboard Error</CardTitle>
        <CardDescription>
          We encountered an issue loading your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded"
        >
          Try Again
        </button>
      </CardContent>
    </Card>
  </div>
);