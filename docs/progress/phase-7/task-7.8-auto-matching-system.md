# Task 7.8: Auto-Matching System

**Status:** 🟡 Planned
**Priority:** High
**Estimated Time:** 5-7 days
**Dependencies:** Task 7.7 (Domain Taxonomy System)

## Overview
Implement intelligent auto-matching system to connect help seekers with help providers based on domain expertise, preferences, skills, and historical success rates. The system runs automatically on posting creation and periodically to find new matches.

## Objectives
- Match seekers with qualified helpers automatically
- Score matches based on multiple criteria (domains, skills, location, availability)
- Notify matched users of relevant opportunities
- Track matching success for algorithm improvement
- Provide match explanations for transparency

## Database Schema

### 1. MATCHING_RULES Table
```sql
CREATE TABLE MATCHING_RULES (
    id CHAR(36) PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    rule_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Matching weights (must sum to 1.0)
    domain_match_weight DECIMAL(3,2) DEFAULT 0.40,
    skill_match_weight DECIMAL(3,2) DEFAULT 0.30,
    expertise_level_weight DECIMAL(3,2) DEFAULT 0.15,
    success_history_weight DECIMAL(3,2) DEFAULT 0.10,
    availability_weight DECIMAL(3,2) DEFAULT 0.05,
    
    -- Matching thresholds
    minimum_match_score DECIMAL(3,2) DEFAULT 0.50,
    minimum_domain_overlap INT DEFAULT 1,
    minimum_expertise_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate',
    
    -- Configuration
    max_suggestions_per_posting INT DEFAULT 10,
    suggestion_expiry_hours INT DEFAULT 168,  -- 7 days
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_active (is_active)
);
```

### 2. MATCH_SUGGESTIONS Table
```sql
CREATE TABLE MATCH_SUGGESTIONS (
    id CHAR(36) PRIMARY KEY,
    
    -- Posting and user references
    posting_id CHAR(36) NOT NULL,
    posting_type ENUM('offer_support', 'seek_support') NOT NULL,
    suggested_user_id CHAR(36) NOT NULL,  -- Helper for seek, Seeker for offer
    
    -- Match scoring
    match_score DECIMAL(3,2) NOT NULL,  -- 0.00 to 1.00
    domain_score DECIMAL(3,2),
    skill_score DECIMAL(3,2),
    expertise_score DECIMAL(3,2),
    history_score DECIMAL(3,2),
    availability_score DECIMAL(3,2),
    
    -- Match details
    match_reasons JSON,  -- { domain_matches: [], skill_matches: [], etc. }
    matching_rule_id CHAR(36),
    
    -- Status tracking
    status ENUM('suggested', 'viewed', 'contacted', 'accepted', 'declined', 'expired') DEFAULT 'suggested',
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMP NULL,
    viewed_at TIMESTAMP NULL,
    responded_at TIMESTAMP NULL,
    
    -- Expiration
    expires_at TIMESTAMP NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (posting_id) REFERENCES POSTINGS(id) ON DELETE CASCADE,
    FOREIGN KEY (suggested_user_id) REFERENCES USERS(id) ON DELETE CASCADE,
    FOREIGN KEY (matching_rule_id) REFERENCES MATCHING_RULES(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_posting_user_suggestion (posting_id, suggested_user_id),
    INDEX idx_posting_id (posting_id),
    INDEX idx_user_id (suggested_user_id),
    INDEX idx_match_score (match_score DESC),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at)
);
```

### 3. MATCH_HISTORY Table
```sql
CREATE TABLE MATCH_HISTORY (
    id CHAR(36) PRIMARY KEY,
    suggestion_id CHAR(36) NOT NULL,
    posting_id CHAR(36) NOT NULL,
    seeker_user_id CHAR(36) NOT NULL,
    helper_user_id CHAR(36) NOT NULL,
    
    -- Outcome tracking
    was_successful BOOLEAN NULL,  -- NULL = unknown, TRUE = success, FALSE = unsuccessful
    outcome_reason TEXT,
    completion_date TIMESTAMP NULL,
    
    -- Ratings
    seeker_rating INT,  -- 1-5
    helper_rating INT,  -- 1-5
    seeker_feedback TEXT,
    helper_feedback TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (suggestion_id) REFERENCES MATCH_SUGGESTIONS(id) ON DELETE CASCADE,
    FOREIGN KEY (posting_id) REFERENCES POSTINGS(id) ON DELETE CASCADE,
    FOREIGN KEY (seeker_user_id) REFERENCES USERS(id) ON DELETE CASCADE,
    FOREIGN KEY (helper_user_id) REFERENCES USERS(id) ON DELETE CASCADE,
    
    INDEX idx_suggestion_id (suggestion_id),
    INDEX idx_posting_id (posting_id),
    INDEX idx_seeker_user (seeker_user_id),
    INDEX idx_helper_user (helper_user_id),
    INDEX idx_success (was_successful)
);
```

