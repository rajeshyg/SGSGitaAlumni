# Passwordless OTP Authentication - Continuation Context

## 📋 Session Resumption Information
**Date Created:** October 11, 2025
**Current Branch:** `feature/task-7.1-api-integration-foundation`
**Status:** Invitation acceptance working; OTP verification NOT yet implemented
**Next Task:** Complete passwordless authentication with OTP after invitation acceptance

---

## 🎯 Current State Summary

### ✅ What's Working
1. **Invitation System**
   - Admin can create invitations from admin panel
   - Invitations stored in `USER_INVITATIONS` table
   - Frontend displays invitation URL: `http://localhost:5173/invitation/{token}`
   - Invitation validation endpoint: `GET /api/invitations/validate/:token`
   - Invitation validation resolves (no more connection leaks)

2. **Invitation Acceptance Flow (Partial)**
   - User clicks invitation link
   - Frontend loads `InvitationAcceptancePage.tsx`
   - Page validates token via API
   - Shows "Join Alumni Network" button
   - Button triggers registration

3. **User Registration (Basic)**
   - `POST /api/auth/register-from-invitation` endpoint exists
   - Creates user in `app_users` table
   - Updates invitation status to 'accepted'
   - Returns user object on success

### ❌ What's NOT Implemented
1. **OTP Generation & Sending**
   - After successful registration, user should receive OTP
   - OTP should be sent to registered email
   - OTP should be stored in `OTP_TOKENS` table

2. **OTP Verification Page**
   - User should be redirected to OTP verification page
   - Page should accept OTP code input
   - Should validate OTP against database
   - Should complete authentication on success

3. **Email Service Integration**
   - No email sending functionality implemented
   - OTP delivery mechanism not configured
   - Email templates for OTP not created

4. **Session Management**
   - After OTP verification, user should be logged in
   - JWT tokens should be issued
   - User should be redirected to dashboard

---

## 📂 Relevant File Locations

### Frontend Files
```
src/
├── pages/
│   ├── InvitationAcceptancePage.tsx   ✅ Exists - Handles invitation acceptance
│   └── OTPVerificationPage.tsx        ❓ May exist but not integrated
│
├── services/
│   └── APIService.ts                  ✅ Exists - Has registerFromInvitation()
│
├── contexts/
│   └── AuthContext.tsx                ✅ Exists - Manages authentication state
│
└── App.tsx                            ✅ Exists - Has route: /verify-otp/:email?
```

### Backend Files
```
routes/
└── auth.js                            ✅ Exists - Has registerFromInvitation()

src/services/
├── StreamlinedRegistrationService.js  ✅ Exists - Registration logic
└── AlumniDataIntegrationService.js    ✅ Exists - Alumni data fetching

utils/
└── database.js                        ✅ Exists - Database connection pool

middleware/
└── auth.js                            ✅ Exists - JWT authentication
```

### Database Tables
```sql
-- User storage
app_users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  alumni_member_id INT,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  status ENUM('active', 'inactive'),
  email_verified BOOLEAN,
  email_verified_at DATETIME,
  created_at DATETIME,
  updated_at DATETIME
)

-- OTP tokens
OTP_TOKENS (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36),            -- FK to app_users.id
  email VARCHAR(255),
  otp_code VARCHAR(10),
  purpose ENUM('login', 'registration', 'password_reset'),
  expires_at DATETIME,
  is_used BOOLEAN DEFAULT 0,
  used_at DATETIME,
  created_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES app_users(id)
)

-- Invitations
USER_INVITATIONS (
  id VARCHAR(36) PRIMARY KEY,
  invitation_token VARCHAR(255) UNIQUE,
  email VARCHAR(255),
  alumni_member_id INT,
  invited_by INT,
  invitation_type ENUM('alumni', 'family'),
  status ENUM('pending', 'accepted', 'expired', 'revoked'),
  completion_status ENUM('pending', 'completed'),
  is_used BOOLEAN DEFAULT 0,
  user_id VARCHAR(36),           -- Set after registration
  expires_at DATETIME,
  sent_at DATETIME,
  used_at DATETIME,
  created_at DATETIME,
  updated_at DATETIME
)
```

---

## 🔄 Expected Flow (Complete)

### Step 1: Invitation Creation (✅ Working)
```
Admin Panel → Create Invitation → Store in DB → Generate Invitation URL
```

### Step 2: Invitation Acceptance (✅ Working)
```
User clicks link
  → Frontend validates token
  → Shows "Join Alumni Network" button
  → User clicks button
  → POST /api/auth/register-from-invitation
  → User created in app_users
  → Invitation marked as accepted
```

