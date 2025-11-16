# COPPA Database Migration - Deployment Instructions

**Status:** Ready to Deploy
**Date:** 2025-11-16

---

## Quick Start (Choose One Method)

### Method 1: Automated Script (Easiest)

```bash
# Make script executable
chmod +x deploy-coppa-migration.sh

# Run it
./deploy-coppa-migration.sh
```

This will:
- ✅ Check for .env file
- ✅ Run the migration
- ✅ Verify tables were created
- ✅ Show row counts

---

### Method 2: Node.js Migration Runner

```bash
# From project root
node scripts/database/run-migration.js scripts/database/migrations/create-coppa-compliance-tables.sql
```

---

### Method 3: Direct MySQL Import

```bash
# If you have mysql client installed
mysql -h sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com \
      -u sgsgita_alumni_user \
      -p \
      sgsgita_alumni \
      < scripts/database/migrations/create-coppa-compliance-tables.sql

# Enter password when prompted: 2FvT6j06sfI
```

---

## Verify Tables Were Created

After running migration, verify:

```sql
-- Connect to your database
mysql -h sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com \
      -u sgsgita_alumni_user \
      -p sgsgita_alumni

-- Check tables exist
SHOW TABLES LIKE 'PARENT_CONSENT%';
SHOW TABLES LIKE 'AGE_VERIFICATION%';

-- Check structure
DESCRIBE PARENT_CONSENT_RECORDS;
DESCRIBE AGE_VERIFICATION_AUDIT;

-- Check data migration
SELECT COUNT(*) FROM PARENT_CONSENT_RECORDS;
SELECT COUNT(*) FROM AGE_VERIFICATION_AUDIT;

-- View sample data
SELECT * FROM PARENT_CONSENT_RECORDS LIMIT 5;
```

---

## Expected Results

### PARENT_CONSENT_RECORDS Table

```
+---------------------------+--------------+------+-----+---------+-------+
| Field                     | Type         | Null | Key | Default | Extra |
+---------------------------+--------------+------+-----+---------+-------+
| id                        | char(36)     | NO   | PRI | NULL    |       |
| family_member_id          | char(36)     | NO   | MUL | NULL    |       |
| parent_email              | varchar(255) | NO   | MUL | NULL    |       |
| parent_user_id            | bigint       | YES  | MUL | NULL    |       |
| consent_token             | varchar(255) | NO   | UNI | NULL    |       |
| consent_given             | tinyint(1)   | YES  |     | 0       |       |
| consent_timestamp         | timestamp    | YES  |     | NULL    |       |
| consent_ip_address        | varchar(45)  | YES  |     | NULL    |       |
| consent_user_agent        | text         | YES  |     | NULL    |       |
| digital_signature         | text         | YES  |     | NULL    |       |
| terms_accepted            | tinyint(1)   | YES  |     | 0       |       |
| terms_version             | varchar(50)  | YES  |     | NULL    |       |
| verification_method       | enum(...)    | YES  |     | email_otp|      |
| revoked_at                | timestamp    | YES  |     | NULL    |       |
| revoked_reason            | text         | YES  |     | NULL    |       |
| revoked_by                | bigint       | YES  | MUL | NULL    |       |
| expires_at                | timestamp    | NO   | MUL | NULL    |       |
| renewal_reminder_sent     | tinyint(1)   | YES  |     | 0       |       |
| is_active                 | tinyint(1)   | YES  | MUL | 1       |       |
| created_at                | timestamp    | YES  |     | CURRENT_TIMESTAMP |  |
| updated_at                | timestamp    | YES  |     | CURRENT_TIMESTAMP |  |
+---------------------------+--------------+------+-----+---------+-------+
```

### AGE_VERIFICATION_AUDIT Table

```
+------------------+--------------+------+-----+---------+-------+
| Field            | Type         | Null | Key | Default | Extra |
+------------------+--------------+------+-----+---------+-------+
| id               | char(36)     | NO   | PRI | NULL    |       |
| family_member_id | char(36)     | NO   | MUL | NULL    |       |
| check_timestamp  | timestamp    | YES  | MUL | CURRENT_TIMESTAMP | |
| age_at_check     | int          | NO   | MUL | NULL    |       |
| birth_date       | date         | NO   |     | NULL    |       |
| action_taken     | enum(...)    | NO   | MUL | NULL    |       |
| check_context    | enum(...)    | YES  | MUL | api_request |   |
| ip_address       | varchar(45)  | YES  |     | NULL    |       |
| user_agent       | text         | YES  |     | NULL    |       |
| endpoint         | varchar(255) | YES  |     | NULL    |       |
| notes            | text         | YES  |     | NULL    |       |
+------------------+--------------+------+-----+---------+-------+
```

