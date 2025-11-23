# User Management - Implementation Plan

**Date**: 2025-11-23  
**Feature**: User Management  
**Model**: Sonnet (Implementation Planning)  
**Based On**: scout.md findings

## Overview

Complete the user management feature by implementing profile editing, preference management with validation, and laying groundwork for profile pictures and extended fields.

## Implementation Phases

### Phase 1: Complete Profile Editing (Task 7.6)
**Priority**: High  
**Estimated Effort**: 8 hours  
**Dependencies**: None

#### Changes Required

1. **Frontend: Profile Edit Form**
   - File: `src/pages/Profile.tsx`
   - Add editable form fields for:
     - Name (required)
     - Email (read-only for family accounts)
     - Phone number (optional)
     - Education details
     - Professional information
     - Skills and expertise
   - Implement client-side validation
   - Add save/cancel buttons
   - Loading and error states

2. **Backend: Profile Update Endpoint**
   - File: `routes/users.js`
   - Enhance `PUT /api/users/:id` endpoint
   - Add input validation (express-validator)
   - Sanitize inputs to prevent XSS
   - Verify authorization (user can only edit own profile)
   - Update database with proper error handling

3. **Database Updates**
   - Verify schema supports all profile fields
   - Add indexes if needed for performance
   - Migration script if schema changes required

#### Testing Strategy
- Unit tests for validation logic
- Integration tests for API endpoint
- E2E test for complete edit flow
- Test authorization (cannot edit other profiles)

#### Acceptance Criteria
- [x] User can edit all profile fields
- [x] Validation prevents invalid data
- [x] Changes persist to database
- [x] Success/error messages displayed
- [x] Cannot edit other users' profiles

### Phase 2: Enforce 5-Domain Limit
**Priority**: High  
**Estimated Effort**: 4 hours  
**Dependencies**: None

#### Changes Required

1. **Backend Validation**
   - File: `routes/preferences.js`
   - Add validation in `POST /api/preferences`
   - Return 400 error if > 5 domains selected
   - Add meaningful error message

2. **Frontend Validation**
   - File: `src/pages/Preferences.tsx` or preference component
   - Disable domain selection after 5 selected
   - Visual indicator showing X/5 domains selected
   - Show error message if attempting to exceed limit

3. **Database Constraint (Optional)**
   - Consider adding trigger or constraint
   - Prevent data corruption at DB level

#### Testing Strategy
- Unit test for validation function
- API test attempting to save 6+ domains
- E2E test for UI behavior at limit
- Test error messages displayed correctly

#### Acceptance Criteria
- [x] Backend rejects > 5 domains
- [x] Frontend prevents selecting > 5
- [x] Clear error messages shown
- [x] Counter shows X/5 domains selected

### Phase 3: Profile Picture Infrastructure
**Priority**: Medium  
**Estimated Effort**: 12 hours  
**Dependencies**: Storage solution decision

#### Design Decisions Needed
1. **Storage Solution**
   - Option A: Local file system (simple, not scalable)
   - Option B: S3-compatible storage (scalable, more setup)
   - Option C: Base64 in database (simple, not recommended for large images)
   - **Recommendation**: Option A for MVP, plan migration to Option B

2. **Image Processing**
   - Library: Sharp or Jimp
   - Resize to standard sizes (thumbnail, medium, large)
   - Format conversion (always save as JPEG/WebP)
   - Quality optimization

#### Changes Required

1. **Backend: Upload Endpoint**
   - File: `routes/users.js` or new `routes/uploads.js`
   - Create `POST /api/users/:id/profile-picture`
   - Use multer for file upload handling
   - Validate file type (jpg, png only)
   - Validate file size (max 5MB)
   - Process image (resize, optimize)
   - Save file to storage
   - Update user record with image URL
   - Return uploaded image URL

2. **Database Schema**
   - Add `profile_picture_url VARCHAR(500)` to `users` or `alumni_profiles` table
   - Migration script to add column

3. **Frontend: Upload UI**
   - File: `src/pages/Profile.tsx`
   - Add profile picture display
   - Add "Change Picture" button
   - File input (hidden, triggered by button)
   - Image preview before upload
   - Upload progress indicator
   - Cropping tool (optional, nice-to-have)

4. **Image Processing Service**
   - File: `server/services/imageProcessingService.js`
   - Function to resize images (200x200, 400x400)
   - Function to optimize quality
   - Function to validate image format

#### Testing Strategy
- Test file upload with valid images
- Test file size validation
- Test file type validation
- Test image processing (resize, optimize)
- E2E test for complete upload flow
- Test error handling (invalid files, network issues)

#### Acceptance Criteria
- [x] Users can upload profile picture
- [x] Only jpg/png accepted, max 5MB
- [x] Image automatically resized/optimized
- [x] Picture displays in profile
- [x] Old picture replaced when new uploaded
- [x] Error messages for invalid uploads