### Step 3: OTP Generation (❌ NOT Implemented)
```javascript
// AFTER user creation in registerFromInvitation()
// NEEDS TO BE ADDED:

// 1. Generate 6-digit OTP code
const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

// 2. Store in OTP_TOKENS table
await connection.execute(`
  INSERT INTO OTP_TOKENS (
    user_id, email, otp_code, purpose, 
    expires_at, created_at
  ) VALUES (?, ?, ?, 'registration', DATE_ADD(NOW(), INTERVAL 15 MINUTE), NOW())
`, [userId, email, otpCode]);

// 3. Send OTP via email
await emailService.sendOTP({
  to: email,
  otpCode: otpCode,
  expiresInMinutes: 15
});

// 4. Return response with redirect info
return {
  success: true,
  message: 'Registration successful. Please check your email for OTP.',
  redirectTo: `/verify-otp/${email}`,
  userId: userId
};
```

### Step 4: OTP Verification Page (❌ NOT Implemented)
```javascript
// OTPVerificationPage.tsx NEEDS:

const handleVerifyOTP = async (otpCode) => {
  try {
    // Call API to verify OTP
    const response = await APIService.verifyOTP({
      email: emailFromRoute,
      otpCode: otpCode
    });
    
    // If successful, login user
    if (response.success) {
      // Store JWT tokens
      authContext.login(response.token, response.refreshToken);
      
      // Redirect to dashboard
      navigate('/dashboard');
    }
  } catch (error) {
    // Show error message
    setError('Invalid or expired OTP');
  }
};
```

### Step 5: OTP Verification API (❌ NOT Implemented)
```javascript
// routes/auth.js NEEDS NEW ENDPOINT:

export const verifyOTP = async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    
    // 1. Find valid OTP in database
    const [otpRows] = await pool.execute(`
      SELECT ot.*, u.id as user_id, u.role, u.email
      FROM OTP_TOKENS ot
      JOIN app_users u ON ot.user_id = u.id
      WHERE ot.email = ? 
        AND ot.otp_code = ?
        AND ot.is_used = 0
        AND ot.expires_at > NOW()
        AND ot.purpose = 'registration'
      ORDER BY ot.created_at DESC
      LIMIT 1
    `, [email, otpCode]);
    
    if (otpRows.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid or expired OTP' 
      });
    }
    
    const otpRecord = otpRows[0];
    
    // 2. Mark OTP as used
    await pool.execute(`
      UPDATE OTP_TOKENS 
      SET is_used = 1, used_at = NOW() 
      WHERE id = ?
    `, [otpRecord.id]);
    
    // 3. Mark email as verified
    await pool.execute(`
      UPDATE app_users 
      SET email_verified = 1, email_verified_at = NOW() 
      WHERE id = ?
    `, [otpRecord.user_id]);
    
    // 4. Generate JWT tokens
    const tokenPayload = {
      userId: otpRecord.user_id,
      email: otpRecord.email,
      role: otpRecord.role
    };
    
    const token = jwt.sign(tokenPayload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN 
    });
    
    const refreshToken = jwt.sign(
      { userId: otpRecord.user_id }, 
      JWT_SECRET, 
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );
    
    // 5. Return tokens
    res.json({
      success: true,
      token,
      refreshToken,
      expiresIn: 3600,
      user: {
        id: otpRecord.user_id,
        email: otpRecord.email,
        role: otpRecord.role
      }
    });
    
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
};
```

---

## 🔧 Implementation Tasks

### Task 1: Email Service Setup
**Priority:** HIGH
**Files to Create/Modify:**
- `utils/emailService.js` - Email sending utilities

**Requirements:**
- Configure email provider (AWS SES, SendGrid, or SMTP)
- Create OTP email template
- Implement `sendOTP(to, otpCode, expiresInMinutes)` function

**Example Implementation:**
```javascript
// utils/emailService.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

export const sendOTP = async ({ to, otpCode, expiresInMinutes }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: to,
    subject: 'Your SGS Gita Alumni Verification Code',
    html: `
      <h2>Welcome to SGS Gita Alumni Network!</h2>
      <p>Your verification code is:</p>
      <h1 style="font-size: 32px; letter-spacing: 5px;">${otpCode}</h1>
      <p>This code will expire in ${expiresInMinutes} minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    `
  };
  
  return await transporter.sendMail(mailOptions);
};
```

### Task 2: Modify registerFromInvitation Endpoint
**Priority:** HIGH
**File:** `routes/auth.js`
**Location:** Around line 276 (after user creation)

**Changes Needed:**
1. Import email service
2. Generate OTP code after user creation
3. Store OTP in database
4. Send OTP email
5. Return redirect URL instead of immediate success

