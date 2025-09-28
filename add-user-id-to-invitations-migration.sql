-- Migration: Update USER_INVITATIONS table for user-based invitations
-- This migration adds support for linking invitations to existing user accounts

-- Note: Foreign key constraint cannot be added due to type mismatch (users.id is INT, USER_INVITATIONS.user_id is CHAR(36))
-- The relationship will be maintained through application logic

-- Note: Index already exists, skipping creation

-- Update existing invitations to populate user_id where possible
-- This will link existing invitations to users with matching emails
-- Note: Converting INT to CHAR(36) for compatibility
UPDATE USER_INVITATIONS ui
INNER JOIN users u ON ui.email = u.email AND u.is_active = true
SET ui.user_id = CAST(u.id AS CHAR(36))
WHERE ui.user_id IS NULL;

-- Note: invitation_type enum update to include 'profile_completion' will be handled in application logic
-- Current enum values: 'alumni', 'family_member', 'admin'
-- New value 'profile_completion' will be supported in code

COMMIT;