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
description: Security patterns and rules enforced through skills, validation, and LOCKED files (Tool-Agnostic)
skill: .claude/skills/security-rules.md
---
```

## Overview

**Historical Issues**: Auth bypass, SQL injection, OTP logging, JWT exposure

**Enforcement**: 
- Phase 0 LOCKED files (blocks unauthorized modifications)
- Auto-activation skill (Claude CLI) or manual context (other tools)
- Validation scripts (tool-agnostic CLI)
- Pre-commit hooks

---

## LOCKED Security Files

**These files require explicit approval before modification:**

| File | Reason | Check Command |
|------|--------|---------------|
| `routes/auth.js` | Authentication routes | `node scripts/validation/validators/constraint-check.cjs routes/auth.js` |
| `middleware/auth.js` | Auth middleware | `node scripts/validation/validators/constraint-check.cjs middleware/auth.js` |
| `routes/otp.js` | OTP verification | `node scripts/validation/validators/constraint-check.cjs routes/otp.js` |
| `.env*` | Environment secrets | `node scripts/validation/validators/constraint-check.cjs .env` |

**If modifying these files**: STOP and ask for user approval first.

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

## Tool-Agnostic Security Validation

```bash
# Check if modifying security file (any AI tool)
node scripts/validation/validators/constraint-check.cjs routes/auth.js --block

# Run security-related validation
node scripts/validation/validate-structure.cjs

# Check for sensitive data in logs (manual grep)
grep -r "console.log.*password\|token\|secret\|otp" src/ server/
```

---

## Implementation Details

**Full security checklist and patterns**: See [.claude/skills/security-rules.md](../../../../.claude/skills/security-rules.md)

**Auto-triggers** (Claude CLI only): When working on auth, database queries, API endpoints

**For other AI tools**: Read `.claude/skills/security-rules.md` as context before security work

**Historical vulnerabilities** (never repeat):
1. Client sent `otpVerified: true`, server accepted
2. String concatenation in SQL queries
3. `console.log(token)` exposed secrets
4. JWT secret in logs

---

## Related

- [Constraints and Validation](./constraints-and-validation.md) - LOCKED files system
- [Database Specs](../database/) - Connection management, query patterns
- [Security Specs](../security/) - Authentication, authorization, compliance
- [API Design](../architecture/api-design.md) - API security patterns
