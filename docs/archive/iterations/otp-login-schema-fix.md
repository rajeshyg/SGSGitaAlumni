# OTP Login Flow - Schema Fix Applied

## Date: November 3, 2025

## Problem Identified

The OTP login flow was failing at the final login step with a **400 Bad Request** error.

### Root Cause
The `LoginSchema` validation (in `src/schemas/validation/index.js`) was requiring a password with minimum 1 character for ALL login attempts, even when `otpVerified: true` was passed.

**Original Schema:**
```javascript
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password required'),  // ❌ Always requires password
  rememberMe: z.boolean().optional(),
  otpVerified: z.boolean().optional()
});
```

### Issue Flow
1. User generates OTP → ✅ Works
2. User validates OTP → ✅ Works  
3. Frontend calls `/api/auth/login` with:
   ```json
   {
     "email": "saikveni6@gmail.com",
     "password": "",
     "otpVerified": true
   }
   ```
4. **Zod validation middleware rejects** the request before it reaches the login handler → ❌ 400 Bad Request
5. Login handler (which DOES support OTP-verified logins) never executes

## Solution Applied

Updated `LoginSchema` to conditionally require password based on `otpVerified` flag:

**Fixed Schema:**
```javascript
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().optional(), // ✅ Now optional
  rememberMe: z.boolean().optional(),
  otpVerified: z.boolean().optional()
}).refine(
  (data) => {
    // If OTP is not verified, password is required
    if (!data.otpVerified) {
      return data.password && data.password.length > 0;
    }
    // If OTP is verified, password is not required
    return true;
  },
  {
    message: 'Password is required for traditional login',
    path: ['password'] // Show error on password field
  }
);
```

### How the Fix Works

1. **Password field is now optional** - allows empty string when `otpVerified: true`
2. **Zod refinement validation** enforces business logic:
   - If `otpVerified === false` (or undefined): Password MUST be provided
   - If `otpVerified === true`: Password is NOT required
3. **Validation passes** request to login handler
4. **Login handler** (routes/auth.js) already has OTP verification logic:
   - Checks OTP was used within last 5 minutes
   - Skips password verification when `otpVerified === true`
   - Generates JWT token and returns user data

## Files Modified

1. **`src/schemas/validation/index.js`** - Updated `LoginSchema` with conditional validation

## Testing Instructions

### Manual Testing (Recommended)

1. **Start the server:**
   ```powershell
   cd c:\React-Projects\SGSGitaAlumni
   node server.js
   ```
   
   Verify server is running on `http://localhost:3001`

2. **Start the frontend (in a new terminal):**
   ```powershell
   npm run dev
   ```
   
   Verify Vite dev server runs on `http://localhost:5173`

3. **Test OTP Login Flow:**
   
   a. **Navigate to login page:**
      - Open browser to `http://localhost:5173`
      - Click "Login" or go directly to login page
   
   b. **Generate OTP:**
      - Enter email: `saikveni6@gmail.com` (or any registered member email)
      - Click "Send OTP" or equivalent button
      - Check server console for OTP code (since SendGrid may not be configured)
      - Server logs will show: `🔐 OTP Generated: XXXXXX`
   
   c. **Verify OTP:**
      - Enter the 6-digit OTP code
      - Click "Verify OTP"
      - Should see success message
   
   d. **Login with OTP verification:**
      - Click "Login" or submit form
      - Frontend sends: `{email, password: "", otpVerified: true}`
      - **Expected:** Login succeeds, receives JWT token
      - **Result:** User is logged in
   
   e. **Family Member Selection (if family account):**
      - Should see family member selection screen
      - Select a family member
      - Should proceed to dashboard

4. **Verify in Browser DevTools:**
   - Open Network tab
   - Watch the `/api/auth/login` request
   - Should return **200 OK** (not 400 Bad Request)
   - Response should contain:
     ```json
     {
       "success": true,
       "token": "...",
       "refreshToken": "...",
       "user": { ... },
       "expiresIn": 3600
     }
     ```

### API Testing (Alternative)

If you prefer to test the API directly:

```powershell
# Step 1: Generate OTP
$body1 = '{"email":"saikveni6@gmail.com","type":"login"}'
$otp = Invoke-RestMethod -Uri 'http://localhost:3001/api/otp/generate' -Method POST -ContentType 'application/json' -Body $body1
Write-Host "OTP: $($otp.otp)"

# Step 2: Verify OTP (replace XXXXXX with actual OTP from step 1)
$body2 = '{"email":"saikveni6@gmail.com","otpCode":"XXXXXX","tokenType":"login"}'
$verify = Invoke-RestMethod -Uri 'http://localhost:3001/api/otp/verify' -Method POST -ContentType 'application/json' -Body $body2
Write-Host "Verified: $($verify.success)"

# Step 3: Login with OTP verification
$body3 = '{"email":"saikveni6@gmail.com","password":"","otpVerified":true}'
$login = Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/login' -Method POST -ContentType 'application/json' -Body $body3
Write-Host "Login Success: $($login.success)"
Write-Host "Token: $($login.token)"
```

## Expected Outcomes

### ✅ Success Criteria
- OTP generation works
- OTP verification works
- **Login with `otpVerified: true` and empty password returns 200 OK**
- JWT token is returned
- User data is returned
- Family member selection works (if family account)

### ❌ Failure Signs
- 400 Bad Request on login (indicates schema validation still failing)
- 401 Unauthorized (indicates OTP verification check failing in handler)
- 500 Internal Server Error (indicates database or other server issue)

## Next Steps After Testing

1. If OTP login works → Mark Action 4 as complete
2. Proceed to **Action 3: Theme Violations**
   - Fix hardcoded colors in high-violation files
   - Start with `ParentDashboard.tsx` (51 violations)
   - Run `npm run validate-theme` after each fix

## Notes

- The login handler already supports OTP-verified logins
- This was purely a validation schema issue
- No changes needed to login route logic
- Admin login (password-based) still works normally
