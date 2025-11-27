---
title: Database Schema - [Feature Name]
version: 1.0
status: template
last_updated: YYYY-MM-DD
applies_to: [feature-name]
---

# Database Schema: [Feature Name]

## Overview

Database schema for the [feature-name] module, including table definitions, relationships, and indexes.

## Tables

### [TABLE_NAME_1]

**Purpose**: [Brief description of what this table stores]

**Schema**:
```sql
CREATE TABLE [TABLE_NAME_1] (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  [column_name] [DATA_TYPE] [CONSTRAINTS],
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_[column_name] ([column_name])
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PRIMARY KEY | Unique identifier (UUID) |
| [column_name] | [TYPE] | [CONSTRAINTS] | [Description] |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |

**Indexes**:
- `PRIMARY`: id
- `idx_[column_name]`: [column_name] - [Purpose of index]

---

### [TABLE_NAME_2]

**Purpose**: [Brief description]

**Schema**:
```sql
CREATE TABLE [TABLE_NAME_2] (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  [foreign_key_id] CHAR(36) NOT NULL,
  [column_name] [DATA_TYPE] [CONSTRAINTS],
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (foreign_key_id) REFERENCES [TABLE_NAME_1](id) ON DELETE CASCADE,
  INDEX idx_[foreign_key] ([foreign_key_id])
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PRIMARY KEY | Unique identifier (UUID) |
| [foreign_key_id] | CHAR(36) | NOT NULL, FK | Reference to [TABLE_NAME_1] |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last update timestamp |

**Indexes**:
- `PRIMARY`: id
- `idx_[foreign_key]`: [foreign_key_id] - Foreign key index for joins

**Relationships**:
- `[TABLE_NAME_1]` (1) ----< (N) `[TABLE_NAME_2]`

---

## Table Relationships

```
[TABLE_NAME_1] (1) ----< (N) [TABLE_NAME_2]
[TABLE_NAME_1] (N) >----< (N) [TABLE_NAME_3] (via [JOIN_TABLE])
```

## ENUM Types

### [ENUM_NAME]
```sql
ENUM('[value1]', '[value2]', '[value3]')
```

**Usage**: [Description of when/where this ENUM is used]

---

## Common Query Patterns

### Get [Entity] by ID
```sql
SELECT * FROM [TABLE_NAME_1] WHERE id = ?;
```

### Get [Entities] with Related Data
```sql
SELECT
  t1.*,
  t2.[column_name]
FROM [TABLE_NAME_1] t1
LEFT JOIN [TABLE_NAME_2] t2 ON t1.id = t2.[foreign_key_id]
WHERE t1.[condition_column] = ?;
```

### Insert New [Entity]
```sql
INSERT INTO [TABLE_NAME_1] ([column1], [column2], [column3])
VALUES (?, ?, ?);
```

### Update [Entity]
```sql
UPDATE [TABLE_NAME_1]
SET [column_name] = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
```

### Delete [Entity]
```sql
DELETE FROM [TABLE_NAME_1] WHERE id = ?;
-- Note: Related records in [TABLE_NAME_2] will cascade delete
```

---

## Indexes and Performance

### Primary Indexes
- All tables use UUID (CHAR(36)) for primary keys
- Provides security and distributed ID generation

### Foreign Key Indexes
- All foreign keys have corresponding indexes
- Optimizes JOIN operations

### Custom Indexes
| Table | Index Name | Columns | Purpose |
|-------|------------|---------|---------|
| [TABLE_NAME_1] | idx_[column] | [column] | [Purpose - e.g., "Optimize searches by status"] |
| [TABLE_NAME_2] | idx_[column] | [column] | [Purpose] |

---

## Migration Notes

### Version 1.0 (Initial)
- Created [TABLE_NAME_1] with base schema
- Created [TABLE_NAME_2] with relationship to [TABLE_NAME_1]
- Added indexes for common query patterns

---

## Related Documentation

- Technical Spec: `docs/specs/technical/database/README.md`
- Functional Spec: `docs/specs/functional/[feature-name]/README.md`
- API Routes: `routes/[feature-name].js`
- Service Layer: `server/services/[FeatureName]Service.js`

---

## Usage Instructions

**For AI Agents**:
1. Copy this template to `docs/specs/functional/[your-feature]/db-schema.md`
2. Replace all `[placeholders]` with actual values:
   - `[Feature Name]` → Your feature name (e.g., "User Management", "Messaging")
   - `[feature-name]` → Lowercase with hyphens (e.g., "user-management", "messaging")
   - `[TABLE_NAME]` → Actual table name (e.g., "USERS", "MESSAGES")
   - `[column_name]` → Actual column names
   - `[DATA_TYPE]` → MySQL data types (CHAR, VARCHAR, INT, JSON, etc.)
3. Update the schema to match your actual database structure
4. Reference this file in technical specs and prime commands
