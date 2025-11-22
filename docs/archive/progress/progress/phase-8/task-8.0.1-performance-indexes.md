# Task 8.0.1: Performance Indexes - Database Optimization

**Status:** 🟡 Planned
**Priority:** Medium
**Duration:** 1 day
**Parent Task:** [Task 8.0: Database Design Fixes](./task-8.0-database-design-fixes.md)
**Related:** [Task 8.12: Violation Corrections](./task-8.12-violation-corrections.md) - Action 13

## Overview
Add composite database indexes on frequently queried columns to optimize query performance and reduce page load times.

**Problem:** Slow query performance on large tables due to missing indexes on commonly queried columns and foreign key relationships.

## Technical Requirements

### Index Strategy

#### 1. POSTINGS Table Indexes

```sql
-- Query: Get postings by domain and status
CREATE INDEX idx_postings_domain_status 
  ON POSTINGS(domain_id, moderation_status, created_at DESC);

-- Query: Get postings by category
CREATE INDEX idx_postings_category 
  ON POSTINGS(category_id, moderation_status, created_at DESC);

-- Query: Get user's postings
CREATE INDEX idx_postings_user 
  ON POSTINGS(created_by, created_at DESC);

-- Query: Get expiring postings
CREATE INDEX idx_postings_expiry 
  ON POSTINGS(expiry_date) 
  WHERE moderation_status = 'APPROVED' AND expiry_date > NOW();

-- Query: Full-text search on title and description
CREATE INDEX idx_postings_search 
  ON POSTINGS USING gin(to_tsvector('english', title || ' ' || description));
```

#### 2. USER_PREFERENCES Table Indexes

```sql
-- Query: Get preferences by user
CREATE INDEX idx_preferences_user 
  ON USER_PREFERENCES(user_id);

-- Query: Get preferences by family member
CREATE INDEX idx_preferences_family_member 
  ON USER_PREFERENCES(family_member_id) 
  WHERE family_member_id IS NOT NULL;

-- Query: Find users interested in specific domain
CREATE INDEX idx_preferences_domains 
  ON USER_PREFERENCES USING gin(selected_domains);
```

#### 3. FAMILY_MEMBERS Table Indexes

```sql
-- Query: Get family members by parent user
CREATE INDEX idx_family_members_parent 
  ON FAMILY_MEMBERS(parent_user_id, can_access_platform);

-- Query: Get accessible family members (age-based)
CREATE INDEX idx_family_members_accessible 
  ON FAMILY_MEMBERS(parent_user_id, date_of_birth) 
  WHERE can_access_platform = true;

-- Query: Get family member by email
CREATE INDEX idx_family_members_email 
  ON FAMILY_MEMBERS(LOWER(email)) 
  WHERE email IS NOT NULL;
```

#### 4. CONVERSATIONS & MESSAGES Indexes

```sql
-- Query: Get user's conversations
CREATE INDEX idx_conversation_participants 
  ON CONVERSATION_PARTICIPANTS(user_id, conversation_id);

-- Query: Get messages in conversation
CREATE INDEX idx_messages_conversation_time 
  ON MESSAGES(conversation_id, created_at DESC) 
  WHERE deleted_at IS NULL;

-- Query: Get unread messages
CREATE INDEX idx_messages_unread 
  ON MESSAGES(conversation_id, created_at) 
  WHERE created_at > (
    SELECT last_read_at 
    FROM CONVERSATION_PARTICIPANTS 
    WHERE user_id = current_user_id
  );
```

#### 5. USER_INVITATIONS Table Indexes

```sql
-- Query: Get invitation by token
CREATE INDEX idx_invitations_token 
  ON USER_INVITATIONS(token_hash) 
  WHERE status = 'PENDING';

-- Query: Get user's sent invitations
CREATE INDEX idx_invitations_inviter 
  ON USER_INVITATIONS(invited_by, created_at DESC);

-- Query: Get pending invitations by email
CREATE INDEX idx_invitations_email_status 
  ON USER_INVITATIONS(LOWER(invitee_email), status);
```

#### 6. MODERATION_HISTORY Indexes

```sql
-- Query: Get moderation history for posting
CREATE INDEX idx_moderation_posting 
  ON MODERATION_HISTORY(posting_id, created_at DESC);

-- Query: Get moderator's actions
CREATE INDEX idx_moderation_moderator 
  ON MODERATION_HISTORY(moderator_id, action, created_at DESC);

-- Query: Get recent moderation actions
CREATE INDEX idx_moderation_recent 
  ON MODERATION_HISTORY(action, created_at DESC);
```

### Index Analysis Queries

```sql
-- Find missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  AND n_distinct > 100
ORDER BY abs(correlation) DESC;

-- Find unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey';

-- Analyze query performance
EXPLAIN ANALYZE 
SELECT * FROM POSTINGS 
WHERE domain_id = '...' 
  AND moderation_status = 'APPROVED' 
ORDER BY created_at DESC 
LIMIT 20;
```

## Implementation Plan

### Morning (4 hours)
- [ ] Run index analysis queries
- [ ] Create POSTINGS table indexes
- [ ] Create USER_PREFERENCES indexes
- [ ] Create FAMILY_MEMBERS indexes
- [ ] Test query performance improvements

### Afternoon (4 hours)
- [ ] Create CONVERSATIONS/MESSAGES indexes
- [ ] Create USER_INVITATIONS indexes
- [ ] Create MODERATION_HISTORY indexes
- [ ] Run ANALYZE on all tables
- [ ] Document query performance gains
- [ ] Update migration scripts

## Success Criteria

- [ ] All frequently queried columns have indexes
- [ ] Composite indexes cover common WHERE clauses
- [ ] Posting queries <50ms (currently 200ms+)
- [ ] Family member queries <20ms (currently 100ms+)
- [ ] No unused indexes (idx_scan > 0)
- [ ] Query plans use index scans, not seq scans

## Testing Checklist

### Before/After Performance Tests

```sql
-- Test 1: Get approved postings in domain
EXPLAIN ANALYZE 
SELECT * FROM POSTINGS 
WHERE domain_id = '...' 
  AND moderation_status = 'APPROVED' 
ORDER BY created_at DESC 
LIMIT 20;
-- Target: <50ms (currently ~200ms)

-- Test 2: Get family members for parent
EXPLAIN ANALYZE 
SELECT * FROM FAMILY_MEMBERS 
WHERE parent_user_id = '...' 
  AND can_access_platform = true;
-- Target: <20ms (currently ~100ms)

-- Test 3: Get user preferences
EXPLAIN ANALYZE 
SELECT * FROM USER_PREFERENCES 
WHERE user_id = '...';
-- Target: <10ms (currently ~50ms)

-- Test 4: Search postings
EXPLAIN ANALYZE 
SELECT * FROM POSTINGS 
WHERE to_tsvector('english', title || ' ' || description) @@ to_tsquery('job');
-- Target: <100ms (currently ~500ms)
```

### Index Usage Verification

```sql
-- Verify indexes are being used
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as times_used,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

## Dependencies

### Required Before Starting
- PostgreSQL database with all tables created
- Access to production-like data volumes for testing

### Blocks These Tasks
- Large-scale performance optimization
- Production deployment readiness

## Related Documentation
- [Task 8.0: Database Design Fixes](./task-8.0-database-design-fixes.md)
- [Task 8.12: Violation Corrections](./task-8.12-violation-corrections.md)
- [PostgreSQL Index Documentation](https://www.postgresql.org/docs/current/indexes.html)

---

*This task optimizes database query performance through strategic index placement, improving overall platform responsiveness.*
