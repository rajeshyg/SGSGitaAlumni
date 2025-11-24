---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Filtering & Sorting

## Purpose
Allow users to refine search results with filters and sort options.

## User Flow
1. User performs search
2. User applies filters (batch, location, domain, etc.)
3. User selects sort order (name, batch, recent activity)
4. Results update dynamically

## Acceptance Criteria
- ✅ Filter by: batch year, location, domain, sub-domain
- ✅ Multi-select filters
- ✅ Sort by: name (A-Z), batch (newest/oldest), recently active
- ✅ Clear filters option
- ✅ Filter count badges
- ✅ Mobile-responsive filter UI

## Implementation
- **Route**: `GET /api/alumni` (with query params)
- **File**: `routes/alumni.js`
- **Frontend**: `src/components/DirectoryFilters.tsx`
- **Test**: `tests/e2e/dashboard.spec.ts`

## Related
- [Alumni Search](./alumni-search.md)
- [Domain Taxonomy](./domain-taxonomy.md)
