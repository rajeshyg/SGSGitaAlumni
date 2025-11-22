# SGS Gita Alumni - Specifications

This directory contains the spec-driven development framework following the
**Constitution → Spec → Plan → Tasks** workflow from `/docs/spec_driven_coding_guide.md`.

## Structure

```
specs/
├── CONSTITUTION.md          # Phase 1: Immutable principles & constraints
├── functional/              # Phase 2: WHAT & WHY (business features)
│   ├── authentication.md
│   ├── user-management.md
│   ├── directory.md
│   ├── postings.md
│   ├── messaging.md
│   ├── dashboard.md
│   ├── moderation.md
│   ├── notifications.md
│   └── rating.md
├── technical/               # Phase 2: WHAT & WHY (technical requirements)
│   ├── api-standards.md
│   ├── error-handling.md
│   ├── database.md
│   ├── testing.md
│   └── deployment.md
├── plans/                   # Phase 3: HOW to implement
│   └── (implementation plans)
├── tasks/                   # Phase 4: Atomic work units
│   └── (task breakdowns)
└── templates/               # Reusable templates
    ├── feature-spec.md
    ├── implementation-plan.md
    └── task-breakdown.md
```

## Workflow

### For New Features
1. **Constitution** - Review `CONSTITUTION.md` for principles
2. **Specify** - Create spec using `templates/feature-spec.md`
3. **Plan** - Create implementation plan using `templates/implementation-plan.md`
4. **Tasks** - Break down into atomic tasks using `templates/task-breakdown.md`
5. **Execute** - Implement task by task, validating at each step

### For Existing Features
1. Read `CONSTITUTION.md` for project principles
2. Find the relevant spec in `functional/` or `technical/`
3. Review requirements and acceptance criteria
4. Implement following the spec
5. Check off acceptance criteria as completed

## Status Legend
- **Complete** - Implemented and working
- **In Progress** - Partially implemented
- **Pending** - Not yet started

## Maintaining Specs
- Update status as implementation progresses
- Add notes for deviations from original spec
- Keep acceptance criteria current
- Create plans/tasks for pending features before implementation

## Reference
- Project Report: `/mvp_pending_tasks_report.html`
- Spec-Driven Guide: `/docs/spec_driven_coding_guide.md`
- Audits: `/docs/audits/`
- Quick Action Plan: `/docs/audits/QUICK_ACTION_PLAN.md`
