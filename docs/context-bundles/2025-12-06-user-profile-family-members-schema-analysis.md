# Context Bundle: User Profile vs Family Members Schema Analysis

**Date:** December 6, 2025  
**Session:** Registration 500 Error Investigation & Schema Consolidation  
**Status:** 🟢 RESOLVED - Schema Consolidation Implemented  
**Priority:** High - Registration feature now working

---

## Executive Summary

The system had **overlapping data structures** for user identity that have been consolidated:

### Before (Redundant)
1. `app_users` - Auth + duplicate profile fields
2. `user_profiles` - Extended profile (DEPRECATED)
3. `FAMILY_MEMBERS` - Family profiles

### After (Consolidated)
1. `app_users` - **Auth ONLY** (email, password, role, status)
2. `FAMILY_MEMBERS` - **ALL profile data** (including alumni snapshot, graduation info)
3. `user_profiles` - **DEPRECATED** (view for backward compatibility)

---

## Decision: Merge `user_profiles` INTO `FAMILY_MEMBERS`

### Rationale
1. **COPPA compliance does NOT require separate tables** - just proper access controls
2. **No legal requirement** for separate audit tables for COPPA fields
3. **Redundant fields are dangerous** - data sync issues, bugs, confusion
4. `FAMILY_MEMBERS` already supports all needed functionality:
   - Netflix-style profile switching
   - COPPA access control fields
   - Relationship tracking
   - Audit timestamps

### Implementation Approach
1. Add missing columns to `FAMILY_MEMBERS` (graduation_year, program, alumni_data_snapshot, social_links)
2. Migrate existing `user_profiles` data to corresponding `FAMILY_MEMBERS` records
3. Create `user_profiles` as a VIEW for backward compatibility
4. Update all services to use `FAMILY_MEMBERS` as single source of truth
5. Remove redundant fields from `app_users` (keep for backward compatibility initially)

---

## Database Schema Verification (Dec 6, 2025)

### Actual Schema from Database

**`app_users` columns:**
```
id, email, is_family_account, family_account_type, primary_family_member_id,
first_name, password_hash, role, is_active, created_at, updated_at,
alumni_member_id, last_name, birth_date, phone, profile_image_url, bio,
linkedin_url, current_position, company, location, status, email_verified,
email_verified_at, last_login_at, login_count, two_factor_enabled, last_password_change
```
⚠️ Has redundant profile fields: first_name, last_name, bio, phone, profile_image_url

**`user_profiles` columns:**
```
id, user_id, alumni_member_id, first_name, last_name, display_name, bio,
avatar_url, phone, social_links, created_at, updated_at, graduation_year,
program, alumni_data_snapshot, user_additions
```
⚠️ DEPRECATED - Will become a VIEW

**`FAMILY_MEMBERS` columns:**
```
id, parent_user_id, alumni_member_id, first_name, last_name, display_name,
birth_date, age_at_registration, current_age, can_access_platform,
requires_parent_consent, parent_consent_given, parent_consent_date,
access_level, relationship, is_primary_contact, profile_image_url, bio,
status, created_at, updated_at, last_login_at, last_consent_check_at
```
✅ Primary profile table - needs graduation_year, program, alumni_data_snapshot, social_links

---

## New Consolidated Schema Design

### `app_users` - Authentication Only
```sql
-- KEEP these columns (auth-related):
id, email, password_hash, role, is_active, status, email_verified, 
email_verified_at, created_at, updated_at, last_login_at, login_count,
two_factor_enabled, last_password_change, alumni_member_id,
is_family_account, family_account_type, primary_family_member_id

-- DEPRECATED (read from FAMILY_MEMBERS instead):
first_name, last_name, birth_date, phone, profile_image_url, bio,
linkedin_url, current_position, company, location
```

### `FAMILY_MEMBERS` - All Profile Data
```sql
-- Existing columns (keep all)
id, parent_user_id, alumni_member_id, first_name, last_name, display_name,
birth_date, age_at_registration, current_age, can_access_platform,
requires_parent_consent, parent_consent_given, parent_consent_date,
access_level, relationship, is_primary_contact, profile_image_url, bio,
status, created_at, updated_at, last_login_at, last_consent_check_at

-- ADD these columns (from user_profiles):
graduation_year INT NULL,
program VARCHAR(100) NULL,
alumni_data_snapshot JSON NULL,
social_links JSON NULL,
user_additions JSON NULL,
phone VARCHAR(20) NULL,
linkedin_url VARCHAR(500) NULL,
current_position VARCHAR(200) NULL,
company VARCHAR(200) NULL,
location VARCHAR(200) NULL
```

