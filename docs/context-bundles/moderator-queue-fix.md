# Moderator Queue 500 Error Fix

## Context
The moderator queue endpoint (`GET /api/moderation/queue`) is failing with a `500 Internal Server Error` and the message `SERVER_DATABASE_ERROR`.

### Error Details
- **Endpoint:** `GET /api/moderation/queue`
- **Status:** 500
- **Error Code:** `SERVER_DATABASE_ERROR`
- **Message:** "Database operation failed: fetch moderation queue postings"
- **Location:** `server/routes/moderation-new.js`

### Root Cause Analysis
Upon inspection of `server/routes/moderation-new.js`, the SQL query for fetching the queue contains incorrect JOIN logic:

```sql
FROM POSTINGS p
INNER JOIN accounts a ON p.author_id = a.id
```

The `POSTINGS.author_id` column references a **User Profile ID** (from `user_profiles` table), not an **Account ID**. This incorrect join likely causes the query to fail or return unexpected results, leading to the application error.

Additionally, the subquery for `submitter_rejection_count` relies on this incorrect relationship:
```sql
WHERE p2.author_id = a.id
```

## Next Steps

1.  **Correct the SQL Joins**:
    - Update `server/routes/moderation-new.js` to join `POSTINGS` -> `USER_PROFILES` -> `ACCOUNTS`.
    - Ensure all selected fields (submitter email, name, etc.) are pulled from the correct tables (names from `alumni_members` via `user_profiles`, email from `accounts`).

2.  **Verify Column Names**:
    - Ensure all referenced columns (`moderation_status`, `content`, etc.) exist and are correctly named.

3.  **Test**:
    - Reload the moderation queue to verify the fix.

## Proposed SQL Fix

```sql
SELECT DISTINCT
  p.id,
  p.title,
  p.content as description,
  p.posting_type,
  p.moderation_status,
  p.created_at,
  p.expires_at,
  p.version,
  up.id as submitter_profile_id,
  a.id as submitter_account_id,
  am.first_name,
  am.last_name,
  a.email as submitter_email,
  -- ... (rest of the fields)
FROM POSTINGS p
INNER JOIN user_profiles up ON p.author_id = up.id
INNER JOIN accounts a ON up.account_id = a.id
LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
-- ...
```

## Update 2: Collation Mismatch and Logging Standardization (2025-12-12)

### Issue
After fixing the JOINs, a new error emerged: `Illegal mix of collations (utf8mb4_unicode_ci,IMPLICIT) and (utf8mb4_0900_ai_ci,IMPLICIT)`.
This occurred because `POSTINGS` table (likely created earlier) uses `utf8mb4_unicode_ci`, while newer tables (`accounts`, `user_profiles`) and converted tables (`POSTING_DOMAINS`) use `utf8mb4_0900_ai_ci`.

### Resolution
1.  **Explicit Collation Casts**: Updated the SQL query to add `COLLATE` clauses to all cross-collation joins:
    - **Status Filter:** `p.moderation_status COLLATE utf8mb4_0900_ai_ci = ?`
    - **Author Join:** `p.author_id COLLATE utf8mb4_0900_ai_ci = up.id`
    - **Domains Subquery:** `pd.posting_id = p.id COLLATE utf8mb4_0900_ai_ci`
    - **Rejection History:** `p2.author_id COLLATE utf8mb4_0900_ai_ci = up.id`
    - **Internal Joins:** Explicitly handled `MODERATION_HISTORY` joins to avoid ambiguity.

2.  **Standardized Logging**: Replaced `console.log` and `console.error` with the centralized `logger` utility (`utils/logger.js`) as per `docs/context-bundles/logging-refactor.md`.
    - Used `logger.debug` for verbose query parameters and tracing.
    - Used `logger.info` for significant events (notifications).
    - Used `logger.error` for exception handling.

### Modified Files
- `server/routes/moderation-new.js`