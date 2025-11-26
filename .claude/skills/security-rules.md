---
name: security-rules
description: Auto-activate when working on authentication, authorization, database queries, API endpoints, or any security-sensitive code. Enforces critical security patterns to prevent vulnerabilities.
---

# Security Rules Skill

**Critical**: This project has experienced security vulnerabilities (auth bypass, SQL injection, token exposure, OTP logging). These rules are NON-NEGOTIABLE.

## When This Skill Applies

Auto-triggers when working on:
- Authentication/authorization code
- Database queries
- API endpoints
- User input handling
- Token/session management
- Payment or sensitive data processing

## Required Security Patterns

### 1. Database Queries - ALWAYS Use Parameterized Queries

**❌ NEVER DO THIS**:
```javascript
// String concatenation - VULNERABLE TO SQL INJECTION
const query = `SELECT * FROM users WHERE email = '${email}'`;
const query = `INSERT INTO tokens VALUES ('${token}', ${userId})`;
```

**✅ ALWAYS DO THIS**:
```javascript
// Parameterized queries with placeholders
const query = 'SELECT * FROM users WHERE email = ?';
const result = await connection.query(query, [email]);

const query = 'INSERT INTO tokens (token, user_id) VALUES (?, ?)';
await connection.query(query, [token, userId]);
```

**Rule**: If you see `${variable}` in SQL, it's a security bug. Use `?` placeholders instead.

### 2. Logging - NEVER Log Sensitive Data

**❌ NEVER LOG**:
- Passwords (even hashed)
- JWT tokens or secrets
- OTP codes
- Session tokens
- API keys
- Credit card numbers
- Social Security numbers

**❌ NEVER DO THIS**:
```javascript
console.log('OTP sent:', otpCode);
console.log('Token:', jwtToken);
console.log('User password:', hashedPassword);
logger.info({ token: sessionToken });
```

**✅ SAFE LOGGING**:
```javascript
console.log('OTP sent to:', email.replace(/(.{2}).*(@.*)/, '$1***$2'));
console.log('Token generated for user:', userId);
logger.info({ action: 'password_reset', userId });
```

**Rule**: If it's sensitive, log the action/user ID, not the actual value.

### 3. Validation - Server-Side ALWAYS, Client Claims NEVER

**❌ NEVER TRUST CLIENT DATA**:
```javascript
// Client sends: { otpVerified: true }
// Server accepts it blindly - AUTH BYPASS
app.post('/verify-otp', (req, res) => {
  if (req.body.otpVerified) {
    // Generate token - VULNERABLE!
    return res.json({ token });
  }
});
```

**✅ ALWAYS VERIFY SERVER-SIDE**:
```javascript
// Server verifies OTP in database
app.post('/verify-otp', async (req, res) => {
  const storedOtp = await getOtpFromDb(req.body.email);

  if (!storedOtp || storedOtp.code !== req.body.otp) {
    return res.status(401).json({ error: 'Invalid OTP' });
  }

  if (Date.now() > storedOtp.expires) {
    return res.status(401).json({ error: 'OTP expired' });
  }

  // Now safe to generate token
  const token = generateToken(storedOtp.userId);
  await deleteOtp(req.body.email); // Invalidate OTP
  res.json({ token });
});
```

**Rule**: NEVER trust `otpVerified`, `isAdmin`, `hasPermission`, etc. from client. Always verify server-side.

### 4. Rate Limiting - Required for Auth Endpoints

**Required on**:
- Login endpoints
- OTP generation/verification
- Password reset requests
- Registration endpoints
- Any endpoint that sends emails/SMS

**✅ IMPLEMENTATION**:
```javascript
const rateLimit = require('express-rate-limit');

// Login rate limit: 5 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  // Login logic
});
```

**Rule**: If endpoint involves authentication or sends notifications, add rate limiting.

### 5. Token Verification - HMAC or Cryptographic Signing

