# Prime: Authentication Context

Load this context before working on auth-related tasks.

## Variables
- `$TASK`: The specific auth task to perform
- `$ERROR_LOG`: (Optional) Error message or stack trace

## Context to Load
Read these files to understand the auth patterns:
- `docs/specs/context/always-on.md` - Critical rules
- `docs/specs/context/layer-auth.md` - Auth-specific context
- `docs/specs/functional/authentication.md` - Full spec

## Key Files
- `middleware/auth.js` - Token verification (verifyToken)
- `routes/auth.js` - Login/logout endpoints
- `routes/otp.js` - OTP request/verify
- `routes/invitations.js` - Invitation flow
- `services/FamilyMemberService.js` - Family auth

## Workflow
1. Read the context files listed above
2. Identify which key files are relevant to $TASK
3. Check Reference Implementations in always-on.md before writing new code
4. Follow existing patterns (JWT, OTP, parameterized queries)
5. Use try/finally for any database connections

## Report
After completing the task:
- List files modified
- List tests to run: `npx playwright test tests/e2e/auth.spec.ts`
- Note any deviations from existing patterns
