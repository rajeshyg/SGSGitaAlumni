# Implementation Plan: Functional Specs Restructure

## Overview

Restructure `docs/specs/functional/` to support **module-based documentation** with trackable sub-features that integrate with `scripts/validation/feature-status.json` and the Admin Status Dashboard.

**Current Problem**: 
- Flat structure with single files per feature
- `feature-status.json` shows API routes instead of functional sub-modules
- No granular tracking of sub-features (e.g., Postings → Matching, Detail View, Chat Integration)

**Solution**: 
- Folder per feature with README.md + sub-feature docs
- Update `feature-status.json` schema to include sub-features
- E2E tests serve as user story/workflow documentation

---

## Current State Analysis

Based on `feature-status.json`:

| Feature | Status | Spec Exists | Test Coverage | Components |
|---------|--------|-------------|---------------|------------|
| Authentication | ✅ Implemented | ✅ Yes | ✅ E2E | 3 routes |
| User Management | 🟡 In Progress | ✅ Yes | ❌ None | 3 routes |
| Directory | ✅ Implemented | ✅ Yes | ❌ None | 2 routes |
| Postings | 🟡 In Progress | ✅ Yes | ✅ E2E | 3 components |
| Messaging | ✅ Implemented | ✅ Yes | ✅ E2E | 3 components |
| Dashboard | ✅ Implemented | ✅ Yes | ✅ E2E | 2 routes |
| Moderation | ✅ Implemented | ✅ Yes | ❌ None | 2 components |
| Admin | ✅ Implemented | ❌ No | ❌ None | 1 page + components |
| Notifications | ⏳ Pending | ✅ Yes | ❌ None | 0 components |
| Rating | ⏳ Pending | ✅ Yes | ❌ None | 0 components |

---

## Proposed Functional Specs Structure

```
docs/specs/functional/
├── README.md                          # Navigation and overview
│
├── authentication/                    # Feature folder
│   ├── README.md                      # Feature overview & sub-features index
│   ├── login.md                       # Sub-feature: Login flow with JWT
│   ├── registration.md                # Sub-feature: Invitation-based registration with OTP
│   ├── family-accounts.md             # Sub-feature: Shared email, profile selection
│   ├── password-management.md         # Sub-feature: Change/reset password
│   ├── age-verification.md            # Sub-feature: COPPA compliance, age checks
│   └── parental-consent.md            # Sub-feature: Parent consent workflow for minors
│
├── user-management/
│   ├── README.md
│   ├── profile-management.md          # Sub-feature: Edit profile, bio, attributes
│   ├── profile-photos.md              # Sub-feature: Profile picture upload
│   ├── preferences.md                 # Sub-feature: Domain, sub-domain, areas of interest
│   ├── account-settings.md            # Sub-feature: Privacy, notifications
│   └── family-member-management.md    # Sub-feature: Add/manage family members
│
├── directory/
│   ├── README.md
│   ├── search.md                      # Sub-feature: Alumni search
│   ├── filters.md                     # Sub-feature: Advanced filters
│   └── profile-view.md                # Sub-feature: Public profile viewing
│
├── postings/
│   ├── README.md
│   ├── create-posting.md              # Sub-feature: Create/edit postings
│   ├── browse-postings.md             # Sub-feature: List, search, filter
│   ├── posting-detail.md              # Sub-feature: Detail view, engagement
│   ├── matching-algorithm.md          # Sub-feature: Domain-based matching
│   ├── expiry-logic.md                # Sub-feature: Time-based expiry
│   └── chat-integration.md            # Sub-feature: "Chat about this" button
│
├── messaging/
│   ├── README.md
│   ├── conversations.md               # Sub-feature: Create/manage conversations
│   ├── messaging.md                   # Sub-feature: Send/receive messages
│   ├── real-time-sync.md              # Sub-feature: WebSocket synchronization
│   └── reactions-receipts.md          # Sub-feature: Reactions, read receipts
│
├── dashboard/
│   ├── README.md
│   ├── personalized-feed.md           # Sub-feature: Content feed
│   ├── quick-actions.md               # Sub-feature: Shortcuts
│   ├── profile-completion.md          # Sub-feature: Completion widget
│   └── role-based-views.md            # Sub-feature: Member/Moderator/Admin
│
├── moderation/
│   ├── README.md
│   ├── review-queue.md                # Sub-feature: Pending items queue
│   ├── auto-moderation.md             # Sub-feature: Keyword filtering
│   ├── manual-review.md               # Sub-feature: Approve/reject workflow
│   └── audit-logs.md                  # Sub-feature: Moderation history
│
├── notifications/                     # Pending implementation
│   ├── README.md
│   ├── email-notifications.md         # Sub-feature: Welcome, password reset, approvals
│   ├── in-app-notifications.md        # Sub-feature: Real-time in-app alerts
│   └── push-notifications.md          # Sub-feature: Mobile push (future)
│
├── rating/                            # Pending implementation
│   ├── README.md
│   ├── rating-system.md               # Sub-feature: Gold/Silver/Bronze rating
│   └── contribution-tracking.md       # Sub-feature: Automated point system
│
└── admin/                             # Admin module
    ├── README.md
    ├── user-management.md             # Sub-feature: App user & alumni management
    ├── invitation-management.md       # Sub-feature: Generate & track invitations
    ├── analytics.md                   # Sub-feature: Analytics dashboard & reports
    ├── domain-management.md           # Sub-feature: Domain taxonomy configuration
    ├── moderation-oversight.md        # Sub-feature: Admin moderation tools
    └── system-monitoring.md           # Sub-feature: Status dashboard, health checks

```

