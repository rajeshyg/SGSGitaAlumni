---
version: 3.0
status: partial
last_updated: 2025-12-02
applies_to: framework
description: R&D framework, context management, and parallel agent execution patterns
---

# Sub-Agent Patterns: R&D Framework and Parallel Execution

---

## Overview

**R&D = Reduce & Delegate** - The core strategy for managing AI context efficiently.

| Principle | What It Means | Why It Matters |
|-----------|---------------|----------------|
| **Reduce** | Minimize static context | Faster responses, lower costs |
| **Delegate** | Offload work to sub-agents | Separate contexts, true parallelism |

This document covers both context management AND orchestration patterns because they are fundamentally connected - you delegate TO manage context.

---

## Part 1: Reduce (Context Management)

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
**Current**: 44 lines ✅

Contains ONLY:
- Tech stack essentials
- Critical security rules
- Project conventions that apply to EVERY task

**Example**:
```markdown
# Critical Rules
- SQL: Parameterized queries only [?, ?]
- DB: Always use try/finally for connection.release()
- Logging: Never log passwords, JWT, OTP, tokens
```

### Layer 2: Skills (Auto-Activate)

**Location**: `.claude/skills/`  
**Status**: ✅ 4 skills implemented

| Skill | Triggers When | Tokens |
|-------|---------------|--------|
| `sdd-tac-workflow` | 3+ file tasks | ~1k |
| `duplication-prevention` | Creating files | ~400 |
| `security-rules` | Auth/DB/API code | ~800 |
| `coding-standards` | Service/component code | ~1.5k |

**How It Works**:
1. Claude scans skill descriptions (~100 tokens each)
2. Matches description to current task
3. Loads relevant skill content
4. Other skills remain inactive

### Layer 3: Prime Commands (On-Demand)

**Location**: `.claude/commands/`  
**Status**: ✅ 7+ commands

| Command | Loads | Use When |
|---------|-------|----------|
| `/prime-framework` | Full SDD/TAC | Multi-file features |
| `/prime-auth` | Auth patterns | Auth/login work |
| `/prime-api` | API patterns | Route development |
| `/prime-database` | DB patterns | Query/migration work |

### Layer 4: Context Bundles

**Location**: `docs/context-bundles/`  
**Purpose**: Session handoff, restore ~70% context

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

### Context Monitoring

```bash
# Claude CLI: Check current usage
/context

# At 70% usage
/compact  # Compress with focus on current task
```

---

## Part 2: Delegate (Sub-Agent Patterns)

### Why Delegate?

| Single Agent | Multiple Sub-Agents |
|--------------|---------------------|
| Context accumulates | Each agent has fresh 200k |
| Slows down at 70%+ | Full speed throughout |
| Sequential execution | True parallelism |
| Can't work on conflicting files | Git worktrees isolate |

### Sub-Agent Types

| Type | Model | Use For | Returns |
|------|-------|---------|---------|
| **Scout Agent** | Haiku | Discovery, search | Summary of findings |
| **Planner Agent** | Sonnet | Strategy design | Implementation plan |
| **Builder Agent** | Sonnet | Code implementation | Completed files |
| **Validator Agent** | Sonnet | Quality checks | Pass/fail report |

### Invoking Sub-Agents

**Claude CLI**:
```bash
# Scout sub-agent
claude --model haiku -p "scout [feature] and summarize findings"

# Builder sub-agent with specific scope
claude --model sonnet -p "implement [specific files] per plan"
```

**Task Tool**:
```markdown
Use Task tool with:
- subagent_type=Explore for Scout
- subagent_type=Plan for Planning
- subagent_type=Build for Implementation
```

### Context Flow Between Agents

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR (Main Agent)                │
│                                                             │
│  Receives task                                              │
│       │                                                     │
│       ▼                                                     │
│  Spawns Scout Agent ──────────────────┐                    │
│       │                               │                    │
│       │ (waits for summary)           ▼                    │
│       │                      Scout works in separate       │
│       │                      context, returns summary      │
│       │◄──────────────────────────────┘                    │
│       │                                                     │
│       ▼                                                     │
│  Spawns Planner Agent ────────────────┐                    │
│       │                               │                    │
│       │ (waits for plan)              ▼                    │
│       │                      Planner reads scout summary,  │
│       │                      creates plan                  │
│       │◄──────────────────────────────┘                    │
│       │                                                     │
│       ▼                                                     │
│  Spawns Builder Agents (parallel) ────┐                    │
│       │                               │                    │
│       │ (waits for all)    ┌──────────┼──────────┐        │
│       │                    ▼          ▼          ▼        │
│       │               Builder 1  Builder 2  Builder 3     │
│       │               (worktree) (worktree) (worktree)    │
│       │◄───────────────────┴──────────┴──────────┘        │
│       │                                                     │
│       ▼                                                     │
│  Merges results, runs validation                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 3: Parallel Execution with Git Worktrees

