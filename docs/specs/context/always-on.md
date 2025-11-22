# Essential Context (Always Loaded)

## Stack
Node.js 18+, Express, MySQL2, React 18, TypeScript, Socket.IO, JWT

## Reference Implementations (DO NOT DUPLICATE)
- Auth Middleware: `middleware/auth.js` - verifyToken()
- API Response: Use consistent `{ success, data, error }` format
- DB Connection: Always use try/finally for connection.release()
- Error Handling: `server/utils/errorHandler.js`

## Critical Rules
1. Parameterized SQL queries only (no string interpolation)
2. All DB operations wrapped in try/finally for connection release
3. Input validation on all API endpoints
4. Never log: passwords, JWT secrets, OTP codes, tokens

## File Locations
- Specs: `docs/specs/functional/` and `docs/specs/technical/`
- Routes: `routes/` (backend API)
- Services: `server/services/`
- E2E Tests: `tests/e2e/` (one per module)

## Model Selection
- Scout (Haiku): File discovery, simple searches
- Build (Sonnet): Implementation, testing, most tasks
- Architect (Opus): Complex design decisions only