### Phase 4: Extended Profile Fields
**Priority**: Medium  
**Estimated Effort**: 6 hours  
**Dependencies**: Phase 1 complete

#### Changes Required

1. **Database Schema**
   - Add columns to `alumni_profiles` table:
     - `bio TEXT` - 500 character limit (enforced in app)
     - `linkedin_url VARCHAR(255)`
     - `twitter_url VARCHAR(255)`
     - `website_url VARCHAR(255)`
     - `achievements TEXT` - JSON or delimited string
   - Migration script to add columns with default NULL

2. **Backend Updates**
   - File: `routes/users.js`
   - Update profile GET/PUT endpoints to include new fields
   - Add URL validation for social links
   - Add character limit validation for bio (500 chars)
   - Sanitize text inputs

3. **Frontend Updates**
   - File: `src/pages/Profile.tsx`
   - Add bio textarea (with character counter)
   - Add social link input fields
   - Add achievements section
   - Validation for URLs
   - Character counter for bio

#### Testing Strategy
- Test bio character limit (exactly 500)
- Test URL validation for social links
- Test optional vs required fields
- E2E test for saving extended profile

#### Acceptance Criteria
- [x] Bio field with 500 char limit
- [x] Character counter visible
- [x] Social links validated as URLs
- [x] All fields optional
- [x] Data persists correctly

## Database Migration Plan

### Migration Script: `add-profile-extensions.sql`
```sql
-- Add profile picture URL
ALTER TABLE users 
ADD COLUMN profile_picture_url VARCHAR(500) NULL;

-- Add extended profile fields
ALTER TABLE alumni_profiles
ADD COLUMN bio TEXT NULL,
ADD COLUMN linkedin_url VARCHAR(255) NULL,
ADD COLUMN twitter_url VARCHAR(255) NULL,
ADD COLUMN website_url VARCHAR(255) NULL,
ADD COLUMN achievements TEXT NULL;

-- Add indexes for performance
CREATE INDEX idx_users_profile_picture ON users(profile_picture_url);
```

### Rollback Script: `rollback-profile-extensions.sql`
```sql
ALTER TABLE users DROP COLUMN profile_picture_url;
ALTER TABLE alumni_profiles 
DROP COLUMN bio,
DROP COLUMN linkedin_url,
DROP COLUMN twitter_url,
DROP COLUMN website_url,
DROP COLUMN achievements;
```

## Dependencies

### External Libraries
- **multer**: File upload handling (existing?)
- **sharp** or **jimp**: Image processing
- **express-validator**: Input validation (existing?)

### Configuration
- File storage directory path
- Maximum file upload size
- Allowed file types

### Environment Variables
```
UPLOAD_DIR=./uploads/profile-pictures
MAX_FILE_SIZE=5242880
ALLOWED_EXTENSIONS=jpg,jpeg,png
```

## Testing Strategy

### Unit Tests
- Profile validation functions
- Image processing functions
- Domain limit validation
- URL validation for social links

### Integration Tests
- Profile update API endpoint
- Preference save API endpoint
- File upload endpoint
- Authorization checks

### E2E Tests
- Complete profile edit flow
- Domain selection with limit
- Profile picture upload
- Extended fields save

## Rollout Plan

### Phase 1 Rollout
1. Deploy backend changes for profile editing
2. Deploy frontend profile edit UI
3. Monitor error logs for issues
4. Collect user feedback

### Phase 2 Rollout
1. Deploy domain limit validation
2. Update documentation
3. Notify users of 5-domain limit
4. Monitor compliance

### Phase 3 Rollout
1. Set up file storage directory
2. Deploy image upload backend
3. Deploy upload UI
4. Test with pilot users
5. Full rollout after validation

### Phase 4 Rollout
1. Run database migration
2. Deploy backend with new fields
3. Deploy frontend with extended UI
4. Optional: Backfill data for existing users

## Risks and Mitigations

### Risk 1: File Storage Space
**Impact**: High  
**Mitigation**: 
- Monitor disk usage
- Set up cleanup for unused images
- Plan migration to S3 for scalability

### Risk 2: Image Processing Performance
**Impact**: Medium  
**Mitigation**:
- Process images asynchronously if needed
- Use efficient image library (sharp)
- Set reasonable size limits

### Risk 3: Backward Compatibility
**Impact**: Low  
**Mitigation**:
- All new fields are optional/nullable
- Existing functionality unaffected
- Graceful degradation if fields missing

## Success Metrics

- Profile edit completion rate > 80%
- < 1% users attempt to exceed domain limit
- Profile picture upload success rate > 95%
- Average profile completeness > 70%
- Page load time remains < 500ms

## Next Steps

1. Get approval on implementation plan
2. Create detailed task breakdown
3. Set up development environment with image processing
4. Begin Phase 1 implementation
5. Write tests first (TDD approach)
6. Implement features incrementally
7. Conduct code review after each phase
8. Update documentation
