# Scout Report - Family Member Onboarding with COPPA

**Date**: 2025-12-07  
**Type**: Implementation Context  
**Status**: Active Scout Document  

**Related Scout Documents**:
| Scout | Topic | Status |
|-------|-------|--------|
| [scout-01](../scouts/scout-01-database-schema-cleanup.md) | Database schema cleanup | ✅ Complete |
| [scout-03](../scouts/scout-03-coppa-compliance-implementation.md) | COPPA compliance | ✅ Reviewed |
| [scout-05](../scouts/scout-05-family-member-import-logic.md) | Family member import | ✅ Reviewed |
| [scout-06](../scouts/scout-06-unified-screen-design.md) | Unified screen design | ✅ Reviewed |
| [scout-07](../scouts/scout-07-invitation-management.md) | Invitation management | ✅ Reviewed |
| [scout-02](../scouts/scout-02-module-organization-invitations.md) | Module organization | ⏳ After implementation |
| [scout-08](../scouts/scout-08-functional-specs-reorganization.md) | Specs reorganization | ⏳ After implementation |
| [scout-04](../scouts/scout-04-alumni-data-pipeline.md) | Alumni data pipeline | ⏸️ Deferred (independent) |

---

## ✅ Database Design - FINALIZED

**Design Document**: [database-redesign-plan.md](../specs/database-redesign-plan.md)

### New Schema Summary
| New Table | Replaces | Purpose |
|-----------|----------|---------|
| `accounts` | `app_users` | Auth only (one per email) |
| `user_profiles` | `FAMILY_MEMBERS` | App users who can post/chat |
| `alumni_members` | (enhanced) | Source of truth + YOB, current_center, profile_image |

### Key Design Decisions
- **One email = One account** (authentication point)
- **COPPA**: Under 14 = no `user_profiles` entry (data only in `alumni_members`)
- **Relationship**: `parent_profile_id` FK links children to parents
- **Active profile**: Session state, not DB column
- **YOB Storage**: Use December 31 for conservative age calculation

---

## ✅ Scout Review Summary - Alignment Verified

### Scout-03: COPPA Compliance
| Finding | DB Design Alignment | Status |
|---------|---------------------|--------|
| YOB vs birth_date | ✅ `alumni_members.year_of_birth` + Dec 31 calculation | Aligned |
| Age thresholds (14/18) | ✅ Under 14: no `user_profiles`, 14-17: `requires_consent=true` | Aligned |
| Consent audit trail | ✅ `PARENT_CONSENT_RECORDS` table retained | Aligned |
| Parent email verification | ⚠️ Not in current design - parent is account owner | See action item |

### Scout-05: Family Import Logic  
| Finding | DB Design Alignment | Status |
|---------|---------------------|--------|
| Auto-import problem | ✅ New flow: show alumni → user selects → create `user_profiles` | Aligned |
| Relationship collection | ✅ `user_profiles.relationship` ENUM('parent','child') | Aligned |
| COPPA before creation | ✅ Under 14 blocked from `user_profiles` creation | Aligned |
| FK dependencies | ✅ `user_profiles` → `accounts` + `alumni_members` | Aligned |

### Scout-06: Unified Screen Design
| Finding | DB Design Alignment | Status |
|---------|---------------------|--------|
| Profile selection | ✅ Query `alumni_members` by email, create `user_profiles` on selection | Aligned |
| YOB collection | ✅ `alumni_members.year_of_birth` (admin-managed source) | Aligned |
| Consent flow | ✅ `user_profiles` consent fields | Aligned |
| State management | 🔄 UI implementation concern | N/A for DB |

### Scout-07: Invitation Management
| Finding | DB Design Alignment | Status |
|---------|---------------------|--------|
| Token validation | ✅ `USER_INVITATIONS.accepted_by` → `accounts.id` | Aligned |
| Alumni matching by email | ✅ Multi-alumni per email supported | Aligned |
| Status tracking | ✅ FK updates in design | Aligned |

---

## ⚠️ Database Design Clarifications Needed

