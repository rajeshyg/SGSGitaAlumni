# Task 7.2: Database Schema Mapping

**Status:** ✅ Complete
**Priority:** Critical
**Completion Date:** September 26, 2025
**Actual Time:** 1 day

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

### Core Entities (Updated for Invitation-Based System)
```sql
-- Core Authentication (Updated for Phase 8 Requirements)
USERS (id, email, password_hash, role, invitation_id, requires_otp, ...)
ALUMNI_PROFILES (user_id, first_name, last_name, graduation_year, ...)
USER_INVITATIONS (id, email, invitation_token, invited_by, status, ...)
OTP_TOKENS (id, email, otp_code, token_type, expires_at, ...)
FAMILY_INVITATIONS (id, parent_email, children_profiles, status, ...)

-- Business Features
POSTINGS (id, author_id, type, title, content, status, ...)
CONVERSATIONS (id, type, created_at, updated_at)
MESSAGES (id, conversation_id, sender_id, content, ...)
MODERATION_DECISIONS (id, posting_id, moderator_id, decision, ...)
ANALYTICS_EVENTS (id, user_id, event_type, event_data, ...)
```

## ✅ CURRENT IMPLEMENTATION STATUS

### Existing Screens (Current Project)
1. **HomePage** (`/`) - Basic dashboard landing
2. **AdminPage** (`/admin`) - Data management interface

### Existing Data Structures
- **FileImport** - File upload and processing data
- **User Profile** - Basic user information
- **Mock Data** - Development data in `mockData.ts` and `mockApiData.ts`

## 🎯 COMPREHENSIVE SCREEN-TO-ENTITY MAPPING

Based on the complete database schema and alumni networking requirements, here are the 18+ screens that need to be implemented:

### 🔐 Authentication Screens

#### Login Screen (`/login`)
- **Primary Entity:** `USERS`
- **Related Entities:** `USER_SESSIONS`, `USER_PREFERENCES`
- **Data Fields:** email, password_hash, session_token, device_info
- **API Endpoints:**
  - `POST /api/auth/login` - User authentication
  - `POST /api/auth/session` - Session creation
- **Database Queries:**
  ```sql
  SELECT u.*, up.* FROM USERS u
  LEFT JOIN USER_PROFILES up ON u.id = up.user_id
  WHERE u.email = ? AND u.status = 'active'
  ```
- **Mock Data Replacement:** Replace `mockUsers` with real user authentication

#### Registration Screen (`/register`)
- **Primary Entity:** `USERS` + `USER_PROFILES` + `ALUMNI_PROFILES`
- **Related Entities:** `USER_ROLES`, `USER_PREFERENCES`
- **Data Fields:** email, password, profile data, graduation info
- **API Endpoints:**
  - `POST /api/auth/register` - User registration
  - `POST /api/profiles/alumni` - Alumni profile creation
- **Database Queries:**
  ```sql
  INSERT INTO USERS (id, email, password_hash, user_type, status)
  INSERT INTO USER_PROFILES (user_id, first_name, last_name, display_name)
  INSERT INTO ALUMNI_PROFILES (user_profile_id, graduation_date, major)
  ```
- **Mock Data Replacement:** Replace registration flow with real database integration

#### Password Reset Screen (`/reset-password`)
- **Primary Entity:** `PASSWORD_RESETS`
- **Related Entities:** `USERS`
- **Data Fields:** reset_token, secure_link_token, expiration
- **API Endpoints:**
  - `POST /api/auth/reset-request` - Request password reset
  - `POST /api/auth/reset-confirm` - Confirm password reset
- **Database Queries:**
  ```sql
  INSERT INTO PASSWORD_RESETS (user_id, reset_token, expires_at)
  UPDATE USERS SET password_hash = ? WHERE id = ?
  ```

### 👤 Profile Management Screens

#### User Dashboard (`/dashboard`)
- **Primary Entity:** `USER_PROFILES`
- **Related Entities:** `ALUMNI_PROFILES`, `POSTINGS`, `CONVERSATIONS`, `NOTIFICATIONS`
- **Data Fields:** profile info, recent activity, notifications, quick stats
- **API Endpoints:**
  - `GET /api/users/dashboard` - Dashboard data
  - `GET /api/notifications/recent` - Recent notifications
  - `GET /api/analytics/user-activity` - User activity stats
