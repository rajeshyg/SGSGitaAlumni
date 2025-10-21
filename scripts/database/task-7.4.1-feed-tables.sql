-- ============================================================================
-- Task 7.4.1: Dashboard Feed Integration - Database Tables
-- ============================================================================
-- Creates ACTIVITY_FEED and FEED_ENGAGEMENT tables for activity stream
-- and user engagement tracking
-- ============================================================================

-- ============================================================================
-- ACTIVITY_FEED TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ACTIVITY_FEED (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  item_type ENUM('posting', 'event', 'connection', 'achievement') NOT NULL,
  item_id VARCHAR(36) NOT NULL,
  title VARCHAR(255),
  content TEXT,
  author_id VARCHAR(36),
  author_name VARCHAR(255),
  author_avatar VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_feed (user_id, created_at DESC),
  INDEX idx_type_feed (item_type, created_at DESC),
  INDEX idx_author_feed (author_id, created_at DESC),
  INDEX idx_item_lookup (item_type, item_id),
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES app_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- FEED_ENGAGEMENT TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS FEED_ENGAGEMENT (
  id VARCHAR(36) PRIMARY KEY,
  feed_item_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  engagement_type ENUM('like', 'comment', 'share') NOT NULL,
  comment_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_item_like (feed_item_id, user_id, engagement_type),
  INDEX idx_feed_engagement (feed_item_id, engagement_type),
  INDEX idx_user_engagement (user_id, created_at DESC),
  FOREIGN KEY (feed_item_id) REFERENCES ACTIVITY_FEED(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- FEED_ENGAGEMENT_COUNTS VIEW (for performance)
-- ============================================================================
CREATE OR REPLACE VIEW FEED_ENGAGEMENT_COUNTS AS
SELECT 
  feed_item_id,
  SUM(CASE WHEN engagement_type = 'like' THEN 1 ELSE 0 END) as like_count,
  SUM(CASE WHEN engagement_type = 'comment' THEN 1 ELSE 0 END) as comment_count,
  SUM(CASE WHEN engagement_type = 'share' THEN 1 ELSE 0 END) as share_count
FROM FEED_ENGAGEMENT
GROUP BY feed_item_id;

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================
-- Note: This will be populated by the application when users create postings,
-- events, connections, etc. The feed is dynamically generated based on user activity.

