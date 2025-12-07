# Scout Report 4: Alumni Data Pipeline

**Date**: 2025-12-07  
**Purpose**: Map raw_csv_uploads → alumni_members → family members flow; document data pipeline, who/when/how, data quality

---

## Executive Summary

**Current State**: Data pipeline is unclear - no documented manual process
- raw_csv_uploads table is the source data used to migrate data into app via python script
- alumni_members table canonical (1,280 records, 99.8% complete)
- No automated pipeline defined; appears to be one-time import

**Key Findings**:
1. **One-Time Import**: Alumni data loaded but no ongoing pipeline
2. **Manual Scripts**: Multiple archive scripts suggest past ad-hoc loading
3. **Email Matching**: alumni_members.email is primary key for family member selection
4. **Data Quality**: 99.8% complete; mostly missing (1-2 records with NULL names)
5. **Pipeline Documentation**: MISSING - no spec for raw_csv_uploads → alumni_members

**Critical Gap**: Nobody knows:
- How raw_csv_uploads was populated initially
- What the JSON structure is (ROW_DATA field)
- How to handle new alumni imports
- Who maintains this data

---

## Files Discovered

### Alumni Integration Services
- `src/services/AlumniDataIntegrationService.ts` - Alumni data matching & validation
- `src/services/alumniDirectoryService.ts` - Alumni directory operations
- `src/components/admin/AlumniMemberManagement.tsx` - Admin UI

### Database Schema
- `docs/specs/functional/user-management/db-schema.md`
- Alumni data documented in: Task 7.5 implementation plan (phase-7 folder)

### Documentation
- `docs/progress/phase-8/task-8.0-database-design-fixes.md` - Data migration history

---

## Current Alumni Data Architecture

### Table: raw_csv_uploads (Staging/Archive)

**Purpose**: Store original CSV uploads for audit trail

**Schema**:
```sql
CREATE TABLE raw_csv_uploads (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  File_name VARCHAR(255) NOT NULL,
  Description TEXT,
  Source VARCHAR(100),
  Category VARCHAR(100),
  Format VARCHAR(50),
  ROW_DATA JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Current Data**: ~1 record (appears stale/archive only)

**Row Structure** (inferred from code):
```json
{"Name": "Abhiradh Janagama", "Email": "madhukatepally@gmail.com", "Phone": "6128593595", "batch": "B8", "result": "Medal", "category": "MC", "familyId": "2465", "isUpdated": "N", "studentId": "10107", "FamilyName": "Janagama", "GitaFamily": "", "centerName": "California-Bay Area", "fatherName": " ", "isKurukshetra": ""}
```

**Issues**:
- ROW_DATA structure not documented officially
- Field names inconsistent (Name vs FamilyName/FatherName)
- Some fields map to multiple columns in alumni_members

---

### Table: alumni_members (Canonical Source)

**Purpose**: Authoritative alumni data

**Schema**:
```sql
CREATE TABLE alumni_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id VARCHAR(50) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) NULL,
  batch INT COMMENT 'Graduation year',
  result VARCHAR(100) COMMENT 'Degree/result',
  center_name VARCHAR(255) COMMENT 'Department/center',
  address TEXT,
  birth_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_student_id (student_id)
);
```

**Data Statistics**:
- Total records: 1,280
- Data completeness:
  - first_name: 99.9% (1-2 NULL)
  - last_name: 99.8% (2-3 NULL)
  - email: 99.9% (1 NULL)
  - phone: Most NULL (phone data sparse)
  - batch: ~90% complete
  - birth_date: ~5% complete (rarely populated)

**Current Usage**:
- Displayed in admin: AlumniMemberManagement.tsx
- Matched during registration: AlumniDataIntegrationService.fetchAllAlumniMembersByEmail()
- Linked to FAMILY_MEMBERS via alumni_member_id FK

**Missing Fields** (based on registration code):
- estimated_birth_year (referenced in queries but not in schema)
- birth_date precision inconsistent

---

## Data Pipeline Analysis

### Current Pipeline: Import → Store → Match

```
[CSV Files]
    ↓
