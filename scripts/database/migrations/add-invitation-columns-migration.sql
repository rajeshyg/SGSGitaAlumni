-- Add missing columns to USER_INVITATIONS table
-- Migration script for security fixes

-- Add missing columns to USER_INVITATIONS table
ALTER TABLE USER_INVITATIONS
ADD COLUMN IF NOT EXISTS user_id INT NULL
  COMMENT 'Link to app_users.id after invitation acceptance',
ADD COLUMN IF NOT EXISTS alumni_member_id INT NULL
  COMMENT 'Link to alumni_members.id for pre-verified alumni data',
ADD COLUMN IF NOT EXISTS completion_status
  ENUM('pending', 'alumni_verified', 'completed') DEFAULT 'pending'
  COMMENT 'Tracks invitation completion workflow';

-- Add foreign key constraints
ALTER TABLE USER_INVITATIONS
ADD CONSTRAINT fk_user_invitations_user
  FOREIGN KEY (user_id) REFERENCES app_users(id)
  ON DELETE SET NULL,
ADD CONSTRAINT fk_user_invitations_alumni
  FOREIGN KEY (alumni_member_id) REFERENCES alumni_members(id)
  ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_invitations_user_id
  ON USER_INVITATIONS(user_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_alumni_member_id
  ON USER_INVITATIONS(alumni_member_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_completion_status
  ON USER_INVITATIONS(completion_status);

-- Verify the changes
SELECT
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'USER_INVITATIONS'
  AND COLUMN_NAME IN ('user_id', 'alumni_member_id', 'completion_status');