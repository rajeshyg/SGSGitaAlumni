---
version: 1.0
status: implemented
last_updated: 2025-11-26
---

# Agent Orchestration (Parallel Execution)

```yaml
---
version: 1.0
status: documented
last_updated: 2025-11-26
applies_to: all
enforcement: recommended
description: Coordinating multiple parallel agents using git worktrees for 10+ file features
---
```

## Overview

**When**: Features affecting 10+ files benefit from parallel agent execution

**Why**: 3-5x speedup, separate context windows, no file conflicts

**How**: Git worktrees create isolated parallel environments

---

## Git Worktrees for True Parallelism

### The Problem

Parallel agents can't modify the same working directory simultaneously:
- File conflicts
- Race conditions
- Context pollution

### The Solution

Git worktrees create separate working directories from the same repository:
```bash
# Create parallel work environments
git worktree add ../project-backend feature/backend
git worktree add ../project-frontend feature/frontend
git worktree add ../project-database feature/database
```

Each worktree:
- ✅ Separate file system (no conflicts)
- ✅ Same git repository
- ✅ Independent agent context
- ✅ Can work truly in parallel

---

## Orchestrator Pattern

```
1. Parse task complexity (file count, dependencies)
2. Launch Scout agents (parallel if domains independent)
3. Aggregate scout findings → single context bundle
4. Trigger Planner with combined context
5. Analyze plan → identify parallelizable batches
6. Spawn Build agents (parallel where no file deps)
7. Monitor progress, detect conflicts
8. Run Validator on completion
9. Merge worktrees and report results
```

---

## Example: 15-File Feature

### Setup Worktrees
```bash
# Create 3 parallel environments
git worktree add ../project-auth feature/auth
git worktree add ../project-api feature/api
git worktree add ../project-ui feature/ui
```

### Spawn Parallel Agents
```bash
# Run agents truly in parallel (separate directories)
(cd ../project-auth && claude -p "implement auth per plan files 1-5" &)
(cd ../project-api && claude -p "implement API per plan files 6-10" &)
(cd ../project-ui && claude -p "implement UI per plan files 11-15" &)
wait  # All agents complete
```

### Merge Results
```bash
# Back in main working directory
git merge feature/auth feature/api feature/ui

# Cleanup worktrees
git worktree remove ../project-auth
git worktree remove ../project-api
git worktree remove ../project-ui
```

---

## File Dependency Rules

**Independent files** → Parallel agents:
```
Auth routes (routes/auth.js)
API routes (routes/api.js)
UI components (src/components/Auth.tsx)
→ No dependencies, run in parallel
```

**Dependent files** → Sequential in same agent:
```
Service (services/[EntityName]Service.js)  ← Must exist first
Route (routes/[entity-name].js)            ← Depends on service
→ Same agent, sequential order
```

---

## Orchestration Responsibilities

1. **Launch Order**: Determine sequential vs parallel execution
2. **Conflict Detection**: Track file ownership across agents
3. **Consistency Validation**: Ensure interfaces match across agents
4. **Context Handoff**: Manage information flow between agents

---

## When NOT to Use Parallel Agents

- **1-2 files**: Direct build (no overhead)
- **3-10 files**: Single agent, sequential
- **Tightly coupled files**: Same agent (dependencies)
- **Simple refactors**: Not worth setup overhead

---

## Best Practices

### DO
- ✅ Use for 10+ file features
- ✅ Create worktrees for independent domains
- ✅ Run scout phase first to identify dependencies
- ✅ Merge frequently to detect conflicts early
- ✅ Clean up worktrees when done

### DON'T
- ❌ Use for small features (overhead > benefit)
- ❌ Run parallel agents on dependent files
- ❌ Forget to cleanup worktrees
- ❌ Skip conflict detection step

---

**Related**: [SDD/TAC Methodology](./sdd-tac-methodology.md) - Phase 4: Orchestrate