- **Database Queries:**
  ```sql
  SELECT up.*, ap.*, COUNT(p.id) as posting_count, COUNT(c.id) as conversation_count
  FROM USER_PROFILES up
  LEFT JOIN ALUMNI_PROFILES ap ON up.id = ap.user_profile_id
  LEFT JOIN POSTINGS p ON up.user_id = p.author_id
  LEFT JOIN CONVERSATIONS c ON up.user_id = c.creator_id
  WHERE up.user_id = ?
  ```
- **Mock Data Replacement:** Replace dashboard mock data with real user metrics

#### Profile View Screen (`/profile/:id`)
- **Primary Entity:** `ALUMNI_PROFILES`
- **Related Entities:** `USER_PROFILES`, `EDUCATION_HISTORY`, `CAREER_HISTORY`, `ALUMNI_SKILLS`, `ALUMNI_DOMAINS`
- **Data Fields:** complete profile, education, career, skills, domains
- **API Endpoints:**
  - `GET /api/profiles/alumni/:id` - Alumni profile details
  - `GET /api/profiles/:id/education` - Education history
  - `GET /api/profiles/:id/career` - Career history
- **Database Queries:**
  ```sql
  SELECT ap.*, up.*, eh.*, ch.*, s.name as skill_name, d.name as domain_name
  FROM ALUMNI_PROFILES ap
  JOIN USER_PROFILES up ON ap.user_profile_id = up.id
  LEFT JOIN EDUCATION_HISTORY eh ON ap.id = eh.alumni_profile_id
  LEFT JOIN CAREER_HISTORY ch ON ap.id = ch.alumni_profile_id
  LEFT JOIN ALUMNI_SKILLS ask ON ap.id = ask.alumni_profile_id
  LEFT JOIN SKILLS s ON ask.skill_id = s.id
  LEFT JOIN ALUMNI_DOMAINS ad ON ap.id = ad.alumni_profile_id
  LEFT JOIN DOMAINS d ON ad.domain_id = d.id
  WHERE ap.id = ?
  ```

#### Profile Edit Screen (`/profile/edit`)
- **Primary Entity:** `ALUMNI_PROFILES`
- **Related Entities:** `USER_PROFILES`, `EDUCATION_HISTORY`, `CAREER_HISTORY`, `ALUMNI_SKILLS`
- **Data Fields:** editable profile fields, education, career, skills
- **API Endpoints:**
  - `PUT /api/profiles/alumni/:id` - Update alumni profile
  - `POST /api/profiles/:id/education` - Add education
  - `PUT /api/profiles/:id/education/:eduId` - Update education
  - `DELETE /api/profiles/:id/education/:eduId` - Remove education
- **Database Queries:**
  ```sql
  UPDATE ALUMNI_PROFILES SET graduation_date = ?, major = ?, minor = ? WHERE id = ?
  UPDATE USER_PROFILES SET first_name = ?, last_name = ?, bio = ? WHERE id = ?
  INSERT INTO EDUCATION_HISTORY (alumni_profile_id, institution_name, degree_type)
  ```

### 📁 Directory & Search Screens

#### Alumni Directory (`/directory`)
- **Primary Entity:** `ALUMNI_PROFILES`
- **Related Entities:** `USER_PROFILES`, `DOMAINS`, `ALUMNI_DOMAINS`
- **Data Fields:** searchable alumni list, filters, pagination
- **API Endpoints:**
  - `GET /api/alumni/directory` - Paginated alumni list
  - `GET /api/alumni/search` - Search with filters
  - `GET /api/domains` - Available domains for filtering
- **Database Queries:**
  ```sql
  SELECT ap.*, up.first_name, up.last_name, up.avatar_url, d.name as domain_name
  FROM ALUMNI_PROFILES ap
  JOIN USER_PROFILES up ON ap.user_profile_id = up.id
  LEFT JOIN ALUMNI_DOMAINS ad ON ap.id = ad.alumni_profile_id
  LEFT JOIN DOMAINS d ON ad.domain_id = d.id
  WHERE ap.alumni_status = 'active'
  ORDER BY up.last_name, up.first_name
  LIMIT ? OFFSET ?
  ```
- **Mock Data Replacement:** Replace directory mock data with real alumni search

