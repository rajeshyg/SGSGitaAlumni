---
description: Phase 0 project constraints that MUST be checked before any file modifications
triggers:
  - edit
  - modify
  - create
  - delete
  - server
  - database
  - config
  - migration
---

# Project Constraints (Phase 0)

**ALWAYS check these constraints BEFORE modifying files.**

## 🔒 Locked Files

These files require **explicit human approval** before modification:

| File | Reason |
|------|--------|
| `server.js` | Core server - breaking changes affect all users |
| `docker-compose.yml` | Container orchestration |
| `Dockerfile` | Build configuration |
| `nginx.conf` | Reverse proxy config |
| `config/database.js` | Database connection - security critical |
| `middleware/auth.js` | Authentication - security critical |
| `middleware/rateLimit.js` | Rate limiting - security critical |
| `.env*` | Environment variables - secrets |
| `vite.config.js` | Build system |
| `tsconfig.json` | TypeScript config |
| `package.json` | Dependencies |
| `migrations/*.sql` | Database migrations - data integrity |
| `terraform/*.tf` | Infrastructure as code |

**To modify locked files**: Ask user for explicit approval first.

## 🛑 Stop Triggers

These operations require **immediate halt and human review**:

- `rm -rf` - Recursive force delete
- `DROP TABLE/DATABASE` - Database destruction
- `TRUNCATE` - Data deletion
- `DELETE FROM table;` (without WHERE) - Unqualified delete
- `chmod 777` - Insecure permissions
- `--force` / `--no-verify` - Safety bypass
- `npm publish` - Package publishing
- `git push --force` - History rewriting

**If you need these operations**: Stop and explain why to the user.

## 🔌 Port Constraints

| Port | Reserved For |
|------|--------------|
| 3000 | Vite dev server |
| 3001 | API server |
| 5432 | PostgreSQL |
| 6379 | Redis |
| 5173 | Vite HMR |
| 4000-4999 | Test servers |
| 9000-9099 | Mock services |

**Forbidden**: 22, 80, 443, 25, 587 (system ports)

## Validation

Run constraint check:
```bash
node scripts/validation/validators/constraint-check.cjs --file <path>
node scripts/validation/validators/constraint-check.cjs --command "<cmd>"
node scripts/validation/validators/constraint-check.cjs --port <num>
```
