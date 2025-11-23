---
title: Database Indexing & Optimization
version: 1.0
status: pending
last_updated: 2025-11-23
applies_to: database
enforcement: recommended
---

# Database Indexing & Optimization

## Overview

Recommendations for database indexing, query optimization, and performance tuning.

## Recommended Indexes

### app_users Table

```sql
-- Email lookup (login, search)
CREATE INDEX idx_app_users_email ON app_users(email);

-- Status filtering
CREATE INDEX idx_app_users_status ON app_users(status);

-- Active user queries
CREATE INDEX idx_app_users_active ON app_users(is_active);
```

### POSTINGS Table

```sql
-- Status and date filtering (listing pages)
CREATE INDEX idx_postings_status_created ON POSTINGS(status, created_at);

-- Type filtering
CREATE INDEX idx_postings_type ON POSTINGS(posting_type);

-- Author lookup
CREATE INDEX idx_postings_user ON POSTINGS(author_id);

-- Expiry date queries
CREATE INDEX idx_postings_expires ON POSTINGS(expires_at);
```

### MESSAGES Table

```sql
-- Conversation message retrieval
CREATE INDEX idx_messages_conversation ON MESSAGES(conversation_id, created_at);

-- Sender lookup
CREATE INDEX idx_messages_sender ON MESSAGES(sender_id);
```

### FAMILY_MEMBERS Table

```sql
-- Family email lookup
CREATE INDEX idx_family_email ON FAMILY_MEMBERS(family_email);

-- Parent user lookup
CREATE INDEX idx_family_parent ON FAMILY_MEMBERS(parent_user_id);
```

### USER_INVITATIONS Table

```sql
-- Token lookup (verification)
CREATE INDEX idx_invitations_token ON USER_INVITATIONS(invitation_token(255));

-- Email lookup
CREATE INDEX idx_invitations_email ON USER_INVITATIONS(email);

-- Status filtering
CREATE INDEX idx_invitations_status ON USER_INVITATIONS(status);
```

## Query Optimization Issues

### N+1 Query Problem

**Current Issue**: Chat service fetches participants in a loop.

```javascript
// INEFFICIENT - N+1 queries
for (const conv of conversations) {
  conv.participants = await getParticipants(conv.id);
}
```

**Solution**: Bulk fetch with mapping.

```javascript
// EFFICIENT - 2 queries total
const convIds = conversations.map(c => c.id);
const participantMap = await getParticipantsForConversations(convIds);
conversations.forEach(c => c.participants = participantMap[c.id] || []);
```

### SQL Injection Prevention

**Issue**: String interpolation in LIMIT/OFFSET.

```javascript
// WRONG - SQL injection risk
query += ` LIMIT ${limit} OFFSET ${offset}`;

// RIGHT - parameterized
query += ' LIMIT ? OFFSET ?';
params.push(parseInt(limit) || 20, parseInt(offset) || 0);
```

**Files to Fix**:
- `/routes/postings.js` - LIMIT/OFFSET (partially fixed)
- `/routes/alumni.js` - LIMIT/OFFSET
- `/server/services/chatService.js` - LIMIT/OFFSET

## Slow Query Patterns

### Avoid SELECT *

```sql
-- SLOW
SELECT * FROM POSTINGS WHERE status = 'active';

-- FAST - specify columns
SELECT id, title, author_id, created_at
FROM POSTINGS WHERE status = 'active';
```

### Use EXPLAIN for Analysis

```sql
EXPLAIN SELECT p.*, u.first_name
FROM POSTINGS p
JOIN app_users u ON p.author_id = u.id
WHERE p.status = 'active';
```

### JSON Column Queries

JSON columns can be slow. Consider extracting frequently queried data:

```sql
-- If querying secondary_domain_ids frequently
-- Consider a junction table instead of JSON
```

## Implementation Checklist

- [ ] Create index migration script
- [ ] Run indexes on staging
- [ ] Test query performance with EXPLAIN
- [ ] Fix all SQL injection vulnerabilities
- [ ] Optimize N+1 queries in chatService
- [ ] Review and eliminate SELECT *
- [ ] Set up slow query log monitoring

## Monitoring

Enable slow query log in MySQL:

```sql
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;  -- Log queries > 1 second
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow-query.log';
```

## Acceptance Criteria

- [ ] All recommended indexes created
- [ ] Query performance tested (< 100ms for common queries)
- [ ] Slow query log reviewed
- [ ] No duplicate indexes
- [ ] All SQL injection vulnerabilities fixed
