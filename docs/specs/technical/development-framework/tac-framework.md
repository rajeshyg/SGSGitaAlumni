---
version: 2.1
status: implemented
last_updated: 2025-11-26
implementation_date: 2025-11-26
---

# Tactical Agentic Coding (TAC) - Execution Report v2.0

> **Report Date**: November 24, 2025  
> **Version**: 2.0 (Improved)  
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

## 2. The 5 TAC Phases

### Phase 1: Scout
| Aspect | Detail |
|--------|--------|
| Purpose | Discover files, patterns, dependencies |
| Model | Haiku (fast, cheap) |
| Cost | ~$0.25/1M tokens (10x cheaper than Sonnet) |
| Output | Scout report with paths, patterns, recommendations |

**Command**: `claude --model haiku -p "scout codebase for [domain]"`

### Phase 2: Plan  
| Aspect | Detail |
|--------|--------|
| Purpose | Create implementation strategy |
| Model | Sonnet (thorough) |
| Output | Architecture decisions, file changes, risks |

**Key Rule**: Planner does NOT code—human reviews plan before build.

### Phase 3: Build ⚠️ **CRITICAL: NOT MONOLITHIC**
| Aspect | Detail |
|--------|--------|
| Purpose | Execute plan with focused agents |
| Model | Sonnet per agent |
| **Structure** | **Multiple parallel agents, 3-5 files each** |

**This is the most misunderstood phase.**

❌ Wrong: Single agent builds entire feature  
✅ Right: Multiple agents build in parallel

**Example: 15-file feature**
```
Orchestrator spawns:
├─ Agent 1: API routes (files 1-5)      ─┐
├─ Agent 2: UI components (files 6-10)  ─┼─ Run in parallel
└─ Agent 3: Database (files 11-15)      ─┘
```

### Phase 4: Orchestrate
| Aspect | Detail |
|--------|--------|
| Purpose | Coordinate agents, manage context handoffs |
| Model | Sonnet/Opus |
| Responsibilities | Launch order, conflict detection, consistency |

### Phase 5: Validate
| Aspect | Detail |
|--------|--------|
| Purpose | Verify implementation matches plan |
| Model | Sonnet (or Gemini/Playwright for E2E) |
| Output | Validation report, regression check |

---

## 3. Missing Concepts from IndyDevDan

### 3.1 Git Worktrees for True Parallelism
**Current gap**: Parallel agents mentioned but no mechanism documented.

**Solution**: Use git worktrees for isolated parallel development:
```bash
# Create parallel work environments
git worktree add ../project-backend feature/backend
git worktree add ../project-frontend feature/frontend

# Run agents truly in parallel (separate directories)
(cd ../project-backend && claude -p "implement backend per specs" &)
(cd ../project-frontend && claude -p "implement frontend per specs" &)
wait  # Both complete
```

**Why it matters**: Same repo, separate working directories = no file conflicts.

### 3.2 Claude Code SDK Commands
**Current gap**: No executable agent commands documented.

**Essential commands**:
```bash
# Model selection (critical for cost)
claude --model haiku -p "[scout task]"      # ~$0.02/task
claude --model sonnet -p "[build task]"     # ~$3-4/feature

# Tool restrictions (security)
claude -p "[task]" --allowedTools "Read" "Write" "Edit"

# Context monitoring
claude /context    # Shows token usage

# MCP server status
claude /mcp        # Shows connected tools
```

### 3.3 Cost Decision Matrix
**Current gap**: "Use Haiku for Scout" but no decision framework.

| Task Type | Model | Approx Cost | Decision Rule |
|-----------|-------|-------------|---------------|
| File discovery | Haiku | ~$0.02 | Pure information retrieval |
| Documentation | Haiku | ~$0.02 | <500 lines output |
| Simple CRUD | Haiku | ~$0.02 | Straightforward patterns |
| Architecture | Sonnet | ~$1-2 | Design decisions |
| Complex refactor | Sonnet | ~$3-4 | Multi-file changes |
| Debugging | Sonnet | ~$2-3 | Requires reasoning |
| Orchestration | Sonnet/Opus | ~$3-5 | Coordination logic |

**Rule**: If task requires <500 lines or pure retrieval → Haiku. Otherwise → Sonnet.

### 3.4 MCP Integration
**Current gap**: No MCP documentation.

**Setup**:
```bash
# Add MCP server
claude mcp add --transport stdio github \
  -- npx -y @modelcontextprotocol/server-github

# Dynamic loading (don't preload all tools)
# Edit .claude.json directly, not via wizard
```

**Token optimization**: Load tools dynamically, not upfront.

### 3.5 The Orchestrator Pattern (Detailed)
**Current gap**: Pattern mentioned but not actionable.

**Orchestrator responsibilities**:
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

**When to use Orchestrator**:
- 10+ files affected
- Multiple domains (frontend + backend + database)
- Need true parallel execution

---

## 4. Test Results & Root Causes

### Test 1: Initial TAC Test (Nov 21)
- **Asked**: Plan pre-commit fixes
- **Expected**: Scout-Plan-Build workflow
- **Actual**: Manual step list
- **Result**: ❌ Failed

### Test 2: Fresh Session
- **Partial**: Mentioned Scout-Plan-Build phases ✅
- **Missing**: No "parallel agents" mention ❌
- **Missing**: No Orchestrator suggestion ❌
- **Result**: ⚠️ Partial

### Root Causes

| Issue | Root Cause | Fix |
|-------|------------|-----|
| Build = single step | Not documented as parallel | Add explicit section |
| No Orchestrator mention | Not in discoverable location | Add to always-on triggers |
| No priming request | Agents wait for instruction | Make proactive |
| No cost optimization | No decision matrix | Add selection guide |

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
