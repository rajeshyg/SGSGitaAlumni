# AWS Deployment Setup Guide for SGS Alumni Application

## 🚀 **Overview**

This guide outlines the AWS deployment strategy for migrating from the current simplified architecture to a cloud-native solution using AWS services.

## 📋 **Prerequisites**

- AWS Account with appropriate permissions
- Node.js and npm installed
- Basic knowledge of AWS services (Lambda, API Gateway, DynamoDB, Cognito)
- Understanding of serverless architecture patterns

## 🔧 **Step 1: AWS Services Setup**

### 1.1 Create Required AWS Services
Set up the following AWS services in your account:
- **API Gateway**: REST API for frontend-backend communication
- **Lambda Functions**: Serverless compute for business logic
- **DynamoDB Table**: NoSQL database for data storage
- **Cognito User Pool**: User authentication and authorization
- **CloudWatch**: Monitoring and logging

### 1.2 Configure IAM Permissions
Create an IAM user or role with the following permissions:
- `lambda:*` - Lambda function management
- `apigateway:*` - API Gateway management
- `dynamodb:*` - DynamoDB table operations
- `cognito-idp:*` - Cognito user pool management
- `logs:*` - CloudWatch logging

## 🗄️ **Step 2: DynamoDB Table Setup**

### 2.1 Create DynamoDB Table
Create a DynamoDB table for alumni data storage:

```json
{
  "TableName": "AlumniData",
  "KeySchema": [
    {
      "AttributeName": "id",
      "KeyType": "HASH"
    }
  ],
  "AttributeDefinitions": [
    {
      "AttributeName": "id",
      "AttributeType": "S"
    }
  ],
  "BillingMode": "PAY_PER_REQUEST"
}
```

### 2.2 Configure Global Secondary Indexes (Optional)
Add GSI for search functionality:
```json
{
  "IndexName": "NameIndex",
  "KeySchema": [
    {
      "AttributeName": "lastName",
      "KeyType": "HASH"
    }
  ],
  "Projection": {
    "ProjectionType": "ALL"
  }
}
```

## 🔐 **Step 3: Configure AWS Credentials**

### 3.1 Update `.env.local` File
Configure AWS credentials for development:

```env
# AWS Configuration for DEV Environment
VITE_AWS_REGION=us-east-1
VITE_AWS_ACCESS_KEY_ID=your-access-key-id
VITE_AWS_SECRET_ACCESS_KEY=your-secret-access-key
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_ENVIRONMENT=development
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
2. Look for AWS configuration status messages
3. If configured correctly, you'll see successful API calls to AWS services

### 4.3 Test AWS Services
Verify each service is working:
- **DynamoDB**: Data operations (create, read, update, delete)
- **Cognito**: User authentication flows
- **API Gateway**: REST API endpoints responding
- **Lambda**: Serverless functions executing

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

#### ❌ "DynamoDB Table not found" Error
- Verify DynamoDB table exists in the correct region
- Check if table name matches the expected configuration
- Ensure IAM user has DynamoDB permissions

### Debug Commands
```bash
# Check environment variables
echo $VITE_AWS_REGION

# Test AWS credentials
aws sts get-caller-identity

# List DynamoDB tables
aws dynamodb list-tables --region us-east-1

# Describe DynamoDB table
aws dynamodb describe-table --table-name AlumniData --region us-east-1

# Check Cognito user pool
aws cognito-idp describe-user-pool --user-pool-id your-user-pool-id
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
3. Ensure all AWS services are properly configured
4. Review the troubleshooting section above
5. Check AWS service health status

## 🔒 **Security Checklist**

- [ ] AWS credentials stored securely (not in code)
- [ ] IAM roles/users have minimal required permissions
- [ ] DynamoDB table has proper access controls
- [ ] Cognito user pool properly configured
- [ ] API Gateway has appropriate security settings
- [ ] Environment variables properly configured
- [ ] CloudWatch logging enabled for monitoring
- [ ] Regular credential rotation planned

---

**🎉 You're now ready for AWS deployment!**

The application is designed for seamless migration from the current simplified architecture to a full AWS serverless deployment.