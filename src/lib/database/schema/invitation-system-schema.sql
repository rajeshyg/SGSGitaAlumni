-- ============================================================================
-- INVITATION-BASED AUTHENTICATION SYSTEM SCHEMA
-- ============================================================================
-- This schema implements the resolved Phase 7 + Phase 8 authentication system
-- with invitation-based registration, OTP authentication, and family support

-- ============================================================================
-- USER INVITATIONS TABLE
-- ============================================================================
CREATE TABLE USER_INVITATIONS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL,
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    invited_by CHAR(36) NOT NULL,
    invitation_type ENUM('alumni', 'family_member', 'admin') NOT NULL DEFAULT 'alumni',
    invitation_data JSON, -- Graduation info, relationship, etc.
    status ENUM('pending', 'accepted', 'expired', 'revoked') NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    accepted_by CHAR(36) NULL,
    ip_address VARCHAR(45), -- Supports IPv6
    resend_count INT DEFAULT 0,
    last_resent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- HMAC Token Security Fields (Phase 8.2.1)
    token_payload JSON, -- HMAC token payload for validation
    token_signature VARCHAR(64), -- HMAC-SHA256 signature
    token_format VARCHAR(20) DEFAULT 'legacy', -- 'legacy' or 'hmac'

    -- Foreign key constraints
    FOREIGN KEY (invited_by) REFERENCES USERS(id) ON DELETE CASCADE,
    FOREIGN KEY (accepted_by) REFERENCES USERS(id) ON DELETE SET NULL,

    -- Indexes for performance
    INDEX idx_invitation_token (invitation_token),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at),
    INDEX idx_invited_by (invited_by),
    INDEX idx_token_signature (token_signature)
);

-- ============================================================================
-- OTP TOKENS TABLE
-- ============================================================================
CREATE TABLE OTP_TOKENS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(10) NOT NULL, -- 6-digit codes, but allow flexibility
    token_type ENUM('login', 'registration', 'password_reset') NOT NULL,
    user_id CHAR(36) NULL, -- Null for registration OTPs
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    ip_address VARCHAR(45),
    attempt_count INT DEFAULT 0,
    last_attempt_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES USERS(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_email_type (email, token_type),
    INDEX idx_otp_code (otp_code),
    INDEX idx_expires_at (expires_at),
    INDEX idx_user_id (user_id)
);

-- ============================================================================
-- FAMILY INVITATIONS TABLE
-- ============================================================================
CREATE TABLE FAMILY_INVITATIONS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    parent_email VARCHAR(255) NOT NULL,
    children_profiles JSON NOT NULL, -- Array of child profile data
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    status ENUM('pending', 'partially_accepted', 'completed') NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    acceptance_log JSON, -- Track which children have been claimed
    invited_by CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (invited_by) REFERENCES USERS(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_family_token (invitation_token),
    INDEX idx_parent_email (parent_email),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at)
);

