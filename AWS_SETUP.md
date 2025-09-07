# AWS Setup Guide for SGS Alumni Application

## 🚀 **Quick Start**

This guide will help you set up AWS services to replace the mock data with real AWS integration.

## 📋 **Prerequisites**

- AWS Account with appropriate permissions
- Node.js and npm installed
- Basic knowledge of AWS IAM and DynamoDB

## 🔧 **Step 1: AWS Account Setup**

### 1.1 Create AWS Account
If you don't have an AWS account:
1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account"
3. Follow the registration process

### 1.2 Create IAM User for Development
1. Go to AWS IAM Console
2. Create a new user with programmatic access
3. Attach the following managed policies:
   - `AmazonDynamoDBFullAccess`
   - `AmazonS3FullAccess` (optional, for file uploads)

### 1.3 Get Your Credentials
After creating the IAM user, you'll get:
- **Access Key ID**
- **Secret Access Key**

⚠️ **Important**: Never commit these credentials to version control!

## 🗄️ **Step 2: Set Up DynamoDB Table**

### 2.1 Create DynamoDB Table
1. Go to AWS DynamoDB Console
2. Click "Create table"
3. Configure:
   - **Table name**: `sgs-alumni-file-imports-dev`
   - **Partition key**: `id` (String)
   - **Settings**: Use default settings for development

### 2.2 Table Schema
The table will store file import records with the following structure:

```json
{
  "id": "string (partition key)",
  "filename": "string",
  "file_type": "string",
  "upload_date": "string (ISO 8601)",
  "status": "string (pending|processing|completed|failed)",
  "records_count": "number",
  "processed_records": "number",
  "errors_count": "number",
  "uploaded_by": "string",
  "file_size": "string",
  "created_at": "string (ISO 8601)",
  "updated_at": "string (ISO 8601)"
}
```

## 🔐 **Step 3: Configure Environment Variables**

### 3.1 Update `.env.local` File
Replace the placeholder values in `.env.local` with your actual AWS credentials:

```env
# AWS Configuration for DEV Environment
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=your-actual-access-key-id
VITE_AWS_SECRET_ACCESS_KEY=your-actual-secret-access-key
VITE_DYNAMODB_TABLE_NAME=sgs-alumni-file-imports-dev
VITE_S3_BUCKET_NAME=sgs-alumni-uploads-dev
VITE_ENVIRONMENT=development
```

### 3.2 Security Best Practices
- ✅ Use `.env.local` (not committed to git)
- ✅ Use IAM user with minimal permissions
- ✅ Rotate credentials regularly
- ❌ Never use root account credentials
- ❌ Never commit credentials to version control

## 🧪 **Step 4: Test the Integration**

### 4.1 Start the Development Server
```bash
npm run dev
```

### 4.2 Check AWS Configuration
1. Open browser console in the admin page
2. Look for AWS configuration status messages
3. If configured correctly, you'll see data loading from DynamoDB

### 4.3 Add Test Data (Optional)
You can manually add test data to DynamoDB:

```json
{
  "id": "test_001",
  "filename": "alumni_test.csv",
  "file_type": "CSV",
  "upload_date": "2024-01-15T10:30:00Z",
  "status": "completed",
  "records_count": 100,
  "processed_records": 100,
  "errors_count": 0,
  "uploaded_by": "admin",
  "file_size": "1.2MB",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

## 🔍 **Troubleshooting**

### Common Issues

#### ❌ "AWS not configured" Error
- Check if `.env.local` file exists
- Verify all environment variables are set
- Ensure Vite server is restarted after changing `.env.local`

#### ❌ "Access Denied" Error
- Verify IAM user has correct permissions
- Check if credentials are correct
- Ensure DynamoDB table exists in the correct region

#### ❌ "Table not found" Error
- Verify table name matches `VITE_DYNAMODB_TABLE_NAME`
- Check if table exists in the correct AWS region
- Ensure IAM user has DynamoDB permissions

### Debug Commands
```bash
# Check environment variables
echo $VITE_AWS_REGION

# Test AWS CLI (if installed)
aws dynamodb list-tables --region us-east-1
```

## 📊 **Monitoring & Costs**

### CloudWatch Setup
1. Go to AWS CloudWatch Console
2. Set up basic monitoring for DynamoDB
3. Create alarms for unusual activity

### Cost Optimization
- Use DynamoDB on-demand pricing for development
- Set up billing alerts
- Clean up unused resources regularly

## 🚀 **Next Steps**

### For Production
1. **Replace Direct SDK Calls**: Move to API Gateway + Lambda
2. **Add Authentication**: Implement AWS Cognito
3. **Security**: Use IAM roles instead of access keys
4. **Monitoring**: Set up comprehensive CloudWatch dashboards

### Migration Path
```
DEV (Current) → STAGING → PRODUCTION
Direct SDK     → API Gateway  → Cognito Auth
Access Keys    → IAM Roles    → Secure Tokens
```

## 📞 **Support**

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify AWS credentials and permissions
3. Ensure DynamoDB table exists and is accessible
4. Review the troubleshooting section above

## 🔒 **Security Checklist**

- [ ] AWS credentials stored securely (not in code)
- [ ] IAM user has minimal required permissions
- [ ] DynamoDB table has proper access controls
- [ ] Environment variables properly configured
- [ ] No sensitive data logged in browser console
- [ ] Regular credential rotation planned

---

**🎉 You're now ready to use real AWS services instead of mock data!**

The application will automatically detect your AWS configuration and start using DynamoDB for data storage.