---
version: 2.0
status: partially-implemented
last_updated: 2025-11-30
applies_to: all
enforcement: required
description: SDD/TAC Framework - Tool-agnostic AI-assisted development methodology
---

# Development Framework (SDD/TAC)

## Overview

This folder contains the complete **SDD (Spec-Driven Development)** and **TAC (Tactical Agentic Coding)** methodology - a framework for systematic, high-quality AI-assisted development.

**Purpose**: Single source of truth for development methodology that is:
- **Project-agnostic** - Works with any React/Node.js project
- **Tool-agnostic** - Works with Claude Code CLI, VS Code + GitHub Copilot, Claude.ai, etc.

---

## Tool/Platform Compatibility

| Feature | Claude Code CLI | VS Code + GitHub Copilot | Claude.ai Web |
|---------|-----------------|--------------------------|---------------|
| `.claude/commands/` slash commands | ✅ Works | ❌ Not supported | ❌ Not supported |
| `.claude/skills/` auto-activation | ✅ Works | ❌ Not supported | ❌ Not supported |
| `.claude/hooks/` (Pre/PostToolUse) | ✅ Works | ❌ Not supported | ❌ Not supported |
| **CLI validation scripts** | ✅ Works | ✅ Works | ✅ Works |
| Manual file reading as context | ✅ Works | ✅ Works | ✅ Works |

**Design Principle**: Core validation logic lives in `scripts/validation/` - runnable by any tool.

---

## Implementation Status Summary

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| **Skills Directory** | ✅ Implemented | `.claude/skills/` | 4 skills created |
| **Prime Commands** | ✅ Implemented | `.claude/commands/` | 7+ commands |
| **PostToolUse Hook** | ✅ Implemented | `.claude/hooks/post-tool-use-validation.js` | Validates after file edits |
| **PreToolUse Hook** | ❌ Not Implemented | Planned | Block dangerous operations |
| **Context Bundles** | ✅ Documented | `docs/context-bundles/` | Session handoff pattern |
| **Exception Registry** | ✅ Implemented | `scripts/validation/rules/exceptions.cjs` | File exceptions |
| **Constraint Validation** | ❌ Not Implemented | Planned | LOCKED_FILES, STOP_TRIGGERS |
| **Phase 0 (Constraints)** | ❌ Not Implemented | Skills need update | Before Scout phase |
| **Pre-commit Validation** | ⚠️ Bypassed | `.husky/pre-commit` | Blocked by ESLint errors |

### Gap Analysis (Severity Order)

| Gap | Severity | Description |
|-----|----------|-------------|
| **Missing Phase 0** | 🔴 Critical | No mandatory constraint check before Scout |
| **No LOCKED constraints** | 🔴 Critical | Agent can modify critical files without approval |
| **No STOP triggers** | 🔴 Critical | Critical operations proceed without human check |
| **No PreToolUse hook** | 🟡 High | Can only report AFTER operations, not BLOCK before |
| **Large skill files** | 🟡 High | `coding-standards.md` exceeds recommended size |
| **Pre-commit bypassed** | 🟡 High | ESLint errors force `--no-verify` |

---

## Framework Components

| Document | Purpose | Status | When to Use |
|----------|---------|--------|-------------|
| [sdd-tac-methodology.md](./sdd-tac-methodology.md) | Core Phase 0-Scout-Plan-Build workflow | ⚠️ Needs Phase 0 | 3+ file features |
| [model-selection-guide.md](./model-selection-guide.md) | Haiku vs Sonnet decision matrix | ✅ Complete | Before starting any task |
| [context-management.md](./context-management.md) | R&D Framework, context bundles | ✅ Complete | Managing large contexts |
| [agent-orchestration.md](./agent-orchestration.md) | Parallel agents, git worktrees | ⚠️ Deferred | 10+ file features |
| [duplication-prevention.md](./duplication-prevention.md) | Anti-duplication patterns | ⚠️ Needs STOP trigger | Before creating any file |
| [security-enforcement.md](./security-enforcement.md) | Security patterns and rules | ✅ Complete | Auth, database, API work |
| [coding-standards.md](./coding-standards.md) | Code quality and simplicity | ⚠️ Needs split | Service files, components |
| [file-organization.md](./file-organization.md) | Where files belong | ✅ Complete | File placement rules |

