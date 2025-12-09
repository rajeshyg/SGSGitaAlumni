# Phase 5: Stale Code Cleanup Checklist

**Date**: 2025-12-07  
**Status**: READY FOR EXECUTION  
**Depends On**: Phases 1-4  
**Duration**: 0.5 day

---

## Overview

Final cleanup pass to ensure all stale code, scripts, and documentation are removed or archived. Each item includes grep verification commands.

---

## Master Cleanup Checklist

### Category 1: Database References (9 items)

| # | Item | Files | Grep Command | Status |
|---|------|-------|--------------|--------|
| 1.1 | `app_users` table references | routes/, server/, src/ | `grep -r "app_users" routes/ server/ src/` | ☐ |
| 1.2 | `FAMILY_MEMBERS` table references | routes/, server/, src/ | `grep -r "FAMILY_MEMBERS" routes/ server/ src/` | ☐ |
| 1.3 | `FAMILY_INVITATIONS` table references | routes/, server/, src/ | `grep -r "FAMILY_INVITATIONS" routes/ server/ src/` | ☐ |
| 1.4 | `FAMILY_ACCESS_LOG` table references | routes/, server/, src/ | `grep -r "FAMILY_ACCESS_LOG" routes/ server/ src/` | ☐ |
| 1.5 | `estimated_birth_year` column | all code | `grep -r "estimated_birth_year" routes/ server/ src/` | ☐ |
| 1.6 | `birth_date` full date (not YOB) | all code | `grep -r "birth_date\|birthDate" routes/ server/ src/` | ☐ |
| 1.7 | `primary_family_member_id` | all code | `grep -r "primary_family_member" routes/ server/ src/` | ☐ |
| 1.8 | `is_primary_contact` logic | all code | `grep -r "is_primary_contact\|isPrimaryContact" routes/ server/ src/` | ☐ |
| 1.9 | Old `user_profiles` VIEW | all code | `grep -r "user_profiles.*VIEW\|CREATE VIEW user_profiles" scripts/` | ☐ |

**Action**: Replace or delete all matches

---

### Category 2: Relationship Enum (4 items)

| # | Item | Files | Grep Command | Status |
|---|------|-------|--------------|--------|
| 2.1 | `relationship = 'self'` | all code | `grep -r "relationship.*self\|'self'" routes/ server/ src/` | ☐ |
| 2.2 | `relationship = 'spouse'` | all code | `grep -r "relationship.*spouse\|'spouse'" routes/ server/ src/` | ☐ |
| 2.3 | `relationship = 'sibling'` | all code | `grep -r "relationship.*sibling\|'sibling'" routes/ server/ src/` | ☐ |
| 2.4 | `relationship = 'guardian'` | all code | `grep -r "relationship.*guardian\|'guardian'" routes/ server/ src/` | ☐ |

**Action**: Replace with 'parent' or 'child' only

---

### Category 3: Deprecated Endpoints (7 items)

| # | Item | File | Grep Command | Status |
|---|------|------|--------------|--------|
| 3.1 | `registerFromFamilyInvitation` | routes/auth.js, server.js | `grep -r "registerFromFamilyInvitation" routes/ server.js` | ☐ |
| 3.2 | `getFamilyInvitations` | routes/invitations.js | `grep -r "getFamilyInvitations" routes/ server.js` | ☐ |
| 3.3 | `createFamilyInvitation` | routes/invitations.js | `grep -r "createFamilyInvitation" routes/ server.js` | ☐ |
| 3.4 | `acceptFamilyInvitationProfile` | routes/invitations.js | `grep -r "acceptFamilyInvitationProfile" routes/ server.js` | ☐ |
| 3.5 | `/api/auth/register-from-family-invitation` | server.js | `grep -r "register-from-family-invitation" server.js src/` | ☐ |
| 3.6 | `/api/invitations/family` | server.js | `grep -r "/invitations/family" server.js src/` | ☐ |
| 3.7 | `POST /:id/birth-date` (full date) | routes/family-members.js | `grep -r "birth-date" routes/ src/` | ☐ |

