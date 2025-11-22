# Task 8.8: Inactivity Management System

**Status:** 🟡 Planned
**Priority:** Medium
**Duration:** 1 week
**Dependencies:** Task 8.3 (Rating Structure)

## Overview
Implement automated inactivity management system with 30-day notification workflows, account deactivation policies, and Gold Star exemptions based on meeting requirements.

## Requirements Analysis

### Business Requirements from Meeting
- **30-Day Inactivity Rule:** Users not logged in for 30 days receive notification
- **Activity Tracking:** Monitor application activity, not just login
- **Gold Star Exemption:** Gold Star users exempt from deactivation
- **Confirmation Process:** Users can confirm continuation vs. deactivation
- **Automated Workflow:** System handles notifications and deactivation automatically

### Inactivity Management Policies
1. **15-Day Warning:** First notification at 15 days of inactivity
2. **30-Day Final Notice:** Final warning at 30 days
3. **45-Day Deactivation:** Account deactivation for non-Gold Star users
4. **Gold Star Protection:** Gold Star users never auto-deactivated
5. **Reactivation Process:** Simple reactivation for deactivated accounts

## Database Schema Implementation

### New USER_ACTIVITY_LOG Table
```sql
CREATE TABLE USER_ACTIVITY_LOG (
    uuid id PK,
    uuid user_id FK,
    enum activity_type "login,logout,post_create,post_view,message_send,message_read,profile_update,search,help_request,help_provide",
    timestamp activity_at,
    string ip_address,
    string user_agent,
    json activity_metadata, -- Additional context data
    string session_id,
    integer duration_seconds -- For activities with duration
);
```

### New INACTIVITY_NOTIFICATIONS Table
```sql
CREATE TABLE INACTIVITY_NOTIFICATIONS (
    uuid id PK,
    uuid user_id FK,
    integer days_inactive,
    enum notification_type "warning_15,warning_30,final_notice,deactivation_notice",
    timestamp sent_at,
    boolean user_responded DEFAULT FALSE,
    timestamp response_at,
    enum response_type "continue_account,deactivate_account,extend_grace_period",
    string response_token UK, -- For email response links
    timestamp token_expires_at,
    boolean is_processed DEFAULT FALSE
);
```

### New ACCOUNT_DEACTIVATIONS Table
```sql
CREATE TABLE ACCOUNT_DEACTIVATIONS (
    uuid id PK,
    uuid user_id FK,
    enum deactivation_reason "inactivity,user_request,policy_violation,admin_action",
    timestamp deactivated_at,
    uuid deactivated_by FK, -- System or admin user
    integer days_inactive_at_deactivation,
    json deactivation_metadata,
    boolean is_reactivatable DEFAULT TRUE,
    timestamp reactivation_deadline, -- After which data may be purged
    timestamp reactivated_at,
    uuid reactivated_by FK
);
```

### New ACTIVITY_SUMMARY Table
```sql
CREATE TABLE ACTIVITY_SUMMARY (
    uuid id PK,
    uuid user_id FK,
    date summary_date,
    integer login_count,
    integer post_count,
    integer message_count,
    integer help_activities,
    integer total_activities,
    integer session_duration_minutes,
    timestamp last_activity_at,
    boolean is_active_day DEFAULT FALSE -- Day with meaningful activity
);
```

### Modified USERS Table
```sql
ALTER TABLE USERS ADD COLUMN:
- timestamp last_activity_at,
- integer consecutive_inactive_days DEFAULT 0,
- enum activity_status "active,warning,final_notice,deactivated",
- boolean inactivity_exempt DEFAULT FALSE, -- For Gold Star users
- timestamp next_inactivity_check,
- json inactivity_preferences -- User preferences for notifications
```

## Implementation Components

### 1. Activity Tracking Service
```typescript
interface ActivityTrackingService {
  recordActivity(userId: string, activityType: ActivityType, metadata?: any): Promise<void>;
  getLastActivity(userId: string): Promise<Date | null>;
  getActivitySummary(userId: string, timeframe: TimeFrame): Promise<ActivitySummary>;
  calculateInactiveDays(userId: string): Promise<number>;
  isUserActive(userId: string, threshold: number): Promise<boolean>;
  generateDailyActivitySummary(date: Date): Promise<void>;
}

interface ActivitySummary {
  userId: string;
  timeframe: TimeFrame;
  totalActivities: number;
  loginCount: number;
  postCount: number;
  messageCount: number;
  helpActivities: number;
  lastActivity: Date;
  averageDailyActivity: number;
  activeDays: number;
}

type ActivityType = 
  | 'login' | 'logout' | 'post_create' | 'post_view' 
  | 'message_send' | 'message_read' | 'profile_update' 
  | 'search' | 'help_request' | 'help_provide';

type TimeFrame = 'day' | 'week' | 'month' | 'quarter' | 'year';
```