#### Advanced Search (`/search`)
- **Primary Entity:** `ALUMNI_PROFILES`
- **Related Entities:** `USER_PROFILES`, `EDUCATION_HISTORY`, `CAREER_HISTORY`, `ALUMNI_SKILLS`, `DOMAINS`
- **Data Fields:** advanced filters, search results, saved searches
- **API Endpoints:**
  - `POST /api/alumni/advanced-search` - Complex search queries
  - `GET /api/search/filters` - Available filter options
  - `POST /api/search/save` - Save search criteria
- **Database Queries:**
  ```sql
  SELECT DISTINCT ap.*, up.first_name, up.last_name
  FROM ALUMNI_PROFILES ap
  JOIN USER_PROFILES up ON ap.user_profile_id = up.id
  LEFT JOIN EDUCATION_HISTORY eh ON ap.id = eh.alumni_profile_id
  LEFT JOIN CAREER_HISTORY ch ON ap.id = ch.alumni_profile_id
  LEFT JOIN ALUMNI_SKILLS ask ON ap.id = ask.alumni_profile_id
  LEFT JOIN SKILLS s ON ask.skill_id = s.id
  WHERE (? IS NULL OR ap.graduation_date BETWEEN ? AND ?)
  AND (? IS NULL OR ap.major LIKE ?)
  AND (? IS NULL OR ch.company LIKE ?)
  AND (? IS NULL OR s.name IN (?))
  ```

### 📝 Postings & Content Screens

#### Postings Feed (`/postings`)
- **Primary Entity:** `POSTINGS`
- **Related Entities:** `USERS`, `POSTING_CATEGORIES`, `POSTING_DOMAINS`, `POSTING_INTERESTS`
- **Data Fields:** posting list, categories, interest tracking
- **API Endpoints:**
  - `GET /api/postings` - Paginated postings feed
  - `GET /api/postings/categories` - Available categories
  - `POST /api/postings/:id/interest` - Express interest
- **Database Queries:**
  ```sql
  SELECT p.*, u.first_name, u.last_name, pc.name as category_name,
         COUNT(pi.id) as interest_count
  FROM POSTINGS p
  JOIN USERS u ON p.author_id = u.id
  LEFT JOIN POSTING_CATEGORIES pc ON p.id = pc.posting_id
  LEFT JOIN POSTING_INTERESTS pi ON p.id = pi.posting_id
  WHERE p.status = 'approved' AND p.expires_at > NOW()
  GROUP BY p.id
  ORDER BY p.published_at DESC
  ```

#### Create Posting (`/postings/create`)
- **Primary Entity:** `POSTINGS`
- **Related Entities:** `POSTING_CATEGORIES`, `POSTING_DOMAINS`, `POSTING_ATTACHMENTS`
- **Data Fields:** posting form, categories, domains, attachments
- **API Endpoints:**
  - `POST /api/postings` - Create new posting
  - `POST /api/postings/:id/attachments` - Upload attachments
  - `GET /api/postings/categories` - Available categories
- **Database Queries:**
  ```sql
  INSERT INTO POSTINGS (id, author_id, title, content, posting_type, urgency_level, status)
  INSERT INTO POSTING_CATEGORIES (posting_id, category_id)
  INSERT INTO POSTING_DOMAINS (posting_id, domain_id)
  INSERT INTO POSTING_ATTACHMENTS (posting_id, file_name, file_url)
  ```

#### Posting Detail (`/postings/:id`)
- **Primary Entity:** `POSTINGS`
- **Related Entities:** `USERS`, `POSTING_INTERESTS`, `POSTING_ATTACHMENTS`, `HELP_REQUESTS`
- **Data Fields:** full posting, author info, interests, help requests
- **API Endpoints:**
  - `GET /api/postings/:id` - Posting details
  - `GET /api/postings/:id/interests` - Interest list
  - `POST /api/postings/:id/help-request` - Create help request
- **Database Queries:**
  ```sql
  SELECT p.*, u.first_name, u.last_name, u.email,
         pa.file_name, pa.file_url,
         COUNT(pi.id) as total_interests
  FROM POSTINGS p
  JOIN USERS u ON p.author_id = u.id
  LEFT JOIN POSTING_ATTACHMENTS pa ON p.id = pa.posting_id
  LEFT JOIN POSTING_INTERESTS pi ON p.id = pi.posting_id
  WHERE p.id = ? AND p.status = 'approved'
  GROUP BY p.id
  ```

### 💬 Messaging & Communication Screens

