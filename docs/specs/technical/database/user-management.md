---
title: User Management Database Schema
version: 1.0
status: implemented
last_updated: 2025-11-23
applies_to: database
---

# User Management Database Schema

## Overview

Database schema for user accounts, family members, profiles, and invitations.

## Tables

### app_users

Main user account table.

```sql
CREATE TABLE app_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
  status ENUM('pending', 'active', 'suspended', 'deactivated') DEFAULT 'pending',
  is_active BOOLEAN DEFAULT TRUE,

  -- Profile fields
  birth_date DATE,
  phone VARCHAR(20),
  profile_image_url VARCHAR(500),
  bio TEXT,
  linkedin_url VARCHAR(500),
  current_position VARCHAR(200),
  company VARCHAR(200),
  location VARCHAR(200),
  graduation_year INT,
  program VARCHAR(100),

  -- Verification
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at DATETIME,
  age_verified BOOLEAN DEFAULT FALSE,
  parent_consent_required BOOLEAN DEFAULT FALSE,
  parent_consent_given BOOLEAN DEFAULT FALSE,
  requires_otp BOOLEAN DEFAULT FALSE,

  -- Family account support
  is_family_account BOOLEAN DEFAULT FALSE,
  family_account_type ENUM('individual', 'family') DEFAULT 'individual',
  primary_family_member_id CHAR(36),

  -- Alumni link
  alumni_member_id INT,

  -- Timestamps
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (alumni_member_id) REFERENCES alumni_members(id)
);
```

### FAMILY_MEMBERS

Family members under a parent account.

```sql
CREATE TABLE FAMILY_MEMBERS (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  parent_user_id INT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200),
  birth_date DATE,
  current_age INT,
  relationship ENUM('child', 'spouse', 'parent', 'sibling', 'other'),
  access_level ENUM('full', 'limited', 'view_only') DEFAULT 'full',
  profile_image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (parent_user_id) REFERENCES app_users(id) ON DELETE CASCADE
);
```

### alumni_members

Alumni profile data (linked to app_users).

```sql
CREATE TABLE alumni_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  family_name VARCHAR(100),
  father_name VARCHAR(100),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  batch INT COMMENT 'Graduation year',
  center_name VARCHAR(200),
  result VARCHAR(100),
  category VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  student_id VARCHAR(50),
  status VARCHAR(50),
  -- Age/DOB fields for COPPA compliance
  birth_date DATE COMMENT 'Birth date for age calculation (admin-populated)',
  estimated_birth_year INT COMMENT 'Estimated birth year from graduation year (batch - 22)',
  -- Invitation tracking
  invitation_sent_at DATETIME,
  invitation_accepted_at DATETIME,
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Age Calculation Priority**:
1. `birth_date` - Actual birth date (admin-populated)
2. `estimated_birth_year` - From graduation year (batch - 22)
3. Fallback: `YEAR(CURDATE()) - (batch - 22)`

### USER_INVITATIONS

Invitation tokens for user onboarding.

```sql
CREATE TABLE USER_INVITATIONS (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  user_id INT,
  invitation_token TEXT NOT NULL,
  invited_by INT NOT NULL,
  invitation_type VARCHAR(50) DEFAULT 'alumni',
  invitation_data JSON,
  status ENUM('pending', 'accepted', 'expired', 'revoked') DEFAULT 'pending',
  sent_at DATETIME,
  expires_at DATETIME,
  is_used BOOLEAN DEFAULT FALSE,
  resend_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES app_users(id),
  FOREIGN KEY (invited_by) REFERENCES app_users(id)
);
```

### USER_PREFERENCES

User preference settings including domain interests.

```sql
CREATE TABLE USER_PREFERENCES (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id INT UNIQUE NOT NULL,
  primary_domain_id CHAR(36),
  secondary_domain_ids JSON DEFAULT '[]',
  areas_of_interest_ids JSON DEFAULT '[]',
  notification_settings JSON DEFAULT '{}',
  privacy_settings JSON DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
  FOREIGN KEY (primary_domain_id) REFERENCES DOMAINS(id)
);
```

## Key Queries

### Get User with Profile

```sql
SELECT
  u.*,
  am.family_name, am.father_name, am.batch, am.center_name,
  am.result, am.category, am.phone as alumni_phone, am.email as alumni_email,
  am.student_id
FROM app_users u
LEFT JOIN alumni_members am ON u.alumni_member_id = am.id
WHERE u.id = ? AND u.is_active = true;
```

### Get Family Members

```sql
SELECT
  id, first_name, last_name, display_name, current_age,
  relationship, access_level, profile_image_url
FROM FAMILY_MEMBERS
WHERE parent_user_id = ? AND is_active = true;
```

### Search Users

```sql
SELECT
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  u.status,
  u.email_verified
FROM app_users u
WHERE u.is_active = true
  AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)
ORDER BY u.last_name, u.first_name
LIMIT ?;
```

## Reference Files

- `/routes/users.js` - User API endpoints
- `/routes/family-members.js` - Family member management
- `/services/FamilyMemberService.js` - Family member business logic
