# Rating & Recognition System - Scout Report (Planning Phase)

**Date**: 2025-11-23  
**Feature**: Rating & Recognition System  
**Status**: Pending - Not Started  
**Priority**: Low (Post-MVP Enhancement)

## Overview

This is a planning document for the rating and recognition feature, which is scheduled for post-MVP as an enhancement. The scout phase has not been executed yet, but this document outlines what will be needed when development begins.

## Planned Scope

### 1. Rating Tier System
- Three tiers: Bronze, Silver, Gold
- Visual badges displayed on profiles
- Automatic tier assignment based on points
- Tier thresholds:
  - Bronze: 0-99 points
  - Silver: 100-499 points
  - Gold: 500+ points

### 2. Point System
Automated point accumulation for contributions:
- Create posting: 10 points
- Posting approved: +5 bonus
- Comment on posting: 2 points
- Receive like: 1 point
- "Helpful" rating: 5 points

### 3. Contribution Tracking
- Points history/activity log
- Profile statistics
- Optional: Leaderboard
- Recognition on dashboard

## Preliminary Technical Considerations

### Backend Components to Create
- `routes/ratings.js` - Rating/points API endpoints
- `server/services/ratingService.js` - Point calculation logic
- Database schema for user_ratings and contribution_log tables
- Event handlers for point-earning actions
- Batch job for tier recalculation (if needed)

### Frontend Components to Create
- `src/components/ratings/RatingBadge.tsx` - Tier badge component
- `src/components/ratings/PointsHistory.tsx` - Activity log
- `src/components/ratings/Leaderboard.tsx` - Top contributors (optional)
- `src/pages/Profile.tsx` - Add rating display
- Dashboard widgets for points/tier

### Database Schema (From Spec)
```sql
CREATE TABLE user_ratings (
  user_id INT PRIMARY KEY,
  total_points INT DEFAULT 0,
  current_tier ENUM('bronze', 'silver', 'gold') DEFAULT 'bronze',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE contribution_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- 'posting', 'comment', 'like_received', etc.
  points INT NOT NULL,
  reference_type VARCHAR(50), -- 'posting', 'comment'
  reference_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, created_at)
);
```

## Integration Points

### Point-Earning Triggers
Identify existing code that should trigger point awards:

1. **Posting Creation** (10 points)
   - Location: `routes/postings.js` POST endpoint
   - Trigger: After posting saved to database
   
2. **Posting Approval** (5 bonus points)
   - Location: `routes/moderation.js` approval endpoint
   - Trigger: When status changes to 'active'
   
3. **Comment Creation** (2 points)
   - Location: `routes/postings.js` comment endpoint
   - Trigger: After comment saved
   
4. **Receiving Like** (1 point)
   - Location: `routes/postings.js` like endpoint
   - Trigger: When like count increases
   
5. **Helpful Rating** (5 points)
   - Location: TBD - may need new endpoint
   - Trigger: When marked as helpful

### Existing Systems to Integrate
- User profiles (display badge and points)
- Dashboard (show activity feed)
- Postings system (trigger point events)
- Moderation system (approval trigger)

## Architecture Considerations

### Point Calculation Strategy
**Option A: Real-time Calculation**
- Points calculated immediately on action
- Pros: Up-to-date, simple logic
- Cons: Higher database writes

**Option B: Batch Processing**
- Points calculated periodically (e.g., hourly)
- Pros: Lower database load
- Cons: Delayed updates, more complex

**Recommendation**: Option A for MVP - real-time is simpler and users expect immediate feedback

### Tier Assignment Logic
```javascript
function calculateTier(points) {
  if (points >= 500) return 'gold';
  if (points >= 100) return 'silver';
  return 'bronze';
}
```

### Preventing Gaming/Abuse
- Rate limit posting creation (already exists)
- Minimum content quality for points (leverage moderation)
- Point decay for deleted content
- Admin ability to adjust points manually

## Dependencies

### Internal Dependencies
- Postings system (must be complete)
- Moderation workflow (must be functional)
- User profile display
- Comment system

### External Dependencies
- None (self-contained feature)

## When to Start Scout Phase

The scout phase should begin when:
1. MVP is live and stable
2. User engagement patterns are understood
3. Need for gamification is validated
4. Point values can be calibrated based on activity

## Estimated Effort

**Total Estimated Time**: 12-16 hours

### Phase Breakdown
- **Phase 1**: Database and point service (4 hours)
  - Schema creation
  - Point calculation service
  - Event handlers
  
- **Phase 2**: Frontend components (6 hours)
  - Rating badge component
  - Points display on profile
  - Activity history
  
- **Phase 3**: Integration and testing (4 hours)
  - Integrate with existing features
  - Comprehensive testing
  - Calibrate point values
  
- **Optional**: Leaderboard (4 hours)

## Recommendations

### MVP Approach
1. Start with simple point tracking
2. Display tier badge on profile only
3. Show total points, not detailed history
4. Defer leaderboard until after launch

### Future Enhancements
- Achievement badges (e.g., "10 helpful comments")
- Monthly/annual awards
- Point redemption for perks
- Team/batch recognition
- Custom achievements for admins

### Validation Before Build
- Survey users: Is gamification desired?
- Analyze similar platforms
- Define clear goals (engagement? content quality?)
- Establish metrics for success

## Risks and Considerations

### Risk 1: Gaming the System
- Users may create low-quality content for points
- Mitigation: Moderation, quality thresholds, point caps

### Risk 2: Discouraging Participation
- Low-point users may feel discouraged
- Mitigation: Everyone starts at bronze, positive messaging

### Risk 3: Point Inflation
- Too easy to earn points = devalued system
- Mitigation: Careful calibration, regular review

### Risk 4: Maintenance Overhead
- Managing disputes, adjusting values
- Mitigation: Clear policies, admin tools

## Next Steps (When Ready to Implement)

1. Validate need through user research
2. Run full scout phase:
   - Map all point-earning actions
   - Design point economy
   - Create badge designs
   
3. Create detailed implementation plan:
   - Break down into tasks
   - Define API contracts
   - Design database schema
   - Write test strategy
   
4. Pilot with small user group:
   - Gather feedback
   - Adjust point values
   - Refine tier thresholds

## Related Documentation
- User profile display (see specs/functional/user-management.md)
- Postings engagement (see specs/functional/postings.md)
- Moderation workflow (see specs/functional/moderation.md)

## Status
🔜 **PENDING** - Low priority enhancement for post-MVP

## Notes
- Consider whether this feature aligns with community culture
- Some communities thrive with gamification, others prefer simplicity
- Could be optional/toggle-able per deployment
- Tier names could be customizable (Bronze/Silver/Gold vs. Community-specific)