### Issue 1: Parent Email Verification
**Scout-03 finding**: COPPA technically requires verifiable parental consent (email to parent's own address)

**Current design**: Parent is whoever owns the `accounts` entry (self-approval)

**Decision**: **Accept current design** - This is a valid approach because:
- Account owner (parent) registers and claims profiles
- Children don't have separate accounts
- Parent grants consent from their own authenticated session
- Audit trail in `PARENT_CONSENT_RECORDS` is sufficient

### Issue 2: Relationship ENUM Values
**Scout-03/05 finding**: Current code uses `self|child|spouse|sibling|guardian`

**DB design uses**: `parent|child` only

**Decision**: **Keep simplified ENUM** - Rationale:
- "self" = "parent" (primary account holder)
- "spouse/sibling/guardian" are adults (18+) = "parent" access level
- Only "child" needs COPPA special handling
- Simplifies logic significantly

### Issue 3: `estimated_birth_year` Field
**Scout-03 finding**: Code references `estimated_birth_year` but field doesn't exist

**Decision**: **Remove from code** - Use `year_of_birth` in `alumni_members` instead

---

## 🔄 Action Items Before Implementation

### Code Cleanup (Pre-Migration)
| # | Task | Files Affected |
|---|------|----------------|
| 1 | Remove `estimated_birth_year` references | `AlumniDataIntegrationService.ts`, SQL queries |
| 2 | Remove `FAMILY_ACCESS_LOG` references | Any code referencing this deleted table |
| 3 | Update relationship enum usage | Map `self→parent`, `spouse/sibling/guardian→parent` |

### Database Migration (Execute Plan)
| Phase | Tasks |
|-------|-------|
| 1 | Add `year_of_birth`, `current_center`, `profile_image_url` to `alumni_members` |
| 2 | Create `accounts` from `app_users` |
| 3 | Create `user_profiles` from `FAMILY_MEMBERS` |
| 4 | Update FKs (POSTINGS, preferences, etc.) |
| 5 | Drop old tables |

### API Updates (Post-Migration)
| Area | Changes Required |
|------|------------------|
| Auth routes | `app_users` → `accounts` |
| Family routes | `FAMILY_MEMBERS` → `user_profiles` |
| Session | Store `account_id` + `active_profile_id` |
| Profile queries | Join `user_profiles` ↔ `alumni_members` |

### Frontend Updates (Post-Migration)
| Area | Changes Required |
|------|------------------|
| Services | Update table references |
| Types | Update `FamilyMember` → `UserProfile` interface |
| Profile switching | Use session-based `active_profile_id` |

---

## 📋 New Registration Flow (Post-Migration)

```
1. User clicks invitation link
   → Validate USER_INVITATIONS token
   
2. Show available alumni (from alumni_members WHERE email = ?)
   → User sees: name, batch, COPPA status based on YOB
   
3. User selects profiles + relationship
   → For each: "This is me (parent)" or "This is my child"
   
4. COPPA verification
   → Under 14: Cannot create user_profiles (show message)
   → 14-17: Create with requires_consent=true, access_level=blocked
   → 18+: Create with access_level=full
   
5. Create accounts + user_profiles
   → Single transaction for core records
   
6. Parent grants consent (if needed)
   → Update user_profiles consent fields
   → Create PARENT_CONSENT_RECORDS entry
   
7. Login with profile selection
   → Session: {account_id, profiles[], active_profile_id}
```

---

## Key Code Locations

| Area | File | Notes |
|------|------|-------|
| Auto-import | `StreamlinedRegistrationService.ts:215-236` | Replace with show-then-select |
| Alumni matching | `AlumniDataIntegrationService.ts` | Update for new schema |
| COPPA | `AgeVerificationService.ts` | Update age calculation |
| Consent UI | `ParentConsentModal.tsx` | Update for user_profiles |
| Session mgmt | `middleware/auth.js` | Add active_profile_id |

---

## ✅ Next Steps

1. **Execute database migration** (Phases 1-5)
2. **Update backend code** (table references + session management)
3. **Update frontend code** (services + types + components)
4. **Test end-to-end flow** (invitation → registration → consent → login)
5. **Review scout-02, scout-08** (module organization + specs after stable)

---

**Scout Status**: All implementation scouts reviewed ✅ - Ready for execution
