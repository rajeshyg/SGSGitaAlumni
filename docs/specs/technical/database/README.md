---
title: Database Technical Specifications
version: 1.0
status: in-progress
last_updated: 2025-11-23
---

# Database Technical Specifications

## Overview

The SGS Gita Alumni application uses MySQL as the primary database. This folder contains detailed specifications for database architecture, schema design, and optimization strategies.

## Database Architecture

- **Database Engine**: MySQL 8.0+
- **Connection Library**: mysql2/promise (Node.js)
- **Connection Pattern**: Connection pooling with lazy initialization

## Connection Configuration

```javascript
{
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  connectionLimit: 20,
  connectTimeout: 60000
}
```

## Documentation Structure

| File | Description | Status |
|------|-------------|--------|
| [schema-design.md](./schema-design.md) | Core schema patterns, conventions, data types | Implemented |
| [user-management.md](./user-management.md) | User and family member tables | Implemented |
| [content-management.md](./content-management.md) | Postings and moderation tables | Implemented |
| [messaging.md](./messaging.md) | Chat conversations and messages | Implemented |
| [indexing.md](./indexing.md) | Index recommendations and optimization | Pending |
| [connection-management.md](./connection-management.md) | Pool configuration and patterns | Implemented |

## Feature-Specific Schemas

For detailed schema documentation of specific features, see:
- `docs/specs/functional/[feature-name]/db-schema.md` - Feature-specific database schemas

**Template**: Use `docs/specs/functional/_TEMPLATE_db-schema.md` to create new feature schemas

## Quick Links

- **Main Database Utility**: `/utils/database.js`
- **Environment Config**: `.env` (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT)

## Related Documentation

- [API Routes Documentation](/docs/specs/technical/api/)
- [Security Specifications](/docs/specs/technical/security/)