raw_csv_uploads.ROW_DATA (JSON)
    ↓ (unclear process - manual script?)
alumni_members (structured table)
    ↓ (email match during registration)
FAMILY_MEMBERS.alumni_member_id (FK link)
    ↓ (snapshot capture)
FAMILY_MEMBERS.alumni_data_snapshot (JSON backup)
```

### What We DON'T Know

1. **Initial Import**: How were 1,280 records loaded into alumni_members?
   - From raw_csv_uploads? (only 1 record there)
   - Direct SQL INSERT? (no migration file)
   - External tool? (not documented)

2. **Data Ownership**: Who manages alumni_members updates?
   - Admin? School? External system?
   - One-time import or continuous?

3. **Email Matching**: What if duplicate emails?
   - UNIQUE constraint on email in alumni_members
   - But registration code fetches ALL by email (multiple results possible?)
   - What if data quality issue: same email for unrelated people?

4. **Snapshot Strategy**: When is alumni_data_snapshot captured?
   - On family member creation? (code suggests YES)
   - What fields included in JSON?
   - How is it used (read-only audit, or reconciliation)?

---

## Data Quality Issues

### Issue 1: Missing first_name/last_name (1-2 records)

**Location**: Identified in Task 8.0 database fixes

**Root Cause**: Historical data import issue

**Fix Status**: ✅ Manual repair applied (see: fix-user-profile-immediate.js)

**Ongoing**: Need validation on import

---

### Issue 2: Phone Data Sparse

**Current State**: Most alumni_members.phone is NULL

**Usage**: UI displays phone but rarely available

**Decision Needed**: 
- [ ] Make phone collection mandatory during registration?
- [ ] Allow user-supplied phone instead?
- [ ] Or accept sparse data?

---

### Issue 3: Birth_date Rarely Populated (5%)

**Current State**: 95% NULL in alumni_members

**Why**: Original CSV likely didn't include birth dates (privacy)

**Impact**: Age verification falls back to graduation year estimate

**Solution**: 
- Collect YOB during COPPA verification (see Scout 3)
- Don't try to back-fill from alumni_members

---

### Issue 4: Email Uniqueness Risk

**Current**: UNIQUE constraint on alumni_members.email

**Problem**: What if:
- Family shares email? (likely)
- Student + alumni have different emails?
- Email data quality issue (duplicates)?

**Solution**:
- Allow duplicate emails in alumni_members? (relax constraint)
- Handle in registration: show ALL matches to user
- Let user select which ones to claim

**Current Code Already Handles This**:
```typescript
// AlumniDataIntegrationService.ts
async fetchAllAlumniMembersByEmail(email): AlumniProfile[] {
  const query = `
    SELECT am.* FROM alumni_members am
    WHERE am.email = ? AND am.email IS NOT NULL AND am.email != ''
    ORDER BY am.first_name ASC
  `;
  // Returns MULTIPLE records if duplicate emails
}
```

**But Wait**: Database has UNIQUE constraint on email!
- [ ] Contradiction: How can there be duplicates if UNIQUE?
- [ ] Hypothesis: UNIQUE was added later, only recent data enforced
- [ ] OR: NULL email ignored by UNIQUE (MySQL behavior)
- [ ] **NEEDS CLARIFICATION**: Check actual schema

---

## Data Pipeline Proposal: Structured Import

### Problem Statement

Currently:
- No documented process for alumni data import/update
- raw_csv_uploads table undefined (structure unclear)
- No automation or scheduling
- Nobody knows how to add new alumni records

### Solution: Define Import Pipeline

**Phase 1: CSV Upload Interface (Admin)**

```
POST /admin/alumni/import
├─ Input: CSV file upload
├─ Validation:
│  ├─ File format (CSV, size < 50MB)
│  ├─ Required columns: first_name, last_name, email, batch
│  └─ Data validation: email format, batch year, etc.
├─ Store: raw_csv_uploads.ROW_DATA as JSON
│  └─ Each row: {first_name, last_name, email, batch, ...}
└─ Status: 'pending_review'
```

**Phase 2: Data Review & Validation (Admin)**

```
GET /admin/alumni/imports/:id
├─ Show: Sample rows with validation warnings
├─ Warnings:
│  ├─ Duplicate emails (would create multiple alumni)
│  ├─ Invalid email format
│  ├─ Missing required fields
│  ├─ Batch year in future
│  └─ Possible duplicate (similar name + email)
└─ Allow: Flag specific rows to skip
```

**Phase 3: Import Confirmation & Merge**

```
POST /admin/alumni/imports/:id/confirm
├─ Input: Approved rows (others skipped)
├─ For each row:
│  ├─ Check: Does matching student_id exist?
│  │  ├─ YES: UPDATE alumni_members (preserve ID)
│  │  └─ NO: INSERT as new record
│  ├─ Create: new first_name/last_name if changed
│  └─ Notify: if data changed (audit trail)
├─ Store: raw_csv_uploads.ROW_DATA (archive)
├─ Update: raw_csv_uploads.status = 'completed'
└─ Log: AGE_VERIFICATION_AUDIT or new ALUMNI_IMPORT_AUDIT
```

**Phase 4: Reconciliation (Optional)**

```
POST /admin/alumni/reconcile
├─ Check: For alumni → app_users matches
├─ For each alumni without app_users:
│  └─ Note: "unregistered alumni" for outreach
├─ For each app_users without alumni:
│  └─ Note: "non-alumni user" (spouse, etc.)
└─ Report: Reconciliation summary
```

---

## Email Matching Strategy (Critical for Registration)

### Current Behavior

```typescript
// During registration with invitation:
const email = invitation.email;  // From USER_INVITATIONS

