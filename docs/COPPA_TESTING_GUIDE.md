# COPPA Compliance Testing Guide

**Created:** 2025-11-16
**Branch:** claude/plan-feature-requirements-01DXTJWiGCygmXyYsn8bfvTZ

---

## Prerequisites

### 1. Database Migration (REQUIRED FIRST!)

Run the migration to create the new tables:

```bash
# From project root
node scripts/database/run-migration.js scripts/database/migrations/create-coppa-compliance-tables.sql
```

**Verify tables were created:**
```sql
-- Connect to your database and run:
SHOW TABLES LIKE 'PARENT_CONSENT%';
SHOW TABLES LIKE 'AGE_VERIFICATION%';

-- Check PARENT_CONSENT_RECORDS structure
DESCRIBE PARENT_CONSENT_RECORDS;

-- Check AGE_VERIFICATION_AUDIT structure
DESCRIBE AGE_VERIFICATION_AUDIT;

-- Check data migration worked
SELECT COUNT(*) FROM PARENT_CONSENT_RECORDS;
```

### 2. Start the Server

```bash
# Backend (if not already running)
npm start
# or
node server.js

# Frontend (if not already running)
npm run dev
```

---

## Test Scenarios

### Test 1: Login with Family Account (Age 18+)

**Expected:** Login succeeds, JWT contains `activeFamilyMemberId`

```bash
# API Test
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "parent@example.com",
  "password": "your-password"
}
```

**Check Response:**
```json
{
  "success": true,
  "token": "eyJhbGc...",  // Decode this JWT - should have activeFamilyMemberId
  "user": {
    "primary_family_member_id": "uuid-here"
  }
}
```

**Decode JWT at https://jwt.io** - should see:
```json
{
  "userId": "...",
  "email": "...",
  "role": "member",
  "activeFamilyMemberId": "uuid-here",
  "isFamilyAccount": true
}
```

---

### Test 2: Login Blocked - Underage (< 14 years)

**Setup:**
1. Create a family member with birth_date making them < 14 years old
2. Set `can_access_platform = false`

**Expected:** Login blocked with COPPA message

```bash
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "parent@example.com",
  "password": "password"
}
```

**Expected Response:**
```json
{
  "error": "Platform access is restricted to users 14 years and older (COPPA compliance). Please contact your parent or guardian."
}
```

**Verify Audit Log:**
```sql
SELECT * FROM AGE_VERIFICATION_AUDIT
WHERE action_taken = 'blocked_underage'
ORDER BY check_timestamp DESC
LIMIT 5;
```

---

### Test 3: Login Blocked - No Parental Consent (14-17 years)

**Setup:**
1. Family member aged 14-17
2. `requires_parent_consent = true`
3. `parent_consent_given = false`

**Expected:** Login blocked with consent message

**Expected Response:**
```json
{
  "error": "Parental consent is required for platform access. Please ask your parent or guardian to grant consent through the Family Settings."
}
```

**Verify Audit Log:**
```sql
SELECT * FROM AGE_VERIFICATION_AUDIT
WHERE action_taken = 'blocked_no_consent'
ORDER BY check_timestamp DESC
LIMIT 5;
```

---

### Test 4: Grant Parental Consent

**Expected:** Creates record in PARENT_CONSENT_RECORDS

```bash
POST http://localhost:3001/api/family-members/{familyMemberId}/consent/grant
Authorization: Bearer {your-jwt-token}
Content-Type: application/json

{
  "digitalSignature": "data:image/png;base64,iVBORw0KG...",
  "termsAccepted": true,
  "termsVersion": "1.0"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "parent_consent_given": true,
    "can_access_platform": true
  },
  "message": "Consent granted successfully"
}
```

**Verify Database:**
```sql
-- Check PARENT_CONSENT_RECORDS
SELECT * FROM PARENT_CONSENT_RECORDS
WHERE family_member_id = '{familyMemberId}';

-- Check FAMILY_MEMBERS updated
SELECT parent_consent_given, can_access_platform
FROM FAMILY_MEMBERS
WHERE id = '{familyMemberId}';
```

---

