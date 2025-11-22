# Revised Prompt: Alumni Member Grading System Design

## 1. Project Technical & Functional Context

**SGS Gita Alumni Networking Platform** - A private, invitation-only alumni portal for Gita program graduates and their families.

### Technical Architecture
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Node.js + Express
- **Database:** MySQL with comprehensive schema
- **Authentication:** Multi-factor OTP (TOTP/SMS), invitation-based registration, family-shared accounts
- **Real-time:** WebSocket support for chat and notifications (in progress)
- **Security:** Rate limiting, input validation (Zod), COPPA compliance for 14+ age verification

### Current Implementation Status
- **Phase 7 (Business Features):** 75% complete
  - ✅ Member dashboard with feed integration
  - ✅ Posting system (jobs, accommodation, mentorship, opportunities)
  - ✅ Domain taxonomy (hierarchical: primary → secondary → area of interest)
  - ✅ User preferences with domain selection
  - ✅ Profile management (in progress)
  - 🟡 Chat system (foundation 30% complete)
  - 🟡 Moderator review workflow (in progress)

- **Phase 8 (Advanced Features):** 20% complete
  - ✅ Database foundation (clean alumni member vs app user separation)
  - ✅ Invitation system backend
  - ✅ Family member system (Netflix-style profile selector)
  - 🟡 Rating structure (Task 8.3 - planned)
  - 🟡 Contribution tracking (Task 8.4 - planned)

### Key Database Tables
- **`alumni_members`** - Source data for all graduates (1,280+ records, 99.9% complete)
- **`app_users`** - Authenticated platform users with role-based access
- **`FAMILY_MEMBERS`** - Individual profiles within family accounts (shared email login)
- **`POSTINGS`** - Opportunities/help requests with moderation workflow
- **`USER_PREFERENCES`** - Member interests, domain selections, notification settings
- **`DOMAINS`** - 3-level hierarchy (primary → secondary → area_of_interest)
- **`DOMAIN_MAPPINGS`** - Links postings to domain taxonomy
- **`USER_INVITATIONS`** - Token-based invitation management

### Existing Business Logic
- **Posting Workflow:** Create → Moderator Review (approve/reject/escalate) → Published → Expiry (30-60 days)
- **Domain Matching:** Auto-match postings to members based on preference overlap
- **Family System:** Multiple family members share one parent email, individual profiles, age-based access control
- **Notification System:** Email notifications for invitations, OTP codes, and posting status changes

---

## 2. Requirement: Alumni Member Grading/Points System

### Business Goal
Prioritize opportunities, resources, and platform benefits for alumni members who have demonstrated long-term service and commitment to:
- The program organization
- Fellow alumni members
- Current students
- Community events and activities

### Key Constraints
1. **No Access Restrictions** - Cannot prevent any alumni member from accessing portal or creating posts (all are legitimate graduates)
2. **Beyond Portal Activity** - Cannot rely solely on platform contributions; the portal is a tiny part of the entire program
3. **Multi-Scenario Application** - Post sorting is probably ~25% of the requirement; grading impacts notifications, matching, resource allocation, and more
4. **Dynamic/Configurable** - Cannot hardcode recognition categories; must accommodate new recognition types without code changes
5. **Flexible Weightage** - Admins must be able to adjust point values and formula weights without developer involvement
6. **Family-Shared Grading (Future Enhancement)** - Some contributions should benefit entire family (e.g., teaching service by one member benefits all family members sharing that account). *This can be deferred if it complicates initial design.*

### Recognition Examples (Not Exhaustive)
- **Volunteer service hours** - Members serving organization/students/alumni over years
- **Gita Family status** - Families with all members graduated (one-time recognition)
- **Teaching/Mentoring** - Alumni teaching next batches (not simple volunteer hours)
- **Talent show participation** - Participants, runners-up, winners (different point values)
- **Event organization** - Leading alumni events, conferences, reunions
- **Guest speaking** - Alumni returning as guest speakers for current students
- **Scholarship donations** - Contributing to program financially
- **Active forum participation** - Consistent engagement in alumni forums/discussions
- *(Many more categories will be added over time based on program evolution)*

### Family-Shared Grading Consideration
**Scenario:**
- "Ram Sharma" is a teacher for the Gita program for 5 years (high contribution score)
- Ram's family shares one portal login: Ram, wife Sita, son Krishna (all graduates)
- **Potential Requirement:** All Sharma family members benefit from Ram's teaching contribution when seeking opportunities

