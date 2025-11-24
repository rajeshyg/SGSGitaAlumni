---
version: "1.0"
status: implemented
last_updated: 2025-11-23
module: directory
---

# Directory Module

Alumni search and discovery with domain taxonomy organization.

## Sub-Features

| Feature | Status | E2E Test | Implementation |
|---------|--------|----------|----------------|
| [Alumni Search](./alumni-search.md) | Implemented | `tests/e2e/dashboard.spec.ts` | `routes/alumni.js` |
| [Filtering & Sorting](./filtering-sorting.md) | Implemented | `tests/e2e/dashboard.spec.ts` | `routes/alumni.js` |
| [Domain Taxonomy](./domain-taxonomy.md) | Implemented | Pending | `routes/domains.js` |

## Technical Reference

See [Technical Specs: Database/Content Management](../../technical/database/content-management.md) for data organization.

## Key User Flows

1. **Search Alumni**: Directory → Enter search terms → View results → Filter/sort → View profile
2. **Browse by Domain**: Directory → Select domain → View alumni in domain → Sub-domain filtering
