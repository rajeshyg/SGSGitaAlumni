-- Fix collation for USER_PREFERENCES and related tables
-- Previous attempts fixed the table default but not existing columns

-- Disable foreign key checks to avoid constraints issues during conversion
SET FOREIGN_KEY_CHECKS = 0;

-- Convert USER_PREFERENCES columns to utf8mb4_0900_ai_ci
ALTER TABLE USER_PREFERENCES CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- Convert USER_NOTIFICATION_PREFERENCES just in case
ALTER TABLE USER_NOTIFICATION_PREFERENCES CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- Convert USER_PRIVACY_SETTINGS just in case
ALTER TABLE USER_PRIVACY_SETTINGS CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
