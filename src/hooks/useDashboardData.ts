// ============================================================================
// DASHBOARD DATA HOOK
// ============================================================================
// Hook for fetching and managing member dashboard data

import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import {
  DashboardData,
  DashboardStats,
  ConversationPreview,
  PostingPreview,
  QuickAction,
  Notification,
  UseDashboardDataReturn
} from '../types/dashboard';
import { User } from '../services/APIService';

export function useDashboardData(userId?: string): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!userId) {
      setError('User ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data in parallel
      const [userResponse, statsResponse, conversationsResponse, postsResponse, notificationsResponse] = await Promise.allSettled([
        apiClient.get('/api/users/current'),
        apiClient.get(`/api/users/${userId}/stats`),
        apiClient.get(`/api/conversations/recent?userId=${userId}&limit=5`),
        apiClient.get(`/api/posts/personalized?userId=${userId}&limit=10`),
        apiClient.get(`/api/notifications?userId=${userId}&limit=5`)
      ]);

      // Extract successful responses
      const user = userResponse.status === 'fulfilled' ? userResponse.value.data : null;
      const stats = statsResponse.status === 'fulfilled' ? statsResponse.value.data : getDefaultStats();
      const conversations = conversationsResponse.status === 'fulfilled' ? conversationsResponse.value.data : [];
      const posts = postsResponse.status === 'fulfilled' ? postsResponse.value.data : [];
      const notifications = notificationsResponse.status === 'fulfilled' ? notificationsResponse.value.data : [];

      if (!user) {
        throw new Error('Failed to load user data');
      }

      const dashboardData: DashboardData = {
        user,
        stats,
        recentConversations: conversations,
        personalizedPosts: posts,
        quickActions: generateQuickActions(user),
        notifications
      };

      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  return {
    data,
    loading,
    error,
    refetch
  };
}

// Helper functions

function getDefaultStats(): DashboardStats {
  return {
    totalConnections: 0,
    activePostings: 0,
    unreadMessages: 0,
    profileViews: 0
  };
}

function generateQuickActions(user: User): QuickAction[] {
  return [
    {
      id: 'create-posting',
      label: 'Create Posting',
      icon: 'plus',
      action: () => {
        // Navigate to posting creation
        window.location.href = '/postings/create';
      },
      priority: 'high'
    },
    {
      id: 'find-alumni',
      label: 'Find Alumni',
      icon: 'search',
      action: () => {
        // Navigate to directory
        window.location.href = '/directory';
      },
      priority: 'high'
    },
    {
      id: 'start-conversation',
      label: 'Start Conversation',
      icon: 'message',
      action: () => {
        // Navigate to messaging
        window.location.href = '/messages';
      },
      priority: 'medium'
    },
    {
      id: 'update-profile',
      label: 'Update Profile',
      icon: 'user',
      action: () => {
        // Navigate to profile editing
        window.location.href = '/profile/edit';
      },
      priority: 'medium'
    }
  ];
}