### Test 5: Login After Consent Granted

**Expected:** Login succeeds, audit log shows 'allowed_supervised'

**After granting consent, try login again:**
```bash
POST http://localhost:3001/api/auth/login
# Same credentials as Test 3
```

**Expected:** Success with JWT

**Verify Audit Log:**
```sql
SELECT * FROM AGE_VERIFICATION_AUDIT
WHERE action_taken = 'allowed_supervised'
ORDER BY check_timestamp DESC
LIMIT 5;
```

---

### Test 6: Consent Expiration Check

**Test expired consent (annual renewal):**

**Manually expire a consent record:**
```sql
UPDATE PARENT_CONSENT_RECORDS
SET expires_at = DATE_SUB(NOW(), INTERVAL 1 DAY)
WHERE family_member_id = '{familyMemberId}';
```

**Try to login:**
```bash
POST http://localhost:3001/api/auth/login
```

**Expected Response:**
```json
{
  "error": "Parental consent has expired and requires annual renewal. Please ask your parent or guardian to renew consent through the Family Settings."
}
```

**Verify Audit Log:**
```sql
SELECT * FROM AGE_VERIFICATION_AUDIT
WHERE action_taken = 'consent_expired'
ORDER BY check_timestamp DESC
LIMIT 5;
```

---

### Test 7: Check Consent Renewal Status

**API Test:**
```bash
GET http://localhost:3001/api/family-members/{familyMemberId}/consent/check
Authorization: Bearer {your-jwt-token}
```

**Expected Response (Valid Consent):**
```json
{
  "success": true,
  "data": {
    "needsRenewal": false,
    "expiresAt": "2025-11-16T00:00:00.000Z",
    "message": "Consent is active and valid"
  }
}
```

**Expected Response (Expiring Soon - < 30 days):**
```json
{
  "success": true,
  "data": {
    "needsRenewal": false,
    "expiringSoon": true,
    "daysRemaining": 25,
    "message": "Consent expires on ..."
  }
}
```

**Expected Response (Expired):**
```json
{
  "success": true,
  "data": {
    "needsRenewal": true,
    "reason": "expired",
    "message": "Consent expired on ..."
  }
}
```

---

### Test 8: Revoke Parental Consent

**API Test:**
```bash
POST http://localhost:3001/api/family-members/{familyMemberId}/consent/revoke
Authorization: Bearer {your-jwt-token}
Content-Type: application/json

{
  "reason": "Parent requested revocation"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "parent_consent_given": false,
    "can_access_platform": false
  },
  "message": "Consent revoked successfully"
}
```

**Verify Database:**
```sql
-- PARENT_CONSENT_RECORDS should be inactive
SELECT is_active, revoked_at, revoked_reason
FROM PARENT_CONSENT_RECORDS
WHERE family_member_id = '{familyMemberId}';

-- FAMILY_MEMBERS updated
SELECT parent_consent_given, can_access_platform
FROM FAMILY_MEMBERS
WHERE id = '{familyMemberId}';
```

---

### Test 9: Consent History (Audit Trail)

**API Test:**
```bash
GET http://localhost:3001/api/family-members/{familyMemberId}/consent-history
Authorization: Bearer {your-jwt-token}
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "consent_given": false,
      "consent_timestamp": null,
      "revoked_at": "2025-11-16T...",
      "revoked_reason": "Parent requested revocation",
      "is_active": false,
      "created_at": "2025-11-15T..."
    },
    {
      "id": "uuid",
      "consent_given": true,
      "consent_timestamp": "2025-11-15T...",
      "digital_signature": "data:image/png...",
      "terms_accepted": true,
      "terms_version": "1.0",
      "expires_at": "2026-11-15T...",
      "is_active": true,
      "created_at": "2025-11-15T..."
    }
  ]
}
```

---

### Test 10: Profile Switching (JWT Update)

**API Test:**
```bash
POST http://localhost:3001/api/family-members/{differentFamilyMemberId}/switch
Authorization: Bearer {your-jwt-token}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "different-member-id",
    "first_name": "...",
    "access_level": "full"
  },
  "token": "new-jwt-with-updated-family-member-id",
  "message": "Profile switched successfully"
}
```

