# ⚠️ DEPRECATED - Moved to Technical Specs

**This file has been deprecated as of 2025-11-26.**

TAC Framework documentation has been consolidated into: **`docs/specs/technical/development-framework/`**

**[→ Go to New Location](./specs/technical/development-framework/sdd-tac-methodology.md)**

**This file will be removed in a future cleanup.**

---

# Original Content (For Reference Only)

# Tactical Agentic Coding (TAC) - Execution Report

> **Report Date**: November 24, 2025
> **Project**: SGSGitaAlumni
> **Focus**: AI development execution workflow and productivity gains

---

## 1. What Is TAC?

**Tactical Agentic Coding** is the **execution mechanism** for the SDD framework:
- **SDD defines WHAT to do** (methodology, Scout-Plan-Build workflow)
- **TAC defines HOW to do it** (agent triggering, coordination, parallel execution)

**Core Concept**: Break complex AI development into 5 coordinated phases with specialized agents

**Key Productivity Gain**: Parallel execution with managed context (3-5x faster for large features)

---

## 2. The 5 TAC Phases

### Phase 1: Scout (Reconnaissance)
- **Purpose**: Discover files, patterns, dependencies before coding
- **Agent**: Haiku (fast, cheap, read-only)
- **Productivity Gain**:
  - 10x cheaper than Sonnet ($0.25 vs $3 per 1M tokens)
  - Prevents false starts (identify issues before implementation)
  - Parallel scouts for independent domains (frontend + backend + database simultaneously)
- **Output**: Scout report with file paths, patterns, recommendations

### Phase 2: Plan (Architecture & Design)
- **Purpose**: Create implementation strategy from scout findings
- **Agent**: Sonnet (thorough analysis)
- **Productivity Gain**:
  - Prevents rework (design validated before coding)
  - Clear task breakdown enables parallel execution
  - Architecture decisions documented (not tribal knowledge)
- **Output**: Implementation plan with file changes, sequence, risks, testing strategy

### Phase 3: Build (Focused Parallel Agents)
- **Purpose**: Execute plan with multiple specialized agents
- **Agent**: Sonnet per focused agent
- **KEY INNOVATION**: NOT a monolithic step
  - **Multiple agents work in parallel**
  - **Each agent gets 3-5 files max** (managed context, no overwhelm)
  - **Specific task per agent** (e.g., Agent 1: API routes, Agent 2: UI components, Agent 3: Database)
- **Productivity Gain**:
  - 3-5x faster for features touching 10+ files
  - Parallel execution when no file dependencies
  - Managed context prevents agent confusion
- **Example**: Pre-commit fix task
  - Agent 1: Mock data removal (files 1-5)
  - Agent 2: Test refactoring (files 6-10)
  - Agent 3: ESLint fixes (files 11-15)
  - All run simultaneously

### Phase 4: Orchestrate (Coordination)
- **Purpose**: Coordinate all agents, manage context handoffs, validate consistency
- **Agent**: Sonnet/Opus (complex coordination)
- **Productivity Gain**:
  - Launches agents in optimal order (parallel where possible)
  - Detects conflicts (two agents modifying same file)
  - Validates cross-agent consistency
  - Manages context boundaries
- **Pattern**: Orchestrator is the "main thread" that coordinates Scout → Plan → Build → Validate

### Phase 5: Validate (Quality Assurance)
- **Purpose**: Verify implementation matches plan, tests pass, no regressions
- **Agent**: Sonnet (thorough testing)
- **Productivity Gain**:
  - Catches errors before commit (not after deployment)
  - Validates cross-agent consistency
  - Ensures plan was followed
- **Output**: Validation report, context bundle for future sessions

---

## 3. TAC Infrastructure Built

### 3.1 Module 6: Agent Orchestration Implementation Guide
- **Location**: `docs/spec-driven-development/06-agent-orchestration-implementation.md`
- **Contents**:
  - Complete Scout-Plan-Build workflow examples
  - Claude Code Task tool integration patterns
  - Explicit role assignment templates
  - Parallel agent execution patterns
  - Orchestrator pattern implementation
  - Agent communication patterns (file-based, context bundle, inline)
  - Model selection guide (Haiku vs Sonnet vs Opus)
  - Error handling and recovery strategies
