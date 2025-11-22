-- ============================================================================
-- COPPA COMPLIANCE TABLES MIGRATION
-- ============================================================================
-- Created: 2025-11-16
-- Purpose: Deploy PARENT_CONSENT_RECORDS and AGE_VERIFICATION_AUDIT tables
-- Features: COPPA compliance, digital signatures, audit trail
-- ============================================================================

-- ============================================================================
-- TABLE 1: PARENT_CONSENT_RECORDS
-- ============================================================================
-- Stores verifiable parental consent records for minors (14-17 years old)
-- Supports digital signatures, annual renewal, and complete audit trail
-- ============================================================================

CREATE TABLE IF NOT EXISTS PARENT_CONSENT_RECORDS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    -- Link to family member (child requiring consent)
    family_member_id CHAR(36) NOT NULL COMMENT 'Links to FAMILY_MEMBERS.id',

    -- Parent information
    parent_email VARCHAR(255) NOT NULL COMMENT 'Parent/guardian email address',
    parent_user_id BIGINT NULL COMMENT 'Links to parent app_users.id if parent has account',

    -- Consent verification
    consent_token VARCHAR(255) UNIQUE NOT NULL COMMENT 'Unique token for email verification',
    consent_given BOOLEAN DEFAULT FALSE COMMENT 'Whether consent has been granted',
    consent_timestamp TIMESTAMP NULL COMMENT 'When consent was granted',

    -- Legal compliance fields
    digital_signature TEXT NULL COMMENT 'Base64 encoded signature image for legal proof',
    terms_accepted BOOLEAN DEFAULT FALSE COMMENT 'Parent accepted terms and conditions',
    terms_version VARCHAR(50) NULL COMMENT 'Version of terms accepted (e.g., "1.0", "2024-11-16")',

    -- Verification metadata
    consent_ip_address VARCHAR(45) NULL COMMENT 'IP address when consent granted',
    consent_user_agent TEXT NULL COMMENT 'Browser/device info when consent granted',
    verification_method ENUM('email_otp', 'email_link', 'manual') DEFAULT 'email_otp' COMMENT 'How parent identity was verified',

    -- Revocation tracking
    revoked_at TIMESTAMP NULL COMMENT 'When consent was revoked',
    revoked_reason TEXT NULL COMMENT 'Reason for consent revocation',
    revoked_by BIGINT NULL COMMENT 'User ID who revoked (parent or admin)',

    -- Annual renewal support
    expires_at TIMESTAMP NOT NULL COMMENT 'Consent expiration date (annual renewal required per COPPA)',
    renewal_reminder_sent BOOLEAN DEFAULT FALSE COMMENT 'Whether renewal reminder email was sent',

    -- Status tracking
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether this consent record is currently active',

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign key constraints
    FOREIGN KEY (family_member_id) REFERENCES FAMILY_MEMBERS(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_user_id) REFERENCES app_users(id) ON DELETE SET NULL,
    FOREIGN KEY (revoked_by) REFERENCES app_users(id) ON DELETE SET NULL,

    -- Indexes for performance
    INDEX idx_family_member_id (family_member_id),
    INDEX idx_parent_email (parent_email),
    INDEX idx_parent_user_id (parent_user_id),
    INDEX idx_consent_token (consent_token),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_active (is_active),
    INDEX idx_consent_given (consent_given)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Verifiable parental consent records for COPPA compliance';

-- ============================================================================
-- TABLE 2: AGE_VERIFICATION_AUDIT
-- ============================================================================
-- Audit log of all age verification checks and access control decisions
-- Useful for compliance reporting and security monitoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS AGE_VERIFICATION_AUDIT (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    -- Family member being verified
    family_member_id CHAR(36) NOT NULL COMMENT 'Links to FAMILY_MEMBERS.id',

    -- Verification details
    check_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When verification check occurred',
    age_at_check INT NOT NULL COMMENT 'Calculated age at time of check',
    birth_date DATE NOT NULL COMMENT 'Birth date used for calculation',

    -- Access control decision
    action_taken ENUM(
        'allowed_full',
        'allowed_supervised',
        'blocked_underage',
        'blocked_no_consent',
        'age_recalculated',
        'consent_expired',
        'access_revoked'
    ) NOT NULL COMMENT 'What action was taken based on age/consent status',

    -- Context of the check
    check_context ENUM(
        'login_attempt',
        'api_request',
        'scheduled_verification',
        'birthday_event',
        'manual_check',
        'consent_renewal'
    ) DEFAULT 'api_request' COMMENT 'What triggered this verification',

    -- Request metadata
    ip_address VARCHAR(45) NULL COMMENT 'IP address of request',
    user_agent TEXT NULL COMMENT 'Browser/device info',
    endpoint VARCHAR(255) NULL COMMENT 'API endpoint that triggered check',

    -- Additional context
    notes TEXT NULL COMMENT 'Additional details about the verification',

    -- Foreign key constraints
    FOREIGN KEY (family_member_id) REFERENCES FAMILY_MEMBERS(id) ON DELETE CASCADE,

    -- Indexes for performance
    INDEX idx_family_member_id (family_member_id),
    INDEX idx_check_timestamp (check_timestamp),
    INDEX idx_action_taken (action_taken),
    INDEX idx_check_context (check_context),
    INDEX idx_age_at_check (age_at_check)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit log for age verification and access control decisions';

-- ============================================================================
-- DATA MIGRATION: Sync existing consent data to PARENT_CONSENT_RECORDS
-- ============================================================================
-- Migrate existing consent records from FAMILY_MEMBERS to PARENT_CONSENT_RECORDS
-- Only creates records for family members who already have consent granted
-- ============================================================================

INSERT INTO PARENT_CONSENT_RECORDS (
    id,
    family_member_id,
    parent_email,
    parent_user_id,
    consent_token,
    consent_given,
    consent_timestamp,
    terms_accepted,
    expires_at,
    is_active,
    created_at,
    updated_at
)
SELECT
    UUID() as id,
    fm.id as family_member_id,
    u.email as parent_email,
    fm.parent_user_id as parent_user_id,
    UUID() as consent_token, -- Generate new token
    fm.parent_consent_given as consent_given,
    fm.parent_consent_date as consent_timestamp,
    TRUE as terms_accepted, -- Assume terms accepted for existing consents
    DATE_ADD(COALESCE(fm.parent_consent_date, fm.created_at), INTERVAL 1 YEAR) as expires_at,
    TRUE as is_active,
    fm.created_at,
    fm.updated_at
FROM FAMILY_MEMBERS fm
JOIN app_users u ON fm.parent_user_id = u.id
WHERE fm.requires_parent_consent = TRUE
  AND fm.parent_consent_given = TRUE
  -- Only migrate if not already exists
  AND NOT EXISTS (
      SELECT 1 FROM PARENT_CONSENT_RECORDS pcr
      WHERE pcr.family_member_id = fm.id
  );

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'COPPA compliance tables created successfully!' AS Status;
SELECT COUNT(*) as existing_consent_records FROM PARENT_CONSENT_RECORDS;
SELECT COUNT(*) as audit_trail_entries FROM AGE_VERIFICATION_AUDIT;