### `user_profiles` - DEPRECATED (Backward Compatibility View)
```sql
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  fm.id,
  fm.parent_user_id as user_id,
  fm.alumni_member_id,
  fm.first_name,
  fm.last_name,
  fm.display_name,
  fm.bio,
  fm.profile_image_url as avatar_url,
  fm.phone,
  fm.social_links,
  fm.created_at,
  fm.updated_at,
  fm.graduation_year,
  fm.program,
  fm.alumni_data_snapshot,
  fm.user_additions
FROM FAMILY_MEMBERS fm
WHERE fm.relationship = 'self' AND fm.is_primary_contact = 1;
```

---

## Migration Steps

### Step 1: Add Missing Columns to FAMILY_MEMBERS
```sql
ALTER TABLE FAMILY_MEMBERS 
  ADD COLUMN graduation_year INT NULL,
  ADD COLUMN program VARCHAR(100) NULL,
  ADD COLUMN alumni_data_snapshot JSON NULL,
  ADD COLUMN social_links JSON NULL,
  ADD COLUMN user_additions JSON NULL,
  ADD COLUMN phone VARCHAR(20) NULL,
  ADD COLUMN linkedin_url VARCHAR(500) NULL,
  ADD COLUMN current_position VARCHAR(200) NULL,
  ADD COLUMN company VARCHAR(200) NULL,
  ADD COLUMN location VARCHAR(200) NULL;
```

### Step 2: Migrate Data from user_profiles
```sql
UPDATE FAMILY_MEMBERS fm
INNER JOIN user_profiles up ON fm.parent_user_id = up.user_id 
  AND fm.relationship = 'self' AND fm.is_primary_contact = 1
SET 
  fm.graduation_year = up.graduation_year,
  fm.program = up.program,
  fm.alumni_data_snapshot = up.alumni_data_snapshot,
  fm.social_links = up.social_links,
  fm.user_additions = up.user_additions;
```

### Step 3: Create Backward Compatibility View
```sql
-- Rename table to preserve data
RENAME TABLE user_profiles TO user_profiles_deprecated;

-- Create view with same name
CREATE VIEW user_profiles AS
SELECT ... (see above)
```

### Step 4: Update Services
- `StreamlinedRegistrationService.ts` - Remove user_profiles INSERT
- `FamilyMemberService.js` - Handle graduation/program fields
- `routes/users.js` - Read from FAMILY_MEMBERS

---

## Mobile App Integration Notes

**Mobile App Location:** `C:\React-Projects\SGSGitaMahayagnaMetroNOExpo\Documentation.md`

**Key Differences to Bridge:**
| Field | Web App | Mobile App | Resolution |
|-------|---------|------------|------------|
| Age | `birth_date` | `yearOfBirth` | Store both, derive |
| Family | `FAMILY_MEMBERS` table | `familyName` string | Add familyName to FAMILY_MEMBERS |
| Photo | `profile_image_url` | `photoUrl` | Use consistent naming |
| Center | Not implemented | `currentCenter` | Add to FAMILY_MEMBERS |

---

## Files Modified

### Database
- `migrations/consolidate-user-profiles.sql` - Main migration script

### Services  
- `src/services/StreamlinedRegistrationService.ts` - Remove user_profiles INSERT
- `server/services/FamilyMemberService.js` - Add graduation/program handling

### Documentation
- `docs/specs/functional/user-management/db-schema.md` - Updated schema
- `docs/specs/functional/user-management/README.md` - Updated module docs
- This context bundle

---

## Summary: Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| Profile tables | 3 (app_users, user_profiles, FAMILY_MEMBERS) | 1 (FAMILY_MEMBERS) |
| `first_name` stored in | 3 tables | 1 table |
| Registration creates | 3 records | 2 records (app_users + FAMILY_MEMBERS) |
| COPPA fields in | FAMILY_MEMBERS | FAMILY_MEMBERS (same) |
| Alumni snapshot | user_profiles | FAMILY_MEMBERS |
| Backward compatibility | N/A | VIEW for user_profiles |

---

## Related Context Bundles
- `2025-11-26-birth-date-family-member-fix.md`
- `2025-11-30-sdd-tac-framework-phase1-implementation.md`