---

## Updated feature-status.json Schema

```json
{
  "features": [
    {
      "id": "POSTINGS",
      "name": "Postings",
      "status": "in-progress",
      "spec": "docs/specs/functional/postings/README.md",
      "test": "tests/e2e/postings.spec.ts",
      "diagram": "docs/archive/design/postings.mmd",
      "components": [
        "routes/postings.js",
        "routes/moderation.js",
        "server/services/postingService.js"
      ],
      "subFeatures": [
        {
          "id": "POSTINGS_CREATE",
          "name": "Create Posting",
          "status": "implemented",
          "spec": "docs/specs/functional/postings/create-posting.md"
        },
        {
          "id": "POSTINGS_BROWSE",
          "name": "Browse Postings",
          "status": "implemented",
          "spec": "docs/specs/functional/postings/browse-postings.md"
        },
        {
          "id": "POSTINGS_DETAIL",
          "name": "Posting Detail View",
          "status": "implemented",
          "spec": "docs/specs/functional/postings/posting-detail.md"
        },
        {
          "id": "POSTINGS_MATCHING",
          "name": "Matching Algorithm",
          "status": "in-progress",
          "spec": "docs/specs/functional/postings/matching-algorithm.md"
        },
        {
          "id": "POSTINGS_EXPIRY",
          "name": "Expiry Logic",
          "status": "in-progress",
          "spec": "docs/specs/functional/postings/expiry-logic.md"
        },
        {
          "id": "POSTINGS_CHAT",
          "name": "Chat Integration",
          "status": "in-progress",
          "spec": "docs/specs/functional/postings/chat-integration.md"
        }
      ]
    }
  ]
}
```

---

## Sub-Feature Document Template

```markdown
# [Sub-Feature Name]

## Status
🟢 Implemented | 🟡 In Progress | ⏳ Pending

## Overview
[2-3 sentences describing what this sub-feature does]

## User Goal
**As a** [user role]  
**I want** [capability]  
**So that** [benefit]

## Behavior

### Input
- [What user provides or triggers]

### Processing
- [What system does]

### Output
- [What user sees or receives]

## Success Criteria
- [ ] [Specific testable outcome]
- [ ] [Another outcome]

## API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/resource` | Retrieve data |
| POST | `/api/resource` | Create resource |

## Database Tables
- **primary_table**: [columns used]
- **related_table**: [relationship]

## Business Rules
- **BR-1**: [Constraint or validation rule]
- **BR-2**: [Another rule]

## Edge Cases
- **Case 1**: [What happens when...]
- **Case 2**: [What happens if...]

## Integration Points
- **Depends On**: [Other features/sub-features required]
- **Used By**: [Features that consume this]

## Testing
- **E2E Test**: `tests/e2e/[feature].spec.ts` (lines X-Y)
- **Manual Test**: [Steps to verify manually]

## Code References
- **Routes**: `routes/[file].js` (lines X-Y)
- **Services**: `server/services/[file].js` (lines X-Y)
- **Frontend**: `src/components/[component].tsx`

## Known Issues
- [Issue 1 description]

## Future Enhancements
- [Enhancement 1]
```

---

## Feature README.md Template

```markdown
# [Feature Name]

