---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Profile Photos

## Purpose
Enable users to upload and manage profile pictures.

## User Flow
1. User clicks profile photo area
2. User selects image file
3. System validates file (type, size)
4. User crops/adjusts image (optional)
5. System uploads to storage
6. Profile photo updated

## Acceptance Criteria
- ✅ Support JPG, PNG formats
- ✅ Maximum file size 5MB
- ✅ Image optimization/compression
- ✅ Crop/resize functionality
- ✅ Default avatar for users without photo
- ✅ Secure storage with access controls

## Implementation
- **Route**: `POST /api/users/profile-photo`, `DELETE /api/users/profile-photo`
- **File**: `routes/users.js`
- **Frontend**: `src/components/ProfilePhotoUpload.tsx`
- **Storage**: `/public/images/profile-photos/`
- **Test**: `tests/e2e/dashboard.spec.ts`

## Related
- [Profile Management](./profile-management.md)
