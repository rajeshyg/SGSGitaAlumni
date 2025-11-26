# Prime: SDD + TAC Framework (Unified Methodology)

Load this when implementing features affecting 3+ files or needing orchestration guidance.

---

## What This Is

**SDD (Spec-Driven Development)** = WHAT to build (methodology)
**TAC (Tactical Agentic Coding)** = HOW to build it (execution)

This document unifies both into a single reference for Scout-Plan-Build workflows.

---

# PART 1: SDD METHODOLOGY (What to Build)

## Core Principles

### 1. Specs as Source of Truth
- Code follows specifications, not assumptions
- Functional specs: `docs/specs/functional/[feature]/`
- Technical specs: `docs/specs/technical/`
- If spec conflicts with code, spec wins

### 2. Context Hygiene (R&D Framework)
**Reduce**: Minimize static context (always-on.md ≤50 lines)
**Delegate**: Offload work to sub-agents to prevent context pollution

### 3. Quality Gates
- Pre-commit validation (structure, docs, ESLint, redundancy, mock data)
- Tests pass before features are complete
- Code review checklist: `docs/specs/technical/coding-standards/code-review-checklist.md`

### 4. Workflow Phases
Every complex task follows: **Scout → Plan → Build → Validate**

---

# PART 2: TAC EXECUTION (How to Build It)

## The 5 TAC Phases

### Phase 1: Scout (Reconnaissance)
**Purpose**: Discover files, patterns, dependencies
**Model**: Haiku (fast, cheap - ~$0.02/task)
**Cost**: ~$0.25/1M tokens (10x cheaper than Sonnet)

**What to Find**:
- Existing files related to feature
- Patterns and conventions used
- Dependencies and integrations
- Potential impact areas

**Output Format**:
```markdown
## Scout Report: [Feature Name]

### Discovered Files
- path/to/file.ts - Description of what it does
- path/to/related.ts - Description

### Key Patterns Found
- Pattern 1
- Pattern 2

### Dependencies
- Dependency 1
- Dependency 2

### Recommendations for Planning
- Consideration 1
- Consideration 2
```

**Execution**:
```
Use Task tool with subagent_type=Explore and model="haiku" to scout for [feature]
```

---

### Phase 2: Plan (Strategy Design)
**Purpose**: Create implementation strategy
**Model**: Sonnet (thorough analysis)
**Input**: Scout report + feature spec

**Plan Must Include**:
1. Architecture decisions
2. File changes required (new files, modified files)
3. Sequence of implementation
4. Risk areas and mitigations
5. Testing strategy

**Key Rule**: Planner does NOT code—human reviews plan before build.

**Output Format**:
```markdown
## Implementation Plan: [Feature Name]

### Architecture Decisions
- Decision 1: Rationale
- Decision 2: Rationale

### File Changes
**New Files**:
- path/to/new/file.ts - Purpose

**Modified Files**:
- path/to/existing/file.ts - Changes needed

### Implementation Sequence
1. Step 1
2. Step 2
3. Step 3

### Risk Areas
- Risk 1: Mitigation strategy
- Risk 2: Mitigation strategy

### Testing Strategy
- Unit tests: What to test
- E2E tests: Scenarios to cover
```

---

### Phase 3: Build (Execution) ⚠️ CRITICAL: NOT MONOLITHIC

**Purpose**: Execute plan with focused agents
**Model**: Sonnet per agent
**Structure**: Multiple parallel agents, 3-5 files each

**❌ WRONG**: Single agent builds entire feature
**✅ RIGHT**: Multiple agents build in parallel

**Decision Matrix**:
| File Count | Approach | Agents | Execution |
|-----------|----------|--------|-----------|
| 1-2 files | Direct build | 1 | Single session |
| 3-10 files | Sequential build | 1 | Scout → Plan → Build |
| 10+ files | Parallel build | 3-5 | Git worktrees + parallel agents |

**Example: 15-file feature**
```
Orchestrator spawns:
├─ Agent 1: API routes (files 1-5)      ─┐
├─ Agent 2: UI components (files 6-10)  ─┼─ Run in parallel
└─ Agent 3: Database (files 11-15)      ─┘
```

**File Dependency Rule**:
- Independent files → parallel agents
- Dependent files → sequential in same agent

---

### Phase 4: Orchestrate (Coordination)
**Purpose**: Coordinate agents, manage context handoffs
**Model**: Sonnet/Opus
**When**: 10+ files requiring parallel work

**Responsibilities**:
1. Launch order (sequential vs parallel)
2. Conflict detection (file ownership)
3. Consistency validation (interfaces match)
4. Context handoff management

**Orchestrator Pattern**:
```
1. Parse task complexity
2. Launch Scout agents (parallel if domains independent)
3. Aggregate scout findings → single context bundle
4. Trigger Planner with combined context
5. Analyze plan → identify parallelizable batches
6. Spawn Build agents (parallel where no file deps)
7. Monitor progress, detect conflicts
8. Run Validator on completion
9. Report results
```

---

