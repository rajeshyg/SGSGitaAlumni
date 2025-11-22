# Database Constraints and Indexes Documentation

## Overview
This document provides comprehensive documentation of all foreign key constraints, indexes, and check constraints in the SGS Gita Alumni database system.

## Table of Contents
1. [Foreign Key Constraints](#foreign-key-constraints)
2. [Database Indexes](#database-indexes)
3. [Check Constraints](#check-constraints)
4. [Unique Constraints](#unique-constraints)

## Foreign Key Constraints

### USER_INVITATIONS Table
| Constraint Name | Column | Referenced Table | Referenced Column | On Delete | On Update |
|----------------|--------|----------------|------------------|-----------|-----------|
| `fk_invited_by` | `invited_by` | `USERS` | `id` | CASCADE | - |
| `fk_accepted_by` | `accepted_by` | `USERS` | `id` | SET NULL | - |

### OTP_TOKENS Table
| Constraint Name | Column | Referenced Table | Referenced Column | On Delete | On Update |
|----------------|--------|----------------|------------------|-----------|-----------|
| `fk_user_id` | `user_id` | `USERS` | `id` | CASCADE | - |

### FAMILY_INVITATIONS Table
| Constraint Name | Column | Referenced Table | Referenced Column | On Delete | On Update |
|----------------|--------|----------------|------------------|-----------|-----------|
| `fk_invited_by` | `invited_by` | `USERS` | `id` | CASCADE | - |

### AGE_VERIFICATION Table
| Constraint Name | Column | Referenced Table | Referenced Column | On Delete | On Update |
|----------------|--------|----------------|------------------|-----------|-----------|
| `fk_user_id` | `user_id` | `USERS` | `id` | CASCADE | - |

### PARENT_CONSENT_RECORDS Table
| Constraint Name | Column | Referenced Table | Referenced Column | On Delete | On Update |
|----------------|--------|----------------|------------------|-----------|-----------|
| `fk_child_user_id` | `child_user_id` | `USERS` | `id` | CASCADE | - |

### INVITATION_AUDIT_LOG Table
| Constraint Name | Column | Referenced Table | Referenced Column | On Delete | On Update |
|----------------|--------|----------------|------------------|-----------|-----------|
| `fk_invitation_id` | `invitation_id` | `USER_INVITATIONS` | `id` | CASCADE | - |
| `fk_performed_by` | `performed_by` | `USERS` | `id` | SET NULL | - |

### Legacy Table Constraints (Alumni System)
| Constraint Name | Table | Column | Referenced Table | Referenced Column | On Delete | On Update |
|----------------|-------|--------|------------------|------------------|-----------|-----------|
| `fk_app_users_alumni_member_id` | `app_users` | `alumni_member_id` | `alumni_members` | `id` | SET NULL | CASCADE |
| `fk_alumni_members_user_id` | `alumni_members` | `user_id` | `app_users` | `id` | SET NULL | CASCADE |

## Database Indexes

### Performance Indexes by Table

#### USER_INVITATIONS Table
| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `PRIMARY` | `id` | PRIMARY KEY | Unique record identification |
| `idx_invitation_token` | `invitation_token` | UNIQUE | Fast token lookup |
| `idx_email` | `email` | INDEX | Email-based searches |
| `idx_status` | `status` | INDEX | Status filtering |
| `idx_expires_at` | `expires_at` | INDEX | Expiration cleanup |
| `idx_invited_by` | `invited_by` | INDEX | Invitations by user |

#### OTP_TOKENS Table
| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `PRIMARY` | `id` | PRIMARY KEY | Unique record identification |
| `idx_email_type` | `email`, `token_type` | INDEX | Email and type filtering |
| `idx_otp_code` | `otp_code` | INDEX | OTP verification |
| `idx_expires_at` | `expires_at` | INDEX | Expiration cleanup |
| `idx_user_id` | `user_id` | INDEX | User-specific tokens |

#### FAMILY_INVITATIONS Table
| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `PRIMARY` | `id` | PRIMARY KEY | Unique record identification |
| `idx_family_token` | `invitation_token` | UNIQUE | Fast token lookup |
| `idx_parent_email` | `parent_email` | INDEX | Parent email searches |
| `idx_status` | `status` | INDEX | Status filtering |
| `idx_expires_at` | `expires_at` | INDEX | Expiration cleanup |

#### AGE_VERIFICATION Table
| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `PRIMARY` | `id` | PRIMARY KEY | Unique record identification |
| `idx_user_id` | `user_id` | INDEX | User verification lookup |
| `idx_requires_consent` | `requires_parent_consent` | INDEX | Consent requirement filtering |
| `idx_parent_email` | `parent_email` | INDEX | Parent email searches |

#### PARENT_CONSENT_RECORDS Table
| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `PRIMARY` | `id` | PRIMARY KEY | Unique record identification |
| `idx_child_user_id` | `child_user_id` | INDEX | Child record lookup |
| `idx_parent_email` | `parent_email` | INDEX | Parent email searches |
| `idx_consent_token` | `consent_token` | UNIQUE | Token verification |
| `idx_expires_at` | `expires_at` | INDEX | Expiration cleanup |

#### EMAIL_DELIVERY_LOG Table
| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `PRIMARY` | `id` | PRIMARY KEY | Unique record identification |
| `idx_email_type` | `email_type` | INDEX | Email type filtering |
| `idx_recipient_email` | `recipient_email` | INDEX | Recipient-based searches |
| `idx_delivery_status` | `delivery_status` | INDEX | Status filtering |
| `idx_sent_at` | `sent_at` | INDEX | Chronological sorting |

#### INVITATION_AUDIT_LOG Table
| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `PRIMARY` | `id` | PRIMARY KEY | Unique record identification |
| `idx_invitation_id` | `invitation_id` | INDEX | Invitation-specific audits |
| `idx_action` | `action` | INDEX | Action-based filtering |
| `idx_performed_by` | `performed_by` | INDEX | User action tracking |
| `idx_timestamp` | `timestamp` | INDEX | Chronological sorting |

#### USERS Table (Additional Indexes)
| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `PRIMARY` | `id` | PRIMARY KEY | Unique record identification |
| `idx_email` | `email` | UNIQUE | Email uniqueness |
| `idx_invitation_id` | `invitation_id` | INDEX | Invitation relationship |
| `idx_requires_otp` | `requires_otp` | INDEX | OTP requirement filtering |
| `idx_age_verified` | `age_verified` | INDEX | Age verification status |
| `idx_parent_consent_required` | `parent_consent_required` | INDEX | Consent requirement filtering |

#### Legacy Tables Indexes

##### ALUMNI_MEMBERS Table
| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `PRIMARY` | `id` | PRIMARY KEY | Unique record identification |
| `idx_email` | `email` | INDEX | Contact searches |
| `idx_status` | `status` | INDEX | Status filtering |
| `idx_invitation_sent` | `invitation_sent_at` | INDEX | Invitation tracking |
| `idx_invitation_accepted` | `invitation_accepted_at` | INDEX | Acceptance tracking |

##### APP_USERS Table
| Index Name | Columns | Type | Purpose |
|------------|---------|------|---------|
| `PRIMARY` | `id` | PRIMARY KEY | Unique record identification |
| `idx_email` | `email` | UNIQUE | Email uniqueness |
| `idx_status` | `status` | INDEX | Status filtering |
| `idx_email_verified` | `email_verified` | INDEX | Verification status |
| `idx_name_search` | `first_name`, `last_name` | INDEX | Name-based searches |

## Check Constraints

### Data Validation Rules

#### ALUMNI_MEMBERS Table
| Constraint Name | Column | Rule | Purpose |
|----------------|--------|------|---------|
| `chk_alumni_members_email_format` | `email` | `email IS NULL OR email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'` | Valid email format |

#### APP_USERS Table
| Constraint Name | Column | Rule | Purpose |
|----------------|--------|------|---------|
| `chk_app_users_email_format` | `email` | `email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'` | Valid email format |
| `chk_app_users_birth_date` | `birth_date` | `birth_date IS NULL OR (birth_date <= CURDATE() AND birth_date >= DATE_SUB(CURDATE(), INTERVAL 120 YEAR))` | Reasonable birth date range |

## Unique Constraints

### Uniqueness Requirements

#### USER_INVITATIONS Table
| Constraint Name | Columns | Purpose |
|----------------|---------|---------|
| `uk_invitation_token` | `invitation_token` | Prevent duplicate invitation tokens |

#### OTP_TOKENS Table
| Constraint Name | Columns | Purpose |
|----------------|---------|---------|
| `uk_otp_code` | `otp_code` | Unique OTP codes (within expiration) |

#### FAMILY_INVITATIONS Table
| Constraint Name | Columns | Purpose |
|----------------|---------|---------|
| `uk_family_token` | `invitation_token` | Prevent duplicate family invitation tokens |

#### PARENT_CONSENT_RECORDS Table
| Constraint Name | Columns | Purpose |
|----------------|---------|---------|
| `uk_consent_token` | `consent_token` | Unique consent verification tokens |

#### APP_USERS Table
| Constraint Name | Columns | Purpose |
|----------------|---------|---------|
| `uk_app_users_email` | `email` | Unique email addresses |

#### ALUMNI_MEMBERS Table
| Constraint Name | Columns | Purpose |
|----------------|---------|---------|
| `uk_alumni_members_student_id` | `student_id` | Unique student IDs (where provided) |

## Performance Considerations

### Index Usage Guidelines
1. **Primary Keys**: All tables use UUID (CHAR(36)) for distributed system compatibility
2. **Foreign Keys**: Properly indexed for join performance
3. **Search Columns**: Email, status, and date fields are indexed for common queries
4. **Expiration Management**: All time-sensitive tables have expiration indexes for cleanup
5. **Composite Indexes**: Used for multi-column filtering scenarios

### Maintenance Recommendations
1. **Regular Index Analysis**: Monitor index usage and fragmentation
2. **Cleanup Procedures**: Automated cleanup of expired tokens and logs
3. **Statistics Updates**: Regular update of table statistics for query optimization
4. **Partitioning Consideration**: Large audit tables may benefit from date-based partitioning

## Security Considerations

### Access Control Through Constraints
1. **Referential Integrity**: All foreign keys maintain data consistency
2. **Cascade Operations**: Controlled deletion behavior prevents orphaned records
3. **Data Validation**: Check constraints prevent invalid data entry
4. **Audit Trail**: Comprehensive logging of all invitation-related activities

## Compliance Features

### COPPA Compliance Through Constraints
1. **Age Verification**: Required before full system access
2. **Parental Consent**: Mandatory for users under 13
3. **Consent Expiration**: Annual renewal requirements enforced
4. **Digital Signatures**: Cryptographic proof of consent
5. **IP Logging**: Geographic and identity verification tracking