-- Simplified invitation tables for existing USERS table (id is int, not CHAR(36))

-- USER INVITATIONS TABLE
CREATE TABLE USER_INVITATIONS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL,
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    invited_by INT NOT NULL, -- Changed to INT to match USERS.id
    invitation_type ENUM('alumni', 'family_member', 'admin') NOT NULL DEFAULT 'alumni',
    invitation_data JSON,
    status ENUM('pending', 'accepted', 'expired', 'revoked') NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    accepted_by INT NULL, -- Changed to INT to match USERS.id
    ip_address VARCHAR(45),
    resend_count INT DEFAULT 0,
    last_resent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes for performance
    INDEX idx_invitation_token (invitation_token),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at),
    INDEX idx_invited_by (invited_by)
);

-- OTP TOKENS TABLE
CREATE TABLE OTP_TOKENS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    token_type ENUM('login', 'registration', 'password_reset') NOT NULL,
    user_id INT NULL, -- Changed to INT to match USERS.id
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    ip_address VARCHAR(45),
    attempt_count INT DEFAULT 0,
    last_attempt_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes for performance
    INDEX idx_email_type (email, token_type),
    INDEX idx_otp_code (otp_code),
    INDEX idx_expires_at (expires_at),
    INDEX idx_user_id (user_id)
);

-- FAMILY INVITATIONS TABLE
CREATE TABLE FAMILY_INVITATIONS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    parent_email VARCHAR(255) NOT NULL,
    children_profiles JSON NOT NULL,
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    status ENUM('pending', 'partially_accepted', 'completed') NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    acceptance_log JSON,
    invited_by INT NOT NULL, -- Changed to INT to match USERS.id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes for performance
    INDEX idx_family_token (invitation_token),
    INDEX idx_parent_email (parent_email),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at)
);

-- EMAIL DELIVERY TRACKING TABLE
CREATE TABLE EMAIL_DELIVERY_LOG (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email_type ENUM('invitation', 'otp', 'family_invitation', 'parent_consent') NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    template_id VARCHAR(100),
    delivery_status ENUM('pending', 'sent', 'delivered', 'failed', 'bounced') DEFAULT 'pending',
    external_message_id VARCHAR(255),
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