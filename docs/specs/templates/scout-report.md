# Scout Report Template

# Scout: [Feature Name] Discovery

## Date
YYYY-MM-DD

## Purpose
[What we're looking for and why]

## Recommended Model
Haiku (fast file discovery)

---

## Files Discovered

### Entry Points
- `path/to/file.ts` - [Brief description of role]
- `path/to/route.js` - [Brief description]

### Core Logic
- `path/to/service.ts` - [What it does]
- `path/to/model.ts` - [Data structures]

### Related Components
- `path/to/component.tsx` - [UI element]
- `path/to/util.ts` - [Helper functions]

### Configuration
- `path/to/config.ts` - [Settings]

### Tests
- `tests/unit/[x].test.ts` - Unit tests
- `tests/e2e/[x].spec.ts` - E2E tests

---

## Patterns Identified

### Code Patterns
- [Pattern name]: Found in `file.ts:line` - [Description]
- [Pattern name]: Found in `file.ts:line` - [Description]

### Anti-Patterns to Avoid
- [What NOT to do]: Example in `file.ts:line`

---

## Dependencies

### Internal
- Relies on: [Other features/modules]
- Used by: [Features that depend on this]

### External
- Libraries: [npm packages used]
- APIs: [External services]

---

## Existing Implementations
**IMPORTANT: Reuse these, do not duplicate**

- [Component/Pattern]: `path/to/canonical/implementation.ts`
- [Component/Pattern]: `path/to/canonical/implementation.ts`

---

## Recommendations

### Approach
[Suggested implementation approach based on findings]

### Risks
- [Potential issue 1]
- [Potential issue 2]

### Questions for Clarification
- [Question about ambiguous requirement]

---

## Next Steps
1. Create implementation plan based on this discovery
2. Load relevant context layers: `layer-[x].md`
3. Review Reference Implementations before building
