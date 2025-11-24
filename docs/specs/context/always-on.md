# Essential Context (Always Loaded)

> **For AI Agents & Collaborators**: This file is designed for both humans and AI models to quickly understand the project and how to work with it effectively.

---

## 🔄 SDD Framework Quick Reference

**SGSGitaAlumni** uses Spec-Driven Development (SDD) with the **Scout-Plan-Build** workflow:

- **Scout Phase**: Fast agent (Haiku) discovers relevant files and patterns
- **Plan Phase**: Design agent (Sonnet) creates implementation plan using scout findings
- **Build Phase**: Builder agent (Sonnet) implements using plan + focused file context

**Key Principle**: You are the orchestrator. Request agents via Task tool:
```
Use Task tool with subagent_type=Explore to scout the codebase for [task]
```

For detailed guidance, read: `docs/spec-driven-development/06-agent-orchestration-implementation.md`

---

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

### Specifications (Primary Reference)
- Technical Specs: `docs/specs/technical/` - Architecture, security, database, testing, UI, coding standards
- Functional Specs: `docs/specs/functional/` - Feature specifications
- Tech Specs Index: `docs/specs/technical/README.md` - Quick reference for all standards

### Critical Technical Docs
- Theme System: `docs/specs/technical/ui-standards/theme-system.md` - **Read before UI work**
- Architecture: `docs/specs/technical/architecture/README.md`
- Security: `docs/specs/technical/security/README.md`
- Code Review: `docs/specs/technical/coding-standards/code-review-checklist.md`
- Error Handling: `docs/specs/technical/architecture/error-handling.md`

### Code Locations
- Routes: `routes/` (backend API)
- Services: `server/services/`
- E2E Tests: `tests/e2e/` (one per module)
- UI Components: `src/components/`

### Archive (Historical Reference Only)
- `docs/archive/` - Obsolete documents, do not use for active development

## Model Selection
- Scout (Haiku): File discovery, simple searches
- Build (Sonnet): Implementation, testing, most tasks
- Architect (Opus): Complex design decisions only

---

## 🤖 How to Use This as an AI Agent

### Agent Triggering Methods

**Method 1: Task Tool (Claude Code - Recommended)**
```
Use Task tool with subagent_type=Explore to discover files for [feature]
Use Task tool with subagent_type=Plan to design implementation
```

**Method 2: Explicit Role Assignment**
```
You are a Scout Agent. Your ONLY job is reconnaissance:
- Find all files related to [feature]
- Identify patterns and dependencies
- Do NOT modify code, only catalog and report
```

**Method 3: Parallel Execution**
```
I need 3 agents working in parallel:
1. Scout-Frontend: Find React components for [feature]
2. Scout-Backend: Find API routes for [feature]
3. Scout-Database: Find database schema for [feature]
Run as parallel Task calls and combine results.
```

### Context Priming (Load What You Need)

Request context priming commands before starting work:
- `/prime-auth` - Authentication implementation patterns
- `/prime-api` - API endpoint standards
- `/prime-database` - Database connection and query patterns
- `/prime-ui` - UI components and theme system
- `/prime-specs [feature-name]` - Load specific feature specification

**Why this matters**: These load only what's needed for your task, keeping context window efficient.

### Agent Role Guidance

**Scout Agent Needs**:
- always-on.md (this file)
- What to find (specific task)
- File structure overview
- Expected output format

**Planner Agent Needs**:
- Scout findings
- Feature specification (from `docs/specs/functional/`)
- Technical specs relevant to feature
- Architecture overview

**Builder Agent Needs**:
- Implementation plan (from planner)
- Only the 3-5 files to be modified
- always-on.md critical rules
- Reference implementations (see above section)

**Orchestrator Agent Needs**:
- Full project knowledge (this always-on.md)
- Feature specification
- Current implementation status
- Workflow progress (from `docs/specs/workflows/`)

### Context Bundles (Session Continuity)

When a session ends, request a context bundle summary:
```
Create a context bundle with:
- What was accomplished
- Key architectural decisions made
- Files modified
- Next steps and blockers
```

Next session, load it: `Read the context bundle from [date] to restore context`

---

## Learning Path: Which Modules to Read?

**Starting a new task?**
1. ✅ You're reading always-on.md (5 min) - Quick orientation
2. ✅ Use Scout-Plan-Build workflow for complex features
3. 📋 Read feature spec in `docs/specs/functional/[feature]/` if needed
4. 🔧 Request `/prime-[domain]` for pattern examples

**Want to understand SDD philosophy?**
- Module 1: Why SDD matters (theory)
- Module 2: How to write agentic prompts (fundamentals)
- Module 6: How to actually trigger agents (practical)

**Want to master agent coordination?**
- Module 3: Context engineering and multi-agent orchestration
- Module 4: Implementation techniques and tool selection
- Module 5: Advanced patterns and ROI analysis

**Want the full roadmap?** Read `docs/spec-driven-development/README.md`
