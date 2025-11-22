# Feature Specification Template

```yaml
---
version: 1.0
status: planned | in-progress | implemented | deprecated
last_updated: YYYY-MM-DD
author: team
recommended_model:
  scout: claude-haiku-4
  plan: claude-sonnet-4
  build: claude-sonnet-4
---
```

# Feature: [Feature Name]

## Purpose
[One sentence: what problem does this solve?]

## Workflow
When implementing this feature, follow these sequential steps:

1. **Scout**: Identify files related to [domain area]
   - Search for existing patterns in [reference files]
   - Document findings in `docs/specs/workflows/[feature]/scout.md`

2. **Review**: Read existing implementations
   - Check Reference Implementations in always-on.md
   - Review related specs in functional/ and technical/

3. **Plan**: Design the implementation approach
   - Create plan in `docs/specs/workflows/[feature]/plan.md`
   - Identify dependencies and risks

4. **Build**: Implement following established patterns
   - Use parameterized queries for all DB operations
   - Follow error handling patterns
   - Add input validation

5. **Test**: Verify acceptance criteria
   - Unit tests for new functions
   - E2E test in `tests/e2e/[module].spec.ts`

6. **Document**: Update relevant documentation
   - Update this spec with implementation links
   - Add any new patterns to context layers

## User Stories
- As a [role], I want [capability] so that [benefit]

## Requirements

### Functional
- [Specific capability 1]
- [Specific capability 2]

### Non-Functional
- Performance: [metrics]
- Security: [requirements]
- Accessibility: [standards]

## API Endpoints
- `METHOD /path` - Description

## Database Changes
- [Schema changes if any]

## Success Criteria
- [Measurable outcome 1]
- [Measurable outcome 2]

## Out of Scope
- [Explicitly excluded items]

## Report
Upon completion, provide:
- **Changes Summary**: Files modified/added with line counts
- **Test Results**: Coverage %, all tests passing
- **Spec Compliance**: Each requirement marked as implemented
- **Known Limitations**: Any caveats or follow-up items
- **Implementation Links**: Update YAML metadata with file paths

## Acceptance Criteria
- [ ] All functional requirements implemented
- [ ] Tests passing with adequate coverage
- [ ] No security vulnerabilities introduced
- [ ] Documentation updated
- [ ] Code reviewed
