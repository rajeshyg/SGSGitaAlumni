-- Migration: Create accounts table
-- Date: 2025-12-07
-- Purpose: Authentication table (replaces app_users)
-- Part of: Registration & Onboarding feature

CREATE TABLE IF NOT EXISTS accounts (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Email (unique authentication identifier)
    email VARCHAR(255) NOT NULL UNIQUE,
    
    -- Authentication
    password_hash VARCHAR(255) NULL,
    role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
    
    -- Status lifecycle
    status ENUM('pending', 'active', 'suspended', 'deleted') DEFAULT 'pending',
    
    -- Email verification
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP NULL,
    
    -- OTP tracking (for rate limiting)
    requires_otp BOOLEAN DEFAULT TRUE,
    last_otp_sent TIMESTAMP NULL,
    daily_otp_count INT DEFAULT 0,
    last_otp_reset_date DATE NULL,
    
    -- Login tracking
    last_login_at TIMESTAMP NULL,
    login_count INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify table created
DESCRIBE accounts;
