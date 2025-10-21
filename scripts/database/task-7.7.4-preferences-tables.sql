-- ============================================================================
-- Task 7.7.4: Preferences UI Enhancement - Database Tables
-- ============================================================================
-- Creates USER_NOTIFICATION_PREFERENCES and USER_PRIVACY_SETTINGS tables
-- for enhanced user preference management
-- ============================================================================

-- ============================================================================
-- USER_NOTIFICATION_PREFERENCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS USER_NOTIFICATION_PREFERENCES (
  user_id VARCHAR(36) PRIMARY KEY,
  email_notifications BOOLEAN DEFAULT TRUE,
  email_frequency ENUM('instant', 'daily', 'weekly') DEFAULT 'daily',
  posting_updates BOOLEAN DEFAULT TRUE,
  connection_requests BOOLEAN DEFAULT TRUE,
  event_reminders BOOLEAN DEFAULT TRUE,
  weekly_digest BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
  INDEX idx_user_notifications (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- USER_PRIVACY_SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS USER_PRIVACY_SETTINGS (
  user_id VARCHAR(36) PRIMARY KEY,
  profile_visibility ENUM('public', 'alumni_only', 'connections_only', 'private') DEFAULT 'alumni_only',
  show_email BOOLEAN DEFAULT FALSE,
  show_phone BOOLEAN DEFAULT FALSE,
  show_location BOOLEAN DEFAULT TRUE,
  searchable_by_name BOOLEAN DEFAULT TRUE,
  searchable_by_email BOOLEAN DEFAULT FALSE,
  allow_messaging ENUM('everyone', 'alumni_only', 'connections_only') DEFAULT 'alumni_only',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
  INDEX idx_user_privacy (user_id),
  INDEX idx_profile_visibility (profile_visibility),
  INDEX idx_searchable (searchable_by_name, searchable_by_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DEFAULT DATA INSERTION TRIGGER
-- ============================================================================
-- Automatically create default notification preferences when a new user is created
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS create_default_notification_preferences
AFTER INSERT ON app_users
FOR EACH ROW
BEGIN
  INSERT IGNORE INTO USER_NOTIFICATION_PREFERENCES (user_id)
  VALUES (NEW.id);
END$$

-- Automatically create default privacy settings when a new user is created
CREATE TRIGGER IF NOT EXISTS create_default_privacy_settings
AFTER INSERT ON app_users
FOR EACH ROW
BEGIN
  INSERT IGNORE INTO USER_PRIVACY_SETTINGS (user_id)
  VALUES (NEW.id);
END$$

DELIMITER ;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
-- Additional indexes for common query patterns
CREATE INDEX idx_email_frequency ON USER_NOTIFICATION_PREFERENCES(email_frequency);
CREATE INDEX idx_push_enabled ON USER_NOTIFICATION_PREFERENCES(push_notifications);

-- ============================================================================
-- SAMPLE DATA FOR TESTING (Optional - Comment out for production)
-- ============================================================================
-- Insert default preferences for existing users
-- INSERT IGNORE INTO USER_NOTIFICATION_PREFERENCES (user_id)
-- SELECT id FROM app_users WHERE id NOT IN (SELECT user_id FROM USER_NOTIFICATION_PREFERENCES);

-- INSERT IGNORE INTO USER_PRIVACY_SETTINGS (user_id)
-- SELECT id FROM app_users WHERE id NOT IN (SELECT user_id FROM USER_PRIVACY_SETTINGS);

