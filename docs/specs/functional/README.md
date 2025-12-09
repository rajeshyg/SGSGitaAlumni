---
version: "3.0"
status: active
last_updated: 2025-12-07
description: Functional specifications organized by user journey features
---

# Functional Specifications

This directory contains functional specifications organized by user journey. Each feature area has a README overview and detailed sub-feature documents.

## Structure

### Core User Journey Features

| Feature | Sub-Features | Status | Purpose |
|---------|--------------|--------|---------|
| [Invitation & Access Control](./invitation-access-control/) | 5 | Active | Admin invitation system, token validation |
| [Registration & Onboarding](./registration-onboarding/) | 8 | Active | Account creation, alumni selection, COPPA compliance |
| [Authentication & Identity](./authentication-identity/) | 6 | In Progress | Login, session management, profile switching |

### Legacy Modules (Deprecated)

These modules are being archived as part of the refactoring:

| Module | Status | Alternative |
|--------|--------|-------------|
| [authentication/](./authentication/) | Deprecated | [Authentication & Identity](./authentication-identity/) |
| [user-management/](./user-management/) | Deprecated | [Registration & Onboarding](./registration-onboarding/) |
| [admin/](./admin/) | Deprecated | [Platform Features](./platform-features/) |

## Quick Navigation

### User Onboarding (Phases 1-2)
- **[Invitation & Access Control](./invitation-access-control/README.md)**: 
  [Generation](./invitation-access-control/invitation-generation.md) • 
  [Acceptance](./invitation-access-control/invitation-acceptance.md) • 
  [Tracking](./invitation-access-control/invitation-tracking.md)
- **[Registration & Onboarding](./registration-onboarding/README.md)**: 
  [Registration](./registration-onboarding/registration.md) • 
  [Alumni Discovery](./registration-onboarding/alumni-discovery.md) • 
  [Profile Selection](./registration-onboarding/profile-selection.md) • 
  [Age Verification](./registration-onboarding/age-verification.md)

### User Authentication (Phase 3)
- **[Authentication & Identity](./authentication-identity/README.md)**:
  [Login](./authentication-identity/login.md) •
  [Session Management](./authentication-identity/session-management.md) •
  [Profile Switching](./authentication-identity/profile-switching.md)

### Platform Features (Phase 4)
- **[Platform Features](./platform-features/README.md)**: Directory • Postings • Messaging • Dashboard • Admin • Moderation

## Document Format

All sub-feature documents follow this structure:

```yaml
---
version: "1.0"
status: implemented | in-progress | pending
last_updated: YYYY-MM-DD
---

# Feature Name

## Purpose
Brief description of what the feature does

## User Flow
Step-by-step user journey

## Acceptance Criteria
- Checkboxes for requirements (✅ done, ⏳ in-progress, ☐ pending)

## Implementation
- Route, files, tests references

## Related
- Links to related features
```

## Integration with Status Dashboard

These specifications are tracked by the StatusDashboard component via `scripts/validation/feature-status.json`. Each sub-feature can have its status and E2E test tracked separately.

## Database Schemas

Each functional module contains a `db-schema.md` file documenting the database tables specific to that feature:

| Module | Schema File |
|--------|-------------|
| authentication | [db-schema.md](./authentication/db-schema.md) |
| user-management | [db-schema.md](./user-management/db-schema.md) |
| directory | [db-schema.md](./directory/db-schema.md) |
| postings | [db-schema.md](./postings/db-schema.md) |
| messaging | [db-schema.md](./messaging/db-schema.md) |
| dashboard | [db-schema.md](./dashboard/db-schema.md) |
| moderation | [db-schema.md](./moderation/db-schema.md) |
| notifications | [db-schema.md](./notifications/db-schema.md) |
| admin | [db-schema.md](./admin/db-schema.md) |
| rating | [db-schema.md](./rating/db-schema.md) |

**Template**: Use [`_TEMPLATE_db-schema.md`](./_TEMPLATE_db-schema.md) when adding new feature schemas.

## Technical Specifications

For implementation details, see:
- [Technical Specs: Architecture](../technical/architecture/)
- [Technical Specs: Security](../technical/security/)
- [Technical Specs: Database](../technical/database/)

## Validation

Run the structure validation script:
```bash
node scripts/validation/validate-structure.cjs
```

This validates:
- Each module folder has README.md
- YAML frontmatter is present
- Required module folders exist

## Contributing

When adding or updating functional specs:
1. Follow the standard document format
2. Include YAML frontmatter with version, status, last_updated
3. Link to E2E tests where available
4. Cross-reference related features
5. Update module README.md table
6. Focus on WHAT, not HOW (technical details go in technical specs)
