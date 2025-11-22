# Database Maintenance Procedures

## Overview
This document outlines routine maintenance procedures for the SGS Gita Alumni database system, ensuring optimal performance, data integrity, and compliance.

## Daily Maintenance Tasks

### 1. Expired Token Cleanup
**Frequency**: Daily at 3:00 AM UTC
**Purpose**: Remove expired authentication tokens and invitations
**Procedure**:

```sql
-- Execute cleanup stored procedure
CALL CleanupExpiredTokens();

-- Manual cleanup if procedure unavailable
DELETE FROM OTP_TOKENS WHERE expires_at < NOW();
UPDATE USER_INVITATIONS
SET status = 'expired'
WHERE expires_at < NOW() AND status = 'pending';
UPDATE FAMILY_INVITATIONS
SET status = 'expired'
WHERE expires_at < NOW() AND status IN ('pending', 'partially_accepted');
```

**Verification**:
```sql
-- Check cleanup results
SELECT 'Expired OTP tokens removed' as cleanup_status,
       COUNT(*) as tokens_cleaned
FROM OTP_TOKENS
WHERE expires_at < DATE_SUB(NOW(), INTERVAL 1 HOUR);
```

### 2. Log Rotation and Cleanup
**Frequency**: Daily at 4:00 AM UTC
**Purpose**: Maintain log file sizes and remove old audit records
**Procedure**:

```sql
-- Clean up old email delivery logs (keep 30 days)
DELETE FROM EMAIL_DELIVERY_LOG
WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Archive old audit logs (keep 90 days)
DELETE FROM INVITATION_AUDIT_LOG
WHERE timestamp < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Clean up old session data if applicable
DELETE FROM USER_SESSIONS
WHERE expires_at < NOW();
```

### 3. Performance Monitoring
**Frequency**: Daily during business hours
**Purpose**: Monitor database performance metrics
**Procedure**:

```sql
-- Check slow queries
SHOW PROCESSLIST;

-- Monitor table sizes
SELECT table_name,
       ROUND(data_length / 1024 / 1024, 2) as size_mb,
       table_rows
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'sgs_gita_alumni'
ORDER BY data_length DESC;

-- Check index usage
SHOW INDEX_STATISTICS;
```

## Weekly Maintenance Tasks

### 1. Index Optimization
**Frequency**: Weekly on Sundays at 2:00 AM UTC
**Purpose**: Maintain index efficiency
**Procedure**:

```sql
-- Analyze tables for optimization
ANALYZE TABLE USER_INVITATIONS,
              OTP_TOKENS,
              FAMILY_INVITATIONS,
              AGE_VERIFICATION,
              PARENT_CONSENT_RECORDS,
              EMAIL_DELIVERY_LOG,
              INVITATION_AUDIT_LOG;

-- Optimize tables if fragmentation detected
OPTIMIZE TABLE USER_INVITATIONS,
               OTP_TOKENS,
               FAMILY_INVITATIONS;

-- Update table statistics
ANALYZE TABLE ALUMNI_MEMBERS, APP_USERS;
```

### 2. Security Audit
**Frequency**: Weekly on Mondays at 9:00 AM UTC
**Purpose**: Verify security configurations
**Procedure**:

```sql
-- Check user privileges
SELECT User, Host, Select_priv, Insert_priv, Update_priv, Delete_priv
FROM mysql.user
WHERE User IN ('app_user', 'admin_user');

-- Verify audit logging is active
SELECT COUNT(*) as recent_audits
FROM INVITATION_AUDIT_LOG
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY);

-- Check for failed login attempts
SELECT COUNT(*) as failed_attempts,
       ip_address,
       MAX(last_attempt_at) as last_attempt
FROM OTP_TOKENS
WHERE attempt_count >= 3
  AND last_attempt_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY ip_address;
```

### 3. Data Consistency Checks
**Frequency**: Weekly on Wednesdays at 10:00 AM UTC
**Purpose**: Verify data integrity
**Procedure**:

```sql
-- Check foreign key constraints
SELECT CONSTRAINT_NAME, TABLE_NAME, REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'sgs_gita_alumni'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Verify orphaned records
SELECT 'Orphaned invitations' as issue_type,
       COUNT(*) as count
FROM USER_INVITATIONS ui
LEFT JOIN USERS u ON ui.accepted_by = u.id
WHERE ui.status = 'accepted' AND u.id IS NULL;

-- Check data completeness
SELECT 'Users without age verification' as issue_type,
       COUNT(*) as count
FROM USERS
WHERE age_verified = FALSE
  AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

## Monthly Maintenance Tasks

### 1. Performance Analysis
**Frequency**: First Sunday of each month at 3:00 AM UTC
**Purpose**: Comprehensive performance review
**Procedure**:

```sql
-- Generate performance report
SELECT 'Performance Metrics' as report_type;

