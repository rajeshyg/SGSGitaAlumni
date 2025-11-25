# Essential Context (Always Loaded)

> **For AI Agents**: This file contains minimal essentials. Load additional context on-demand via prime commands.

---

## Tech Stack
Node.js 18+, Express, MySQL2, React 18, TypeScript, Socket.IO, JWT

## File Structure
- Routes: `routes/` | Services: `server/services/` | UI: `src/components/`
- Specs: `docs/specs/technical/` and `docs/specs/functional/`
- Tests: `tests/e2e/` (one per module)

## Critical Security Rules
1. **SQL**: Parameterized queries only `[?, ?]` - NO string interpolation
2. **DB**: Always use try/finally for connection.release()
3. **Validation**: Check all input before DB operations
4. **Logging**: Never log passwords, JWT secrets, OTP codes, tokens

## Reference Implementations (DO NOT DUPLICATE)
- Auth: `middleware/auth.js`, `routes/otp.js`, `services/FamilyMemberService.js`
- API: `routes/auth.js` - response format: `{ success, data?, error? }`
- Database: `server/config/database.js` - connection pool pattern
- UI: `src/contexts/AuthContext.tsx`, `src/App.tsx` - PrivateRoute pattern

---

## Framework Activation (SDD/TAC Workflow)

**If sdd-tac-workflow skill didn't auto-activate**, for coding tasks:

### 1. Assess Complexity
- **1-2 files**: Build directly (no framework needed)
- **3+ files**: Apply Scout-Plan-Build workflow

### 2. For Scout-Plan-Build Tasks
Load methodology: `/prime-framework`

Execute workflow:
1. **Scout**: Find affected files, patterns, dependencies (use Task tool or Haiku)
2. **Plan**: Design implementation approach
3. **Build**: Execute plan (sequential or parallel based on file count)

### 3. Load Domain Context (On-Demand)
- Auth work: `/prime-auth`
- API work: `/prime-api`
- Database work: `/prime-database`
- UI work: `/prime-ui`

### 4. Model Selection
- Scout: Haiku (fast, cheap file discovery)
- Plan & Build: Sonnet (quality implementation)
- Architecture: Opus (complex design decisions only)

---

## Context Bundles (Session Continuity)
At session end, create context bundle: What was done, files modified, decisions made, next steps.
Next session: "Read context bundle from [date] to restore 70% of context"