- **Productivity Gain**: Practical how-to guide (not just theory)

### 3.2 Agent Triggering Methods
**Method 1: Task Tool (Claude Code Native)**
```
Use Task tool with subagent_type=Explore to scout [task]
Use Task tool with subagent_type=Plan to design implementation
```

**Method 2: Explicit Role Assignment**
```
You are a Scout Agent. Your ONLY job is reconnaissance:
- Find files related to [feature]
- Do NOT modify code, only catalog
```

**Method 3: Parallel Execution**
```
Launch 3 agents in parallel:
1. Scout-Frontend: Find React components
2. Scout-Backend: Find API routes
3. Scout-Database: Find schema
```

### 3.3 Workflow Templates
- **Scout Report Template**: Structured discovery output format
- **Implementation Plan Template**: Architecture decisions and task breakdown
- **Task Breakdown Template**: Per-agent file assignments
- **Feature Examples**: 4 complete workflows (postings, user-management, notifications, rating)

### 3.4 Context Priming Integration
- **System**: `/prime-auth`, `/prime-api`, `/prime-database`, `/prime-ui` (see SDD report)
- **Usage in TAC**: Agents request priming before starting work
- **Productivity Gain**: Load only relevant context per agent (60-70% reduction)

### 3.5 CLI Model Selection (Claude Code Feature)
- **What It Is**: Claude Code CLI supports `--model` flag for session or per-command model selection
- **Productivity Gain**: 10x cost savings using Haiku for Scout phase ($0.25 vs $3 per 1M tokens)
- **Syntax Examples**:
  ```bash
  # Session-level model change
  claude --model claude-haiku-4-5

  # Single command with specific model
  claude --model claude-haiku-4-5 "scout codebase for authentication patterns"
  claude --model claude-opus-4-5 "design complex multi-service architecture"
  ```
- **Cost Decision Matrix**:
  | Task Type | Model | Cost/1M tokens | When to Use |
  |-----------|-------|----------------|-------------|
  | Scout/discovery | Haiku 4.5 | ~$0.25 | Pure information retrieval |
  | Documentation | Haiku 4.5 | ~$0.25 | <500 lines output |
  | Simple CRUD | Haiku 4.5 | ~$0.25 | Straightforward patterns |
  | Architecture | Sonnet 4.5 | ~$3 | Design decisions |
  | Complex refactor | Sonnet 4.5 | ~$3-4 | Multi-file changes |
  | Orchestration | Opus 4.5 | ~$15 | Complex coordination |
- **Rule of Thumb**: If task requires <500 lines or pure retrieval → Haiku. Otherwise → Sonnet.

### 3.6 Git Worktrees for True Parallelism
- **What It Is**: Git feature for isolated parallel development in separate working directories
- **Productivity Gain**: True parallel execution without file conflicts (same repo, different directories)
- **Syntax**:
  ```bash
  # Create parallel work environments
  git worktree add ../project-backend feature/backend
  git worktree add ../project-frontend feature/frontend

  # Run agents truly in parallel (separate directories, no conflicts)
  (cd ../project-backend && claude -p "implement backend per specs" &)
  (cd ../project-frontend && claude -p "implement frontend per specs" &)
  wait  # Both complete

  # Cleanup when done
  git worktree remove ../project-backend
  git worktree remove ../project-frontend
  ```
- **When to Use**: Complex features touching 10+ files across multiple domains (frontend + backend + database)
- **Key Benefit**: Agents can modify same-named files in different directories without conflicts

