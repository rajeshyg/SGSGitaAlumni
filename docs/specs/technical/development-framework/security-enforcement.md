---
version: 1.0
status: implemented
last_updated: 2025-11-26
---

# Security Enforcement

```yaml
---
version: 1.0
status: implemented
last_updated: 2025-11-26
applies_to: backend, frontend
enforcement: required
description: Security patterns and rules enforced through skills and validation
skill: .claude/skills/security-rules.md
---
```

## Overview

**Historical Issues**: Auth bypass, SQL injection, OTP logging, JWT exposure

**Enforcement**: Auto-activation skill + validation scripts + pre-commit hooks

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

## Implementation Details

**Full security checklist and patterns**: See [.claude/skills/security-rules.md](../../../../.claude/skills/security-rules.md)

**Auto-triggers**: When working on auth, database queries, API endpoints

**Historical vulnerabilities** (never repeat):
1. Client sent `otpVerified: true`, server accepted
2. String concatenation in SQL queries
3. `console.log(token)` exposed secrets
4. JWT secret in logs

---

## Related

- [Database Specs](../database/) - Connection management, query patterns
- [Security Specs](../security/) - Authentication, authorization, compliance
- [API Design](../architecture/api-design.md) - API security patterns
