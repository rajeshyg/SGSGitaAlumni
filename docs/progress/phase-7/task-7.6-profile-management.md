# Task 7.6: Profile Management

**Status:** 🟠 In Progress

## Summary
Implement profile viewing and editing. Fix non-responsive profile click on the dashboard and wire the "Complete profile" CTA to the profile editor. Replace all mock data with real API integration.

**Note:** For family member profiles and shared email support, see [Phase 8 Task 8.11: Family Member System](../phase-8/task-8.11-family-member-system.md).

## Problem Statement
- Clicking on profile from `http://localhost:5173/dashboard` is not responding
- Dashboard shows "Profile Completion 20%" with a "Complete profile" CTA that does not navigate

## Scope
- Add working navigation from profile avatar/menu and dashboard CTA to profile view/edit route
- Build profile edit form with validation, adhering to domain taxonomy and preferences
- Integrate with real APIs (no mock data) for get/update profile
- Show profile completion meter sourced from backend
- Mobile/tablet/desktop responsive

**Out of Scope (See Task 8.11):**
- Family member profile switching
- Shared email account management
- Individual preferences per family member

## Dependencies
- Phase 7A foundation and Task 7.3 auth services available
- Domain taxonomy and preferences (Task 7.7) complete
- For family features: Task 8.11 (Family Member System)

## Deliverables
- Profile view page and edit page/routes
- API service calls for profile read/update
- Validation aligned with standards and preferences schema
- Accessible UI (WCAG 2.1 AA)

## TDD Plan
1. Routing tests: navigating from dashboard CTA/avatar opens profile editor
2. Service tests: profileService.getProfile, updateProfile handle success/errors
3. Form tests: required fields, validation, error messages
4. Integration tests: updating profile reflects in dashboard completion
5. Accessibility tests for interactive elements

## Acceptance Criteria
- Dashboard CTA and profile avatar/menu navigate to profile editor
- Profile loads from real API; updates persist and reflect on reload
- Completion percentage updates after save
- No mock data present
- Passes lint, tests, and cross-platform checks

## QA Commands
```bash
npm run lint
npm run test:run
npm run test:mobile
npm run test:tablet
npm run test:desktop
```

## Notes
- Follow SOLID and clean architecture
- Implement logging via `src/utils/logger` in all functions (debug-only)