**Implementation Consideration:**
- Some recognitions are **individual** (e.g., talent show winner, volunteer hours)
- Some recognitions are **family-shared** (e.g., teaching, Gita Family status)
- Configuration should allow admins to mark categories as "shared with family" or "individual only"

**Decision:** If family-shared grading complicates the initial design significantly, defer to Phase 2 or future enhancement.

### Critical Scenario Examples

#### Scenario 1: Notification Priority
- Member "Datta" (high service record over 10 years, 650 points) is seeking job opportunity in Software Engineering
- Member "Ram" posts a suitable Software Engineer job at Google
- Member "Manav" (recent graduate or minimal involvement, 50 points) also has Software Engineering in preferences
- **Required Behavior:** System notifies "Datta" FIRST before "Manav" based on contribution score

#### Scenario 2: Sort Order of the seeking help postings by members
- Member "Datta" (high service record over 10 years, 650 points) creates post seeking job opportunity in Software Engineering
- **Required Behavior:** When the are several posts we should give priority to the members with higher points/grades while sorting the posts
---

## 3. Task Breakdown: Three-Stage Approach

### Stage 1: Feature Brainstorming & Options
**Objective:** Identify potential features/scenarios where member grading/points can be applied

**Deliverables:**
- List 5-10 practical features/scenarios where prioritization matters
- For each feature, provide multiple implementation variations/options as needed
- Classify features by implementation complexity (Easy/Medium/Hard)
- Classify features by business impact (High/Medium/Low)
- Recommend priority order for implementation (MVP vs post-MVP)

**Example (do NOT blindly copy) Output Format:**
```
Feature 1: Smart Notification Prioritization
- Variation A: Notify top 20% (Gold) first, then Silver after 24 hours, then Bronze/Member
- Variation B: Notify based on continuous priority score (no hard tier cutoffs)
- Variation C: Weighted randomization (higher points = higher probability)
Complexity: Medium | Impact: High | Priority: MVP
```

**User Action After Stage 1:** Review options, provide feedback, select preferred variations for each feature

---

### Stage 2: Short-Form Solution Design
**Objective:** Create concise, high-level solution design for finalized features

**Deliverables:**
- Database schema overview (5-7 key tables, no detailed field definitions yet)
- Architecture diagram (boxes and arrows showing data flow)
- Core algorithm concepts (1-2 sentences per algorithm, no code)
- Admin configuration touchpoints (list of admin UI screens needed)
- Member-facing UI changes (list of components/pages impacted)
- Integration points with existing systems (posting, notifications, preferences)
- Implementation phases (which features in MVP vs Phase 2)

**Length Target:** 2-3 pages maximum, focus on "what" not "how"

**User Action After Stage 2:** Review design, confirm approach, request adjustments if needed

---

### Stage 3: Comprehensive Solution Design
**Objective:** Create detailed, implementation-ready design document

**Deliverables:**
- Complete database schema with all fields, types, indexes, foreign keys
- Detailed API endpoint specifications (request/response formats)
- Step-by-step algorithm pseudocode for all scoring/prioritization logic
- Configuration data structures (JSON schemas for admin settings)
- UI/UX mockups or detailed component descriptions
- Migration strategy (how to initialize existing members)
- Testing strategy (unit tests, integration tests, edge cases)
- Performance considerations (caching, query optimization)
- Security considerations (preventing point manipulation)
- Admin documentation (how to use recognition management)
- Member documentation (how grading system works)

**Length Target:** 10-15 pages comprehensive design doc

**User Action After Stage 3:** Approve for implementation, create task documents (e.g., Task 8.3, Task 8.4)

---

## 4. Session Continuation Instructions

**When resuming in new session:**
1. Read this prompt file to understand full context
2. Confirm current stage with user (Stage 1, 2, or 3)
3. If Stage 1: Begin feature brainstorming with options/variations
4. If Stage 2: Create short-form design based on Stage 1 decisions
5. If Stage 3: Create comprehensive design based on Stage 2 approval

**Current Status:** Ready to begin Stage 1 - Feature Brainstorming

---

*This requirement document will guide development of Task 8.3 (Rating Structure) and Task 8.4 (Contribution Tracking) in Phase 8.*
