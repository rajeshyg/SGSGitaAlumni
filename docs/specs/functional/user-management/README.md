---
version: "2.0"
status: implemented
last_updated: 2025-12-06
module: user-management
change_summary: Schema v2.0 - Consolidated user_profiles into FAMILY_MEMBERS
---

# User Management Module

Comprehensive user profile and account management features.

## Schema Architecture (v2.0)

> **Important**: As of December 2025, profile data is consolidated into `FAMILY_MEMBERS` table.
> The `user_profiles` table is now a VIEW for backward compatibility.

| Table | Purpose | Status |
|-------|---------|--------|
| `app_users` | Authentication only | Active |
| `FAMILY_MEMBERS` | All profile data (single source of truth) | Active |
| `user_profiles` | Backward compatibility VIEW | Deprecated |

See [Database Schema](./db-schema.md) for full details.

## Sub-Features

| Feature | Status | E2E Test | Implementation |
|---------|--------|----------|----------------|
| [Profile Management](./profile-management.md) | Implemented | `tests/e2e/dashboard.spec.ts` | `routes/family-members.js` |
| [Profile Photos](./profile-photos.md) | Implemented | `tests/e2e/dashboard.spec.ts` | `routes/family-members.js` |
| [Family Member Management](./family-member-management.md) | Implemented | `tests/e2e/auth.spec.ts` | `routes/family-members.js` |
| [Account Settings](./account-settings.md) | Implemented | `tests/e2e/dashboard.spec.ts` | `routes/users.js` |
| [Preferences](./preferences.md) | Implemented | `tests/e2e/dashboard.spec.ts` | `routes/preferences.js` |

## Technical Reference

See [Database Schema](./db-schema.md) for schema details.

## Key User Flows

1. **Profile Update**: Dashboard → Settings → Edit fields → Save → Validation → Success
2. **Photo Upload**: Profile → Upload photo → Crop/resize → Save → Display
3. **Add Family Member**: Settings → Family → Add member → Age verification → Consent flow
4. **Profile Switching**: Login → Select profile → JWT updated with family member context