**❌ NEVER DO THIS**:
```javascript
// Simple hash without secret - FORGEABLE
const invitationToken = crypto.createHash('md5')
  .update(email + timestamp)
  .digest('hex');
```

**✅ ALWAYS DO THIS**:
```javascript
// HMAC with server secret - UNFORGEABLE
const invitationToken = crypto
  .createHmac('sha256', process.env.JWT_SECRET)
  .update(`${email}:${timestamp}:${invitationId}`)
  .digest('hex');

// JWT with signature verification
const token = jwt.sign(payload, process.env.JWT_SECRET, {
  expiresIn: '7d',
  issuer: 'SGSGitaAlumni',
});
```

**Rule**: Use HMAC or JWT for tokens, never simple hashing.

### 6. Input Validation - Validate Before Database Operations

**✅ VALIDATION CHECKLIST**:
```javascript
// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return res.status(400).json({ error: 'Invalid email format' });
}

// Length validation
if (password.length < 8) {
  return res.status(400).json({ error: 'Password must be at least 8 characters' });
}

// Type validation
if (typeof userId !== 'number' || userId <= 0) {
  return res.status(400).json({ error: 'Invalid user ID' });
}

// Enum validation
const allowedRoles = ['member', 'moderator', 'admin'];
if (!allowedRoles.includes(role)) {
  return res.status(400).json({ error: 'Invalid role' });
}
```

**Rule**: Validate format, length, type, and range BEFORE using data in queries.

### 7. Session Management - Secure Token Handling

**✅ REQUIRED PRACTICES**:
```javascript
// Secure cookie settings
res.cookie('token', jwtToken, {
  httpOnly: true,        // Prevents JavaScript access
  secure: true,          // HTTPS only
  sameSite: 'strict',    // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// Logout: invalidate token server-side
app.post('/logout', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  await blacklistToken(token); // Add to blacklist
  res.clearCookie('token');
  res.json({ success: true });
});
```

**Rule**: Use `httpOnly`, `secure`, and `sameSite` for all auth cookies.

## Historical Vulnerabilities (Never Repeat)

These bugs were found and fixed in this project:

1. **Auth bypass**: Client sent `otpVerified: true`, server accepted → Fixed by server-side OTP verification
2. **SQL injection**: String concatenation in queries → Fixed with parameterized queries
3. **Token exposure**: `console.log(token)` → Removed all sensitive logging
4. **JWT exposure**: JWT secret logged → Removed from logs, added to `.env`
5. **OTP logging**: OTP codes in logs → Changed to log email only

## Pre-Commit Protection

Watch for these patterns that will be flagged:
- SQL queries with `${}` interpolation
- `console.log` with sensitive variable names
- Missing rate limiting on auth routes

## Integration with Existing Security

Reference these files for patterns:
- Auth middleware: `middleware/auth.js`
- OTP handling: `routes/otp.js`
- Invitation tokens: `routes/invitations.js`
- Rate limiting: `middleware/rateLimiting.js` (if exists)

## Security Checklist for Code Review

Before completing ANY security-related task:

- [ ] All SQL queries use parameterized placeholders `?`
- [ ] No logging of tokens, passwords, OTPs, or secrets
- [ ] Server-side validation for ALL client claims
- [ ] Rate limiting on auth endpoints
- [ ] HMAC/JWT signing for tokens
- [ ] Input validation before database operations
- [ ] Secure cookie settings for sessions
- [ ] Error messages don't leak sensitive info
- [ ] CORS configured properly
- [ ] Environment variables for all secrets

## When in Doubt

Ask yourself:
1. "Can an attacker manipulate this input?"
2. "Does this log any sensitive data?"
3. "Am I trusting the client without verification?"
4. "Is this SQL query using parameterized queries?"
5. "Does this endpoint need rate limiting?"

If answer is YES to 1, 3, or 5, or YES to 2, **STOP AND FIX IT**.

---

**Zero tolerance for security bugs. When in doubt, ask the user before proceeding.**
