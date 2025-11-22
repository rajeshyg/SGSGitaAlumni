# Rating & Recognition - Functional Specification

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