### Phase 5: Validate (Quality Check)
**Purpose**: Verify implementation matches plan
**Model**: Sonnet (or Gemini/Playwright for E2E)

**Validation Checklist**:
- [ ] Scout report covered all impacted areas
- [ ] Plan addresses all scout findings
- [ ] Build follows the plan (not ad-hoc changes)
- [ ] Tests pass after build
- [ ] Documentation updated if needed
- [ ] Pre-commit checks pass

---

# PART 3: ADVANCED PATTERNS

## Git Worktrees for True Parallelism

**Problem**: Parallel agents can't modify same working directory simultaneously
**Solution**: Git worktrees create isolated parallel environments

**Setup**:
```bash
# Create parallel work environments
git worktree add ../project-backend feature/backend
git worktree add ../project-frontend feature/frontend

# Run agents truly in parallel (separate directories)
(cd ../project-backend && claude -p "implement backend per specs" &)
(cd ../project-frontend && claude -p "implement frontend per specs" &)
wait  # Both complete

# Merge when done
git merge feature/backend feature/frontend

# Cleanup
git worktree remove ../project-backend
git worktree remove ../project-frontend
```

**Why it matters**: Same repo, separate working directories = no file conflicts.

---

## Model Selection Guide (Cost Optimization)

### The Golden Rule
**Haiku**: Information retrieval, discovery, simple patterns, documentation (< 500 lines)
**Sonnet**: Design decisions, complex logic, multi-file reasoning, debugging

### Detailed Decision Matrix

| Task Type | Model | Approx Cost | When to Use | Example Commands |
|-----------|-------|-------------|-------------|------------------|
| **File discovery** | Haiku | ~$0.02 | Finding files by pattern or keyword | `claude --model haiku -p "find all auth-related files"` |
| **Code search** | Haiku | ~$0.02 | Searching for implementations | `claude --model haiku -p "search for JWT verification logic"` |
| **Documentation** | Haiku | ~$0.02 | Writing docs < 500 lines | `claude --model haiku -p "document the API endpoints"` |
| **Simple CRUD** | Haiku | ~$0.02 | Basic create/read/update/delete | `claude --model haiku -p "add basic user CRUD endpoints"` |
| **Scout phase** | Haiku | ~$0.02 | Reconnaissance for any feature | `claude --model haiku -p "scout the posting system"` |
| **Architecture** | Sonnet | ~$1-2 | Design decisions needed | Default model (no flag needed) |
| **Complex refactor** | Sonnet | ~$3-4 | Multi-file reasoning | Default model |
| **Debugging** | Sonnet | ~$2-3 | Requires deep analysis | Default model |
| **Orchestration** | Sonnet/Opus | ~$3-5 | Multi-agent coordination | Default model or `--model opus` |
| **Plan phase** | Sonnet | ~$1-2 | Strategic planning | Default model |
| **Build phase** | Sonnet | ~$2-4 | Implementation work | Default model |

### Cost Impact

**10x Savings with Haiku**:
- Haiku: ~$0.25 per 1M tokens
- Sonnet: ~$3.00 per 1M tokens
- **Savings**: Use Haiku for Scout = 10x cheaper than using Sonnet

**Example Workflow Costs**:
```
Traditional (all Sonnet):
├─ Scout:  $2.00
├─ Plan:   $1.50
├─ Build:  $3.00
└─ Total:  $6.50

Optimized (Haiku + Sonnet):
├─ Scout:  $0.20 (Haiku)
├─ Plan:   $1.50 (Sonnet)
├─ Build:  $3.00 (Sonnet)
└─ Total:  $4.70 (28% savings)
```

### Decision Flowchart

```
START
  ↓
Is this pure information retrieval?
  ├─ YES → Haiku
  └─ NO ↓
Is output < 500 lines?
  ├─ YES → Haiku
  └─ NO ↓
Does it require design decisions?
  ├─ YES → Sonnet
  └─ NO ↓
Is it straightforward CRUD/simple pattern?
  ├─ YES → Haiku
  └─ NO → Sonnet (default)
```

### Practical Examples

**Use Haiku for**:
```bash
# File discovery
claude --model haiku -p "find all middleware files"

# Scout phase
claude --model haiku -p "scout the authentication system to understand its structure"

# Simple documentation
claude --model haiku -p "document the UserService class"

# Pattern search
claude --model haiku -p "find examples of rate limiting in the codebase"
```

**Use Sonnet for**:
```bash
# Complex implementation (default model)
claude -p "implement the notification system with real-time updates"

# Architecture decisions (default model)
claude -p "design the data model for the rating system"

# Debugging (default model)
claude -p "debug why the OTP verification is failing"

# Refactoring (default model)
claude -p "refactor the ChatService to split it into focused services"
```

### When in Doubt

Ask yourself:
1. **"Am I asking it to find/read/discover?"** → Haiku
2. **"Am I asking it to think/design/decide?"** → Sonnet
3. **"Is the output straightforward?"** → Haiku
4. **"Does this need reasoning?"** → Sonnet

