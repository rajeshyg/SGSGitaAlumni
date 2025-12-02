---
version: 3.0
status: partial
last_updated: 2025-12-02
applies_to: framework
description: Phase 0→Scout→Plan→Build→Validate workflow for SDD/TAC
---

# SDD/TAC Methodology: The Complete Workflow

---

## Overview

Every AI-assisted development task follows a phased workflow to prevent duplication, ensure quality, and maintain architectural consistency.

```
┌─────────────────────────────────────────────────────────────────┐
│                    SDD/TAC WORKFLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Task Arrives                                                   │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────┐                                        │
│  │ PHASE 0: CONSTRAINTS │ ──► LOCKED file? ──► STOP, ask user  │
│  └─────────────────────┘                                        │
│       │ (approved)                                              │
│       ▼                                                         │
│  ┌─────────────────────┐                                        │
│  │ PHASE 1: SCOUT      │ ──► Find existing code, patterns      │
│  └─────────────────────┘                                        │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────┐                                        │
│  │ PHASE 2: PLAN       │ ──► Design solution, get approval     │
│  └─────────────────────┘                                        │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────┐                                        │
│  │ PHASE 3: BUILD      │ ──► Implement following the plan      │
│  └─────────────────────┘                                        │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────────┐                                        │
│  │ PHASE 4: VALIDATE   │ ──► Tests, pre-commit, quality gates  │
│  └─────────────────────┘                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

For 10+ file tasks, Phase 3 becomes **ORCHESTRATE** with parallel sub-agents.

---

## Decision Tree: Which Phases to Use

```
┌─ How many files affected?
│
├─ 1-2 files ────► BUILD DIRECTLY (skip all phases)
│
├─ 3-10 files ───► FULL WORKFLOW
│                  Phase 0 → 1 → 2 → 3 → 4
│                  Single agent, sequential
│
└─ 10+ files ────► ORCHESTRATED WORKFLOW
                   Phase 0 → 1 (parallel scouts)
                            → 2 (aggregated plan)
                            → 3 (parallel builders)
                            → 4 (merge & validate)
```

---

## Phase 0: Constraints (MANDATORY)

> **Status**: 🔴 Not yet enforced via hooks  
> **Implementation**: See [constraints-enforcement.md](./constraints-enforcement.md)

### Purpose

Check constraints BEFORE any coding to prevent violations.

### What to Check

| Constraint Type | Examples | Action if Violated |
|-----------------|----------|-------------------|
| **LOCKED Files** | `server.js`, `config/database.js`, `.env*` | STOP → Ask user approval |
| **STOP Triggers** | Delete file, add dependency, change API | STOP → Confirm intention |
| **Port Constraints** | Backend: 3001, Frontend: 5173 | Never reassign |
| **Project Boundary** | Parent directories, external repos | FORBIDDEN |

### Checklist

- [ ] No LOCKED file modifications planned (or user approved)
- [ ] No STOP trigger actions (or user confirmed)
- [ ] Working within project boundary
- [ ] Port assignments respected

### Manual Check (Until Validator Implemented)

```bash
# Check if file is locked
node scripts/validation/validators/constraint-check.cjs <file-path>
```

---

## Phase 1: Scout (Reconnaissance)

> **Status**: 🟡 Documented, skill exists  
> **Model**: Haiku (fast, cheap - ~$0.02/task)

### Purpose

Discover existing code, patterns, and dependencies BEFORE making changes.

### What to Find

1. **Existing files** related to the feature
2. **Patterns** and conventions already used
3. **Dependencies** that will be affected
4. **Impact areas** (tests, docs, related features)

### Execution

```bash
# Use Haiku for Scout (10x cheaper than Sonnet)
claude --model haiku -p "scout the [feature] system"

# Or use sub-agent
Task tool with subagent_type=Explore, model="haiku"
```

### Scout Output Template

```markdown
## Scout Report: [Feature Name]

### Discovered Files
- `path/to/file.ts` - What it does
- `path/to/related.ts` - Why it's relevant

### Patterns Found
- Pattern 1: Where used
- Pattern 2: Where used

### Dependencies
- Module X depends on Y
- API endpoint used by Z

### Recommendations
- Reuse existing `[component/service]`
- Follow pattern from `[file]`
- Avoid duplicating `[existing code]`
```

### Critical Rule

**NEVER skip Scout for 3+ file tasks** - leads to:
- Creating files that already exist
- Using different patterns than existing code
- Breaking existing functionality

---

## Phase 2: Plan (Strategy Design)

> **Status**: 🟡 Documented  
> **Model**: Sonnet (thorough analysis)

### Purpose

Create implementation strategy BEFORE writing code. Human reviews before build.

### Plan Must Include

1. **Architecture decisions** with rationale
2. **File changes** (new files, modified files)
3. **Implementation sequence** (what order)
4. **Risk areas** and mitigations
5. **Testing strategy**

### Plan Output Template

```markdown
## Implementation Plan: [Feature Name]

