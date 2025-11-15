# Preferences API Schema Fix

**Date:** November 3, 2025  
**Issue:** PUT /api/preferences/:userId returning 400 Bad Request  
**Root Cause:** Schema mismatch between validation and actual API implementation  
**Status:** ✅ FIXED

## Problem Description

Action 4 (API Input Validation) added `PreferencesUpdateSchema` validation to the PUT endpoint, but the schema didn't match the actual fields expected by `updateUserPreferences()` function.

### Incorrect Schema (Before Fix)
```typescript
export const PreferencesUpdateSchema = z.object({
  selectedDomains: z.array(UUIDSchema).min(1).max(5, 'Maximum 5 domains allowed'),
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  privacyLevel: z.enum(['PUBLIC', 'ALUMNI_ONLY', 'PRIVATE'])
});
```

### Actual API Expectations
```javascript
// routes/preferences.js - updateUserPreferences()
preferences.primary_domain_id
preferences.secondary_domain_ids      // Array of UUIDs
preferences.areas_of_interest_ids     // Array of UUIDs
preferences.preference_type           // 'seeking', 'offering', 'both'
preferences.max_postings              // number
preferences.notification_settings     // JSON object
preferences.privacy_settings          // JSON object
preferences.interface_settings        // JSON object
preferences.is_professional           // boolean
preferences.education_status          // 'student', 'professional', 'both'
```

## Solution

Updated `PreferencesUpdateSchema` in both TypeScript and JavaScript validation files to match the actual API implementation:

### Correct Schema (After Fix)
```typescript
export const PreferencesUpdateSchema = z.object({
  primary_domain_id: UUIDSchema.optional(),
  secondary_domain_ids: z.array(UUIDSchema).max(3, 'Maximum 3 secondary domains allowed').optional(),
  areas_of_interest_ids: z.array(UUIDSchema).max(20, 'Maximum 20 areas of interest allowed').optional(),
  preference_type: z.enum(['seeking', 'offering', 'both']).optional(),
  max_postings: z.number().int().min(1).max(10).optional(),
  notification_settings: z.record(z.any()).optional(),
  privacy_settings: z.record(z.any()).optional(),
  interface_settings: z.record(z.any()).optional(),
  is_professional: z.boolean().optional(),
  education_status: z.enum(['student', 'professional', 'both']).optional()
});
```

## Files Modified

1. **`src/schemas/validation/index.ts`** - Updated TypeScript schema
2. **`src/schemas/validation/index.js`** - Updated JavaScript schema (server-side)

## Validation Rules

- **primary_domain_id**: Optional UUID
- **secondary_domain_ids**: Optional array, max 3 UUIDs
- **areas_of_interest_ids**: Optional array, max 20 UUIDs
- **preference_type**: Optional enum ['seeking', 'offering', 'both']
- **max_postings**: Optional integer between 1-10
- **notification_settings**: Optional JSON object
- **privacy_settings**: Optional JSON object
- **interface_settings**: Optional JSON object
- **is_professional**: Optional boolean
- **education_status**: Optional enum ['student', 'professional', 'both']

## Server Validation Logic

The API endpoint uses both:
1. **Zod validation** (via `validateRequest` middleware) - Schema structure and types
2. **Business validation** (via `validatePreferences()` function) - Domain relationships and constraints

### Business Validation Rules
```javascript
// Implemented in validatePreferences() function
- Primary domain must exist and be active
- Primary domain must have domain_level = 'primary'
- Maximum 3 secondary domains allowed
- Each secondary domain must belong to the selected primary domain
- Maximum 20 areas of interest allowed
- Each area must belong to one of the selected secondary domains
```

## Manual Testing Guide

### 1. Prerequisites
```bash
# Ensure server is running
node server.js
# Server should be at http://localhost:3001
```

### 2. Get Authentication Token
```powershell
# Generate OTP
$body = '{"email":"saikveni6@gmail.com","type":"login"}'
Invoke-RestMethod -Uri 'http://localhost:3001/api/otp/generate' -Method POST -ContentType 'application/json' -Body $body

# Check email for OTP code

# Verify OTP
$verifyBody = '{"email":"saikveni6@gmail.com","otpCode":"123456","tokenType":"login"}'
$response = Invoke-RestMethod -Uri 'http://localhost:3001/api/otp/validate' -Method POST -ContentType 'application/json' -Body $verifyBody

# Login with OTP verified
$loginBody = '{"email":"saikveni6@gmail.com","password":"","otpVerified":true}'
$loginResponse = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/login' -Method POST -ContentType 'application/json' -Body $loginBody

# Extract token
$token = $loginResponse.token
```

