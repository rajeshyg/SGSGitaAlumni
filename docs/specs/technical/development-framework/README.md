---
version: 2.0
status: implemented
last_updated: 2025-11-30
applies_to: all
enforcement: required
description: Spec-Driven Development and Tactical Agentic Coding methodology for AI-assisted development (AI Tool-Agnostic)
---

# Development Framework (SDD/TAC)

## Overview

This folder contains the complete **SDD (Spec-Driven Development)** and **TAC (Tactical Agentic Coding)** methodology - our framework for systematic, high-quality AI-assisted development.

**Purpose**: Single source of truth for development methodology, replacing scattered documentation across 4+ locations.

**Design Principle**: **Tool-Agnostic Validation** - Core logic lives in `scripts/validation/` and is runnable as CLI commands by any AI tool.

## Tool/Platform Compatibility

| Feature | Claude Code CLI | VS Code + GitHub Copilot | Claude.ai Web | Other AI Tools |
|---------|-----------------|--------------------------|---------------|----------------|
| `.claude/commands/` slash commands | ✅ Works | ❌ Not supported | ❌ Not supported | ❌ Not supported |
| `.claude/skills/` auto-activation | ✅ Works | ❌ Not supported | ❌ Not supported | ❌ Not supported |
| `.claude/hooks/` (PreToolUse/PostToolUse) | ✅ Works | ❌ Not supported | ❌ Not supported | ❌ Not supported |
| Manual file reading as context | ✅ Works | ✅ Works | ✅ Works | ✅ Works |
| **CLI validation scripts** | ✅ Works | ✅ Works | ✅ Works | ✅ Works |

**For non-Claude Code users**: The `/prime-*` commands won't work. Instead, manually include the content of `.claude/commands/prime-*.md` files in your prompts or reference them as context.

## What This Framework Solves

Based on the [Problem-Solution Report](../../../../archive/root-docs/indyDevDan_TAC/Plan/SDD_TAC_Framework_Improvement_Plan.md), this framework addresses critical pain points:

| Pain Point | Severity | Solution in Framework |
|------------|----------|----------------------|
| Rampant duplication | 35% of issues | Phase 0 constraints + Scout phase + duplication prevention |
| Context repetition | High | Skills auto-activation (or manual context loading) |
| Security blindspots | 8/10 | Security enforcement patterns + LOCKED files |
| Over-engineering | High | Simplicity principles |
| Cost inefficiency | 9/10 | Model selection guide |
| Missing constraints | Critical | **NEW: Phase 0 - Constraints** |

## Framework Components

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [sdd-tac-methodology.md](./sdd-tac-methodology.md) | Core Phase 0-Scout-Plan-Build workflow | 3+ file features, refactors, complex bugs |
| [constraints-and-validation.md](./constraints-and-validation.md) | LOCKED files, STOP triggers, validation | **Phase 0: Before ANY coding task** |
| [model-selection-guide.md](./model-selection-guide.md) | Haiku vs Sonnet decision matrix | Before starting any agent task |
| [context-management.md](./context-management.md) | R&D Framework, context bundles | Managing large contexts, session handoff |
| [agent-orchestration.md](./agent-orchestration.md) | Parallel agents, git worktrees | 10+ file features requiring parallelism |
| [duplication-prevention.md](./duplication-prevention.md) | Anti-duplication patterns + STOP triggers | Before creating any new file |
| [security-enforcement.md](./security-enforcement.md) | Security patterns and rules | Auth, database, API, sensitive data |
| [coding-standards.md](./coding-standards.md) | Code quality and simplicity | Service files, database code, components |

## Quick Start

### Phase 0: Constraints (MANDATORY - All Tasks)
Before ANY coding task, check:
```
1. Load project constraints (LOCKED files, STOP triggers)
2. Does task touch LOCKED files? → STOP, ask for approval
3. Does task trigger STOP actions? → Confirm before proceeding
4. Proceed to appropriate workflow
```

### For Simple Tasks (1-2 files)
```
Phase 0 → Build directly → Validate
```

### For Medium Tasks (3-10 files)
```
Phase 0 → Scout → Plan → Build → Validate
```

### For Complex Tasks (10+ files)
```
Phase 0 → Scout (parallel if multi-domain) → Plan → Build (parallel agents) → Orchestrate → Validate
```

