---
version: 1.0
status: active
last_updated: 2025-12-02
applies_to: framework
description: Track implementation progress, next steps, and strategic direction
---

# SDD/TAC Framework: Vision & Progress

> **Purpose**: Detailed progress tracking and roadmap. HIGH-LEVEL STATUS only lives in `README.md`

---

## Vision Statement

Complete the SDD/TAC (Spec-Driven Development / Tactical Agentic Coding) framework to enable:
- 🎯 **Specification-First Workflows**: All code follows written specifications
- 🤖 **AI-Assisted Development**: Agents follow systematic SDD/TAC phases
- 🔒 **Constraint Enforcement**: LOCKED files, STOP triggers, and security rules
- 📊 **Context Optimization**: Sub-agents, R&D framework, resource efficiency
- ✅ **Quality Gates**: Validation, pre-commit hooks, consistency checks

---

## Current State vs. Vision

| Capability | Current | Vision | Gap |
|-----------|---------|--------|-----|
| Phases (Scout-Plan-Build) | ✅ Documented | ✅ Automated + Enforced | Implement Phase 0 |
| Sub-Agent Orchestration | 🟡 Documented | ✅ Working with git worktrees | Create agents/ structure |
| Constraint Enforcement | 🔴 Manual | ✅ Pre-tool-use blocking | Phase 1 implementation |
| Quality Enforcement | ✅ Skill-based | ✅ Validation + Skills | Integrate both |
| Agent Engineering | 🟡 Documented | ✅ Meta-agent system | Create agent templates |

---

## Progress by Phase

### Phase 0: Constraints Enforcement (Foundation)

**Goal**: Block dangerous actions BEFORE execution

**Current Status**: 🔴 NOT STARTED (0%)

**Components**:
- [ ] `LOCKED_FILES` export from exceptions.cjs
- [ ] `STOP_TRIGGERS` export from exceptions.cjs
- [ ] `constraint-check.cjs` validator
- [ ] PreToolUse hook implementation
- [ ] `project-constraints` skill

**Blockers**: None - ready to implement

**Effort**: ~2-3 hours for validation team

**Next Step**: Start with exceptions.cjs exports

---

### Phase 1: Scout-Plan-Build Automation (Core)

**Goal**: Automate the workflow phases with enforcement

**Current Status**: 🟡 PARTIAL (60%)

**What Works**:
- ✅ Methodology documented
- ✅ Skill exists (sdd-tac-workflow)
- ✅ Context bundle pattern

**What's Missing**:
- 🔴 Phase 0 enforcement integration
- 🔴 Orchestrator for 10+ file tasks
- 🟡 Git worktree testing (not verified with 15+ files)

**Next Steps**: Complete Phase 0 first, then integrate

---

### Phase 2: Agent Infrastructure

**Goal**: Enable agent creation and orchestration

**Current Status**: 🔴 NOT STARTED (0%)

**Components**:
- [ ] `.claude/agents/` directory structure
- [ ] Meta-agent template + configuration
- [ ] Scout-agent templates (per domain)
- [ ] QA-agent implementation
- [ ] Integration tests

**Effort**: ~4-5 hours

**Next Step**: Create `.claude/agents/` and meta-agent

---

### Phase 3: Quality & Validation Integration

**Goal**: Merge quality-enforcement + domain standards

**Current Status**: 🟡 PARTIAL (30%)

**What Works**:
- ✅ AI anti-patterns documented
- ✅ Domain standards referenced
- ✅ ESLint/automation exists

**What's Missing**:
- 🔴 Split coding-standards skill
- 🔴 Reference pattern in skills
- ⚠️ 1358 ESLint errors blocking pre-commit

**Dependencies**: Phase 0, Phase 1

**Next Step**: After Phase 1

---

## Roadmap

### Q4 2025 (December)

| Task | Effort | Owner | Status |
|------|--------|-------|--------|
| Phase 0 Implementation | 2-3h | Validation Team | 🔴 TODO |
| Phase 0 Testing | 1-2h | Dev Team | 🔴 TODO |
| Agent Infrastructure | 4-5h | Dev Team | 🔴 TODO |
| Integration Testing | 2h | QA | 🔴 TODO |

### Q1 2026 (January+)

- Phase 3: Quality integration
- Orchestrator testing (15+ file features)
- cc-sdd integration evaluation
- Domain-specific agent templates

---

## Known Issues & Constraints

| Issue | Impact | Workaround | Resolution |
|-------|--------|-----------|-----------|
| ESLint 1358 errors | Blocks pre-commit | Use --no-verify | Fix per-module during features |
| No git worktree testing | Uncertain for 10+ files | Use sequential agents | Test with next 15+ file feature |
| Deprecated framework docs | Confusion in archive | Move to archive/ | Done - clean up on next PR |

---

## Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Framework docs complete | 100% | 100% | ✅ |
| Phase 0 implemented | 100% | 0% | 🔴 |
| Agents created | 4+ agents | 0 | 🔴 |
| Validation tests | 8+ validators | 5 | 🟡 |
| Pre-commit passing | 100% | Bypassed | ⚠️ |

---

## Dependencies & Blockers

```
Phase 0 (Constraints)
    ↓
Phase 1 (Scout-Plan-Build) + Phase 2 (Agents)
    ↓
Phase 3 (Quality Integration)
    ↓
Advanced (Orchestrator, cc-sdd)
```

**Current Blocker**: Phase 0 not started

---

## References

- **Implementation Details**: See individual spec files (methodology.md, agent-engineering.md, etc.)
- **Status Dashboard**: Check YAML frontmatter in each framework doc
- **Progress Updates**: Update this file during implementation