**Default to Sonnet if uncertain** - it's better to use Sonnet unnecessarily than to use Haiku for complex tasks that need reasoning.

---

## Context Bundles (Session Continuity)

**Problem**: Sessions end, context is lost
**Solution**: Create structured session summary

**At session end**:
```markdown
Create file: docs/context-bundles/[YYYY-MM-DD]-[feature-name].md

Contents:
# Context Bundle: [Feature Name]
**Date**: [Date]
**Session Duration**: [Time]

## What Was Accomplished
- Completed item 1
- Completed item 2

## Files Modified
- path/to/file1.ts - Changes made
- path/to/file2.ts - Changes made

## Architectural Decisions
1. Decision: Rationale
2. Decision: Rationale

## Next Steps
- [ ] Task 1
- [ ] Task 2

## Blockers
- Blocker 1: Context
- Blocker 2: Context

## Key Code References
- Feature X: path/to/file.ts:123
- Integration Y: path/to/other.ts:456
```

**Next session**:
```
"Read context bundle from [date] to restore 70% of context"
```

**Token Savings**: 10k tokens (full conversation) → 1k tokens (bundle) = 90% reduction

---

# PART 4: DECISION TREES

## When to Use Each Phase

```
┌─ 1-2 files affected?
│  └─ YES → Build directly (no Scout/Plan needed)
│  └─ NO → Continue ↓

┌─ 3-10 files affected?
│  └─ YES → Scout → Plan → Build (single agent)
│  └─ NO → Continue ↓

┌─ 10+ files affected?
│  └─ YES → Full TAC with parallel agents
│      1. Scout (parallel if multi-domain)
│      2. Plan (aggregated findings)
│      3. Build (parallel agents, git worktrees)
│      4. Orchestrate (coordination)
│      5. Validate

┌─ Research only (no code changes)?
│  └─ YES → Scout phase only
│  └─ NO → Scout → Plan → Build
```

## When to Load This Framework

Load `/prime-framework` when:
- Implementing features (3+ files)
- Refactoring code (multiple modules)
- Planning complex implementations
- Need orchestration guidance (10+ files)

Do NOT load for:
- Simple bug fixes (1-2 files)
- Typo corrections
- Quick documentation updates

---

# PART 5: CONTEXT HANDOFF PATTERNS

## Pattern 1: File-Based Handoff
Agents communicate via files:
```
scout-output.md → Planner reads → plan-output.md → Builder reads
```

Implementation:
```markdown
Scout Agent: Save to docs/specs/workflows/[feature]/scout.md
Planner Agent: Read scout.md, output to plan.md
Builder Agent: Read plan.md, implement
```

## Pattern 2: Context Bundle (Session Continuity)
For session breaks:
```markdown
Create context_bundle.md:
- Summary of work done
- Current state
- Decisions made
- Next steps
- Key file references

Restores ~70% of context in new session
```

## Pattern 3: Inline Results (Simple Workflows)
Pass results directly in prompts:
```markdown
SCOUT FINDINGS:
[Inline the scout output here]

Based on these findings, create implementation plan...
```

---

# PART 6: INTEGRATION WITH PROJECT

## Load Domain Context After Framework

Once framework is loaded, load specific domain context:
- Auth work: `/prime-auth`
- API work: `/prime-api`
- Database work: `/prime-database`
- UI work: `/prime-ui`

## Use Existing Workflows

Project has workflow documentation in `docs/specs/workflows/`:
- Read existing scout/plan/tasks files to continue work
- Follow established patterns for feature

## Quality Gates Integration

```
SDD provides:           TAC executes:
├─ Specifications   →   Scout reads specs
├─ Prime commands   →   Agents load context
├─ Quality gates    →   Validate phase
└─ Workflows        →   Phase templates
```

---

# QUICK REFERENCE

## Minimal Scout-Plan-Build (One Prompt)
```markdown
Implement [FEATURE] using Scout-Plan-Build:
1. SCOUT: Find all related files (use Task tool, haiku)
2. PLAN: Create implementation approach based on findings
3. BUILD: Implement and test
Keep me updated on progress.
```

## Maximum Control (Step-by-Step)
```markdown
STEP 1 - SCOUT:
[Detailed scout instructions]
STOP and show me results before proceeding.

STEP 2 - PLAN:
[Detailed planning instructions]
STOP and show me plan for approval.

STEP 3 - BUILD:
[Detailed build instructions]
Show me each file before moving to next.
```

---

## Common Mistakes to Avoid

1. ❌ Skipping Scout for complex features → Leads to missed dependencies
2. ❌ Not providing enough context to Builder → Results in inconsistent code
3. ❌ Running parallel agents on interdependent files → Causes conflicts
4. ❌ Using wrong model for task → Wastes tokens or produces poor results
5. ❌ Not persisting agent outputs → Loses valuable context

---

## Variables (If Needed)
- `$FEATURE`: The feature being implemented
- `$FILE_COUNT`: Number of files affected
- `$DOMAIN`: The domain (auth, api, database, ui)

---

**End of Framework - Return to Task Execution**
