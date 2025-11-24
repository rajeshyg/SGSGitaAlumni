---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Domain Taxonomy

## Purpose
Organize alumni by professional domains and expertise areas for better discovery.

## User Flow
1. Admin creates domain hierarchy (e.g., Technology → Software → Web Development)
2. Alumni select domains during profile setup
3. Users browse directory by domain
4. System displays domain statistics

## Acceptance Criteria
- ✅ Hierarchical domain structure (domain → sub-domain)
- ✅ Alumni can select multiple domains
- ✅ Browse alumni by domain
- ✅ Domain popularity metrics
- ✅ Admin can manage domain taxonomy

## Implementation
- **Route**: `GET /api/domains`, `POST /api/domains` (admin only)
- **File**: `routes/domains.js`
- **Table**: `domains`, `user_domains`
- **Frontend**: `src/components/DomainSelector.tsx`
- **Test**: Pending

## Related
- [Alumni Search](./alumni-search.md)
- [Admin: Domain Management](../admin/domain-management.md)
