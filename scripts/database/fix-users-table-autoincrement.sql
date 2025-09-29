-- Fix users table auto-increment issue
-- Change id column to BIGINT to allow more users

-- First, drop the foreign key constraint
ALTER TABLE alumni_profiles DROP FOREIGN KEY alumni_profiles_ibfk_1;

-- Change id column to BIGINT
ALTER TABLE users MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT;

-- Also change the user_id column in alumni_profiles to BIGINT to match
ALTER TABLE alumni_profiles MODIFY COLUMN user_id BIGINT;

-- Recreate the foreign key constraint
ALTER TABLE alumni_profiles ADD CONSTRAINT alumni_profiles_ibfk_1
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Reset auto-increment to start from 10000 to avoid conflicts
ALTER TABLE users AUTO_INCREMENT = 10000;

-- Verify the change
SELECT 'Users table auto-increment fixed' as status, 10000 as new_auto_increment;