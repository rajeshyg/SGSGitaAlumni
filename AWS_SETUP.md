# MySQL Database Setup Guide for SGS Alumni Application

## 🚀 **Quick Start**

This guide will help you set up MySQL database connection to replace the mock data with real database integration.

## 📋 **Prerequisites**

- MySQL database server (local or remote)
- Database access credentials
- Node.js and npm installed
- Basic knowledge of MySQL databases

## 🔧 **Step 1: Database Access Setup**

### 1.1 Verify Database Connection
You should have received these MySQL credentials:
- **Host**: `sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com`
- **User**: `sgsgita_alumni_user`
- **Password**: `2FvT6j06sfI`
- **Database**: `sgs_alumni_db`
- **Port**: `3306`

### 1.2 Test Database Connection (Optional)
You can test the connection using MySQL client:
```bash
mysql -h sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com \
      -u sgsgita_alumni_user \
      -p sgs_alumni_db
```

## 🗄️ **Step 2: Database Table Structure**

### 2.1 Required Table Schema
The application expects a `file_imports` table with the following structure:

```sql
CREATE TABLE file_imports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  upload_date DATETIME NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed') NOT NULL,
  records_count INT NOT NULL DEFAULT 0,
  processed_records INT NOT NULL DEFAULT 0,
  errors_count INT NOT NULL DEFAULT 0,
  uploaded_by VARCHAR(100) NOT NULL,
  file_size VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2.2 Verify Table Exists
Check if the table exists in your database:
```sql
SHOW TABLES LIKE 'file_imports';
DESCRIBE file_imports;
```

## 🔐 **Step 3: Configure Environment Variables**

### 3.1 Update `.env.local` File
The `.env.local` file should already contain your MySQL credentials:

```env
# MySQL Database Configuration for DEV Environment
VITE_DB_HOST=sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com
VITE_DB_USER=sgsgita_alumni_user
VITE_DB_PASSWORD=2FvT6j06sfI
VITE_DB_NAME=sgs_alumni_db
VITE_DB_PORT=3306
VITE_ENVIRONMENT=development
```

### 3.2 Security Best Practices
- ✅ Use `.env.local` (not committed to git)
- ✅ Use database user with minimal permissions
- ✅ Rotate database credentials regularly
- ❌ Never use root database credentials
- ❌ Never commit credentials to version control

## 🧪 **Step 4: Test the Integration**

### 4.1 Start the Development Server
```bash
npm run dev
```

### 4.2 Check MySQL Configuration
1. Open browser console in the admin page
2. Look for MySQL configuration status messages
3. If configured correctly, you'll see data loading from your MySQL database

### 4.3 Add Test Data (Optional)
You can manually add test data to MySQL:

```sql
INSERT INTO file_imports
(filename, file_type, upload_date, status, records_count, processed_records, errors_count, uploaded_by, file_size)
VALUES
('alumni_test.csv', 'CSV', NOW(), 'completed', 100, 100, 0, 'admin', '1.2MB');
```

## 🔍 **Troubleshooting**

### Common Issues

#### ❌ "MySQL not configured" Error
- Check if `.env.local` file exists
- Verify all MySQL environment variables are set
- Ensure Vite server is restarted after changing `.env.local`

#### ❌ "Connection failed" Error
- Verify database credentials are correct
- Check if database server is accessible
- Ensure database user has proper permissions

#### ❌ "Table not found" Error
- Verify `file_imports` table exists in the database
- Check if table schema matches the expected structure
- Ensure database user has SELECT permissions on the table

### Debug Commands
```bash
# Check environment variables
echo $VITE_DB_HOST

# Test MySQL connection (if MySQL client installed)
mysql -h sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com \
      -u sgsgita_alumni_user \
      -p sgs_alumni_db \
      -e "SHOW TABLES;"

# Check table structure
mysql -h sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com \
      -u sgsgita_alumni_user \
      -p sgs_alumni_db \
      -e "DESCRIBE file_imports;"
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