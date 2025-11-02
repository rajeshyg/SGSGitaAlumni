# Phase 1 - Action 1: Family Profile Selector - Manual Testing Guide

**Task:** Task 8.11.1 - Netflix-Style Family Profile Selector Component  
**Status:** ✅ Complete - Ready for Testing  
**Date:** October 31, 2025

## Overview
This guide will help you manually test the Family Profile Selector component that was just completed. The component provides a Netflix-style interface for selecting which family member profile to use after logging in with a shared family account.

---

## Prerequisites

### 1. Database Setup
Ensure the FAMILY_MEMBERS table exists and has test data:

```powershell
# Connect to MySQL and check the table
mysql -u root -p gita_connect

# Check if table exists
SHOW TABLES LIKE 'FAMILY_MEMBERS';

# View structure
DESCRIBE FAMILY_MEMBERS;

# Check if you have test data
SELECT id, first_name, last_name, current_age, access_level, can_access_platform 
FROM FAMILY_MEMBERS 
LIMIT 5;
```

### 2. Create Test Family Account (if needed)

```sql
-- Create a test parent user with family account flag
INSERT INTO APP_USERS (
  email, password_hash, first_name, last_name, 
  role, is_family_account, status
) VALUES (
  'test.family@example.com',
  '$2b$10$ABC...', -- Use bcrypt hash of 'Test123!'
  'Test',
  'Parent',
  'member',
  1,
  'active'
);

-- Get the user_id
SET @parent_user_id = LAST_INSERT_ID();

-- Create family members for this parent
INSERT INTO FAMILY_MEMBERS (
  parent_user_id, first_name, last_name, 
  birth_date, relationship, access_level, 
  can_access_platform, status
) VALUES
-- 18+ member (full access)
(@parent_user_id, 'John', 'Smith', '2000-05-15', 'child', 'full', 1, 'active'),

-- 16 year old with consent (supervised access)
(@parent_user_id, 'Sarah', 'Smith', '2008-03-20', 'child', 'supervised', 1, 'active'),

-- 16 year old without consent (pending)
(@parent_user_id, 'Mike', 'Smith', '2008-08-10', 'child', 'supervised', 0, 'pending_consent'),

-- 12 year old (blocked - should NOT appear)
(@parent_user_id, 'Emma', 'Smith', '2012-11-05', 'child', 'blocked', 0, 'active');
```

---

## Test Scenarios

### Test 1: Login with Family Account

**Steps:**
1. Start the application:
   ```powershell
   npm run dev
   ```

2. Navigate to http://localhost:5173/login

3. Login with family account credentials:
   - Email: `test.family@example.com`
   - Password: `Test123!` (or whatever password you set)

**Expected Results:**
- ✅ Login succeeds
- ✅ Automatically redirects to `/profile-selection` page
- ✅ Should NOT go directly to dashboard

---

### Test 2: Profile Selector Display

**Steps:**
1. After logging in (from Test 1), observe the profile selection screen

**Expected Results:**
- ✅ Header displays: "Who's using the Alumni Network?"
- ✅ Profiles displayed in grid layout:
  - **Mobile**: 2 columns
  - **Tablet**: 3 columns  
  - **Desktop**: 4 columns
- ✅ Each profile card shows:
  - Avatar (initials if no image)
  - Member name
  - Access level indicator (colored dot)
  - Status badges if applicable
- ✅ "Add Member" card with plus icon
- ✅ "Manage Profiles" link at bottom

---

### Test 3: Age-Based Filtering

**Steps:**
1. On the profile selection screen, count the visible profiles

**Expected Results:**
- ✅ John (18+) - VISIBLE with "Full Access"
- ✅ Sarah (16, consented) - VISIBLE with "Supervised" badge
- ✅ Mike (16, no consent) - VISIBLE with "Needs Consent" badge
- ❌ Emma (12) - NOT VISIBLE (blocked, under 14)

**Verification:**
- Check console/network tab for API response
- Should filter out members where `can_access_platform = false` AND `access_level = 'blocked'`

---

### Test 4: Profile Selection - Full Access

**Steps:**
1. Click on John's profile (18+ years old)

**Expected Results:**
- ✅ Profile switches successfully
- ✅ Redirects to `/dashboard` (or `/admin` if admin role)
- ✅ Dashboard shows John's name/info
- ✅ No errors in console

---

### Test 5: Profile Selection - Supervised Access

**Steps:**
1. Return to `/profile-selection` (logout and login again)
2. Click on Sarah's profile (16, with consent)

**Expected Results:**
- ✅ Profile switches successfully
- ✅ Redirects to dashboard
- ✅ Dashboard shows Sarah's name
- ✅ "Supervised" indicator visible (if implemented in dashboard)

---

### Test 6: Profile Selection - Pending Consent

**Steps:**
1. Return to `/profile-selection`
2. Click on Mike's profile (16, no consent)

**Expected Results:**
- ✅ Alert/message: "This profile requires parent consent before accessing the platform"
- ✅ Does NOT switch profile
- ✅ Stays on profile selection page

---

### Test 7: Theme Compliance

**Steps:**
1. On profile selection screen, toggle between light/dark theme
   - Open browser DevTools (F12)
   - Toggle theme if available, OR manually change CSS variables

