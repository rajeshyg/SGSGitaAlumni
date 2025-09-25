# Backlog: Oversized Completed Documents (Phase 6)

This file lists phase-6 documentation that currently exceeds the project's size limits and has been classified as Completed. These documents are demoted to warnings in CI but should be triaged and split/archived when time permits.

## Current items (priority)

1. docs/progress/phase-6/task-6.3-cross-platform.md (1257 lines)
   - Suggested split:
     - Part A: Cross-platform overview and goals
     - Part B: Platform-specific implementation notes (Web, Mobile, Desktop)
     - Part C: Test matrix and QA checklist
   - Estimated effort: 2-4 hours
   - Suggested owner: @team-frontend

2. docs/progress/phase-6/task-6.6-compliance-validation.md (943 lines)
   - Suggested split:
     - Part A: Compliance strategy and framework
     - Part B: Phase deliverables and artifacts
     - Part C: Tooling and automation runbooks
   - Estimated effort: 3-5 hours
   - Suggested owner: @team-security

3. docs/progress/phase-6/task-6.9-accessibility-automation.md (893 lines)
   - Suggested split:
     - Part A: Accessibility automation overview
     - Part B: Integration with CI and testing tools
     - Part C: Reporting and remediation workflows
   - Estimated effort: 2-4 hours
   - Suggested owner: @team-a11y

4. (Optional) docs/ACCESSIBILITY_STANDARDS.md (685 lines) — currently under the new thresholds; consider further splitting if it grows.

## Triage suggestions
- Create individual issues (or GitHub project cards) for each item above with the suggested split and assign owners.
- For each split, ensure each new doc includes the lightweight YAML front-matter:
  ```yaml
  ---
  status: Completed
  doc-type: implementation
  ---
  ```
- Merge the split PRs as small incremental changes to keep history clear.

## Notes
- These documents are currently treated as warnings in CI and will not block PRs. The goal of this backlog is to schedule cleanup work without slowing active development.
