---
version: 4.0
status: active
last_updated: 2025-12-05
applies_to: framework
description: Hub-and-spoke context management, R&D framework, and orchestration patterns
supersedes: archive/2025-12-05-sub-agent-patterns-v3.md
---

# Sub-Agent Patterns: Hub-and-Spoke Orchestration

---

## Overview

**R&D = Reduce & Delegate** - The core strategy for managing AI context efficiently.

| Principle | What It Means | Why It Matters |
|-----------|---------------|----------------|
| **Reduce** | Minimize static context | Faster responses, lower costs |
| **Delegate** | Offload to sub-agents via hub | Isolated contexts, clean handoffs |

**Key Update (2025-12-05)**: Sub-agents communicate ONLY through the Primary Agent (hub-and-spoke model).

---

## Part 1: Hub-and-Spoke Model

### The Architecture

```
                         USER
                           │
                           ▼
              ┌────────────────────────┐
              │    PRIMARY AGENT       │
              │    (Orchestrator)      │
              │        OPUS            │
              │                        │
              │  • Hub of all comms    │
              │  • Aggregates results  │
              │  • Makes decisions     │
              └────────────┬───────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
      ┌─────────┐    ┌─────────┐    ┌─────────┐
      │  SCOUT  │    │ BUILDER │    │VALIDATOR│
      │ (Haiku) │    │(Sonnet) │    │ (Haiku) │
      │         │    │         │    │         │
      │ Reports │    │ Reports │    │ Reports │
      │   TO    │    │   TO    │    │   TO    │
      │ Primary │    │ Primary │    │ Primary │
      └─────────┘    └─────────┘    └─────────┘
           │               │               │
           └───────────────┴───────────────┘
                           │
                  ALL → PRIMARY ONLY
```

### Communication Rules (CRITICAL)

| From | To | Allowed? |
|------|-----|----------|
| User | Primary | ✅ YES |
| Primary | User | ✅ YES |
| Primary | Any Sub-agent | ✅ YES |
| Any Sub-agent | Primary | ✅ YES |
| Scout | Builder | ❌ **NO** |
| Builder | Validator | ❌ **NO** |
| Any Sub-agent | User | ❌ **NO** |

### Why Hub-and-Spoke?

| ❌ Direct Communication | ✅ Hub-and-Spoke |
|-------------------------|------------------|
| Context polluted at handoff | Each agent isolated |
| Hard to debug flow | Clear audit trail |
| Sub-agents make user decisions | Primary controls UX |
| 75k tokens by third agent | ~10k per agent max |

---

## Part 2: Reduce (Context Management)

### The Problem

```
200k token limit
─────────────────────────────────────────
│ System prompt          │ ~2k tokens   │
│ always-on.md           │ ~100 tokens  │
│ Skills (scanned)       │ ~400 tokens  │
│ Skills (activated)     │ ~5k tokens   │
│ Prime command          │ ~1.5k tokens │
│ Conversation history   │ grows...     │
│ File contents read     │ grows...     │
│ ──────────────────────────────────────│
│ REMAINING FOR WORK     │ < 180k      │
─────────────────────────────────────────
```

When context exceeds ~70%, quality degrades.

### The Solution: Context Persistence Stack

```
Layer 1: Always-On (~100 tokens)     ← Permanent
Layer 2: Skills (~400 scan, ~5k active) ← Auto-triggered
Layer 3: Prime Commands (~1.5k)      ← On-demand
Layer 4: Context Bundles             ← Session handoff
```

### Layer 1: Always-On Context

**File**: `docs/specs/context/always-on.md`  
**Target**: ≤50 lines (~100 tokens)

Contains ONLY:
- Tech stack essentials
- Critical security rules
- Project conventions that apply to EVERY task

### Layer 2: Skills (Auto-Activate)

**Location**: `.claude/skills/`

| Skill | Triggers When | Tokens |
|-------|---------------|--------|
| `sdd-tac-workflow` | 3+ file tasks | ~1k |
| `duplication-prevention` | Creating files | ~400 |
| `security-rules` | Auth/DB/API code | ~800 |
| `coding-standards` | Service/component code | ~1.5k |

### Layer 3: Prime Commands (On-Demand)

**Location**: `.claude/commands/`

| Command | Loads | Use When |
|---------|-------|----------|
| `/prime-framework` | Full SDD/TAC | Multi-file features |
| `/prime-auth` | Auth patterns | Auth/login work |
| `/prime-api` | API patterns | Route development |
| `/prime-database` | DB patterns | Query/migration work |

### Layer 4: Context Bundles

**Location**: `docs/context-bundles/`

**Template**:
```markdown
# Context Bundle: [Feature Name]
**Date**: [Date]

## What Was Accomplished
- Item 1

## Files Modified
- `file.ts` - Changes

## Key Decisions
- Decision: Rationale

## Next Steps
- [ ] Task 1

## Key References
- `file.ts:123` - Description
```

---

## Part 3: Delegate (Sub-Agent Patterns)

### Why Delegate?

| Single Agent | Hub-and-Spoke |
|--------------|---------------|
| Context accumulates | Each sub-agent has fresh context |
| Slows down at 70%+ | Full speed throughout |
| Sequential execution | Orchestrated parallelism |
| Single point of failure | Isolated failures |

### Sub-Agent Types