-- Query performance
SHOW STATUS LIKE 'Slow_queries';
SHOW STATUS LIKE 'Queries';

-- Buffer pool efficiency
SHOW STATUS LIKE 'Innodb_buffer_pool%';

-- Connection statistics
SHOW STATUS LIKE '%connection%';

-- Generate table statistics
SELECT TABLE_NAME,
       TABLE_ROWS,
       DATA_LENGTH,
       INDEX_LENGTH,
       ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as total_mb
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'sgs_gita_alumni'
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;
```

### 2. Capacity Planning
**Frequency**: First Monday of each month at 11:00 AM UTC
**Purpose**: Plan for future resource needs
**Procedure**:

```sql
-- Monitor growth trends
SELECT DATE(created_at) as date,
       COUNT(*) as new_records
FROM USER_INVITATIONS
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Storage usage trends
SELECT TABLE_NAME,
       ROUND(DATA_LENGTH / 1024 / 1024, 2) as data_mb,
       ROUND(INDEX_LENGTH / 1024 / 1024, 2) as index_mb
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'sgs_gita_alumni';

-- Connection pool analysis
SHOW STATUS LIKE 'Max_used_connections';
SHOW STATUS LIKE 'Threads_connected';
```

### 3. Compliance Review
**Frequency**: Last Friday of each month at 2:00 PM UTC
**Purpose**: Ensure COPPA and data protection compliance
**Procedure**:

```sql
-- Age verification compliance
SELECT 'Users requiring age verification' as compliance_check,
       COUNT(*) as count
FROM USERS
WHERE age_verified = FALSE;

-- Parental consent status
SELECT 'Users requiring parental consent' as compliance_check,
       COUNT(*) as count
FROM USERS u
INNER JOIN AGE_VERIFICATION av ON u.id = av.user_id
WHERE av.requires_parent_consent = TRUE
  AND u.parent_consent_given = FALSE;

-- Consent expiration check
SELECT 'Expiring consents' as compliance_check,
       COUNT(*) as count
FROM PARENT_CONSENT_RECORDS
WHERE expires_at <= DATE_ADD(NOW(), INTERVAL 30 DAY)
  AND is_active = TRUE;
```

## Quarterly Maintenance Tasks

### 1. Full System Health Check
**Frequency**: Last Sunday of each quarter at 4:00 AM UTC
**Purpose**: Comprehensive system review
**Procedure**:

```sql
-- Complete schema validation
SELECT 'Schema Validation' as check_type;

-- Check all constraints
SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = 'sgs_gita_alumni';

-- Verify all indexes
SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME, INDEX_TYPE
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'sgs_gita_alumni';

-- Test backup restoration
-- (Documented in backup-recovery-procedures.md)
```

### 2. Security Assessment
**Frequency**: March, June, September, December (end of quarter)
**Purpose**: Comprehensive security review
**Procedure**:

```sql
-- Review user access logs
SELECT performed_by, action, COUNT(*) as action_count,
       MAX(timestamp) as last_action
FROM INVITATION_AUDIT_LOG
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 90 DAY)
GROUP BY performed_by, action
ORDER BY action_count DESC;

-- Check for suspicious activities
SELECT ip_address,
       COUNT(*) as attempts,
       MAX(last_attempt_at) as last_attempt
FROM OTP_TOKENS
WHERE attempt_count >= 5
  AND last_attempt_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY ip_address
HAVING attempts >= 10;
```

## Emergency Maintenance Tasks

### 1. Critical Performance Issues
**Trigger**: Response time > 5 seconds for 5+ minutes
**Procedure**:

```sql
-- Immediate actions
SHOW PROCESSLIST; -- Identify blocking queries
SHOW ENGINE INNODB STATUS; -- Check InnoDB status

-- Kill problematic queries if necessary
KILL [process_id];

-- Check for deadlocks
SHOW ENGINE INNODB STATUS\G
```

### 2. Disk Space Emergency
**Trigger**: Disk usage > 90%
**Procedure**:

```sql
-- Immediate space recovery
DELETE FROM EMAIL_DELIVERY_LOG
WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- Archive old audit logs
DELETE FROM INVITATION_AUDIT_LOG
WHERE timestamp < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Check largest tables
SELECT TABLE_NAME,
       ROUND(DATA_LENGTH / 1024 / 1024, 2) as size_mb
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'sgs_gita_alumni'
ORDER BY DATA_LENGTH DESC
LIMIT 10;
```

## Automated Maintenance Scripts

### Daily Automation Script
```bash
#!/bin/bash
# daily-maintenance.sh

LOG_FILE="/var/log/mysql/daily-maintenance.log"

echo "$(date): Starting daily maintenance" >> $LOG_FILE

