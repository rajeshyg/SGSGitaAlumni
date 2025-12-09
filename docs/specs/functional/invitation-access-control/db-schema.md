---
version: "1.0"
status: active
last_updated: 2025-12-07
---

# Invitation & Access Control: Database Schema

## Overview

This feature uses the `USER_INVITATIONS` table with minimal schema focused on invitation system only.

## Table: USER_INVITATIONS

**Purpose**: Store invitation records with secure tokens and lifecycle status.

### Columns

| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `id` | CHAR(36) | No | Unique invitation ID (UUID) |
| `email` | VARCHAR(255) | No | Email address being invited |
| `invitation_token` | VARCHAR(500) | No | HMAC JWT token for validation |
| `status` | ENUM | No | pending, accepted, expired, revoked |
| `created_by` | CHAR(36) | Yes | Admin user_id who sent invitation |
| `created_at` | TIMESTAMP | No | When invitation was created |
| `expires_at` | TIMESTAMP | No | When invitation expires |
| `accepted_by` | CHAR(36) | Yes | User who accepted (user_id) |
| `accepted_at` | TIMESTAMP | Yes | When user accepted |
| `revoked_by` | CHAR(36) | Yes | Admin who revoked |
| `revoked_at` | TIMESTAMP | Yes | When revocation occurred |
| `revoked_reason` | VARCHAR(500) | Yes | Why it was revoked |

### Indexes

| Index | Columns | Purpose |
|-------|---------|---------|
| `PRIMARY KEY` | id | Fast lookups by invitation ID |
| `UNIQUE` | invitation_token | Ensure token uniqueness |
| `idx_status` | status | Filter by status (admin dashboard) |
| `idx_email` | email | Lookup by email |
| `idx_expires_at` | expires_at | Find expiring-soon invitations |
| `idx_created_by` | created_by | Track who sent invitations |

## Key Design Decisions

1. **Token Storage**: Full JWT token stored for audit trail
2. **Status Field**: ENUM prevents invalid states
3. **No Background Cleanup**: Expiry checked at validation time
4. **FK Constraints**: Links to future accounts table

## Storage Rationale

- **invitation_token**: HMAC JWT format enables offline validation of signature
- **status**: ENUM enforces valid state transitions
- **Timestamps**: created_at, expires_at, accepted_at, revoked_at track lifecycle
- **User References**: created_by, accepted_by, revoked_by maintain audit trail

## Related

- [Invitation Generation](./invitation-generation.md)
- [Invitation Acceptance](./invitation-acceptance.md)
- [Invitation Tracking](./invitation-tracking.md)
- [Invitation Expiry](./invitation-expiry.md)
