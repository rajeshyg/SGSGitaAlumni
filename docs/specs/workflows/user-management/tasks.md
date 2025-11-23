# User Management - Task Breakdown

**Feature**: User Management  
**Based On**: plan.md  
**Last Updated**: 2025-11-23

---

## Task 1: Complete Profile Editing Form (Frontend)
**Status**: Not Started  
**Depends On**: None  
**Estimated Complexity**: Medium  
**Phase**: 1

### Objective
Create a fully functional profile editing form in the frontend with validation and proper UX.

### Context
- File to modify: `src/pages/Profile.tsx`
- Current state: Profile viewing works, editing partially implemented
- Reference: Authentication flows for form patterns

### Implementation Details
1. Add edit mode toggle (View/Edit)
2. Create form with fields:
   - Name (required, min 2 chars)
   - Email (display only for family accounts)
   - Phone (optional, format validation)
   - Education details
   - Professional info
   - Skills/expertise
3. Implement client-side validation
4. Add Save/Cancel buttons
5. Loading spinner during save
6. Success/error toast notifications
7. Disable form during submission

### Acceptance Criteria
- [ ] Edit button toggles to edit mode
- [ ] All fields editable (except email for family accounts)
- [ ] Validation errors display inline
- [ ] Cancel restores original values
- [ ] Save triggers API call
- [ ] Success message on save
- [ ] Error message on failure
- [ ] Form disabled during save

### Testing Requirements
- [ ] Unit test: Validation logic
- [ ] Unit test: Form state management
- [ ] Integration test: Form submission
- [ ] E2E test: Complete edit flow

---

## Task 2: Implement Profile Update API Endpoint
**Status**: Not Started  
**Depends On**: None  
**Estimated Complexity**: Medium  
**Phase**: 1

### Objective
Create secure, validated API endpoint for updating user profiles.

### Context
- File to modify: `routes/users.js`
- Existing endpoint: `PUT /api/users/:id` (may need enhancement)
- Reference: `routes/auth.js` for input validation patterns

### Implementation Details
1. Add express-validator middleware for:
   - Name (required, string, 2-100 chars)
   - Phone (optional, valid format)
   - Email (valid format, unique if changed)
   - Education/profession (string, max 500 chars each)
2. Implement authorization check:
   - Verify JWT token
   - Ensure user can only edit own profile
   - Admin can edit any profile (optional)
3. Sanitize all text inputs (XSS prevention)
4. Update database with proper error handling
5. Return updated profile or error response
6. Log profile update events

### Acceptance Criteria
- [ ] Endpoint validates all inputs
- [ ] Authorization prevents editing others' profiles
- [ ] XSS sanitization applied
- [ ] Database updated correctly
- [ ] Proper error responses (400, 401, 403, 500)
- [ ] Success returns updated profile
- [ ] Profile update logged

### Testing Requirements
- [ ] Unit test: Validation rules
- [ ] Unit test: Authorization check
- [ ] Integration test: Valid update succeeds
- [ ] Integration test: Invalid data rejected
- [ ] Integration test: Unauthorized access blocked
- [ ] Integration test: Database state correct after update

---

## Task 3: Add Profile Edit E2E Tests
**Status**: Not Started  
**Depends On**: Task 1, Task 2  
**Estimated Complexity**: Low  
**Phase**: 1

### Objective
Create comprehensive E2E tests for profile editing feature.

### Context
- File to create: `tests/e2e/profile-edit.spec.ts`
- Reference: `tests/e2e/auth.spec.ts` for test patterns
- Use Playwright test framework

### Implementation Details
1. Test: Successful profile edit
   - Login as test user
   - Navigate to profile page
   - Click edit button
   - Modify fields
   - Save changes
   - Verify success message
   - Verify changes persisted
2. Test: Cancel editing
   - Start editing
   - Modify fields
   - Click cancel
   - Verify original values restored
3. Test: Validation errors
   - Enter invalid data
   - Attempt save
   - Verify error messages
4. Test: Authorization
   - Attempt to edit another user's profile
   - Verify access denied