**Action**: Delete functions and routes

---

### Category 4: Age Calculation Logic (3 items)

| # | Item | Files | Grep Command | Status |
|---|------|-------|--------------|--------|
| 4.1 | `batch - 22` formula | all code | `grep -r "batch.*-.*22\|graduation.*-.*22" routes/ server/ src/` | ☐ |
| 4.2 | Full date age calculation | all code | `grep -r "TIMESTAMPDIFF.*birth_date\|new Date.*birthDate" routes/ server/ src/` | ☐ |
| 4.3 | `estimatedBirthYear` property | TypeScript | `grep -r "estimatedBirthYear" src/` | ☐ |

**Action**: Replace with `currentYear - yearOfBirth`

---

### Category 5: Auto-Import Logic (3 items)

| # | Item | File | Grep Command | Status |
|---|------|------|--------------|--------|
| 5.1 | `fetchAllAlumniMembersByEmail` loop | StreamlinedRegistrationService.ts | `grep -r "fetchAllAlumniMembersByEmail" src/` | ☐ |
| 5.2 | `createAdditionalFamilyMember` | StreamlinedRegistrationService.ts | `grep -r "createAdditionalFamilyMember" src/` | ☐ |
| 5.3 | Auto-import comment blocks | all services | `grep -r "auto-import\|autoImport" src/` | ☐ |

**Action**: Delete auto-import logic

---

### Category 6: TypeScript Types (4 items)

| # | Item | File | Grep Command | Status |
|---|------|------|--------------|--------|
| 6.1 | `FamilyMember` interface | src/types/ | `grep -r "interface FamilyMember\|type FamilyMember" src/` | ☐ |
| 6.2 | `birthDate: string` property | src/types/ | `grep -r "birthDate.*string\|birth_date.*string" src/types/` | ☐ |
| 6.3 | Old `User` interface with familyMembers | src/types/ | `grep -r "familyMembers.*FamilyMember" src/types/` | ☐ |
| 6.4 | `primary_family_member_id` in User | src/services/ | `grep -r "primary_family_member_id" src/services/` | ☐ |

**Action**: Replace with new types

---

### Category 7: Frontend Components (6 items)

| # | Item | File | Grep Command | Status |
|---|------|------|--------------|--------|
| 7.1 | Birth date input components | src/components/ | `grep -r "type=\"date\"\|DatePicker\|birth.*input" src/components/` | ☐ |
| 7.2 | `relationship === 'self'` checks | src/components/ | `grep -r "relationship.*===.*'self'" src/` | ☐ |
| 7.3 | `isPrimaryContact` logic | src/components/ | `grep -r "isPrimaryContact\|is_primary_contact" src/` | ☐ |
| 7.4 | Old FamilyMember imports | src/components/ | `grep -r "import.*FamilyMember" src/components/` | ☐ |
| 7.5 | `familyMembers` state/props | src/components/ | `grep -r "familyMembers\|family_members" src/components/` | ☐ |
| 7.6 | FAMILY_INVITATIONS API calls | src/services/ | `grep -r "family.*invitation\|familyInvitation" src/services/` | ☐ |

**Action**: Replace or delete components

---

### Category 8: Scripts to Archive (15+ items)

