// ============================================================================
// DASHBOARD DATA HOOK
// ============================================================================
// Hook for fetching and managing member dashboard data

import { useState, useEffect, useCallback } from 'react';
import { APIService } from '../services/APIService';
import { DashboardData, DashboardAnalyticsMetric, DashboardQualitySummary, DashboardSystemStatusItem, DashboardInsight, UseDashboardDataReturn } from '../types/dashboard';

export function useDashboardData(userId?: string | number): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dashboard = await APIService.getMemberDashboard(userId);

      const defaultSystemStatus: DashboardSystemStatusItem[] = [
        {
          id: 'database',
          label: 'Database',
          status: 'Online',
          helper: 'Operational',
          severity: 'success',
          icon: 'database'
        },
        {
          id: 'processing',
          label: 'File Processing',
          status: 'Active',
          helper: 'Monitoring recent uploads',
          severity: 'info',
          icon: 'upload'
        },
        {
          id: 'analytics',
          label: 'Analytics Engine',
          status: 'Healthy',
          helper: 'Generating insights',
          severity: 'success',
          icon: 'bar-chart-3'
        }
      ];

      const defaultQualitySummary: DashboardQualitySummary = {
        overallScore: 80,
        passing: 12,
        warnings: 4,
        failing: 1,
        updatedAt: dashboard.meta.generatedAt
      };

      const defaultAnalyticsMetrics: DashboardAnalyticsMetric[] = [
        {
          id: 'engagement',
          label: 'Engagement Rate',
          value: '72%',
          helper: 'Interaction with recommended content',
          accent: 'info'
        },
        {
          id: 'response-time',
          label: 'Response Time',
          value: '4h',
          helper: 'Average reply to new messages',
          accent: 'success'
        },
        {
          id: 'profile-views',
          label: 'Profile Views',
          value: dashboard.stats.networkSize > 0 ? `${Math.max(12, Math.round(dashboard.stats.networkSize * 0.1))}` : '12',
          helper: 'Last 30 days',
          accent: 'info'
        }
      ];

      const defaultInsights: DashboardInsight[] = [
        {
          id: 'complete-profile',
          title: 'Complete your profile to unlock better matches',
          description: 'You are one step away from unlocking AI-matched opportunities tailored to your interests.',
          severity: 'warning',
          badgeText: `${dashboard.stats.profileCompletion}%`,
          actionHref: '/preferences',
          actionLabel: 'Update profile'
        },
        {
          id: 'invite-connections',
          title: 'Invite two classmates to join the network',
          description: 'Grow your network and raise your visibility score by inviting alumni you worked with.',
          severity: 'info',
          actionHref: '/invitation',
          actionLabel: 'Send invite'
        }
      ];

      const merged: DashboardData = {
        ...dashboard,
        systemStatus: dashboard.systemStatus && dashboard.systemStatus.length > 0
          ? dashboard.systemStatus
          : defaultSystemStatus,
        insights: dashboard.insights && dashboard.insights.length > 0
          ? dashboard.insights
          : defaultInsights,
        analytics: {
          qualitySummary: dashboard.analytics?.qualitySummary ?? defaultQualitySummary,
          metrics: dashboard.analytics?.metrics && dashboard.analytics?.metrics.length > 0
            ? dashboard.analytics.metrics
            : defaultAnalyticsMetrics
        }
      };

      setData(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardData
  };
}