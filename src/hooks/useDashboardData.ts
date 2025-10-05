// ============================================================================
// DASHBOARD DATA HOOK
// ============================================================================
// Hook for fetching and managing member dashboard data

import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { APIService } from '../services/APIService';
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
  const [data, setData] = useState<DashboardData | null>(getDefaultDashboardData());
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

      // Fetch user data using authenticated endpoint
      const user = await APIService.getCurrentUser();

      // Fetch all dashboard data in parallel (using mock endpoints for now)
      const [statsResponse, conversationsResponse, postsResponse, notificationsResponse] = await Promise.allSettled([
        apiClient.get(`/api/users/${userId}/stats`),
        apiClient.get(`/api/conversations/recent?userId=${userId}&limit=5`),
        apiClient.get(`/api/posts/personalized?userId=${userId}&limit=10`),
        apiClient.get(`/api/notifications?userId=${userId}&limit=5`)
      ]);

      // Extract successful responses
      console.log('API responses:', { statsResponse, conversationsResponse, postsResponse, notificationsResponse });
      const stats = statsResponse.status === 'fulfilled' ? statsResponse.value : getDefaultStats();
      const conversations = conversationsResponse.status === 'fulfilled' ? conversationsResponse.value : [];
      const posts = postsResponse.status === 'fulfilled' ? postsResponse.value : [];
      const notifications = notificationsResponse.status === 'fulfilled' ? notificationsResponse.value : [];
      console.log('Extracted data:', { stats, conversations, posts, notifications });

      const dashboardData: DashboardData = {
        user,
        stats,
        recentConversations: conversations,
        personalizedPosts: posts,
        quickActions: generateQuickActions(user),
        notifications
      };

      console.log('Final dashboardData:', dashboardData);
      setData(dashboardData);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
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

function getDefaultDashboardData(): DashboardData | null {
  return null; // Keep as null for now, will change after fixing property names
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