| # | Script | Location | Action | Status |
|---|--------|----------|--------|--------|
| 8.1 | `add-birth-date-to-alumni-members.sql` | scripts/database/migrations/ | Archive | ☐ |
| 8.2 | `run-add-birth-date-migration.js` | scripts/database/migrations/ | Archive | ☐ |
| 8.3 | `create-family-members-tables.sql` | scripts/database/migrations/ | Archive | ☐ |
| 8.4 | `create-family-tables-simple.sql` | scripts/database/migrations/ | Archive | ☐ |
| 8.5 | `migrate-existing-users-to-family.js` | scripts/database/ | Archive | ☐ |
| 8.6 | `setup-dev-family-data.js` | scripts/database/ | Archive | ☐ |
| 8.7 | `link-family-members-by-email.js` | scripts/database/ | Archive | ☐ |
| 8.8 | `link-family-members-for-user.js` | scripts/database/ | Archive | ☐ |
| 8.9 | `fix-family-relationships.js` | scripts/database/ | Archive | ☐ |
| 8.10 | `verify-family-schema.js` | scripts/database/ | Archive | ☐ |
| 8.11 | `setup-family-schema.js` | scripts/database/ | Archive | ☐ |
| 8.12 | `migrate-test-accounts-to-family.js` | scripts/database/ | Archive | ☐ |
| 8.13 | `migrate-specific-users.js` | scripts/database/ | Archive | ☐ |
| 8.14 | `migrate-sannidhi-sriharsha.js` | scripts/database/ | Archive | ☐ |
| 8.15 | All scripts in `scripts/archive/` subfolders | scripts/archive/ | Review/Delete | ☐ |

**Archive Location**: `scripts/archive/deprecated-2025-12-07/`

---

### Category 9: Documentation to Archive (8+ items)