### 3. Test GET /api/preferences/:userId
```powershell
# Should return existing preferences or create defaults
$headers = @{Authorization="Bearer $token"}
$prefs = Invoke-RestMethod -Uri "http://localhost:3001/api/preferences/9" -Method GET -Headers $headers

# Expected response structure:
# {
#   success: true,
#   preferences: {
#     id: "...",
#     user_id: 9,
#     primary_domain_id: "..." or null,
#     secondary_domain_ids: [...] or [],
#     areas_of_interest_ids: [...] or [],
#     secondary_domains: [...],
#     areas_of_interest: [...],
#     preference_type: "both",
#     max_postings: 5,
#     ...
#   }
# }
```

### 4. Test PUT /api/preferences/:userId (Minimal Valid Update)
```powershell
# Update with minimal fields (all optional)
$updateBody = '{
  "preference_type": "both",
  "max_postings": 5
}'
$headers = @{Authorization="Bearer $token"}
Invoke-RestMethod -Uri "http://localhost:3001/api/preferences/9" -Method PUT -Headers $headers -ContentType 'application/json' -Body $updateBody

# Expected: 200 OK
# {
#   success: true,
#   message: "Preferences updated successfully"
# }
```

### 5. Test PUT with Domain Selection (Full Update)
```powershell
# First, get available domains
$domains = Invoke-RestMethod -Uri "http://localhost:3001/api/preferences/domains/available" -Method GET

# Then update with domain selection
$fullUpdateBody = '{
  "primary_domain_id": "uuid-of-primary-domain",
  "secondary_domain_ids": ["uuid1", "uuid2"],
  "areas_of_interest_ids": ["area-uuid1", "area-uuid2"],
  "preference_type": "both",
  "max_postings": 5,
  "is_professional": true,
  "education_status": "professional"
}'
Invoke-RestMethod -Uri "http://localhost:3001/api/preferences/9" -Method PUT -Headers $headers -ContentType 'application/json' -Body $fullUpdateBody
```

### 6. Test Validation Errors
```powershell
# Test max secondary domains (should fail with >3)
$invalidBody = '{
  "secondary_domain_ids": ["uuid1", "uuid2", "uuid3", "uuid4"]
}'
Invoke-RestMethod -Uri "http://localhost:3001/api/preferences/9" -Method PUT -Headers $headers -ContentType 'application/json' -Body $invalidBody

# Expected: 400 Bad Request
# {
#   success: false,
#   error: {
#     code: "VALIDATION_ERROR",
#     message: "Invalid request data",
#     details: [
#       {
#         field: "body.secondary_domain_ids",
#         message: "Maximum 3 secondary domains allowed"
#       }
#     ]
#   }
# }
```

## Expected Results

### ✅ Success Cases
1. **GET /api/preferences/:userId** - 200 OK with preferences data
2. **PUT with valid minimal data** - 200 OK with success message
3. **PUT with valid full data** - 200 OK with success message

### ❌ Error Cases
1. **PUT with >3 secondary domains** - 400 Bad Request (Zod validation)
2. **PUT with >20 areas of interest** - 400 Bad Request (Zod validation)
3. **PUT with invalid UUID** - 400 Bad Request (Zod validation)
4. **PUT with invalid enum values** - 400 Bad Request (Zod validation)
5. **PUT with secondary domain from wrong primary** - 400 Bad Request (Business validation)
6. **PUT with area not in selected secondaries** - 400 Bad Request (Business validation)

## Additional Notes

### GET Endpoint Behavior
- If no preferences exist, automatically creates defaults
- Returns populated domain details (names, icons, colors)
- Handles JSON arrays stored as strings in database

### PUT Endpoint Behavior
- Creates new record if none exists
- Updates existing record
- Validates both schema (Zod) and business rules (custom)
- All fields are optional (allows partial updates)

### Known Limitations
- `notification_settings`, `privacy_settings`, and `interface_settings` accept any JSON object (no strict validation)
- Consider adding specific schemas for these nested objects in future iterations

## Completion Status

- ✅ Schema mismatch identified
- ✅ Both TypeScript and JavaScript schemas updated
- ✅ Server restarted successfully
- ⏳ Manual testing pending (requires valid auth token)
- ⏳ Frontend integration testing pending

## Next Steps

1. **Immediate:** Manual testing of both GET and PUT endpoints
2. **Short-term:** Test preferences UI in browser with updated schema
3. **Long-term:** Add specific validation for nested settings objects
4. **Quality:** Add unit tests for preferences validation logic

---

**Related Issues:**
- Action 4: API Input Validation (Task 8.2.5)
- Action 3: Theme Compliance (Task 7.13)
- Task 7.7.2: Enhanced Preferences Schema

**Impact:** This fix unblocks the preferences screen in the UI and ensures data integrity for user preference management.