### 2. Inactivity Management Service
```typescript
interface InactivityManagementService {
  checkUserInactivity(userId: string): Promise<InactivityStatus>;
  processInactivityNotifications(): Promise<NotificationResult[]>;
  sendInactivityWarning(userId: string, warningType: WarningType): Promise<void>;
  processUserResponse(responseToken: string, response: UserResponse): Promise<void>;
  deactivateInactiveUsers(): Promise<DeactivationResult[]>;
  reactivateUser(userId: string, reactivatedBy: string): Promise<void>;
  exemptFromInactivity(userId: string, reason: string): Promise<void>;
}

interface InactivityStatus {
  userId: string;
  daysSinceLastActivity: number;
  activityStatus: 'active' | 'warning' | 'final_notice' | 'deactivated';
  isExempt: boolean;
  nextAction: InactivityAction;
  nextActionDate: Date;
}

interface InactivityAction {
  type: 'send_warning' | 'send_final_notice' | 'deactivate' | 'none';
  scheduledFor: Date;
  description: string;
}

interface UserResponse {
  type: 'continue_account' | 'deactivate_account' | 'extend_grace_period';
  reason?: string;
  extendDays?: number;
}

type WarningType = 'warning_15' | 'warning_30' | 'final_notice';
```

### 3. Notification Service
```typescript
interface InactivityNotificationService {
  sendWarningEmail(userId: string, warningType: WarningType): Promise<void>;
  sendFinalNoticeEmail(userId: string): Promise<void>;
  sendDeactivationNoticeEmail(userId: string): Promise<void>;
  sendReactivationWelcomeEmail(userId: string): Promise<void>;
  generateResponseToken(userId: string, notificationType: string): Promise<string>;
  validateResponseToken(token: string): Promise<TokenValidation>;
}

interface TokenValidation {
  isValid: boolean;
  userId: string;
  notificationType: string;
  expiresAt: Date;
  alreadyUsed: boolean;
}
```

## Automated Workflow Implementation

### 1. Daily Inactivity Check Job
```typescript
interface DailyInactivityJob {
  run(): Promise<JobResult>;
  identifyInactiveUsers(): Promise<InactiveUser[]>;
  processWarnings(): Promise<WarningResult[]>;
  processFinalNotices(): Promise<NoticeResult[]>;
  processDeactivations(): Promise<DeactivationResult[]>;
  updateActivityStatuses(): Promise<void>;
}

interface InactiveUser {
  userId: string;
  daysSinceLastActivity: number;
  currentStatus: string;
  isGoldStar: boolean;
  requiresAction: boolean;
  nextAction: InactivityAction;
}

const INACTIVITY_SCHEDULE = {
  warning_15: 15, // First warning at 15 days
  warning_30: 30, // Final warning at 30 days
  deactivation: 45, // Deactivation at 45 days (non-Gold Star only)
  data_retention: 365 // Data purge after 1 year of deactivation
};
```

### 2. Gold Star Exemption Logic
```typescript
interface GoldStarExemptionService {
  isExemptFromDeactivation(userId: string): Promise<boolean>;
  applyGoldStarExemption(userId: string): Promise<void>;
  removeGoldStarExemption(userId: string): Promise<void>;
  getExemptionReason(userId: string): Promise<string>;
  notifyGoldStarInactivity(userId: string): Promise<void>; // Courtesy notification only
}

// Gold Star users receive courtesy notifications but are never deactivated
const GOLD_STAR_POLICY = {
  receiveNotifications: true, // Still get courtesy notifications
  autoDeactivate: false, // Never auto-deactivated
  courtesyNotificationDays: [30, 90, 180], // Courtesy check-ins
  manualReviewRequired: true // Admin review for extended inactivity
};
```

## User Interface Components

### 1. Activity Dashboard
```typescript
interface ActivityDashboardProps {
  userId: string;
  activitySummary: ActivitySummary;
  inactivityStatus: InactivityStatus;
}

const ActivityDashboard: React.FC<ActivityDashboardProps> = ({
  userId,
  activitySummary,
  inactivityStatus
}) => {
  return (
    <div className="activity-dashboard">
      <ActivityStatusCard status={inactivityStatus} />
      <ActivityChart summary={activitySummary} />
      <RecentActivitiesList userId={userId} />
      <InactivitySettings userId={userId} />
    </div>
  );
};
```

### 2. Inactivity Warning Interface
```typescript
interface InactivityWarningProps {
  warningType: WarningType;
  daysSinceLastActivity: number;
  deactivationDate: Date;
  onContinue: () => void;
  onDeactivate: () => void;
}

const InactivityWarningInterface: React.FC<InactivityWarningProps> = ({
  warningType,
  daysSinceLastActivity,
  deactivationDate,
  onContinue,
  onDeactivate
}) => {
  return (
    <div className="inactivity-warning">
      <WarningIcon type={warningType} />
      <WarningMessage 
        type={warningType}
        daysSinceLastActivity={daysSinceLastActivity}
        deactivationDate={deactivationDate}
      />
      <ActionButtons 
        onContinue={onContinue}
        onDeactivate={onDeactivate}
      />
      <ActivitySuggestions />
    </div>
  );
};
```

