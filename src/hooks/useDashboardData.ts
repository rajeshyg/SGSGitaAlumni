// ============================================================================
// DASHBOARD DATA HOOK
// ============================================================================
// Hook for fetching and managing member dashboard data

import { useState, useEffect, useCallback } from 'react';
import { APIService } from '../services/APIService';
import { DashboardData, UseDashboardDataReturn } from '../types/dashboard';

export function useDashboardData(userId?: string | number): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dashboard = await APIService.getMemberDashboard(userId);
      setData(dashboard);
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