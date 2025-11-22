# Task 7.11: Analytics Dashboard

**Status:** 🟡 Planned
**Priority:** Medium
**Duration:** 2 weeks (10 days)
**Parent Task:** Phase 7 - Administrative Tools
**Related:** [Task 8.12: Violation Corrections](../phase-8/task-8.12-violation-corrections.md) - Action 12

## Overview
Create comprehensive analytics dashboard for administrators to monitor platform usage, user activity, popular categories, success metrics, and help request statistics.

## Functional Requirements

### Dashboard Metrics

#### 1. User Activity
- **Total Active Users:** Daily/Weekly/Monthly active users
- **Login Frequency:** Average logins per user
- **Registration Trends:** New user signups over time
- **User Retention:** Cohort retention analysis
- **Session Duration:** Average time spent on platform

#### 2. Posting Activity
- **Total Postings:** Count by domain/category
- **Posting Status:** Pending, Approved, Rejected breakdown
- **Response Rate:** Percentage of postings with responses
- **Average Response Time:** Time to first response
- **Completion Rate:** Percentage of resolved help requests

#### 3. Popular Categories
- **Most Active Domains:** Job postings, mentorship, etc.
- **Trending Topics:** Rising categories week-over-week
- **Tag Analysis:** Most used tags
- **Geographic Distribution:** User locations (if available)

#### 4. Help Request Statistics
- **Total Requests:** Count by type
- **Success Rate:** Percentage successfully resolved
- **Average Resolution Time:** Time from post to resolution
- **Repeat Requesters:** Users with multiple requests
- **Top Helpers:** Users providing most assistance

#### 5. Chat & Messaging Statistics (Post-Task 7.10)
- **Total Conversations:** Active chat count
- **Messages Sent:** Daily message volume
- **Response Rate:** Percentage of messages replied to
- **Average Response Time:** Time to first reply

### Visualizations

- **Line Charts:** User growth, posting trends over time
- **Bar Charts:** Domain distribution, category popularity
- **Pie Charts:** Posting status breakdown, user roles
- **Heat Maps:** Activity by time of day/day of week
- **Tables:** Top users, recent activity, moderation queue

## Technical Requirements

### Database Queries

```sql
-- Daily Active Users
CREATE VIEW daily_active_users AS
SELECT 
  DATE(last_login) as activity_date,
  COUNT(DISTINCT id) as active_users
FROM app_users
WHERE last_login >= NOW() - INTERVAL '30 days'
GROUP BY DATE(last_login)
ORDER BY activity_date DESC;

-- Posting Statistics
CREATE VIEW posting_statistics AS
SELECT 
  d.domain_name,
  COUNT(p.id) as total_postings,
  COUNT(CASE WHEN p.moderation_status = 'APPROVED' THEN 1 END) as approved,
  COUNT(CASE WHEN p.moderation_status = 'PENDING' THEN 1 END) as pending,
  COUNT(CASE WHEN p.moderation_status = 'REJECTED' THEN 1 END) as rejected,
  AVG(EXTRACT(EPOCH FROM (p.moderated_at - p.created_at))/3600) as avg_review_hours
FROM POSTINGS p
  JOIN DOMAINS d ON p.domain_id = d.id
GROUP BY d.domain_name;

-- Top Contributors
CREATE VIEW top_contributors AS
SELECT 
  au.id,
  au.first_name || ' ' || au.last_name as name,
  COUNT(DISTINCT p.id) as postings_created,
  COUNT(DISTINCT c.id) as responses_given
FROM app_users au
  LEFT JOIN POSTINGS p ON au.id = p.created_by
  LEFT JOIN MESSAGES c ON au.id = c.sender_id
GROUP BY au.id, au.first_name, au.last_name
ORDER BY responses_given DESC
LIMIT 50;
```

### API Endpoints

```typescript
// GET /api/analytics/overview - Dashboard summary
interface OverviewResponse {
  success: true;
  data: {
    users: {
      total: number;
      activeToday: number;
      activeThisWeek: number;
      activeThisMonth: number;
      newThisWeek: number;
    };
    postings: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      avgResponseTime: number;
    };
    conversations: {
      total: number;
      activeToday: number;
      messagesThisWeek: number;
    };
  };
}

// GET /api/analytics/user-activity?period=30d
// GET /api/analytics/posting-trends?domain=all&period=90d
// GET /api/analytics/popular-domains
// GET /api/analytics/help-requests?status=all
// GET /api/analytics/top-contributors?limit=50
```

### Frontend Components

```typescript
// Location: src/pages/admin/AnalyticsDashboard.tsx

export function AnalyticsDashboard() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Active Users" 
          value={stats.users.activeToday}
          change="+12% vs last week"
          icon={Users}
        />
        <MetricCard 
          title="Pending Review" 
          value={stats.postings.pending}
          change="5 urgent"
          icon={Clock}
        />
        <MetricCard 
          title="Approved Today" 
          value={stats.postings.approvedToday}
          change="+8% vs yesterday"
          icon={CheckCircle}
        />
        <MetricCard 
          title="Response Rate" 
          value="87%"
          change="+3% this month"
          icon={MessageCircle}
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={userGrowthData} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Posting Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart data={postingDistributionData} />
          </CardContent>
        </Card>
      </div>
      
      {/* Top Contributors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Contributors</CardTitle>
        </CardHeader>
        <CardContent>
          <ContributorsTable data={topContributors} />
        </CardContent>
      </Card>
    </div>
  );
}
```

### Charting Library

```typescript
// Use Recharts for data visualization
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
```

## Implementation Plan

### Week 1: Backend & Data
- Days 1-2: Create analytics database views
- Days 3-4: Build analytics API endpoints
- Day 5: Data aggregation and caching

### Week 2: Frontend & Visualization
- Days 6-7: Dashboard page layout and metric cards
- Days 8-9: Chart integration with Recharts
- Day 10: Testing and optimization

## Success Criteria

- [ ] Dashboard displays real-time user activity
- [ ] Charts show posting trends over time
- [ ] Popular domains/categories identified
- [ ] Top contributors visible
- [ ] Help request statistics accurate
- [ ] Chat analytics integrated (post-Task 7.10)
- [ ] Dashboard loads in <2 seconds
- [ ] Mobile-responsive layout

## Dependencies

### Required Before Starting
- Analytics database views
- User activity tracking
- Posting statistics available

### Required for Full Implementation
- [Task 7.10: Chat System](./task-7.10-chat-system.md) - Chat data needed

## Related Documentation
- [Task 8.12: Violation Corrections](../phase-8/task-8.12-violation-corrections.md)
- [Phase 7 README](./README.md)

---

*This task provides administrators with comprehensive insights into platform usage and performance.*
