---
version: "1.0"
status: implemented
last_updated: 2025-11-23
module: admin
---

# Admin Module

Administrative tools for platform management and oversight.

## Sub-Features

| Feature | Status | E2E Test | Implementation |
|---------|--------|----------|----------------|
| [User Management](./user-management.md) | Implemented | Pending | `routes/users.js`, Admin routes |
| [Invitation Management](./invitation-management.md) | Implemented | Pending | `routes/invitations.js` |
| [Analytics](./analytics.md) | Implemented | Pending | `routes/analytics.js` |
| [Domain Management](./domain-management.md) | Implemented | Pending | `routes/domains.js` |
| [Moderation Oversight](./moderation-oversight.md) | Implemented | Pending | Moderation admin panel |
| [System Monitoring](./system-monitoring.md) | Implemented | Pending | `src/components/admin/StatusDashboard.tsx` |

## Technical Reference

See [Technical Specs: Deployment/Monitoring](../../technical/deployment/monitoring.md) for infrastructure monitoring.

## Key User Flows

1. **Admin Dashboard**: Login as admin → Admin panel → View metrics → Manage resources
