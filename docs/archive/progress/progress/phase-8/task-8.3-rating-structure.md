# Task 8.3: Rating Structure Implementation

**Status:** 🟡 Planned
**Priority:** High
**Duration:** 1 week
**Dependencies:** Task 8.2 (Invitation System)

## Overview
Implement comprehensive Gold Star rating system for core devotees with automated contribution scoring, manual evaluation workflows, and visual recognition throughout the platform based on meeting requirements.

## Requirements Analysis

### Business Requirements from Meeting
- **Gold Star Category:** Identify and recognize core devotee families
- **Rating Structure:** All users accredited to rating structure based on mahayagna community support
- **Support-Based Rating:** Rating based on support offered to mahayagna community
- **Decision Priority:** Star rating influences opportunity allocation for true need and core contributors

### Rating Categories
1. **Gold Star:** Core devotee families with exceptional community contribution
2. **Silver Star:** Active contributors with consistent community support
3. **Bronze Star:** Regular participants with moderate community engagement
4. **Member:** Standard members with basic platform participation

## Database Schema Implementation

### New USER_RATINGS Table
```sql
CREATE TABLE USER_RATINGS (
    uuid id PK,
    uuid user_id FK,
    enum rating_category "gold_star,silver_star,bronze_star,member",
    integer contribution_score DEFAULT 0,
    integer help_provided_count DEFAULT 0,
    integer help_received_count DEFAULT 0,
    integer mentorship_sessions DEFAULT 0,
    integer community_posts DEFAULT 0,
    decimal community_impact_score DEFAULT 0.0,
    json rating_criteria, -- Detailed breakdown of rating factors
    timestamp last_evaluated,
    uuid evaluated_by FK, -- Admin/moderator who assigned rating
    enum evaluation_type "automatic,manual,appeal",
    text evaluation_notes,
    boolean is_active DEFAULT TRUE,
    timestamp effective_from,
    timestamp effective_until, -- For temporary ratings
    timestamp created_at,
    timestamp updated_at
);
```

### New CONTRIBUTION_ACTIVITIES Table
```sql
CREATE TABLE CONTRIBUTION_ACTIVITIES (
    uuid id PK,
    uuid user_id FK,
    enum activity_type "post_help,provide_support,mentor_session,moderate_content,organize_event,donate_time",
    integer points_awarded,
    string description,
    uuid related_posting_id FK, -- If related to a specific posting
    uuid related_conversation_id FK, -- If related to mentorship/chat
    enum verification_status "pending,verified,rejected",
    uuid verified_by FK, -- Admin/moderator who verified
    timestamp verified_at,
    text verification_notes,
    json activity_metadata, -- Additional context data
    timestamp activity_date,
    timestamp created_at
);
```

### New RATING_EVALUATION_HISTORY Table
```sql
CREATE TABLE RATING_EVALUATION_HISTORY (
    uuid id PK,
    uuid user_id FK,
    enum previous_rating "gold_star,silver_star,bronze_star,member",
    enum new_rating "gold_star,silver_star,bronze_star,member",
    integer previous_score,
    integer new_score,
    enum evaluation_trigger "automatic_threshold,manual_review,appeal_process,periodic_review",
    uuid evaluated_by FK,
    text evaluation_reason,
    json score_breakdown, -- Detailed scoring factors
    timestamp evaluation_date,
    boolean user_notified DEFAULT FALSE,
    timestamp notification_sent_at
);
```

### New RATING_CRITERIA_CONFIG Table
```sql
CREATE TABLE RATING_CRITERIA_CONFIG (
    uuid id PK,
    enum rating_level "gold_star,silver_star,bronze_star,member",
    integer min_contribution_score,
    integer min_help_provided,
    integer min_community_posts,
    decimal min_impact_score,
    integer min_platform_days, -- Minimum days on platform
    json additional_criteria, -- Flexible criteria definition
    boolean requires_manual_review DEFAULT FALSE,
    boolean is_active DEFAULT TRUE,
    timestamp effective_from,
    timestamp created_at,
    timestamp updated_at
);
```

## Implementation Components

### 1. Rating Calculation Service
```typescript
interface RatingCalculationService {
  calculateContributionScore(userId: string): Promise<ContributionScore>;
  evaluateRatingEligibility(userId: string): Promise<RatingEvaluation>;
  updateUserRating(userId: string, newRating: RatingCategory): Promise<void>;
  getDetailedScoreBreakdown(userId: string): Promise<ScoreBreakdown>;
  triggerAutomaticEvaluation(userId: string): Promise<EvaluationResult>;
}

interface ContributionScore {
  totalScore: number;
  helpProvided: number;
  mentorshipSessions: number;
  communityPosts: number;
  impactScore: number;
  platformTenure: number;
  breakdown: ScoreComponent[];
}

interface ScoreComponent {
  category: string;
  points: number;
  description: string;
  verificationStatus: 'verified' | 'pending' | 'rejected';
}

interface RatingEvaluation {
  currentRating: RatingCategory;
  recommendedRating: RatingCategory;
  meetsRequirements: boolean;
  missingCriteria: string[];
  scoreGap: number;
  nextReviewDate: Date;
}
```

