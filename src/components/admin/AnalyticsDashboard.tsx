// ============================================================================
// ANALYTICS DASHBOARD COMPONENT
// ============================================================================
// Enhanced analytics dashboard for invitation tracking and user engagement

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { APIService } from '../../services/APIService';

interface AnalyticsDashboardProps {}

interface InvitationAnalytics {
  profileCompletion: {
    accepted: number;
    total: number;
    success_rate: number;
  };
  funnel: Array<{
    status: string;
    count: number;
    avgResponseTimeHours: number;
  }>;
  overall: {
    total_invitations: number;
    accepted_invitations: number;
    pending_invitations: number;
    expired_invitations: number;
    user_linked_invitations: number;
    overall_conversion_rate: number;
  };
}

interface ConversionTrend {
  date: string;
  totalSent: number;
  accepted: number;
  conversionRate: number;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = () => {
  const [analytics, setAnalytics] = useState<InvitationAnalytics | null>(null);
  const [trends, setTrends] = useState<ConversionTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  // Use APIService directly (it's an object, not a class)

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    loadConversionTrends();
  }, [selectedPeriod]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use fetch directly for analytics endpoints
      const response = await fetch('/api/analytics/invitations/summary');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversionTrends = async () => {
    try {
      const response = await fetch(`/api/analytics/invitations/conversion-trends?days=${selectedPeriod}`);
      if (!response.ok) {
        throw new Error('Failed to fetch conversion trends');
      }
      const data = await response.json();
      setTrends(data.trends || []);
    } catch (err) {
      console.error('Failed to load conversion trends:', err);
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderMetricCard = (title: string, value: number | string, description: string, color: string = 'blue') => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" style={{ color: `var(--color-${color}-600)` }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );

  const renderProgressCard = (title: string, current: number, total: number, description: string) => {
    const percentage = total > 0 ? (current / total) * 100 : 0;

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold">{current}</span>
            <span className="text-sm text-muted-foreground">of {total}</span>
          </div>
          <Progress value={percentage} className="mb-2" />
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    );
  };

  const renderFunnelStep = (status: string, count: number, avgTime?: number) => {
    const statusColors = {
      pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
      accepted: 'bg-green-500/10 text-green-700 dark:text-green-400',
      expired: 'bg-destructive/10 text-destructive',
      revoked: 'bg-muted text-muted-foreground'
    };

    return (
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center space-x-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-muted text-muted-foreground'}`}>
            {status}
          </span>
          <span className="font-medium">{count} invitations</span>
        </div>
        {avgTime && (
          <span className="text-sm text-muted-foreground">
            Avg: {avgTime.toFixed(1)} hours
          </span>
        )}
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        </div>
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadAnalytics}>Retry</Button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        </div>
        <Alert>
          <AlertDescription>No analytics data available</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <Button onClick={loadAnalytics} variant="outline">
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderMetricCard(
              'Total Invitations',
              analytics.overall.total_invitations,
              'All invitations sent',
              'blue'
            )}
            {renderMetricCard(
              'Accepted Invitations',
              analytics.overall.accepted_invitations,
              'Successfully completed',
              'green'
            )}
            {renderMetricCard(
              'Conversion Rate',
              `${analytics.overall.overall_conversion_rate}%`,
              'Overall success rate',
              'purple'
            )}
            {renderMetricCard(
              'User-Linked Invitations',
              analytics.overall.user_linked_invitations,
              'Linked to existing users',
              'orange'
            )}
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderProgressCard(
              'Accepted',
              analytics.overall.accepted_invitations,
              analytics.overall.total_invitations,
              'Invitations that were accepted'
            )}
            {renderProgressCard(
              'Pending',
              analytics.overall.pending_invitations,
              analytics.overall.total_invitations,
              'Awaiting response'
            )}
            {renderProgressCard(
              'Expired',
              analytics.overall.expired_invitations,
              analytics.overall.total_invitations,
              'Past expiration date'
            )}
          </div>

          {/* Profile Completion Success */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Completion Success</CardTitle>
              <CardDescription>
                Success rate for profile completion invitations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-bold">
                  {analytics.profileCompletion.success_rate}%
                </span>
                <span className="text-sm text-muted-foreground">
                  {analytics.profileCompletion.accepted} of {analytics.profileCompletion.total} completed
                </span>
              </div>
              <Progress value={analytics.profileCompletion.success_rate} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invitation Conversion Funnel</CardTitle>
              <CardDescription>
                Track how invitations move through different statuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.funnel.map((step) => (
                  renderFunnelStep(
                    step.status,
                    step.count,
                    step.avgResponseTimeHours
                  )
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Trends</CardTitle>
              <CardDescription>
                Daily conversion rates over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-sm font-medium">Period:</span>
                <div className="flex space-x-2">
                  {[7, 30, 90].map((days) => (
                    <Button
                      key={days}
                      variant={selectedPeriod === days ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedPeriod(days)}
                    >
                      {days} days
                    </Button>
                  ))}
                </div>
              </div>

              {trends.length > 0 ? (
                <div className="space-y-3">
                  {trends.slice(0, 10).map((trend) => (
                    <div key={trend.date} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <span className="font-medium">{new Date(trend.date).toLocaleDateString()}</span>
                        <span className="text-sm text-muted-foreground">
                          {trend.accepted}/{trend.totalSent} accepted
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium">
                          {trend.conversionRate}%
                        </span>
                        <div className="w-24">
                          <Progress value={trend.conversionRate} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>No trend data available for the selected period</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;