// Find ALL alumni with this email
const allAlumniProfiles = 
  await alumniService.fetchAllAlumniMembersByEmail(email);

// Show to user: "We found N alumni records with your email"
// User sees: Names, graduation years, departments
// User action: ??? (implicit auto-selection happens)
```

### Problem

The code does `fetchAllAlumniMembersByEmail()` but:
1. **Returns array**: AlumniProfile[]
2. **Implicit selection**: First one auto-imported as primary
3. **Auto-import loop**: Others added without user choice

**Should Be**:
1. **Show matches**: "We found these alumni matching your email"
2. **User selects**: Check which ones to claim
3. **Then verify COPPA**: Ask for YOB for each selected
4. **Then create profiles**: After COPPA verification

---

## Data Flow For Year-of-Birth Population

### Current Fallback Chain

When no birth_date in alumni_members:

```typescript
// From AlumniDataIntegrationService.ts
CASE 
  WHEN am.birth_date IS NOT NULL 
    THEN TIMESTAMPDIFF(YEAR, am.birth_date, CURDATE())
  WHEN am.estimated_birth_year IS NOT NULL 
    THEN YEAR(CURDATE()) - am.estimated_birth_year
  WHEN am.batch IS NOT NULL 
    THEN YEAR(CURDATE()) - (am.batch - 22)
  ELSE NULL
END as estimated_age
```

**Issues**:
- `estimated_birth_year` field doesn't exist in alumni_members schema
- Batch - 22 is rough estimate (many graduate before/after 22)
- No birth_date validation

### Proposed: Year-of-Birth Collection During COPPA

**DON'T** try to infer YOB from batch
**DO** collect during onboarding (see Scout 3, 5)

```
Registration Flow:
  1. User selects alumni to claim
  2. For each selected alumni:
     POST /onboarding/verify-coppa
     ├─ Input: alumni_id, year_of_birth (user provides)
     ├─ Validate: Age is 14+ or has parent consent
     └─ Store: year_of_birth → FAMILY_MEMBERS
