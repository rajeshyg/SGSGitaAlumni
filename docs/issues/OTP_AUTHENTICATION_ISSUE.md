# OTP Authentication Issue - Session Context

**Date**: October 11, 2025  
**Status**: ❌ BLOCKED - "Maximum attempts exceeded" error persists  
**Priority**: HIGH  
**User**: harshayarlagadda2@gmail.com (test alumni member)

---

## 🎯 Original User Request

> "We haven't hosted the code in AWS, I don't think email service works locally. Can we use the admin mode to view the OTP to test the alumni member user login?"

**Goal**: Enable passwordless OTP authentication testing locally without AWS/email infrastructure by displaying OTP codes in the backend console.

---

## 🔴 Current Problem

**Symptom**: User sees "Maximum attempts exceeded. Please request a new OTP." on the OTP verification page (`/verify-otp`) immediately after requesting a new OTP.

**Expected Behavior**: 
1. User clicks "Send Verification Code" on login page
2. Backend generates 6-digit OTP and saves to database
3. OTP code appears in backend console (development mode)
4. User redirects to `/verify-otp` page
5. User can enter the OTP code and verify

**Actual Behavior**:
1. ✅ User clicks "Send Verification Code" 
2. ✅ Backend generates OTP (200 response from `/api/otp/generate`)
3. ❌ Email send fails (expected - SMTP not configured)
4. ✅ User redirects to `/verify-otp` page
5. ❌ Page immediately shows "Maximum attempts exceeded" error

---

## 📊 Technical Analysis

### Database State
```sql
-- Current state: NO OTP tokens exist in database
SELECT * FROM OTP_TOKENS WHERE email = 'harshayarlagadda2@gmail.com';
-- Result: 0 rows
```

**Run this to verify**: `node clear-otp-tokens.js harshayarlagadda2@gmail.com`

### OTP Token Schema
```sql
CREATE TABLE OTP_TOKENS (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  token_type ENUM('email', 'sms', 'totp') DEFAULT 'email',
  user_id INT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_used BOOLEAN DEFAULT FALSE,
  attempt_count INT DEFAULT 0,  -- ⚠️ Max 3 attempts allowed
  INDEX idx_email (email),
  INDEX idx_otp_code (otp_code),
  INDEX idx_expires_at (expires_at)
);
```

### Rate Limiting Rules
- **Per Hour**: 3 OTP generation requests maximum
- **Per Day**: 10 OTP generation requests maximum
- **Per Token**: 3 validation attempts before token locked
- **Expiry**: 5 minutes from generation

### Backend Endpoints Flow

#### 1. `/api/otp/generate` (POST)
**File**: `routes/otp.js` → `generateAndSendOTP()`

**What it does**:
```javascript
1. Check rate limits (3/hour, 10/day)
2. Generate random 6-digit OTP code
3. Calculate expiry (5 minutes from now)
4. Insert into OTP_TOKENS table:
   INSERT INTO OTP_TOKENS (email, otp_code, token_type, expires_at, attempt_count)
   VALUES (?, ?, ?, ?, 0)
5. Try to send email via emailService.sendOTPEmail()
6. Catch email errors (don't fail the request)
7. Return response:
   {
     success: true,
     code: "123456",  // ⚠️ OTP code in response
     expiresAt: "2025-10-11T15:30:00.000Z"
   }
```

**Current Issue**: Email send fails with:
```
Error: Missing credentials for "PLAIN"
code: 'EAUTH'
```

**Response**: Still returns 200 OK with OTP code in JSON

#### 2. `/api/otp/validate` (POST)
**File**: `routes/otp.js` → `validateOTP()`

**What it does**:
```javascript
1. Find latest valid OTP token:
   SELECT * FROM OTP_TOKENS 
   WHERE email = ? AND otp_code = ? AND is_used = false
   ORDER BY created_at DESC LIMIT 1

2. Check if token exists
3. Check if expired (NOW() > expires_at)
4. Check attempt_count < 3
5. If code matches:
   - Mark is_used = true
   - Return success with JWT tokens
6. If code doesn't match:
   - Increment attempt_count
   - If attempt_count >= 3: return "maximum attempts exceeded"
```