# Cleanup expired tokens
mysql -u [user] -p[password] -e "CALL CleanupExpiredTokens();" >> $LOG_FILE 2>&1

# Cleanup old logs
mysql -u [user] -p[password] -e "
  DELETE FROM EMAIL_DELIVERY_LOG WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
  DELETE FROM INVITATION_AUDIT_LOG WHERE timestamp < DATE_SUB(NOW(), INTERVAL 90 DAY);
" >> $LOG_FILE 2>&1

echo "$(date): Daily maintenance completed" >> $LOG_FILE
```

### Weekly Optimization Script
```bash
#!/bin/bash
# weekly-optimization.sh

LOG_FILE="/var/log/mysql/weekly-optimization.log"

echo "$(date): Starting weekly optimization" >> $LOG_FILE

# Analyze and optimize tables
mysql -u [user] -p[password] -e "
  ANALYZE TABLE USER_INVITATIONS, OTP_TOKENS, FAMILY_INVITATIONS;
  OPTIMIZE TABLE USER_INVITATIONS, OTP_TOKENS, FAMILY_INVITATIONS;
" >> $LOG_FILE 2>&1

# Update statistics
mysql -u [user] -p[password] -e "ANALYZE TABLE ALUMNI_MEMBERS, APP_USERS;" >> $LOG_FILE 2>&1

echo "$(date): Weekly optimization completed" >> $LOG_FILE
```

## Monitoring and Alerting

### Key Metrics to Monitor
1. **Performance Metrics**
   - Query response times
   - Connection counts
   - Buffer pool hit ratio
   - Index usage statistics

2. **Capacity Metrics**
   - Disk space usage
   - Table growth rates
   - Connection pool utilization
   - Backup storage usage

3. **Security Metrics**
   - Failed authentication attempts
   - Suspicious IP activity
   - Audit log volume
   - Access pattern changes

### Alert Thresholds
- **Critical**: Response time > 10 seconds, Disk usage > 95%
- **Warning**: Response time > 5 seconds, Disk usage > 85%
- **Info**: Failed attempts > 100 per hour, Unusual access patterns

## Documentation and Review

### Maintenance Records
- **Location**: `/var/log/mysql/maintenance.log`
- **Retention**: 1 year of maintenance logs
- **Format**: Structured JSON logs with timestamps

### Procedure Updates
- **Review Frequency**: Quarterly
- **Update Process**: Document changes and rationale
- **Approval**: Database administrator approval required

### Training Documentation
- **New DBA Training**: Hands-on maintenance procedure training
- **Emergency Procedures**: Quarterly emergency drill participation
- **Documentation**: Regular review and update of procedures

## Troubleshooting Guide

### Common Issues and Solutions

#### Slow Query Performance
1. **Check for missing indexes**
   ```sql
   EXPLAIN SELECT * FROM USER_INVITATIONS WHERE status = 'pending';
   ```

2. **Look for table locks**
   ```sql
   SHOW OPEN TABLES WHERE In_use > 0;
   ```

3. **Check buffer pool efficiency**
   ```sql
   SHOW STATUS LIKE 'Innodb_buffer_pool%';
   ```

#### High Connection Count
1. **Identify connection source**
   ```sql
   SHOW PROCESSLIST;
   ```

2. **Check for connection leaks**
   ```sql
   SELECT user, COUNT(*) as connections
   FROM INFORMATION_SCHEMA.PROCESSLIST
   GROUP BY user;
   ```

#### Disk Space Issues
1. **Identify largest tables**
   ```sql
   SELECT TABLE_NAME, DATA_LENGTH/1024/1024 as size_mb
   FROM INFORMATION_SCHEMA.TABLES
   ORDER BY DATA_LENGTH DESC;
   ```

2. **Check log file sizes**
   ```bash
   du -sh /var/log/mysql/*
   ```

## Maintenance Schedule Summary

| Task | Frequency | Duration | Impact | Automation |
|------|-----------|----------|--------|------------|
| Expired Token Cleanup | Daily | 5 minutes | Low | Yes |
| Log Rotation | Daily | 10 minutes | Low | Yes |
| Index Optimization | Weekly | 30 minutes | Medium | Yes |
| Security Audit | Weekly | 15 minutes | Low | Partial |
| Performance Analysis | Monthly | 1 hour | Low | No |
| Compliance Review | Monthly | 30 minutes | Medium | Partial |
| Full Health Check | Quarterly | 2 hours | High | No |

## Contact Information

### Database Maintenance Team
- **Primary Contact**: Database Administrator
- **Email**: admin@sgsgitaalumni.org
- **Phone**: +1-555-0123
- **Emergency**: +1-555-0124

### Escalation Path
1. Database Administrator
2. Development Team Lead
3. System Architect
4. Executive Management (if needed)