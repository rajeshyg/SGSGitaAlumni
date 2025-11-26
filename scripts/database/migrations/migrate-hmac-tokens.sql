-- ============================================================================
-- MIGRATION: HMAC Token Implementation (Phase 8.2.1)
-- ============================================================================
-- This script migrates existing USER_INVITATIONS from legacy tokens to HMAC-SHA256 signed tokens
-- Run this after deploying the HMACTokenService and TokenSecretManager

-- Start transaction for safety
START TRANSACTION;

-- Create backup table for safety
CREATE TABLE IF NOT EXISTS USER_INVITATIONS_BACKUP AS
SELECT * FROM USER_INVITATIONS;

-- Add new HMAC token columns if they don't exist
-- (These should already be added by the schema update, but including for safety)
ALTER TABLE USER_INVITATIONS
ADD COLUMN IF NOT EXISTS token_payload JSON,
ADD COLUMN IF NOT EXISTS token_signature VARCHAR(64),
ADD COLUMN IF NOT EXISTS token_format VARCHAR(20) DEFAULT 'legacy';

-- Add index for token signature if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_invitations_token_signature
ON USER_INVITATIONS(token_signature);

-- Update existing records to use HMAC tokens
-- Note: This would typically be done by the application code using HMACTokenService
-- For this migration, we'll mark all existing tokens as 'legacy' format
-- The application will migrate them to HMAC format on first use

UPDATE USER_INVITATIONS
SET token_format = 'legacy'
WHERE token_format = 'legacy' OR token_format IS NULL;

-- Log the migration
INSERT INTO INVITATION_AUDIT_LOG (
    id,
    invitation_id,
    action,
    performed_by,
    ip_address,
    user_agent,
    additional_data,
    timestamp
) SELECT
    UUID(),
    ui.id,
    'token_format_migrated',
    'system',
    'migration_script',
    'HMAC Token Migration Script',
    JSON_OBJECT('old_format', 'plain', 'new_format', 'legacy', 'migration_version', '8.2.1'),
    NOW()
FROM USER_INVITATIONS ui
WHERE ui.token_format = 'legacy';

-- Verify the migration
SELECT
    COUNT(*) as total_invitations,
    SUM(CASE WHEN token_format = 'legacy' THEN 1 ELSE 0 END) as legacy_tokens,
    SUM(CASE WHEN token_format = 'hmac' THEN 1 ELSE 0 END) as hmac_tokens
FROM USER_INVITATIONS;

-- Commit the transaction
COMMIT;

-- ============================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- ============================================================================

-- Check that all invitations have token_format set
SELECT COUNT(*) as invitations_without_format
FROM USER_INVITATIONS
WHERE token_format IS NULL;

-- Check token format distribution
SELECT token_format, COUNT(*) as count
FROM USER_INVITATIONS
GROUP BY token_format;

-- Check that indexes were created
SHOW INDEX FROM USER_INVITATIONS WHERE Column_name = 'token_signature';

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

-- Uncomment the following lines if rollback is needed:
-- START TRANSACTION;
-- DROP INDEX IF EXISTS idx_user_invitations_token_signature ON USER_INVITATIONS;
-- ALTER TABLE USER_INVITATIONS DROP COLUMN IF EXISTS token_payload;
-- ALTER TABLE USER_INVITATIONS DROP COLUMN IF EXISTS token_signature;
-- ALTER TABLE USER_INVITATIONS DROP COLUMN IF EXISTS token_format;
-- DROP TABLE IF EXISTS USER_INVITATIONS_BACKUP;
-- COMMIT;