---
version: "1.0"
status: active
last_updated: 2025-12-07
---

# Registration & Onboarding: Database Schema

## Overview

Phase 2 introduces three new tables: `accounts`, `user_profiles`, and `PARENT_CONSENT_RECORDS`. The `alumni_members` table is also enhanced with new columns.

## Table: accounts

**Purpose**: Store authentication credentials and account metadata (replaces deprecated `app_users`).

### Columns

| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `id` | CHAR(36) | No | Unique account ID (UUID) |
| `email` | VARCHAR(255) | No | Email address (UNIQUE) |
| `password_hash` | VARCHAR(255) | No | Bcrypt hashed password |
| `status` | ENUM('pending','active','suspended','deleted') | No | Account lifecycle status |
| `role` | ENUM('user','admin') | No | Account role/permissions |
| `email_verified` | BOOLEAN | No | Email verification status |
| `email_verified_at` | TIMESTAMP | Yes | When email was verified |
| `last_login_at` | TIMESTAMP | Yes | Last successful login |
| `login_count` | INT | No | Total login count |
| `created_at` | TIMESTAMP | No | Account creation time |
| `updated_at` | TIMESTAMP | No | Last update time |

### Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| `PRIMARY KEY` | id | Fast account lookup |
| `UNIQUE` | email | Prevent duplicate emails |
| `idx_status` | status | Filter by account status |

## Table: user_profiles

**Purpose**: Store app user profiles with access control (replaces deprecated `FAMILY_MEMBERS`).

### Columns

| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `id` | CHAR(36) | No | Unique profile ID (UUID) |
| `account_id` | CHAR(36) | No | Link to accounts (FK) |
| `alumni_member_id` | INT | No | Link to alumni_members (FK) |
| `relationship` | ENUM('parent','child') | No | Relationship type |
| `parent_profile_id` | CHAR(36) | Yes | Link to parent profile if child (FK) |
| `access_level` | ENUM('full','supervised','blocked') | No | Platform access permission |
| `requires_consent` | BOOLEAN | No | Whether parental consent needed |
| `parent_consent_given` | BOOLEAN | No | Whether consent already given |
| `consent_expiry_date` | DATE | Yes | When parental consent expires |
| `status` | ENUM('active','suspended','deleted') | No | Profile status |
| `display_name` | VARCHAR(255) | Yes | User-customized display name |
| `bio` | TEXT | Yes | User profile bio |
| `visibility` | ENUM('public','connections_only','private') | No | Profile visibility |
| `created_at` | TIMESTAMP | No | Profile creation time |
| `updated_at` | TIMESTAMP | No | Last update time |

### Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| `PRIMARY KEY` | id | Fast profile lookup |
| `UNIQUE` | account_id, alumni_member_id | Prevent duplicate alumni per account |
| `FK` | account_id | Link to account |
| `FK` | alumni_member_id | Link to alumni |
| `FK` | parent_profile_id | Link to parent profile |
| `idx_access_level` | access_level | Filter by access level |

## Table: PARENT_CONSENT_RECORDS

**Purpose**: Maintain audit trail of parental consent for COPPA compliance.

### Columns

| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `id` | CHAR(36) | No | Unique record ID (UUID) |
| `parent_profile_id` | CHAR(36) | No | Parent's user_profiles.id (FK) |
| `child_profile_id` | CHAR(36) | No | Child's user_profiles.id (FK) |
| `consent_type` | ENUM('parental_consent','parental_revocation') | No | Type of consent action |
| `consent_given_at` | TIMESTAMP | No | When consent was given |
| `consent_expires_at` | TIMESTAMP | No | When consent expires (1 year) |
| `status` | ENUM('active','withdrawn','expired') | No | Current consent status |
| `created_at` | TIMESTAMP | No | Record creation time |
| `updated_at` | TIMESTAMP | No | Last update time |

### Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| `PRIMARY KEY` | id | Fast lookup |
| `FK` | parent_profile_id | Link to parent |
| `FK` | child_profile_id | Link to child |
| `idx_status` | status | Filter by consent status |

## Table: alumni_members (Enhanced)

**Purpose**: Source of truth for all alumni data, enhanced with COPPA fields.

### New/Updated Columns

| Column | Type | Purpose |
|--------|------|---------|
| `year_of_birth` | INT | Birth year (COPPA minimal data) |
| `current_center` | VARCHAR(255) | Current training center |
| `profile_image_url` | VARCHAR(500) | Profile image URL |

### Existing Columns
- `id` - Unique alumni ID
- `email` - Email (can match multiple records)
- `first_name`, `last_name` - Full name
- `batch` - Enrollment/graduation year
- `center_name` - Historical center name
- `status` - Active/inactive status

## Key Design Decisions

1. **One Email per Account**: `accounts.email` UNIQUE constraint
2. **Multiple Profiles per Account**: User can claim multiple alumni (parent + children)
3. **Relationship Types**: Simplified to 'parent' or 'child' only
4. **Access Control**: ENUM prevents invalid permission states
5. **COPPA Compliance**: Explicit consent fields with expiry tracking
6. **Audit Trail**: PARENT_CONSENT_RECORDS tracks all consent actions
7. **Data Minimization**: YOB stored as INT only, no full birthdate

## Relationships Diagram

```
accounts (1) ──────→ (N) user_profiles
    │                      │
    │                      ├─→ alumni_members
    │                      └─→ parent_profile_id (self-join)
    │
    └─ (for child profiles) → PARENT_CONSENT_RECORDS

PARENT_CONSENT_RECORDS:
    parent_profile_id ──→ user_profiles (parent)
    child_profile_id ──→ user_profiles (child)
```

## Related

- [Registration](./registration.md)
- [Profile Creation](./profile-creation.md)
- [Parental Consent](./parental-consent.md)
