# AI Coding Assistant Pain Points Analysis (SGSGitaAlumni)

## 🔴 CRITICAL SEVERITY

### 1. Rampant Duplication Syndrome (35%)
AI duplicates everything—code, APIs, variables, folders, DB schemas, documentation.

| Duplication Type | Evidence Found |
|-----------------|----------------|
| Service Files | `api.ts` vs `APIService.ts`; `OTPService.ts` vs `MultiFactorOTPService.ts` |
| Naming Inconsistency | `alumniDirectoryService.ts` (camelCase) vs `AlumniDataIntegrationService.ts` (PascalCase) |
| Utility Script Graveyard | 87+ root-level scripts; 15+ duplicate utilities (OTP scripts, collation fixes) |
| JS/TS Stub Pairs | 5 `.js` stubs alongside complete `.ts` implementations (see [DUPLICATE_FILES_AUDIT.md](docs/audits/DUPLICATE_FILES_AUDIT.md)) |
| Debug Script Explosion | 19 debug scripts in `scripts/debug/` doing variations of the same thing |
| Test Script Variations | `test-exact-http-login.js`, `test-real-http-login.js`, `test-exact-login-flow.js`—same concept, different files |

Mitigation Built: Custom `check-redundancy.js` script, `.husky/pre-commit` duplicate detection, `DUPLICATE_FILES_AUDIT.md`.

---

### 2. The Repetition Nightmare (25%)
You must repeat instructions over and over—AI forgets context between sessions.

Evidence:
- Created entire Spec-Driven Development (SDD) Framework (6 modules) to combat this.
- `always-on.md` exists solely to remind AI of context.
- `claude.md` is a pointer file to the real context file.
- Manual "Context Bundles" required: "At session end, create context bundle... Next session: restore 70% of context".
- `SDD_FRAMEWORK_REPORT.md` notes: "Required explicit reminder to apply structured approach."
- Extensive `/prime-auth`, `/prime-api`, `/prime-database` commands to re-inject context.

Your Direct Quote (from SDD docs):
> "Build once, document well, never repeat." — But you had to document because AI kept forgetting.

---

### 3. Mock Data Deception (10%)
AI creates "working" demos with fake data, claims production-readiness without testing.

Evidence:
- Custom ESLint Rule: `eslint-rules/no-mock-data.js` — 130+ lines banning `mockData`, `faker`, `Math.random()`, hardcoded arrays.
- Validation Script: `scripts/core/detect-mock-data.js` — 230+ lines scanning for mock patterns.
- Zero Tolerance Policy: Explicit phrase used in documentation.
- Posting Architecture Overhaul: After 14+ "fixes," discovered the Dashboard Feed was showing incomplete data (missing domains/tags)—classic mock-data masking real integration issues.

---

## 🟠 HIGH SEVERITY (Additional Categories)

### 4. Fix-on-Fix Cascade (8%)
One AI "fix" creates a new bug, requiring another fix, spiraling into complexity.

Evidence:
- [posting-architecture-overhaul.md](docs/lessons-learnt/posting-architecture-overhaul.md): 14+ failed incremental fixes before deleting the entire Feed System.
- [CODE_QUALITY_AUDIT.md](docs/audits/CODE_QUALITY_AUDIT.md): 68 distinct issues accumulated, including 11 critical transaction isolation violations.

---

### 5. Over-Engineering / Architecture Drift (7%)
AI suggests complex solutions when simple ones work.

Evidence:
- Deleted "Feed System": Complex adapters, transformers, embedded data—replaced by simple `/api/postings` call.
- ChatService God Object: 1314 lines, 15 methods, no transaction support—accumulated complexity.
- Multiple data transformation layers causing data loss.

Lesson Learned Quote:
> "Simplicity over complexity—Direct API calls beat complex adapters."

---

### 6. Security Blindspots (6%)
AI generates insecure code unless explicitly told otherwise.

