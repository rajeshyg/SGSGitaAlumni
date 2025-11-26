# SDD/TAC Framework: Problem-to-Solution Mapping Report

> **Report Date**: November 25, 2025  
> **Purpose**: Traceable mapping of AI coding pain points to proven solutions  
> **Principle**: Don't reinvent the wheel—leverage existing tools and patterns

---

## Executive Summary

Your pain point analysis (7.9/10 average severity) reveals systemic issues that IndyDevDan's Tactical Agentic Coding (TAC) methodology directly addresses. This report maps each problem to specific, implementable solutions using existing tools rather than custom development.

**Key Insight**: Most of your pain points trace to three root causes:
1. **Context Pollution** → Solved by R&D Framework (Reduce & Delegate)
2. **Lack of Planning Autonomy** → Solved by Scout-Plan-Build workflow
3. **No Quality Gates** → Solved by Skills, Hooks, and Specs

---

## Problem-Solution Matrix

### 🔴 CRITICAL SEVERITY PAIN POINTS

---

#### Problem 1: Rampant Duplication Syndrome (35%)

**Your Evidence**: 87+ root-level scripts, 5 JS/TS stub pairs, 15+ duplicate utilities

| Cause | Solution | Tool/Pattern | Implementation |
|-------|----------|--------------|----------------|
| AI doesn't know existing code | **Scout Phase** | Haiku discovery agent | Scout before every build |
| No codebase awareness | **Specs Directory** | `/docs/specs/` | Reference implementations |
| No duplication detection | **Pre-commit Hooks** | `check-redundancy.js` + `jscpd` | ✅ Already implemented |
| Context too large to scan | **R&D Framework** | Context priming via `/prime-*` | Load only relevant domain |

**Recommended Stack**:
```
┌─────────────────────────────────────────────────────────────┐
│                    DUPLICATION PREVENTION                    │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: Scout Phase (Before Build)                         │
│   → claude --model haiku -p "find existing [pattern]"       │
│   → Discovers existing implementations before creating new  │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: Specs as Source of Truth                           │
│   → /docs/specs/functional/[domain].md                      │
│   → Single reference for each domain's implementation       │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: Pre-commit Validation (✅ Already Have)            │
│   → check-redundancy.js blocks duplicate commits            │
│   → jscpd detects copy-paste patterns                       │
├─────────────────────────────────────────────────────────────┤
│ Layer 4: Skills Auto-Knowledge                              │
│   → .claude/skills/coding-standards.md                      │
│   → Auto-activates: "Check for existing implementations"    │
└─────────────────────────────────────────────────────────────┘
```

**Action Items**:
1. ✅ Keep `check-redundancy.js` (already working)
2. 🔴 Add Scout phase trigger in `always-on.md`: "Before creating any new file, search codebase for existing similar implementations"
3. 🔴 Create skill: `.claude/skills/duplication-prevention.md`

---

#### Problem 2: The Repetition Nightmare (25%)

**Your Evidence**: Created entire SDD Framework (6 modules), `always-on.md` exists solely to remind AI

| Cause | Solution | Tool/Pattern | Implementation |
|-------|----------|--------------|----------------|
| AI forgets context between sessions | **Context Bundles** | `docs/context-bundles/` | ✅ Documented |
| Must re-explain project every time | **Skills** | `.claude/skills/` | Auto-applies knowledge |
| Manual workflow triggering | **Auto-Activation** | Skill descriptions | ~80% auto-trigger |
| Session state not preserved | **Session Handoff** | Compact + restore | `pre_compact.py` hook |

**Solution Architecture** (from IndyDevDan):

