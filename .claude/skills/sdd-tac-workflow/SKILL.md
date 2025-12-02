---
name: sdd-tac-workflow
description: Apply SDD/TAC methodology for coding tasks. Auto-invoke when implementing features, refactoring code, fixing bugs affecting 3+ files, planning implementations, or when user mentions Scout-Plan-Build workflow. This skill guides systematic development through Phase 0 (Constraints), Scout (reconnaissance), Plan (design), and Build (execution) phases.
---

# SDD/TAC Workflow Skill

When working on coding tasks in this project, apply the Spec-Driven Development (SDD) and Tactical Agentic Coding (TAC) methodology.

## When This Skill Applies
- Implementing new features
- Refactoring existing code
- Fixing bugs that affect 3+ files
- Planning complex implementations
- User explicitly mentions "Scout-Plan-Build" or "framework"

## Quick Assessment

### Step 1: Count Affected Files
Quickly determine how many files this task will touch:
- **1-2 files**: Build directly (no framework overhead needed)
- **3-10 files**: Apply Phase 0 + Scout-Plan-Build workflow
- **10+ files**: Full TAC with potential parallel agents

### Step 2: State Your Approach
Explicitly tell the user which workflow you're using:
- "This affects X files, so I'm using [workflow name]"
- For 3+ files: "I'll check constraints and Scout first"

### Step 3: Load Framework Reference
For tasks affecting 3+ files:
1. State: "Loading /prime-framework for methodology guidance"
2. Request the user invoke: `/prime-framework`
3. Or proceed with embedded workflow below if user can't/won't load

## Phase 0: Constraint Check (ALWAYS FIRST)

**Purpose**: Verify operation is allowed before proceeding
**When**: BEFORE modifying any files

**Check**:
1. **Locked Files** - Is any target file in LOCKED_FILES list?
   - `server.js`, `docker-compose.yml`, `Dockerfile`, `nginx.conf`
   - `config/database.js`, `middleware/auth.js`, `middleware/rateLimit.js`
   - `.env*`, `vite.config.js`, `tsconfig.json`, `package.json`
   - `migrations/*.sql`, `terraform/*.tf`
   
2. **Stop Triggers** - Does the task involve dangerous operations?
   - `rm -rf`, `DROP TABLE/DATABASE`, `TRUNCATE`
   - `chmod 777`, `--force`, `--no-verify`
   
3. **Port Constraints** - Are required ports available?

**If blocked**: Ask user for explicit approval before proceeding.

**Validation command**:
```bash
node scripts/validation/validators/constraint-check.cjs --file <path>
```

## Scout-Plan-Build Workflow (Embedded)

### Scout Phase (Reconnaissance)
**Purpose**: Find all relevant files before making changes
**How**: Use Task tool with `subagent_type=Explore` or conduct manual search

**Find**:
- Existing files related to this feature/bug
- Patterns and conventions currently used
- Dependencies and integrations
- Potential impact areas

**Report Format**:
```
## Scout Findings
- [file path] - [what it does]
- [file path] - [what it does]

Key patterns: [list patterns found]
Dependencies: [list dependencies]
```

### Plan Phase (Design)
**Purpose**: Design implementation before writing code
**Input**: Scout findings + feature specs

**Create Plan With**:
1. Architecture decisions (and why)
2. Files to create/modify
3. Implementation sequence
4. Risk areas and mitigations

**Show plan to user for approval before building**

### Build Phase (Execution)
**Purpose**: Implement the plan systematically

**Follow**:
- The plan (not ad-hoc changes)
- Existing code patterns from Scout findings
- Project coding standards

**For 10+ files**: Consider suggesting parallel work or breaking into phases

## Load Domain Context

After activating this workflow, load relevant domain knowledge:
- Auth work → request `/prime-auth`
- API work → request `/prime-api`
- Database work → request `/prime-database`
- UI work → request `/prime-ui`

## Quality Checks

Before completing task:
- [ ] Scout phase covered all impacted areas
- [ ] Plan was reviewed/approved
- [ ] Implementation follows the plan
- [ ] Tests pass (run tests if applicable)
- [ ] Pre-commit checks will pass (lint, format, etc.)

## Critical Project Rules (Always Apply)

From `docs/specs/context/always-on.md`:
1. **SQL**: Parameterized queries only `[?, ?]` - NO string interpolation
2. **DB**: Always use try/finally for connection.release()
3. **Validation**: Check all input before DB operations
4. **Logging**: Never log passwords, JWT secrets, OTP codes, tokens

## Reference Implementations

Check these before duplicating functionality:
- Auth: `middleware/auth.js`, `routes/otp.js`
- API: `routes/auth.js` (response format)
- Database: `server/config/database.js` (pool pattern)
- UI: `src/contexts/AuthContext.tsx`, `src/App.tsx`

---

**Auto-activation**: This skill automatically applies when coding tasks are detected. If you need the full methodology reference, request `/prime-framework`.