### 2. Contribution Tracking Service
```typescript
interface ContributionTrackingService {
  recordActivity(activity: ActivityRecord): Promise<void>;
  verifyActivity(activityId: string, verifierId: string): Promise<void>;
  calculateActivityPoints(activityType: ActivityType, metadata: any): number;
  getActivityHistory(userId: string, timeframe?: TimeFrame): Promise<Activity[]>;
  getPendingVerifications(moderatorId: string): Promise<Activity[]>;
}

interface ActivityRecord {
  userId: string;
  type: ActivityType;
  description: string;
  relatedPostingId?: string;
  relatedConversationId?: string;
  metadata: any;
  activityDate: Date;
}

type ActivityType = 
  | 'post_help' 
  | 'provide_support' 
  | 'mentor_session' 
  | 'moderate_content' 
  | 'organize_event' 
  | 'donate_time';

interface Activity {
  id: string;
  type: ActivityType;
  points: number;
  description: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  activityDate: Date;
}
```

### 3. Rating Display Service
```typescript
interface RatingDisplayService {
  getUserRatingBadge(userId: string): Promise<RatingBadge>;
  getRatingIcon(rating: RatingCategory): string;
  getRatingColor(rating: RatingCategory): string;
  getRatingDescription(rating: RatingCategory): string;
  shouldShowRating(userId: string, viewerId: string): Promise<boolean>;
}

interface RatingBadge {
  rating: RatingCategory;
  icon: string;
  color: string;
  displayText: string;
  tooltip: string;
  showInProfile: boolean;
  showInPosts: boolean;
}

type RatingCategory = 'gold_star' | 'silver_star' | 'bronze_star' | 'member';
```

## Scoring Algorithm Implementation

### 1. Point System Configuration
```typescript
const ACTIVITY_POINTS = {
  post_help: 10,           // Posting help/support offers
  provide_support: 25,     // Actually helping someone (verified)
  mentor_session: 50,      // Conducting mentorship sessions
  moderate_content: 15,    // Content moderation activities
  organize_event: 100,     // Organizing community events
  donate_time: 30,         // Volunteering time for community
  receive_positive_feedback: 5, // Getting positive ratings
  complete_profile: 20,    // Maintaining complete profile
  regular_participation: 10 // Consistent platform usage
};

const RATING_THRESHOLDS = {
  member: { minScore: 0, minHelp: 0, minPosts: 0 },
  bronze_star: { minScore: 100, minHelp: 2, minPosts: 5 },
  silver_star: { minScore: 500, minHelp: 10, minPosts: 20 },
  gold_star: { minScore: 1500, minHelp: 25, minPosts: 50, requiresManualReview: true }
};
```

### 2. Impact Score Calculation
```typescript
interface ImpactCalculator {
  calculateCommunityImpact(userId: string): Promise<number>;
  calculateHelpEffectiveness(userId: string): Promise<number>;
  calculateMentorshipQuality(userId: string): Promise<number>;
  calculateConsistencyScore(userId: string): Promise<number>;
}

// Impact factors:
// - Number of people helped
// - Quality of help provided (feedback ratings)
// - Consistency of participation
// - Community leadership activities
// - Positive feedback from community
```

## User Interface Components

### 1. Rating Badge Components
```typescript
interface RatingBadgeProps {
  rating: RatingCategory;
  size: 'small' | 'medium' | 'large';
  showText?: boolean;
  showTooltip?: boolean;
}

const RatingBadge: React.FC<RatingBadgeProps> = ({ rating, size, showText, showTooltip }) => {
  const config = getRatingConfig(rating);
  
  return (
    <div className={`rating-badge ${size} ${config.colorClass}`}>
      <Icon name={config.icon} />
      {showText && <span>{config.displayText}</span>}
      {showTooltip && <Tooltip content={config.description} />}
    </div>
  );
};
```

