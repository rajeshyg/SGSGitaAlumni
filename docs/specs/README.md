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
│   ├── user-management/     # User profile and preferences
│   │   ├── scout.md         # Discovery: 20+ files, architecture analysis
│   │   ├── plan.md          # 4-phase plan: profile edit, limits, pictures, extended fields
│   │   └── tasks.md         # 11 tasks across 4 sprints
│   ├── postings/            # Posting system with expiry and taxonomy
│   │   ├── scout.md         # Discovery: API inventory, integration points
│   │   ├── plan.md          # 5-phase plan: expiry (critical), taxonomy, comments, chat
│   │   └── tasks.md         # 15 tasks across 4 sprints
│   └── [feature-name]/      # Additional features as needed
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

## Current Workflows

### User Management (In Progress)
**Location**: `workflows/user-management/`  
**Status**: In Progress - Profile editing and preference limits  
**Priority**: High

**Scout Report** (`scout.md`):
- Identified 20+ related files across frontend/backend
- Analyzed current implementation state
- Documented integration with family accounts, preferences, and directory
- Identified risks: file storage, domain limit enforcement

**Implementation Plan** (`plan.md`):
- Phase 1: Complete profile editing (8 hours)
- Phase 2: Enforce 5-domain limit (4 hours)
- Phase 3: Profile picture infrastructure (12 hours)
- Phase 4: Extended profile fields (6 hours)
- Total: 30 hours across 4 phases

**Task Breakdown** (`tasks.md`):
- 11 detailed tasks with acceptance criteria
- Sprint 1: Profile editing (Tasks 1-3)
- Sprint 2: Domain limits (Tasks 4-5)
- Sprint 3: Profile pictures (Tasks 6-8)
- Sprint 4: Extended fields (Tasks 9-11)

### Postings System (In Progress - CRITICAL)
**Location**: `workflows/postings/`  
**Status**: In Progress - Expiry logic is MVP blocker  
**Priority**: CRITICAL (Expiry), HIGH (Taxonomy)

**Scout Report** (`scout.md`):
- Comprehensive API endpoint inventory
- Identified expiry logic as critical gap
- Analyzed taxonomy integration needs
- Documented chat and notification integration points

**Implementation Plan** (`plan.md`):
- Phase 1: Posting expiry logic (6 hours) - **CRITICAL MVP BLOCKER**
- Phase 2: Domain taxonomy integration (8 hours) - **HIGH PRIORITY**
- Phase 3: Enhanced comment system (10 hours)
- Phase 4: Chat integration (6 hours)
- Phase 5: Engagement notifications (8 hours)
- Total: 38 hours across 5 phases

**Task Breakdown** (`tasks.md`):
- 15 detailed tasks with dependencies
- Sprint 1 (CRITICAL): Expiry logic (Tasks 1-7)
  - Business rule: expiry = MAX(user_date, created_at + 30 days)
  - Auto-archive cron job
  - UI indicators and extension
- Sprint 2 (HIGH): Taxonomy (Tasks 8-13)
- Sprint 3: Nested comments (Tasks 14-15)
- Sprint 4+: Future enhancements

**Critical Path to MVP**:
1. ⚠️ Expiry logic MUST be completed for MVP launch
2. Taxonomy integration highly recommended for UX
3. Other features can be delivered post-MVP

## Reference
- Spec-Driven Guide: `/docs/spec_driven_coding_guide.md`
- Project Report: `/mvp_pending_tasks_report.html`
- Audits: `/docs/audits/`
