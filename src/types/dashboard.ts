// ============================================================================
// DASHBOARD SYSTEM TYPE DEFINITIONS
// ============================================================================
// TypeScript interfaces for the member dashboard system

import { User } from '../services/APIService';

// ============================================================================
// DASHBOARD DATA TYPES
// ============================================================================

export interface DashboardData {
  user: User;
  stats: DashboardStats;
  recentConversations: ConversationPreview[];
  personalizedPosts: PostingPreview[];
  quickActions: QuickAction[];
  notifications: Notification[];
}

export interface DashboardStats {
  totalConnections: number;
  activePostings: number;
  unreadMessages: number;
  profileViews: number;
}

export interface ConversationPreview {
  id: string;
  participants: User[];
  lastMessage: {
    content: string;
    sender: User;
    timestamp: Date;
  };
  unreadCount: number;
  isOnline: boolean;
}

export interface PostingPreview {
  id: string;
  title: string;
  type: 'job' | 'event' | 'mentorship' | 'news';
  author: User;
  timestamp: Date;
  relevanceScore: number;
  tags: string[];
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  priority: 'high' | 'medium' | 'low';
}

export interface Notification {
  id: string;
  type: 'system' | 'connection' | 'posting' | 'event';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

export interface StatsOverviewProps {
  stats: DashboardStats;
}

export interface RecentConversationsProps {
  conversations: ConversationPreview[];
}

export interface PersonalizedPostsProps {
  posts: PostingPreview[];
}

export interface QuickActionsProps {
  actions: QuickAction[];
}

export interface NotificationsListProps {
  notifications: Notification[];
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface UseDashboardDataReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}