| # | Document | Location | Action | Status |
|---|----------|----------|--------|--------|
| 9.1 | `2025-11-26-birth-date-family-member-fix.md` | docs/context-bundles/ | Archive | ☐ |
| 9.2 | Old authentication specs | docs/specs/functional/authentication/ | Archive | ☐ |
| 9.3 | Old user-management specs | docs/specs/functional/user-management/ | Archive | ☐ |
| 9.4 | `invitation-management.md` (old) | docs/specs/functional/admin/ | Archive | ☐ |
| 9.5 | `REGISTRATION_FLOW_INVESTIGATION.md` | docs/archive/ | Keep (historical) | ☐ |
| 9.6 | `FEATURE_IMPLEMENTATION_REPORT.md` | docs/archive/ | Keep (historical) | ☐ |
| 9.7 | Old db-schema.md files | docs/specs/functional/*/db-schema.md | Update | ☐ |
| 9.8 | `functional-specs-old/` folder | docs/archive/ | Keep (historical) | ☐ |

**Archive Location**: `docs/specs/functional/_archive/`

---

### Category 10: Server/Middleware (3 items)

| # | Item | File | Grep Command | Status |
|---|------|------|--------------|--------|
| 10.1 | `app_users` in auth middleware | middleware/auth.js | `grep -r "app_users" middleware/` | ☐ |
| 10.2 | `primary_family_member_id` in session | middleware/auth.js | `grep -r "primary_family_member" middleware/` | ☐ |
| 10.3 | Old FamilyMemberService methods | server/services/ | `grep -r "FAMILY_MEMBERS\|app_users" server/services/` | ☐ |

**Action**: Update middleware and services

---

## Execution Script

Create a cleanup verification script:

```powershell
# scripts/validation/verify-cleanup.ps1

Write-Host "=== Verifying Stale Code Cleanup ===" -ForegroundColor Cyan

$errors = 0

# Category 1: Database References
$checks = @(
    @{ Name = "app_users"; Pattern = "app_users" },
    @{ Name = "FAMILY_MEMBERS"; Pattern = "FAMILY_MEMBERS" },
    @{ Name = "FAMILY_INVITATIONS"; Pattern = "FAMILY_INVITATIONS" },
    @{ Name = "FAMILY_ACCESS_LOG"; Pattern = "FAMILY_ACCESS_LOG" },
    @{ Name = "estimated_birth_year"; Pattern = "estimated_birth_year" },
    @{ Name = "birth_date (full)"; Pattern = "birth_date|birthDate" },
    @{ Name = "primary_family_member"; Pattern = "primary_family_member" }
)

foreach ($check in $checks) {
    $results = Get-ChildItem -Path "routes", "server", "src" -Recurse -Include "*.js", "*.ts", "*.tsx" | 
        Select-String -Pattern $check.Pattern -SimpleMatch:$false
    
    $count = ($results | Measure-Object).Count
    if ($count -gt 0) {
        Write-Host "❌ $($check.Name): $count matches found" -ForegroundColor Red
        $results | ForEach-Object { Write-Host "   $_" -ForegroundColor Yellow }
        $errors++
    } else {
        Write-Host "✅ $($check.Name): Clean" -ForegroundColor Green
    }
}

# Category 2: Relationship values
$relChecks = @("'self'", "'spouse'", "'sibling'", "'guardian'")
foreach ($rel in $relChecks) {
    $results = Get-ChildItem -Path "routes", "server", "src" -Recurse -Include "*.js", "*.ts", "*.tsx" |
        Select-String -Pattern "relationship.*$rel"
    
    $count = ($results | Measure-Object).Count
    if ($count -gt 0) {
        Write-Host "❌ relationship=$rel: $count matches found" -ForegroundColor Red
        $errors++
    } else {
        Write-Host "✅ relationship=$rel: Clean" -ForegroundColor Green
    }
}

# Category 3: Deprecated endpoints
$endpoints = @(
    "registerFromFamilyInvitation",
    "getFamilyInvitations",
    "createFamilyInvitation",
    "acceptFamilyInvitationProfile"
)
foreach ($ep in $endpoints) {
    $results = Get-ChildItem -Path "routes", "server.js", "src" -Recurse -Include "*.js", "*.ts", "*.tsx" |
        Select-String -Pattern $ep
    
    $count = ($results | Measure-Object).Count
    if ($count -gt 0) {
        Write-Host "❌ $ep: $count matches found" -ForegroundColor Red
        $errors++
    } else {
        Write-Host "✅ $ep: Clean" -ForegroundColor Green
    }
}

# Category 4: Age calculation
$results = Get-ChildItem -Path "routes", "server", "src" -Recurse -Include "*.js", "*.ts", "*.tsx" |
    Select-String -Pattern "batch.*-.*22|graduation.*-.*22"
$count = ($results | Measure-Object).Count
if ($count -gt 0) {
    Write-Host "❌ batch-22 formula: $count matches found" -ForegroundColor Red
    $errors++
} else {
    Write-Host "✅ batch-22 formula: Clean" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
if ($errors -eq 0) {
    Write-Host "✅ All checks passed! Cleanup complete." -ForegroundColor Green
} else {
    Write-Host "❌ $errors issues found. Please fix before proceeding." -ForegroundColor Red
}
```

---

## Final Verification Checklist

Run after all cleanup:

- [ ] `npm run build` succeeds (no TypeScript errors)
- [ ] `npm run lint` passes (no ESLint errors)
- [ ] `npm run test` passes (unit tests)
- [ ] `npm run test:e2e` passes (E2E tests)
- [ ] Database has no old tables
- [ ] Server starts without errors
- [ ] Frontend loads without console errors
- [ ] Registration flow works end-to-end
- [ ] Profile switching works
- [ ] Consent flow works for minors

---

## Rollback Procedure

If critical issues discovered:

1. Restore database from backup
2. Revert git commits
3. Restart from Phase 2

```powershell
# Restore database
cd scripts/database
.\restore-database.ps1 -backup "backups/pre-migration.sql"

# Revert code
git checkout main
```

---

## Success Criteria

All items marked ☐ must become ✅ before considering cleanup complete.

**Final Count**:
- Category 1: 9 items
- Category 2: 4 items
- Category 3: 7 items
- Category 4: 3 items
- Category 5: 3 items
- Category 6: 4 items
- Category 7: 6 items
- Category 8: 15+ items
- Category 9: 8+ items
- Category 10: 3 items

**Total: 62+ cleanup items**

---

## Post-Cleanup Documentation

After cleanup, update:
- [ ] README.md (project structure)
- [ ] docs/specs/functional/README.md (new phase structure)
- [ ] claude.md (if exists, update conventions)
- [ ] package.json scripts (if any changed)