#### Conversations List (`/messages`)
- **Primary Entity:** `CONVERSATIONS`
- **Related Entities:** `CONVERSATION_PARTICIPANTS`, `MESSAGES`, `USERS`
- **Data Fields:** conversation list, unread counts, last messages
- **API Endpoints:**
  - `GET /api/conversations` - User's conversations
  - `GET /api/conversations/:id/messages` - Conversation messages
  - `POST /api/conversations` - Create new conversation
- **Database Queries:**
  ```sql
  SELECT c.*, cp.role, u.first_name, u.last_name,
         m.content as last_message, m.sent_at as last_message_time,
         COUNT(CASE WHEN m.status != 'read' AND m.sender_id != ? THEN 1 END) as unread_count
  FROM CONVERSATIONS c
  JOIN CONVERSATION_PARTICIPANTS cp ON c.id = cp.conversation_id
  JOIN USERS u ON cp.user_id = u.id
  LEFT JOIN MESSAGES m ON c.id = m.conversation_id
  WHERE cp.user_id = ? AND cp.is_active = true
  GROUP BY c.id
  ORDER BY c.last_activity DESC
  ```

#### Chat Interface (`/messages/:conversationId`)
- **Primary Entity:** `MESSAGES`
- **Related Entities:** `CONVERSATIONS`, `MESSAGE_ATTACHMENTS`, `MESSAGE_REACTIONS`, `USER_TYPING`
- **Data Fields:** message history, typing indicators, reactions, attachments
- **API Endpoints:**
  - `GET /api/conversations/:id/messages` - Message history
  - `POST /api/conversations/:id/messages` - Send message
  - `POST /api/messages/:id/reactions` - Add reaction
  - `POST /api/conversations/:id/typing` - Typing indicator
- **Database Queries:**
  ```sql
  SELECT m.*, u.first_name, u.last_name, u.avatar_url,
         ma.file_name, ma.file_url,
         mr.reaction_type, COUNT(mr.id) as reaction_count
  FROM MESSAGES m
  JOIN USERS u ON m.sender_id = u.id
  LEFT JOIN MESSAGE_ATTACHMENTS ma ON m.id = ma.message_id
  LEFT JOIN MESSAGE_REACTIONS mr ON m.id = mr.message_id
  WHERE m.conversation_id = ?
  GROUP BY m.id
  ORDER BY m.sent_at ASC
  ```

### 🛡️ Moderation & Admin Screens

#### Moderation Dashboard (`/admin/moderation`)
- **Primary Entity:** `MODERATION_DECISIONS`
- **Related Entities:** `POSTINGS`, `USERS`, `AUDIT_LOGS`
- **Data Fields:** pending posts, moderation queue, decision history
- **API Endpoints:**
  - `GET /api/moderation/queue` - Posts pending review
  - `POST /api/moderation/decisions` - Make moderation decision
  - `GET /api/moderation/history` - Moderation history
- **Database Queries:**
  ```sql
  SELECT p.*, u.first_name, u.last_name, md.decision, md.decision_reason
  FROM POSTINGS p
  JOIN USERS u ON p.author_id = u.id
  LEFT JOIN MODERATION_DECISIONS md ON p.id = md.posting_id
  WHERE p.status = 'pending_review'
  ORDER BY p.created_at ASC
  ```

#### User Management (`/admin/users`)
- **Primary Entity:** `USERS`
- **Related Entities:** `USER_PROFILES`, `USER_ROLES`, `ALUMNI_PROFILES`
- **Data Fields:** user list, roles, status management
- **API Endpoints:**
  - `GET /api/admin/users` - User management list
  - `PUT /api/admin/users/:id/status` - Update user status
  - `POST /api/admin/users/:id/roles` - Assign roles
- **Database Queries:**
  ```sql
  SELECT u.*, up.first_name, up.last_name, r.name as role_name,
         ap.graduation_date, ap.major
  FROM USERS u
  LEFT JOIN USER_PROFILES up ON u.id = up.user_id
  LEFT JOIN USER_ROLES ur ON u.id = ur.user_id
  LEFT JOIN ROLES r ON ur.role_id = r.id
  LEFT JOIN ALUMNI_PROFILES ap ON up.id = ap.user_profile_id
  ORDER BY u.created_at DESC
  ```

### 📊 Analytics & Reporting Screens

