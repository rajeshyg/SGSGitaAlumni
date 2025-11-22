# SGS Gita Alumni - Specifications

This directory contains the spec-driven development framework following the
**Scout → Plan → Build** workflow from `/docs/spec_driven_coding_guide.md`.

## Structure

```
specs/
├── CONSTITUTION.md          # Original full constitution (reference)
├── context/                  # Layered context for R&D Framework
│   ├── always-on.md         # <50 lines - loads every session
│   ├── layer-auth.md        # Authentication context
│   ├── layer-database.md    # Database patterns
│   ├── layer-api.md         # API standards
│   └── layer-ui.md          # UI patterns
├── functional/              # WHAT & WHY (business features)
│   ├── authentication.md
│   ├── user-management.md
│   ├── directory.md
│   ├── postings.md
│   ├── messaging.md
│   ├── dashboard.md
│   ├── moderation.md
│   ├── notifications.md
│   └── rating.md
├── technical/               # WHAT & WHY (technical requirements)
│   ├── api-standards.md
│   ├── error-handling.md
│   ├── database.md
│   ├── testing.md
│   ├── deployment.md
│   ├── ui-standards.md
│   ├── code-standards.md
│   ├── security.md
│   └── structure-standards.md
├── scouts/                  # Scout phase outputs
│   └── (discovery reports)
├── plans/                   # Plan phase outputs
│   └── (implementation plans)
├── tasks/                   # Build phase task breakdowns
│   └── (task breakdowns)
└── templates/               # Reusable templates
    ├── feature-spec.md
    ├── implementation-plan.md
    ├── task-breakdown.md
    └── scout-report.md
```

## Scout-Plan-Build Workflow

### Phase 1: Scout (Use Haiku - fast/cheap)
1. Load `context/always-on.md` + relevant `layer-*.md`
2. Search for existing implementations (avoid duplicates)
3. Document findings in `scouts/[feature]-discovery.md`

### Phase 2: Plan (Use Sonnet)
1. Review scout findings
2. Create implementation plan in `plans/[feature]-plan.md`
3. Break into phases with validation checkpoints

### Phase 3: Build (Use Sonnet)
1. Execute plan phase by phase
2. Create tasks in `tasks/[feature]-tasks.md` if needed
3. Validate each phase before proceeding
4. Update spec status when complete

## Context Loading

### Always Load
- `context/always-on.md` - Core rules, reference implementations

### Load Based on Task
- Auth work → `context/layer-auth.md`
- Database work → `context/layer-database.md`
- API work → `context/layer-api.md`
- UI work → `context/layer-ui.md`

## Model Selection

| Phase | Model | Use For |
|-------|-------|---------|
| Scout | Haiku | File discovery, pattern matching |
| Plan | Sonnet | Implementation design |
| Build | Sonnet | Coding, testing |
| Architect | Opus | Complex decisions only |

## Status Legend
- **planned** - Spec written, not started
- **in-progress** - Partially implemented
- **implemented** - Complete and working
- **deprecated** - No longer used

## Maintaining Specs
- Update status as implementation progresses
- Add implementation links to spec YAML metadata
- Keep acceptance criteria current
- Create scout report before each new feature

## Reference
- Spec-Driven Guide: `/docs/spec_driven_coding_guide.md`
- Project Report: `/mvp_pending_tasks_report.html`
- Audits: `/docs/audits/`
