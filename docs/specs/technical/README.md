# Technical Specifications

```yaml
---
version: 2.0
status: active
last_updated: 2025-11-23
description: Technical standards and patterns for SGS Gita Alumni development
---
```

## Overview

This directory contains all technical specifications organized by domain. Each specification folder contains a README.md overview and detailed sub-specifications.

## Structure

| Folder | Purpose | Key Documents |
|--------|---------|---------------|
| [architecture/](./architecture/) | System design & patterns | API design, error handling, logging, performance |
| [security/](./security/) | Security & compliance | Authentication, authorization, data protection, COPPA |
| [database/](./database/) | Database design & operations | Schema, indexing, connection management |
| [testing/](./testing/) | Quality assurance | Unit testing, E2E, coverage targets |
| [ui-standards/](./ui-standards/) | Frontend development | **Theme system**, accessibility, responsive design |
| [coding-standards/](./coding-standards/) | Code quality | TypeScript, file organization, code review |
| [deployment/](./deployment/) | DevOps & infrastructure | Environments, CI/CD, monitoring |
| [integration/](./integration/) | System integration | API contracts, Socket.IO, external services |

## Quick Reference

### Before Starting Development

1. **Always read**: `../context/always-on.md` - Critical rules and patterns
2. **Domain-specific**: Open the relevant folder's README.md

### Critical Documents

| Task | Read This |
|------|-----------|
| UI/Theme work | [ui-standards/theme-system.md](./ui-standards/theme-system.md) |
| API development | [architecture/api-design.md](./architecture/api-design.md) |
| Database queries | [database/connection-management.md](./database/connection-management.md) |
| Error handling | [architecture/error-handling.md](./architecture/error-handling.md) |
| Code review | [coding-standards/code-review-checklist.md](./coding-standards/code-review-checklist.md) |
| Security | [security/README.md](./security/README.md) |

## Specification Format

All specifications follow this format:

```yaml
---
version: 1.0
status: implemented | in-progress | pending
last_updated: YYYY-MM-DD
applies_to: frontend | backend | all | database
enforcement: required | recommended | optional
---
```

## StatusDashboard Integration

These specifications are tracked by the StatusDashboard component. Run:
```bash
node scripts/validation/audit-framework.cjs
```

To regenerate `docs/FEATURE_MATRIX.md` and validate specification completeness.

## Contributing

When adding or updating specifications:
1. Follow the YAML frontmatter format
2. Include code references to actual implementation
3. Update status when implementation changes
4. Cross-link related specifications
5. Ensure README.md exists in each folder