#### 3. `/api/otp/remaining-attempts/:email` (GET)
**File**: `routes/otp.js`

**What it does**:
```javascript
SELECT attempt_count, is_used, expires_at 
FROM OTP_TOKENS 
WHERE email = ? AND is_used = false
ORDER BY created_at DESC LIMIT 1

Returns: {
  remainingAttempts: 3 - attempt_count,
  maxAttempts: 3
}
```

**Current Issue**: Returns `remainingAttempts: 0` even when no tokens exist

---

## 🏗️ Architecture

### Frontend Flow (`src/pages/`)

#### LoginPage.tsx
```typescript
const handleRequestOTP = async (e: FormEvent) => {
  e.preventDefault();
  
  // Step 1: Check rate limits
  const dailyCount = await otpService.checkDailyLimit(formData.email);
  const hourlyStatus = await otpService.checkRateLimit(formData.email);
  
  // Step 2: Generate OTP (also sends in one call)
  await otpService.generateOTP({
    email: formData.email,
    type: 'login'
  });
  
  // Step 3: Navigate to verification page
  navigate('/verify-otp', { 
    state: { 
      email: formData.email,
      context: 'login'
    } 
  });
};
```

**Fixed Issues**:
- ✅ Removed duplicate `sendOTP()` call (was causing 500 error)
- ✅ Now uses single endpoint that handles both generation and sending

#### OTPVerificationPage.tsx
```typescript
useEffect(() => {
  // Check remaining attempts on mount
  const checkAttempts = async () => {
    const response = await api.get(`/api/otp/remaining-attempts/${email}`);
    if (response.remainingAttempts === 0) {
      setError('Maximum attempts exceeded. Please request a new OTP.');
    }
  };
  checkAttempts();
}, [email]);
```

**⚠️ Root Cause Hypothesis**: This useEffect is firing and getting `remainingAttempts: 0` from the API even though:
1. No tokens exist in database, OR
2. Token exists but has `attempt_count = 3` from previous testing

---

## 🔧 Environment Configuration

### .env Settings (Development Mode)
```bash
# OTP Configuration
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=5
MAX_OTP_ATTEMPTS_PER_HOUR=3
MAX_DAILY_OTPS=10

# Development mode flags
NODE_ENV=development
DEV_SKIP_EMAIL=true     # ⚠️ Should skip email in dev mode
DEV_LOG_OTP=true        # ⚠️ Should log OTP to console

# Email Service (SendGrid - not configured locally)
SENDGRID_API_KEY=       # Empty
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=              # Empty
EMAIL_FROM=noreply@sgsgita.org
```

**⚠️ Known Issue**: `emailService.js` initializes BEFORE `dotenv.config()` loads environment variables, so `DEV_SKIP_EMAIL` is not being read correctly.

### Database Connection (AWS RDS)
```bash
DB_HOST=sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com
DB_USER=admin
DB_NAME=sgsgita_alumni
DB_PORT=3306
```

**Status**: ✅ Connection working

---

## 📝 Code Files Modified in This Session

