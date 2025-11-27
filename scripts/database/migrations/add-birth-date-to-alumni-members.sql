-- ============================================================================
-- Migration: Add birth_date column to alumni_members table
-- Purpose: Enable admin to store actual birth dates for COPPA compliance
-- Date: 2025-11-26
-- ============================================================================

-- Step 1: Add birth_date column to alumni_members if not exists
ALTER TABLE alumni_members 
ADD COLUMN IF NOT EXISTS birth_date DATE NULL COMMENT 'Birth date for age calculation (admin-populated)';

-- Step 2: Add estimated_birth_year for fallback calculation
-- If birth_date is NULL, we estimate based on graduation year (batch)
-- Typical graduation age is ~22 years, so birth_year ≈ batch - 22
ALTER TABLE alumni_members 
ADD COLUMN IF NOT EXISTS estimated_birth_year INT NULL COMMENT 'Estimated birth year from graduation year';

-- Step 3: Populate estimated_birth_year from batch (graduation year) for existing records
-- This provides a fallback when actual birth_date is not known
UPDATE alumni_members 
SET estimated_birth_year = batch - 22 
WHERE batch IS NOT NULL AND estimated_birth_year IS NULL;

-- Step 4: Add invitation_sent_at column if not exists (for tracking)
ALTER TABLE alumni_members 
ADD COLUMN IF NOT EXISTS invitation_sent_at DATETIME NULL COMMENT 'When invitation was sent to this member';

-- Step 5: Add invitation_accepted_at column if not exists
ALTER TABLE alumni_members 
ADD COLUMN IF NOT EXISTS invitation_accepted_at DATETIME NULL COMMENT 'When invitation was accepted';

-- ============================================================================
-- Verification queries (run these to confirm migration)
-- ============================================================================
-- SELECT COUNT(*) as total, 
--        SUM(CASE WHEN birth_date IS NOT NULL THEN 1 ELSE 0 END) as with_birth_date,
--        SUM(CASE WHEN estimated_birth_year IS NOT NULL THEN 1 ELSE 0 END) as with_estimated_year
-- FROM alumni_members;

-- ============================================================================
-- Rollback (if needed)
-- ============================================================================
-- ALTER TABLE alumni_members DROP COLUMN IF EXISTS birth_date;
-- ALTER TABLE alumni_members DROP COLUMN IF EXISTS estimated_birth_year;