| Type | Model | Purpose | Output |
|------|-------|---------|--------|
| **Scout** | Haiku | Discovery, search | Summary of findings |
| **Builder** | Sonnet | Implementation | Completed code |
| **Validator** | Haiku | Quality checks | Pass/fail report |

### Invoking Sub-Agents

**Via Task Tool**:
```markdown
Use Task tool with:
- For exploration → Scout agent
- For implementation → Builder agent
- For validation → Validator agent
```

**Via Claude CLI**:
```bash
# Scout with Haiku
claude --model haiku -p "scout [domain] and report findings to primary"

# Build with Sonnet
claude --model sonnet -p "implement [feature] per plan and report to primary"

# Validate with Haiku
claude --model haiku -p "validate [implementation] and report to primary"
```

### Context Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 ORCHESTRATOR (Opus)                          │
│                                                             │
│  1. Receive task from user                                  │
│       │                                                     │
│       ▼                                                     │
│  2. Spawn Scout (Haiku)                                     │
│       │                                                     │
│       │  Scout works in ISOLATED context                    │
│       │  Scout returns SUMMARY to Primary                   │
│       │                                                     │
│       ▼                                                     │
│  3. Primary analyzes Scout findings                         │
│       │                                                     │
│       ▼                                                     │
│  4. Spawn Builder (Sonnet) with filtered context            │
│       │                                                     │
│       │  Builder works in ISOLATED context                  │
│       │  Builder returns RESULTS to Primary                 │
│       │                                                     │
│       ▼                                                     │
│  5. Spawn Validator (Haiku)                                 │
│       │                                                     │
│       │  Validator returns REPORT to Primary                │
│       │                                                     │
│       ▼                                                     │
│  6. Primary synthesizes and responds to User                │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 4: Sub-Agent Prompt Templates

### Scout Agent Prompt Template

```markdown
## Task
Scout the [DOMAIN] for existing patterns.

## Context (from Primary)
User wants to: [BRIEF SUMMARY]
Relevant files hint: [OPTIONAL HINTS]

## Questions to Answer
1. What files exist for [DOMAIN]?
2. What patterns are used?
3. What dependencies exist?

## Output Format
Report to Primary Agent with:
- **Files Found**: (path, line count)
- **Patterns**: (with code examples)
- **Dependencies**: (internal/external)
- **Recommendations**: (for implementation)

## Rules
- Do NOT address the user
- Report ONLY to Primary Agent
- Stay within read-only tools
```

### Builder Agent Prompt Template

```markdown
## Task
Implement [FEATURE] per the plan.

## Context (from Primary)
Scout findings: [SUMMARY]
Plan: [IMPLEMENTATION PLAN]
Files to modify: [FILE LIST]

## Implementation Requirements
1. Requirement one
2. Requirement two
3. Requirement three

## Output Format
Report to Primary Agent with:
- **Files Created**: (path, description)
- **Files Modified**: (path, changes)
- **Tests Added**: (if applicable)
- **Blockers**: (if any)

## Rules
- Do NOT address the user
- Report ONLY to Primary Agent
- Follow existing code patterns
```

### Validator Agent Prompt Template

```markdown
## Task
Validate the implementation of [FEATURE].

## Context (from Primary)
Files modified: [FILE LIST]
Expected behavior: [REQUIREMENTS]

## Checks to Perform
1. Run: npm run lint (relevant files)
2. Run: npm run test:run (relevant tests)
3. Check: No anti-patterns (god objects, N+1)
4. Check: Documentation updated

## Output Format
Report to Primary Agent with:
- **Lint**: PASS/FAIL (error count)
- **Tests**: PASS/FAIL (coverage)
- **Anti-patterns**: CLEAN/FOUND (list)
- **Docs**: UPDATED/MISSING

## Rules
- Do NOT address the user
- Report ONLY to Primary Agent
- Be specific about failures
```

---

## Part 5: Parallel Execution (DEFERRED)

> **Status**: ⏸️ DEFERRED until 15+ file features needed
> **Reference**: Phase 6 in roadmap.md

### When to Use Parallel Agents

| File Count | Approach | Agents |
|------------|----------|--------|
| 1-2 | Direct build | 1 |
| 3-10 | Sequential hub-and-spoke | 1 orchestrator + sequential subs |
| 10+ | Parallel hub-and-spoke | 1 orchestrator + parallel subs |

### Git Worktrees (For 15+ Files)

When truly parallel execution is needed:

```bash
# Create parallel environments
git worktree add ../project-api feature/api
git worktree add ../project-ui feature/ui
git worktree add ../project-db feature/db

# Each worktree gets a Builder agent
# All report back to Orchestrator
```

---

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Context persistence stack | ✅ Implemented | always-on, skills, commands |
| Hub-and-spoke architecture | ✅ Documented | Ready for implementation |
| Scout prompt template | ✅ Documented | Above |
| Builder prompt template | ✅ Documented | Above |
| Validator prompt template | ✅ Documented | Above |
| Agent definitions | 🔴 TODO | `.claude/agents/` |
| Parallel execution | ⏸️ DEFERRED | Phase 6 |

---

## References

- **Agent Engineering**: [agent-engineering.md](./agent-engineering.md)
- **Model Selection**: [model-selection.md](./model-selection.md)
- **Architecture Research**: `docs/context-bundles/2025-12-05-agent-architecture-research.md`
- **Archived Version**: `archive/2025-12-05-sub-agent-patterns-v3.md`
