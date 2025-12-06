---
version: 2.0
status: active
last_updated: 2025-12-05
applies_to: framework
description: Implementation progress, status tracking, and phased roadmap for SDD/TAC
---

# SDD/TAC Framework: Progress & Roadmap

---

## Current Status: 🟡 Phase 2.5 - Hub-and-Spoke Architecture Design

| Layer | Status | Progress | Next Action |
|-------|--------|----------|-------------|
| Documentation | ✅ Complete | 100% | Maintain as changes occur |
| **Observability Layer** | ✅ Enhanced | 100% | Blocked ops tracking added |
| **Phase 0 (Constraints)** | ✅ Verified | 100% | Test passed (server.js blocked) |
| Scout-Plan-Build | 🟡 Enhanced | 40% | **Skills now MANDATE AskUserQuestion tool** |
| **Agent Architecture** | 🟡 RESEARCH COMPLETE | 25% | Hub-and-spoke model defined |
| **Model Selection** | 🔴 TODO | 0% | Opus/Sonnet/Haiku stack configuration |
| Validation Scripts | ✅ Implemented | 100% | Includes session analysis |
| Pre-commit | ⚠️ Bypassed | Blocked | Fix ESLint errors first |

---

## 📋 Validation Test Results (2025-12-04)

> **Full details**: `docs/context-bundles/2025-12-03-framework-validation-tests.md`

| Test | Scout | Found Existing | Stop & Ask | Result |
|------|-------|----------------|------------|--------|
| 1. Validation | ✅ | ✅ | ❌ | ⚠️ PARTIAL |
| 2. Error Handling | ✅ | ❌ | ❌ | ❌ FAIL |
| 3. Database Schema | ✅ | ⚠️ | ❌ | ❌ FAIL |
| 4. Component Reuse | ✅ | ✅ | ❌ | ❌ FAIL |
| 5. API Route | ✅ | ✅ | ✅ | ✅ PASS |

**Pass Rate**: 1/5 (20%)

### Critical Finding: Context Bloat

**Test 3** consumed **55 tools, 75.6k tokens, 7.5 minutes** and hit rate limit—proving that skills alone cannot enforce focused scouting. Sub-agents needed for context isolation.

### Why Test 5 Passed

Only test where `AskUserQuestion` was used. Task clarity ("add filtering to alumni API") made functional alignment obvious. Ambiguous tasks (Tests 1-4) defaulted to "create new" without asking.

### Root Cause Analysis (Updated 2025-12-05)

**Original hypothesis**: Context bloat requires custom agents for isolation.

**Research finding**: 3/4 test failures were **decision-making failures**, not just context issues. Skills said "stop and ask" but provided TEXT TEMPLATES instead of mandating the `AskUserQuestion` TOOL.

**Solution applied**: Enhanced skills to MANDATE AskUserQuestion tool usage:
- `sdd-tac-workflow/SKILL.md` - Added MANDATORY section with tool requirement
- `duplication-prevention.md` - Added tool requirement with JSON example

**Agent infrastructure**: DEFERRED pending re-evaluation. Research showed IndyDevDan's full orchestrator pattern requires SDK development (programmatic agent CRUD), not just `.claude/agents/` markdown files.

> **Reference**: `docs/context-bundles/2025-12-05-agents-research-decision.md`

---

## ✅ Observability Layer (ENHANCED) {#observability}

> **This is NOT a phase—it's a continuous validation layer that runs alongside all development.**

Claude Code provides `transcript_path` in every hook. Our Stop hook analyzes it automatically.

| Component | Status | Location | Purpose |
|-----------|--------|----------|----------|
| `stop-session-analyzer.cjs` | ✅ Enhanced | `.claude/hooks/` | Analyze transcript + blocked ops |
| `pre-tool-use-constraint.cjs` | ✅ Enhanced | `.claude/hooks/` | Logs blocked ops for analyzer |
| `.claude/blocked-operations.jsonl` | ✅ NEW | `.claude/` | Blocked operations log |
| `.claude/session-logs/` | ✅ Implemented | `.claude/session-logs/` | Store analysis JSON |
| `session-viewer.html` | ✅ Enhanced | `.claude/` | Shows blocked ops with green badge |
| settings.json | ✅ Updated | `.claude/settings.json` | Stop hook configured |