**Code to Add:**
```javascript
// After user creation (around line 310 in routes/auth.js)

// Generate OTP
const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

// Store OTP
await pool.execute(`
  INSERT INTO OTP_TOKENS (
    user_id, email, otp_code, purpose, 
    expires_at, created_at
  ) VALUES (?, ?, ?, 'registration', ?, NOW())
`, [user.id, user.email, otpCode, expiresAt]);

// Send OTP email
try {
  await emailService.sendOTP({
    to: user.email,
    otpCode: otpCode,
    expiresInMinutes: 15
  });
} catch (emailError) {
  console.error('Failed to send OTP email:', emailError);
  // Continue anyway - user can request resend
}

// Return with OTP verification redirect
res.status(201).json({
  success: true,
  message: 'Registration successful. Please check your email for verification code.',
  requiresOTP: true,
  redirectTo: `/verify-otp/${encodeURIComponent(user.email)}`,
  user: {
    id: user.id,
    email: user.email
  }
});
```

### Task 3: Create verifyOTP Endpoint
**Priority:** HIGH
**File:** `routes/auth.js`
**Location:** Add new exported function

**Implementation:** (See "Step 5: OTP Verification API" above)

**Register Route:**
```javascript
// In server.js
app.post('/api/auth/verify-otp', verifyOTP);
```

### Task 4: Update Frontend - InvitationAcceptancePage
**Priority:** HIGH
**File:** `src/pages/InvitationAcceptancePage.tsx`

**Changes Needed:**
```typescript
// Update handleJoinAlumniNetwork function
const handleJoinAlumniNetwork = async () => {
  try {
    setIsSubmitting(true);
    
    const response = await APIService.registerFromInvitation({
      invitationToken: token,
      additionalData: {}
    });
    
    // Check if OTP verification required
    if (response.requiresOTP && response.redirectTo) {
      // Redirect to OTP verification page
      navigate(response.redirectTo);
    } else {
      // Old flow (shouldn't happen with new implementation)
      navigate('/login');
    }
    
  } catch (error) {
    console.error('Registration failed:', error);
    setError('Failed to complete registration. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

### Task 5: Implement OTPVerificationPage
**Priority:** HIGH
**File:** `src/pages/OTPVerificationPage.tsx` (may already exist)

**Required Features:**
- 6-digit OTP input field
- Email display (from route parameter)
- "Verify" button
- "Resend OTP" button (optional)
- Error message display
- Loading state during verification

**Example Implementation:**
```typescript
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import APIService from '../services/APIService';

