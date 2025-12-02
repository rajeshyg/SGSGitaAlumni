---
version: 2.1
status: partially-implemented
last_updated: 2025-11-30
implementation_date: 2025-11-26
---

# Tactical Agentic Coding (TAC) - Status Report

> **Report Date**: November 30, 2025  
> **Version**: 2.1 (Updated with improvement plan status)  
> **Scope**: Universal agent orchestration framework

---

## 1. What Is TAC?

**Tactical Agentic Coding** is the execution layer for AI-driven development:

| SDD (Methodology) | TAC (Execution) |
|-------------------|-----------------|
| WHAT to build | HOW to build it |
| Specifications | Agent triggering |
| Quality gates | Parallel execution |
| Workflow phases | Model selection & costs |

**Core Innovation**: Break complex work into coordinated phases with specialized agents, enabling 3-5x productivity for large features.

---

## 2. The TAC Phases (Updated with Phase 0)

### Phase 0: Constraints (NEW - CRITICAL GAP)

> **Status**: ❌ Not yet implemented

**Purpose**: Load constraints BEFORE any coding task

**What to Check**:
- LOCKED files (require approval)
- STOP triggers (require confirmation)
- Port constraints (immutable)

**Implementation**: Add to `scripts/validation/rules/exceptions.cjs`

---

### Phase 1: Scout
| Aspect | Detail |
|--------|--------|
| Purpose | Discover files, patterns, dependencies |
| Model | Haiku-class (fast, cheap) |
| Cost | ~$0.02/task |
| Output | Scout report with paths, patterns, recommendations |

### Phase 2: Plan  
| Aspect | Detail |
|--------|--------|
| Purpose | Create implementation strategy |
| Model | Sonnet-class (thorough) |
| Output | Architecture decisions, file changes, risks |

**Key Rule**: Planner does NOT code—human reviews plan before build.

### Phase 3: Build
| Aspect | Detail |
|--------|--------|
| Purpose | Execute plan with focused agents |
| Model | Sonnet-class per agent |
| **Structure** | **Multiple parallel agents, 3-5 files each** |

❌ Wrong: Single agent builds entire feature  
✅ Right: Multiple agents build in parallel (for 10+ files)

### Phase 4: Orchestrate (Deferred)
| Aspect | Detail |
|--------|--------|
| Status | ⚠️ Documented, not tested |
| Purpose | Coordinate agents, manage context handoffs |
| Model | Sonnet/Opus |
| Prerequisite | Complete Phases 0-3 first |

### Phase 5: Validate
| Aspect | Detail |
|--------|--------|
| Purpose | Verify implementation matches plan |
| Model | Sonnet-class |
| Output | Validation report, regression check |

---

## 3. Implementation Status

| Component | Status | Location |
|-----------|--------|----------|
| Phase 0 (Constraints) | ❌ Todo | Not yet created |
| Scout phase | ✅ Documented | Skills + methodology |
| Plan phase | ✅ Documented | Skills + methodology |
| Build phase | ✅ Documented | Skills + methodology |
| Orchestrate | ⚠️ Deferred | Documentation only |
| Validate | ⚠️ Partial | PostToolUse hook |
| Git worktrees | ⚠️ Not tested | Documentation only |
| Model selection | ✅ Documented | model-selection-guide.md |

---

## 4. Tool Compatibility

| Feature | Claude Code CLI | VS Code + GitHub Copilot | Other Tools |
|---------|-----------------|--------------------------|-------------|
| Skills auto-activation | ✅ | ❌ Manual context | ❌ |
| Prime commands | ✅ | ❌ Manual file read | ❌ |
| Model selection | ✅ --model flag | ⚠️ Limited | Varies |
| Parallel agents | ✅ Git worktrees | ✅ Git worktrees | ✅ Git worktrees |
| CLI validation | ✅ | ✅ | ✅ |

**For non-Claude CLI tools**: Read methodology documents as context, use CLI validators.

---

## 5. Decision Matrix

| File Count | Approach | Phases |
|------------|----------|--------|
| 1-2 files | Direct build | Build only |
| 3-10 files | Sequential | Phase 0 → Scout → Plan → Build → Validate |
| 10+ files | Parallel | Full TAC (when Phase 0-3 proven) |

---

## 6. Key Gaps to Address

### Gap 1: Phase 0 Not Enforced
**Problem**: No constraint checking before Scout
**Solution**: Create `project-constraints` skill and constraint validator

### Gap 2: Git Worktrees Not Tested
**Problem**: Parallel execution documented but never validated
**Solution**: Test with real 10+ file feature after Phases 0-3 complete