#### Analytics Dashboard (`/admin/analytics`)
- **Primary Entity:** `ANALYTICS_EVENTS`
- **Related Entities:** `USERS`, `POSTINGS`, `CONVERSATIONS`
- **Data Fields:** usage metrics, engagement stats, system health
- **API Endpoints:**
  - `GET /api/analytics/overview` - Dashboard metrics
  - `GET /api/analytics/users` - User activity analytics
  - `GET /api/analytics/content` - Content engagement metrics
- **Database Queries:**
  ```sql
  SELECT
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT p.id) as total_postings,
    COUNT(DISTINCT c.id) as total_conversations,
    COUNT(ae.id) as total_events
  FROM USERS u
  LEFT JOIN POSTINGS p ON u.id = p.author_id
  LEFT JOIN CONVERSATIONS c ON u.id = c.creator_id
  LEFT JOIN ANALYTICS_EVENTS ae ON u.id = ae.user_id
  WHERE u.status = 'active'
  ```

#### Reports (`/admin/reports`)
- **Primary Entity:** `ANALYTICS_EVENTS`
- **Related Entities:** Multiple entities for comprehensive reporting
- **Data Fields:** custom reports, data exports, scheduled reports
- **API Endpoints:**
  - `POST /api/reports/generate` - Generate custom report
  - `GET /api/reports/templates` - Available report templates
  - `POST /api/reports/schedule` - Schedule recurring reports
- **Database Queries:** Complex queries based on report type and parameters

### 🔧 Settings & Configuration Screens

#### User Settings (`/settings`)
- **Primary Entity:** `USER_PREFERENCES`
- **Related Entities:** `USERS`, `NOTIFICATION_SETTINGS`
- **Data Fields:** notification preferences, privacy settings, account settings
- **API Endpoints:**
  - `GET /api/users/preferences` - User preferences
  - `PUT /api/users/preferences` - Update preferences
  - `PUT /api/users/notifications` - Notification settings
- **Database Queries:**
  ```sql
  SELECT up.*, u.email, u.status, ns.email_notifications, ns.push_notifications
  FROM USER_PREFERENCES up
  JOIN USERS u ON up.user_id = u.id
  LEFT JOIN NOTIFICATION_SETTINGS ns ON u.id = ns.user_id
  WHERE up.user_id = ?
  ```

#### Admin Settings (`/admin/settings`)
- **Primary Entity:** `SYSTEM_SETTINGS`
- **Related Entities:** `ROLES`, `PERMISSIONS`, `DOMAINS`
- **Data Fields:** system configuration, role management, domain settings
- **API Endpoints:**
  - `GET /api/admin/settings` - System settings
  - `PUT /api/admin/settings` - Update system settings
  - `GET /api/admin/roles` - Role management
- **Database Queries:**
  ```sql
  SELECT r.*, p.name as permission_name, p.resource, p.action
  FROM ROLES r
  LEFT JOIN ROLE_PERMISSIONS rp ON r.id = rp.role_id
  LEFT JOIN PERMISSIONS p ON rp.permission_id = p.id
  WHERE r.is_active = true
  ORDER BY r.name
  ```

## 🔗 COMPREHENSIVE DATA RELATIONSHIP MAPPING

### Core Entity Relationships
```
USERS (1) ──── (1) USER_PROFILES ──── (1) ALUMNI_PROFILES
   │                    │                      │
   ├── (many) USER_ROLES              ├── (many) EDUCATION_HISTORY
   ├── (many) USER_SESSIONS           ├── (many) CAREER_HISTORY
   ├── (many) PASSWORD_RESETS         ├── (many) ALUMNI_SKILLS
   ├── (many) USER_PREFERENCES        ├── (many) ALUMNI_DOMAINS
   ├── (many) POSTINGS (authored)     └── (many) ACHIEVEMENTS
   ├── (many) CONVERSATIONS (created)
   ├── (many) MESSAGES (sent)
   ├── (many) POSTING_INTERESTS
   ├── (many) MODERATION_DECISIONS
   ├── (many) ANALYTICS_EVENTS
   └── (many) NOTIFICATIONS
```

