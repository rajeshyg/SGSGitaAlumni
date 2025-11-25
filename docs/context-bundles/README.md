# Context Bundles - Session Continuity Pattern

> **Purpose**: Preserve session state across conversation breaks with 60-70% context restoration at <10% token cost.

---

## What Are Context Bundles?

**Problem**: When a Claude Code session ends, all conversation context is lost. Restarting requires re-explaining everything.

**Solution**: Create a structured summary ("context bundle") that captures essential state. Next session, load the bundle to restore ~70% of working context.

## Token Economics

| Approach | Tokens | Restoration |
|----------|--------|-------------|
| Full conversation replay | 10,000+ | 100% (expensive) |
| Context bundle | 1,000-1,500 | 60-70% (efficient) |
| No bundle (start fresh) | 0 | 0% (restart from scratch) |

**Savings**: 90% token reduction while maintaining majority of context.

---

## When to Create a Context Bundle

**Create at session end when**:
- Work spans multiple days
- Implementation is complex (10+ files)
- Architectural decisions were made
- There are blockers or next steps

**Don't create for**:
- Completed simple features (1-2 files)
- Quick bug fixes
- Exploratory tasks with no follow-up

---

## Context Bundle Template

Save as: `docs/context-bundles/[YYYY-MM-DD]-[feature-name].md`

```markdown
# Context Bundle: [Feature Name]

**Date**: [YYYY-MM-DD]
**Session Duration**: [e.g., 2 hours]
**Status**: [in-progress | blocked | ready-for-review]

---

## What Was Accomplished

- [ ] Completed item 1 (with file references)
- [ ] Completed item 2
- [ ] Partially done: Item 3 (what's left)

**Key Files Modified**:
- `path/to/file1.ts:123-456` - Added feature X
- `path/to/file2.tsx:78-90` - Integrated component Y
- `path/to/file3.js:200-250` - Refactored logic Z

---

## Architectural Decisions Made

### Decision 1: [Title]
**Context**: [Why this decision was needed]
**Chosen Approach**: [What was decided]
**Rationale**: [Why this approach was chosen]
**Alternatives Considered**: [What else was discussed]

### Decision 2: [Title]
[Same structure]

---

## Next Steps

Priority order for next session:

1. [ ] **[Task 1]** - Description (affects: files X, Y, Z)
2. [ ] **[Task 2]** - Description
3. [ ] **[Task 3]** - Description

---

## Current Blockers

### Blocker 1: [Title]
**Issue**: [What's blocking progress]
**Context**: [Why this is blocking]
**Needs**: [What's needed to unblock]
**Options**: [Potential solutions]

### Blocker 2: [Title]
[Same structure]

---

## Code References (Key Locations)

**Feature Implementation**:
- Main logic: `src/services/FeatureService.js:150-200`
- API endpoint: `routes/feature.js:45-78`
- UI component: `src/components/FeatureView.tsx:30-120`
- Tests: `tests/e2e/feature.spec.ts:25-80`

**Integration Points**:
- Connects to: `services/ExistingService.js:90`
- Uses database: `server/config/database.js` (connection pool)
- Auth check: `middleware/auth.js:verifyToken()`

---

## Session Notes

**Patterns Followed**:
- Used existing auth pattern from `/prime-auth`
- Followed API response format: `{ success, data?, error? }`
- Database queries all parameterized

**Deviations** (if any):
- [None OR explain any deviations from specs/patterns]

**Dependencies Added**:
- [List any new npm packages installed]

**Open Questions**:
- Question 1?
- Question 2?

---

**Next Session Instructions**:
Load this bundle first: "Read context bundle from [YYYY-MM-DD] to restore session context"
