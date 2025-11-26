-- ============================================================================
-- EMAIL DELIVERY LOGS TABLE
-- ============================================================================
-- Table to track all email deliveries for monitoring and debugging

CREATE TABLE IF NOT EXISTS email_delivery_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email_type ENUM('invitation', 'otp', 'welcome', 'family_invitation', 'parent_consent', 'unknown') NOT NULL DEFAULT 'unknown',
  recipient_email VARCHAR(255) NOT NULL,
  template_id VARCHAR(100),
  subject VARCHAR(500) NOT NULL,
  message_id VARCHAR(255),
  status ENUM('sent', 'failed', 'pending') NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_email_type (email_type),
  INDEX idx_recipient_email (recipient_email),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  INDEX idx_message_id (message_id)
);

-- ============================================================================
-- EMAIL TEMPLATES TABLE (Optional - for dynamic template management)
-- ============================================================================
-- Note: Templates are currently managed in the application code
-- This table can be used for future dynamic template management

CREATE TABLE IF NOT EXISTS email_templates (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  html_content TEXT,
  text_content TEXT,
  variables JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================================
-- CLEANUP PROCEDURE
-- ============================================================================
-- Note: Manual cleanup query for old email logs (older than 90 days):
-- DELETE FROM email_delivery_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);