### 4. USER_AVAILABILITY Table
```sql
CREATE TABLE USER_AVAILABILITY (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    
    -- Availability status
    is_available_for_helping BOOLEAN DEFAULT TRUE,
    is_available_for_seeking BOOLEAN DEFAULT TRUE,
    
    -- Capacity limits
    max_active_help_offers INT DEFAULT 5,
    max_active_help_requests INT DEFAULT 3,
    current_active_offers INT DEFAULT 0,
    current_active_requests INT DEFAULT 0,
    
    -- Time availability
    available_hours_per_week INT,
    preferred_response_time ENUM('immediate', 'within_24h', 'within_week', 'flexible') DEFAULT 'flexible',
    
    -- Last activity
    last_helped_at TIMESTAMP NULL,
    last_seeked_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES USERS(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_availability (user_id),
    INDEX idx_available_helping (is_available_for_helping),
    INDEX idx_available_seeking (is_available_for_seeking)
);
```

## Matching Algorithm

### Core Matching Logic
```typescript
// services/matchingService.ts
interface MatchCriteria {
  domainIds: string[];
  categoryIds?: string[];
  skillIds?: string[];
  urgencyLevel?: string;
  location?: string;
}

interface MatchScore {
  totalScore: number;
  domainScore: number;
  skillScore: number;
  expertiseScore: number;
  historyScore: number;
  availabilityScore: number;
  reasons: MatchReason[];
}

export async function findMatches(
  postingId: string,
  postingType: 'offer_support' | 'seek_support',
  criteria: MatchCriteria
): Promise<MatchSuggestion[]> {
  
  // Get matching rules
  const rules = await getActiveMatchingRules();
  
  // Get candidate users
  const candidates = await getCandidateUsers(postingType, criteria);
  
  // Score each candidate
  const scoredMatches = await Promise.all(
    candidates.map(candidate => scoreMatch(candidate, criteria, rules))
  );
  
  // Filter by minimum score
  const qualifiedMatches = scoredMatches.filter(
    m => m.totalScore >= rules.minimum_match_score
  );
  
  // Sort by score and limit
  const topMatches = qualifiedMatches
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, rules.max_suggestions_per_posting);
  
  // Save suggestions
  await saveMatchSuggestions(postingId, topMatches, rules);
  
  return topMatches;
}
```

### Scoring Components

#### 1. Domain Match Score (40%)
```typescript
function calculateDomainScore(
  postingDomains: Domain[],
  userDomains: AlumniDomain[]
): number {
  const postingDomainIds = new Set(postingDomains.map(d => d.id));
  const userDomainIds = new Set(userDomains.map(d => d.domain_id));
  
  // Calculate overlap
  const intersection = new Set(
    [...postingDomainIds].filter(x => userDomainIds.has(x))
  );
  
  if (intersection.size === 0) return 0;
  
  // Weighted by expertise level
  let weightedScore = 0;
  for (const domainId of intersection) {
    const userDomain = userDomains.find(d => d.domain_id === domainId);
    const expertiseWeight = {
      'beginner': 0.25,
      'intermediate': 0.50,
      'advanced': 0.75,
      'expert': 1.00
    }[userDomain.expertise_level];
    
    weightedScore += expertiseWeight;
  }
  
  return Math.min(1.0, weightedScore / postingDomainIds.size);
}
```

