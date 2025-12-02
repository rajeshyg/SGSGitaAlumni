---
version: 1.2
status: active
last_updated: 2025-12-02
applies_to: framework
description: Implementation progress, status tracking, and phased roadmap for SDD/TAC
---

# SDD/TAC Framework: Progress & Roadmap

---

## Current Status: 🟢 Phase 0 Complete

| Layer | Status | Progress | Next Action |
|-------|--------|----------|-------------|
| Documentation | ✅ Complete | 100% | Maintain as changes occur |
| **Observability Layer** | ✅ Implemented | 100% | Monitor sessions |
| **Phase 0 (Constraints)** | ✅ Implemented | 100% | Test with real tasks |
| Scout-Plan-Build | 🟡 Documented | 80% | Test with real tasks |
| Agent Engineering | 🟡 Documented | 30% | Create agent directory |
| Validation Scripts | ✅ Implemented | 100% | Includes session analysis |
| Pre-commit | ⚠️ Bypassed | Blocked | Fix ESLint errors first |

---

## ✅ Observability Layer (IMPLEMENTED) {#observability}

> **This is NOT a phase—it's a continuous validation layer that runs alongside all development.**

Claude Code provides `transcript_path` in every hook. Our Stop hook analyzes it automatically.

| Component | Status | Location | Purpose |
|-----------|--------|----------|----------|
| `stop-session-analyzer.js` | ✅ Implemented | `.claude/hooks/` | Analyze transcript on stop |
| `.claude/session-logs/` | ✅ Implemented | `.claude/session-logs/` | Store analysis JSON |
| `session-viewer.html` | ✅ Implemented | `.claude/` | Visual dashboard |
| settings.json | ✅ Updated | `.claude/settings.json` | Stop hook configured |

**What's Tracked**:
- Files read, modified, created
- Commands run, searches performed
- Tool usage summary
- Framework violations (scout-before-edit, locked files, duplicates)

**How to Use**:
1. Sessions auto-analyzed when Claude stops
2. View logs: `.claude/session-logs/`
3. Visual dashboard: Open `.claude/session-viewer.html` in browser
4. Load session JSON files to visualize

→ **Full details**: [testing-observability.md](./testing-observability.md)

---

## ✅ Phase 0: Constraints (IMPLEMENTED) {#phase-0}

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| `LOCKED_FILES` export | ✅ Implemented | `scripts/validation/rules/exceptions.cjs` | 20+ locked file patterns |
| `STOP_TRIGGERS` export | ✅ Implemented | `scripts/validation/rules/exceptions.cjs` | 10 dangerous operation patterns |
| `PORT_CONSTRAINTS` export | ✅ Implemented | `scripts/validation/rules/exceptions.cjs` | Reserved, ranges, forbidden |
| `constraint-check.cjs` | ✅ Implemented | `scripts/validation/validators/` | CLI validator |
| PreToolUse hook | ✅ Implemented | `.claude/hooks/pre-tool-use-constraint.js` | Blocks locked file edits |
| project-constraints skill | ✅ Implemented | `.claude/skills/project-constraints.md` | Documents all constraints |
| sdd-tac-workflow updated | ✅ Updated | `.claude/skills/sdd-tac-workflow/` | Includes Phase 0 check |

**Test**: Run task touching LOCKED file, verify it's blocked

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

## Agent Engineering {#agent-engineering}

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| Agent engineering docs | ✅ Complete | `agent-engineering.md` | - |
| `.claude/agents/` directory | 🔴 TODO | `.claude/agents/` | Create structure |
| Meta-agent | 🔴 TODO | `.claude/agents/meta-agent.json` | Agent builder |
| Scout agents (domain) | 🔴 TODO | `.claude/agents/scout-*.json` | Per-domain scouts |
| QA agent | 🔴 TODO | `.claude/agents/qa-agent.json` | Quality checks |

---

## Sub-Agent Patterns {#sub-agents}

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| R&D framework docs | ✅ Documented | `sub-agent-patterns.md` | - |
| Context persistence stack | ✅ Implemented | always-on, skills, commands | - |
| always-on.md | ✅ Reduced | `docs/specs/context/always-on.md` | 44 lines |
| Skills directory | ✅ Implemented | `.claude/skills/` | 4 skills |
| Prime commands | ✅ Implemented | `.claude/commands/` | 7+ commands |
| Sub-agent spawning | 🟡 Documented | - | Use Claude CLI |
| Git worktrees | 🟡 Documented | `sub-agent-patterns.md` | Not tested |
| Orchestrator pattern | 🔴 Deferred | - | After Phase 1-3 |

---

## Validation Scripts

