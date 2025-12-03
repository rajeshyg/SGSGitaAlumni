---
name: duplication-prevention
description: CRITICAL - Auto-activates before creating ANY new files, components, utilities, services, database tables, or scripts. Prevents the rampant duplication syndrome common with AI coding.
---

# Duplication Prevention Skill

## ⛔ STOP TRIGGERS

If ANY of these are true, **STOP** and search first:

1. Creating a new file in `src/utils/`, `src/lib/`, `utils/`
2. Creating a new component in `src/components/`
3. Creating a new route in `routes/`
4. Creating a new script in `scripts/`
5. Creating a new migration in `migrations/`
6. Writing SQL with `CREATE TABLE` or `ALTER TABLE`
7. Adding new enum values or constants
8. Creating anything with "validation", "email", "format", "auth", "user" in the name

**Before ANY creation: SEARCH FIRST, CREATE SECOND**

---

## Mandatory Duplication Registry Check

Before creating ANYTHING, check: **`.claude/duplication-registry.json`**

This file contains:
- All existing database tables and their fields
- All existing utilities and their exports
- All existing components
- All existing API routes
- All existing enums and constants

---

## Pre-Creation Checklist

### For New Files

1. **Search for similar names**:
   ```
   Glob: **/*[keyword]*.{js,ts,tsx}
   ```

2. **Search for similar functionality**:
   ```
   Grep: "[function-you-need]"
   ```

3. **Check the registry**:
   ```
   Read .claude/duplication-registry.json
   ```

### For Database Changes

**⚠️ DATABASE DUPLICATES ARE THE MOST DANGEROUS**

BEFORE any SQL:
1. Check `duplication-registry.json` → `databases.primary.tables`
2. Check existing migrations in `migrations/` and `scripts/database/migrations/`
3. Use `CREATE TABLE IF NOT EXISTS` (never bare CREATE TABLE)
4. NEVER create a new table for:
   - User data → Use `APP_USERS`, `ALUMNI_MEMBERS`, `USER_PROFILES`
   - Invitations → Use `USER_INVITATIONS`, `FAMILY_INVITATIONS`
   - Family data → Use `FAMILY_MEMBERS`
   - Messages → Use `MESSAGES`, `CONVERSATIONS`
   - Postings → Use `POSTINGS`, `POSTING_TAGS`

### For New Components

Check these locations FIRST:
```
src/components/ui/      - Shadcn components (Button, Input, Card, Dialog, etc.)
src/components/shared/  - Shared components (Header, Footer, Loading)
src/components/auth/    - Auth components (LoginForm, RegisterForm)
```

### For New Utilities

Check these locations FIRST:
```
src/utils/errorHandling.ts  - validateEmail, formatError, handleApiError
src/utils/formatters.ts     - formatCurrency, formatPhone, formatName
src/lib/utils.ts            - cn, formatDate
utils/database.js           - getPool, query, transaction
utils/email.js              - sendEmail, sendOTP
```

### For New API Routes

Check `routes/` directory FIRST:
```
routes/auth.js         - /api/auth/*
routes/users.js        - /api/users/*
routes/alumni.js       - /api/alumni/*
routes/postings.js     - /api/postings/*
routes/chat.js         - /api/chat/*
routes/invitations.js  - /api/invitations/*
routes/family-members.js - /api/family-members/*
```

---

## Common Duplications to Avoid

| Want to Create | Already Exists |
|---------------|----------------|
| email validation | `src/utils/errorHandling.ts:validateEmail` |
| user table | `APP_USERS`, `ALUMNI_MEMBERS`, `USER_PROFILES` |
| auth route | `routes/auth.js` |
| Button component | `src/components/ui/button.tsx` |
| Modal/Dialog | `src/components/ui/dialog.tsx` |
| date formatting | `src/lib/utils.ts:formatDate` |
| database connection | `utils/database.js:getPool` |
| invitation system | `USER_INVITATIONS`, `routes/invitations.js` |
| family management | `FAMILY_MEMBERS`, `routes/family-members.js` |
| chat messages | `MESSAGES`, `CONVERSATIONS`, `routes/chat.js` |

---

## What to Do Instead of Creating New

1. **REUSE**: Import and use existing function/component
2. **EXTEND**: Add new functionality to existing file
3. **REFACTOR**: If existing code is messy, improve it
4. **COMPOSE**: Combine existing pieces

**Example - WRONG:**
```
User: "Create email validation"
You: *creates src/utils/emailValidator.ts* ❌
```

**Example - RIGHT:**
```
User: "Create email validation"
You: "Let me check for existing email validation..."
*Searches codebase*
*Finds src/utils/errorHandling.ts has validateEmail*
You: "Found existing validateEmail. I'll use that." ✅
```

---

## Hook Protection

This project has automated duplication detection:
- **PreToolUse hook** checks for duplication patterns
- **Database operations** (CREATE TABLE) are BLOCKED if risky
- **Session analyzer** tracks duplication warnings
- **Pre-commit** runs jscpd to detect copy-paste

---

## Integration with SDD/TAC

This skill is part of **Phase 1: Scout**:

1. **SCOUT**: Search for existing implementations (this skill)
2. **PLAN**: Decide if new creation is truly needed
3. **BUILD**: Reuse existing code when possible
4. **VALIDATE**: Confirm no duplicates were created

---

**Remember**: The best code is code that already exists and works.
- **Scout phase**: Discover existing implementations (this skill reinforces)
- **Plan phase**: Decide if new file is truly needed
- **Build phase**: Reuse existing code when possible

---

**Remember**: The best code is code that already exists and works. Don't reinvent the wheel.
