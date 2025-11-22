-- ============================================================================
-- COPPA COMPLIANCE TABLES ROLLBACK
-- ============================================================================
-- Created: 2025-11-16
-- Purpose: Rollback PARENT_CONSENT_RECORDS and AGE_VERIFICATION_AUDIT tables
-- WARNING: This will DELETE all consent records and audit logs!
-- Use only if migration needs to be reversed
-- ============================================================================

-- ============================================================================
-- BACKUP DATA BEFORE ROLLBACK
-- ============================================================================
-- Uncomment and run these if you need to backup data first:
-- CREATE TABLE PARENT_CONSENT_RECORDS_BACKUP AS SELECT * FROM PARENT_CONSENT_RECORDS;
-- CREATE TABLE AGE_VERIFICATION_AUDIT_BACKUP AS SELECT * FROM AGE_VERIFICATION_AUDIT;

-- ============================================================================
-- DROP TABLES (Order matters due to foreign key constraints)
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Drop audit table first (no dependencies)
DROP TABLE IF EXISTS AGE_VERIFICATION_AUDIT;
SELECT 'AGE_VERIFICATION_AUDIT table dropped' AS Status;

-- Drop consent records table
DROP TABLE IF EXISTS PARENT_CONSENT_RECORDS;
SELECT 'PARENT_CONSENT_RECORDS table dropped' AS Status;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- VERIFY ROLLBACK
-- ============================================================================
SELECT 'Rollback completed successfully!' AS Status;

-- Check tables are gone
SELECT
    CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = DATABASE()
            AND table_name = 'PARENT_CONSENT_RECORDS'
        ) THEN 'PARENT_CONSENT_RECORDS: ✅ Removed'
        ELSE 'PARENT_CONSENT_RECORDS: ❌ Still exists'
    END AS table_status
UNION ALL
SELECT
    CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = DATABASE()
            AND table_name = 'AGE_VERIFICATION_AUDIT'
        ) THEN 'AGE_VERIFICATION_AUDIT: ✅ Removed'
        ELSE 'AGE_VERIFICATION_AUDIT: ❌ Still exists'
    END AS table_status;
