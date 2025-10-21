export type DashboardActionPriority = 'high' | 'medium' | 'low' | 'secondary';

export interface DashboardSummary {
  greeting: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  memberSince: string | null;
  profileCompletion: number;
  missingProfileFields: string[];
  primaryDomain: DashboardDomain | null;
  graduationYear: number | string | null;
  location: string | null;
  currentPosition: string | null;
  company: string | null;
}

export interface DashboardStats {
  networkSize: number;
  activeOpportunities: number;
  matchedOpportunities: number;
  pendingInvitations: number;
  profileCompletion: number;
  invitationsSent: number;
}

export interface DashboardQuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  href: string;
  priority: DashboardActionPriority;
  badge?: string;
}

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string | Date;
  level: 'info' | 'success' | 'warning';
  actionHref?: string;
  isRead: boolean;
}

export interface DashboardPendingAction {
  id: string;
  title: string;
  description: string;
  progress: number;
  href: string;
  priority: DashboardActionPriority;
}

export interface DashboardConnectionSuggestion {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  position: string | null;
  company: string | null;
  location: string | null;
  avatarUrl: string | null;
  lastActiveAt: string | null;
  sharedAttributes: string[];
}

export interface DashboardOpportunity {
  id: string;
  title: string;
  type: string | null;
  location: string | null;
  urgency: string | null;
  viewCount?: number | null;
  interestCount?: number | null;
  createdAt?: string | null;
}

export interface DashboardActivityItem {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  actor: string | null;
  timestamp: string | Date | null;
}

export interface DashboardDomain {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  colorCode?: string | null;
  domainLevel?: string | null;
  parentDomainId?: string | null;
}

export interface DashboardData {
  summary: DashboardSummary;
  stats: DashboardStats;
  quickActions: DashboardQuickAction[];
  notifications: DashboardNotification[];
  pendingActions: DashboardPendingAction[];
  recommendedConnections: DashboardConnectionSuggestion[];
  opportunities: {
    matched: DashboardOpportunity[];
    trending: DashboardOpportunity[];
  };
  recentActivity: DashboardActivityItem[];
  domainFocus: {
    primary: DashboardDomain | null;
    secondary: DashboardDomain[];
    interests: DashboardDomain[];
  } | null;
  meta: {
    generatedAt: string;
  };
}

export interface StatsOverviewProps {
  stats: DashboardStats;
}

export interface QuickActionsProps {
  actions: DashboardQuickAction[];
}

export interface NotificationsListProps {
  notifications: DashboardNotification[];
}

export interface DashboardPendingActionsProps {
  actions: DashboardPendingAction[];
}

export interface RecommendedConnectionsProps {
  connections: DashboardConnectionSuggestion[];
}

export interface OpportunitiesSpotlightProps {
  matched: DashboardOpportunity[];
  trending: DashboardOpportunity[];
}

export interface ActivityTimelineProps {
  items: DashboardActivityItem[];
}

export interface DomainFocusCardProps {
  focus: DashboardData['domainFocus'];
}

export interface DashboardHeroProps {
  summary: DashboardSummary;
}

export interface UseDashboardDataReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
