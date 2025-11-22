# Database Optimization - Technical Specification

```yaml
---
version: 1.0
status: pending
last_updated: 2025-11-22
applies_to: database
enforcement: recommended
---
```

## Goal
Optimize database performance through proper indexing, query optimization, and connection management.

## Features

### 1. Database Indexes
**Status**: Pending

**Requirements**:
- Add indexes for frequently queried columns
- Composite indexes for common filter combinations
- Review slow query log

**Recommended Indexes**:
```sql
-- app_users table
CREATE INDEX idx_app_users_email ON app_users(email);
CREATE INDEX idx_app_users_status ON app_users(status);

-- postings table
CREATE INDEX idx_postings_status_created ON postings(status, created_at);
CREATE INDEX idx_postings_type ON postings(posting_type);
CREATE INDEX idx_postings_user ON postings(user_id);

-- messages table
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- family_members table
CREATE INDEX idx_family_email ON family_members(family_email);

-- invitations table
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
```

**Acceptance Criteria**:
- [ ] All indexes created
- [ ] Query performance tested
- [ ] Slow query log reviewed
- [ ] No duplicate indexes

### 2. Connection Pool Management
**Status**: In Progress

**Requirements**:
- Proper connection limits
- Connection release in finally blocks
- Monitor pool exhaustion

**Configuration**:
```javascript
const pool = mysql.createPool({
  connectionLimit: 10,
  queueLimit: 0,
  waitForConnections: true,
  acquireTimeout: 10000,
  connectTimeout: 10000
});
```

### 3. Query Optimization
**Status**: In Progress

**Issues to Fix**:
- N+1 queries in chatService (conversations, messages)
- String interpolation in LIMIT/OFFSET (SQL injection risk)
- Bulk fetch instead of loop queries

**Pattern for N+1 Fix**:
```javascript
// Instead of:
for (const conv of conversations) {
  conv.participants = await getParticipants(conv.id);
}

// Use:
const participantMap = await getParticipantsForConversations(convIds);
conversations.forEach(c => c.participants = participantMap[c.id]);
```

### 4. SQL Injection Prevention
**Status**: High Priority

**Files to Fix**:
- routes/postings.js (LIMIT/OFFSET)
- routes/alumni.js (LIMIT/OFFSET)
- server/services/chatService.js (LIMIT/OFFSET)

**Pattern**:
```javascript
// WRONG:
query += ` LIMIT ${limit} OFFSET ${offset}`;

// RIGHT:
query += ' LIMIT ? OFFSET ?';
params.push(parseInt(limit) || 20, parseInt(offset) || 0);
```

## Implementation Checklist
- [ ] Create index migration script
- [ ] Run indexes on staging
- [ ] Test query performance
- [ ] Fix all SQL injection vulnerabilities
- [ ] Add finally blocks to all DB operations
- [ ] Optimize N+1 queries
- [ ] Document database schema
