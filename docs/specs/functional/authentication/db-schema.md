---
title: Database Schema - Authentication
version: 1.0
status: implemented
last_updated: 2025-11-27
applies_to: authentication
---

# Database Schema: Authentication

## Overview

Database schema for the authentication module, including invitation-based registration, OTP authentication, and session management.

## Tables

### USER_INVITATIONS

**Purpose**: Stores invitation tokens for new user registration

**Schema**:
```sql
CREATE TABLE USER_INVITATIONS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL,
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    invited_by CHAR(36) NOT NULL,
    invitation_type ENUM('alumni', 'family_member', 'admin') NOT NULL DEFAULT 'alumni',
    invitation_data JSON,
    status ENUM('pending', 'accepted', 'expired', 'revoked') NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    accepted_by CHAR(36) NULL,
    ip_address VARCHAR(45),
    resend_count INT DEFAULT 0,
    last_resent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- HMAC Token Security Fields
    token_payload JSON,
    token_signature VARCHAR(64),
    token_format VARCHAR(20) DEFAULT 'legacy',

    FOREIGN KEY (invited_by) REFERENCES app_users(id) ON DELETE CASCADE,
    FOREIGN KEY (accepted_by) REFERENCES app_users(id) ON DELETE SET NULL,

    INDEX idx_invitation_token (invitation_token),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at),
    INDEX idx_invited_by (invited_by),
    INDEX idx_token_signature (token_signature)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PRIMARY KEY | Unique identifier (UUID) |
| email | VARCHAR(255) | NOT NULL | Invitee email address |
| invitation_token | VARCHAR(255) | UNIQUE, NOT NULL | Unique invitation token |
| invited_by | CHAR(36) | NOT NULL, FK | User who sent invitation |
| invitation_type | ENUM | NOT NULL | Type: alumni, family_member, admin |
| invitation_data | JSON | NULL | Additional data (graduation info, etc.) |
| status | ENUM | NOT NULL | pending, accepted, expired, revoked |
| expires_at | TIMESTAMP | NOT NULL | Token expiration time |
| token_format | VARCHAR(20) | DEFAULT 'legacy' | Token format: legacy or hmac |

---

### OTP_TOKENS

**Purpose**: Stores one-time passwords for authentication

**Schema**:
```sql
CREATE TABLE OTP_TOKENS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    token_type ENUM('login', 'registration', 'password_reset') NOT NULL,
    user_id CHAR(36) NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP NULL,
    ip_address VARCHAR(45),
    attempt_count INT DEFAULT 0,
    last_attempt_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    
    INDEX idx_email_type (email, token_type),
    INDEX idx_otp_code (otp_code),
    INDEX idx_expires_at (expires_at),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PRIMARY KEY | Unique identifier (UUID) |
| email | VARCHAR(255) | NOT NULL | User email |
| otp_code | VARCHAR(10) | NOT NULL | 6-digit OTP code |
| token_type | ENUM | NOT NULL | login, registration, password_reset |
| user_id | CHAR(36) | FK, NULL | User reference (null for registration) |
| expires_at | TIMESTAMP | NOT NULL | OTP expiration time |
| attempt_count | INT | DEFAULT 0 | Failed verification attempts |

---

### FAMILY_INVITATIONS

**Purpose**: Stores family member invitation batches

**Schema**:
```sql
CREATE TABLE FAMILY_INVITATIONS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    parent_email VARCHAR(255) NOT NULL,
    children_profiles JSON NOT NULL,
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    status ENUM('pending', 'partially_accepted', 'completed') NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    acceptance_log JSON,
    invited_by CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invited_by) REFERENCES app_users(id) ON DELETE CASCADE,
    
    INDEX idx_family_token (invitation_token),
    INDEX idx_parent_email (parent_email),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PRIMARY KEY | Unique identifier (UUID) |
| parent_email | VARCHAR(255) | NOT NULL | Parent/guardian email |
| children_profiles | JSON | NOT NULL | Array of child profile data |
| invitation_token | VARCHAR(255) | UNIQUE, NOT NULL | Unique family invitation token |
| status | ENUM | NOT NULL | pending, partially_accepted, completed |
| acceptance_log | JSON | NULL | Track which children claimed |

---

### EMAIL_DELIVERY_LOG

**Purpose**: Tracks email delivery status for auth-related emails

**Schema**:
```sql
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
    
    INDEX idx_email_type (email_type),
    INDEX idx_recipient_email (recipient_email),
    INDEX idx_delivery_status (delivery_status),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Table Relationships

```
app_users (1) ----< (N) USER_INVITATIONS (invited_by)
app_users (1) ----< (N) OTP_TOKENS
app_users (1) ----< (N) FAMILY_INVITATIONS
USER_INVITATIONS (1) ---- (1) app_users (accepted_by)
```

## ENUM Types

### invitation_type
```sql
ENUM('alumni', 'family_member', 'admin')
```

### invitation_status
```sql
ENUM('pending', 'accepted', 'expired', 'revoked')
```

### otp_token_type
```sql
ENUM('login', 'registration', 'password_reset')
```

---

## Common Query Patterns

### Validate Invitation Token
```sql
SELECT * FROM USER_INVITATIONS 
WHERE invitation_token = ? 
  AND status = 'pending' 
  AND expires_at > NOW();
```

### Get Active OTP
```sql
SELECT * FROM OTP_TOKENS 
WHERE email = ? 
  AND token_type = ? 
  AND is_used = FALSE 
  AND expires_at > NOW()
ORDER BY created_at DESC LIMIT 1;
```

### Check Invitation Rate Limit
```sql
SELECT COUNT(*) FROM USER_INVITATIONS 
WHERE email = ? 
  AND sent_at > DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

---

## Migration Notes

### Version 1.0 (Initial)
- Created USER_INVITATIONS with invitation-based registration
- Created OTP_TOKENS for passwordless authentication
- Created FAMILY_INVITATIONS for family member support
- Added HMAC token security fields (Phase 8.2.1)

---

## Related Documentation

- Technical Spec: `docs/specs/technical/database/schema-design.md`
- Functional Spec: `docs/specs/functional/authentication/README.md`
- API Routes: `routes/auth.js`, `routes/invitations.js`, `routes/otp.js`
- Service Layer: `server/services/AuthService.js`
