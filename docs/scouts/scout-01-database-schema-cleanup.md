# Scout Report 1: Database Schema & Current State

**Date**: 2025-12-07  
**Purpose**: Document current database schema, table usage, and data flow

---

## Executive Summary

**Current Database State**:
- **Deleted Tables**: FAMILY_INVITATIONS and FAMILY_ACCESS_LOG have been removed (confirmed unused)
- **Data Pipeline**: raw_csv_uploads (admin uploads) → alumni_members (manual Python scripts) → FAMILY_MEMBERS (via COPPA during registration)
- **Profile Consolidation**: user_profiles VIEW exists for backward compatibility; FAMILY_MEMBERS is single source of truth
- **Deprecated Fields**: app_users contains profile fields marked DEPRECATED (data moved to FAMILY_MEMBERS)
- **Year-of-Birth**: System collects YOB (INT) only for COPPA compliance, uses 12/31 date for age calculations
- **Email Verification**: System uses OTP-based email verification (not self-approved)

**Note**: All data in tables except raw_csv_uploads is test data and can be wiped/reloaded if needed.

---

## Files Discovered

### Database Schema Documentation
- `docs/specs/functional/authentication/db-schema.md` - Auth tables: USER_INVITATIONS, OTP_TOKENS, EMAIL_DELIVERY_LOG
- `docs/specs/functional/user-management/db-schema.md` - User tables: app_users, FAMILY_MEMBERS, USER_PREFERENCES, USER_NOTIFICATION_PREFERENCES, USER_PRIVACY_SETTINGS, user_profiles (deprecated VIEW)

### Database Structure Files
- `config/database.js` - DB pool configuration
- `scripts/database/migrations/*` - Migration files defining schema evolution

### Documentation
- `docs/progress/phase-8/task-8.0-database-design-fixes.md` - Historical schema problems and fixes
- `src/lib/database/schema/migration-history.md` - Complete migration history

---

## Core Schema Analysis

### 1. AUTHENTICATION TABLES

**Current Design**:
```
USER_INVITATIONS
├─ Purpose: Registration invitations (alumni, family_member, admin)
├─ Key Fields: email, invitation_token, invitation_type, status, expires_at
├─ FK: invited_by (app_users), accepted_by (app_users)
└─ Usage: Registration flow entry point with email OTP verification
```

**Email Verification**: OTP-based authentication during registration (not self-approved)

---

### 2. USER ACCOUNT & PROFILE TABLES

**Current Design**:
```
app_users (Authentication)
├─ Authentication: id, email, password_hash, role, is_active, status, email_verified
├─ OTP Settings: requires_otp, last_otp_sent, daily_otp_count, last_otp_reset_date
├─ Family Account: is_family_account, family_account_type, primary_family_member_id
├─ Alumni Link: alumni_member_id, invitation_id
├─ DEPRECATED Profile Fields: first_name, last_name, phone, birth_date, profile_image_url, bio, linkedin_url, current_position, company, location
└─ Status: MARKED DEPRECATED - use FAMILY_MEMBERS instead

FAMILY_MEMBERS (Single Source of Truth)
├─ Profile Data: first_name, last_name, display_name, bio, profile_image_url, phone
├─ Professional: linkedin_url, current_position, company, location
├─ Alumni: graduation_year, program, alumni_data_snapshot
├─ Social: social_links, user_additions
├─ Age/COPPA: year_of_birth (INT), birth_date (DATE with 12/31), age_at_registration, current_age, can_access_platform, requires_parent_consent, parent_consent_given, parent_consent_date
├─ Access Control: access_level (full/supervised/blocked), relationship (self/child/spouse/sibling/guardian), is_primary_contact, status
└─ FK: parent_user_id (app_users), alumni_member_id (alumni_members)

user_profiles (DEPRECATED - NOW A VIEW)
└─ No longer a table; created as VIEW for backward compatibility
```

**Consolidation Status**: ✅ Complete
- Profile data migrated to FAMILY_MEMBERS
- user_profiles now VIEW instead of table
- app_users still has deprecated fields for backward compatibility

---

### 3. ALUMNI DATA TABLES

**Current Design**:
```
raw_csv_uploads (CSV Import Staging)
├─ Purpose: Store uploaded CSV files as JSON
├─ Key Fields: ID (INT), File_name, Description, Source, Category, Format, ROW_DATA (JSON), created_at, updated_at
├─ Status: Active - Admin uploads CSVs here
└─ Note: Source table for alumni data pipeline

alumni_members (Canonical Alumni Data)
├─ Purpose: Authoritative alumni source data
├─ Key Fields: id (INT PK AUTO_INCREMENT), student_id (UNIQUE VARCHAR), first_name, last_name, email, phone, batch (INT - graduation year), result, center_name, address
├─ Indexes: idx_email, idx_student_id
├─ Records: ~1,280 complete alumni records
└─ Data Completeness: 99.8-99.9% (missing names in ~1-2 records)

FAMILY_MEMBERS (Profile + Alumni Link)
├─ Links to: alumni_members via alumni_member_id (INT FK)
├─ Alumni data stored as: alumni_data_snapshot (JSON)
├─ Also stores: First/last name, relationship, year_of_birth, access level, COPPA compliance
└─ Purpose: User platform profiles with alumni metadata
```

