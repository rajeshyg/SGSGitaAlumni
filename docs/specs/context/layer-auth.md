# Authentication Context Layer

Load this when working on authentication-related features.

## Architecture
- JWT-based authentication with refresh tokens
- OTP verification for email/phone
- Family accounts with shared email, individual profiles
- Role-based access: Member, Moderator, Admin

## Key Files
- `middleware/auth.js` - Token verification middleware
- `routes/auth.js` - Login, register, refresh endpoints
- `routes/otp.js` - OTP generation and verification
- `server/services/authService.js` - Auth business logic

## Patterns
- All protected routes use `authenticateToken` middleware
- JWT tokens expire in 24h, refresh tokens in 7d
- OTP codes expire in 10 minutes
- Rate limiting: 5 attempts per minute on auth endpoints

## Security Requirements
- Never log JWT_SECRET or token values
- Never log OTP codes (even in dev mode)
- Hash passwords with bcrypt (10 rounds)
- Sanitize all user inputs

## Related Specs
- `docs/specs/functional/authentication.md`
- `docs/specs/technical/security.md`
