# AWS Deployment Setup Guide for SGS Alumni Application

## 🚀 **Overview**

This guide outlines the AWS deployment strategy for deploying the current MySQL-based application to AWS using Elastic Beanstalk and RDS services.

## 📋 **Prerequisites**

- AWS Account with appropriate permissions
- Node.js and npm installed
- Basic knowledge of AWS services (Elastic Beanstalk, RDS, MySQL)
- Understanding of web application deployment patterns

## 🔧 **Step 1: AWS Services Setup**

### 1.1 AWS Service Priorities

#### Must-Have Services (Priority 1 - Required for Core Functionality)
Set up these essential AWS services first:
- **Elastic Beanstalk**: Platform for deploying the Node.js/Express.js backend API server
- **S3 (Simple Storage Service)**: Storage for user-generated content including:
  - Profile pictures and user avatars
  - File attachments and documents
  - Social posts related media content
- **RDS (MySQL)**: Relational database for alumni data storage
- **CloudWatch**: Basic logging and metrics for monitoring backend performance and debugging

#### Good-to-Have Services (Priority 2 - Can Wait)
These services can be added later if needed:
- **API Gateway**: Rate limiting and API management
- **ECS Fargate**: Alternative deployment option if outgrowing Elastic Beanstalk
- **CloudWatch Advanced**: Custom dashboards and detailed performance metrics
- **Elastic Load Balancer**: Load balancing for the application (if needed)
- **Route 53**: Domain name management (optional)

### 1.2 Configure IAM Permissions
Create an IAM user or role with the following permissions based on your priority:

#### Must-Have Permissions (Priority 1)
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "elasticbeanstalk:*",
                "s3:*",
                "rds:*",
                "cloudwatch:*"
            ],
            "Resource": "*"
        }
    ]
}
```

#### Good-to-Have Permissions (Priority 2)
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "apigateway:*",
                "ecs:*",
                "elasticloadbalancing:*",
                "route53:*"
            ],
            "Resource": "*"
        }
    ]
}
```

## 🗄️ **Step 2: MySQL RDS Setup**

### 2.1 Create MySQL RDS Instance
Create a MySQL RDS instance for alumni data storage:

**RDS Configuration:**
- **Engine**: MySQL 8.0
- **Instance Class**: db.t3.micro (for development)
- **Storage**: 20 GB General Purpose SSD
- **Multi-AZ**: Disabled (for development)
- **Public Access**: No (security best practice)

### 2.2 Configure Database Schema
Create the required database schema:

```sql
-- Create database
CREATE DATABASE sgsbg_app_db;

-- Use the database
USE sgsbg_app_db;

-- Create the main table for CSV uploads
CREATE TABLE raw_csv_uploads (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  File_name VARCHAR(255) NOT NULL,
  Description TEXT,
  Source VARCHAR(100),
  Category VARCHAR(100),
  Format VARCHAR(50),
  ROW_DATA JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_category ON raw_csv_uploads(Category);
CREATE INDEX idx_source ON raw_csv_uploads(Source);
CREATE INDEX idx_file_name ON raw_csv_uploads(File_name);
```

## 📁 **Step 3: S3 File Storage Setup**

### 3.1 Create S3 Buckets for File Storage
Create S3 buckets for different types of user-generated content:

**Bucket Configuration:**
- **Bucket 1**: `sgs-alumni-profile-pictures` - For user profile pictures and avatars
- **Bucket 2**: `sgs-alumni-attachments` - For file attachments and documents
- **Bucket 3**: `sgs-alumni-social-content` - For social posts related media content