---

## Quick Start

### For Simple Tasks (1-2 files)
```
Build directly - no framework overhead needed
```

### For Medium Tasks (3-10 files)
```
0. Constraints: Check LOCKED files, STOP triggers
1. Scout: Find existing implementations
2. Plan: Design the solution
3. Build: Implement systematically
4. Validate: Run tests and checks
```

### For Complex Tasks (10+ files)
```
0. Constraints: Check LOCKED files, STOP triggers
1. Scout (parallel if multi-domain)
2. Plan (aggregated findings)
3. Build (parallel agents via git worktrees)
4. Orchestrate (coordinate agents)
5. Validate (quality check)
```

---

## Improvement Roadmap

### 🔴 PHASE 1: Foundation (Tool-Agnostic Validation) - PRIORITY

| Task | Status | File |
|------|--------|------|
| Extend exceptions.cjs with LOCKED_FILES, STOP_TRIGGERS | ❌ Todo | `scripts/validation/rules/exceptions.cjs` |
| Create constraint-check.cjs validator | ❌ Todo | `scripts/validation/validators/constraint-check.cjs` |
| Update PostToolUse hook to use shared validator | ❌ Todo | `.claude/hooks/post-tool-use-validation.js` |
| Create PreToolUse hook (Claude CLI only) | ❌ Todo | `.claude/hooks/pre-tool-use-constraint.js` |
| Create project-constraints skill | ❌ Todo | `.claude/skills/project-constraints.md` |

### 🟡 PHASE 2: Skill & Context Improvements

| Task | Status | File |
|------|--------|------|
| Split coding-standards.md by topic | ❌ Todo | `.claude/skills/coding-standards*.md` |
| Update sdd-tac-workflow with Phase 0 | ❌ Todo | `.claude/skills/sdd-tac-workflow/SKILL.md` |
| Add STOP trigger to duplication-prevention | ❌ Todo | `.claude/skills/duplication-prevention.md` |

### 🟢 PHASE 3: Validation & Quality Gates

| Task | Status | File |
|------|--------|------|
| Register constraint validator in orchestrator | ❌ Todo | `scripts/validation/validate-structure.cjs` |
| Fix ESLint errors per-module during feature work | ⚠️ Ongoing | Various |

### 🔵 PHASE 4: Future (Deferred until Phases 1-3 stable)

- Orchestrator pattern for 15+ file features
- Git worktrees testing with real multi-agent workflow
- cc-sdd integration evaluation

---

## Integration Points

### Skills Auto-Activation (Claude CLI Only)
Framework knowledge embedded in `.claude/skills/`:
- `sdd-tac-workflow` - Auto-triggers for 3+ file tasks
- `duplication-prevention` - Auto-triggers before file creation
- `security-rules` - Auto-triggers for auth/database/API
- `coding-standards` - Auto-triggers for service/database code
- `project-constraints` - (Planned) Auto-triggers Phase 0

### CLI Validation (Any Tool)
```bash
# Check file constraints (when implemented)
node scripts/validation/validators/constraint-check.cjs <file-path>

# Full structure validation
node scripts/validation/validate-structure.cjs
```

### Prime Commands (Claude CLI Only)
Load framework on-demand via `.claude/commands/`:
- `/prime-framework` - Full methodology reference

---

## Reference Sources

Primary reference:
- [SDD/TAC Framework Improvement Plan](../../../archive/root-docs/IndyDevDan_TAC/Plan/SDD_TAC_Framework_Improvement_Plan.md) - Current roadmap
- [SDD/TAC Problem-Solution Report](../../../archive/root-docs/indyDevDan_TAC/Plan/SDD_TAC_Problem_Solution_Report.md) - Original pain points

---

**Next**: Read [sdd-tac-methodology.md](./sdd-tac-methodology.md) for core workflow with Phase 0.