### Content & Communication Flow
```
POSTINGS ──── (many) POSTING_INTERESTS ──── (many) HELP_REQUESTS
    │              │                            │
    ├── (many) POSTING_ATTACHMENTS             ├── (many) HELP_RESPONSES
    ├── (many) POSTING_CATEGORIES              └── (many) HELPER_RATINGS
    ├── (many) POSTING_DOMAINS
    ├── (1) MODERATION_DECISIONS
    └── (many) POSTING_CONVERSATIONS ──── (1) CONVERSATIONS
                                              │
                                              ├── (many) CONVERSATION_PARTICIPANTS
                                              ├── (many) MESSAGES
                                              └── (many) USER_TYPING
```

### Skills & Domain Expertise
```
DOMAINS ──── (many) ALUMNI_DOMAINS ──── (many) ALUMNI_PROFILES
    │              │
    └── (many) POSTING_DOMAINS

SKILLS ──── (many) ALUMNI_SKILLS ──── (many) ALUMNI_PROFILES
```

## 📋 API ENDPOINT SUMMARY

### Authentication Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/reset-request` - Password reset request
- `POST /api/auth/reset-confirm` - Password reset confirmation

### User & Profile Endpoints
- `GET /api/users/profile` - Current user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/dashboard` - Dashboard data
- `GET /api/users/preferences` - User preferences
- `PUT /api/users/preferences` - Update preferences
- `GET /api/profiles/alumni/:id` - Alumni profile details
- `PUT /api/profiles/alumni/:id` - Update alumni profile
- `POST /api/profiles/:id/education` - Add education history
- `PUT /api/profiles/:id/education/:eduId` - Update education
- `DELETE /api/profiles/:id/education/:eduId` - Remove education

### Directory & Search Endpoints
- `GET /api/alumni/directory` - Alumni directory (paginated)
- `GET /api/alumni/search` - Search alumni with filters
- `POST /api/alumni/advanced-search` - Advanced search
- `GET /api/search/filters` - Available search filters
- `POST /api/search/save` - Save search criteria
- `GET /api/domains` - Available domains

### Postings & Content Endpoints
- `GET /api/postings` - Postings feed (paginated)
- `POST /api/postings` - Create new posting
- `GET /api/postings/:id` - Posting details
- `PUT /api/postings/:id` - Update posting
- `DELETE /api/postings/:id` - Delete posting
- `POST /api/postings/:id/interest` - Express interest
- `GET /api/postings/:id/interests` - Interest list
- `POST /api/postings/:id/help-request` - Create help request
- `GET /api/postings/categories` - Available categories
- `POST /api/postings/:id/attachments` - Upload attachments

### Messaging Endpoints
- `GET /api/conversations` - User's conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/:id/messages` - Message history
- `POST /api/conversations/:id/messages` - Send message
- `PUT /api/messages/:id/read` - Mark message as read
- `POST /api/messages/:id/reactions` - Add reaction
- `POST /api/conversations/:id/typing` - Typing indicator
- `GET /api/notifications` - User notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

### Moderation & Admin Endpoints
- `GET /api/moderation/queue` - Moderation queue
- `POST /api/moderation/decisions` - Make moderation decision
- `GET /api/moderation/history` - Moderation history
- `GET /api/admin/users` - User management
- `PUT /api/admin/users/:id/status` - Update user status
- `POST /api/admin/users/:id/roles` - Assign roles
- `GET /api/admin/settings` - System settings
- `PUT /api/admin/settings` - Update settings

### Analytics & Reporting Endpoints
- `GET /api/analytics/overview` - Dashboard metrics
- `GET /api/analytics/users` - User analytics
- `GET /api/analytics/content` - Content analytics
- `POST /api/analytics/events` - Track events
- `POST /api/reports/generate` - Generate reports
- `GET /api/reports/templates` - Report templates
- `POST /api/reports/schedule` - Schedule reports

## � NEXT STEPS

### Immediate Actions
1. **Validate Schema:** Ensure database schema matches this mapping
2. **Implement APIs:** Create endpoints following the defined patterns
3. **Create Data Flow Diagrams:** Visualize complex interactions
4. **Plan Query Optimization:** Design efficient data access patterns
5. **Validate Mapping:** Cross-reference with prototype and schema

## 🔗 RELATED DOCUMENTS

- **Implementation Strategy:** [task-7.2-schema-mapping-implementation.md](./task-7.2-schema-mapping-implementation.md)
- **Database Schema:** [Database Schema Diagrams](../../phase-2/database-schema.md)
- **API Documentation:** [API Specification](../../phase-3/api-specification.md)

---

*Task 7.2 provides the complete blueprint for replacing mock data with real database integration across all business features.*