### Acceptance Criteria
- [ ] All test scenarios pass
- [ ] Tests run in CI/CD pipeline
- [ ] Clear test descriptions
- [ ] Proper test data setup/teardown

### Testing Requirements
- [ ] Run tests locally
- [ ] Verify in CI environment
- [ ] Check test coverage report

---

## Task 4: Backend Domain Limit Validation
**Status**: Not Started  
**Depends On**: None  
**Estimated Complexity**: Low  
**Phase**: 2

### Objective
Enforce 5-domain limit in backend preference endpoint.

### Context
- File to modify: `routes/preferences.js`
- Endpoint: `POST /api/preferences`
- Current state: No backend validation for limit

### Implementation Details
1. Add validation middleware:
   - Check domains array length
   - Return 400 if > 5 domains
   - Error message: "Maximum 5 domains allowed"
2. Add to existing validation chain
3. Test with 6+ domains
4. Update API documentation

### Acceptance Criteria
- [ ] Request with > 5 domains rejected with 400
- [ ] Error message clear and specific
- [ ] Request with ≤ 5 domains succeeds
- [ ] Validation integrated with existing checks

### Testing Requirements
- [ ] Unit test: Validation function
- [ ] Integration test: 6 domains rejected
- [ ] Integration test: 5 domains accepted
- [ ] Integration test: Error message correct

---

## Task 5: Frontend Domain Limit UI
**Status**: Not Started  
**Depends On**: None  
**Estimated Complexity**: Low  
**Phase**: 2

### Objective
Prevent users from selecting more than 5 domains in the UI.

### Context
- File to modify: `src/pages/Preferences.tsx` or preference component
- Current state: No limit enforcement in UI

### Implementation Details
1. Add counter display: "X/5 domains selected"
2. Disable unselected domains when 5 reached
3. Show tooltip/message: "Maximum 5 domains"
4. Enable domains when one is deselected
5. Style disabled state clearly
6. Add visual indicator when at limit

### Acceptance Criteria
- [ ] Counter shows current/max domains
- [ ] Cannot select more than 5 domains
- [ ] Clear visual feedback at limit
- [ ] Deselecting enables more selections
- [ ] Accessible for screen readers

### Testing Requirements
- [ ] E2E test: Select 5 domains, verify 6th disabled
- [ ] E2E test: Deselect one, verify can select again
- [ ] E2E test: Counter updates correctly
- [ ] Accessibility test: Screen reader announces limit

---

## Task 6: Design File Upload Solution
**Status**: Not Started  
**Depends On**: None  
**Estimated Complexity**: Low (Decision-making)  
**Phase**: 3

### Objective
Decide on file storage solution and document architecture.

### Context
- Options: Local filesystem, S3-compatible, Database
- Considerations: Scalability, cost, complexity
- Reference: plan.md for comparison

### Implementation Details
1. Evaluate options:
   - Local: Simple, not scalable, OK for MVP
   - S3: Scalable, additional setup, future-proof
   - Database: Not recommended for images
2. Create decision document
3. Set up storage infrastructure
4. Configure environment variables
5. Plan migration path if starting with local

### Acceptance Criteria
- [ ] Storage solution decided and documented
- [ ] Infrastructure set up (directories/buckets)
- [ ] Environment variables configured
- [ ] Migration plan documented

### Testing Requirements
- [ ] Test write access to storage
- [ ] Test read access from storage
- [ ] Verify permissions correct

---

## Task 7: Implement Image Upload Backend
**Status**: Not Started  
**Depends On**: Task 6  
**Estimated Complexity**: High  
**Phase**: 3

### Objective
Create API endpoint for profile picture upload with validation and processing.

### Context
- File to create/modify: `routes/users.js` or `routes/uploads.js`
- New service: `server/services/imageProcessingService.js`
- Dependencies: multer, sharp

### Implementation Details
1. Install dependencies:
   ```bash
   npm install multer sharp
   ```
