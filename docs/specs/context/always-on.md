# Essential Context (Always Loaded)

## Stack
Node.js 18+, Express, MySQL2, React 18, TypeScript, Socket.IO, JWT

## Reference Implementations (DO NOT DUPLICATE)

### Auth
- Token verification: `middleware/auth.js` - verifyToken()
- OTP flow: `routes/otp.js` - requestOtp(), verifyOtp()
- Family auth: `services/FamilyMemberService.js`

### API
- Response format: `{ success: boolean, data?: any, error?: string }`
- Route pattern: `routes/auth.js` - consistent error handling
- Validation: Check input before DB operations

### Database
- Connection pattern: Always use try/finally for connection.release()
- Queries: Parameterized only - `[?, ?]` syntax
- Pool: `server/config/database.js`

### UI
- Auth context: `src/contexts/AuthContext.tsx`
- Protected routes: `src/App.tsx` - PrivateRoute pattern
- API calls: `src/lib/api.ts`

## Critical Rules
1. Parameterized SQL queries only (no string interpolation)
2. All DB operations wrapped in try/finally for connection release
3. Input validation on all API endpoints
4. Never log: passwords, JWT secrets, OTP codes, tokens

## Root Files (Required - Do Not Archive)
- `server.js` - Express entry point
- `eslint.config.js` - ESLint configuration
- `vite.config.js` - Vite build config
- `tailwind.config.js` - Tailwind CSS config
- `postcss.config.js` - PostCSS config

## File Locations
- Specs: `docs/specs/functional/` and `docs/specs/technical/`
- Context Layers: `docs/specs/context/layer-*.md` (load as needed)
- Standards: `docs/archive/standards/` (quality, performance, security)
- Architecture: `docs/archive/root-docs/ARCHITECTURE.md`
- Routes: `routes/` (backend API)
- Services: `server/services/`
- E2E Tests: `tests/e2e/` (one per module)

## Model Selection
- Scout (Haiku): File discovery, simple searches
- Build (Sonnet): Implementation, testing, most tasks
- Architect (Opus): Complex design decisions only
