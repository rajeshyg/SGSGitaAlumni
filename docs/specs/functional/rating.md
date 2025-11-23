# Rating & Recognition - Functional Specification

```yaml
---
version: 1.0
status: pending
last_updated: 2025-11-22
recommended_model: sonnet
implementation_links: []
---
```

## Goal
Encourage community engagement through a structured recognition system that rewards contributions.

## Features

### 1. Rating Structure
**Status**: Pending

**Requirements**:
- Gold/Silver/Bronze rating tiers
- Visual badges on profiles
- Tier thresholds based on points

**Tier Definitions**:
- Bronze: 0-99 points
- Silver: 100-499 points
- Gold: 500+ points

### 2. Contribution Tracking
**Status**: Pending

**Requirements**:
- Automated point system
- Points for: postings, comments, helpful ratings
- Activity history
- Leaderboard (optional)

**Point Values**:
- Create posting: 10 points
- Posting approved: 5 bonus
- Comment: 2 points
- Receive like: 1 point
- Help rating: 5 points

**Acceptance Criteria**:
- [ ] Points calculated automatically
- [ ] Rating tier assigned
- [ ] Badge displayed on profile
- [ ] Points history viewable

## Database Schema

```sql
CREATE TABLE user_ratings (
  user_id INT PRIMARY KEY,
  total_points INT DEFAULT 0,
  current_tier ENUM('bronze', 'silver', 'gold'),
  last_updated TIMESTAMP
);

CREATE TABLE contribution_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action_type VARCHAR(50),
  points INT,
  created_at TIMESTAMP
);
```

## Out of Scope (MVP)
- Badges for specific achievements
- Annual awards
- Point redemption

## Implementation Workflow

This feature follows the Scout-Plan-Build workflow documented in `/docs/spec_driven_coding_guide.md`.

### Workflow Documentation
- **Scout Report** (Planning Phase): `docs/specs/workflows/rating/scout.md`
  - Planned rating tier system (Bronze/Silver/Gold)
  - Point economy design and triggers
  - Database schema for ratings and contribution log
  - Integration points across postings and moderation
  - Estimated effort: 12-16 hours
  - Risk analysis and recommendations

**Status**: 🔜 PENDING - Low priority post-MVP enhancement. Implementation should be validated with users first.

### Implementation Approach
- **Phase 1**: Database and point service (4 hours)
- **Phase 2**: Frontend components - badges and display (6 hours)
- **Phase 3**: Integration and testing (4 hours)
- **Optional**: Leaderboard feature (4 hours)

### Key Decisions Needed
1. Real-time vs batch point calculation
2. Point values calibration
3. Abuse prevention mechanisms
4. Whether gamification fits community culture

### Validation Before Implementation
- Survey users: Is gamification desired?
- Analyze similar platforms
- Define clear goals (engagement? content quality?)
- Establish metrics for success

### Dependencies
- Postings system must be complete and stable
- Moderation workflow must be functional
- User profile display system
- Comment system
- Authentication context required for all protected features
- Database connection pool from `server/config/database.js`

## When to Start Implementation

Begin when:
1. MVP is live and stable
2. User engagement patterns are understood
3. Need for gamification is validated through user feedback
4. Point values can be calibrated based on actual activity

## Recommendations

### Start Simple
- Basic point tracking only
- Tier badge on profile
- Total points display
- Defer leaderboard and detailed history

### Monitor for Gaming
- Quality thresholds for earning points
- Point caps per time period
- Admin tools for manual adjustments

## Report
After implementation, document:
- Files modified
- Tests added/updated
- Any deviations from spec
- Point value calibration results
- User feedback and engagement metrics
- Create plan.md and tasks.md in workflows/rating/
