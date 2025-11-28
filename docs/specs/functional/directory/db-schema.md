---
title: Database Schema - Directory
version: 1.0
status: implemented
last_updated: 2025-11-27
applies_to: directory
---

# Database Schema: Directory

## Overview

Database schema for the directory module, including alumni member records, domain taxonomy, and search/filtering capabilities.

## Tables

### alumni_members

**Purpose**: Core alumni data imported from institutional records

**Schema**:
```sql
CREATE TABLE alumni_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    graduation_year INT,
    degree VARCHAR(100),
    major VARCHAR(200),
    department VARCHAR(200),
    batch_name VARCHAR(100),
    current_location VARCHAR(200),
    current_company VARCHAR(200),
    current_position VARCHAR(200),
    linkedin_url VARCHAR(500),
    profile_image_url VARCHAR(500),
    bio TEXT,
    skills JSON,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    user_id BIGINT NULL,
    birth_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE SET NULL,

    INDEX idx_student_id (student_id),
    INDEX idx_email (email),
    INDEX idx_graduation_year (graduation_year),
    INDEX idx_user_id (user_id),
    INDEX idx_is_active (is_active),
    INDEX idx_name (first_name, last_name),
    FULLTEXT INDEX ft_alumni_search (first_name, last_name, current_company, current_position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY | Auto-increment identifier |
| student_id | VARCHAR(50) | UNIQUE | Institutional student ID |
| first_name | VARCHAR(100) | NULL | First name |
| last_name | VARCHAR(100) | NULL | Last name |
| email | VARCHAR(255) | NULL | Contact email |
| graduation_year | INT | NULL | Year of graduation |
| degree | VARCHAR(100) | NULL | Degree obtained |
| user_id | BIGINT | FK, NULL | Link to app_users if registered |

---

### DOMAINS

**Purpose**: Hierarchical domain taxonomy (Primary > Secondary > Areas of Interest)

**Schema**:
```sql
CREATE TABLE DOMAINS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color_code VARCHAR(20),
    domain_level ENUM('primary', 'secondary', 'area_of_interest') NOT NULL,
    parent_domain_id CHAR(36),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (parent_domain_id) REFERENCES DOMAINS(id) ON DELETE CASCADE,

    INDEX idx_parent_domain (parent_domain_id),
    INDEX idx_domain_level (domain_level),
    INDEX idx_is_active (is_active),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PRIMARY KEY | UUID identifier |
| name | VARCHAR(100) | NOT NULL | Domain name |
| description | TEXT | NULL | Domain description |
| icon | VARCHAR(50) | NULL | Icon identifier |
| color_code | VARCHAR(20) | NULL | Display color |
| domain_level | ENUM | NOT NULL | primary, secondary, area_of_interest |
| parent_domain_id | CHAR(36) | FK, NULL | Parent domain reference |

---

### USER_DOMAINS

**Purpose**: Junction table linking users to their domains of interest

