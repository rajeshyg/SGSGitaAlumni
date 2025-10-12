# Admin Credentials for Testing

**IMPORTANT: These are development/testing credentials only. DO NOT use in production.**

---

## Default Admin Account

### Credentials
- **Email**: `datta.rajesh@gmail.com`
- **Password**: `Admin@123!`
- **Role**: `admin`

### Database Setup
The admin user is created automatically in the database with the following script:
```bash
node test-admin.js
```

---

## Test Scripts Using Admin Credentials

All test scripts use the admin credentials by default:

1. **test-simple-otp.ps1** - Simple OTP login test
2. **test-otp-navigation.ps1** - Full OTP navigation flow test
3. **clear-admin-otp.js** - Clear OTP tokens for admin email

---

## Changing Admin Credentials

If you need to change the admin credentials:

1. **Update the database**:
   ```sql
   UPDATE app_users 
   SET email = 'your-new-email@example.com',
       password_hash = 'new-bcrypt-hash'
   WHERE email = 'datta.rajesh@gmail.com';
   ```

2. **Update test scripts**:
   - `test-simple-otp.ps1` - Update `$TEST_EMAIL`
   - `test-otp-navigation.ps1` - Update `$TEST_EMAIL`
   - `clear-admin-otp.js` - Update email in `clearOTPForEmail()`

3. **Update documentation**:
   - This file (`ADMIN_CREDENTIALS.md`)
   - `README.md` testing section
   - Any other relevant documentation

---

## Security Notes

⚠️ **IMPORTANT SECURITY REMINDERS**:

1. **Never commit production credentials** to version control
2. These credentials are for **development/testing only**
3. Change default credentials before deploying to production
4. Use environment variables for production credentials
5. Enable MFA/2FA for production admin accounts
6. Regularly rotate production credentials
7. Monitor admin account usage and audit logs

---

## Production Setup

For production environments:

1. Create a new admin account with a strong, unique password
2. Store credentials in a secure password manager
3. Use environment variables or secrets management (e.g., AWS Secrets Manager)
4. Enable multi-factor authentication
5. Set up proper access controls and audit logging
6. Never use these testing credentials

---

**Last Updated**: October 11, 2025