### 1. `routes/otp.js`
**Changes**:
- ✅ Added `generateAndSendOTP()` function (all-in-one endpoint)
- ✅ Fixed `generateRandomOTP()` helper for secure 6-digit codes
- ✅ Removed `phone_number` column references (doesn't exist in schema)
- ✅ Added error handling for email send failures

**Current Code** (lines 15-80):
```javascript
export const generateAndSendOTP = async (req, res) => {
  const connection = await getPool().getConnection();
  
  try {
    const { email, type = 'email' } = req.body;
    
    // Validate email
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Check daily limit
    const [dailyCount] = await connection.execute(
      `SELECT COUNT(*) as count 
       FROM OTP_TOKENS 
       WHERE email = ? 
       AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
      [email]
    );

    const maxDaily = parseInt(process.env.MAX_DAILY_OTPS || '10');
    if (dailyCount[0].count >= maxDaily) {
      return res.status(429).json({
        success: false,
        message: 'Daily OTP limit exceeded'
      });
    }

    // Check hourly limit
    const [hourlyCount] = await connection.execute(
      `SELECT COUNT(*) as count 
       FROM OTP_TOKENS 
       WHERE email = ? 
       AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
      [email]
    );

    const maxHourly = parseInt(process.env.MAX_OTP_ATTEMPTS_PER_HOUR || '3');
    if (hourlyCount[0].count >= maxHourly) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again later.'
      });
    }

    // Generate OTP
    const otpCode = generateRandomOTP();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5');
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Save to database
    await connection.execute(
      `INSERT INTO OTP_TOKENS (email, otp_code, token_type, expires_at, attempt_count) 
       VALUES (?, ?, ?, ?, 0)`,
      [email, otpCode, type, expiresAt]
    );

    // Try to send email (don't fail if it errors)
    try {
      await emailService.sendOTPEmail(email, otpCode);
    } catch (emailError) {
      console.error('Email send error (OTP still generated):', emailError);
    }

    res.json({
      success: true,
      code: otpCode,  // ⚠️ OTP code in response for dev testing
      expiresAt
    });

  } catch (error) {
    console.error('Generate OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate OTP' 
    });
  } finally {
    connection.release();
  }
};
```

### 2. `server.js`
**Changes**:
- ✅ Added route: `app.post('/api/otp/generate', apiRateLimit, generateAndSendOTP)`
- ✅ Imported `generateAndSendOTP` from routes/otp.js

**Line 180**:
```javascript
import { 
  generateOTP, 
  generateAndSendOTP,  // ⚠️ New import
  sendOTP, 
  validateOTP 
} from './routes/otp.js';
```

**Line 270**:
```javascript
app.post('/api/otp/generate', apiRateLimit, generateAndSendOTP);
app.post('/api/otp/send', apiRateLimit, sendOTP);
app.post('/api/otp/validate', validateOTP);
```

### 3. `src/services/OTPService.ts`
**Changes**:
- ✅ Fixed `checkDailyLimit()`: Changed `response.data.count` → `response.count || 0`
- ✅ Fixed `checkRateLimit()`: Changed `response.data.count` → `response.count || 0`
- ✅ Fixed `generateOTP()`: Maps API `code` field to TypeScript `otpCode` property

**Lines 66-88** (generateOTP method):
```typescript
async generateOTP(request: GenerateOTPRequest): Promise<OTPToken> {
  try {
    const response = await this.api.post('/api/otp/generate', request);
    
    const otpCode = response.code || response.otpCode || '';
    
    const otpToken: OTPToken = {
      otpCode: response.code || otpCode,  // ⚠️ Maps 'code' to 'otpCode'
      expiresAt: new Date(response.expiresAt),
      context: request.type || 'login',
      attempts: 0
    };

    this.currentOTP = otpToken;
    return otpToken;
    
  } catch (error) {
    throw new OTPError('Failed to generate OTP', error);
  }
}
```

### 4. `src/pages/LoginPage.tsx`
**Changes**:
- ✅ Removed duplicate `sendOTP()` call (was causing 500 error)
- ✅ Removed unused `otpToken` variable

**Lines 140-157** (FIXED):
```typescript
const handleRequestOTP = async (e: FormEvent) => {
  e.preventDefault();
  
  try {
    setError('');
    setLoading(true);

    const dailyCount = await otpService.checkDailyLimit(formData.email);
    if (dailyCount >= 10) {
      throw new OTPError('Daily OTP limit exceeded. Please try again tomorrow.');
    }

    const hourlyStatus = await otpService.checkRateLimit(formData.email);
    if (!hourlyStatus.allowed) {
      throw new OTPError(`Too many requests. ${hourlyStatus.message}`);
    }

    // Generate OTP (this endpoint handles both generation AND sending)
    await otpService.generateOTP({
      email: formData.email,
      type: 'login'
    });

    // ✅ REMOVED: await otpService.sendOTP(formData.email, otpToken.otpCode, 'login');
    
    navigate('/verify-otp', { 
      state: { 
        email: formData.email,
        context: 'login'
      } 
    });
    
  } catch (err) {
    // Error handling...
  }
};
```

### 5. `utils/emailService.js`
**Status**: ⚠️ NOT MODIFIED (has known initialization timing issue)

**Problem**:
```javascript
class EmailService {
  constructor() {
    // ⚠️ This runs BEFORE dotenv.config() in server.js
    const skipEmail = process.env.DEV_SKIP_EMAIL === 'true';
    // skipEmail is FALSE because env var not loaded yet
    
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS  // Empty!
      }
    });
  }
  
  async sendOTPEmail(email, otpCode) {
    // Tries to send with empty credentials → EAUTH error
  }
}
```

---

## 🐛 Debugging Steps Taken

### Step 1: Installed Missing Packages ✅
```bash
npm install nodemailer @aws-sdk/client-ses hi-base32 qrcode
```

### Step 2: Created Clear Tokens Utility ✅
**File**: `clear-otp-tokens.js`
```javascript
// Usage: node clear-otp-tokens.js [email]
// Deletes all OTP tokens for testing
```

**Result**: Confirmed 0 tokens exist in database

### Step 3: Fixed Database Schema Issues ✅
- Removed `phone_number` column references (column doesn't exist)

### Step 4: Fixed API Response Mapping ✅
- Fixed `response.data.count` → `response.count`
- Fixed `response.code` → `otpCode` mapping in TypeScript

### Step 5: Fixed Duplicate OTP Sending ✅
- Removed redundant `sendOTP()` call in LoginPage.tsx

### Step 6: Tested OTP Generation Flow ✅
**Result**: 
- ✅ `/api/otp/generate` returns 200 OK
- ✅ Response includes `code: "123456"` field
- ✅ OTP saved to database
- ❌ Email send fails (expected)
- ❌ OTP code NOT visible in console (DEV_LOG_OTP not working)

---

## 🔍 Root Cause Analysis

### Hypothesis 1: Frontend Caching Issue
**Evidence**:
- Database has 0 tokens
- Backend returns 200 OK
- Frontend shows "Maximum attempts exceeded" immediately

**Theory**: `OTPVerificationPage.tsx` is reading cached/stale state from previous failed attempts

**To Test**: Clear browser cache, localStorage, sessionStorage

### Hypothesis 2: Backend Returns Wrong Data
**Evidence**:
- `/api/otp/remaining-attempts/:email` endpoint might return `remainingAttempts: 0` when no tokens exist

**Current Code** (`routes/otp.js`):
```javascript
// ⚠️ POTENTIAL BUG: What happens when no tokens exist?
const [tokens] = await connection.execute(
  `SELECT attempt_count, is_used, expires_at 
   FROM OTP_TOKENS 
   WHERE email = ? AND is_used = false
   ORDER BY created_at DESC LIMIT 1`,
  [email]
);

if (tokens.length === 0) {
  // ⚠️ Does this return 0 or 3?
  return res.json({ 
    remainingAttempts: 3,  // Should be 3 for new requests
    maxAttempts: 3 
  });
}
```

**To Verify**: Test `/api/otp/remaining-attempts/harshayarlagadda2@gmail.com` endpoint directly

### Hypothesis 3: Race Condition
**Evidence**:
- OTP generation succeeds (200 OK)
- Navigation to `/verify-otp` happens immediately
- Verification page mounts and calls `remaining-attempts` before DB transaction commits

**Theory**: Token exists but hasn't committed yet when verification page checks

**To Test**: Add delay between navigation or use transaction isolation

---

## 🎯 Next Steps for Resolution

### Priority 1: Fix Remaining Attempts Logic
**File**: `routes/otp.js` → `GET /api/otp/remaining-attempts/:email`

**Action**: Ensure it returns `remainingAttempts: 3` when:
- No tokens exist in database
- Token exists but `attempt_count = 0`

**Test**:
```bash
# Should return: {"remainingAttempts": 3, "maxAttempts": 3}
curl http://localhost:3001/api/otp/remaining-attempts/harshayarlagadda2@gmail.com
```

### Priority 2: Add Console Logging for OTP Codes
**File**: `routes/otp.js` → `generateAndSendOTP()`

**Action**: Add explicit console.log when `DEV_LOG_OTP=true`:
```javascript
if (process.env.DEV_LOG_OTP === 'true') {
  console.log('\n=============================================================');
  console.log('📧 [EmailService] OTP EMAIL (Development Mode)');
  console.log('=============================================================');
  console.log(`To: ${email}`);
  console.log(`OTP Code: ${otpCode}`);
  console.log(`Expires: ${expiresAt}`);
  console.log('=============================================================\n');
}
```

### Priority 3: Fix Email Service Initialization
**File**: `utils/emailService.js`

**Options**:
1. Move initialization to after dotenv.config()
2. Add lazy initialization on first use
3. Add re-check for dev mode in sendOTPEmail()

**Recommended**: Option 3 (least breaking change)
```javascript
async sendOTPEmail(email, otpCode) {
  // Re-check dev mode on each call
  if (process.env.DEV_SKIP_EMAIL === 'true') {
    console.log('[DEV] Skipping email send, OTP:', otpCode);
    return { success: true, message: 'Dev mode - email skipped' };
  }
  
  // Existing email send logic...
}
```

### Priority 4: Debug Frontend State
**File**: `src/pages/OTPVerificationPage.tsx`

**Action**: Add console logging:
```typescript
useEffect(() => {
  const checkAttempts = async () => {
    console.log('[OTPVerification] Checking attempts for:', email);
    const response = await api.get(`/api/otp/remaining-attempts/${email}`);
    console.log('[OTPVerification] Remaining attempts:', response);
    
    if (response.remainingAttempts === 0) {
      console.log('[OTPVerification] Setting max attempts error');
      setError('Maximum attempts exceeded. Please request a new OTP.');
    }
  };
  checkAttempts();
}, [email]);
```

---

## 📋 Testing Checklist

### Before Testing:
- [ ] Kill all node processes: `taskkill /F /IM node.exe`
- [ ] Clear OTP tokens: `node clear-otp-tokens.js harshayarlagadda2@gmail.com`
- [ ] Clear browser cache and localStorage
- [ ] Start fresh server: `npm run dev`

### Test Scenario 1: Fresh OTP Request
1. [ ] Navigate to http://localhost:5174/login (or check current Vite port)
2. [ ] Click "Sign in without password"
3. [ ] Enter: harshayarlagadda2@gmail.com
4. [ ] Click "Send Verification Code"
5. [ ] **Expected**: Redirect to `/verify-otp`
6. [ ] **Check**: No "Maximum attempts exceeded" error
7. [ ] **Check**: Backend console shows OTP code
8. [ ] **Check**: Network tab shows `/api/otp/generate` returned `code` field

### Test Scenario 2: Verify Remaining Attempts API
```bash
# Should return: {"remainingAttempts": 3, "maxAttempts": 3}
curl http://localhost:3001/api/otp/remaining-attempts/harshayarlagadda2@gmail.com
```

### Test Scenario 3: Verify Database State
```sql
SELECT 
  email, 
  otp_code, 
  attempt_count, 
  is_used, 
  expires_at,
  created_at
FROM OTP_TOKENS 
WHERE email = 'harshayarlagadda2@gmail.com'
ORDER BY created_at DESC;
```

**Expected**: 1 row with `attempt_count = 0`, `is_used = false`

### Test Scenario 4: Validate OTP
1. [ ] Get OTP code from Network tab response or backend console
2. [ ] Enter code on verification page
3. [ ] **Expected**: Successful login OR specific validation error
4. [ ] **Check**: `attempt_count` increments on wrong code
5. [ ] **Check**: `is_used = true` on correct code

---

## 🛠️ Utility Commands

### Clear OTP Tokens
```bash
node clear-otp-tokens.js harshayarlagadda2@gmail.com
```

### Kill All Node Processes
```powershell
taskkill /F /IM node.exe
```

### Start Development Server
```bash
npm run dev
```

### Check Database Directly
```bash
# Connect to MySQL
mysql -h sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com -u admin -p sgsgita_alumni

# Run queries
SELECT * FROM OTP_TOKENS WHERE email = 'harshayarlagadda2@gmail.com';
DELETE FROM OTP_TOKENS WHERE email = 'harshayarlagadda2@gmail.com';
```

### Test API Endpoints
```powershell
# Check remaining attempts
Invoke-RestMethod -Uri "http://localhost:3001/api/otp/remaining-attempts/harshayarlagadda2@gmail.com" -Method GET

# Generate OTP
Invoke-RestMethod -Uri "http://localhost:3001/api/otp/generate" -Method POST -Body (@{email="harshayarlagadda2@gmail.com"; type="login"} | ConvertTo-Json) -ContentType "application/json"

# Validate OTP
Invoke-RestMethod -Uri "http://localhost:3001/api/otp/validate" -Method POST -Body (@{email="harshayarlagadda2@gmail.com"; otpCode="123456"} | ConvertTo-Json) -ContentType "application/json"
```

---

## 📚 Related Files Reference

### Backend Files
- `server.js` - Main server entry point
- `routes/otp.js` - OTP endpoint handlers
- `utils/emailService.js` - Email sending service
- `middleware/auth.js` - Authentication middleware
- `middleware/rateLimit.js` - Rate limiting logic

### Frontend Files
- `src/pages/LoginPage.tsx` - Login UI with passwordless option
- `src/pages/OTPVerificationPage.tsx` - OTP input and validation UI
- `src/services/OTPService.ts` - OTP API client service
- `src/services/SecureAPIClient.ts` - HTTP client wrapper
- `src/contexts/AuthContext.tsx` - Authentication state management

### Database Scripts
- `scripts/database/004_create_otp_tables.sql` - OTP table schema

### Utility Scripts
- `clear-otp-tokens.js` - Clear OTP tokens for testing

### Configuration
- `.env` - Environment variables
- `package.json` - Dependencies and scripts

---

## 🔑 Key Environment Variables

```bash
# Database
DB_HOST=sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com
DB_USER=admin
DB_NAME=sgsgita_alumni
DB_PORT=3306

# OTP Settings
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=5
MAX_OTP_ATTEMPTS_PER_HOUR=3
MAX_DAILY_OTPS=10

# Development Flags
NODE_ENV=development
DEV_SKIP_EMAIL=true
DEV_LOG_OTP=true

# Email (SendGrid - not configured)
SENDGRID_API_KEY=
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=
EMAIL_FROM=noreply@sgsgita.org
```

---

## 📞 Contact & Session Info

**Test User Email**: harshayarlagadda2@gmail.com  
**Admin Email**: datta.rajesh@gmail.com  
**Repository**: rajeshyg/SGSGitaAlumni  
**Branch**: feature/task-7.1-api-integration-foundation  
**Session Date**: October 11, 2025  
**Last Working Port**: Frontend on 5174, Backend on 3001

---

## ⚡ Quick Resume Commands

```bash
# 1. Clear any stuck processes
taskkill /F /IM node.exe

# 2. Clear test data
node clear-otp-tokens.js harshayarlagadda2@gmail.com

# 3. Start development server
npm run dev

# 4. Test the flow at:
http://localhost:5174/login
```

**Remember**: Check which port Vite starts on (5173 or 5174) and use that in browser!

---

**Status**: Ready for next session resumption with full technical context preserved.