### 3.7 MCP Integration (Model Context Protocol)
- **What It Is**: Extend Claude Code with external tools via Model Context Protocol servers
- **Productivity Gain**: Dynamic tool loading (don't preload all tools, load per task)
- **CLI Syntax**:
  ```bash
  # Add MCP server (stdio transport)
  claude mcp add --transport stdio github \
    -- npx -y @modelcontextprotocol/server-github

  # Add MCP server (SSE transport)
  claude mcp add --transport sse weather https://weather.example.com/mcp

  # List configured MCP servers
  claude mcp list

  # Remove MCP server
  claude mcp remove github
  ```
- **Configuration Alternative**: Also configurable via `.claude/settings.json`
- **Token Optimization**: Load project-specific tools only when needed (e.g., GitHub server for PR reviews only)

---

## 4. What Went Wrong (Test Results)

### Test 1: November 21, 2025 - Initial TAC Test
- **Scenario**: Asked Claude to plan pre-commit validation fixes
- **Expected**: Proactively apply Scout-Plan-Build workflow
- **Actual**: Gave manual execution plan (list of steps, not agentic workflow)
- **Result**: ❌ FAILED

### Test 2: Fresh Session Test
- **Scenario**: New Claude Code session, same pre-commit fix question
- **Partial Success**:
  - ✅ Identified Scout-Plan-Build phases
  - ✅ Mentioned using agents
- **Critical Gaps**:
  - ❌ No mention of "Build with Focused Agents" (parallel execution)
  - ❌ No mention of "Orchestrator Agent" pattern
  - ❌ Treated Build as single monolithic step
- **Result**: ⚠️ PARTIAL (missing key productivity patterns)

### 4.1 Root Cause: Build Phase Misunderstood
- **Issue**: Agents interpret "Build Phase" as single step
- **Reality**: Build = Multiple focused agents working in parallel
- **Documentation Gap**: Module 6 explains it, but not surfaced in agent discovery
- **Productivity Impact**: Lost 3-5x parallel execution benefit

### 4.2 Root Cause: Orchestrator Not Discoverable
- **Issue**: Orchestrator pattern exists in Module 6 but not mentioned in `always-on.md`
- **Productivity Impact**: Agents don't coordinate complex features effectively

### 4.3 Root Cause: Context Priming Not Proactive
- **Current**: Agents wait to be told to use `/prime-*` commands
- **Desired**: Agents recognize task domain and request priming automatically
- **Example**: When working on auth, agent should say "Let me load `/prime-auth` first"

---

## 5. Critical Next Steps (Execution Improvements)

### 5.1 Enhance Module 6: Add "Build with Focused Agents" Section (HIGH PRIORITY - Tier 1)
**Add explicit documentation**:
```markdown
## Build Phase: Focused Agents with Managed Context

Build is NOT a single step. It's multiple specialized agents in parallel:

**Example: Pre-Commit Fix (15 files)**
- Agent 1: Mock data removal (files 1-5) → run in background
- Agent 2: Test refactoring (files 6-10) → run in background
- Agent 3: ESLint fixes (files 11-15) → run in background
- Orchestrator: Launch all 3, validate consistency

**CLI Commands** (using validated Claude Code syntax):
```bash
# Scout with Haiku (10x cheaper)
claude --model claude-haiku-4-5 "scout for pre-commit violations"

# Build with parallel focused agents (git worktrees for true parallelism)
git worktree add ../work-agent1 feature/fixes-batch1
git worktree add ../work-agent2 feature/fixes-batch2
git worktree add ../work-agent3 feature/fixes-batch3

(cd ../work-agent1 && claude --model claude-sonnet-4-5 "fix mock data in files 1-5" &)
(cd ../work-agent2 && claude --model claude-sonnet-4-5 "refactor tests in files 6-10" &)
(cd ../work-agent3 && claude --model claude-sonnet-4-5 "fix eslint in files 11-15" &)
wait
```

**Key Principles**:
- Each agent: 3-5 files max (managed context)
- Parallel if no file dependencies (use git worktrees)
- Orchestrator validates cross-agent consistency
```

**Productivity Impact**: Agents discover parallel execution pattern automatically with executable commands

### 5.2 Enhance Module 6: Add "Orchestrator Agent Pattern" Section
**Add explicit documentation**:
```markdown
## Orchestrator Agent: The Coordinator

Responsibilities:
1. Launch Scout agents (parallel if domains independent)
2. Aggregate scout findings
3. Trigger Planner with combined context
4. Analyze plan dependencies
5. Spawn Build agents (parallel where possible)
6. Monitor progress, detect conflicts
7. Run QA agent for validation

When to Use:
- Complex features (10+ files)
- Multiple domains (frontend + backend + database)
- Need for parallel execution
```

**Productivity Impact**: Agents coordinate large features systematically

### 5.3 Create `/prime-sdd` Command
- **Action**: Move TAC framework details from `always-on.md` to `/prime-sdd` command
- **Expected Gain**: 70% context reduction (see SDD report for details)
- **Impact**: Faster agent initialization, follows Reduce & Delegate principle

### 5.4 Document MCP Integration Strategy (MEDIUM PRIORITY - Tier 2)
- **Action**: Add MCP section to Module 6 with CLI commands and use cases
- **Expected Gain**: Extensibility for project-specific tools (load dynamically, not upfront)
- **Effort**: 1-2 hours
- **Content to Add**:
  ```markdown
  ## MCP Integration for TAC Workflows

  **When to Use MCP Servers**:
  - GitHub operations (PRs, issues) → `@modelcontextprotocol/server-github`
  - Database queries → Custom MCP server for your DB
  - Cloud services → AWS/Azure/GCP MCP servers

  **Setup**:
  ```bash
  claude mcp add --transport stdio github -- npx -y @modelcontextprotocol/server-github
  ```

  **Token Optimization**: Load tools only when needed (e.g., GitHub server for Scout phase when reviewing PRs)
  ```
- **Productivity Impact**: Extend TAC with project-specific capabilities without bloating context

### 5.5 Test TAC End-to-End with 4 Scenarios
**Test Scenarios**:
1. **Simple bug fix** → Expected: Skip Scout, go to Build
2. **New feature** → Expected: Full Scout-Plan-Build, mention focused agents
3. **Complex refactoring (15+ files)** → Expected: Orchestrator + parallel agents
4. **Research task** → Expected: Scout only, no Build

**Success Criteria**:
- Agent mentions Scout-Plan-Build without reminder
- Agent explicitly says "Build with focused agents in parallel"
- Agent suggests Orchestrator for coordination
- Agent requests context priming (`/prime-*`)

**Documentation**: Create `docs/TAC_TEST_RESULTS.md` with findings

### 5.6 Make Context Priming Proactive
**Update `always-on.md` with**:
```markdown
When given a task, check domain and load context:
- Authentication work? Request `/prime-auth` first
- API development? Request `/prime-api` first
- Database changes? Request `/prime-database` first
- UI components? Request `/prime-ui` first
```

**Productivity Impact**: Agents automatically load relevant context (no manual guidance)

### 5.7 Create TAC Decision Tree (Quick Reference)
**Location**: `docs/specs/context/TAC_QUICK_REFERENCE.md`
```
Task Complexity → TAC Workflow
├─ 1-2 files, simple → Skip Scout, Build directly
├─ 3-10 files, clear scope → Scout + Plan + Build
├─ 10+ files, complex → Scout + Plan + Build (focused agents) + Orchestrate
└─ Research/discovery → Scout only
```

**Productivity Impact**: Agents choose right workflow automatically

### 5.8 Document Git Worktrees Best Practices (MEDIUM PRIORITY - Tier 2)
- **Action**: Add git worktrees section to Module 6 with best practices and examples
- **Expected Gain**: True parallel execution capability clearly documented
- **Effort**: 1 hour
- **Content to Add**:
  ```markdown
  ## Git Worktrees for Parallel TAC Execution

  **When to Use**:
  - Complex features (10+ files)
  - Multiple independent domains (frontend + backend + database)
  - Need true parallel execution without conflicts

  **Best Practices**:
  1. Create worktree per focused agent (3-5 files each)
  2. Use descriptive branch names (feature/agent1-backend, feature/agent2-frontend)
  3. Clean up worktrees after merging (`git worktree remove`)
  4. Avoid shared files across worktrees (let Orchestrator handle merges)

  **Example Workflow**:
  ```bash
  # Orchestrator creates worktrees
  git worktree add ../agent1 feature/api-routes
  git worktree add ../agent2 feature/ui-components

  # Launch parallel agents
  (cd ../agent1 && claude -p "implement API routes" &)
  (cd ../agent2 && claude -p "implement UI components" &)
  wait

  # Merge and cleanup
  git merge feature/api-routes feature/ui-components
  git worktree remove ../agent1
  git worktree remove ../agent2
  ```
  ```
- **Productivity Impact**: 3-5x faster execution for complex features with clear guidelines

---

## 6. Integration with SDD

**SDD Framework (Methodology)**:
- Defines Scout-Plan-Build workflow phases
- Provides specification structure and templates
- Establishes quality gates and validation rules
- **See `SDD_FRAMEWORK_REPORT.md` for details**

**TAC Framework (Execution)**:
- Implements agent triggering and coordination
- Enables parallel execution with managed context
- Provides Orchestrator pattern for complex features

**Working Together**:
- SDD specs define WHAT to build
- TAC workflow defines HOW to build it
- Context priming connects specs to agents
- Validation ensures quality across both

---

## 7. Productivity Metrics (TAC-Specific)

### Achieved
- ✅ **Parallel Execution Infrastructure**: Module 6 documents focused agent pattern
- ✅ **Model Optimization**: Haiku for Scout (10x cheaper), Sonnet for Build
- ✅ **Context Management**: 3-5 file limit per agent prevents overwhelm
- ✅ **Workflow Templates**: Scout/plan/tasks templates for 4 features
- ✅ **CLI Model Selection**: Claude Code supports `--model` flag (cost optimization enabled)
- ✅ **Git Worktrees**: Standard git feature (true parallelism available)
- ✅ **MCP Integration**: Claude Code supports MCP CLI commands (extensibility enabled)

### Not Yet Realized
- ❌ **Automatic Discovery**: Agents don't proactively suggest parallel execution
- ❌ **Orchestrator Awareness**: Pattern exists but not surfaced to agents
- ❌ **Proactive Priming**: Agents wait for manual context loading instructions
- ⚠️ **CLI Commands Documentation**: Available but not documented in Module 6
- ⚠️ **Git Worktrees Documentation**: Available but not in workflow templates
- ⚠️ **MCP Documentation**: Available but not integrated into framework
- ⚠️ **Test Validation**: Only partial testing (missing complex scenarios)

### Expected Gains (After Fixes)
- **3-5x faster** for features touching 10+ files (parallel vs sequential)
- **60-70% context reduction** via prime commands (already achieved)
- **80% fewer regressions** via structured validation (SDD + TAC combined)
- **10x cheaper** discovery via Haiku scouts (already achieved)

---

## Summary Statistics

- **TAC Phases**: 5 (Scout, Plan, Build, Orchestrate, Validate)
- **Agent Roles**: 5 (Scout, Planner, Builder, Orchestrator, QA)
- **Triggering Methods**: 3 (Task tool, explicit role, parallel execution)
- **Workflow Templates**: 3 (scout report, implementation plan, task breakdown)
- **Feature Workflows**: 4 complete examples (44% of features)
- **Test Results**: Partial success (phases identified, parallel execution missed)

**TAC Status**: 🔧 Infrastructure complete, ⚠️ Agent discovery needs enhancement, 🔄 Testing in progress

---

## Quick Reference: When to Use TAC

| Task Type | Workflow | Agents | Parallel? |
|-----------|----------|--------|-----------|
| Simple bug (1-2 files) | Build only | 1 Builder | No |
| Clear feature (3-10 files) | Scout → Plan → Build | 1 Scout, 1 Planner, 1 Builder | No |
| Complex feature (10+ files) | Scout → Plan → Build → Orchestrate | 1 Scout, 1 Planner, 3-5 Builders, 1 Orchestrator | Yes |
| Research/discovery | Scout only | 1-3 Scouts (parallel domains) | Yes |

**Agent Triggering Example**:
```
Act as Orchestrator. For [complex feature]:
1. Launch 3 Scout agents in parallel (frontend, backend, database)
2. Aggregate findings → Planner
3. Spawn 5 Build agents (3-5 files each, parallel where possible)
4. Run QA agent for validation
```