## Status
🟢 Implemented: 5 sub-features  
🟡 In Progress: 2 sub-features  
⏳ Pending: 0 sub-features

## Overview
[Brief description of the feature module]

## Sub-Features

| # | Sub-Feature | Status | Spec | Priority |
|---|-------------|--------|------|----------|
| 1 | [Name] | 🟢 | [link to .md] | Critical |
| 2 | [Name] | 🟡 | [link to .md] | High |
| 3 | [Name] | ⏳ | [link to .md] | Medium |

## User Workflows
**Primary workflows that span multiple sub-features**

### Workflow 1: [Name]
1. [Step 1] → See: [sub-feature-1.md]
2. [Step 2] → See: [sub-feature-2.md]
3. [Step 3] → See: [sub-feature-3.md]

## Code Organization
- **Backend**: `routes/[feature].js`, `server/services/[feature]Service.js`
- **Frontend**: `src/pages/[Feature].tsx`, `src/components/[feature]/`
- **Tests**: `tests/e2e/[feature].spec.ts`

## E2E Test Coverage
[Link to Playwright test file - serves as living documentation of user stories]

**Test Scenarios**:
- ✅ [Scenario 1]
- ✅ [Scenario 2]
- ⏳ [Scenario 3 - pending]

## Dependencies
- **Requires**: [Other features this depends on]
- **Used By**: [Features that depend on this]