**Schema**:
```sql
CREATE TABLE USER_DOMAINS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id BIGINT NOT NULL,
    domain_id CHAR(36) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    expertise_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    FOREIGN KEY (domain_id) REFERENCES DOMAINS(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_domain (user_id, domain_id),

    INDEX idx_user_id (user_id),
    INDEX idx_domain_id (domain_id),
    INDEX idx_is_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### raw_csv_uploads

**Purpose**: Raw data from CSV imports for alumni records

**Schema**:
```sql
CREATE TABLE raw_csv_uploads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    upload_batch_id VARCHAR(50) NOT NULL,
    ROW_DATA JSON NOT NULL,
    is_processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_upload_batch (upload_batch_id),
    INDEX idx_is_processed (is_processed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### ALUMNI_CONNECTIONS

**Purpose**: Connections between alumni members

**Schema**:
```sql
CREATE TABLE ALUMNI_CONNECTIONS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    requester_id BIGINT NOT NULL,
    recipient_id BIGINT NOT NULL,
    status ENUM('pending', 'accepted', 'rejected', 'blocked') DEFAULT 'pending',
    connection_type VARCHAR(50) DEFAULT 'professional',
    message TEXT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (requester_id) REFERENCES app_users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES app_users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_connection (requester_id, recipient_id),

    INDEX idx_requester (requester_id),
    INDEX idx_recipient (recipient_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Table Relationships

```
alumni_members (1) ---- (1) app_users (optional link)
app_users (N) >----< (N) DOMAINS (via USER_DOMAINS)
DOMAINS (1) ----< (N) DOMAINS (parent-child hierarchy)
app_users (N) >----< (N) app_users (via ALUMNI_CONNECTIONS)
```

## ENUM Types

### domain_level
```sql
ENUM('primary', 'secondary', 'area_of_interest')
```

### expertise_level
```sql
ENUM('beginner', 'intermediate', 'advanced', 'expert')
```

### connection_status
```sql
ENUM('pending', 'accepted', 'rejected', 'blocked')
```

---

## Domain Hierarchy Example

```
Technology (primary)
├── Software Development (secondary)
│   ├── Web Development (area_of_interest)
│   ├── Mobile Development (area_of_interest)
│   └── DevOps (area_of_interest)
├── Data Science (secondary)
│   ├── Machine Learning (area_of_interest)
│   └── Data Analytics (area_of_interest)
└── Cybersecurity (secondary)

Healthcare (primary)
├── Clinical Practice (secondary)
└── Healthcare Administration (secondary)
```

---

## Common Query Patterns

### Search Alumni Directory
```sql
SELECT am.*, 
       u.is_active as has_account,
       MATCH(first_name, last_name, current_company, current_position) 
         AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
FROM alumni_members am
LEFT JOIN app_users u ON am.user_id = u.id
WHERE MATCH(first_name, last_name, current_company, current_position) 
      AGAINST(? IN NATURAL LANGUAGE MODE)
  AND am.is_active = TRUE
ORDER BY relevance DESC
LIMIT ? OFFSET ?;
```

### Get Domain Hierarchy
```sql
WITH RECURSIVE domain_tree AS (
    SELECT id, name, domain_level, parent_domain_id, 0 as depth
    FROM DOMAINS
    WHERE parent_domain_id IS NULL AND is_active = TRUE
    
    UNION ALL
    
    SELECT d.id, d.name, d.domain_level, d.parent_domain_id, dt.depth + 1
    FROM DOMAINS d
    JOIN domain_tree dt ON d.parent_domain_id = dt.id
    WHERE d.is_active = TRUE
)
SELECT * FROM domain_tree ORDER BY depth, name;
```

### Get User's Domains
```sql
SELECT d.*, ud.is_primary, ud.expertise_level
FROM USER_DOMAINS ud
JOIN DOMAINS d ON ud.domain_id = d.id
WHERE ud.user_id = ?
ORDER BY ud.is_primary DESC, d.name;
```

### Filter Alumni by Domain
```sql
SELECT DISTINCT am.*
FROM alumni_members am
JOIN app_users u ON am.user_id = u.id
JOIN USER_DOMAINS ud ON u.id = ud.user_id
WHERE ud.domain_id = ?
  AND am.is_active = TRUE
ORDER BY am.last_name, am.first_name;
```

---

## Migration Notes

### Version 1.0 (Initial)
- Created alumni_members from institutional data
- Created DOMAINS with hierarchical structure
- Created USER_DOMAINS junction table
- Added full-text search indexes

### Data Import
- Alumni data imported from CSV via raw_csv_uploads
- Data cleansing and normalization during import
- User accounts linked post-registration

---

## Related

- Technical Spec: `docs/specs/technical/database/schema-design.md`
- Functional Spec: `docs/specs/functional/directory/README.md`
- API Routes: `routes/alumni.js`, `routes/domains.js`
- Service Layer: `server/services/AlumniService.js`