```
┌─────────────────────────────────────────────────────────────┐
│                   CONTEXT PERSISTENCE STACK                  │
├─────────────────────────────────────────────────────────────┤
│ Always-On (≤50 lines)         │ Essentials only            │
│   → Tech stack, critical rules │ ~100 tokens                │
├─────────────────────────────────────────────────────────────┤
│ Skills (Auto-Activate)         │ Domain knowledge           │
│   → .claude/skills/           │ ~100 token scan, <5k loaded│
│   → Progressive disclosure    │ Loads ONLY when relevant   │
├─────────────────────────────────────────────────────────────┤
│ Prime Commands (On-Demand)     │ Deep context               │
│   → /prime-auth, /prime-api   │ ~1500 tokens when invoked  │
├─────────────────────────────────────────────────────────────┤
│ Context Bundles (Session End)  │ State preservation         │
│   → Architectural decisions   │ 60-70% restoration         │
│   → Current blockers          │ 90% token savings          │
└─────────────────────────────────────────────────────────────┘
```

**Why Skills Solve This** (from Anthropic's blog):
> "Skills are prompts and contextual resources that activate on demand, providing specialized guidance for specific task types without incurring permanent context overhead."

**Action Items**:
1. ✅ Reduced `always-on.md` to 44 lines
2. ✅ Created `/prime-framework` (unified SDD+TAC)
3. ✅ Created `.claude/skills/sdd-tac-workflow/SKILL.md`
4. 🔴 Test auto-activation in fresh session with 3+ file task

---

#### Problem 3: Mock Data Deception (10%)

**Your Evidence**: Custom ESLint rule `no-mock-data.js`, 14+ failed fixes masked by mock data

| Cause | Solution | Tool/Pattern | Implementation |
|-------|----------|--------------|----------------|
| AI creates fake data to "pass" | **ESLint Rule** | `no-mock-data.js` | ✅ Already implemented |
| No real integration testing | **Validator Phase** | Playwright/Gemini E2E | TAC Phase 5 |
| Claude not told to avoid mocks | **Skills** | Anti-pattern documentation | Auto-applies rules |
| Pre-commit bypassed | **Hook Enforcement** | Exit code 2 blocks | Deterministic gate |

**Recommended Stack**:
```
┌─────────────────────────────────────────────────────────────┐
│                   MOCK DATA PREVENTION                       │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: Skills (Proactive)                                 │
│   → .claude/skills/testing-patterns.md                      │
│   → Contains: "NEVER use mock data in integration tests"    │
│   → Auto-activates when writing test files                  │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: ESLint Rule (✅ Already Have)                      │
│   → no-mock-data.js catches faker, Math.random, etc.        │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: Pre-commit Hook                                    │
│   → detect-mock-data.js runs before commit                  │
│   → Exit code 1 blocks commit if mocks found                │
├─────────────────────────────────────────────────────────────┤
│ Layer 4: Validate Phase (TAC)                               │
│   → E2E tests with real API calls                           │
│   → "Block until tests pass with real data"                 │
└─────────────────────────────────────────────────────────────┘
```

**IndyDevDan's TDD Pattern** (from Anthropic best practices):
> "Be explicit about the fact that you're doing test-driven development so that it avoids creating mock implementations, even for functionality that doesn't exist yet in the codebase."

**Action Items**:
1. ✅ Keep `no-mock-data.js` ESLint rule
2. ✅ Keep `detect-mock-data.js` pre-commit
3. 🔴 Add to skills: "When writing tests, use real API calls, never mock data"
4. 🟡 Fix 1425 ESLint errors to re-enable pre-commit (dogfooding opportunity)

---

### 🟠 HIGH SEVERITY PAIN POINTS

---

#### Problem 4: Overall Costs More Time Than It Saves (Score: 10)

**Root Cause**: Cumulative time correcting AI negates benefits

| Cause | Solution | Tool/Pattern | ROI |
|-------|----------|--------------|-----|
| No planning before build | **Plan Phase** | Scout → Plan → Build | Review before tokens spent |
| Single agent does everything | **Parallel Agents** | Git worktrees + batching | 3-5x speedup |
| Expensive model for simple tasks | **Model Stack** | Haiku for scout, Sonnet for build | 10x cost savings |
| Manual workflow management | **Orchestrator** | O-Agent pattern | Full automation |

**Model Stack Decision Matrix** (from IndyDevDan):

| Task Type | Model | Approx Cost | Decision Rule |
|-----------|-------|-------------|---------------|
| File discovery | Haiku | ~$0.02 | Pure information retrieval |
| Documentation | Haiku | ~$0.02 | <500 lines output |
| Simple CRUD | Haiku | ~$0.02 | Straightforward patterns |
| Architecture | Sonnet | ~$1-2 | Design decisions needed |
| Complex refactor | Sonnet | ~$3-4 | Multi-file reasoning |
| Debugging | Sonnet | ~$2-3 | Requires deep reasoning |

**Action Items**:
1. 🔴 Add to `/prime-framework`: Model selection guide
2. 🔴 Use `claude --model haiku` for Scout phase
3. 🟡 Implement parallel agents with git worktrees for 10+ file features

---

#### Problem 5: Fails to Deliver Entire Solution (Score: 10)

**Root Cause**: You manually perform the agent's Plan step

| Cause | Solution | Tool/Pattern | Implementation |
|-------|----------|--------------|----------------|
| No spec to follow | **Spec-Driven Development** | `/docs/specs/` directory | Requirements → Design → Tasks |
| AI improvises architecture | **Plan Phase** | Planner doesn't code | Human reviews before build |
| Vague prompts | **Structured Prompts** | Input → Workflow → Output | Template in prime commands |

**Spec-Driven Workflow** (from research):
```
1. /spec:new feature-name           # Creates spec directory
2. /spec:requirements               # AI generates requirements.md
3. /spec:approve requirements       # Human gate
4. /spec:design                     # AI generates design.md
5. /spec:approve design             # Human gate
6. /spec:tasks                      # AI generates task breakdown
7. /spec:implement 1                # Execute phase by phase
```

**Existing Tools**:
- `cc-sdd` (npm): Spec-driven development for Claude Code
- `claude-code-spec-workflow`: Full Requirements → Design → Tasks → Implementation

**Action Items**:
1. 🟡 Evaluate `npx cc-sdd@latest --claude` for structured workflow
2. 🔴 Create `/docs/specs/` structure for new features
3. 🔴 Add "Specs as source of truth" to skills

---

#### Problem 6: Context Overload / Slow Response (Score: 10)

**Root Cause**: Context pollution from loading everything at once

| Cause | Solution | Tool/Pattern | Impact |
|-------|----------|--------------|--------|
| Massive `claude.md` | **R&D Framework** | Reduce static context | 70% reduction |
| All MCP tools loaded | **Dynamic Loading** | Load tools on demand | Tokens saved |
| No context isolation | **Subagents** | Separate context windows | No pollution |
| Everything in one session | **Delegation** | Task tool spawns workers | Summarize back |

**R&D Framework** (IndyDevDan's core principle):
```
R = REDUCE
├── Minimize always-on context (≤50 lines)
├── Use slash commands for on-demand loading
├── Delete preloaded MCP tools from .claude.json
└── Monitor with /context command

D = DELEGATE
├── Heavy tasks → subagents (separate context)
├── Scout results → summarized back to main
├── Context bundles → compressed state
└── Multiple agents → parallel execution
```

**Action Items**:
1. ✅ Reduced `always-on.md` from 144 → 44 lines (70% reduction)
2. 🔴 Edit `.claude.json` to remove preloaded MCP servers
3. 🔴 Use `/context` regularly to monitor token usage
4. 🟡 Implement subagent delegation for heavy research tasks

---

#### Problem 7: Slows Me Down Due to Heavy Reviewing (Score: 9)

**Root Cause**: AI skips planning, outputs low-quality code requiring heavy editing

| Cause | Solution | Tool/Pattern | Implementation |
|-------|----------|--------------|----------------|
| No quality gates | **Hooks** | PreToolUse, PostToolUse | Deterministic enforcement |
| No coding standards | **Skills** | Auto-applies standards | Zero manual guidance |
| No pre-implementation review | **Plan Mode** | Shift+Tab in Claude Code | Review architecture first |

**Hook Types for Quality** (from IndyDevDan's claude-code-hooks-mastery):

| Hook | Purpose | Exit Code 2 Behavior |
|------|---------|---------------------|
| UserPromptSubmit | Validate prompts before processing | Blocks prompt entirely |
| PreToolUse | Security validation, parameter checking | Blocks tool call |
| PostToolUse | Result validation, formatting | Shows error to Claude |
| Stop | Ensure tasks complete | Forces continuation |

**Block-at-Submit Pattern** (from enterprise usage):
```python
# PreToolUse hook for git commit
# Check for /tmp/agent-pre-commit-pass file
# If missing, hook blocks commit with exit code 2
# Forces Claude into "test-and-fix" loop until green
```

**Action Items**:
1. 🔴 Create `.claude/skills/coding-standards.md` with your standards
2. 🟡 Consider hooks for quality gates (optional - low priority per analysis)
3. 🔴 Use Plan Mode (Shift+Tab) for complex features

---

#### Problem 8: Misses Edge Cases (Score: 9)

**Root Cause**: Insufficient context and no specialized validation

| Cause | Solution | Tool/Pattern | Implementation |
|-------|----------|--------------|----------------|
| Generic agent | **Custom Agents** | Domain-specific subagents | Specialized knowledge |
| No testing validation | **Validator Agent** | Gemini/Playwright E2E | TAC Phase 5 |
| Missing domain knowledge | **Skills** | `.claude/skills/domain.md` | Auto-applies expertise |

**Custom Agent Structure** (from IndyDevDan):
```yaml
# .claude/agents/edge-case-tester.md
---
name: edge-case-tester
description: Use when testing for edge cases and boundary conditions
tools: Read, Bash
model: sonnet
---

## Purpose
You are an edge case specialist. For any feature, identify:
1. Boundary conditions (min, max, empty, null)
2. Race conditions (concurrent access)
3. Error states (network failure, timeout)
4. User input variations (unicode, injection)

## Report Format
| Edge Case | Test | Status |
|-----------|------|--------|
```

**Action Items**:
1. 🔴 Add edge case requirements to specs template
2. 🟡 Create domain-specific test skills
3. 🟢 Consider custom validation agent

---

#### Problem 9: Security Blindspots (Score: 8)

**Your Evidence**: Auth bypass, SQL injection, OTP logging, JWT exposure

| Cause | Solution | Tool/Pattern | Implementation |
|-------|----------|--------------|----------------|
| AI generates insecure defaults | **Skills** | Security rules auto-apply | Always enforced |
| No security validation | **PreToolUse Hook** | Block dangerous patterns | `exit(2)` stops execution |
| Not in system prompt | **Spec Security Section** | Each spec includes security | Required section |

**Security Patterns from IndyDevDan**:
```python
# PreToolUse hook - security blocking
dangerous_patterns = [
    r'rm\s+.*-[rf]',        # rm -rf variants
    r'sudo\s+rm',           # sudo rm commands  
    r'chmod\s+777',         # Dangerous permissions
    r'>\s*/etc/',           # Writing to system directories
    r'\.env',               # Accessing env files
]

for pattern in dangerous_patterns:
    if re.search(pattern, command, re.IGNORECASE):
        print(f"BLOCKED: {pattern} detected", file=sys.stderr)
        sys.exit(2)
```

**Security Skill Template**:
```markdown
# Security Patterns
When working on security-related code, automatically apply:

## Required Practices
- Parameterized queries ONLY (never string concatenation)
- Server-side validation for ALL client claims
- NEVER log sensitive data (tokens, OTPs, passwords)
- Rate limiting on authentication endpoints
- HMAC verification for session tokens

## Anti-Patterns to Block
- `otpVerified: true` from client → ALWAYS verify server-side
- String concatenation in SQL → Use parameterized queries
- console.log(token) → NEVER log tokens
```

**Action Items**:
1. ✅ Phase 8 security fixes already implemented
2. 🔴 Create `.claude/skills/security-rules.md`
3. 🟡 Add security section to spec templates

---

#### Problem 10: Cost Inefficiency (Score: 9)

**Root Cause**: Using expensive models for simple tasks

| Solution | Implementation | Savings |
|----------|----------------|---------|
| Haiku for Scout | `claude --model haiku -p "[scout task]"` | 10x cheaper |
| Haiku for docs | `claude --model haiku -p "[doc task]"` | 10x cheaper |
| Parallel batching | Git worktrees + multiple agents | Time savings |
| Context monitoring | `/context` command | Prevent bloat |

**Decision Rule**: If task requires <500 lines or pure retrieval → Haiku. Otherwise → Sonnet.

**Action Items**:
1. 🔴 Add model selection guide to `/prime-framework`
2. 🔴 Default Scout phase to Haiku
3. 🟡 Track costs per task type to optimize

---

### 🟡 MEDIUM SEVERITY PAIN POINTS

---

#### Problem 11: Fix-on-Fix Cascade

**Your Evidence**: 14+ failed incremental fixes, 68 audit issues

| Cause | Solution | Tool/Pattern |
|-------|----------|--------------|
| No root cause analysis | **Scout Phase** | Understand before fixing |
| Incremental patches | **Design Phase** | Architectural solution |
| No testing before commit | **Stop Hook** | Block until tests pass |

**Anti-Pattern**:
```
Bug → Quick Fix → New Bug → Quick Fix → Complexity Spiral
```

**Correct Pattern** (Scout-Plan-Build):
```
Bug → Scout (understand root cause) → Plan (architectural fix) → Build → Validate
```

---

#### Problem 12: Over-Engineering / Architecture Drift

**Your Evidence**: Deleted Feed System, ChatService god object (1314 lines)

| Cause | Solution | Tool/Pattern |
|-------|----------|--------------|
| No simplicity constraint | **Skills** | "Simple over complex" rule |
| No architecture review | **Plan Phase** | Review before build |
| No refactoring triggers | **Code Quality Skill** | Detect god objects |

**Skill Content**:
```markdown
## Architecture Principles
- Prefer direct API calls over adapters
- Services should be <300 lines
- If >5 methods, consider splitting
- Ask: "Is this the simplest solution?"
```

---

#### Problem 13: Resource/Connection Leaks

**Your Evidence**: Missing `finally` blocks, N+1 queries

| Cause | Solution | Tool/Pattern |
|-------|----------|--------------|
| AI forgets cleanup | **Skills** | Resource management rules |
| No pattern enforcement | **ESLint** | Custom rules for cleanup |

**Skill Content**:
```markdown
## Resource Management
- ALWAYS use try/finally for database connections
- ALWAYS support connection parameter for transactions
- Check for N+1: if loop + query, batch instead
```

---

## Implementation Priority

### 🔴 TIER 1: Do This Week (Highest ROI)

| # | Action | File | Impact |
|---|--------|------|--------|
| 1 | Create duplication prevention skill | `.claude/skills/duplication-prevention.md` | Stops 35% of issues |
| 2 | Create security rules skill | `.claude/skills/security-rules.md` | Prevents vulnerabilities |
| 3 | Create coding standards skill | `.claude/skills/coding-standards.md` | Reduces review time |
| 4 | Add model selection to prime-framework | `.claude/commands/prime-framework.md` | 10x cost savings |
| 5 | Test auto-activation | Fresh session test | Validates framework |

### 🟡 TIER 2: This Month (High Value)

| # | Action | Impact |
|---|--------|--------|
| 6 | Fix 1425 ESLint errors (dogfooding) | Re-enables pre-commit gates |
| 7 | Evaluate `cc-sdd` for spec workflow | Structured development |
| 8 | Document git worktrees pattern | True parallel execution |
| 9 | Create domain-specific test skills | Catches edge cases |

### 🟢 TIER 3: Incremental

| # | Action | Impact |
|---|--------|--------|
| 10 | Complete workflow documentation (44% → 100%) | Full coverage |
| 11 | Consider hooks for advanced quality gates | Optional automation |
| 12 | Create custom validation agents | Specialized testing |

---

## Tools Reference

### Existing Tools (Don't Reinvent)

| Category | Tool | Source | Purpose |
|----------|------|--------|---------|
| SDD Workflow | `cc-sdd` | npm | Spec-driven commands |
| SDD Workflow | `claude-code-spec-workflow` | npm | Full SDD with dashboard |
| Hooks Demo | `claude-code-hooks-mastery` | IndyDevDan GitHub | All 8 hooks implemented |
| Observability | `claude-code-hooks-multi-agent-observability` | IndyDevDan GitHub | Real-time agent monitoring |
| Skills Infrastructure | `claude-code-infrastructure-showcase` | diet103 GitHub | Skill auto-activation |
| Duplication Detection | `jscpd` | npm | Copy-paste detection |
| Duplication Detection | SonarQube | sonarqube.org | Code quality metrics |

### Your Existing Infrastructure (Keep!)

| Tool | Status | Purpose |
|------|--------|---------|
| `check-redundancy.js` | ✅ Working | Duplicate file detection |
| `detect-mock-data.js` | ✅ Working | Mock data prevention |
| `no-mock-data.js` ESLint | ✅ Working | ESLint rule |
| `.husky/pre-commit` | ⚠️ Bypassed (ESLint errors) | Quality gate |
| `/prime-*` commands | ✅ Implemented | Context priming |
| SDD Framework (6 modules) | ✅ Complete | Methodology docs |

---

## Quick Reference Card

### Workflow Selection
```
1-2 files   → Build directly (no framework)
3-10 files  → Scout → Plan → Build (single agent)
10+ files   → Scout → Plan → Build (parallel) → Orchestrate → Validate
Research    → Scout only
```

### Model Selection
```
Scout/discovery  → claude --model haiku
Documentation    → claude --model haiku
Simple CRUD      → claude --model haiku
Architecture     → claude --model sonnet (default)
Complex build    → claude --model sonnet
Orchestration    → claude --model sonnet
```

### Context Budget
```
Always-on.md     → ≤50 lines (~100 tokens)
Skill scan       → ~100 tokens per skill
Skill activated  → <5k tokens
Prime command    → ~1500 tokens
Total budget     → 200k tokens (aim <80%)
```

### Quality Gates
```
Pre-commit       → Duplicate check, mock data check, ESLint
Skills           → Auto-applies standards without prompting
Plan review      → Human approves before build phase
Validate phase   → E2E tests pass before merge
```

---

## Conclusion

Your pain points are not unique—they're the exact problems IndyDevDan's TAC methodology was designed to solve. The key insight is:

> **"Build the system that builds the system"** — IndyDevDan

By implementing Skills (auto-applying knowledge), the Scout-Plan-Build workflow (preventing premature coding), and leveraging existing tools (not reinventing), you can address all critical pain points with minimal custom development.

**The Framework Works When**:
- Fresh sessions auto-trigger the right workflow
- AI checks for existing implementations before creating new
- Quality gates block bad code deterministically
- Cost optimization happens automatically via model selection

**Next Step**: Test the framework in a fresh session by implementing a 3+ file feature and observing if the skill auto-activates and workflow triggers correctly.
