-- ============================================================================
-- MIGRATION: Multi-Factor OTP Support
-- ============================================================================
-- Task 8.2.2: Add multi-factor OTP support to database schema
-- Adds TOTP secrets table and extends OTP_TOKENS for multi-method support

-- Add multi-factor columns to OTP_TOKENS table
ALTER TABLE OTP_TOKENS
ADD COLUMN otp_method VARCHAR(20) DEFAULT 'email' COMMENT 'OTP method: email, sms, totp',
ADD COLUMN phone_number VARCHAR(20) COMMENT 'Phone number for SMS OTP',
ADD COLUMN totp_secret VARCHAR(32) COMMENT 'TOTP secret (encrypted)',
ADD COLUMN verification_attempts INTEGER DEFAULT 0 COMMENT 'Number of verification attempts',
ADD COLUMN last_verification_attempt TIMESTAMP NULL COMMENT 'Last verification attempt timestamp';

-- Create USER_TOTP_SECRETS table for TOTP authentication
CREATE TABLE USER_TOTP_SECRETS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL COMMENT 'Reference to USERS table',
    secret VARCHAR(32) NOT NULL COMMENT 'Base32 encoded TOTP secret (encrypted)',
    backup_codes TEXT COMMENT 'Encrypted backup recovery codes (JSON array)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,

    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES USERS(id) ON DELETE CASCADE,

    -- Indexes for performance
    INDEX idx_user_totp_secrets_user_id (user_id),
    INDEX idx_user_totp_secrets_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add indexes for the new OTP_TOKENS columns
ALTER TABLE OTP_TOKENS
ADD INDEX idx_otp_tokens_method (otp_method),
ADD INDEX idx_otp_tokens_phone (phone_number),
ADD INDEX idx_otp_tokens_verification_attempts (verification_attempts);

-- ============================================================================
-- DATA MIGRATION
-- ============================================================================

-- Migrate existing OTP tokens to have method = 'email'
UPDATE OTP_TOKENS
SET otp_method = 'email'
WHERE otp_method IS NULL;

-- ============================================================================
-- CLEANUP PROCEDURES (Update existing procedure)
-- ============================================================================

DELIMITER //

-- Update the existing CleanupExpiredTokens procedure to handle TOTP secrets
CREATE OR REPLACE PROCEDURE CleanupExpiredTokens()
BEGIN
    -- Clean up expired OTP tokens
    DELETE FROM OTP_TOKENS WHERE expires_at < NOW();

    -- Clean up inactive TOTP secrets older than 1 year
    DELETE FROM USER_TOTP_SECRETS
    WHERE is_active = FALSE AND created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

    -- Mark expired invitations
    UPDATE USER_INVITATIONS
    SET status = 'expired'
    WHERE expires_at < NOW() AND status = 'pending';

    -- Clean up expired family invitations
    UPDATE FAMILY_INVITATIONS
    SET status = 'expired'
    WHERE expires_at < NOW() AND status IN ('pending', 'partially_accepted');

    -- Clean up old email delivery logs (keep for 30 days)
    DELETE FROM EMAIL_DELIVERY_LOG WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
END //

DELIMITER ;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify the schema changes
SELECT
    'OTP_TOKENS columns' as check_type,
    COUNT(*) as columns_added
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'OTP_TOKENS'
    AND COLUMN_NAME IN ('otp_method', 'phone_number', 'totp_secret', 'verification_attempts', 'last_verification_attempt');

SELECT
    'USER_TOTP_SECRETS table' as check_type,
    COUNT(*) as table_exists
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'USER_TOTP_SECRETS';

-- ============================================================================
-- ROLLBACK SCRIPT (for emergency rollback)
-- ============================================================================

-- ROLLBACK COMMANDS (uncomment and run if needed to rollback this migration):
/*
-- Remove added columns from OTP_TOKENS
ALTER TABLE OTP_TOKENS
DROP COLUMN otp_method,
DROP COLUMN phone_number,
DROP COLUMN totp_secret,
DROP COLUMN verification_attempts,
DROP COLUMN last_verification_attempt;

-- Drop USER_TOTP_SECRETS table
DROP TABLE IF EXISTS USER_TOTP_SECRETS;

-- Remove indexes
ALTER TABLE OTP_TOKENS
DROP INDEX idx_otp_tokens_method,
DROP INDEX idx_otp_tokens_phone,
DROP INDEX idx_otp_tokens_verification_attempts;
*/