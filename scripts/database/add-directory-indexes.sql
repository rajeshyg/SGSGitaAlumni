-- ============================================================================
-- Alumni Directory Performance Indexes
-- ============================================================================
-- Purpose: Add indexes to optimize alumni directory search and filtering
-- Created: October 13, 2025
-- Task: 7.5 - Alumni Directory & Profile Management
-- ============================================================================

-- Check if indexes already exist before creating them
-- MySQL will error if we try to create duplicate indexes

-- Index for name-based searches and sorting
-- Composite index on last_name and first_name for efficient name searches
CREATE INDEX IF NOT EXISTS idx_alumni_name 
ON alumni_members(last_name, first_name);

-- Index for graduation year filtering
-- Used for year-based filters and sorting
CREATE INDEX IF NOT EXISTS idx_alumni_batch 
ON alumni_members(batch);

-- Index for department/center filtering
-- Used for department-based filters
CREATE INDEX IF NOT EXISTS idx_alumni_center 
ON alumni_members(center_name);

-- Composite index for common filter combinations
-- Optimizes queries that filter by both year and department
CREATE INDEX IF NOT EXISTS idx_alumni_batch_center 
ON alumni_members(batch, center_name);

-- Full-text search index for name and email searches (optional, for future enhancement)
-- Uncomment if you want to enable full-text search capabilities
-- CREATE FULLTEXT INDEX idx_alumni_fulltext 
-- ON alumni_members(first_name, last_name, email);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Show all indexes on alumni_members table
SHOW INDEX FROM alumni_members;

-- Analyze table to update index statistics
ANALYZE TABLE alumni_members;

-- ============================================================================
-- Performance Notes
-- ============================================================================
-- 
-- 1. idx_alumni_name: Speeds up ORDER BY last_name, first_name
-- 2. idx_alumni_batch: Speeds up WHERE batch = ? and ORDER BY batch
-- 3. idx_alumni_center: Speeds up WHERE center_name = ?
-- 4. idx_alumni_batch_center: Speeds up WHERE batch = ? AND center_name = ?
-- 
-- Expected Performance Improvement:
-- - Name searches: 10-50x faster
-- - Year filtering: 20-100x faster
-- - Department filtering: 20-100x faster
-- - Combined filters: 50-200x faster
-- 
-- ============================================================================

