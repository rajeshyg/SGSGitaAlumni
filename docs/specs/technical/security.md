# Security - Technical Specification

```yaml
---
version: 1.0
status: implemented
last_updated: 2025-11-22
applies_to: all
enforcement: required
---
```

## Goal
Protect user data and system integrity through defense-in-depth security measures.

## Implementation Status: Mostly Complete

### 1. Authentication
**Status**: Complete

**Code References**:
- JWT middleware: `middleware/auth.js`
- OTP service: `services/OTPService.js`
- Auth routes: `routes/auth.js`

**E2E Tests**:
- `tests/e2e/auth.spec.ts`

**Implementation**:
- JWT tokens with refresh mechanism
- OTP verification via email
- Secure password hashing (bcrypt)
- Session management

### 2. Authorization
**Status**: Complete

**Code References**:
- Role middleware: `middleware/roleCheck.js`
- Permissions: `config/permissions.js`

**Roles**:
- Member: Basic access
- Moderator: Content review
- Admin: Full access

### 3. Input Validation
**Status**: Complete

**Code References**:
- Validation middleware: `middleware/validation.js`
- Validators: `validators/`

**Requirements**:
- Server-side validation on all inputs
- Sanitize HTML/XSS
- SQL injection prevention (parameterized queries)
- File upload validation

### 4. Rate Limiting
**Status**: Complete

**Code References**:
- Rate limiter: `middleware/rateLimiter.js`
- Config: `config/rateLimit.js`

**E2E Tests**:
- `tests/e2e/api.spec.ts`

**Limits**:
- Auth endpoints: 5/minute
- API endpoints: 100/minute
- File uploads: 10/minute

### 5. HTTPS & Headers
**Status**: Complete

**Code References**:
- Helmet config: `config/security.js`
- CORS config: `config/cors.js`

**Headers**:
- Strict-Transport-Security
- X-Content-Type-Options
- X-Frame-Options
- Content-Security-Policy

### 6. Data Protection
**Status**: Partial

**Implemented**:
- Password hashing
- JWT secret rotation capability
- Sensitive data not in logs

**Pending**:
- Database encryption at rest
- PII data masking

## Security Checklist
- [x] OWASP Top 10 mitigations
- [x] Rate limiting
- [x] Input validation
- [x] XSS prevention
- [x] CSRF protection
- [ ] Database encryption
- [ ] Audit logging

## Compliance
- COPPA: Age verification implemented
- Documentation: `docs/COPPA_COMPLIANCE_COMPLETE.md`

## Archived Guidelines
Historical reference: `docs/archive/guidelines/SECURITY_FRAMEWORK.md`
