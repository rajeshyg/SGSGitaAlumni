---
version: "1.0"
status: implemented
last_updated: 2025-11-23
module: user-management
---

# User Management Module

Comprehensive user profile and account management features.

## Sub-Features

| Feature | Status | E2E Test | Implementation |
|---------|--------|----------|----------------|
| [Profile Management](./profile-management.md) | Implemented | `tests/e2e/dashboard.spec.ts` | `routes/users.js` |
| [Profile Photos](./profile-photos.md) | Implemented | `tests/e2e/dashboard.spec.ts` | `routes/users.js` |
| [Family Member Management](./family-member-management.md) | Implemented | `tests/e2e/auth.spec.ts` | `routes/family-members.js` |
| [Account Settings](./account-settings.md) | Implemented | `tests/e2e/dashboard.spec.ts` | `routes/users.js` |
| [Preferences](./preferences.md) | Implemented | `tests/e2e/dashboard.spec.ts` | `routes/preferences.js` |

## Technical Reference

See [Technical Specs: Database/User Management](../../technical/database/user-management.md) for schema details.

## Key User Flows

1. **Profile Update**: Dashboard → Settings → Edit fields → Save → Validation → Success
2. **Photo Upload**: Profile → Upload photo → Crop/resize → Save → Display
3. **Add Family Member**: Settings → Family → Add member → Invitation sent