**What's Tracked**:
- Files read, modified, created
- Commands run, searches performed
- Tool usage summary
- **Blocked operations** (distinguished from violations)
- Framework violations (scout-before-edit, locked files, duplicates)

**How to Use**:
1. Sessions auto-analyzed when Claude stops
2. View logs: `.claude/session-logs/`
3. Visual dashboard: Open `.claude/session-viewer.html` in browser
4. Load session JSON files to visualize
5. Blocked operations show with 🛡️ icon (green = properly blocked)

→ **Full details**: [testing-observability.md](./testing-observability.md)

---

## ✅ Phase 0: Constraints (VERIFIED) {#phase-0}

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| `LOCKED_FILES` export | ✅ Verified | `scripts/validation/rules/exceptions.cjs` | 20+ locked file patterns |
| `STOP_TRIGGERS` export | ✅ Implemented | `scripts/validation/rules/exceptions.cjs` | 10 dangerous operation patterns |
| `PORT_CONSTRAINTS` export | ✅ Implemented | `scripts/validation/rules/exceptions.cjs` | Reserved, ranges, forbidden |
| `constraint-check.cjs` | ✅ Implemented | `scripts/validation/validators/` | CLI validator |
| PreToolUse hook | ✅ Verified | `.claude/hooks/pre-tool-use-constraint.cjs` | Blocks + logs blocked ops |
| project-constraints skill | ✅ Implemented | `.claude/skills/project-constraints.md` | Documents all constraints |
| sdd-tac-workflow updated | ✅ Updated | `.claude/skills/sdd-tac-workflow/` | Includes Phase 0 check |

**Test Result**: ✅ Task "Add comment to server.js" was correctly BLOCKED

---

## Phases 1-4: Scout-Plan-Build-Validate {#phases-1-4}

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| Workflow documentation | ✅ Complete | `methodology.md` | - |
| sdd-tac-workflow skill | ✅ Implemented | `.claude/skills/sdd-tac-workflow/` | Includes Phase 0 |
| Scout phase guidance | ✅ Documented | `methodology.md` | - |
| Plan phase guidance | ✅ Documented | `methodology.md` | - |
| Build phase guidance | ✅ Documented | `methodology.md` | - |
| Validate phase guidance | ✅ Documented | `methodology.md` | - |
| Context bundle pattern | ✅ Documented | `docs/context-bundles/` | - |

---

## Hub-and-Spoke Agent Architecture {#hub-and-spoke}

> **STATUS**: 🟡 RESEARCH COMPLETE - Architecture defined (2025-12-05)
> **Key Finding**: Sub-agents NEVER talk to each other. Primary Agent mediates ALL communication.

### Architecture Diagram

```
                    ┌─────────────────────────────────────┐
                    │                                     │
        ┌───────────▼───────────┐                        │
        │      USER PROMPT      │                        │
        └───────────┬───────────┘                        │
                    │                                     │
                    ▼                                     │
        ┌───────────────────────┐                        │
        │   PRIMARY AGENT       │◄───────────────────────┘
        │   (Orchestrator)      │
        │                       │
        │  • Receives user task │
        │  • Delegates to subs  │
        │  • Aggregates results │
        │  • Reports to user    │
        └───────────┬───────────┘
                    │
     ┌──────────────┼──────────────┐
     │              │              │
     ▼              ▼              ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│  SCOUT  │   │ BUILDER │   │VALIDATOR│
│ (Haiku) │   │(Sonnet) │   │ (Haiku) │
│         │   │         │   │         │
│ Reports │   │ Reports │   │ Reports │
│   TO    │   │   TO    │   │   TO    │
│ Primary │   │ Primary │   │ Primary │
└────┬────┘   └────┬────┘   └────┬────┘
     │              │              │
     └──────────────┴──────────────┘
                    │
            ALL REPORT BACK
            TO PRIMARY ONLY
```

### Agent Communication Rules

| Component | Talks To | Never Talks To |
|-----------|----------|----------------|
| User | Primary Agent only | Sub-agents |
| Primary Agent | User, All Sub-agents | N/A (hub) |
| Scout | Primary Agent | Builder, Validator, User |
| Builder | Primary Agent | Scout, Validator, User |
| Validator | Primary Agent | Scout, Builder, User |