### Gap 3: PreToolUse Hook Missing
**Problem**: Cannot BLOCK dangerous operations, only report after
**Solution**: Create PreToolUse hook that imports shared constraint logic

---

## 7. Reference

- [README.md](./README.md) - Framework overview and status
- [sdd-tac-methodology.md](./sdd-tac-methodology.md) - Core workflow with Phase 0
- [agent-orchestration.md](./agent-orchestration.md) - Parallel execution (when ready)
- [model-selection-guide.md](./model-selection-guide.md) - Cost optimization
- [SDD/TAC Framework Improvement Plan](../../../archive/root-docs/IndyDevDan_TAC/Plan/SDD_TAC_Framework_Improvement_Plan.md) - Detailed roadmap

---

## 5. Action Items (ROI-Ordered)

### 🔴 TIER 1: CRITICAL (Highest ROI)

#### 5.1 ~~Add "Build with Parallel Agents" to Discoverable Location~~ ✅ COMPLETE
**ROI**: Enables 3-5x speedup for complex features  
**Effort**: 1-2 hours

**Status**: Documented in `/prime-tac` command (Nov 26, 2025)
```markdown
## Build Phase: Parallel Focused Agents

Build is NOT monolithic. It's multiple specialized agents:

**Execution Pattern**:
1. Analyze plan → identify independent file groups
2. Spawn agent per group (3-5 files max each)
3. Run in parallel (git worktrees if needed)
4. Orchestrator validates consistency

**Example: 15-file feature**
- Agent 1: API routes (files 1-5) → background
- Agent 2: UI components (files 6-10) → background  
- Agent 3: Database (files 11-15) → background
- Orchestrator: Launches all, validates on completion

**File Dependency Rule**:
- Independent files → parallel agents
- Dependent files → sequential in same agent
```

---

#### 5.2 ~~Add Git Worktrees Documentation~~ ✅ COMPLETE
**ROI**: True parallelism without conflicts  
**Effort**: 1 hour

**Status**: Documented in `/prime-tac` command (Nov 26, 2025)
```markdown
## True Parallel Execution with Git Worktrees

For parallel agents modifying different features:

# Setup
git worktree add ../work-backend feature/backend
git worktree add ../work-frontend feature/frontend

# Launch parallel
(cd ../work-backend && claude -p "build backend" &)
(cd ../work-frontend && claude -p "build frontend" &)
wait

# Merge
git merge feature/backend feature/frontend
```

---

#### 5.3 ~~Create `/prime-tac` Command~~ ✅ COMPLETE
**ROI**: TAC patterns load on-demand  
**Effort**: 2-3 hours

**Status**: Created at `.claude/commands/prime-tac.md` (~110 lines) on Nov 26, 2025

**Contents**:
- Decision tree (when to use each phase)
- Parallel agent pattern
- Git worktrees commands
- Cost matrix
- Orchestrator template

---

#### 5.4 ~~Add Self-Triggering to `always-on.md`~~ ✅ COMPLETE
**ROI**: Framework auto-activates  
**Effort**: 1 hour

**Status**: Implemented via post-tool-use hook (Nov 26, 2025)
- `.claude/hooks/post-tool-use-validation.js` runs structure validation after file edits
- `.claude/settings.json` configures hook execution

---

### 🟡 TIER 2: HIGH VALUE

#### 5.5 ~~Add Cost Decision Matrix~~ ✅ COMPLETE
**ROI**: 10x cost savings on discovery tasks  
**Effort**: 1 hour

**Status**: Included in `/prime-tac` command (Nov 26, 2025)
```markdown
## Model Selection Guide

| Task | Model | Why |
|------|-------|-----|
| Scout/discover | Haiku | 10x cheaper, just reading |
| Documentation | Haiku | Output generation, no reasoning |
| Simple changes | Haiku | <500 lines, clear patterns |
| Architecture | Sonnet | Design decisions needed |
| Complex build | Sonnet | Multi-file reasoning |
| Orchestration | Sonnet | Coordination logic |
```

---

#### 5.6 ~~Add Proactive Priming Protocol~~ ✅ COMPLETE
**ROI**: Agents auto-load context  
**Effort**: 1 hour

**Status**: Prime commands now reference each other (Nov 26, 2025)
- `/prime-tac` references `/prime-sdd` for methodology
- `/prime-sdd` references `/prime-tac` for execution
```markdown
## Proactive Context Loading
Before starting, check domain and state:
- Auth work? "Loading /prime-auth first"
- API work? "Loading /prime-api first"
- DB changes? "Loading /prime-database first"
- UI work? "Loading /prime-ui first"
- TAC patterns? "Loading /prime-tac first"
```