#### 2. Skill Match Score (30%)
```typescript
function calculateSkillScore(
  postingTags: Tag[],
  userSkills: AlumniSkill[]
): number {
  if (postingTags.length === 0) return 0.5;  // Neutral
  
  const postingSkills = new Set(postingTags.map(t => t.name.toLowerCase()));
  const userSkillNames = new Set(
    userSkills.map(s => s.skill_name.toLowerCase())
  );
  
  const matches = [...postingSkills].filter(s => userSkillNames.has(s));
  
  if (matches.length === 0) return 0;
  
  // Calculate weighted score by proficiency
  let weightedScore = 0;
  for (const skillName of matches) {
    const userSkill = userSkills.find(
      s => s.skill_name.toLowerCase() === skillName
    );
    const proficiencyWeight = {
      'beginner': 0.25,
      'intermediate': 0.50,
      'advanced': 0.75,
      'expert': 1.00
    }[userSkill.proficiency_level];
    
    weightedScore += proficiencyWeight;
  }
  
  return Math.min(1.0, weightedScore / postingSkills.size);
}
```

#### 3. Success History Score (10%)
```typescript
async function calculateHistoryScore(userId: string): Promise<number> {
  const history = await pool.query(`
    SELECT 
      COUNT(*) as total_matches,
      SUM(CASE WHEN was_successful = TRUE THEN 1 ELSE 0 END) as successful_matches,
      AVG(helper_rating) as avg_rating
    FROM MATCH_HISTORY
    WHERE helper_user_id = ?
  `, [userId]);
  
  if (history[0][0].total_matches === 0) return 0.5;  // Neutral for new users
  
  const successRate = history[0][0].successful_matches / history[0][0].total_matches;
  const ratingScore = (history[0][0].avg_rating || 3) / 5;  // Normalize to 0-1
  
  return (successRate * 0.7) + (ratingScore * 0.3);
}
```

#### 4. Availability Score (5%)
```typescript
async function calculateAvailabilityScore(userId: string): Promise<number> {
  const availability = await pool.query(`
    SELECT 
      is_available_for_helping,
      max_active_help_offers,
      current_active_offers,
      available_hours_per_week
    FROM USER_AVAILABILITY
    WHERE user_id = ?
  `, [userId]);
  
  if (!availability[0][0] || !availability[0][0].is_available_for_helping) {
    return 0;
  }
  
  const capacityScore = 1 - (
    availability[0][0].current_active_offers / 
    availability[0][0].max_active_help_offers
  );
  
  const timeScore = availability[0][0].available_hours_per_week 
    ? Math.min(1.0, availability[0][0].available_hours_per_week / 10)
    : 0.5;
  
  return (capacityScore * 0.6) + (timeScore * 0.4);
}
```

## API Endpoints

### Matching Execution
```typescript
// POST /api/matching/find-helpers
// Find helpers for a seek_support posting
interface FindHelpersRequest {
  posting_id: string;
  domain_ids: string[];
  category_ids?: string[];
  skill_tags?: string[];
}

// POST /api/matching/find-seekers
// Find seekers for an offer_support posting (proactive matching)

// POST /api/matching/refresh/:postingId
// Re-run matching for a specific posting
```

### Match Management
```typescript
// GET /api/matching/suggestions/:userId
// Get all match suggestions for a user
interface GetSuggestionsParams {
  status?: 'suggested' | 'viewed' | 'contacted';
  min_score?: number;
  limit?: number;
}

// POST /api/matching/suggestions/:id/accept
// Accept a match suggestion

// POST /api/matching/suggestions/:id/decline
// Decline a match suggestion

// PUT /api/matching/suggestions/:id/view
// Mark suggestion as viewed
```

### Match History
```typescript
// POST /api/matching/history/:suggestionId/outcome
// Record match outcome
interface RecordOutcomeRequest {
  was_successful: boolean;
  outcome_reason?: string;
  seeker_rating?: number;
  helper_rating?: number;
  feedback?: string;
}

// GET /api/matching/history/:userId
// Get user's match history
```

### Availability Management
```typescript
// GET /api/matching/availability/:userId
// Get user availability settings

// PUT /api/matching/availability/:userId
// Update user availability
interface UpdateAvailabilityRequest {
  is_available_for_helping: boolean;
  max_active_help_offers: number;
  available_hours_per_week?: number;
}
```

## Automated Matching Process