2. Create multer configuration:
   - File size limit: 5MB
   - Allowed types: jpg, jpeg, png
   - Temporary storage
3. Create image processing service:
   - Resize to 200x200 (thumbnail)
   - Resize to 400x400 (display)
   - Convert to JPEG
   - Optimize quality (80%)
4. Create endpoint `POST /api/users/:id/profile-picture`:
   - Validate authorization
   - Handle file upload with multer
   - Validate file type/size
   - Process image (resize, optimize)
   - Save to storage
   - Update user record with URL
   - Delete old picture if exists
   - Return new picture URL
5. Add error handling for all steps

### Acceptance Criteria
- [ ] Endpoint accepts multipart/form-data
- [ ] File type validation (jpg, png only)
- [ ] File size validation (max 5MB)
- [ ] Image resized to 200x200 and 400x400
- [ ] Images optimized for web
- [ ] User record updated with picture URL
- [ ] Old picture deleted from storage
- [ ] Error handling for invalid uploads
- [ ] Authorization verified

### Testing Requirements
- [ ] Unit test: Image processing functions
- [ ] Integration test: Valid upload succeeds
- [ ] Integration test: Invalid type rejected
- [ ] Integration test: Oversized file rejected
- [ ] Integration test: Unauthorized upload blocked
- [ ] Integration test: Old image deleted

---

## Task 8: Implement Profile Picture Upload UI
**Status**: Not Started  
**Depends On**: Task 7  
**Estimated Complexity**: Medium  
**Phase**: 3

### Objective
Create user-friendly profile picture upload interface.

### Context
- File to modify: `src/pages/Profile.tsx`
- Pattern: Hidden file input triggered by button
- Show image preview before upload

### Implementation Details
1. Add profile picture display:
   - Show current picture or default avatar
   - Circular or rounded square
   - Proper sizing and aspect ratio
2. Add "Change Picture" button
3. Hidden file input (accept jpg, png)
4. Handle file selection:
   - Validate size (5MB) client-side
   - Show preview of selected image
   - Confirm or cancel upload
5. Upload to API:
   - Show progress indicator
   - Disable UI during upload
   - Update display on success
   - Show error on failure
6. Optional: Add crop tool (react-image-crop)

### Acceptance Criteria
- [ ] Current picture displays correctly
- [ ] Default avatar shown if no picture
- [ ] File selection opens dialog
- [ ] Preview shows selected image
- [ ] Upload progress indicated
- [ ] Success updates picture display
- [ ] Error shows meaningful message
- [ ] UI accessible (keyboard, screen reader)

### Testing Requirements
- [ ] E2E test: Upload valid image
- [ ] E2E test: Upload oversized image (client validation)
- [ ] E2E test: Upload invalid type (client validation)
- [ ] E2E test: Cancel upload
- [ ] Accessibility test: Keyboard navigation
- [ ] Accessibility test: Screen reader announces state

---

## Task 9: Database Migration for Extended Fields
**Status**: Not Started  
**Depends On**: None  
**Estimated Complexity**: Low  
**Phase**: 4

### Objective
Add database columns for extended profile fields.

### Context
- Tables: `alumni_profiles` or `users`
- Migration script needed
- Rollback script needed

### Implementation Details
1. Create migration script `migrations/add-extended-profile-fields.sql`:
   ```sql
   ALTER TABLE alumni_profiles
   ADD COLUMN bio TEXT NULL,
   ADD COLUMN linkedin_url VARCHAR(255) NULL,
   ADD COLUMN twitter_url VARCHAR(255) NULL,
   ADD COLUMN website_url VARCHAR(255) NULL,
   ADD COLUMN achievements TEXT NULL;
   ```
2. Create rollback script
3. Test migration on dev database
4. Document in migration history
5. Run migration on staging
6. Verify columns added correctly

### Acceptance Criteria
- [ ] Migration script created
- [ ] Rollback script created
- [ ] Tested on dev database
- [ ] No data loss
- [ ] Indexes added if needed
- [ ] Documented in migration log