---

#### 5.7 ~~Document Claude Code Commands~~ ✅ COMPLETE
**ROI**: Executable patterns instead of theory  
**Effort**: 2 hours

**Status**: Documented in `/prime-tac` command (Nov 26, 2025)
```markdown
## Executable Commands

# Scout with Haiku
claude --model haiku -p "scout for [domain]"

# Build with tool restrictions
claude -p "[task]" --allowedTools "Read" "Write"

# Check context usage
claude /context

# Parallel execution
(claude -p "task 1" &); (claude -p "task 2" &); wait
```

---

### 🟢 TIER 3: INCREMENTAL

#### 5.8 Create TAC Quick Reference Card
**Location**: `docs/TAC_QUICK_REFERENCE.md`

```markdown
# TAC Quick Reference

## Workflow Selection
| Files | Workflow | Agents |
|-------|----------|--------|
| 1-2 | Build only | 1 |
| 3-10 | Scout→Plan→Build | 1 each |
| 10+ | Full TAC + parallel | Multiple |
| Research | Scout only | 1-3 |

## Model Costs
| Model | Cost/1M tokens | Use for |
|-------|----------------|---------|
| Haiku | ~$0.25 | Scout, docs |
| Sonnet | ~$3 | Build, plan |

## Key Commands
claude --model haiku -p "[scout]"
claude /context
git worktree add ../parallel-work branch
```

---

#### 5.9 End-to-End Test Scenarios
**Create `docs/TAC_TEST_PLAN.md`**:

| Scenario | Expected Behavior | Pass Criteria |
|----------|-------------------|---------------|
| Simple bug | Skip Scout, Build | Agent says "Building directly" |
| New feature | Full Scout-Plan-Build | Agent mentions all phases |
| Complex (15 files) | Parallel agents | Agent says "spawning parallel agents" |
| Research | Scout only | Agent stops after Scout report |

---

## 6. Integration Points

### With SDD
```
SDD provides:           TAC executes:
├─ Specifications   →   Scout reads specs
├─ Prime commands   →   Agents load context  
├─ Quality gates    →   Validate phase
└─ Workflows        →   Phase templates
```

### With IndyDevDan's Framework
| IndyDevDan Concept | Our Implementation |
|--------------------|-------------------|
| Big 3 Architecture | Haiku/Sonnet/Gemini |
| R&D Framework | Prime commands |
| Scout-Plan-Build | 5 TAC phases |
| Git worktrees | Add to Module 6 |
| Skills | `.claude/skills/` |
| Hooks | `.claude/hooks/` |

---

## 7. Success Metrics

### Current State (Updated Nov 26, 2025)
| Metric | Status |
|--------|--------|
| Parallel pattern documented | ✅ In /prime-tac, discoverable |
| Auto-discovery | ✅ Post-tool-use hook runs validation |
| Cost optimization | ✅ Full matrix in /prime-tac |
| Git worktrees | ✅ Documented in /prime-tac |
| Test validation | ✅ Structure validation operational (31 errors, 157 warnings detected) |

### Target State (After Fixes)
| Metric | Target |
|--------|--------|
| Fresh session | Auto-mentions TAC workflow |
| 10+ file task | Auto-suggests parallel agents |
| Scout tasks | Auto-uses Haiku |
| Complex feature | Suggests Orchestrator |

---

## Summary Dashboard

| Component | Status | Action | Priority |
|-----------|--------|--------|----------|
| Parallel build pattern | ✅ Done | Documented in /prime-tac | 🔴 |
| Git worktrees | ✅ Done | Documented in /prime-tac | 🔴 |
| `/prime-tac` | ✅ Done | Created `.claude/commands/prime-tac.md` (~110 lines) | 🔴 |
| Auto-triggers | ✅ Done | Post-tool-use hook validates structure | 🔴 |
| Cost matrix | ✅ Done | Included in /prime-tac | 🟡 |
| Proactive priming | ✅ Done | Prime commands reference each other | 🟡 |
| CLI commands | ✅ Done | Documented in /prime-tac | 🟡 |
| Quick reference | ⚠️ Pending | Create standalone card | 🟢 |
| Test scenarios | ⚠️ Partial | Complete | 🟢 |

**Status**: 🔴 TIER 1 COMPLETE (Nov 26, 2025) — Framework infrastructure operational
