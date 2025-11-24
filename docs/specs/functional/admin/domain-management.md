---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Domain Management

## Purpose
Manage the hierarchical domain taxonomy for alumni categorization.

## User Flow
1. Admin accesses domain management panel
2. Admin views current domain tree
3. Admin adds/edits/deletes domains and sub-domains
4. System validates hierarchy
5. Changes reflected in user profile options

## Acceptance Criteria
- ✅ View domain hierarchy
- ✅ Add new domains and sub-domains
- ✅ Edit domain names and descriptions
- ✅ Delete unused domains
- ✅ Reorder domains
- ✅ View domain usage statistics
- ✅ Merge duplicate domains

## Implementation
- **Route**: `GET /api/domains`, `POST /api/domains`, `PUT /api/domains/:id`, `DELETE /api/domains/:id`
- **File**: `routes/domains.js` (397 lines)
- **Table**: `domains`
- **Frontend**: `src/components/admin/DomainManagement.tsx`
- **Test**: Pending

## Related
- [Directory: Domain Taxonomy](../directory/domain-taxonomy.md)
