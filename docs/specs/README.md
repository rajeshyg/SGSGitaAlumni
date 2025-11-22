# SGS Gita Alumni - Specifications

This directory contains the spec-driven development framework following the
**Scout → Plan → Build** workflow from `/docs/spec_driven_coding_guide.md`.

## Structure

```
specs/
├── CONSTITUTION.md          # Project principles (always load)
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
├── technical/               # WHAT & WHY (technical standards)
│   ├── api-standards.md
│   ├── error-handling.md
│   ├── database.md
│   ├── testing.md
│   ├── deployment.md
│   ├── ui-standards.md
│   ├── code-standards.md
│   ├── security.md
│   └── structure-standards.md
├── workflows/               # Feature implementation workflows
│   └── [feature-name]/      # One folder per feature
│       ├── scout.md         # Discovery phase output
│       ├── plan.md          # Implementation plan
│       └── tasks.md         # Task breakdown
└── templates/               # Reusable templates
    ├── feature-spec.md
    ├── implementation-plan.md
    ├── task-breakdown.md
    └── scout-report.md
```

## Scout-Plan-Build Workflow

### For Each New Feature

1. **Create workflow folder**: `workflows/[feature-name]/`

2. **Scout Phase** (Use Haiku - fast/cheap)
   - Load `context/always-on.md` + relevant `layer-*.md`
   - Search for existing implementations
   - Create `workflows/[feature-name]/scout.md`

3. **Plan Phase** (Use Sonnet)
   - Review scout findings
   - Create `workflows/[feature-name]/plan.md`
   - Break into phases with checkpoints

4. **Build Phase** (Use Sonnet)
   - Create `workflows/[feature-name]/tasks.md`
   - Execute tasks sequentially
   - Update spec status when complete

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

## File Location Rules

### Allowed .md Locations
- `/README.md`, `/CHANGELOG.md` - Root only
- `/docs/specs/**/*.md` - ALL specifications
- `/docs/archive/**/*.md` - Historical docs
- `/.github/**/*.md` - GitHub templates

### Forbidden .md Locations
- `/src/**/*.md` - No docs in code
- `/scripts/**/*.md` - Except README
- `/server/**/*.md` - No docs in code
- Root `/*.md` - Except README/CHANGELOG

## Status Legend
- **planned** - Spec written, not started
- **in-progress** - Partially implemented
- **implemented** - Complete and working
- **deprecated** - No longer used

## Reference
- Spec-Driven Guide: `/docs/spec_driven_coding_guide.md`
- Project Report: `/mvp_pending_tasks_report.html`
- Audits: `/docs/audits/`
