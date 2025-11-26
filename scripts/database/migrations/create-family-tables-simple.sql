-- ============================================================================
-- FAMILY MEMBER SYSTEM - DATABASE SCHEMA (Simplified)
-- ============================================================================

-- Create FAMILY_MEMBERS table
CREATE TABLE IF NOT EXISTS FAMILY_MEMBERS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    parent_user_id BIGINT NOT NULL,
    alumni_member_id INT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(150),
    birth_date DATE NULL,
    age_at_registration INT NULL,
    current_age INT NULL,
    can_access_platform BOOLEAN DEFAULT FALSE,
    requires_parent_consent BOOLEAN DEFAULT FALSE,
    parent_consent_given BOOLEAN DEFAULT FALSE,
    parent_consent_date TIMESTAMP NULL,
    access_level ENUM('full', 'supervised', 'blocked') DEFAULT 'blocked',
    relationship ENUM('self', 'child', 'spouse', 'sibling', 'guardian') DEFAULT 'child',
    is_primary_contact BOOLEAN DEFAULT FALSE,
    profile_image_url VARCHAR(500),
    bio TEXT,
    status ENUM('active', 'inactive', 'suspended', 'pending_consent') DEFAULT 'pending_consent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    last_consent_check_at TIMESTAMP NULL,
    FOREIGN KEY (parent_user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    FOREIGN KEY (alumni_member_id) REFERENCES alumni_members(id) ON DELETE SET NULL,
    INDEX idx_parent_user_id (parent_user_id),
    INDEX idx_alumni_member_id (alumni_member_id),
    INDEX idx_access_level (access_level),
    INDEX idx_can_access (can_access_platform),
    INDEX idx_status (status),
    INDEX idx_relationship (relationship)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create FAMILY_ACCESS_LOG table
CREATE TABLE IF NOT EXISTS FAMILY_ACCESS_LOG (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    family_member_id CHAR(36) NOT NULL,
    parent_user_id BIGINT NOT NULL,
    access_type ENUM('login', 'profile_switch', 'logout') NOT NULL,
    access_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(50),
    session_id VARCHAR(255),
    FOREIGN KEY (family_member_id) REFERENCES FAMILY_MEMBERS(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    INDEX idx_family_member (family_member_id),
    INDEX idx_parent_user (parent_user_id),
    INDEX idx_access_timestamp (access_timestamp),
    INDEX idx_access_type (access_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Family Members tables created successfully!' AS Status;