**Expected Results:**
- ✅ Background changes from light to dark (uses `bg-background`)
- ✅ Text color adapts (uses `text-foreground`)
- ✅ Borders adapt (uses `border-border`)
- ✅ NO hardcoded colors visible (gray-900, white, etc.)
- ✅ Gradient avatars use primary theme colors

**Verify in DevTools:**
```css
/* Should see theme variables, NOT hardcoded colors */
background-color: hsl(var(--background));
color: hsl(var(--foreground));
border-color: hsl(var(--border));
```

---

### Test 8: Responsive Design

**Steps:**
1. Resize browser window to different sizes
2. Or use DevTools responsive mode (Ctrl+Shift+M)

**Test Breakpoints:**
- Mobile: 375px width
- Tablet: 768px width  
- Desktop: 1280px width

**Expected Results:**
- ✅ **Mobile (< 768px)**: 2 columns, touch targets ≥ 44px
- ✅ **Tablet (768-1024px)**: 3 columns
- ✅ **Desktop (> 1024px)**: 4 columns
- ✅ All elements remain accessible and readable
- ✅ No horizontal scroll
- ✅ Hover effects work on desktop (not mobile)

---

### Test 9: Add Member Flow

**Steps:**
1. Click the "Add Member" card (with plus icon)

**Expected Results:**
- ✅ Navigates to `/settings/family/add`
- ✅ Shows form to add new family member
- (Note: Form implementation is separate task)

---

### Test 10: Manage Profiles

**Steps:**
1. Click "Manage Profiles" link at bottom

**Expected Results:**
- ✅ Navigates to `/settings/family`
- ✅ Shows family management dashboard
- (Note: Management page is separate task)

---

### Test 11: API Error Handling

**Steps:**
1. Stop the backend server (Ctrl+C in server terminal)
2. Refresh `/profile-selection` page

**Expected Results:**
- ✅ Shows error message: "Failed to load family members"
- ✅ Does NOT crash
- ✅ Error displayed in red/destructive color
- ✅ Console logs error details

**Recovery:**
1. Restart server
2. Refresh page
3. ✅ Should load profiles correctly

---

### Test 12: Loading States

**Steps:**
1. Add artificial delay to API (optional):
   ```javascript
   // In routes/family-members.js, add delay
   await new Promise(resolve => setTimeout(resolve, 2000));
   ```
2. Refresh `/profile-selection` page

**Expected Results:**
- ✅ Shows loading state: "Loading profiles..."
- ✅ Loading screen uses theme background
- ✅ After delay, profiles appear
- ✅ No flash of error

---

## Checklist Summary

Use this checklist to track your testing progress:

- [ ] Test 1: Login with family account redirects to profile selection
- [ ] Test 2: Profile selector displays correctly with all elements
- [ ] Test 3: Under-14 profiles are hidden (blocked)
- [ ] Test 4: Full access profile (18+) selection works
- [ ] Test 5: Supervised profile (14-17 with consent) selection works
- [ ] Test 6: Pending consent profiles show alert and don't switch
- [ ] Test 7: Theme variables used (no hardcoded colors)
- [ ] Test 8: Responsive design works at all breakpoints
- [ ] Test 9: Add Member button navigates correctly
- [ ] Test 10: Manage Profiles link navigates correctly
- [ ] Test 11: API errors display gracefully
- [ ] Test 12: Loading states appear during data fetch

---

## Known Limitations

1. **Profile Images**: Component supports profile images, but test data may not have images (will show initials)
2. **Theme Toggle**: If theme toggle UI not yet implemented, test manually via DevTools
3. **Consent Flow**: Parent consent granting/revoking is separate task
4. **Add Member Form**: Form implementation is in separate task

---

## Troubleshooting

### Issue: Profiles not appearing
**Solution:** 
- Check `FAMILY_MEMBERS` table has data for parent_user_id
- Verify `can_access_platform = 1` for profiles you want to see
- Check browser console for API errors

### Issue: Not redirecting to profile selection
**Solution:**
- Verify user has `is_family_account = 1` in APP_USERS table
- Check browser console for redirect logs
- Clear localStorage and try again

### Issue: Colors not adapting to theme
**Solution:**
- Hard refresh (Ctrl+Shift+R)
- Check that theme provider is wrapping the app
- Verify CSS variables are defined in index.css

### Issue: "Add Member" or "Manage Profiles" routes don't exist
**Solution:**
- These routes may not be implemented yet (separate tasks)
- Expected behavior: Navigate to route (may show 404 if not implemented)

---

## Success Criteria

✅ **Action 1 (Task 8.11.1) is complete when:**
- All 12 tests pass
- Theme compliance verified (no hardcoded colors)
- Age-based filtering works correctly
- Profile selection flow works for all access levels
- Responsive design works at all breakpoints

---

## Next Steps

After completing Action 1 testing:
1. Mark this testing as complete in PROGRESS.md
2. Proceed to **Action 2**: ProfileSelectionPage (already integrated!)
3. Then **Action 3**: Theme System Compliance (separate component fixes)

---

**Questions?** Review the task documentation at:
`docs/progress/phase-8/task-8.11.1-profile-selector.md`