### Implementation Status

| Component | Status | Location | Purpose |
|-----------|--------|----------|---------|
| Architecture research | ✅ Complete | `docs/context-bundles/2025-12-05-agent-architecture-research.md` | Reference |
| `.claude/agents/` directory | 🔴 TODO | `.claude/agents/` | Agent definitions |
| **Orchestrator agent** | 🔴 TODO | `.claude/agents/orchestrator.md` | Opus model - coordination |
| **Scout agent** | 🔴 TODO | `.claude/agents/scout.md` | Haiku model - discovery |
| **Builder agent** | 🔴 TODO | `.claude/agents/builder.md` | Sonnet model - implementation |
| **Validator agent** | 🔴 TODO | `.claude/agents/validator.md` | Haiku model - quality checks |

→ **Full details**: [agent-engineering.md](./agent-engineering.md)

---

## Model Selection Strategy {#model-selection}

> **STATUS**: 🔴 TODO - Configuration needed
> **Key Finding**: Use model "stack" - Opus for orchestration, Sonnet for building, Haiku for discovery

### Model Assignment Matrix

| Agent Role | Model | Cost | Reasoning |
|------------|-------|------|-----------|
| **Orchestrator/Primary** | **Opus** | ~$15/1M tokens | Complex coordination, decision-making, synthesis |
| Scout | Haiku | ~$0.25/1M tokens | Fast discovery, pattern matching, no deep reasoning |
| Builder | Sonnet | ~$3/1M tokens | Code generation, implementation logic |
| Validator | Haiku | ~$0.25/1M tokens | Structured validation, checklist verification |
| Dynamic/Specialized | Haiku or Sonnet | Varies | Task-dependent |

### Cost Optimization

| Approach | Scout | Plan | Build | Total |
|----------|-------|------|-------|-------|
| All-Sonnet | $2.00 | $1.50 | $3.00 | **$6.50** |
| Optimized Stack | $0.20 (Haiku) | $1.50 | $3.00 | **$4.70** (28% savings) |

→ **Full details**: [model-selection.md](./model-selection.md)

---

## Sub-Agent Patterns {#sub-agents}

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| R&D framework docs | ✅ Documented | `sub-agent-patterns.md` | Reference material |
| Context persistence stack | ✅ Implemented | always-on, skills, commands | Working well |
| Skills directory | ✅ Implemented | `.claude/skills/` | 4 skills active |
| Prime commands | ✅ Implemented | `.claude/commands/` | 7+ commands |
| Sub-agent spawning | ✅ Available | Task tool | Use built-in Task tool |
| **Orchestrator pattern** | 🔴 TODO | `.claude/agents/` | **Required - see test results** |
| Git worktrees | ⏸️ ON HOLD | `sub-agent-patterns.md` | Not needed until 15+ file features |

---

## Validation Scripts

| Script | Status | Location | Notes |
|--------|--------|----------|-------|
| validate-structure.cjs | ✅ Implemented | `scripts/validation/` | Main orchestrator |
| file-placement.cjs | ✅ Implemented | `scripts/validation/validators/` | - |
| file-uniqueness.cjs | ✅ Implemented | `scripts/validation/validators/` | - |
| naming-conventions.cjs | ✅ Implemented | `scripts/validation/validators/` | - |
| spec-documents.cjs | ✅ Implemented | `scripts/validation/validators/` | - |
| constraint-check.cjs | ✅ Implemented | `scripts/validation/validators/` | Phase 0 validator |
| exceptions.cjs | ✅ Implemented | `scripts/validation/rules/` | Needs LOCKED |
| structure-rules.cjs | ✅ Implemented | `scripts/validation/rules/` | - |

---

## Hooks

| Hook | Status | Location | Notes |
|------|--------|----------|-------|
| PostToolUse | ✅ Implemented | `.claude/hooks/post-tool-use-validation.cjs` | Structure validation |
| Stop | ✅ Implemented | `.claude/hooks/stop-session-analyzer.cjs` | Session analysis |
| PreToolUse | ✅ Implemented | `.claude/hooks/pre-tool-use-constraint.cjs` | Blocks locked files |
| settings.json | ✅ Complete | `.claude/settings.json` | PostToolUse + Stop |

