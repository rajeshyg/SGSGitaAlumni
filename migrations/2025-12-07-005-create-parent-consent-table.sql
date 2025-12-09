-- Migration: Create PARENT_CONSENT_RECORDS table
-- Date: 2025-12-07
-- Purpose: Audit trail for parental consent (COPPA compliance)
-- Part of: Registration & Onboarding feature

CREATE TABLE IF NOT EXISTS PARENT_CONSENT_RECORDS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Foreign keys
    parent_profile_id CHAR(36) NOT NULL,
    child_profile_id CHAR(36) NOT NULL,
    
    -- Consent action
    consent_type ENUM('parental_consent', 'parental_revocation') NOT NULL,
    
    -- Consent lifecycle
    consent_given_at TIMESTAMP NOT NULL,
    consent_expires_at TIMESTAMP NOT NULL COMMENT '1 year from consent_given_at',
    status ENUM('active', 'withdrawn', 'expired') NOT NULL DEFAULT 'active',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_pcrec_parent 
        FOREIGN KEY (parent_profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_pcrec_child 
        FOREIGN KEY (child_profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_parent_profile (parent_profile_id),
    INDEX idx_child_profile (child_profile_id),
    INDEX idx_status (status),
    INDEX idx_consent_given_at (consent_given_at),
    INDEX idx_expires_at (consent_expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify table created
DESCRIBE PARENT_CONSENT_RECORDS;