### 1. On Posting Creation (Real-time)
```typescript
// Triggered when new posting is created
export async function onPostingCreated(posting: Posting) {
  if (posting.status === 'approved') {
    // Run matching immediately
    await findMatches(posting.id, posting.posting_type, {
      domainIds: posting.domain_ids,
      categoryIds: posting.category_ids,
      skillIds: posting.tag_ids,
      urgencyLevel: posting.urgency_level
    });
    
    // Send notifications to matched users
    await notifyMatchedUsers(posting.id);
  }
}
```

### 2. Scheduled Matching (Batch)
```typescript
// Cron job: Run every 6 hours
export async function runScheduledMatching() {
  console.log('🔄 Running scheduled matching...');
  
  // Get active postings without recent matches
  const postings = await pool.query(`
    SELECT p.* 
    FROM POSTINGS p
    LEFT JOIN MATCH_SUGGESTIONS ms ON p.id = ms.posting_id 
      AND ms.created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    WHERE p.status = 'approved' 
      AND p.expires_at > NOW()
      AND ms.id IS NULL
    LIMIT 100
  `);
  
  for (const posting of postings[0]) {
    await findMatches(posting.id, posting.posting_type, {
      domainIds: JSON.parse(posting.domain_ids),
      // ... other criteria
    });
  }
  
  console.log(`✅ Matched ${postings[0].length} postings`);
}
```

### 3. Match Expiration Cleanup
```typescript
// Cron job: Run daily
export async function cleanupExpiredMatches() {
  await pool.query(`
    UPDATE MATCH_SUGGESTIONS
    SET status = 'expired'
    WHERE expires_at < NOW() 
      AND status IN ('suggested', 'viewed')
  `);
}
```

## Notification System Integration

### Match Notification
```typescript
export async function notifyMatchedUsers(postingId: string) {
  const matches = await pool.query(`
    SELECT ms.*, u.email, p.title
    FROM MATCH_SUGGESTIONS ms
    JOIN USERS u ON ms.suggested_user_id = u.id
    JOIN POSTINGS p ON ms.posting_id = p.id
    WHERE ms.posting_id = ? 
      AND ms.notification_sent = FALSE
    ORDER BY ms.match_score DESC
    LIMIT 10
  `, [postingId]);
  
  for (const match of matches[0]) {
    await sendMatchNotification({
      userId: match.suggested_user_id,
      email: match.email,
      postingTitle: match.title,
      matchScore: match.match_score,
      matchReasons: JSON.parse(match.match_reasons)
    });
    
    await pool.query(`
      UPDATE MATCH_SUGGESTIONS
      SET notification_sent = TRUE, notification_sent_at = NOW()
      WHERE id = ?
    `, [match.id]);
  }
}
```

## Configuration & Admin Tools

### Admin Dashboard Features
1. **Matching Rules Configuration**
   - Adjust scoring weights
   - Set minimum thresholds
   - Configure limits

2. **Match Analytics**
   - Success rates by domain
   - Average match scores
   - Response times

3. **Manual Match Creation**
   - Override automatic matching
   - Create custom suggestions

## Testing Requirements

### Unit Tests
- Domain score calculation
- Skill score calculation
- History score calculation
- Overall match scoring

### Integration Tests
- End-to-end matching flow
- Notification delivery
- Match acceptance workflow
- History tracking

## Performance Optimization

### Indexes
```sql
-- Critical indexes for matching queries
CREATE INDEX idx_alumni_domains_offering ON ALUMNI_DOMAINS(is_offering_support, domain_id);
CREATE INDEX idx_user_availability ON USER_AVAILABILITY(is_available_for_helping, user_id);
CREATE INDEX idx_match_score_status ON MATCH_SUGGESTIONS(match_score DESC, status);
```

### Caching Strategy
- Cache user domain/skill profiles (15 min TTL)
- Cache matching rules (1 hour TTL)
- Cache candidate pools (5 min TTL)

## Deliverables
- [ ] Matching tables created
- [ ] Matching algorithm implemented
- [ ] API endpoints operational
- [ ] Real-time matching on posting creation
- [ ] Scheduled batch matching
- [ ] Notification system integrated
- [ ] Admin configuration interface
- [ ] Match analytics dashboard
- [ ] Tests passing

## Success Metrics
- Match accuracy > 70% (user accepts suggestion)
- Average match score > 0.65
- Notification response rate > 30%
- Time to first match < 1 hour
- Successful connection rate > 50%

---

*Enables intelligent auto-matching of help seekers with qualified providers based on comprehensive criteria.*
