# Database Backup and Recovery Procedures

## Overview
This document outlines comprehensive backup and recovery procedures for the SGS Gita Alumni database system, ensuring data protection, compliance, and business continuity.

## Backup Strategy

### Backup Types and Schedules

#### 1. Full Database Backups
- **Frequency**: Daily at 2:00 AM UTC
- **Method**: `mysqldump` with compression
- **Retention**: 30 days
- **Storage**: Secure cloud storage with encryption
- **Command**:
  ```bash
  mysqldump -h [host] -u [user] -p[password] \
    --single-transaction \
    --routines \
    --triggers \
    --all-databases \
    | gzip > /backup/full-backup-$(date +\%Y\%m\%d\%H\%M\%S).sql.gz
  ```

#### 2. Incremental Backups
- **Frequency**: Every 6 hours
- **Method**: Binary log backups
- **Retention**: 7 days
- **Purpose**: Point-in-time recovery capability
- **Command**:
  ```bash
  mysqlbinlog --read-from-remote-server --host=[host] \
    --user=[user] --password=[password] \
    --raw mysql-bin.[latest] > /backup/incremental-$(date +\%Y\%m\%d\%H\%M\%S).sql
  ```

#### 3. Schema-Only Backups
- **Frequency**: Weekly on Sundays
- **Method**: Structure-only dump
- **Retention**: 90 days
- **Purpose**: Quick schema restoration for development
- **Command**:
  ```bash
  mysqldump -h [host] -u [user] -p[password] \
    --no-data \
    --routines \
    --triggers \
    sgs_gita_alumni > /backup/schema-backup-$(date +\%Y\%m\%d).sql
  ```

### Backup Storage and Security

#### Local Storage
- **Location**: `/var/lib/mysql/backup/`
- **Encryption**: AES-256 encryption at rest
- **Access Control**: Restricted to database administrators only
- **Monitoring**: File system usage monitoring and alerting

#### Cloud Storage
- **Provider**: AWS S3 (or equivalent)
- **Bucket**: `sgs-gita-alumni-backups`
- **Encryption**: Server-side encryption with customer-managed keys
- **Access**: IAM roles with minimal required permissions
- **Lifecycle**: Automatic deletion after retention period

#### Off-Site Storage
- **Location**: Geographically separate data center
- **Synchronization**: Real-time replication to secondary site
- **Testing**: Quarterly failover testing

## Recovery Procedures

### Recovery Scenarios

#### 1. Complete System Failure
**Severity**: Critical
**RTO**: 4 hours
**RPO**: 15 minutes

**Procedure**:
1. **Assess Situation**
   - Determine cause of failure
   - Verify backup availability
   - Notify stakeholders

2. **Prepare Recovery Environment**
   - Provision new server instance
   - Install MySQL 8.0
   - Configure network and security

3. **Restore Full Backup**
   ```bash
   # Decrypt and decompress backup
   gunzip -c full-backup-20241201.sql.gz | openssl dec -aes-256-cbc -d > decrypted-backup.sql

   # Restore to new instance
   mysql -h [new-host] -u [user] -p[password] < decrypted-backup.sql
   ```

4. **Apply Incremental Backups**
   ```bash
   # Apply binary logs up to failure point
   mysqlbinlog incremental-backups/*.sql | mysql -h [new-host] -u [user] -p[password]
   ```

5. **Verify Data Integrity**
   - Check table counts
   - Verify foreign key constraints
   - Test critical application functions

#### 2. Single Table Corruption
**Severity**: High
**RTO**: 2 hours
**RPO**: 1 hour

**Procedure**:
1. **Identify Affected Table**
   - Check error logs
   - Verify table structure
   - Assess data loss scope

2. **Restore Specific Table**
   ```sql
   -- Drop corrupted table
   DROP TABLE IF EXISTS corrupted_table;

   -- Restore from backup
   mysql -h [host] -u [user] -p[password] sgs_gita_alumni < table-backup.sql
   ```

3. **Rebuild Indexes**
   ```sql
   -- Rebuild all indexes on restored table
   ALTER TABLE corrupted_table ENGINE=InnoDB;
   ANALYZE TABLE corrupted_table;
   ```

#### 3. Schema Changes (Rollback)
**Severity**: Medium
**RTO**: 1 hour
**RPO**: 0 (point-in-time)

**Procedure**:
1. **Identify Required Rollback**
   - Determine migration to rollback
   - Locate pre-migration backup
   - Plan rollback sequence

2. **Execute Rollback Script**
    ```sql
    -- Example rollback script (if available)
    -- Note: Specific rollback scripts should be created for each migration
    -- SOURCE scripts/database/rollback-migration-001.sql;
    ```

