---
version: "2.0"
status: active
last_updated: 2025-11-23
description: Functional specifications describing user-facing features and workflows
---

# Functional Specifications

This directory contains functional specifications organized by feature module. Each module has a README overview and detailed sub-feature documents.

## Structure

| Module | Sub-Features | Status | E2E Tests |
|--------|--------------|--------|-----------|
| [authentication/](./authentication/) | 6 | Implemented | `tests/e2e/auth.spec.ts` |
| [user-management/](./user-management/) | 5 | Implemented | `tests/e2e/dashboard.spec.ts` |
| [directory/](./directory/) | 3 | Implemented | `tests/e2e/dashboard.spec.ts` |
| [postings/](./postings/) | 6 | Implemented | `tests/e2e/posting.spec.ts` |
| [messaging/](./messaging/) | 4 | Implemented | `tests/e2e/chat.spec.ts` |
| [dashboard/](./dashboard/) | 4 | Implemented | `tests/e2e/dashboard.spec.ts` |
| [moderation/](./moderation/) | 4 | Implemented | Pending |
| [admin/](./admin/) | 6 | Implemented | Pending |
| [notifications/](./notifications/) | 3 | Pending | Pending |
| [rating/](./rating/) | 2 | Pending | Pending |

## Quick Navigation

### Core Features
- **Authentication**: [Login](./authentication/login.md) • [Registration](./authentication/registration.md) • [OTP](./authentication/otp-verification.md)
- **User Management**: [Profile](./user-management/profile-management.md) • [Family Members](./user-management/family-member-management.md) • [Settings](./user-management/account-settings.md)
- **Directory**: [Search](./directory/alumni-search.md) • [Filtering](./directory/filtering-sorting.md) • [Domains](./directory/domain-taxonomy.md)

### Content & Communication
- **Postings**: [Create](./postings/create-posting.md) • [View](./postings/view-postings.md) • [Tags](./postings/tagging-system.md)
- **Messaging**: [Direct Messages](./messaging/direct-messaging.md) • [Group Chats](./messaging/group-chats.md)
- **Dashboard**: [Personal Feed](./dashboard/personal-feed.md) • [Activity](./dashboard/activity-tracking.md)

### Administration
- **Admin**: [Users](./admin/user-management.md) • [Invitations](./admin/invitation-management.md) • [Analytics](./admin/analytics.md)
- **Moderation**: [Content Review](./moderation/content-review.md) • [Queue](./moderation/moderation-queue.md)

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