---

## Skills

| Skill | Status | Location | Size | Notes |
|-------|--------|----------|------|-------|
| sdd-tac-workflow | ✅ Implemented | `.claude/skills/sdd-tac-workflow/` | 87 lines | Needs Phase 0 |
| duplication-prevention | ✅ Implemented | `.claude/skills/duplication-prevention.md` | 90 lines | Needs STOP trigger |
| security-rules | ✅ Implemented | `.claude/skills/security-rules.md` | 211 lines | - |
| coding-standards | ⚠️ Large | `.claude/skills/coding-standards.md` | 524 lines | Split planned (exceeds 100-line target) |
| project-constraints | 🔴 TODO | `.claude/skills/project-constraints.md` | - | Phase 1.5 |

---

## Prime Commands

| Command | Status | Location |
|---------|--------|----------|
| /prime-framework | ✅ Implemented | `.claude/commands/prime-framework.md` |
| /prime-auth | ✅ Implemented | `.claude/commands/prime-auth.md` |
| /prime-api | ✅ Implemented | `.claude/commands/prime-api.md` |
| /prime-database | ✅ Implemented | `.claude/commands/prime-database.md` |
| /prime-ui | ✅ Implemented | `.claude/commands/prime-ui.md` |
| /prime-testing | ✅ Implemented | `.claude/commands/prime-testing.md` |
| /prime-security | ✅ Implemented | `.claude/commands/prime-security.md` |

---

## Pre-commit Validation

| Check | Status | Notes |
|-------|--------|-------|
| Structure validation | ⚠️ Bypassed | ESLint errors force --no-verify |
| ESLint | ⚠️ 1358 errors | Blocked |
| Mock data detection | ✅ Rule exists | - |
| Redundancy check | ✅ Rule exists | - |

**Blockers**: 1358 ESLint errors blocking pre-commit. Strategy: fix per-module during feature work.

---

## Implementation Roadmap

### ✅ Phase 0: Observability (COMPLETE)

Observability layer working. Session analysis distinguishes blocked ops from violations.

### ✅ Phase 1: Constraint Enforcement (COMPLETE)

| Task | File | Status | Test After |
|------|------|--------|------------|
| 1.1 | Add LOCKED_FILES to exceptions.cjs | ✅ Done | Task touching server.js |
| 1.2 | Create PreToolUse hook | ✅ Done | Edit blocked for LOCKED file |
| 1.3 | Add STOP_TRIGGERS | ✅ Done | Dangerous commands blocked |
| 1.4 | Create project-constraints skill | ✅ Done | Claude mentions constraints |
| 1.5 | Add PORT_CONSTRAINTS | ✅ Done | Port conflicts detected |
| 1.6 | Create constraint-check.cjs validator | ✅ Done | CLI validation works |
| 1.7 | Update sdd-tac-workflow with Phase 0 | ✅ Done | Workflow includes constraints |

### 🟡 Phase 2: Behavioral Fixes (IN PROGRESS)

> **Status**: BEHAVIORAL FIXES APPLIED - Pending re-test
> **Strategy Pivot**: Research showed 3/4 failures were decision-making, not context isolation
> **Reference**: `docs/context-bundles/2025-12-05-agents-research-decision.md`

| Task | File | Status | Description |
|------|------|--------|-------------|
| 2.1 | `sdd-tac-workflow/SKILL.md` | ✅ DONE | Added MANDATORY AskUserQuestion section |
| 2.2 | `duplication-prevention.md` | ✅ DONE | Added tool requirement with JSON example |
| 2.3 | Re-run validation tests | 🔴 TODO | Measure improvement after behavioral fixes |

### 🔵 Phase 2.5: Hub-and-Spoke Agent Architecture (NEW)

> **Status**: 🟡 RESEARCH COMPLETE - Ready for implementation
> **Reference**: `docs/context-bundles/2025-12-05-agent-architecture-research.md`