Evidence from [phase-8-security-vulnerabilities-resolved.md](docs/lessons-learnt/phase-8-security-vulnerabilities-resolved.md):
- 5 critical vulnerabilities resolved in Phase 8.
- Authentication Bypass: AI accepted `otpVerified: true` from client without server-side verification.
- SQL Injection: LIMIT/OFFSET used string concatenation instead of parameterized queries.
- OTP Logging: Actual OTP codes logged to console.
- JWT Secret Exposure: Token previews logged.

---

### 7. Connection/Resource Leaks (5%)
AI forgets `finally` blocks, doesn't release database connections.

Evidence from CODE_QUALITY_AUDIT.md:
- Missing `finally` blocks in `routes/alumni.js`, `routes/invitations.js`.
- All 15 ChatService methods lack connection parameter support—impossible to use in transactions.
- N+1 query problems: 20 conversations = 41 queries.

---

### 8. Orphaned/Dead Code Creation (4%)
AI leaves behind massive amounts of unused code after refactoring.

Evidence:
- `scripts/archive/` contains 50+ obsolete scripts.
- 25+ test scripts for deprecated flows.
- 4 deleted feed-related files only after architectural overhaul.
- Old backup files: `moderation-old-backup-nov4.js`.

---

### 9. Inconsistent Error Handling (3%)
AI uses different error formats in different places.

Evidence:
- Some endpoints return `{ error: '...' }`, others use `ApiError` format.
- Swallowed exceptions in JSON parsing (error logged, then silently ignored).
- 261 `console.log` occurrences across 17 route files.

---

### 10. Documentation Drift (2%)
Generated docs become inconsistent with actual code.

Evidence:
- Documentation referenced deleted endpoints.
- Feed system diagrams outdated after overhaul.
- Multiple "lessons learnt" files covering overlapping topics.

---

## 📊 Summary Table

| # | Pain Point | Severity | Your Estimate | Evidence |
|---|------------|----------|---------------|----------|
| 1 | Rampant Duplication | 🔴 CRITICAL | 35% | 87+ scripts, 5 JS/TS pairs, 15+ util duplicates |
| 2 | Repetition Nightmare | 🔴 CRITICAL | 25% | SDD Framework, context bundles, prime commands |
| 3 | Mock Data Deception | 🔴 CRITICAL | 10% | ESLint rule, detection script, 14+ failed fixes |
| 4 | Fix-on-Fix Cascade | 🟠 HIGH | - | 14+ attempts, 68 audit issues |
| 5 | Over-Engineering | 🟠 HIGH | - | Deleted Feed System, ChatService god object |
| 6 | Security Blindspots | 🟠 HIGH | - | 5 critical vulns, auth bypass, SQL injection |
| 7 | Resource Leaks | 🟡 MEDIUM | - | Missing finally blocks, N+1 queries |
| 8 | Orphaned Code | 🟡 MEDIUM | - | 50+ archived scripts |
| 9 | Error Handling Inconsistency | 🟡 MEDIUM | - | Mixed formats, swallowed exceptions |
| 10 | Documentation Drift | 🟢 LOW-MEDIUM | - | Outdated diagrams, overlapping docs |

---

## 🎯 Mitigations You've Built

| Problem | Solution Implemented |
|---------|---------------------|
| Duplication | `check-redundancy.js`, `DUPLICATE_FILES_AUDIT.md`, pre-commit hooks |
| Repetition | SDD Framework (6 modules), `always-on.md`, context bundles |
| Mock Data | ESLint rule, `detect-mock-data.js`, Zero Tolerance Policy |
| Security | Phase 8 overhaul, HMAC tokens, rate limiting |
| Architecture | Scout-Plan-Build workflow, `/prime-*` commands |

---

### Further Considerations
1. Automated duplication detection in CI? Run `check-redundancy.js` + `jscpd` on every PR.
2. Token budget tracking? Measure context size to detect when AI is "forgetting."
3. Integration test gates? Block merges until real API tests pass (not mocks).