### 2. Rating Progress Dashboard
```typescript
interface RatingProgressProps {
  userId: string;
  currentRating: RatingCategory;
  contributionScore: number;
  nextRatingThreshold: number;
  recentActivities: Activity[];
}

const RatingProgressDashboard: React.FC<RatingProgressProps> = ({
  userId,
  currentRating,
  contributionScore,
  nextRatingThreshold,
  recentActivities
}) => {
  return (
    <div className="rating-progress-dashboard">
      <RatingBadge rating={currentRating} size="large" showText />
      <ProgressBar 
        current={contributionScore} 
        target={nextRatingThreshold}
        label="Progress to Next Rating"
      />
      <ActivityTimeline activities={recentActivities} />
      <ContributionSuggestions userId={userId} />
    </div>
  );
};
```

### 3. Admin Rating Management
```typescript
interface AdminRatingManagementProps {
  pendingEvaluations: RatingEvaluation[];
  ratingStatistics: RatingStats;
  criteriaConfig: RatingCriteriaConfig[];
}

const AdminRatingManagement: React.FC<AdminRatingManagementProps> = ({
  pendingEvaluations,
  ratingStatistics,
  criteriaConfig
}) => {
  return (
    <div className="admin-rating-management">
      <RatingStatsDashboard stats={ratingStatistics} />
      <PendingEvaluationsList evaluations={pendingEvaluations} />
      <RatingCriteriaEditor config={criteriaConfig} />
      <BulkRatingActions />
    </div>
  );
};
```

## Automated Evaluation System

### 1. Periodic Rating Review
```typescript
interface AutomatedEvaluationService {
  schedulePeriodicReviews(): Promise<void>;
  runDailyEvaluations(): Promise<EvaluationSummary>;
  processRatingUpgrades(): Promise<UpgradeResult[]>;
  processRatingDowngrades(): Promise<DowngradeResult[]>;
  notifyUsersOfChanges(): Promise<void>;
}

// Evaluation triggers:
// - Daily: Check for automatic upgrades based on score thresholds
// - Weekly: Review users approaching rating changes
// - Monthly: Comprehensive review of all Gold Star ratings
// - Event-based: Immediate evaluation after significant contributions
```

### 2. Manual Review Workflow
```typescript
interface ManualReviewWorkflow {
  submitForReview(userId: string, reason: string): Promise<ReviewRequest>;
  assignReviewer(requestId: string, reviewerId: string): Promise<void>;
  completeReview(requestId: string, decision: ReviewDecision): Promise<void>;
  appealRatingDecision(userId: string, reason: string): Promise<Appeal>;
  processAppeal(appealId: string, decision: AppealDecision): Promise<void>;
}

interface ReviewDecision {
  approved: boolean;
  newRating?: RatingCategory;
  reason: string;
  effectiveDate: Date;
  reviewNotes: string;
}
```

## Success Criteria

### Functional Requirements
- [ ] **Rating Calculation:** Accurate automated scoring based on contributions
- [ ] **Visual Recognition:** Rating badges displayed throughout platform
- [ ] **Progress Tracking:** Users can see their rating progress and requirements
- [ ] **Admin Tools:** Complete rating management interface for administrators

### Business Requirements
- [ ] **Gold Star Recognition:** Clear identification of core devotee families
- [ ] **Contribution Incentives:** System encourages community support activities
- [ ] **Fair Evaluation:** Transparent and consistent rating criteria
- [ ] **Appeal Process:** Fair mechanism for rating disputes

### Technical Requirements
- [ ] **Performance:** Rating calculations complete within 2 seconds
- [ ] **Scalability:** System handles 10,000+ users efficiently
- [ ] **Data Integrity:** Accurate tracking of all contribution activities
- [ ] **Security:** Secure rating data with audit trails

## Implementation Timeline

### Week 1: Core Development
- **Days 1-2:** Database schema and rating calculation service
- **Days 3-4:** Contribution tracking and verification system
- **Days 5-6:** User interface components and admin tools
- **Day 7:** Testing and validation

## Risk Mitigation

### Rating Fairness Risks
- **Transparent Criteria:** Clear, published rating requirements
- **Appeal Process:** Fair mechanism for disputing ratings
- **Regular Review:** Periodic evaluation of rating criteria

### Gaming Prevention
- **Verification Requirements:** Manual verification for high-value activities
- **Anti-Gaming Measures:** Detection of artificial contribution inflation
- **Quality Metrics:** Focus on impact quality, not just quantity

### Technical Risks
- **Performance:** Optimize rating calculations for scale
- **Data Consistency:** Ensure accurate contribution tracking
- **System Integration:** Seamless integration with existing platform

## Next Steps

1. **Criteria Definition:** Finalize rating criteria with stakeholders
2. **Database Implementation:** Create rating and contribution tables
3. **Service Development:** Build core rating calculation services
4. **UI Development:** Create rating display and management components
5. **Testing:** Comprehensive testing of rating algorithms

---

*This task establishes the recognition and incentive system that encourages community contribution and identifies core devotee families within the Gita Connect platform.*