### The Problem

Multiple agents can't safely modify the same working directory:
- File conflicts
- Race conditions
- Unpredictable state

### The Solution: Git Worktrees

Git worktrees create separate working directories from the same repository:

```bash
# Create parallel environments
git worktree add ../project-api feature/api
git worktree add ../project-ui feature/ui
git worktree add ../project-db feature/db
```

Each worktree:
- ✅ Separate file system (no conflicts)
- ✅ Same git repository
- ✅ Independent agent context
- ✅ Truly parallel execution

### When to Use Parallel Agents

| File Count | Approach | Agents |
|------------|----------|--------|
| 1-2 | Direct build | 1 |
| 3-10 | Sequential workflow | 1 |
| 10+ | Parallel build | 3-5 |

### Parallel Execution Example (15 Files)

**1. Setup Worktrees**:
```bash
git worktree add ../project-auth feature/auth
git worktree add ../project-api feature/api
git worktree add ../project-ui feature/ui
```

**2. Spawn Parallel Agents**:
```bash
# Run in parallel (& backgrounds each)
(cd ../project-auth && claude -p "implement auth per plan, files 1-5" &)
(cd ../project-api && claude -p "implement API per plan, files 6-10" &)
(cd ../project-ui && claude -p "implement UI per plan, files 11-15" &)
wait  # Wait for all to complete
```

**3. Merge Results**:
```bash
git merge feature/auth feature/api feature/ui

# Cleanup
git worktree remove ../project-auth
git worktree remove ../project-api
git worktree remove ../project-ui
```

### File Dependency Rules

| Dependency | Execution Strategy |
|------------|-------------------|
| Independent files (routes, components) | Different agents in parallel |
| Dependent files (service → consumer) | Same agent, sequential |
| Shared types/interfaces | Define first, then parallel |

**Example**:
```
Independent (parallel):
├── routes/auth.js        → Agent 1
├── routes/postings.js    → Agent 2
└── components/Auth.tsx   → Agent 3

Dependent (same agent, sequential):
├── services/FooService.ts  → Agent 1 (first)
└── routes/foo.js           → Agent 1 (depends on service)
```

---

## Part 4: Orchestrator Pattern (10+ Files)

### Complete Orchestration Flow

```
1. RECEIVE TASK
   └── Parse complexity (file count, domains)

2. PHASE 0: CONSTRAINTS
   └── Check LOCKED files, STOP triggers
   └── Block if violations (exit 2)

3. PHASE 1: SCOUT (Parallel if multi-domain)
   ├── Spawn Scout Agent: API domain
   ├── Spawn Scout Agent: UI domain
   └── Spawn Scout Agent: Database domain
   └── Aggregate findings into single bundle

4. PHASE 2: PLAN
   └── Spawn Planner Agent with aggregated findings
   └── Analyze plan → identify parallelizable batches
   └── Human reviews plan

5. PHASE 3: BUILD (Parallel)
   ├── Create worktrees per domain
   ├── Spawn Builder Agents (parallel)
   └── Monitor progress, detect conflicts

6. PHASE 4: MERGE & VALIDATE
   └── Merge worktrees
   └── Run validation pipeline
   └── Report results
```

### Orchestrator Responsibilities

| Responsibility | How |
|----------------|-----|
| Task parsing | Count files, identify domains |
| Constraint enforcement | Call Phase 0 checks |
| Agent spawning | Claude CLI or Task tool |
| Context bundling | File-based handoff |
| Conflict detection | Monitor worktree diffs |
| Result aggregation | Merge and validate |

---

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Always-on.md | ✅ Implemented | 44 lines |
| Skills auto-activation | ✅ Implemented | 4 skills |
| Prime commands | ✅ Implemented | 7+ commands |
| Context bundles | ✅ Pattern defined | `docs/context-bundles/` |
| Scout sub-agents | 🟡 Documented | Use Task tool or Claude CLI |
| Planner sub-agents | 🟡 Documented | Use Task tool or Claude CLI |
| Git worktrees | 🟡 Documented | Not tested in practice |
| Orchestrator pattern | 🔴 Not implemented | Deferred until Phase 1-3 complete |

---

## Tool Compatibility

| Feature | Claude CLI | VS Code + Copilot | Other |
|---------|------------|-------------------|-------|
| /context monitoring | ✅ | ❌ | ❌ |
| Sub-agent spawning | ✅ | ⚠️ Limited | ❌ |
| Git worktrees | ✅ | ✅ | ✅ |
| Context bundles | ✅ | ✅ Manual | ✅ Manual |

**For non-Claude CLI**: Use context bundles manually and run sub-agent patterns via separate terminal sessions.