3. **Verify Application Compatibility**
   - Test all affected features
   - Check data consistency
   - Monitor for errors

### Point-in-Time Recovery

#### Binary Log Recovery
```bash
# Stop slave if running
STOP SLAVE;

# Restore to specific point in time
mysqlbinlog --stop-datetime="2024-12-01 10:30:00" \
  --host=[host] --user=[user] --password=[password] \
  mysql-bin.[files] | mysql -h [host] -u [user] -p[password]
```

#### Transaction Rollback
```sql
-- Start transaction
START TRANSACTION;

-- Identify transactions to rollback
SELECT * FROM INFORMATION_SCHEMA.INNODB_TRX;

-- Rollback specific transaction
KILL [transaction_id];

-- Commit or rollback as needed
COMMIT;
```

## Testing and Validation

### Backup Testing
- **Frequency**: Monthly
- **Procedure**:
  1. Create test database instance
  2. Restore from backup
  3. Verify data integrity
  4. Test application functionality
  5. Document any issues

### Recovery Testing
- **Frequency**: Quarterly
- **Scenarios**:
  - Complete system failure
  - Single table corruption
  - Schema rollback
  - Point-in-time recovery

### Validation Queries
```sql
-- Verify table counts
SELECT table_name,
       table_rows
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'sgs_gita_alumni';

-- Check foreign key constraints
SELECT CONSTRAINT_NAME,
       TABLE_NAME,
       REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'sgs_gita_alumni'
  AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Verify recent data
SELECT COUNT(*) as recent_records
FROM user_invitations
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

## Monitoring and Alerting

### Backup Monitoring
- **Success/Failure Alerts**: Email notifications for all backup jobs
- **Storage Usage**: Monitor backup storage consumption
- **Performance Metrics**: Track backup duration and size trends
- **Integrity Checks**: Automated checksum verification

### Recovery Monitoring
- **Service Availability**: Monitor database service status
- **Performance Metrics**: Track query performance post-recovery
- **Error Rates**: Monitor application error rates after recovery
- **Data Consistency**: Automated checks for data integrity

## Compliance and Security

### Data Protection Compliance
- **Encryption**: All backups encrypted using AES-256
- **Access Control**: Role-based access to backup files
- **Audit Trail**: All backup and recovery activities logged
- **Retention Compliance**: Automated cleanup of expired backups

### Security Measures
- **Network Security**: Backups transferred over encrypted channels
- **Access Logging**: All access to backup systems logged
- **Key Management**: Secure key rotation for encryption
- **Physical Security**: Off-site backups stored in secure facilities

## Emergency Contacts

### Database Administration Team
- **Primary DBA**: admin@sgsgitaalumni.org
- **Backup**: +1-555-0123
- **Emergency**: +1-555-0124

### Escalation Procedure
1. **Initial Contact**: Primary DBA
2. **Secondary Contact**: Development team lead
3. **Critical Issues**: Executive management notification

## Documentation Updates

### Version Control
- **Location**: `src/lib/database/schema/backup-recovery-procedures.md`
- **Updates**: After any procedure changes or lessons learned
- **Review**: Annual review and update of procedures

### Change Log
| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2024-12-01 | 1.0 | Initial documentation | System Administrator |
| 2024-12-01 | 1.1 | Added COPPA compliance sections | Database Team |

## Appendices

### A. Backup Scripts
```bash
#!/bin/bash
# Daily backup script
BACKUP_DIR="/var/lib/mysql/backup"
DATE=$(date +%Y%m%d%H%M%S)

# Full backup
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD \
  --single-transaction \
  --routines \
  --triggers \
  sgs_gita_alumni | \
  gzip > $BACKUP_DIR/full-backup-$DATE.sql.gz

# Upload to cloud storage
aws s3 cp $BACKUP_DIR/full-backup-$DATE.sql.gz \
  s3://sgs-gita-alumni-backups/daily/ \
  --sse aws:kms --sse-kms-key-id [key-id]
```

### B. Recovery Scripts
```bash
#!/bin/bash
# Emergency recovery script
RECOVERY_HOST=$1
BACKUP_FILE=$2

# Restore from backup
gunzip -c $BACKUP_FILE | \
  mysql -h $RECOVERY_HOST -u $DB_USER -p$DB_PASSWORD

# Verify restoration
mysql -h $RECOVERY_HOST -u $DB_USER -p$DB_PASSWORD \
  -e "SELECT COUNT(*) FROM user_invitations;"

echo "Recovery completed successfully"
```

### C. Validation Checklist
- [ ] All tables present and accessible
- [ ] Foreign key constraints intact
- [ ] Recent data verified
- [ ] Application functionality tested
- [ ] Performance benchmarks met
- [ ] Backup integrity confirmed