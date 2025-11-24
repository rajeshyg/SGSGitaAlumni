---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Alumni Search

## Purpose
Enable users to find and connect with alumni.

## User Flow
1. User enters search query (name, batch, location, domain)
2. System searches across multiple fields
3. Results displayed with relevance ranking
4. User clicks profile to view details

## Acceptance Criteria
- ✅ Full-text search across name, batch, location, domain
- ✅ Autocomplete suggestions
- ✅ Search history (last 5 searches)
- ✅ Pagination for large result sets
- ✅ Privacy-aware results (hidden profiles excluded)

## Implementation
- **Route**: `GET /api/alumni/search`
- **File**: `routes/alumni.js`
- **Frontend**: `src/pages/Directory.tsx`, `src/components/AlumniSearch.tsx`
- **Test**: `tests/e2e/dashboard.spec.ts`

## Related
- [Filtering & Sorting](./filtering-sorting.md)
