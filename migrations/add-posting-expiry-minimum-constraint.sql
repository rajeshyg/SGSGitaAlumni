-- Migration: Add 30-day minimum constraint and calculation logic for posting expiry
-- Task: 7.7.9 - Posting Expiry Logic Fix
-- Date: November 11, 2025
-- 
-- Business Rule: All postings must remain active for at least 30 days from creation
-- Formula: expires_at = MAX(user_provided_date, created_at + 30 days)

-- Step 1: Add a CHECK constraint to enforce 30-day minimum
-- Note: MySQL CHECK constraints are supported in MySQL 8.0.16+
ALTER TABLE POSTINGS
ADD CONSTRAINT check_expiry_minimum_30_days
CHECK (expires_at >= DATE_ADD(created_at, INTERVAL 30 DAY));

-- Step 2: Create a stored function to calculate the correct expiry date
DELIMITER $$

CREATE FUNCTION calculate_expiry_date(
  p_user_date DATETIME,
  p_created_at DATETIME
) 
RETURNS DATETIME
DETERMINISTIC
NO SQL
COMMENT 'Calculate posting expiry date with 30-day minimum enforcement'
BEGIN
  DECLARE v_minimum_date DATETIME;
  DECLARE v_final_date DATETIME;
  
  -- Calculate minimum date (30 days from creation)
  SET v_minimum_date = DATE_ADD(p_created_at, INTERVAL 30 DAY);
  
  -- If user provided a date, use the GREATER of user date or minimum
  IF p_user_date IS NOT NULL THEN
    SET v_final_date = GREATEST(p_user_date, v_minimum_date);
  ELSE
    -- Default to 30-day minimum
    SET v_final_date = v_minimum_date;
  END IF;
  
  RETURN v_final_date;
END$$

DELIMITER ;

-- Step 3: Create a trigger to automatically calculate expiry_date on INSERT/UPDATE
DELIMITER $$

CREATE TRIGGER posting_expiry_before_insert
BEFORE INSERT ON POSTINGS
FOR EACH ROW
BEGIN
  -- Automatically calculate expires_at using the business logic
  SET NEW.expires_at = calculate_expiry_date(NEW.expires_at, NEW.created_at);
END$$

CREATE TRIGGER posting_expiry_before_update
BEFORE UPDATE ON POSTINGS
FOR EACH ROW
BEGIN
  -- On update, use the ORIGINAL created_at (OLD.created_at), not the new one
  -- This ensures the 30-day minimum is always calculated from initial submission
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at != OLD.expires_at THEN
    SET NEW.expires_at = calculate_expiry_date(NEW.expires_at, OLD.created_at);
  END IF;
END$$

DELIMITER ;

-- Step 4: Update existing postings to comply with new rule
-- This is a one-time data fix for postings that expire before the 30-day minimum
UPDATE POSTINGS
SET expires_at = DATE_ADD(created_at, INTERVAL 30 DAY)
WHERE expires_at < DATE_ADD(created_at, INTERVAL 30 DAY);

-- Verification queries (commented out - run manually to verify)
-- SELECT id, title, created_at, expires_at, 
--        DATEDIFF(expires_at, created_at) as days_active,
--        CASE 
--          WHEN DATEDIFF(expires_at, created_at) < 30 THEN 'VIOLATION'
--          ELSE 'OK'
--        END as compliance_status
-- FROM POSTINGS
-- ORDER BY created_at DESC
-- LIMIT 10;
