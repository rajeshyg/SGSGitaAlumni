# Prime: TAC (Tactical Agentic Coding) Framework

Load this before implementing multi-file features or complex tasks.

## Quick Reference

**TAC** = HOW to build with coordinated agents (complements SDD's WHAT)

**Full documentation**: `docs/specs/technical/development-framework/tac-framework.md`

---

## Workflow Selection (STATE THIS UPFRONT)

Before ANY task, assess and state:

**Decision Tree**:
```
├─ 1-2 files     → Build directly (no TAC)
├─ 3-10 files    → Scout → Plan → Build (single agent)
├─ 10+ files     → Scout → Plan → Build (PARALLEL) → Orchestrate
└─ Research only → Scout phase only
```

**Always announce**:
1. "This task affects [N] files across [domains]"
2. "Using [workflow] workflow"
3. "Scout with Haiku / Build with Sonnet"

---

## The 5 Phases

| Phase | Model | Purpose | Output |
|-------|-------|---------|--------|
| **Scout** | Haiku (~$0.02) | Discover files/patterns | Scout report with paths |
| **Plan** | Sonnet | Create strategy | Architecture + file changes |
| **Build** | Sonnet/agent | Execute (PARALLEL if 10+ files) | Code implementation |
| **Orchestrate** | Sonnet | Coordinate agents | Conflict detection |
| **Validate** | Sonnet | Verify vs plan | Validation report |

---

## Build Phase: CRITICAL PATTERN ⚠️

**Build is NOT monolithic. It's multiple parallel agents.**

❌ **WRONG**: Single agent builds 15-file feature
✅ **RIGHT**: Spawn 3 agents (5 files each) in parallel

**Example: 15-file feature**
```
Orchestrator spawns:
├─ Agent 1: API routes (files 1-5)      ─┐
├─ Agent 2: UI components (files 6-10)  ─┼─ Parallel
└─ Agent 3: Database (files 11-15)      ─┘
```

**File Dependency Rule**:
- Independent files → parallel agents
- Dependent files → same agent, sequential

---

## Model Selection

| Task | Model | Why |
|------|-------|-----|
| Scout/discover | Haiku | 10x cheaper, pure retrieval |
| Simple changes (<500 lines) | Haiku | Clear patterns |
| Architecture/design | Sonnet | Reasoning required |
| Complex build (10+ files) | Sonnet | Multi-file coordination |

**Rule**: <500 lines OR pure retrieval → Haiku. Otherwise → Sonnet.

---

## Git Worktrees (True Parallelism)

For parallel agents without file conflicts:

```bash
# Setup
git worktree add ../work-backend feature/backend
git worktree add ../work-frontend feature/frontend

# Launch parallel
(cd ../work-backend && claude -p "build backend" &)
(cd ../work-frontend && claude -p "build frontend" &)
wait

# Merge
git merge feature/backend feature/frontend

# Cleanup
git worktree remove ../work-backend ../work-frontend
```

---

## Orchestrator (10+ Files Only)

**When to use**:
- 10+ files affected
- Multiple domains (frontend + backend + DB)
- Need true parallel execution

**Responsibilities**:
1. Launch Scout agents (parallel if independent domains)
2. Aggregate findings → context bundle
3. Trigger Planner
4. Identify parallelizable file batches
5. Spawn Build agents (parallel where no deps)
6. Validate consistency on completion

---

## Integration with This Project

**Load domain context**:
- Auth work → `/prime-auth`
- API work → `/prime-api`
- Database → `/prime-database`
- UI work → `/prime-ui`

**Then apply TAC workflow** based on file count.

---

## Full Details

See: `docs/specs/technical/development-framework/tac-framework.md`
- Cost decision matrix
- Test scenarios
- MCP integration
- CLI commands
