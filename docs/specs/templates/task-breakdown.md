# Task Breakdown Template

# Tasks: [Feature Name]

## Workflow Context
These tasks follow from `docs/specs/plans/[feature]-plan.md`.
Each task should be completable in one AI session.

---

## Task 1: [Descriptive Name]
**Status**: Not Started | In Progress | Complete
**Depends On**: [Task IDs or "None"]
**Complexity**: Low | Medium | High
**Recommended Model**: Haiku | Sonnet | Opus

### Purpose
[One sentence: what does this task accomplish?]

### Context
Files to review before starting:
- `path/to/file.ts` - [Why this file is relevant]
- `docs/specs/context/layer-*.md` - [Which context layer to load]

### Workflow
1. **Read**: Review the context files listed above
2. **Check**: Verify no existing implementation (avoid duplicates)
3. **Implement**: Make the specific changes below
4. **Test**: Verify acceptance criteria
5. **Document**: Update any affected documentation

### Implementation Details
- [Specific change 1]
- [Specific change 2]

### Acceptance Criteria
- [ ] [Verifiable criterion 1]
- [ ] [Verifiable criterion 2]

### Testing Requirements
- [ ] [Test case 1]
- [ ] [Test case 2]

### Report
Upon completion:
- Files changed: [list]
- Tests added/modified: [list]
- Issues encountered: [list or "None"]

---

## Task 2: [Next Task]
**Status**: Not Started | In Progress | Complete
**Depends On**: Task 1
**Complexity**: Low | Medium | High
**Recommended Model**: Sonnet

### Purpose
[One sentence]

### Context
- [Files to review]

### Workflow
1. Read → 2. Check → 3. Implement → 4. Test → 5. Document

### Implementation Details
- [Changes]

### Acceptance Criteria
- [ ] [Criteria]

### Testing Requirements
- [ ] [Tests]

### Report
Upon completion: [summary]

---

## Summary Checklist
- [ ] All tasks completed
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Plan marked as complete
- [ ] Spec status updated to "implemented"
