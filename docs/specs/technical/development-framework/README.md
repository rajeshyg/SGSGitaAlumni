# SDD/TAC Development Framework

> **Single source of truth** for Spec-Driven Development with Tactical Agentic Coding

---

## What This Is

**SDD (Spec-Driven Development)** = WHAT to build (methodology)  
**TAC (Tactical Agentic Coding)** = HOW to build it (execution with AI agents)

This framework prevents the top AI-assisted development problems:
- 🔴 Duplication (creating files that already exist)
- 🔴 Context overload (token budget exhaustion)
- 🔴 Agent drift (skipping reconnaissance, going rogue)
- 🔴 Security blindspots (modifying locked files)

---

## Quick Navigation

### Core Methodology
| Document | Purpose | Read When |
|----------|---------|-----------|
| [methodology.md](./methodology.md) | Phase 0→Scout→Plan→Build→Validate workflow | Starting any 3+ file task |
| [constraints-enforcement.md](./constraints-enforcement.md) | LOCKED files, STOP triggers, security | Before modifying critical files |
| [file-organization.md](./file-organization.md) | Where every file type belongs | Creating new files |

### Agent & Context Management
| Document | Purpose | Read When |
|----------|---------|-----------|
| [sub-agent-patterns.md](./sub-agent-patterns.md) | R&D framework, context layers, delegation | Managing context, 10+ file tasks |
| [agent-engineering.md](./agent-engineering.md) | Creating agents, prompt patterns, meta-agents | Building custom agents |

### Quality & Optimization
| Document | Purpose | Read When |
|----------|---------|-----------|
| [quality-enforcement.md](./quality-enforcement.md) | AI anti-patterns, domain standards references | Writing service/component code |
| [model-selection.md](./model-selection.md) | Haiku vs Sonnet decision matrix | Optimizing cost/speed |

### Status & Planning
| Document | Purpose | Read When |
|----------|---------|-----------|
| [vision-and-progress.md](./vision-and-progress.md) | Detailed progress, vision, roadmap, blockers | Tracking framework development |
| [ROADMAP.md](./ROADMAP.md) | Implementation status by component | Need specific completion status |

---

## Quick Start

### Simple Task (1-2 files)
```
Build directly → No framework overhead needed
```

### Medium Task (3-10 files)
```
Phase 0: Check constraints (LOCKED files, ports)
Phase 1: Scout (discover existing code)
Phase 2: Plan (design solution)
Phase 3: Build (implement)
Phase 4: Validate (test, pre-commit)
```

### Complex Task (10+ files)
```
Phase 0: Check constraints
Phase 1: Scout (parallel sub-agents by domain)
Phase 2: Plan (aggregate findings)
Phase 3: Build (parallel agents via git worktrees)
Phase 4: Orchestrate (coordinate agents)
Phase 5: Validate (quality gates)
```

---

## Tool Compatibility

| Feature | Claude CLI | VS Code + Copilot | Other Tools |
|---------|------------|-------------------|-------------|
| Skills auto-activation | ✅ | ❌ Manual | ❌ Manual |
| PreToolUse hooks | ✅ | ❌ | ❌ |
| Sub-agent delegation | ✅ | ⚠️ Limited | ❌ |
| Agent configuration | ✅ | ❌ | ❌ |
| **CLI validation scripts** | ✅ | ✅ | ✅ |
| **This documentation** | ✅ | ✅ | ✅ |

**Design Principle**: Core validation lives in `scripts/validation/` - runnable by any tool.

---

## Current Status

→ **Vision & detailed progress**: [vision-and-progress.md](./vision-and-progress.md)  
→ **Component-level status**: [ROADMAP.md](./ROADMAP.md)

| Component | Status |
|-----------|--------|
| Documentation | ✅ Complete |
| Phase 0 (Constraints) | 🔴 Not Implemented |
| Scout-Plan-Build | 🟡 Documented |
| Agent Engineering | 🟡 Documented |
| Validation Scripts | ✅ Implemented |
| Skills/Commands | ✅ Implemented |
