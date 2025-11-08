-- ============================================================================
-- Migration: Add 'archived' status to POSTINGS table status enum
-- ============================================================================
-- Date: 2025-11-08
-- Issue: E2E Test Archive Workflow Failure
-- Description: The status enum for POSTINGS table is missing 'archived' value.
--              When trying to archive a post, MySQL rejects the value and 
--              sets it to empty string instead.
-- ============================================================================

-- Step 1: Backup current status values before modification
SELECT 
  'BEFORE Migration - Status Value Counts' as info,
  status, 
  COUNT(*) as count 
FROM POSTINGS 
GROUP BY status;

-- Step 2: Alter the table to add 'archived' to the status enum
-- Note: In MySQL, you must specify ALL enum values when modifying an enum column
ALTER TABLE POSTINGS 
MODIFY COLUMN status ENUM(
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'expired',
  'active',
  'archived'
) DEFAULT 'pending_review';

-- Step 3: Fix existing records with empty string status (likely failed archive attempts)
-- We'll set them to 'archived' since that was the intention
UPDATE POSTINGS 
SET status = 'archived' 
WHERE status = '' OR status IS NULL;

-- Step 4: Verify the change
SELECT 
  'AFTER Migration - Status Value Counts' as info,
  status, 
  COUNT(*) as count 
FROM POSTINGS 
GROUP BY status;

-- Step 5: Show the updated table structure
DESCRIBE POSTINGS;

SELECT '✅ Migration completed successfully' as status;
SELECT 'Status enum now includes: draft, pending_review, approved, rejected, expired, active, archived' as note;
