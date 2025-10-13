# Alumni Directory - Testing Guide

**Task:** 7.5 - Alumni Directory & Profile Management  
**Created:** October 13, 2025  
**Status:** Ready for Testing (Pending Database Access)

## 📋 Table of Contents
1. [Pre-Testing Setup](#pre-testing-setup)
2. [Database Index Installation](#database-index-installation)
3. [Backend API Testing](#backend-api-testing)
4. [Performance Testing](#performance-testing)
5. [Quality Validation](#quality-validation)
6. [Test Checklist](#test-checklist)

---

## Pre-Testing Setup

### 1. Verify Database Connection

```bash
# Test database connection
node -e "import('./utils/database.js').then(db => db.getPool().getConnection().then(conn => { console.log('✅ Connected'); conn.release(); }).catch(err => console.error('❌ Failed:', err.message)));"
```

**Expected Output:**
```
✅ Connected
```

### 2. Start Development Server

```bash
# Start backend server
npm run dev
```

**Expected Output:**
```
🚀 Server running on port 3001
✅ Database connected successfully
```

### 3. Verify Server Health

```bash
curl http://localhost:3001/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-10-13T..."
}
```

---

## Database Index Installation

### Step 1: Run Index Creation Script

```bash
# Connect to MySQL and run the script
mysql -h sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com \
      -u sgsgita_alumni_user \
      -p sgsgita_alumni \
      < scripts/database/add-directory-indexes.sql
```

**Password:** `2FvT6j06sfI`

### Step 2: Verify Indexes Created

```sql
-- Connect to database
mysql -h sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com \
      -u sgsgita_alumni_user \
      -p sgsgita_alumni

-- Show all indexes on alumni_members table
SHOW INDEX FROM alumni_members;
```

**Expected Indexes:**
- `PRIMARY` (id)
- `idx_email` (email)
- `idx_student_id` (student_id)
- `idx_alumni_name` (last_name, first_name) ← **NEW**
- `idx_alumni_batch` (batch) ← **NEW**
- `idx_alumni_center` (center_name) ← **NEW**
- `idx_alumni_batch_center` (batch, center_name) ← **NEW**

### Step 3: Analyze Table

```sql
-- Update index statistics
ANALYZE TABLE alumni_members;
```

**Expected Output:**
```
+---------------------------+---------+----------+----------+
| Table                     | Op      | Msg_type | Msg_text |
+---------------------------+---------+----------+----------+
| sgsgita_alumni.alumni_members | analyze | status   | OK       |
+---------------------------+---------+----------+----------+
```

---

## Backend API Testing

### Test 1: Basic Directory Request

```bash
curl "http://localhost:3001/api/alumni/directory" | jq
```

**Expected Response Structure:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 1280,
    "totalPages": 64,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "graduationYears": [...],
    "departments": [...]
  }
}
```

**Validation Checklist:**
- ✅ `success` is `true`
- ✅ `data` is an array with ≤ 20 items
- ✅ `pagination.total` equals 1280 (or current count)
- ✅ `pagination.page` is 1
- ✅ `pagination.perPage` is 20
- ✅ `filters.graduationYears` is a non-empty array
- ✅ `filters.departments` is a non-empty array

### Test 2: Pagination

```bash
# Page 1
curl "http://localhost:3001/api/alumni/directory?page=1&perPage=10" | jq '.pagination'

# Page 2
curl "http://localhost:3001/api/alumni/directory?page=2&perPage=10" | jq '.pagination'

# Page 3
curl "http://localhost:3001/api/alumni/directory?page=3&perPage=10" | jq '.pagination'
```

**Validation:**
- ✅ Page 1: `hasPrev=false`, `hasNext=true`
- ✅ Page 2: `hasPrev=true`, `hasNext=true`
- ✅ Each page returns exactly 10 items (or fewer on last page)
- ✅ `totalPages` = ceil(total / perPage)

### Test 3: Search Functionality

```bash
# Search by name
curl "http://localhost:3001/api/alumni/directory?q=john" | jq '.data[] | {firstName, lastName, email}'

# Search by email
curl "http://localhost:3001/api/alumni/directory?q=example.com" | jq '.data[] | .email'
```

**Validation:**
- ✅ All results contain search term in firstName, lastName, or email
- ✅ Search is case-insensitive
- ✅ Partial matches work

### Test 4: Graduation Year Filter

```bash
# Specific year
curl "http://localhost:3001/api/alumni/directory?graduationYear=2020" | jq '.data[] | .graduationYear'

# Year range
curl "http://localhost:3001/api/alumni/directory?graduationYearMin=2018&graduationYearMax=2022" | jq '.data[] | .graduationYear'
```

**Validation:**
- ✅ Specific year: All results have graduationYear = 2020
- ✅ Year range: All results have 2018 ≤ graduationYear ≤ 2022

### Test 5: Department Filter

```bash
# First, get available departments
curl "http://localhost:3001/api/alumni/directory" | jq '.filters.departments[0]'

# Then filter by first department (replace with actual value)
curl "http://localhost:3001/api/alumni/directory?department=Computer%20Science" | jq '.data[] | .department'
```

**Validation:**
- ✅ All results have the specified department

### Test 6: Sorting

```bash
# Sort by name (ascending)
curl "http://localhost:3001/api/alumni/directory?sortBy=name&sortOrder=asc" | jq '.data[] | {lastName, firstName}'

# Sort by name (descending)
curl "http://localhost:3001/api/alumni/directory?sortBy=name&sortOrder=desc" | jq '.data[] | {lastName, firstName}'

# Sort by graduation year (descending)
curl "http://localhost:3001/api/alumni/directory?sortBy=graduationYear&sortOrder=desc" | jq '.data[] | .graduationYear'
```

**Validation:**
- ✅ Name ascending: Results sorted alphabetically by last name
- ✅ Name descending: Results sorted reverse alphabetically
- ✅ Year descending: Results sorted newest to oldest

### Test 7: Combined Filters

```bash
curl "http://localhost:3001/api/alumni/directory?q=john&graduationYear=2020&sortBy=name" | jq
```

**Validation:**
- ✅ Results match all filters simultaneously
- ✅ Results are sorted correctly

### Test 8: Edge Cases

```bash
# Invalid page number (should default to 1)
curl "http://localhost:3001/api/alumni/directory?page=-1" | jq '.pagination.page'

# Excessive perPage (should cap at 100)
curl "http://localhost:3001/api/alumni/directory?perPage=500" | jq '.pagination.perPage'

# No results
curl "http://localhost:3001/api/alumni/directory?graduationYear=1900" | jq '.data'
```

**Validation:**
- ✅ Invalid page defaults to 1
- ✅ Excessive perPage caps at 100
- ✅ No results returns empty array with total=0

---

## Performance Testing

### Test 1: Response Time (No Filters)

```bash
time curl "http://localhost:3001/api/alumni/directory" > /dev/null
```

**Expected:** < 200ms

### Test 2: Response Time (With Filters)

```bash
time curl "http://localhost:3001/api/alumni/directory?graduationYear=2020&department=Computer%20Science" > /dev/null
```

**Expected:** < 300ms

### Test 3: Large Result Set

```bash
time curl "http://localhost:3001/api/alumni/directory?perPage=100" > /dev/null
```

**Expected:** < 500ms

### Test 4: Database Query Performance

```sql
-- Check query execution time
SET profiling = 1;

SELECT COUNT(*) FROM alumni_members;

SELECT * FROM alumni_members
WHERE batch = 2020
ORDER BY last_name, first_name
LIMIT 20;

SHOW PROFILES;
```

**Expected:** All queries < 0.1 seconds

---

## Quality Validation

### Run Automated Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test tests/api/alumni-directory.test.js

# Run with coverage
npm run test:coverage
```

**Expected:** All tests pass ✅

### Run Linting

```bash
npm run lint
```

**Expected:** No errors in new code (routes/alumni.js, server.js)

### Run Quality Checks

```bash
# Check for redundancy
npm run check-redundancy

# Validate documentation
npm run validate-documentation-standards
```

---

## Test Checklist

### ✅ Phase 2: Backend API Implementation

#### Database Setup
- [ ] Database indexes created successfully
- [ ] Indexes verified with `SHOW INDEX`
- [ ] Table analyzed for optimal performance

#### API Endpoint
- [ ] Endpoint accessible at `/api/alumni/directory`
- [ ] Returns correct response structure
- [ ] Pagination works correctly
- [ ] Search functionality works
- [ ] Graduation year filter works
- [ ] Department filter works
- [ ] Sorting works (name, year, recent)
- [ ] Combined filters work
- [ ] Edge cases handled gracefully

#### Performance
- [ ] Response time < 200ms (no filters)
- [ ] Response time < 300ms (with filters)
- [ ] Response time < 500ms (100 items)
- [ ] Database queries optimized

#### Quality
- [ ] All automated tests pass
- [ ] No linting errors
- [ ] No redundancy issues
- [ ] Documentation complete

### 📝 Test Results Log

**Date:** _____________  
**Tester:** _____________

| Test | Status | Notes |
|------|--------|-------|
| Database Connection | ⬜ Pass ⬜ Fail | |
| Index Creation | ⬜ Pass ⬜ Fail | |
| Basic Directory Request | ⬜ Pass ⬜ Fail | |
| Pagination | ⬜ Pass ⬜ Fail | |
| Search | ⬜ Pass ⬜ Fail | |
| Year Filter | ⬜ Pass ⬜ Fail | |
| Department Filter | ⬜ Pass ⬜ Fail | |
| Sorting | ⬜ Pass ⬜ Fail | |
| Combined Filters | ⬜ Pass ⬜ Fail | |
| Edge Cases | ⬜ Pass ⬜ Fail | |
| Performance | ⬜ Pass ⬜ Fail | |
| Automated Tests | ⬜ Pass ⬜ Fail | |

---

## Next Steps After Testing

Once all tests pass:

1. **Update Task Status**
   - Mark Phase 2 tasks as COMPLETE
   - Update progress in task-7.5-alumni-directory.md

2. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: Implement alumni directory API endpoint with pagination and filters"
   ```

3. **Proceed to Phase 3**
   - Begin frontend implementation
   - Create AlumniDirectory page component
   - Create AlumniCard component
   - Integrate with API

4. **Documentation**
   - Update API documentation with any findings
   - Document any performance optimizations made
   - Update testing guide with actual results