### 3. Admin Inactivity Management
```typescript
interface AdminInactivityManagementProps {
  inactiveUsers: InactiveUser[];
  deactivationQueue: DeactivationCandidate[];
  exemptUsers: ExemptUser[];
}

const AdminInactivityManagement: React.FC<AdminInactivityManagementProps> = ({
  inactiveUsers,
  deactivationQueue,
  exemptUsers
}) => {
  return (
    <div className="admin-inactivity-management">
      <InactivityStatsDashboard />
      <InactiveUsersList users={inactiveUsers} />
      <DeactivationQueue candidates={deactivationQueue} />
      <ExemptUsersList users={exemptUsers} />
      <BulkActions />
    </div>
  );
};
```

## Email Templates

### 1. 15-Day Warning Email
```html
<div class="inactivity-warning-email">
  <h1>We Miss You at Gita Connect!</h1>
  <p>Hi {{userName}},</p>
  <p>We noticed you haven't been active on Gita Connect for the past 15 days. Our community is stronger with your participation!</p>
  
  <div class="activity-suggestions">
    <h3>Here's what you can do:</h3>
    <ul>
      <li>Check out new job opportunities</li>
      <li>Offer help to fellow alumni</li>
      <li>Update your profile</li>
      <li>Connect with classmates</li>
    </ul>
  </div>
  
  <a href="{{loginLink}}" class="cta-button">Return to Gita Connect</a>
  
  <div class="policy-notice">
    <p><small>Note: Accounts inactive for 30+ days may be deactivated to maintain community engagement.</small></p>
  </div>
</div>
```

### 2. 30-Day Final Notice Email
```html
<div class="final-notice-email">
  <h1>Final Notice: Account Deactivation Warning</h1>
  <p>Hi {{userName}},</p>
  <p>Your Gita Connect account has been inactive for 30 days. To keep your account active, please log in within the next 15 days.</p>
  
  <div class="deactivation-warning">
    <h3>⚠️ Important:</h3>
    <p>If you don't respond by {{deactivationDate}}, your account will be deactivated.</p>
  </div>
  
  <div class="response-options">
    <a href="{{continueLink}}" class="cta-button primary">Keep My Account Active</a>
    <a href="{{deactivateLink}}" class="cta-button secondary">Deactivate My Account</a>
  </div>
</div>
```

## Success Criteria

### Automation Efficiency
- [ ] **Daily Processing:** 100% automated daily inactivity checks
- [ ] **Notification Delivery:** 99%+ email delivery success rate
- [ ] **Response Processing:** Automated handling of user responses
- [ ] **Deactivation Accuracy:** Correct application of Gold Star exemptions

### User Experience
- [ ] **Clear Communication:** Users understand inactivity policies
- [ ] **Easy Response:** Simple one-click response to notifications
- [ ] **Reactivation Process:** Smooth reactivation for returning users
- [ ] **Activity Encouragement:** Notifications motivate re-engagement

### Business Objectives
- [ ] **Community Engagement:** Maintain active user base
- [ ] **Data Quality:** Remove inactive accounts while preserving valuable users
- [ ] **Gold Star Retention:** 100% retention of Gold Star users
- [ ] **Reactivation Rate:** 40%+ of warned users return to activity

## Implementation Timeline

### Week 1: Core Development
- **Days 1-2:** Activity tracking and summary services
- **Days 3-4:** Inactivity management and notification workflows
- **Days 5-6:** User interface components and email templates
- **Day 7:** Testing and automation setup

## Risk Mitigation

### User Retention Risks
- **Over-Aggressive Deactivation:** Conservative thresholds and clear warnings
- **Gold Star Protection:** Absolute protection for valuable community members
- **Reactivation Support:** Easy path back for returning users

### Technical Risks
- **Automation Reliability:** Robust job scheduling and error handling
- **Email Delivery:** Multiple email providers and delivery monitoring
- **Data Integrity:** Accurate activity tracking and status management

### Communication Risks
- **Clear Messaging:** Transparent communication about policies
- **Cultural Sensitivity:** Respectful approach to account management
- **Support Availability:** Help desk support for inactivity questions

## Next Steps

1. **Policy Finalization:** Confirm inactivity thresholds with stakeholders
2. **Service Development:** Build core activity tracking and management services
3. **Email Template Creation:** Design and test notification emails
4. **Automation Setup:** Implement daily job scheduling
5. **Testing:** Comprehensive testing of inactivity workflows

---

*This task ensures healthy community engagement by managing inactive accounts while protecting valuable Gold Star members and providing clear, respectful communication throughout the process.*
