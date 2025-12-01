---
version: 2.0
status: implemented
last_updated: 2025-11-30
---

# Security Enforcement

```yaml
---
version: 2.0
status: implemented
last_updated: 2025-11-30
applies_to: backend, frontend
enforcement: required
description: Security patterns and rules enforced through skills and validation
skill: .claude/skills/security-rules.md
implementation_status:
  skill: ✅ Implemented
  post_hook: ✅ Validates after edits
  pre_hook: ❌ Cannot block before edits yet
  locked_files: ❌ Not yet enforced
---
```

## Overview

**Historical Issues**: Auth bypass, SQL injection, OTP logging, JWT exposure

**Enforcement**: Auto-activation skill + validation scripts + hooks

---

## Security-Sensitive Files (LOCKED)

> **Status**: ❌ LOCKED file enforcement not yet implemented
> **Planned**: Add to `scripts/validation/rules/exceptions.cjs`

These files require explicit approval before modification:

| File | Why LOCKED |
|------|------------|
| `routes/auth.js` | Authentication routes |
| `middleware/auth.js` | Auth middleware |
| `routes/otp.js` | OTP verification |
| `config/database.js` | Database connection |
| `.env*` | Environment secrets |

---

## Required Security Patterns

### 1. Parameterized Queries (SQL Injection Prevention)
```javascript
// ✅ ALWAYS
const query = 'SELECT * FROM users WHERE email = ?';
const result = await connection.query(query, [email]);

// ❌ NEVER
const query = `SELECT * FROM users WHERE email = '${email}'`;
```

### 2. No Logging of Sensitive Data
**NEVER log**: Passwords, JWT tokens, OTP codes, session tokens, API keys

### 3. Server-Side Validation
**NEVER trust client claims**: `otpVerified`, `isAdmin`, `hasPermission`
**ALWAYS verify server-side**: Database lookups, token verification

### 4. Rate Limiting
**Required on**: Login, OTP, password reset, registration endpoints

### 5. HMAC/JWT Token Signing
Use cryptographic signing, not simple hashing

### 6. Input Validation
Validate format, length, type, range BEFORE database operations

### 7. Secure Session Management
Use `httpOnly`, `secure`, `sameSite` for auth cookies

---

## Implementation Status

| Component | Status | Location |
|-----------|--------|----------|
| Security skill | ✅ | `.claude/skills/security-rules.md` |
| PostToolUse validation | ✅ | `.claude/hooks/post-tool-use-validation.js` |
| PreToolUse blocking | ❌ Todo | `.claude/hooks/pre-tool-use-constraint.js` |
| LOCKED file enforcement | ❌ Todo | `scripts/validation/validators/constraint-check.cjs` |

---

## Historical Vulnerabilities (Never Repeat)

1. Client sent `otpVerified: true`, server accepted
2. String concatenation in SQL queries
3. `console.log(token)` exposed secrets
4. JWT secret in logs

---

## Related

- [Database Specs](../database/) - Connection management, query patterns
- [Security Specs](../security/) - Authentication, authorization, compliance
- [SDD/TAC Methodology](./sdd-tac-methodology.md) - Phase 0 constraints