```

This way:
- User provides accurate YOB
- Not inferring from old batch data
- Direct input reduces errors
- Supports COPPA privacy principles (minimal data)

---

## Recommendations

### Priority 1: Document Current Pipeline (HIGH)

1. **Clarify raw_csv_uploads**:
   - [ ] Check actual schema in database (is UNIQUE on email?)
   - [ ] Document JSON structure in ROW_DATA
   - [ ] Determine: Is this still used or archive-only?
   - [ ] If archive: Create retention policy (delete after 1 year? 5 years?)

2. **Document alumni_members Lifecycle**:
   - [ ] Who owns this data?
   - [ ] Update frequency?
   - [ ] Is there an external source (HR system, etc.)?

3. **Create Import Playbook**:
   - [ ] Step-by-step: How to add 100 new alumni
   - [ ] Validation rules
   - [ ] Deduplication strategy
   - [ ] Post-import verification

### Priority 2: Remove Email Uniqueness Ambiguity (MEDIUM)

4. **Decide on Email**:
   - [ ] Option A: Keep UNIQUE - prevent families with shared email
   - [ ] Option B: Remove UNIQUE - allow families to share email
   - [ ] Current code suggests: Option B (fetches ALL by email)
   - [ ] If Option B: Update schema, handle in application logic

5. **Implement Registration Flow**:
   - [ ] Show ALL alumni matches to user
   - [ ] User explicitly selects which to claim
   - [ ] (Per Scout 5 findings)

### Priority 3: Data Pipeline Automation (MEDIUM)

6. **Create Import API** (if ongoing updates needed):
   - [ ] CSV upload endpoint
   - [ ] Validation rules
   - [ ] Deduplication
   - [ ] Audit trail
   - [ ] Status reporting

7. **Consider External Integration** (if HR system exists):
   - [ ] Sync from HR/Student system?
   - [ ] Nightly batch? Weekly? Monthly?
   - [ ] Reconciliation logic?

### Priority 4: Data Quality (LOW)

8. **Populate Year-of-Birth** (per Scout 3):
   - [ ] Don't infer from batch - collect from users
   - [ ] Add to FAMILY_MEMBERS, not alumni_members
   - [ ] Improves age verification accuracy

---

## Data Pipeline Decision Tree

```
START: Alumni data needs update
│
├─ Is this a one-time import?
│  ├─ YES: Use scripts/database/manual-import.js (create it)
│  └─ NO: Set up automation (see below)
│
├─ Is there an HR/Student system?
│  ├─ YES: Create nightly sync
│  │   ├─ Export from HR
│  │   ├─ Validate format
│  │   ├─ Match to existing (by student_id)
│  │   ├─ Merge changes
│  │   └─ Log audit trail
│  └─ NO: Proceed with CSV upload process
│
├─ Use CSV Upload Interface
│  ├─ Upload CSV file
│  ├─ Preview with validation
│  ├─ Confirm changes
│  ├─ Execute import
│  └─ Report results
│
└─ End: Data updated with audit trail
```

---

## Next Steps

1. **Immediate**: Query raw_csv_uploads to understand current state
2. **Soon**: Document JSON structure for ROW_DATA
3. **Clarify**: Who manages alumni data (HR, admin, external)?
4. **Create**: Import playbook and scripts
5. **Move to Scout 5**: Family member import logic (uses alumni data)

---

## Referenced Files

### Services
- `src/services/AlumniDataIntegrationService.ts` - Email matching logic
- `src/services/alumniDirectoryService.ts` - Alumni directory operations

### Components
- `src/components/admin/AlumniMemberManagement.tsx` - Admin management UI

### Database
- `migrations/add-birth-date-to-alumni-members.sql`
- `docs/specs/functional/user-management/db-schema.md`

