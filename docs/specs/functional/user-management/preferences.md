---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Preferences

## Purpose
Allow users to customize their platform experience.

## User Flow
1. User opens preferences page
2. User adjusts preferences:
   - Theme (light/dark mode)
   - Language
   - Email frequency
   - Content filters
   - Feed sorting
3. User saves preferences
4. System applies immediately

## Acceptance Criteria
- ✅ Theme selection (light/dark/auto)
- ✅ Email notification frequency
- ✅ Feed sort order preference
- ✅ Content type filters
- ✅ Privacy preferences
- ✅ Preferences sync across devices

## Implementation
- **Route**: `GET /api/preferences`, `PUT /api/preferences`
- **File**: `routes/preferences.js`
- **Frontend**: `src/pages/Preferences.tsx`
- **Context**: `src/contexts/ThemeContext.tsx`
- **Test**: `tests/e2e/dashboard.spec.ts`

## Related
- [Account Settings](./account-settings.md)
- [Technical Spec: Theme System](../../technical/ui-standards/theme-system.md)
