# Task 7.5: Alumni Directory - Implementation Plan

**Created:** October 12, 2025
**Status:** Active Planning Document
**Parent Task:** [Task 7.5: Alumni Directory](./task-7.5-alumni-directory.md)

## 📋 Table of Contents
1. [Database Schema Analysis](#database-schema-analysis)
2. [Field Mapping](#field-mapping)
3. [API Contract](#api-contract)
4. [Implementation Steps](#implementation-steps)
5. [Testing Strategy](#testing-strategy)

---

## Database Schema Analysis

### Current alumni_members Table

**Table:** `alumni_members`
**Records:** 1,280 complete alumni records (99.9% data completeness)

```sql
CREATE TABLE alumni_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    batch INT,                    -- Graduation year
    result VARCHAR(100),          -- Degree/result
    center_name VARCHAR(255),     -- Department/center
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Existing indexes
    INDEX idx_email (email),
    INDEX idx_student_id (student_id)
);
```

### Indexes Needed for Directory Performance

```sql
-- Add these indexes for optimal search performance
CREATE INDEX idx_alumni_name ON alumni_members(last_name, first_name);
CREATE INDEX idx_alumni_batch ON alumni_members(batch);
CREATE INDEX idx_alumni_center ON alumni_members(center_name);
CREATE INDEX idx_alumni_search_composite ON alumni_members(batch, center_name, last_name);
```

**Rationale:**
- `idx_alumni_name`: Speeds up name-based sorting and searching
- `idx_alumni_batch`: Enables fast filtering by graduation year
- `idx_alumni_center`: Enables fast filtering by department
- `idx_alumni_search_composite`: Optimizes multi-filter queries

---

## Field Mapping

### Database → API Response Mapping

| Database Field | API Field | Type | Transformation | Notes |
|---------------|-----------|------|----------------|-------|
| `id` | `id` | number | Direct | Primary key |
| `student_id` | `studentId` | string | Direct | Unique identifier |
| `first_name` | `firstName` | string | Direct | - |
| `last_name` | `lastName` | string | Direct | - |
| `first_name + last_name` | `displayName` | string | Computed | `${firstName} ${lastName}` |
| `email` | `email` | string | Direct | Contact info |
| `phone` | `phone` | string \| null | Direct | Optional field |
| `batch` | `graduationYear` | number | Direct | Year of graduation |
| `result` | `degree` | string | Direct | Degree/result |
| `center_name` | `department` | string | Direct | Department/center |
| `address` | `location` | string \| null | Extract city | Parse address for city |
| `created_at` | `createdAt` | Date | Direct | Record creation |
| `updated_at` | `updatedAt` | Date | Direct | Last update |

### Future Enhancements (Not in Current Scope)

| Future Field | Source | Notes |
|-------------|--------|-------|
| `profileImageUrl` | user_profiles table | Profile photo |
| `bio` | user_profiles table | User biography |
| `skills` | user_skills table | Professional skills |
| `socialLinks` | user_profiles table | LinkedIn, etc. |
| `isAppUser` | app_users table | Has accepted invitation |
| `mutualConnections` | connections table | Shared connections |

---

## API Contract

### 1. GET /api/alumni/directory

**Purpose:** Get paginated, filtered list of alumni for directory view

#### Request Parameters

```typescript
interface DirectoryRequest {
  // Search
  q?: string;                    // Search query (name, email)
  
  // Pagination
  page?: number;                 // Page number (default: 1)
  perPage?: number;              // Items per page (default: 20, max: 100)
  
  // Filters
  graduationYear?: number;       // Filter by specific year
  graduationYearMin?: number;    // Filter by year range (min)
  graduationYearMax?: number;    // Filter by year range (max)
  department?: string;           // Filter by department/center
  
  // Sorting
  sortBy?: 'name' | 'graduationYear' | 'recent';
  sortOrder?: 'asc' | 'desc';    // Default: 'asc'
}
```

#### Response Format

```typescript
interface DirectoryResponse {
  success: boolean;
  data: AlumniMember[];
  pagination: PaginationMetadata;
  filters: FilterOptions;
}

interface AlumniMember {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  displayName: string;           // Computed: firstName + lastName
  email: string;
  phone?: string;
  graduationYear: number;
  degree: string;
  department: string;
  location?: string;             // Extracted from address
}

interface PaginationMetadata {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface FilterOptions {
  graduationYears: number[];     // Available years for filtering
  departments: string[];         // Available departments
}
```

#### Example Request

```bash
GET /api/alumni/directory?q=john&graduationYear=2020&page=1&perPage=20&sortBy=name&sortOrder=asc
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "studentId": "SGS2020001",
      "firstName": "John",
      "lastName": "Doe",
      "displayName": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "graduationYear": 2020,
      "degree": "Bachelor of Science",
      "department": "Computer Science",
      "location": "New York"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "graduationYears": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    "departments": ["Computer Science", "Engineering", "Business", "Arts"]
  }
}
```

#### Error Responses

```typescript
// 400 Bad Request - Invalid parameters
{
  "success": false,
  "error": "Invalid page number",
  "code": "INVALID_PARAMETER"
}

// 401 Unauthorized - Not authenticated
{
  "success": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}

// 500 Internal Server Error - Database error
{
  "success": false,
  "error": "Failed to fetch alumni directory",
  "code": "INTERNAL_ERROR"
}
```

### 2. GET /api/alumni/:id/profile

**Purpose:** Get detailed profile information for a single alumni member

#### Request Parameters

```typescript
interface ProfileRequest {
  id: number;  // Alumni member ID (path parameter)
}
```

#### Response Format

```typescript
interface ProfileResponse {
  success: boolean;
  data: AlumniProfile;
}

interface AlumniProfile extends AlumniMember {
  address: string;
  createdAt: Date;
  updatedAt: Date;
  // Future enhancements
  bio?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  skills?: string[];
}
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": 123,
    "studentId": "SGS2020001",
    "firstName": "John",
    "lastName": "Doe",
    "displayName": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "graduationYear": 2020,
    "degree": "Bachelor of Science",
    "department": "Computer Science",
    "location": "New York",
    "address": "123 Main St, New York, NY 10001",
    "createdAt": "2023-01-15T10:30:00Z",
    "updatedAt": "2024-10-12T14:20:00Z"
  }
}
```

---

## Implementation Steps

### Phase 1: Backend API Enhancement (Week 1, Days 1-3)

#### Step 1.1: Add Database Indexes
**File:** `scripts/database/add-directory-indexes.sql`

```sql
-- Create indexes for directory search performance
CREATE INDEX IF NOT EXISTS idx_alumni_name 
  ON alumni_members(last_name, first_name);

CREATE INDEX IF NOT EXISTS idx_alumni_batch 
  ON alumni_members(batch);

CREATE INDEX IF NOT EXISTS idx_alumni_center 
  ON alumni_members(center_name);

CREATE INDEX IF NOT EXISTS idx_alumni_search_composite 
  ON alumni_members(batch, center_name, last_name);
```

**Run:** `node scripts/database/run-directory-indexes.js`

#### Step 1.2: Enhance Alumni Routes
**File:** `routes/alumni.js`

**Add new endpoint:**
```javascript
export const getAlumniDirectory = async (req, res) => {
  try {
    const {
      q = '',
      page = 1,
      perPage = 20,
      graduationYear,
      graduationYearMin,
      graduationYearMax,
      department,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Validate parameters
    const pageNum = Math.max(1, parseInt(page));
    const perPageNum = Math.min(100, Math.max(1, parseInt(perPage)));
    const offset = (pageNum - 1) * perPageNum;

    // Build WHERE clause
    const conditions = [];
    const params = [];

    if (q) {
      conditions.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)');
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (graduationYear) {
      conditions.push('batch = ?');
      params.push(parseInt(graduationYear));
    }

    if (graduationYearMin) {
      conditions.push('batch >= ?');
      params.push(parseInt(graduationYearMin));
    }

    if (graduationYearMax) {
      conditions.push('batch <= ?');
      params.push(parseInt(graduationYearMax));
    }

    if (department) {
      conditions.push('center_name = ?');
      params.push(department);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';

    // Build ORDER BY clause
    let orderByClause = 'ORDER BY last_name ASC, first_name ASC';
    if (sortBy === 'graduationYear') {
      orderByClause = `ORDER BY batch ${sortOrder.toUpperCase()}`;
    } else if (sortBy === 'recent') {
      orderByClause = `ORDER BY updated_at ${sortOrder.toUpperCase()}`;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM alumni_members ${whereClause}`;
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;

    // Get paginated data
    const dataQuery = `
      SELECT 
        id, student_id, first_name, last_name, email, phone,
        batch as graduation_year, result as degree, center_name as department,
        address, created_at, updated_at
      FROM alumni_members
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await pool.execute(dataQuery, [...params, perPageNum, offset]);

    // Get filter options
    const [yearsResult] = await pool.execute(
      'SELECT DISTINCT batch as year FROM alumni_members WHERE batch IS NOT NULL ORDER BY batch DESC'
    );
    const [deptsResult] = await pool.execute(
      'SELECT DISTINCT center_name as dept FROM alumni_members WHERE center_name IS NOT NULL ORDER BY center_name ASC'
    );

    // Format response
    const data = rows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      firstName: row.first_name,
      lastName: row.last_name,
      displayName: `${row.first_name} ${row.last_name}`,
      email: row.email,
      phone: row.phone,
      graduationYear: row.graduation_year,
      degree: row.degree,
      department: row.department,
      location: extractCity(row.address)
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        perPage: perPageNum,
        total,
        totalPages: Math.ceil(total / perPageNum),
        hasNext: pageNum < Math.ceil(total / perPageNum),
        hasPrev: pageNum > 1
      },
      filters: {
        graduationYears: yearsResult.map(r => r.year),
        departments: deptsResult.map(r => r.dept)
      }
    });

  } catch (error) {
    console.error('Error fetching alumni directory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alumni directory',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Helper function to extract city from address
function extractCity(address) {
  if (!address) return null;
  // Simple extraction - can be enhanced
  const parts = address.split(',');
  return parts.length > 1 ? parts[parts.length - 2].trim() : null;
}
```

**Register route in server.js:**
```javascript
app.get('/api/alumni/directory', authenticateToken, getAlumniDirectory);
```

---

## Testing Strategy

### Unit Tests

**File:** `routes/__tests__/alumni.test.js`

```javascript
describe('GET /api/alumni/directory', () => {
  it('should return paginated alumni list', async () => {
    const response = await request(app)
      .get('/api/alumni/directory?page=1&perPage=20')
      .set('Authorization', `Bearer ${validToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.pagination).toBeDefined();
  });

  it('should filter by graduation year', async () => {
    const response = await request(app)
      .get('/api/alumni/directory?graduationYear=2020')
      .set('Authorization', `Bearer ${validToken}`);
    
    expect(response.status).toBe(200);
    response.body.data.forEach(alumni => {
      expect(alumni.graduationYear).toBe(2020);
    });
  });

  it('should search by name', async () => {
    const response = await request(app)
      .get('/api/alumni/directory?q=john')
      .set('Authorization', `Bearer ${validToken}`);
    
    expect(response.status).toBe(200);
    response.body.data.forEach(alumni => {
      const fullName = `${alumni.firstName} ${alumni.lastName}`.toLowerCase();
      expect(fullName).toContain('john');
    });
  });
});
```

---

**Next:** Continue with Frontend UI implementation in separate document.

