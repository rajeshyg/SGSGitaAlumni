---
title: Database Schema - Rating
version: 1.0
status: pending
last_updated: 2025-11-27
applies_to: rating
---

# Database Schema: Rating

## Overview

Database schema for the rating module, including user ratings, reputation scores, and feedback tracking.

**Status**: Pending implementation - schema defined for future development.

## Tables

### USER_RATINGS

**Purpose**: Stores ratings given by users to other users or content

**Schema**:
```sql
CREATE TABLE USER_RATINGS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    rater_id BIGINT NOT NULL,
    ratee_id BIGINT NOT NULL,
    rating_context ENUM('posting_response', 'mentorship', 'connection', 'general') NOT NULL,
    context_id CHAR(36) NULL,
    rating_value INT NOT NULL CHECK (rating_value BETWEEN 1 AND 5),
    feedback_text TEXT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (rater_id) REFERENCES app_users(id) ON DELETE CASCADE,
    FOREIGN KEY (ratee_id) REFERENCES app_users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_rating (rater_id, ratee_id, rating_context, context_id),

    INDEX idx_rater_id (rater_id),
    INDEX idx_ratee_id (ratee_id),
    INDEX idx_rating_context (rating_context),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PRIMARY KEY | UUID identifier |
| rater_id | BIGINT | NOT NULL, FK | User giving the rating |
| ratee_id | BIGINT | NOT NULL, FK | User receiving the rating |
| rating_context | ENUM | NOT NULL | Context of the rating |
| context_id | CHAR(36) | NULL | Related entity (posting, etc.) |
| rating_value | INT | NOT NULL, 1-5 | Rating score |
| is_anonymous | BOOLEAN | DEFAULT FALSE | Anonymous rating flag |

---

### USER_REPUTATION

**Purpose**: Aggregated reputation scores for users

**Schema**:
```sql
CREATE TABLE USER_REPUTATION (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id BIGINT NOT NULL,
    total_rating_count INT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    posting_score INT DEFAULT 0,
    response_score INT DEFAULT 0,
    connection_score INT DEFAULT 0,
    helpfulness_score INT DEFAULT 0,
    overall_reputation_score DECIMAL(5,2) DEFAULT 0.00,
    reputation_level ENUM('newcomer', 'contributor', 'helper', 'expert', 'leader') DEFAULT 'newcomer',
    last_calculated_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_reputation (user_id),

    INDEX idx_user_id (user_id),
    INDEX idx_reputation_level (reputation_level),
    INDEX idx_overall_score (overall_reputation_score DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PRIMARY KEY | UUID identifier |
| user_id | BIGINT | NOT NULL, FK | User reference |
| average_rating | DECIMAL(3,2) | DEFAULT 0.00 | Average received rating |
| overall_reputation_score | DECIMAL(5,2) | DEFAULT 0.00 | Calculated reputation |
| reputation_level | ENUM | DEFAULT 'newcomer' | Badge level |

---

### RATING_CRITERIA

**Purpose**: Configurable rating dimensions

**Schema**:
```sql
CREATE TABLE RATING_CRITERIA (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    criteria_name VARCHAR(100) NOT NULL,
    criteria_description TEXT NULL,
    rating_context VARCHAR(50) NOT NULL,
    weight DECIMAL(3,2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_rating_context (rating_context),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### REPUTATION_HISTORY

**Purpose**: Tracks reputation score changes over time

**Schema**:
```sql
CREATE TABLE REPUTATION_HISTORY (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id BIGINT NOT NULL,
    previous_score DECIMAL(5,2) NOT NULL,
    new_score DECIMAL(5,2) NOT NULL,
    change_reason VARCHAR(100) NOT NULL,
    change_source_type VARCHAR(50) NULL,
    change_source_id CHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,

    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Table Relationships

```
app_users (1) ----< (N) USER_RATINGS (as rater)
app_users (1) ----< (N) USER_RATINGS (as ratee)
app_users (1) ---- (1) USER_REPUTATION
app_users (1) ----< (N) REPUTATION_HISTORY
```

## ENUM Types

### rating_context
```sql
ENUM('posting_response', 'mentorship', 'connection', 'general')
```

### reputation_level
```sql
ENUM('newcomer', 'contributor', 'helper', 'expert', 'leader')
```

---

## Reputation Calculation

| Factor | Weight | Description |
|--------|--------|-------------|
| Ratings Received | 30% | Average of ratings from others |
| Posting Activity | 20% | Quality and quantity of postings |
| Response Helpfulness | 25% | Ratings on responses provided |
| Connection Quality | 15% | Feedback from connections |
| Platform Activity | 10% | General engagement metrics |

---

## Common Query Patterns

### Get User's Reputation
```sql
SELECT ur.*, 
       (SELECT COUNT(*) FROM USER_RATINGS WHERE ratee_id = ur.user_id) as rating_count
FROM USER_REPUTATION ur
WHERE ur.user_id = ?;
```

### Get User's Received Ratings
```sql
SELECT r.*, u.first_name as rater_name
FROM USER_RATINGS r
LEFT JOIN app_users u ON r.rater_id = u.id AND r.is_anonymous = FALSE
WHERE r.ratee_id = ?
ORDER BY r.created_at DESC;
```

### Leaderboard Query
```sql
SELECT ur.*, u.first_name, u.last_name
FROM USER_REPUTATION ur
JOIN app_users u ON ur.user_id = u.id
WHERE u.is_active = TRUE
ORDER BY ur.overall_reputation_score DESC
LIMIT 10;
```

---

## Migration Notes

### Version 1.0 (Pending)
- Create USER_RATINGS for individual ratings
- Create USER_REPUTATION for aggregated scores
- Create RATING_CRITERIA for configurable dimensions
- Create REPUTATION_HISTORY for audit trail

---

## Related

- Technical Spec: `docs/specs/technical/database/schema-design.md`
- Functional Spec: `docs/specs/functional/rating/README.md`
- API Routes: To be implemented