## Metrics
- [Key business metric 1]
- [Key business metric 2]
```

---

## Phase-by-Phase Implementation

### Phase 1: Schema & Script Updates (1 day)
**Goal**: Enable sub-feature tracking in feature-status.json

**Tasks**:
1. Update `feature-status.json` schema to include `subFeatures[]` array
2. Create script to generate sub-features from existing code analysis
3. Update Status Dashboard to display sub-features (collapsible rows)
4. Test dashboard rendering with sample sub-features

**Deliverable**: Working sub-feature tracking in admin dashboard

---

### Phase 2: High-Priority Modules (5-7 days)
**Goal**: Document implemented features with sub-features

#### Authentication (1 day)
**Sub-Features**: Login, Registration, Family Accounts, Password Management, Age Verification, Parental Consent  
**Code**: `routes/auth.js`, `routes/otp.js`, `routes/invitations.js`, `tests/e2e/auth.spec.ts`

#### Messaging (1.5 days)
**Sub-Features**: Conversations, Messaging, Real-time Sync, Reactions & Receipts  
**Code**: `routes/chat.js`, `socket/chatSocket.js`, `server/services/chatService.js`

#### Postings (2 days)
**Sub-Features**: Create Posting, Browse, Detail View, Matching, Expiry, Chat Integration  
**Code**: `routes/postings.js` (1362 lines), `server/services/postingService.js`

#### Dashboard (1 day)
**Sub-Features**: Personalized Feed, Quick Actions, Profile Completion, Role-Based Views  
**Code**: `routes/dashboard.js`, `routes/feed.js`

#### Moderation (1 day)
**Sub-Features**: Review Queue, Auto-Moderation, Manual Review, Audit Logs  
**Code**: `routes/moderation.js`, `server/services/moderationService.js`

#### Directory (0.5 day)
**Sub-Features**: Search, Advanced Filters, Profile View  
**Code**: `routes/directory.js`, `routes/alumni.js`

---

### Phase 3: In-Progress Modules (2 days)

#### User Management (1 day)
**Sub-Features**: Profile Management (implemented), Profile Photos (pending), Preferences (implemented), Account Settings (in-progress), Family Member Management (implemented)  
**Code**: `routes/users.js`, `routes/preferences.js`, `routes/family-members.js`

---

### Phase 4: Pending Modules (0.5 day)

#### Notifications
**Sub-Features**: Email Notifications, In-App Notifications, Push Notifications (future)  
**Content**: High-level descriptions, no implementation details

#### Rating
**Sub-Features**: Rating System (Gold/Silver/Bronze), Contribution Tracking  
**Content**: Placeholder descriptions

#### Admin
**Sub-Features**: User Management, Invitation Management, Analytics Dashboard, Domain Management, Moderation Oversight, System Monitoring  
**Content**: Document existing admin panel functionality
**Code**: `src/pages/AdminPage.tsx`, `src/components/admin/`, `routes/invitations.js`, `routes/domains.js`, `routes/analytics.js`

---

### Phase 5: Integration & Validation (1 day)

**Tasks**:
1. Update root `README.md` to link to feature READMEs
2. Update `always-on.md` with new structure
3. Create navigation helper script
4. Validate all spec links in feature-status.json
5. Test Status Dashboard with full sub-feature data
6. Update documentation guide

---

## Validation Script Updates

### Update scripts/validation/generate-feature-status.js

Add sub-feature detection logic:
- If spec is a folder, scan for sub-feature .md files (excluding README.md)
- Parse status from each file
- Generate subFeatures array

### Update Status Dashboard Component

Add sub-feature expansion UI:
- Collapsible rows showing sub-features
- Status badges for each sub-feature
- Progress indicator (X of Y complete)

---

## Success Criteria

### Quantitative
- [ ] 10 feature folders created with READMEs (9 existing + Admin)
- [ ] 40+ sub-feature documents created
- [ ] `feature-status.json` includes all sub-features
- [ ] Status Dashboard displays sub-features
- [ ] All spec links valid and accessible

### Qualitative
- [ ] E2E tests serve as primary workflow documentation
- [ ] Sub-features are granular enough for task tracking
- [ ] Each sub-feature document is self-contained
- [ ] Navigation is intuitive (folder structure matches mental model)
- [ ] Status Dashboard provides clear progress visibility

---

## Key Principles

1. **E2E Tests = User Stories**: Playwright tests already document expected behavior and workflows. Functional specs complement, not duplicate.

2. **Sub-Features = Trackable Units**: Each sub-feature should be implementable/verifiable independently.

3. **Code References Over Descriptions**: Link to actual implementation with line numbers rather than verbose explanations.

4. **Status Dashboard Integration**: Everything documented must appear in admin dashboard for tracking.

5. **Avoid Technical Details**: Focus on WHAT (behavior, requirements), not HOW (implementation patterns).

6. **Lightweight Documentation**: Concise, scannable, actionable. Avoid lengthy prose.

---

## Effort Estimate

| Phase | Duration | Output |
|-------|----------|--------|
| Phase 1: Schema & Scripts | 1 day | Updated tracking system |
| Phase 2: High-Priority (6 features) | 7 days | 25+ sub-feature docs |
| Phase 3: In-Progress (2 features) | 2 days | 8+ sub-feature docs |
| Phase 4: Pending + Admin (3 modules) | 1 day | 15+ sub-feature docs |
| Phase 5: Integration | 1 day | Complete navigation |

**Total**: 12 days

---

## Next Steps

1. **Approve Plan**: Review and confirm structure
2. **Phase 1 Start**: Update feature-status.json schema
3. **Pilot Module**: Complete one feature (e.g., Authentication) end-to-end
4. **Review & Iterate**: Validate template effectiveness
5. **Scale**: Apply to remaining modules
6. **Automate**: Enhance validation scripts

---

## Appendix: Example Sub-Feature Breakdown

### Postings Module

```
postings/
├── README.md                    # Overview, 6 sub-features listed
├── create-posting.md            # POST /api/postings, form validation
├── browse-postings.md           # GET /api/postings, filters, pagination
├── posting-detail.md            # GET /api/postings/:id, engagement actions
├── matching-algorithm.md        # Domain-based scoring, personalization
├── expiry-logic.md              # Time calculation, auto-archival
└── chat-integration.md          # Context passing to messaging module
```

**feature-status.json entry**:
```json
{
  "id": "POSTINGS",
  "subFeatures": [
    { "id": "POSTINGS_CREATE", "name": "Create Posting", "status": "implemented" },
    { "id": "POSTINGS_BROWSE", "name": "Browse Postings", "status": "implemented" },
    { "id": "POSTINGS_DETAIL", "name": "Detail View", "status": "implemented" },
    { "id": "POSTINGS_MATCHING", "name": "Matching Algorithm", "status": "in-progress" },
    { "id": "POSTINGS_EXPIRY", "name": "Expiry Logic", "status": "in-progress" },
    { "id": "POSTINGS_CHAT", "name": "Chat Integration", "status": "pending" }
  ]
}
```

**Status Dashboard view**:
```
▼ Postings                     🟡 In Progress
  └─ Sub-Features (6):
     ✅ Create Posting          🟢 Implemented
     ✅ Browse Postings         🟢 Implemented
     ✅ Detail View             🟢 Implemented
     🟡 Matching Algorithm      🟡 In Progress
     🟡 Expiry Logic            🟡 In Progress
     ⏳ Chat Integration        ⏳ Pending
```

---

**End of Plan**