**Data Pipeline (3-Step Process)**:
```
STEP 1: Admin uploads CSV
↓
raw_csv_uploads.ROW_DATA (JSON)

STEP 2: Manual Python script transfer
↓
alumni_members (structured table)

STEP 3: User registration with COPPA compliance
↓
FAMILY_MEMBERS (via profile selection + verification)
```

---

### 4. YEAR-OF-BIRTH COPPA IMPLEMENTATION

**Purpose**: Collect minimal data (YOB only) for COPPA enforcement

**Schema**:
```sql
FAMILY_MEMBERS
├─ year_of_birth INT        -- YYYY format (primary for COPPA)
├─ birth_date DATE           -- Computed as 12/31/year_of_birth for age calculations
└─ current_age INT           -- Derived from year_of_birth
```

**Age Calculation**:
- Use 12/31 of birth year as boundary date (most conservative approach)
- COPPA thresholds: Under 14 (blocked), 14-17 (require consent), 18+ (full access)

**Relationship Collection**:
- Cannot assume first batch user as parent (children often graduate before parents)
- Alternative approach: Ask relationship (parent/child), then ask YOB only if child selected
- This aligns with COPPA requirements for minimal data collection

---

## Table Relationship Map

```
                    app_users (1)
                        │
                        ├─────────────────────────────┐
                        │                             │
         FAMILY_MEMBERS (N)        USER_PREFERENCES (1)
                │                  USER_NOTIFICATION_PREFERENCES (1)
                │                  USER_PRIVACY_SETTINGS (1)
                │
            (parent_user_id FK)
                │
                └─ alumni_member_id (FK to alumni_members)


USER_INVITATIONS (1) ──< (N) accepted_by (app_users)
USER_INVITATIONS (1) ──< (N) invited_by (app_users)

OTP_TOKENS (N) ──< (1) user_id (app_users)
EMAIL_DELIVERY_LOG (N) ─ tracks: USER_INVITATIONS, OTP_TOKENS emails


[STAGING/SOURCE]
raw_csv_uploads (admin upload staging - source data)
alumni_members (canonical alumni reference)
user_profiles (deprecated VIEW - backward compatibility)
```

---

## Database Statistics

| Table | Records | Purpose | Status |
|-------|---------|---------|--------|
| app_users | ~100 | Authentication | Active |
| FAMILY_MEMBERS | ~300 | User profiles + family | Active |
| USER_PREFERENCES | ~100 | User settings | Active |
| USER_NOTIFICATION_PREFERENCES | ~100 | Notification config | Active |
| USER_PRIVACY_SETTINGS | ~100 | Privacy config | Active |
| alumni_members | ~1,280 | Alumni source data | Active |
| USER_INVITATIONS | ~200 | Invitations | Active |
| OTP_TOKENS | cycling | OTP codes | Active |
| EMAIL_DELIVERY_LOG | ~1,000 | Email audit trail | Active |
| raw_csv_uploads | varies | CSV upload staging | Active (source) |
| user_profiles (VIEW) | N/A | Deprecated view | Legacy |
| FAMILY_INVITATIONS | N/A | **DELETED** | Removed |
| FAMILY_ACCESS_LOG | N/A | **DELETED** | Removed |

---

## COPPA & Year-of-Birth Fields

### Current COPPA Fields in FAMILY_MEMBERS
```sql
year_of_birth INT                            -- YYYY format (primary)
birth_date DATE                              -- Computed as 12/31/year_of_birth
age_at_registration INT                      -- Snapshot at sign-up
current_age INT                              -- Derived from year_of_birth
can_access_platform BOOLEAN                  -- TRUE if ≥14 or parent consented
requires_parent_consent BOOLEAN              -- TRUE if <18
parent_consent_given BOOLEAN                 -- Has parent approved
parent_consent_date TIMESTAMP                -- When consent obtained
last_consent_check_at TIMESTAMP              -- Last age verification
relationship VARCHAR                         -- parent/child/other (user-selected)
```

**Rationale for YOB-Only Collection**:
- Minimizes data collection and privacy risks
- Birth date needed ONLY for COPPA enforcement (determine if under 14, 14-17, or 18+)
- Using YOB with 12/31 date provides consistent age boundaries

---

## Patterns Identified

### Good Patterns (Keep)

1. ✅ **Foreign Key Constraints**: All relationships properly defined
2. ✅ **Indexing Strategy**: Proper indexes on frequently queried columns
3. ✅ **Timestamp Tracking**: created_at, updated_at on all tables
4. ✅ **JSON Flexibility**: social_links, alumni_data_snapshot for extensibility
5. ✅ **OTP Email Verification**: Secure email validation during registration

---

## Referenced Files

### Schema Documentation
- `docs/specs/functional/authentication/db-schema.md`
- `docs/specs/functional/user-management/db-schema.md`

### Historical References
- `docs/progress/phase-8/task-8.0-database-design-fixes.md`
- `src/lib/database/schema/migration-history.md`

### Database Configuration
- `config/database.js`
- `migrations/` (migration files)