---

## Data Migration

The migration script automatically migrates existing consent data from `FAMILY_MEMBERS` to `PARENT_CONSENT_RECORDS`. Check if any records were migrated:

```sql
SELECT
    fm.first_name,
    fm.last_name,
    fm.current_age,
    pcr.consent_given,
    pcr.consent_timestamp,
    pcr.expires_at
FROM FAMILY_MEMBERS fm
LEFT JOIN PARENT_CONSENT_RECORDS pcr ON fm.id = pcr.family_member_id
WHERE fm.requires_parent_consent = TRUE;
```

---

## Troubleshooting

### Error: Connection Refused

```
Error: connect ECONNREFUSED
```

**Solution:** Check database credentials in `.env` file

---

### Error: Table Already Exists

```
Error: Table 'PARENT_CONSENT_RECORDS' already exists
```

**Solution:** Tables already created! Migration was previously run successfully.

To verify, run:
```sql
SHOW TABLES LIKE 'PARENT_CONSENT%';
```

---

### Error: Access Denied

```
Error: Access denied for user
```

**Solution:** Verify database user has CREATE TABLE permissions

---

### Error: Foreign Key Constraint

```
Error: Cannot add foreign key constraint
```

**Solution:** Ensure `FAMILY_MEMBERS` table exists first. Check:
```sql
SHOW TABLES LIKE 'FAMILY_MEMBERS';
```

---

## Post-Deployment Checklist

After successful migration:

- [ ] **Tables Created**
  ```sql
  SHOW TABLES LIKE 'PARENT_CONSENT%';
  SHOW TABLES LIKE 'AGE_VERIFICATION%';
  ```

- [ ] **Data Migrated**
  ```sql
  SELECT COUNT(*) FROM PARENT_CONSENT_RECORDS;
  ```

- [ ] **Indexes Created**
  ```sql
  SHOW INDEX FROM PARENT_CONSENT_RECORDS;
  SHOW INDEX FROM AGE_VERIFICATION_AUDIT;
  ```

- [ ] **Foreign Keys Valid**
  ```sql
  SELECT CONSTRAINT_NAME, TABLE_NAME, REFERENCED_TABLE_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_NAME IN ('PARENT_CONSENT_RECORDS', 'AGE_VERIFICATION_AUDIT')
  AND REFERENCED_TABLE_NAME IS NOT NULL;
  ```

- [ ] **Start Server**
  ```bash
  npm start
  ```

- [ ] **Run Tests**
  Follow guide: `docs/COPPA_TESTING_GUIDE.md`

---

## What Happens During Migration?

1. **Creates PARENT_CONSENT_RECORDS Table**
   - Stores all parental consent records
   - Supports digital signatures
   - Tracks revocations
   - Annual renewal tracking

2. **Creates AGE_VERIFICATION_AUDIT Table**
   - Logs all age verification checks
   - Tracks login attempts
   - Records access decisions
   - Compliance reporting

3. **Migrates Existing Data**
   - Copies consent records from FAMILY_MEMBERS
   - Preserves consent timestamps
   - Sets 1-year expiration dates
   - Maintains data integrity

4. **Creates Indexes**
   - Performance optimization
   - Fast lookups by family member
   - Efficient expiration queries

---

## Next Steps After Deployment

1. ✅ **Verify Migration**
   - Run verification queries above
   - Check data migrated correctly

2. ✅ **Start Server**
   ```bash
   npm start
   ```

3. ✅ **Test APIs**
   - Follow `docs/COPPA_TESTING_GUIDE.md`
   - Test login with family accounts
   - Test consent grant/revoke
   - Verify audit trail

4. ✅ **Monitor Logs**
   - Check server logs for errors
   - Verify audit trail populating
   - Confirm consent checks working

---

## Rollback (If Needed)

If something goes wrong, you can rollback:

```sql
-- CAUTION: This deletes the tables and all data!
DROP TABLE IF EXISTS AGE_VERIFICATION_AUDIT;
DROP TABLE IF EXISTS PARENT_CONSENT_RECORDS;
```

Then you can re-run the migration.

---

## Support

If you encounter issues:

1. Check server logs for detailed errors
2. Verify database connectivity
3. Review `docs/COPPA_TESTING_GUIDE.md`
4. Check migration script: `scripts/database/migrations/create-coppa-compliance-tables.sql`

---

**Ready to deploy!** Run the migration script when you're ready.
