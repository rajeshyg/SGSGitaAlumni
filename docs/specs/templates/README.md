---
version: 1.0
status: active
last_updated: 2025-12-02
applies_to: templates
description: Index of all template files for spec creation
---

# Specification Templates

Templates for AI agents and developers to use when creating new specifications.

## Spec Folder Structure Templates

When creating a new specification folder in `docs/specs/functional/[module]/` or `docs/specs/technical/[category]/`:

| Template | Purpose | Usage |
|----------|---------|-------|
| [README-template.md](./README-template.md) | Navigation hub for spec folder | Copy to `README.md` in new spec folder |
| [ROADMAP-template.md](./ROADMAP-template.md) | Progress tracking & roadmap | Copy to `ROADMAP.md` in new spec folder (optional but recommended) |

**Note**: README.md should NOT have YAML frontmatter. ROADMAP.md MUST have YAML frontmatter with `status` field.

---

## Content Templates

For writing individual specifications:

| Template | Purpose | Usage |
|----------|---------|-------|
| [feature-spec.md](./feature-spec.md) | Functional feature specification | For features in `docs/specs/functional/[module]/` |
| [implementation-plan.md](./implementation-plan.md) | Implementation planning | For technical implementation docs |
| [scout-report.md](./scout-report.md) | Reconnaissance findings | During Scout phase of SDD/TAC |
| [task-breakdown.md](./task-breakdown.md) | Breaking down large tasks | For complex feature work |

---

## How Agents Should Use These

1. **Creating new spec folder**: Use README-template.md + ROADMAP-template.md
2. **Writing feature spec**: Use feature-spec.md
3. **Planning implementation**: Use implementation-plan.md
4. **Doing reconnaissance**: Use scout-report.md
5. **Breaking down tasks**: Use task-breakdown.md

---

## Template Maintenance

Update templates when:
- New requirements are discovered
- Better patterns are found
- Validation rules change
- Team feedback suggests improvements

Always update this README.md when adding new templates.