**Decode new JWT** - should have updated `activeFamilyMemberId`

---

### Test 11: Age-Based Middleware Protection

**Test protecting an endpoint:**

Add middleware to any route:
```javascript
// Example: Protect a posting endpoint
router.post('/api/postings',
  authenticateToken,
  requirePlatformAccess(),  // ← Add this
  createPosting
);
```

**Test with user lacking access:**
```bash
POST http://localhost:3001/api/postings
Authorization: Bearer {jwt-for-user-without-access}

# Expected: 403 Forbidden
```

**Expected Response:**
```json
{
  "error": "Platform access has been restricted for this account."
}
```

---

## Database Verification Queries

### Check All Consent Records
```sql
SELECT
  fm.first_name,
  fm.last_name,
  fm.current_age,
  pcr.consent_given,
  pcr.consent_timestamp,
  pcr.expires_at,
  pcr.is_active,
  pcr.revoked_at
FROM FAMILY_MEMBERS fm
LEFT JOIN PARENT_CONSENT_RECORDS pcr ON fm.id = pcr.family_member_id
WHERE fm.requires_parent_consent = TRUE
ORDER BY pcr.created_at DESC;
```

### Check Audit Trail
```sql
SELECT
  fm.first_name,
  fm.last_name,
  ava.age_at_check,
  ava.action_taken,
  ava.check_context,
  ava.check_timestamp,
  ava.notes
FROM AGE_VERIFICATION_AUDIT ava
JOIN FAMILY_MEMBERS fm ON ava.family_member_id = fm.id
ORDER BY ava.check_timestamp DESC
LIMIT 50;
```

### Count Audit Actions
```sql
SELECT
  action_taken,
  COUNT(*) as count
FROM AGE_VERIFICATION_AUDIT
GROUP BY action_taken
ORDER BY count DESC;
```

---

## Success Criteria

✅ **Login Flow:**
- [ ] Family account login includes `activeFamilyMemberId` in JWT
- [ ] Underage users (<14) are blocked at login
- [ ] Users 14-17 without consent are blocked
- [ ] Users with expired consent are blocked
- [ ] All blocks logged to AGE_VERIFICATION_AUDIT

✅ **Consent Management:**
- [ ] Consent grant creates PARENT_CONSENT_RECORDS entry
- [ ] Digital signature stored correctly
- [ ] Expiration set to 1 year from now
- [ ] Consent revocation marks record inactive
- [ ] Revocation reason stored

✅ **Audit Trail:**
- [ ] All login attempts logged
- [ ] Consent history API returns all records
- [ ] IP address and user agent captured
- [ ] Timestamps accurate

✅ **Session Management:**
- [ ] JWT contains family member context
- [ ] Profile switching generates new JWT
- [ ] Token refresh maintains family context
- [ ] authenticateToken populates req.familyMember

---

## Troubleshooting

### Migration Fails
```bash
# Check if tables already exist
SHOW TABLES LIKE 'PARENT_CONSENT%';

# If exists, drop and recreate (DEV ONLY!)
DROP TABLE IF EXISTS AGE_VERIFICATION_AUDIT;
DROP TABLE IF EXISTS PARENT_CONSENT_RECORDS;

# Then run migration again
```

### JWT Doesn't Have Family Context
- Check login endpoint returns new token structure
- Verify JWT_SECRET in .env
- Decode JWT at https://jwt.io to inspect payload

### Consent Not Blocking Login
- Check FAMILY_MEMBERS.can_access_platform value
- Verify PARENT_CONSENT_RECORDS has active record
- Check if expires_at is in the future

### Audit Log Empty
- Tables might not exist (run migration)
- Check async .execute() isn't throwing errors silently
- Look for errors in server logs

---

## Next Steps After Testing

Once all tests pass:

1. **UI Integration** - Update frontend to handle consent errors
2. **Digital Signatures** - Implement signature capture component
3. **Cron Jobs** - Add automated age verification
4. **Notifications** - Email parents when consent expires

---

**Any issues? Check server logs for detailed error messages!**
