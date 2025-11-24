---
version: "1.0"
status: in-progress
last_updated: 2025-11-23
---

# Personalization

## Purpose
Customize dashboard layout and content based on user preferences.

## User Flow
1. User accesses dashboard settings
2. User customizes widgets, layout, content filters
3. User saves preferences
4. Dashboard reflects personalized settings

## Acceptance Criteria
- ⏳ Customizable widget arrangement
- ⏳ Content type preferences
- ⏳ Feed sorting preferences
- ⏳ Theme selection
- ✅ Preference persistence
- ⏳ Reset to default option

## Implementation
- **Route**: `PUT /api/preferences/dashboard`
- **File**: `routes/preferences.js`
- **Frontend**: `src/components/DashboardSettings.tsx`
- **Test**: Pending

## Related
- [Personal Feed](./personal-feed.md)
- [User Management: Preferences](../user-management/preferences.md)