| Script | Status | Location | Notes |
|--------|--------|----------|-------|
| validate-structure.cjs | ✅ Implemented | `scripts/validation/` | Main orchestrator |
| file-placement.cjs | ✅ Implemented | `scripts/validation/validators/` | - |
| file-uniqueness.cjs | ✅ Implemented | `scripts/validation/validators/` | - |
| naming-conventions.cjs | ✅ Implemented | `scripts/validation/validators/` | - |
| spec-documents.cjs | ✅ Implemented | `scripts/validation/validators/` | - |
| constraint-check.cjs | 🔴 TODO | `scripts/validation/validators/` | Phase 1.2 |
| exceptions.cjs | ✅ Implemented | `scripts/validation/rules/` | Needs LOCKED |
| structure-rules.cjs | ✅ Implemented | `scripts/validation/rules/` | - |

---

## Hooks

| Hook | Status | Location | Notes |
|------|--------|----------|-------|
| PostToolUse | ✅ Implemented | `.claude/hooks/post-tool-use-validation.js` | Structure validation |
| Stop | ✅ Implemented | `.claude/hooks/stop-session-analyzer.js` | Session analysis |
| PreToolUse | 🔴 TODO | `.claude/hooks/pre-tool-use-constraint.js` | Phase 1.4 |
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

### 🔥 Immediate: Enable Observability

> **Rationale**: We can't improve what we can't measure. One hook gives us full session visibility.

| Task | File | Status | Description |
|------|------|--------|-------------|
| OBS.1 | `.claude/hooks/stop-session-analyzer.js` | 🔴 TODO | Analyze transcript on Stop |
| OBS.2 | `.claude/session-logs/` | 🔴 TODO | Create directory for analysis output |
| OBS.3 | `.claude/settings.json` | 🔴 TODO | Add Stop hook configuration |
| OBS.4 | Run first test task | 🔴 TODO | Give Claude Code a real task |
| OBS.5 | Review session analysis | 🔴 TODO | Did it scout? Follow rules? |

**Exit Criteria**: Can see session analysis JSON after any Claude Code task

→ **Full details**: [testing-observability.md](./testing-observability.md)

---

### 🔄 Continuous: Test-Driven Framework Development

For EVERY framework change:

```
1. Make change (add rule, update skill, modify hook)
2. Run test task that should trigger the change
3. Review session log → Did Claude behave correctly?
4. If NO → Adjust → Go to step 2
5. If YES → Document finding → Next change
```

| Framework Change | Test Task | What to Verify |
|------------------|-----------|----------------|
| Add LOCKED_FILES to exceptions.cjs | "Update server.js" | PreToolUse blocks it |
| Add scout-before-edit skill | Multi-file bug fix | Files read before edit |
| Add file-placement rule | "Create new API route" | File in correct location |

---

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

### 🟡 Phase 2: Agent Infrastructure

| Task | File | Status |
|------|------|--------|
| 2.1 | Create `.claude/agents/` directory | 🔴 TODO |
| 2.2 | Implement meta-agent | 🔴 TODO |
| 2.3 | Implement scout-agent templates | 🔴 TODO |
| 2.4 | Implement qa-agent | 🔴 TODO |

### 🟢 Phase 3: Skill Improvements

| Task | File | Status |
|------|------|--------|
| 3.1 | Split coding-standards.md | 🔴 TODO |
| 3.2 | Add Phase 0 to workflow skill | ✅ Done |
| 3.3 | Add STOP trigger to duplication skill | 🔴 TODO |

### 🔵 Phase 4: Quality Gates

| Task | File | Status |
|------|------|--------|
| 4.1 | Register constraint validator | 🔴 TODO |
| 4.2 | Fix ESLint per-module | ⚠️ Ongoing |

### 🟣 Phase 5: Advanced (Deferred)

| Task | Status |
|------|--------|
| Test git worktrees with 15-file feature | Deferred |
| Implement orchestrator pattern | Deferred |
| Evaluate cc-sdd integration | Deferred |

---

## Quick Reference

**What works today**:
- Skills auto-activation (4 skills)
- Prime commands (7+ commands)
- PostToolUse validation (structure checks)
- Validation scripts (structure, placement, naming)
- Context bundles pattern
- **Claude Code already captures transcript** (we just need to analyze it)

**What's missing (do first)**:
1. **Stop hook for session analysis** ← IMPLEMENT THIS
2. Review session logs after test tasks
3. Iterate framework based on findings

**How to work**:
```
Make framework change → Test with real task → Review session log → Adjust → Repeat
```

**Every framework change should be tested before moving to the next.**
3. Phase 0 enforcement (LOCKED, STOP)
4. PreToolUse blocking
5. Constraint validator CLI
6. Orchestrator for 10+ files

**Next Action**: Implement Phase 0.5 to get visibility into agent behavior before building more infrastructure.
