---
version: 1.0
status: implemented
last_updated: 2025-11-26
---

# SDD/TAC Methodology: Scout-Plan-Build Workflow

```yaml
---
version: 1.0
status: implemented
last_updated: 2025-11-26
applies_to: all
enforcement: required
description: Core Scout-Plan-Build workflow for systematic AI-assisted development
skills: .claude/skills/sdd-tac-workflow/SKILL.md
prime_command: /prime-framework
---
```

## What This Is

**SDD (Spec-Driven Development)** = WHAT to build (methodology)
**TAC (Tactical Agentic Coding)** = HOW to build it (execution)

This unified methodology ensures systematic, high-quality development through phased workflows.

## Core Principles

### 1. Specs as Source of Truth
- Code follows specifications, not assumptions
- Functional specs: `docs/specs/functional/[feature]/`
- Technical specs: `docs/specs/technical/`
- **If spec conflicts with code, spec wins**

### 2. Context Hygiene (R&D Framework)
- **Reduce**: Minimize static context (always-on.md ≤50 lines)
- **Delegate**: Offload work to sub-agents to prevent context pollution

### 3. Quality Gates
- Pre-commit validation (structure, docs, ESLint, redundancy, mock data)
- Tests pass before features are complete
- Code review checklist enforcement

### 4. Workflow Phases
Every complex task follows: **Scout → Plan → Build → Validate**

---

## The 5 TAC Phases

### Phase 1: Scout (Reconnaissance)

**Purpose**: Discover files, patterns, dependencies BEFORE making changes

**Model**: Haiku (fast, cheap - ~$0.02/task)

**What to Find**:
- Existing files related to feature
- Patterns and conventions used
- Dependencies and integrations
- Potential impact areas

**Execution**:
```bash
# Use Haiku for Scout phase (10x cheaper than Sonnet)
claude --model haiku -p "scout the [feature] system to understand its structure"

# Or use Task tool
Task tool with subagent_type=Explore, model="haiku"
```

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

**Critical Rule**: NEVER skip Scout phase for 3+ file tasks - leads to:
- Duplication (creating files that already exist)
- Inconsistencies (using different patterns than existing code)
- Missed dependencies (breaking existing functionality)

---

### Phase 2: Plan (Strategy Design)

**Purpose**: Create implementation strategy BEFORE writing code

**Model**: Sonnet (thorough analysis)

**Input**: Scout report + feature spec

**Plan Must Include**:
1. Architecture decisions (and why)
2. File changes required (new files, modified files)
3. Implementation sequence
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

**Why This Matters**: Planning prevents:
- Fix-on-fix cascades (14+ failed incremental fixes)
- Over-engineering (deleted Feed System)
- Architecture drift (1314-line ChatService god object)

---

### Phase 3: Build (Execution)

**Purpose**: Execute plan with focused implementation

**Model**: Sonnet per agent

**Structure**: Multiple parallel agents for 10+ files (3-5 files each)

**❌ WRONG**: Single agent builds entire 15-file feature (monolithic)
**✅ RIGHT**: Multiple agents build in parallel (orchestrated)

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

**Build Phase Principles**:
- Follow the plan (not ad-hoc changes)
- Use existing code patterns from Scout findings
- Apply project coding standards (see [coding-standards.md](./coding-standards.md))
- For 10+ files: suggest parallel work or breaking into phases

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

**See**: [agent-orchestration.md](./agent-orchestration.md) for implementation details

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
- [ ] Pre-commit checks will pass

**Quality Gates**:
- Pre-commit validation runs automatically
- Skills enforce standards (security, duplication, coding standards)
- Manual code review using checklist

---

## Decision Trees

### When to Use Each Phase

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

### When to Load Framework

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

## Context Handoff Patterns

### Pattern 1: File-Based Handoff
Agents communicate via files in `docs/specs/workflows/[feature]/`:
```
scout.md → Planner reads → plan.md → Builder reads → tasks.md
```

### Pattern 2: Context Bundle (Session Continuity)
For session breaks, create in `docs/context-bundles/[date]-[feature].md`:
```markdown
# Context Bundle: [Feature Name]
**Date**: [Date]
**Session Duration**: [Time]

## What Was Accomplished
- Completed item 1

## Files Modified
- path/to/file.ts - Changes made

## Architectural Decisions
1. Decision: Rationale

## Next Steps
- [ ] Task 1

## Blockers
- Blocker 1: Context

## Key Code References
- Feature X: path/to/file.ts:123
```

**Benefit**: Restores ~70% of context, saves 90% tokens (10k → 1k)

### Pattern 3: Inline Results (Simple Workflows)
Pass results directly in prompts for simple 3-5 file tasks

---

## Integration with Project

### Load Domain Context After Framework

Once framework is loaded, load specific domain context:
- Auth work: `/prime-auth`
- API work: `/prime-api`
- Database work: `/prime-database`
- UI work: `/prime-ui`

### Use Existing Workflows

Project has workflow documentation in `docs/specs/workflows/`:
- Read existing scout/plan/tasks files to continue work
- Follow established patterns for feature

### Quality Gates Integration

```
SDD provides:           TAC executes:
├─ Specifications   →   Scout reads specs
├─ Prime commands   →   Agents load context
├─ Quality gates    →   Validate phase
└─ Workflows        →   Phase templates
```

---

## Common Mistakes to Avoid

1. ❌ Skipping Scout for complex features → Leads to missed dependencies
2. ❌ Not providing enough context to Builder → Results in inconsistent code
3. ❌ Running parallel agents on interdependent files → Causes conflicts
4. ❌ Using wrong model for task → Wastes tokens or produces poor results
5. ❌ Not persisting agent outputs → Loses valuable context

---

## Quick Reference

### Minimal Scout-Plan-Build (One Prompt)
```markdown
Implement [FEATURE] using Scout-Plan-Build:
1. SCOUT: Find all related files (use Task tool, haiku)
2. PLAN: Create implementation approach based on findings
3. BUILD: Implement and test
Keep me updated on progress.
```

### Maximum Control (Step-by-Step)
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

## Variables (If Needed)
- `$FEATURE`: The feature being implemented
- `$FILE_COUNT`: Number of files affected
- `$DOMAIN`: The domain (auth, api, database, ui)

---

**Related Specs**:
- [Model Selection Guide](./model-selection-guide.md) - Choose right model for each phase
- [Context Management](./context-management.md) - Manage large contexts efficiently
- [Agent Orchestration](./agent-orchestration.md) - Coordinate parallel agents
- [Duplication Prevention](./duplication-prevention.md) - Avoid creating duplicate code
- [Security Enforcement](./security-enforcement.md) - Security patterns for each phase
- [Coding Standards](./coding-standards.md) - Quality standards during Build phase
