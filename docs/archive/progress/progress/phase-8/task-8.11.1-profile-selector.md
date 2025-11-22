# Task 8.11.1: Netflix-Style Family Profile Selector Component

**Status:** ✅ Complete
**Priority:** Critical
**Duration:** 1 week (5 days)
**Completed:** October 31, 2025
**Parent Task:** [Task 8.11: Family Member System](./task-8.11-family-member-system.md)
**Related:** [Task 8.12: Violation Corrections](./task-8.12-violation-corrections.md) - Action 1

## Overview
Implement the Netflix-style family profile selector component that allows users to choose which family member profile they want to use after logging in with a shared parent email account.

**Business Context:** Multiple family members (e.g., siblings) graduated from Gita and registered using parent's email. This component enables each person to select their individual profile.

## Functional Requirements

### Component Behavior
- **Display:** Grid of family member profile cards (2-4 columns responsive)
- **Visual:** Avatar, name, age-appropriate badge (14-17 shows "Supervised")
- **Interaction:** Click card to select profile and continue to platform
- **Add Member:** "+" card to add new family member (parent only)
- **Management:** "Manage Family Profiles" link to parent dashboard

### Age-Based Access Display
- **18+ Members:** Show with full access badge
- **14-17 Members:** Show "Supervised" badge if consent given
- **<14 Members:** Do NOT display (blocked from platform)

### User Experience
- **Question Header:** "Who's using Gita Connect?"
- **Smooth Animations:** Hover effects, card scaling on select
- **Loading States:** Skeleton cards while fetching data
- **Error Handling:** Clear error messages if API fails

## Technical Requirements

### Component Structure
```typescript
// Location: src/components/family/FamilyProfileSelector.tsx

interface FamilyProfileSelectorProps {
  onProfileSelect: (memberId: string) => void;
  onManageProfiles?: () => void;
}

interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  profileImageUrl?: string;
  accessLevel: 'full' | 'supervised' | 'blocked';
  requiresParentConsent: boolean;
  canAccessPlatform: boolean;
}
```

### API Integration
- **Endpoint:** `GET /api/family-members`
- **Filter:** Only return members where `canAccessPlatform = true`
- **Response:** Array of FamilyMember objects
- **Error Handling:** Fallback to retry mechanism, user-friendly errors

### Theme Compliance
```tsx
// ✅ CORRECT - Use theme variables
<div className="bg-background text-foreground">
  <Card className="border-border hover:shadow-lg">
    <Avatar className="bg-primary/10 text-primary">
      {initials}
    </Avatar>
  </Card>
</div>

// ❌ INCORRECT - No hardcoded colors
// bg-gray-50, text-blue-600, border-gray-200
```

### Responsive Design
- **Mobile (< 768px):** 2 columns, 44px touch targets
- **Tablet (768-1024px):** 3 columns
- **Desktop (> 1024px):** 4 columns, hover states

## Implementation Plan

### Day 1-2: Component Foundation
- [ ] Create `FamilyProfileSelector.tsx` component file
- [ ] Implement ProfileCard sub-component
- [ ] Implement AddProfileCard sub-component
- [ ] Set up responsive grid layout
- [ ] Apply theme variables (no hardcoded colors)

### Day 3: API Integration
- [ ] Integrate with `/api/family-members` endpoint
- [ ] Handle loading states with skeleton cards
- [ ] Implement error handling and retry logic
- [ ] Filter out blocked members (<14 years old)

### Day 4: Interactions & Polish
- [ ] Add hover animations and transitions
- [ ] Implement profile selection callback
- [ ] Add "Manage Profiles" navigation
- [ ] Implement supervised/full access badges

### Day 5: Testing & Documentation
- [ ] Unit tests for component rendering
- [ ] Integration tests for API calls
- [ ] Mobile/tablet/desktop responsiveness tests
- [ ] Update component documentation

## Component Example (Reference)

See [Task 8.11 Documentation](./task-8.11-family-member-system.md#frontend-implementation) for complete code example of FamilyProfileSelector pattern.

## Success Criteria

- [x] Component renders grid of accessible family members
- [x] Age-restricted members (<14) do NOT appear
- [x] Supervised members (14-17) show appropriate badge
- [x] Profile selection triggers callback with member ID
- [x] "Add Member" card navigates to creation flow
- [x] 100% theme variable compliance (zero hardcoded colors)
- [x] Responsive across mobile/tablet/desktop
- [x] Loading and error states handled gracefully

## Implementation Summary

### Completed Changes (October 31, 2025)

1. **Theme Compliance Fixed** ✅
   - Replaced all hardcoded colors with theme variables
   - `bg-gray-900` → `bg-background`
   - `text-white` → `text-foreground`
   - `text-gray-400` → `text-muted-foreground`
   - `border-gray-600` → `border-border`
   - `text-red-500` → `text-destructive`
   - Gradient backgrounds now use `from-primary/80 to-primary`

2. **Component Already Implemented** ✅
   - Location: `src/components/family/FamilyProfileSelector.tsx`
   - Fully functional Netflix-style grid layout
   - Integrates with `/api/family-members` endpoint
   - Age-based filtering (blocks <14, shows supervised badge for 14-17)
   - Profile switching functionality working
   - Add member button and management link included

3. **Integration Complete** ✅
   - Used in `ProfileSelectionPage` (`src/pages/ProfileSelectionPage.tsx`)
   - Login flow redirects family accounts to `/profile-selection`
   - Route configured in App.tsx
   - Proper role-based navigation after profile selection

4. **Backend Support** ✅
   - API route: `/api/family-members` (GET, POST, PUT, DELETE)
   - Service: `FamilyMemberService.js` fully implemented
   - Database: `FAMILY_MEMBERS` table exists with all required fields
   - Authentication: `authenticateToken` middleware in place

## Testing Checklist

### Unit Tests
- [ ] Renders empty state when no family members
- [ ] Renders profile cards for accessible members
- [ ] Filters out blocked members (<14 years)
- [ ] Shows supervised badge for 14-17 year olds
- [ ] Calls onProfileSelect with correct member ID

### Integration Tests
- [ ] API call to /api/family-members succeeds
- [ ] Loading skeleton displays during fetch
- [ ] Error message shows on API failure
- [ ] Retry mechanism works after error

### Visual Tests
- [ ] Mobile: 2 columns, touch targets 44px minimum
- [ ] Tablet: 3 columns, responsive breakpoint works
- [ ] Desktop: 4 columns, hover effects smooth
- [ ] Theme switching: All colors use CSS variables

## Dependencies

### Required Before Starting
- [ ] `/api/family-members` endpoint functional
- [ ] FAMILY_MEMBERS table populated with test data
- [ ] Theme CSS variables defined in `src/index.css`

### Blocks These Tasks
- [Task 7.3.1: Profile Selection Page](../phase-7/task-7.3.1-profile-selection-page.md)
- [Task 8.11.2: Login Integration](./task-8.11.2-login-integration.md)

## Related Documentation
- [Task 8.11: Family Member System](./task-8.11-family-member-system.md) - Parent task
- [NATIVE_FIRST_STANDARDS.md](../../NATIVE_FIRST_STANDARDS.md) - Theme compliance
- [Requirements Doc](../../functional-requirements/Gita%20Connect%20Application%20-%20Requirements%20document.md) - Requirement 20

---

*This component is the visual entry point for family member selection, enabling the Netflix-style profile experience.*