## Tool-Agnostic Validation Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SINGLE SOURCE OF TRUTH                           │
│            scripts/validation/rules/exceptions.cjs                  │
│                                                                     │
│  exports: LOCKED_FILES, STOP_TRIGGERS, PORT_CONSTRAINTS             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              scripts/validation/validators/                         │
│                 constraint-check.cjs                                │
│                                                                     │
│  - CLI: node constraint-check.cjs <file> [--block]                 │
│  - Module: checkConstraints(path, options)                          │
└─────────────────────────────────────────────────────────────────────┘
           │                    │                      │
           ▼                    ▼                      ▼
   ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
   │ Claude CLI   │    │  Pre-commit  │    │ Other AI Tools   │
   │   Hooks      │    │   (Husky)    │    │  (run CLI)       │
   │              │    │              │    │                  │
   │ pre-tool-use │    │ calls via    │    │ node constraint- │
   │ post-tool-use│    │ npm script   │    │ check.cjs <file> │
   └──────────────┘    └──────────────┘    └──────────────────┘
```

## Integration with Project

### For Claude Code CLI Users
Framework knowledge is embedded in `.claude/skills/`:
- `sdd-tac-workflow` - Auto-triggers for 3+ file tasks
- `duplication-prevention` - Auto-triggers before file creation
- `security-rules` - Auto-triggers for auth/database/API
- `coding-standards` - Auto-triggers for service/database code
- `project-constraints` - **NEW: Phase 0 constraints**

### For VS Code/GitHub Copilot Users
Load framework on-demand by reading these files as context:
- Read `.claude/commands/prime-framework.md` for full methodology
- Read `.claude/skills/project-constraints.md` for Phase 0 constraints
- Read specific domain files as needed

### For Any AI Tool (Tool-Agnostic)
Run validation scripts directly:
```bash
# Check if file is LOCKED
node scripts/validation/validators/constraint-check.cjs <file-path>

# Run all validation
node scripts/validation/validate-structure.cjs
```

### Validation
Enforced through (all runnable as CLI):
- Pre-commit hooks: `.husky/pre-commit`
- Pre-Tool-Use hooks: `.claude/hooks/pre-tool-use-constraint.js` (Claude CLI only)
- Validation scripts: `scripts/validation/`

## Implementation Status Dashboard

| Phase | Component | Status | Notes |
|-------|-----------|--------|-------|
| Phase 1 | LOCKED_FILES in exceptions.cjs | 🟡 Planned | Add critical/sensitive/security categories |
| Phase 1 | STOP_TRIGGERS in exceptions.cjs | 🟡 Planned | Action confirmations |
| Phase 1 | constraint-check.cjs validator | 🟡 Planned | CLI + module interface |
| Phase 1 | PreToolUse hook | 🟡 Planned | Claude CLI blocking |
| Phase 2 | project-constraints skill | 🟡 Planned | Phase 0 mandatory loading |
| Phase 2 | Split coding-standards.md | 🟡 Planned | Core + topic-specific |
| Phase 3 | Orchestrator integration | ⚪ Deferred | After Phase 1-2 stable |

## Reference Sources

Primary reference:
- [SDD/TAC Framework Improvement Plan](../../../../archive/root-docs/indyDevDan_TAC/Plan/SDD_TAC_Framework_Improvement_Plan.md)

Additional references (archived):
- [TAC Framework Report](../../../../archive/root-docs/indyDevDan_TAC/TAC_FRAMEWORK_REPORT_IMPROVED.md)
- [SDD Framework Report](../../../../archive/root-docs/indyDevDan_TAC/SDD_FRAMEWORK_REPORT_IMPROVED%20(1).md)
- [TAC Tactical Agentic Coding Document](../../../../archive/root-docs/indyDevDan_TAC/TAC%20Tactical%20Agentic%20Coding%20Document.md)
- [Pain Points Analysis](../../../../archive/root-docs/indyDevDan_TAC/PainPoints_With_AI/Repository_Research_AI_Coding_Assistant_Pain_Points_Report_By_Opus4_1.md)

## Deprecated Documentation

**These locations are now deprecated** (redirects added):
- `docs/spec-driven-development/` → Use this folder instead
- `docs/SDD_FRAMEWORK_REPORT.md` → Use `sdd-tac-methodology.md`
- `docs/TAC_FRAMEWORK_REPORT.md` → Use `sdd-tac-methodology.md`
- `.claude/commands/prime-framework.md` → Loads content from this folder

## Contributing

When updating framework:
1. Edit specs in THIS folder (single source of truth)
2. Update skill descriptions if auto-activation triggers change
3. Keep prime command in sync (loads from specs)
4. Update status dashboard if components added/changed
5. Run validation: `node scripts/validation/audit-framework.cjs`

---

**Next**: Read [sdd-tac-methodology.md](./sdd-tac-methodology.md) for core workflow.