export function OTPVerificationPage() {
  const { email } = useParams<{ email: string }>();
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    
    try {
      setIsVerifying(true);
      setError('');
      
      const response = await APIService.verifyOTP({
        email: decodeURIComponent(email || ''),
        otpCode
      });
      
      // Login user with returned tokens
      await login(response.token, response.refreshToken);
      
      // Redirect to dashboard
      navigate('/dashboard');
      
    } catch (error: any) {
      setError(error.message || 'Invalid or expired OTP');
    } finally {
      setIsVerifying(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Verify Your Email</h2>
        <p className="text-gray-600 mb-6">
          We've sent a verification code to <strong>{email}</strong>
        </p>
        
        <form onSubmit={handleVerifyOTP}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Verification Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-2 border rounded-lg text-center text-2xl letter-spacing-wide"
              placeholder="000000"
              autoFocus
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isVerifying || otpCode.length !== 6}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isVerifying ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button className="text-blue-600 hover:underline">
            Resend Code
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Task 6: Add APIService Methods
**Priority:** HIGH
**File:** `src/services/APIService.ts`

**Methods to Add:**
```typescript
async verifyOTP(data: { email: string; otpCode: string }) {
  console.log('[APIService] Verifying OTP for:', data.email);
  
  const response = await this.apiClient.post('/api/auth/verify-otp', data);
  
  console.log('[APIService] OTP verification successful');
  return response;
}

async resendOTP(email: string) {
  console.log('[APIService] Requesting OTP resend for:', email);
  
  const response = await this.apiClient.post('/api/auth/resend-otp', { email });
  
  console.log('[APIService] OTP resend successful');
  return response;
}
```

### Task 7: Add Resend OTP Endpoint (Optional)
**Priority:** MEDIUM
**File:** `routes/auth.js`

**Implementation:**
```javascript
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user
    const [users] = await pool.execute(
      'SELECT id, email FROM app_users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = users[0];
    
    // Invalidate old OTPs
    await pool.execute(`
      UPDATE OTP_TOKENS 
      SET is_used = 1 
      WHERE email = ? AND is_used = 0
    `, [email]);
    
    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    // Store new OTP
    await pool.execute(`
      INSERT INTO OTP_TOKENS (
        user_id, email, otp_code, purpose, 
        expires_at, created_at
      ) VALUES (?, ?, ?, 'registration', ?, NOW())
    `, [user.id, email, otpCode, expiresAt]);
    
    // Send OTP email
    await emailService.sendOTP({
      to: email,
      otpCode: otpCode,
      expiresInMinutes: 15
    });
    
    res.json({
      success: true,
      message: 'Verification code resent'
    });
    
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
};
```

---

## 🧪 Testing Checklist

### Manual Testing Steps
1. **Invitation Creation**
   - [ ] Create invitation from admin panel
   - [ ] Verify invitation appears in database
   - [ ] Copy invitation URL

2. **Invitation Acceptance**
   - [ ] Open invitation URL in browser
   - [ ] Verify page loads without spinning
   - [ ] Click "Join Alumni Network" button
   - [ ] Verify user created in `app_users`
   - [ ] Verify invitation marked as accepted

3. **OTP Generation**
   - [ ] Verify OTP created in `OTP_TOKENS` table
   - [ ] Verify OTP email sent to user
   - [ ] Verify email contains 6-digit code
   - [ ] Verify expiration time is 15 minutes

4. **OTP Verification**
   - [ ] User redirected to `/verify-otp/:email`
   - [ ] Enter correct OTP code
   - [ ] Verify OTP marked as used in database
   - [ ] Verify email_verified flag set to 1
   - [ ] Verify JWT tokens returned
   - [ ] Verify user redirected to dashboard
   - [ ] Verify user is logged in

5. **Error Cases**
   - [ ] Invalid OTP code shows error
   - [ ] Expired OTP code shows error
   - [ ] Already used OTP shows error
   - [ ] Resend OTP works correctly

---

## 🌐 Environment Variables Needed

Add to `.env` file:
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=SGS Gita Alumni <noreply@sgsgita.com>

# JWT Configuration (if not already present)
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=3600
REFRESH_TOKEN_EXPIRES_IN=2592000
```

---

## 📝 Dependencies to Install

```bash
# Email sending
npm install nodemailer

# Type definitions (if using TypeScript)
npm install --save-dev @types/nodemailer
```

---

## 🔍 Known Issues & Considerations

### Issue 1: Email Delivery
**Problem:** Email might go to spam folder
**Solution:** 
- Configure SPF/DKIM records for domain
- Use reputable email service (AWS SES, SendGrid)
- Include unsubscribe link in email footer

### Issue 2: OTP Security
**Problem:** OTP codes could be guessed
**Solution:**
- Rate limit OTP verification attempts
- Lock account after 5 failed attempts
- Use longer expiration time cautiously

### Issue 3: Multiple OTP Requests
**Problem:** User might request multiple OTPs
**Solution:**
- Invalidate old OTPs when new one is generated
- Rate limit OTP generation (1 per minute)
- Show warning if recent OTP exists

### Issue 4: Email Not Received
**Problem:** User might not receive email
**Solution:**
- Implement resend OTP functionality
- Show alternative contact option
- Log email sending failures for debugging

---

## 📚 Reference Documentation

### Related Files to Review
1. `src/contexts/AuthContext.tsx` - Authentication state management
2. `middleware/auth.js` - JWT token verification
3. `routes/auth.js` - Existing auth endpoints
4. `src/App.tsx` - Route configuration

### Database Schema
- Check `OTP_TOKENS` table structure
- Verify foreign key constraints
- Ensure indexes on email and expires_at columns

### Existing Patterns
- All auth endpoints return consistent response format
- All database operations use connection pooling
- All errors are logged and returned as JSON

---

## 🚀 Quick Start for New Session

```bash
# 1. Ensure server is running
npm run dev

# 2. Verify database connection
# Check server logs for: "✅ Database connection successful"

# 3. Test invitation flow
# Open admin panel → Create invitation → Copy URL

# 4. Test current state
# Open invitation URL → Should show "Join Alumni Network" button

# 5. Start implementing OTP
# Begin with Task 1: Email Service Setup
```

---

## ✅ Success Criteria

Implementation is complete when:
- [ ] User clicks invitation link
- [ ] User accepts invitation
- [ ] User receives OTP email
- [ ] User enters OTP code
- [ ] User is verified and logged in
- [ ] User redirected to dashboard
- [ ] No passwords involved in entire flow
- [ ] All database operations use proper connection management
- [ ] All errors are handled gracefully
- [ ] Email sending failures don't break registration

---

**END OF CONTEXT DOCUMENT**