-- ============================================================================
-- AGE VERIFICATION TABLE (COPPA Compliance)
-- ============================================================================
CREATE TABLE AGE_VERIFICATION (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    birth_date DATE NOT NULL,
    age_at_registration INT NOT NULL,
    requires_parent_consent BOOLEAN NOT NULL,
    parent_consent_collected BOOLEAN DEFAULT FALSE,
    parent_email VARCHAR(255),
    consent_timestamp TIMESTAMP NULL,
    consent_ip_address VARCHAR(45),
    verification_method ENUM('self_reported', 'document_verified') DEFAULT 'self_reported',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES USERS(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_user_id (user_id),
    INDEX idx_requires_consent (requires_parent_consent),
    INDEX idx_parent_email (parent_email)
);

-- ============================================================================
-- PARENT CONSENT RECORDS TABLE
-- ============================================================================
CREATE TABLE PARENT_CONSENT_RECORDS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    child_user_id CHAR(36) NOT NULL,
    parent_email VARCHAR(255) NOT NULL,
    consent_token VARCHAR(255) UNIQUE NOT NULL,
    consent_given BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMP NULL,
    consent_ip_address VARCHAR(45),
    consent_user_agent TEXT,
    digital_signature TEXT, -- For legal compliance
    expires_at TIMESTAMP NOT NULL, -- Annual renewal required
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (child_user_id) REFERENCES USERS(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_child_user_id (child_user_id),
    INDEX idx_parent_email (parent_email),
    INDEX idx_consent_token (consent_token),
    INDEX idx_expires_at (expires_at)
);

-- ============================================================================
-- MODIFY EXISTING USERS TABLE
-- ============================================================================
-- Add columns to existing USERS table for invitation-based system
ALTER TABLE USERS 
ADD COLUMN invitation_id CHAR(36) NULL,
ADD COLUMN requires_otp BOOLEAN DEFAULT TRUE,
ADD COLUMN last_otp_sent TIMESTAMP NULL,
ADD COLUMN daily_otp_count INT DEFAULT 0,
ADD COLUMN last_otp_reset_date DATE NULL,
ADD COLUMN age_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN parent_consent_required BOOLEAN DEFAULT FALSE,
ADD COLUMN parent_consent_given BOOLEAN DEFAULT FALSE,
ADD FOREIGN KEY (invitation_id) REFERENCES USER_INVITATIONS(id) ON DELETE SET NULL;

-- Add indexes for new columns
ALTER TABLE USERS 
ADD INDEX idx_invitation_id (invitation_id),
ADD INDEX idx_requires_otp (requires_otp),
ADD INDEX idx_age_verified (age_verified),
ADD INDEX idx_parent_consent_required (parent_consent_required);

-- ============================================================================
-- EMAIL DELIVERY TRACKING TABLE
-- ============================================================================
CREATE TABLE EMAIL_DELIVERY_LOG (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email_type ENUM('invitation', 'otp', 'family_invitation', 'parent_consent') NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    template_id VARCHAR(100),
    delivery_status ENUM('pending', 'sent', 'delivered', 'failed', 'bounced') DEFAULT 'pending',
    external_message_id VARCHAR(255), -- From email service provider
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    last_retry_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_email_type (email_type),
    INDEX idx_recipient_email (recipient_email),
    INDEX idx_delivery_status (delivery_status),
    INDEX idx_sent_at (sent_at)
);

-- ============================================================================
-- INVITATION AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE INVITATION_AUDIT_LOG (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    invitation_id CHAR(36),
    action ENUM('created', 'sent', 'resent', 'accepted', 'expired', 'revoked') NOT NULL,
    performed_by CHAR(36),
    ip_address VARCHAR(45),
    user_agent TEXT,
    additional_data JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (invitation_id) REFERENCES USER_INVITATIONS(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES USERS(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_invitation_id (invitation_id),
    INDEX idx_action (action),
    INDEX idx_performed_by (performed_by),
    INDEX idx_timestamp (timestamp)
);

-- ============================================================================
-- CLEANUP PROCEDURES
-- ============================================================================

-- Procedure to clean up expired tokens and invitations
DELIMITER //
CREATE PROCEDURE CleanupExpiredTokens()
BEGIN
    -- Clean up expired OTP tokens
    DELETE FROM OTP_TOKENS WHERE expires_at < NOW();
    
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
-- INITIAL DATA SETUP
-- ============================================================================

-- Create default admin user for sending invitations (if not exists)
INSERT IGNORE INTO USERS (id, email, password_hash, status, user_type, is_email_verified, age_verified)
VALUES (
    UUID(),
    'admin@sgsgitaalumni.org',
    '$2b$12$placeholder_hash_for_initial_admin', -- Should be properly hashed
    'active',
    'individual',
    TRUE,
    TRUE
);

-- Create admin role and assign to admin user
INSERT IGNORE INTO ROLES (id, name, description, is_active)
VALUES (UUID(), 'admin', 'System Administrator', TRUE);

-- Note: Actual role assignment should be done through proper admin interface

-- ============================================================================
-- DATABASE ENCRYPTION COLUMNS (Phase 8.2.4)
-- ============================================================================

-- Add encrypted columns to USER_INVITATIONS
ALTER TABLE USER_INVITATIONS
ADD COLUMN invitation_token_encrypted JSONB,
ADD COLUMN email_encrypted JSONB,
ADD COLUMN ip_address_encrypted JSONB,
ADD COLUMN invitation_data_encrypted JSONB;

-- Add encrypted columns to OTP_TOKENS
ALTER TABLE OTP_TOKENS
ADD COLUMN otp_code_encrypted JSONB,
ADD COLUMN ip_address_encrypted JSONB;

-- Add encrypted columns to FAMILY_INVITATIONS
ALTER TABLE FAMILY_INVITATIONS
ADD COLUMN parent_email_encrypted JSONB,
ADD COLUMN children_profiles_encrypted JSONB;

-- Add encrypted columns to AGE_VERIFICATION (for parent email)
ALTER TABLE AGE_VERIFICATION
ADD COLUMN parent_email_encrypted JSONB;

-- Add encrypted columns to PARENT_CONSENT_RECORDS
ALTER TABLE PARENT_CONSENT_RECORDS
ADD COLUMN parent_email_encrypted JSONB,
ADD COLUMN consent_ip_address_encrypted JSONB;

-- Add encrypted columns to INVITATION_AUDIT_LOG (for IP address)
ALTER TABLE INVITATION_AUDIT_LOG
ADD COLUMN ip_address_encrypted JSONB;
