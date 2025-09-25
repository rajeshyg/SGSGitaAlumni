# Task 7.2: Database Schema Mapping

**Status:** 🟡 Planned
**Priority:** Critical
**Estimated Time:** 2-3 days

## Overview
Map all prototype UI screens and components to database schema entities, identifying exact data relationships and integration points. This creates the blueprint for replacing mock data with real database queries across all 18+ screens.

## Objectives
- Map each prototype screen to specific database entities
- Identify data relationships and foreign keys
- Define API endpoint mappings for each screen
- Create data flow diagrams for complex interactions
- Establish query patterns for each feature area

## Prototype Reference
**Source:** `C:\React-Projects\SGSDataMgmtCore\prototypes\react-shadcn-platform`
- **Screens:** 18+ screens documented in phase-2 README
- **Mock Data:** All data structures in `src/lib/mockData.ts`
- **Components:** Data usage patterns throughout components

## Database Schema Entities

### Core Entities
```sql
-- From existing Mermaid schema
USERS (id, email, password_hash, role, created_at, updated_at)
ALUMNI_PROFILES (user_id, first_name, last_name, graduation_year, ...)
POSTINGS (id, author_id, type, title, content, status, ...)
CONVERSATIONS (id, type, created_at, updated_at)
MESSAGES (id, conversation_id, sender_id, content, ...)
MODERATION_DECISIONS (id, posting_id, moderator_id, decision, ...)
ANALYTICS_EVENTS (id, user_id, event_type, event_data, ...)
```

## Screen-to-Entity Mapping

### Authentication Screens
#### Login Screen (`/login`)
- **Primary Entity:** `USERS`
- **Data Fields:** email, password_hash
- **API Endpoint:** `POST /api/auth/login`
- **Response:** JWT token, user basic info
- **Mock Data Source:** `mockUsers` array

#### Registration Screen (`/register`)
- **Primary Entity:** `USERS` + `ALUMNI_PROFILES`
- **Data Fields:** email, password, profile data
- **API Endpoint:** `POST /api/auth/register`
- **Response:** User creation confirmation
- **Mock Data Source:** User registration flow

### Dashboard Screens
#### Member Dashboard (`/member-dashboard`)
- **Primary Entity:** `USERS` (current user)
- **Related Entities:** `POSTINGS`, `CONVERSATIONS`, `ANALYTICS_EVENTS`
- **Data Fields:** User stats, recent conversations, personalized posts
- **API Endpoints:**
  - `GET /api/users/me` - Current user profile
  - `GET /api/postings/recommended` - Personalized posts
  - `GET /api/conversations/recent` - Recent messages
  - `GET /api/analytics/user-stats` - User statistics
- **Mock Data Source:** `mockDashboardStats`, `mockConversations`

#### Admin Dashboard (`/admin`)
- **Primary Entity:** `ANALYTICS_EVENTS`
- **Related Entities:** `USERS`, `POSTINGS`, `MODERATION_DECISIONS`
- **Data Fields:** System-wide statistics, moderation queue
- **API Endpoints:**
  - `GET /api/analytics/system-overview` - System stats
  - `GET /api/moderation/pending` - Pending moderations
  - `GET /api/users/count` - User counts
- **Mock Data Source:** Math.random() generated stats (to be removed)

### Directory Screens
#### Alumni Directory (`/alumni-directory`)
- **Primary Entity:** `ALUMNI_PROFILES`
- **Related Entities:** `USERS` (for contact info)
- **Data Fields:** Profile summaries, search filters
- **API Endpoints:**
  - `GET /api/alumni/search` - Search with filters
  - `GET /api/alumni/directory` - Paginated directory
- **Mock Data Source:** `mockAlumni` array with filters