### Architecture Decisions
| Decision | Rationale |
|----------|-----------|
| Use existing FooService | Already handles X, avoid duplication |
| Add new BarComponent | No existing component for Y |

### File Changes

**New Files**:
| File | Purpose |
|------|---------|
| `src/components/Bar.tsx` | New component for Y |

**Modified Files**:
| File | Changes |
|------|---------|
| `src/services/FooService.ts` | Add method for Z |

### Implementation Sequence
1. Modify FooService (foundation)
2. Create BarComponent (depends on #1)
3. Update routes (depends on #2)
4. Add tests

### Risk Areas
| Risk | Mitigation |
|------|------------|
| Breaking FooService consumers | Run existing tests first |

### Testing Strategy
- Unit: FooService.newMethod()
- Integration: API endpoint
- E2E: User flow
```

### Key Rule

**Planner does NOT code** - human reviews plan before build proceeds.

---

## Phase 3: Build (Execution)

> **Status**: 🟡 Documented  
> **Model**: Sonnet

### Purpose

Execute the approved plan with focused implementation.

### Principles

1. **Follow the plan** - No ad-hoc changes
2. **Use Scout findings** - Reference discovered patterns
3. **Apply coding standards** - See [quality-enforcement.md](./quality-enforcement.md)
4. **One thing at a time** - Complete each step before next

### For 3-10 Files (Sequential)

Single agent builds files in sequence per plan.

### For 10+ Files (Parallel)

Multiple sub-agents build in parallel - see [sub-agent-patterns.md](./sub-agent-patterns.md).

```
Orchestrator spawns:
├─ Agent 1: API routes (files 1-5)      ─┐
├─ Agent 2: UI components (files 6-10)  ─┼─ Parallel
└─ Agent 3: Database (files 11-15)      ─┘
```

### File Dependency Rule

| Dependency Type | Execution |
|-----------------|-----------|
| Independent files | Parallel agents |
| Dependent files | Same agent, sequential |

---

## Phase 4: Validate (Quality Check)

> **Status**: 🟡 Partial (pre-commit bypassed)

### Purpose

Verify implementation matches plan and passes quality gates.

### Validation Checklist

- [ ] Scout report covered all impacted areas
- [ ] Plan addresses all scout findings
- [ ] Build follows the plan (not ad-hoc)
- [ ] Tests pass
- [ ] Pre-commit checks pass
- [ ] Documentation updated

### Automated Validation

```bash
# Run full validation
node scripts/validation/validate-structure.cjs

# Run tests
npm test

# Lint check
npm run lint
```

---

## Context Handoff Patterns

### Pattern 1: File-Based (Multi-Agent)

Agents communicate via files in `docs/specs/workflows/[feature]/`:

```
scout.md → Planner reads → plan.md → Builder reads → tasks.md
```

### Pattern 2: Context Bundle (Session Breaks)

For session continuity, create in `docs/context-bundles/[date]-[feature].md`:

```markdown
# Context Bundle: [Feature Name]

## What Was Accomplished
- Completed item 1

## Files Modified
- `path/to/file.ts` - Changes made

## Key Decisions
- Decision: Rationale

## Next Steps
- [ ] Remaining task 1

## Key References
- Feature X: `path/to/file.ts:123`
```

**Benefit**: Restores ~70% context, saves 90% tokens.

---

## Core Principles

### 1. Specs as Source of Truth

- Code follows specifications, not assumptions
- Functional specs: `docs/specs/functional/[feature]/`
- Technical specs: `docs/specs/technical/`
- **If spec conflicts with code, spec wins**

### 2. Reduce & Delegate (R&D)

- Minimize static context (always-on ≤50 lines)
- Delegate heavy work to sub-agents
- See [sub-agent-patterns.md](./sub-agent-patterns.md)

### 3. Quality Gates

- Pre-commit validation (structure, lint, redundancy)
- Tests pass before feature complete
- Code review checklist enforcement

### 4. Constraint-First

- Check constraints BEFORE any work
- LOCKED files require approval
- See [constraints-enforcement.md](./constraints-enforcement.md)

---

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Correct Approach |
|--------------|--------------|------------------|
| Skip Scout | Creates duplicates | Always scout for 3+ files |
| Build without Plan | Architecture drift | Get plan approval first |
| Ignore constraints | Breaks critical systems | Phase 0 is mandatory |
| Single agent for 15 files | Context exhaustion | Use parallel sub-agents |
| Ad-hoc changes during build | Undermines plan | Follow plan exactly |