### Testing Requirements
- [ ] Test migration execution
- [ ] Test rollback execution
- [ ] Verify column types correct
- [ ] Verify nullable constraints

---

## Task 10: Implement Extended Profile Fields (Backend)
**Status**: Not Started  
**Depends On**: Task 9  
**Estimated Complexity**: Medium  
**Phase**: 4

### Objective
Add backend support for extended profile fields with validation.

### Context
- File to modify: `routes/users.js`
- Endpoints: GET and PUT `/api/users/:id`

### Implementation Details
1. Update GET endpoint:
   - Include new fields in response
   - Return NULL if not set
2. Update PUT endpoint validation:
   - Bio: max 500 characters
   - LinkedIn URL: valid URL format
   - Twitter URL: valid URL format
   - Website URL: valid URL format
   - Achievements: JSON string or delimited
3. Add URL validation helper
4. Sanitize text inputs
5. Update database queries
6. Handle NULL values gracefully

### Acceptance Criteria
- [ ] GET returns all extended fields
- [ ] PUT validates bio length (500 max)
- [ ] PUT validates URL formats
- [ ] Invalid URLs rejected with 400
- [ ] Fields persist to database
- [ ] NULL values handled correctly
- [ ] XSS sanitization applied

### Testing Requirements
- [ ] Unit test: URL validation
- [ ] Unit test: Bio length validation
- [ ] Integration test: Save valid extended fields
- [ ] Integration test: Reject invalid URLs
- [ ] Integration test: Reject long bio

---

## Task 11: Implement Extended Profile Fields (Frontend)
**Status**: Not Started  
**Depends On**: Task 10  
**Estimated Complexity**: Medium  
**Phase**: 4

### Objective
Add UI for extended profile fields in profile editor.

### Context
- File to modify: `src/pages/Profile.tsx`
- Add to profile edit form

### Implementation Details
1. Add bio textarea:
   - Max 500 characters
   - Character counter (X/500)
   - Multi-line input
   - Placeholder text
2. Add social link inputs:
   - LinkedIn URL
   - Twitter URL
   - Website URL
   - URL validation on blur
   - Optional fields
3. Add achievements section:
   - Multiple text inputs or tags
   - Add/remove functionality
4. Style consistently with existing form
5. Show validation errors inline
6. All fields optional

### Acceptance Criteria
- [ ] Bio textarea with character counter
- [ ] Counter updates in real-time
- [ ] Bio limited to 500 characters
- [ ] Social link inputs present
- [ ] URL validation on blur
- [ ] Achievements can be added/removed
- [ ] Fields save correctly
- [ ] Accessible form labels

### Testing Requirements
- [ ] E2E test: Save bio with 500 chars
- [ ] E2E test: Reject 501 character bio
- [ ] E2E test: Save valid URLs
- [ ] E2E test: Show error for invalid URL
- [ ] E2E test: Add multiple achievements
- [ ] Accessibility test: Form labels and errors

---

## Implementation Order

### Sprint 1 (Priority: High)
1. Task 2: Profile Update API Endpoint
2. Task 1: Profile Editing Form
3. Task 3: Profile Edit E2E Tests

### Sprint 2 (Priority: High)
4. Task 4: Backend Domain Limit Validation
5. Task 5: Frontend Domain Limit UI

### Sprint 3 (Priority: Medium)
6. Task 6: Design File Upload Solution
7. Task 7: Image Upload Backend
8. Task 8: Profile Picture Upload UI

### Sprint 4 (Priority: Medium)
9. Task 9: Database Migration for Extended Fields
10. Task 10: Extended Fields Backend
11. Task 11: Extended Fields Frontend

## Progress Tracking

Update status for each task:
- **Not Started**: Task not begun
- **In Progress**: Currently being worked on
- **Blocked**: Waiting on dependency or decision
- **Review**: Code complete, awaiting review
- **Complete**: Merged and deployed
- **Verified**: Tested in production

## Notes
- Each task should be completed with tests
- Code review required before merging
- Update functional spec after each phase completes
- Document any deviations from plan
