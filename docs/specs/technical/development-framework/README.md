---
version: 1.0
status: implemented
last_updated: 2025-11-26
applies_to: all
enforcement: required
description: Spec-Driven Development and Tactical Agentic Coding methodology for AI-assisted development
---

# Development Framework (SDD/TAC)

## Overview

This folder contains the complete **SDD (Spec-Driven Development)** and **TAC (Tactical Agentic Coding)** methodology - our framework for systematic, high-quality AI-assisted development.

**Purpose**: Single source of truth for development methodology, replacing scattered documentation across 4+ locations.

## What This Framework Solves

Based on [Problem-Solution Report](../../../../archive/root-docs/IndyDanDev_TAC/Plan/SDD_TAC_Problem_Solution_Report.md), this framework addresses critical pain points:

| Pain Point | Severity | Solution in Framework |
|------------|----------|----------------------|
| Rampant duplication | 35% of issues | Scout phase + duplication prevention |
| Context repetition | High | Skills auto-activation |
| Security blindspots | 8/10 | Security enforcement patterns |
| Over-engineering | High | Simplicity principles |
| Cost inefficiency | 9/10 | Model selection guide |

## Framework Components

| Document | Purpose | When to Use |
|----------|---------|-------------|
| [sdd-tac-methodology.md](./sdd-tac-methodology.md) | Core Scout-Plan-Build workflow | 3+ file features, refactors, complex bugs |
| [model-selection-guide.md](./model-selection-guide.md) | Haiku vs Sonnet decision matrix | Before starting any agent task |
| [context-management.md](./context-management.md) | R&D Framework, context bundles | Managing large contexts, session handoff |
| [agent-orchestration.md](./agent-orchestration.md) | Parallel agents, git worktrees | 10+ file features requiring parallelism |
| [duplication-prevention.md](./duplication-prevention.md) | Anti-duplication patterns | Before creating any new file |
| [security-enforcement.md](./security-enforcement.md) | Security patterns and rules | Auth, database, API, sensitive data |
| [coding-standards.md](./coding-standards.md) | Code quality and simplicity | Service files, database code, components |

## Quick Start

### For Simple Tasks (1-2 files)
```
Build directly - no framework overhead needed
```

### For Medium Tasks (3-10 files)
```
1. Scout: Find existing implementations
2. Plan: Design the solution
3. Build: Implement systematically
```

### For Complex Tasks (10+ files)
```
1. Scout (parallel if multi-domain)
2. Plan (aggregated findings)
3. Build (parallel agents)
4. Orchestrate (coordinate agents)
5. Validate (quality check)
```

## Integration with Project

### Skills Auto-Activation
Framework knowledge is embedded in `.claude/skills/`:
- `sdd-tac-workflow` - Auto-triggers for 3+ file tasks
- `duplication-prevention` - Auto-triggers before file creation
- `security-rules` - Auto-triggers for auth/database/API
- `coding-standards` - Auto-triggers for service/database code

### Prime Commands
Load framework on-demand via `.claude/commands/`:
- `/prime-framework` - Full methodology reference

### Validation
Enforced through:
- Pre-commit hooks: `.husky/pre-commit`
- Pre-Tool-Use hooks: `.claude/hooks/pre-tool-use.sh` *(planned)*
- Validation scripts: `scripts/validation/`

## Status Dashboard Integration

Track framework implementation:
```bash
node scripts/validation/audit-framework.cjs
```

View status: `public/api/feature-status.json` → `technical-infrastructure.development-framework`

## Reference Sources

Primary reference:
- [SDD/TAC Problem-Solution Report](../../../../archive/root-docs/IndyDanDev_TAC/Plan/SDD_TAC_Problem_Solution_Report.md)

Additional references (archived):
- [TAC Framework Report](../../../../archive/root-docs/IndyDanDev_TAC/TAC_FRAMEWORK_REPORT_IMPROVED.md)
- [SDD Framework Report](../../../../archive/root-docs/IndyDanDev_TAC/SDD_FRAMEWORK_REPORT_IMPROVED%20(1).md)
- [TAC Tactical Agentic Coding Document](../../../../archive/root-docs/IndyDanDev_TAC/TAC%20Tactical%20Agentic%20Coding%20Document.md)
- [Pain Points Analysis](../../../../archive/root-docs/IndyDanDev_TAC/PainPoints_With_AI/Repository_Research_AI_Coding_Assistant_Pain_Points_Report_By_Opus4_1.md)

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
