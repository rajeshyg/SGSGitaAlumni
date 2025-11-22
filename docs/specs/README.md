# SGS Gita Alumni - Specifications

This directory contains the spec-driven development framework for the project.

## Structure

```
specs/
├── CONSTITUTION.md          # Project principles and constraints
├── functional/              # Business feature specifications
│   ├── authentication.md    # Auth, OTP, family accounts
│   ├── user-management.md   # Profiles, preferences
│   ├── directory.md         # Alumni directory search
│   ├── postings.md          # Jobs, events, resources
│   ├── messaging.md         # Chat, real-time messaging
│   ├── dashboard.md         # Home dashboard, feeds
│   ├── moderation.md        # Content approval workflow
│   ├── notifications.md     # Email, in-app, push
│   └── rating.md            # Recognition system
└── technical/               # Technical specifications
    ├── api-standards.md     # API patterns, rate limiting
    ├── error-handling.md    # Error boundaries, logging
    ├── database.md          # Indexes, optimization
    ├── testing.md           # Unit, integration, E2E
    └── deployment.md        # CI/CD, monitoring
```

## How to Use

### For Implementation
1. Read `CONSTITUTION.md` for project principles
2. Find the relevant spec in `functional/` or `technical/`
3. Review requirements and acceptance criteria
4. Implement following the spec
5. Check off acceptance criteria as completed

### Spec Status Legend
- **Complete** - Implemented and working
- **In Progress** - Partially implemented
- **Pending** - Not yet started

### Updating Specs
- Update status as implementation progresses
- Add notes for deviations from original spec
- Keep acceptance criteria current

## Reference
- Project Report: `/mvp_pending_tasks_report.html`
- Spec-Driven Guide: `/docs/spec_driven_coding_guide.md`
- Audits: `/docs/audits/`
