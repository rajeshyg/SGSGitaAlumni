-- ============================================================================
-- DATABASE ENCRYPTION MIGRATION SCRIPT (Phase 8.2.4)
-- ============================================================================
-- This script migrates existing data to encrypted format
-- Run this after deploying encryption service

BEGIN;

-- Create temporary tables for backup
CREATE TABLE user_invitations_backup AS
SELECT * FROM user_invitations;

CREATE TABLE otp_tokens_backup AS
SELECT * FROM otp_tokens;

CREATE TABLE family_invitations_backup AS
SELECT * FROM family_invitations;

-- Migrate USER_INVITATIONS data
-- Note: Actual encryption is done via application code using DataMigrationService
-- This script assumes encrypted data has been populated by the migration service

-- Verify migration by checking encrypted columns are populated
SELECT
  COUNT(*) as total_records,
  COUNT(invitation_token_encrypted) as encrypted_tokens,
  COUNT(email_encrypted) as encrypted_emails,
  COUNT(ip_address_encrypted) as encrypted_ips
FROM user_invitations;

-- Migrate OTP_TOKENS data
SELECT
  COUNT(*) as total_records,
  COUNT(otp_code_encrypted) as encrypted_otps,
  COUNT(ip_address_encrypted) as encrypted_ips
FROM otp_tokens;

-- Migrate FAMILY_INVITATIONS data
SELECT
  COUNT(*) as total_records,
  COUNT(parent_email_encrypted) as encrypted_emails,
  COUNT(children_profiles_encrypted) as encrypted_profiles
FROM family_invitations;

-- Update schema to make encrypted columns NOT NULL after migration verification
-- (Run this manually after verifying migration)

-- ALTER TABLE user_invitations
-- MODIFY COLUMN invitation_token_encrypted JSONB NOT NULL,
-- MODIFY COLUMN email_encrypted JSONB NOT NULL;

-- ALTER TABLE otp_tokens
-- MODIFY COLUMN otp_code_encrypted JSONB NOT NULL;

-- ALTER TABLE family_invitations
-- MODIFY COLUMN parent_email_encrypted JSONB NOT NULL,
-- MODIFY COLUMN children_profiles_encrypted JSONB NOT NULL;

-- Clean up old plain text columns after verification
-- (Run this manually after thorough testing)

-- ALTER TABLE user_invitations
-- DROP COLUMN invitation_token,
-- DROP COLUMN email,
-- DROP COLUMN ip_address,
-- DROP COLUMN invitation_data;

-- ALTER TABLE otp_tokens
-- DROP COLUMN otp_code,
-- DROP COLUMN ip_address;

-- ALTER TABLE family_invitations
-- DROP COLUMN parent_email,
-- DROP COLUMN children_profiles;

COMMIT;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

-- ROLLBACK;
-- DROP TABLE user_invitations_backup;
-- DROP TABLE otp_tokens_backup;
-- DROP TABLE family_invitations_backup;