### 3.2 Configure S3 Bucket Policies
Set up bucket policies for secure file access:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowElasticBeanstalkAccess",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::ACCOUNT-ID:role/aws-elasticbeanstalk-ec2-role"
            },
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::sgs-alumni-profile-pictures/*",
                "arn:aws:s3:::sgs-alumni-attachments/*",
                "arn:aws:s3:::sgs-alumni-social-content/*"
            ]
        }
    ]
}
```

### 3.3 Configure CORS for S3 Buckets
Enable CORS for frontend file uploads:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["POST", "GET", "PUT"],
        "AllowedOrigins": ["https://yourdomain.com"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

### 3.4 S3 File Upload Configuration
Update your environment variables for S3 integration:

```env
# S3 Configuration
S3_BUCKET_PROFILE_PICTURES=sgs-alumni-profile-pictures
S3_BUCKET_ATTACHMENTS=sgs-alumni-attachments
S3_BUCKET_SOCIAL_CONTENT=sgs-alumni-social-content
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key

# File Upload Limits
MAX_FILE_SIZE_PROFILE=5MB
MAX_FILE_SIZE_ATTACHMENTS=10MB
MAX_FILE_SIZE_SOCIAL=15MB

# Allowed File Types
ALLOWED_PROFILE_TYPES=image/jpeg,image/png,image/gif,image/webp
ALLOWED_ATTACHMENT_TYPES=application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain
ALLOWED_SOCIAL_TYPES=image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime
```

## 🌐 **Step 4: Domain and SSL Setup**

### 4.1 Domain Configuration
Set up custom domain for your application:

**Option 1: Route 53 (Recommended)**
1. Go to AWS Route 53 Console
2. Create a hosted zone for your domain
3. Update your domain's nameservers with your registrar
4. Create DNS records for your application

**Option 2: External Domain Registrar**
1. Get your domain from registrar (GoDaddy, Namecheap, etc.)
2. Create CNAME record pointing to your Elastic Beanstalk URL
3. Configure SSL certificate (see SSL setup below)

### 4.2 SSL/TLS Certificate Configuration
Enable HTTPS for secure communication:

**Using AWS Certificate Manager (ACM):**
```bash
# Request SSL certificate for your domain
aws acm request-certificate \
    --domain-name yourdomain.com \
    --validation-method DNS \
    --region us-east-1

# Add validation record to Route 53
aws route53 change-resource-record-sets \
    --hosted-zone-id YOUR_HOSTED_ZONE_ID \
    --change-batch file://validation-record.json
```

**Environment Variables for SSL:**
```env
# SSL Configuration
SSL_CERTIFICATE_ARN=arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT_ID
SSL_KEY_ARN=arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT_ID
NODE_ENV=production
HTTPS=true
```

## 🔒 **Step 5: Advanced Security Configurations**

### 5.1 Security Groups and Network Configuration
Configure security groups for secure access:

**Elastic Beanstalk Security Group:**
- Allow inbound HTTP (port 80) from Load Balancer
- Allow inbound HTTPS (port 443) from Load Balancer
- Allow outbound to RDS and S3

**RDS Security Group:**
- Allow inbound MySQL (port 3306) from Elastic Beanstalk instances
- Restrict to specific IP ranges if needed

**S3 Bucket Policy:**
- Allow access from Elastic Beanstalk instances only
- Deny public access to sensitive buckets

### 5.2 Data Protection and Privacy
Implement user privacy and data security measures:

**Database Security:**
```sql
-- Encrypt sensitive data at rest
ALTER TABLE raw_csv_uploads ADD COLUMN encrypted_data LONGBLOB;
UPDATE raw_csv_uploads SET encrypted_data = AES_ENCRYPT(ROW_DATA, 'your-encryption-key');

-- Create user privacy tracking
CREATE TABLE user_privacy_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255),
  action VARCHAR(100),
  resource VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);
```

**Application Security:**
```typescript
// Security middleware configuration
const securityConfig = {
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://your-api-domain.com"]
      }
    }
  },
  cors: {
    origin: process.env.FRONTEND_URL || "https://yourdomain.com",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later"
  }
};
```

### 5.3 User Privacy Protection
Implement privacy-focused features:

**Data Minimization:**
- Collect only necessary user data
- Implement data retention policies
- Provide data export/delete functionality

**Access Controls:**
- Role-based access control (RBAC)
- API authentication and authorization
- Secure file access with presigned URLs

**Audit Logging:**
- Track all data access and modifications
- Log security events and authentication attempts
- Monitor for suspicious activities

## 🔐 **Step 3: Configure AWS Credentials**

### 3.1 Update `.env.local` File
Configure database and AWS credentials for development:

```env
# Database Configuration
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_USER=your-db-username
DB_PASSWORD=your-db-password
DB_NAME=sgsbg_app_db
DB_PORT=3306

# AWS Configuration for DEV Environment
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=your-access-key-id
VITE_AWS_SECRET_ACCESS_KEY=your-secret-access-key
VITE_ENVIRONMENT=development

# Application Configuration
NODE_ENV=development
PORT=3001
```

### 3.2 Security Best Practices
- ✅ Use IAM roles instead of access keys in production
- ✅ Implement least-privilege access policies
- ✅ Rotate credentials regularly
- ✅ Use AWS Secrets Manager for sensitive data
- ❌ Never commit AWS credentials to version control
- ❌ Never use root AWS account credentials

## 🧪 **Step 4: Test the Integration**

### 4.1 Start the Development Server
```bash
npm run dev
```

### 4.2 Verify AWS Configuration
1. Open browser console in the admin page
2. Look for database connection status messages
3. If configured correctly, you'll see successful API calls to the backend

### 4.3 Test Application Services
Verify each service is working:
- **MySQL RDS**: Database connection and queries
- **Express.js Backend**: API endpoints responding
- **Elastic Beanstalk**: Application deployment and scaling
- **Load Balancer**: Traffic distribution

## 🔍 **Troubleshooting**

### Common Issues

#### ❌ "AWS not configured" Error
- Check if `.env.local` file exists
- Verify all AWS environment variables are set
- Ensure Vite server is restarted after changing `.env.local`

#### ❌ "AWS Connection failed" Error
- Verify AWS credentials are correct and have proper permissions
- Check if AWS services are accessible from your network
- Ensure IAM user/role has the required permissions

#### ❌ "Database Connection Failed" Error
- Verify RDS instance is running and accessible
- Check database credentials and endpoint
- Ensure security groups allow database connections
- Verify database name and table exist

### Debug Commands
```bash
# Check environment variables
echo $DB_HOST
echo $VITE_AWS_REGION

# Test AWS credentials
aws sts get-caller-identity

# Check RDS instances
aws rds describe-db-instances --region us-east-1

# Check Elastic Beanstalk applications
aws elasticbeanstalk describe-applications --region us-east-1

# Check database connectivity
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "SELECT 1;"

# Check application logs
aws logs tail /aws/elasticbeanstalk/application-name --follow
```

## 📊 **Monitoring & Costs**

### CloudWatch Setup
1. Go to AWS CloudWatch Console
2. Set up basic monitoring for Elastic Beanstalk and RDS
3. Create alarms for CPU usage, database connections, and errors
4. Set up log groups for application logs

### Cost Optimization
- Use RDS t3.micro instance for development
- Set up billing alerts for RDS and Elastic Beanstalk
- Clean up unused resources regularly
- Monitor data transfer costs

## 🚀 **Next Steps**

### For Production
1. **Database Optimization**: Upgrade RDS instance type for production
2. **Auto Scaling**: Configure auto-scaling groups for Elastic Beanstalk
3. **Security**: Use IAM roles instead of access keys
4. **SSL/TLS**: Configure HTTPS with SSL certificates
5. **Monitoring**: Set up comprehensive CloudWatch dashboards

### Deployment Path
```
DEV (Current) → STAGING → PRODUCTION
Local MySQL   → RDS MySQL → RDS MySQL (Multi-AZ)
Express.js    → Elastic Beanstalk → Load Balanced
Access Keys   → IAM Roles → Secure Tokens
```

## 📞 **Support**

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify AWS credentials and permissions
3. Ensure all AWS services are properly configured
4. Review the troubleshooting section above
5. Check AWS service health status

## 🔒 **Security Checklist**

### Must-Have Security (Priority 1)
- [ ] AWS credentials stored securely (not in code)
- [ ] IAM roles/users have minimal required permissions
- [ ] RDS database has proper security groups and encryption
- [ ] S3 buckets configured with private access and secure policies
- [ ] Elastic Beanstalk environment security configured
- [ ] Database credentials properly encrypted
- [ ] Environment variables properly configured
- [ ] CloudWatch logging enabled for monitoring
- [ ] SSL/TLS encryption enabled for database connections
- [ ] Network security groups properly configured

### User Privacy Protection (Priority 1)
- [ ] Data minimization policies implemented
- [ ] User data retention policies defined
- [ ] Privacy audit logging configured
- [ ] Secure file access with presigned URLs
- [ ] Role-based access control (RBAC) implemented
- [ ] API authentication and authorization configured
- [ ] CORS properly configured for frontend access
- [ ] Security event monitoring and alerting

### Good-to-Have Security (Priority 2)
- [ ] Regular credential rotation planned
- [ ] Advanced security monitoring with custom dashboards
- [ ] Security automation and alerting rules
- [ ] Regular security assessments and penetration testing
- [ ] Compliance validation (GDPR, CCPA, etc.)

---

**🎉 You're now ready for AWS deployment!**

The application is designed for seamless deployment to AWS using Elastic Beanstalk and MySQL RDS, providing a robust and scalable production environment.