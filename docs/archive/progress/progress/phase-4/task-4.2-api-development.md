# Task 4.2: AWS Services Setup (Must-Have)

**Status:** ⏸️ On Hold (AWS Access Required)
**Priority:** High
**Estimated Duration:** 3-5 days (once AWS access is granted)

## Overview
Configure must-have AWS services: Elastic Beanstalk, S3, RDS, and CloudWatch for the alumni application deployment.

## Objectives
- Set up AWS Elastic Beanstalk for Node.js/Express.js deployment
- Configure S3 buckets for user-generated content storage
- Set up MySQL RDS instance with privacy considerations
- Configure CloudWatch for basic monitoring and logging
- Set up security groups and network configurations

## AWS Services Configuration

### 1. Elastic Beanstalk Setup
- **Application**: `sgs-alumni-backend`
- **Environment**: `sgs-alumni-backend-env`
- **Platform**: Node.js
- **Instance Type**: t3.micro (development) / t3.small (production)

### 2. S3 Bucket Configuration
- **Bucket 1**: `sgs-alumni-profile-pictures` - Profile pictures and avatars
- **Bucket 2**: `sgs-alumni-attachments` - File attachments and documents
- **Bucket 3**: `sgs-alumni-social-content` - Social posts related media
- **Access**: Private with presigned URLs for secure access
- **CORS**: Configured for frontend file uploads

### 3. RDS MySQL Configuration
- **Instance**: `sgs-alumni-database`
- **Engine**: MySQL 8.0
- **Storage**: 20 GB General Purpose SSD
- **Security**: Private subnet, encrypted at rest
- **Backup**: Automated backups enabled

### 4. CloudWatch Configuration
- **Log Groups**: Application logs, error logs, access logs
- **Metrics**: CPU utilization, memory usage, disk I/O
- **Alarms**: High CPU usage, database connection errors

## Environment Variables Configuration
```env
# Database Configuration
DB_HOST=sgs-alumni-database.cj88ledblqs8.us-east-1.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=your-secure-password
DB_NAME=sgsbg_app_db
DB_PORT=3306

# S3 Configuration
S3_BUCKET_PROFILE_PICTURES=sgs-alumni-profile-pictures
S3_BUCKET_ATTACHMENTS=sgs-alumni-attachments
S3_BUCKET_SOCIAL_CONTENT=sgs-alumni-social-content
S3_REGION=us-east-1

# Application Configuration
NODE_ENV=production
PORT=5000
AWS_REGION=us-east-1
```

## Security Configuration
- **Security Groups**: Restrict access to necessary ports only
- **IAM Roles**: Least privilege access for EC2 instances
- **S3 Policies**: Private access with specific permissions
- **RDS Security**: Database accessible only from Elastic Beanstalk instances

## Success Criteria
- [ ] Elastic Beanstalk application created and configured
- [ ] S3 buckets created with proper policies and CORS
- [ ] RDS MySQL instance configured and accessible
- [ ] CloudWatch logging and monitoring configured
- [ ] Security groups and network configuration completed
- [ ] Environment variables properly configured
- [ ] Basic connectivity testing completed
- [ ] API documentation generated and accessible

## Dependencies
- Task 4.1: Backend Architecture Analysis
- AWS account with appropriate permissions
- Database schema and S3 requirements finalized
- Security requirements defined

## Testing Requirements
- AWS services connectivity testing
- S3 bucket access and file upload testing
- RDS database connection and query testing
- CloudWatch logging verification
- Security groups and network access testing