| Task | File | Status | Description |
|------|------|--------|-------------|
| 2.5.1 | Update agent-engineering.md | 🔴 TODO | Add hub-and-spoke architecture, correct model assignments |
| 2.5.2 | Update model-selection.md | 🔴 TODO | Add Opus orchestrator guidance |
| 2.5.3 | Create `.claude/agents/orchestrator.md` | 🔴 TODO | Opus model - primary coordination |
| 2.5.4 | Create `.claude/agents/scout.md` | 🔴 TODO | Haiku model - fast discovery |
| 2.5.5 | Create `.claude/agents/builder.md` | 🔴 TODO | Sonnet model - implementation |
| 2.5.6 | Create `.claude/agents/validator.md` | 🔴 TODO | Haiku model - quality checks |
| 2.5.7 | Implement handoff protocol | 🔴 TODO | Sub-agent → Primary reporting format |

**Key Architecture Decisions**:
- Sub-agents NEVER talk to each other (hub-and-spoke model)
- Orchestrator uses Opus (not Sonnet) - needs complex reasoning
- Use Task tool + configuration, NOT custom SDK

### 🟢 Phase 3: Skill Improvements

| Task | File | Status |
|------|------|--------|
| 3.1 | Split coding-standards.md | 🔴 TODO |
| 3.2 | Add Phase 0 to workflow skill | ✅ Done |
| 3.3 | Add STOP trigger to duplication skill | 🔴 TODO |

### 🟣 Phase 4: Dynamic Agent Spawning (NEW)

> **Status**: ⏸️ NOT STARTED - Requires Phase 2.5 validation
> **Prerequisite**: Hub-and-spoke architecture working

| Task | File | Status | Description |
|------|------|--------|-------------|
| 4.1 | Create dynamic agent templates | 🔴 TODO | SchemaScout, ComponentScout, TestWriter |
| 4.2 | Implement agent lifecycle | 🔴 TODO | Create → Use → Delete pattern |
| 4.3 | Add CRUD operations | 🔴 TODO | Agent management |

**Dynamic Agent Templates** (spawn on-demand):
- `SchemaScout` - Database exploration (Haiku)
- `ComponentScout` - UI pattern discovery (Haiku)
- `TestWriter` - Test generation (Sonnet)
- `Refactorer` - Code restructuring (Sonnet)
- `DocWriter` - Documentation (Haiku)

### 🔘 Phase 5: Quality Gates

| Task | File | Status |
|------|------|--------|
| 5.1 | Register constraint validator | 🔴 TODO |
| 5.2 | Fix ESLint per-module | ⚠️ Ongoing |

### ⚪ Phase 6: Parallel Execution (DEFERRED)

> **Status**: ⏸️ DEFERRED - Git worktrees only needed for 15+ file parallel edits
> **Resume When**: Encounter a REAL 15+ file feature requiring parallel agent work
> **Prerequisites**: Phases 2.5-4 validated on 10+ real tasks

| Task | Status | Notes |
|------|--------|-------|
| Git worktree documentation | ⏸️ DEFERRED | Not needed until 15+ file features |
| Parallel task distribution | ⏸️ DEFERRED | Requires working hub-and-spoke |
| Branch merging strategies | ⏸️ DEFERRED | Complex orchestration needed |

---

## Quick Reference

**What works today**:
- Phase 0 constraints (LOCKED files, STOP triggers)
- Observability (session analysis, blocked ops tracking)
- Skills auto-activation - **NOW WITH MANDATORY AskUserQuestion**
- Prime commands (7+ commands)
- PostToolUse validation (structure checks)

**What was fixed** (2025-12-05):
- Skills now MANDATE `AskUserQuestion` tool (not text templates)
- `sdd-tac-workflow/SKILL.md` - Added MANDATORY section
- `duplication-prevention.md` - Added tool requirement with JSON example
- **Agent architecture research complete** - Hub-and-spoke model defined

**Key Corrections from Research**:
| Item | Previous (Incorrect) | Corrected |
|------|---------------------|-----------|
| Agent communication | Sub-agents could talk to each other | Hub-and-spoke: ALL through Primary |
| Orchestrator model | Sonnet | **Opus** (complex coordination) |
| Parallel execution | Part of initial agent rollout | **Deferred** to Phase 6 |
| SDK strategy | Build custom SDK | **Use Task tool + configuration** |

**Next Actions**:
1. Re-run validation tests (Phase 2.3)
2. If pass rate improves: implement hub-and-spoke (Phase 2.5)
3. If still failing: revisit behavioral approach before agents