#### Profile View (`/profile/:id`)
- **Primary Entity:** `ALUMNI_PROFILES`
- **Related Entities:** `USERS`, `POSTINGS` (user's posts)
- **Data Fields:** Complete profile, post history
- **API Endpoints:**
  - `GET /api/alumni/profile/:id` - Full profile
  - `GET /api/postings/user/:id` - User's postings
- **Mock Data Source:** `mockAlumniProfiles`

### Posting Screens
#### Create Posting (`/create-posting`)
- **Primary Entity:** `POSTINGS`
- **Related Entities:** `USERS` (author)
- **Data Fields:** Title, content, category, type, attachments
- **API Endpoint:** `POST /api/postings`
- **Mock Data Source:** Form data with validation

#### Posting List (`/postings`)
- **Primary Entity:** `POSTINGS`
- **Related Entities:** `USERS` (authors), `MODERATION_DECISIONS`
- **Data Fields:** Postings with author info, moderation status
- **API Endpoints:**
  - `GET /api/postings` - List with filters
  - `GET /api/postings/:id` - Single posting
- **Mock Data Source:** `mockPostings` array

### Messaging Screens
#### Chat Interface (`/chat`)
- **Primary Entity:** `CONVERSATIONS`
- **Related Entities:** `MESSAGES`, `USERS` (participants)
- **Data Fields:** Conversation list, messages, participants
- **API Endpoints:**
  - `GET /api/conversations` - User's conversations
  - `GET /api/messages/:conversationId` - Messages in conversation
  - `POST /api/messages` - Send message
- **Mock Data Source:** `mockConversations`, `mockMessages`

### Moderation Screens
#### Moderation Dashboard (`/moderation`)
- **Primary Entity:** `MODERATION_DECISIONS`
- **Related Entities:** `POSTINGS`, `USERS` (moderators)
- **Data Fields:** Pending decisions, moderation history
- **API Endpoints:**
  - `GET /api/moderation/pending` - Pending moderations
  - `POST /api/moderation/decide` - Make decision
- **Mock Data Source:** Moderation queue data

### Analytics Screens
#### Analytics Dashboard (`/analytics`)
- **Primary Entity:** `ANALYTICS_EVENTS`
- **Related Entities:** `USERS`, `POSTINGS`
- **Data Fields:** Event counts, user activity, posting stats
- **API Endpoints:**
  - `GET /api/analytics/events` - Event data
  - `GET /api/analytics/users` - User analytics
  - `GET /api/analytics/postings` - Posting analytics
- **Mock Data Source:** Analytics data arrays

## Data Relationship Mapping

### User Profile Relationships
```
USERS (1) ──── (1) ALUMNI_PROFILES
   │
   ├── (many) POSTINGS (authored)
   ├── (many) CONVERSATIONS (participant)
   ├── (many) MESSAGES (sent)
   ├── (many) MODERATION_DECISIONS (made)
   └── (many) ANALYTICS_EVENTS (generated)
```

### Posting Relationships
```
POSTINGS (1) ──── (1) USERS (author)
   │
   └── (0-1) MODERATION_DECISIONS (moderation)
```

### Conversation Relationships
```
CONVERSATIONS (1) ──── (many) MESSAGES
   │
   └── (many) USERS (participants via messages)
```

## API Endpoint Mapping

### Authentication Endpoints
```
/api/auth/
├── POST /login
├── POST /register
├── POST /logout
└── POST /refresh
```

### User Management Endpoints
```
/api/users/
├── GET /me (current user)
├── GET /:id (user details)
└── PUT /profile (update profile)
```

### Alumni Endpoints
```
/api/alumni/
├── GET /search (search with filters)
├── GET /directory (paginated list)
└── GET /profile/:id (full profile)
```

### Posting Endpoints
```
/api/postings/
├── GET / (list with filters)
├── POST / (create)
├── GET /:id (single posting)
├── PUT /:id (update)
└── DELETE /:id (delete)
```

### Messaging Endpoints
```
/api/messages/
├── GET /conversations (user's conversations)
├── GET /:conversationId (messages in conversation)
├── POST / (send message)
└── POST /conversations (create conversation)
```

### Moderation Endpoints
```
/api/moderation/
├── GET /pending (pending decisions)
├── POST /decide (make decision)
└── GET /history (moderation history)
```

### Analytics Endpoints
```
/api/analytics/
├── GET /events (event data)
├── GET /users (user analytics)
├── GET /postings (posting analytics)
└── GET /system (system overview)
```

## Implementation Strategy

### Phase 1: Entity Mapping
- [ ] Map each screen to primary/related entities
- [ ] Identify required data fields for each screen
- [ ] Define API response structures
- [ ] Create data flow diagrams

### Phase 2: Query Pattern Definition
- [ ] Define search and filter patterns
- [ ] Establish pagination strategies
- [ ] Plan caching and invalidation
- [ ] Design error handling patterns

### Phase 3: Integration Point Identification
- [ ] Identify all mock data usage points
- [ ] Map mock data to real API calls
- [ ] Define loading and error states
- [ ] Plan optimistic updates

### Phase 4: Data Flow Architecture
- [ ] Design state management patterns
- [ ] Plan real-time update mechanisms
- [ ] Define offline data strategies
- [ ] Create data synchronization patterns

## Quality Standards Compliance

### Data Integrity
- [ ] **Schema Compliance:** All mappings match database schema
- [ ] **Relationship Validation:** Foreign keys properly mapped
- [ ] **Data Types:** Correct TypeScript types for all fields
- [ ] **Null Safety:** Proper handling of optional relationships

### Performance
- [ ] **Query Optimization:** Efficient database queries planned
- [ ] **Pagination:** Proper pagination for large datasets
- [ ] **Caching:** Intelligent caching strategies defined
- [ ] **Indexing:** Database indexes identified

### Security
- [ ] **Access Control:** Proper authorization checks defined
- [ ] **Data Privacy:** Sensitive data protection planned
- [ ] **Input Validation:** API input validation requirements
- [ ] **Audit Trail:** Data access logging planned

## Success Criteria

### Mapping Completeness
- [ ] **Screen Coverage:** All 18+ screens mapped to entities
- [ ] **Data Fields:** All required fields identified
- [ ] **Relationships:** All entity relationships documented
- [ ] **API Endpoints:** Complete endpoint mapping
- [ ] **Mock Data:** All mock data sources identified
- [ ] **Integration Points:** Clear replacement strategy for each mock usage

### Technical Accuracy
- [ ] **Schema Alignment:** Perfect alignment with database schema
- [ ] **Type Safety:** TypeScript interfaces defined
- [ ] **Query Patterns:** Efficient query strategies planned
- [ ] **Error Handling:** Error scenarios identified
- [ ] **Performance:** Optimized data access patterns

### Documentation Quality
- [ ] **Clear Mapping:** Unambiguous entity relationships
- [ ] **API Contracts:** Well-defined request/response formats
- [ ] **Data Flow:** Clear data flow documentation
- [ ] **Implementation Guide:** Ready for development teams

### Validation Readiness
- [ ] **Testable:** Mappings support automated testing
- [ ] **Measurable:** Success criteria clearly defined
- [ ] **Auditable:** Changes can be tracked and validated
- [ ] **Maintainable:** Easy to update as schema evolves

## Dependencies

### Required Before Starting
- ✅ **Database Schema:** Complete schema documentation
- ✅ **Prototype Analysis:** All screens and data usage identified
- ✅ **API Design:** Basic API structure defined
- ✅ **Entity Relationships:** Database relationships documented

### External Dependencies
- **Database Schema:** Finalized Azure MySQL schema
- **API Specifications:** Backend API endpoint definitions
- **Prototype Screens:** Complete screen inventory
- **Mock Data Analysis:** All mock data usage documented

## Risk Mitigation

### Schema Changes
- **Version Control:** Schema versioning strategy
- **Migration Planning:** Data migration considerations
- **Backward Compatibility:** API versioning approach
- **Testing:** Schema change testing procedures

### Complex Relationships
- **Documentation:** Detailed relationship documentation
- **Query Planning:** Complex query optimization
- **Performance Testing:** Relationship query performance validation
- **Indexing Strategy:** Proper database indexing

### Data Volume Issues
- **Pagination Strategy:** Efficient large dataset handling
- **Caching Strategy:** Intelligent data caching
- **Query Optimization:** Database query optimization
- **Monitoring:** Performance monitoring setup

## Validation Steps

### After Mapping Completion
```bash
# Validate mapping completeness
npm run validate-schema-mapping

# Check documentation standards
npm run validate-documentation-standards

# Test mapping against prototype
npm run test:mapping-consistency
```

### Manual Validation Checklist
- [ ] Every screen has primary entity mapping
- [ ] All data fields traceable to schema
- [ ] API endpoints logically organized
- [ ] No unmapped mock data usage
- [ ] Relationships properly documented
- [ ] Performance considerations addressed
- [ ] Security requirements identified

## Next Steps
1. **Complete Entity Mapping:** Map all screens to database entities
2. **Define API Contracts:** Specify request/response formats
3. **Create Data Flow Diagrams:** Visualize complex interactions
4. **Plan Query Optimization:** Design efficient data access patterns
5. **Validate Mapping:** Cross-reference with prototype and schema

---

*Task 7.2 provides the complete blueprint for replacing mock data with real database integration across all business features.*