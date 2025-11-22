# Alumni Directory API Documentation

**Endpoint:** `GET /api/alumni/directory`  
**Version:** 1.0  
**Created:** October 13, 2025  
**Task:** 7.5 - Alumni Directory & Profile Management

## Overview

The Alumni Directory API provides a paginated, filterable, and searchable interface to browse all alumni members in the system. This endpoint is designed for high performance with proper database indexing and supports various filtering and sorting options.

## Authentication

**Required:** No (Public endpoint)  
**Note:** In production, you may want to add authentication to restrict access to registered users only.

## Request

### HTTP Method
```
GET /api/alumni/directory
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `q` | string | No | `""` | Search query for name or email |
| `page` | number | No | `1` | Page number (minimum: 1) |
| `perPage` | number | No | `20` | Items per page (min: 1, max: 100) |
| `graduationYear` | number | No | - | Filter by specific graduation year |
| `graduationYearMin` | number | No | - | Filter by minimum graduation year |
| `graduationYearMax` | number | No | - | Filter by maximum graduation year |
| `department` | string | No | - | Filter by department/center name |
| `sortBy` | string | No | `name` | Sort field: `name`, `graduationYear`, or `recent` |
| `sortOrder` | string | No | `asc` | Sort direction: `asc` or `desc` |

### Parameter Details

#### Search (`q`)
- Searches across: first name, last name, and email
- Case-insensitive partial matching
- Example: `q=john` matches "John Doe", "Johnny Smith", "john@example.com"

#### Pagination
- `page`: Page number starts at 1
- `perPage`: Maximum 100 items per page to prevent performance issues
- Invalid values are automatically corrected (e.g., page=-1 becomes page=1)

#### Graduation Year Filters
- `graduationYear`: Exact year match (overrides min/max if provided)
- `graduationYearMin` and `graduationYearMax`: Range filter (inclusive)
- Example: `graduationYearMin=2018&graduationYearMax=2022` returns years 2018-2022

#### Department Filter
- Exact match on department/center name
- Use the `filters.departments` array from response to get valid values
- URL encode department names with special characters

#### Sorting
- `sortBy=name`: Sort by last name, then first name
- `sortBy=graduationYear`: Sort by graduation year, then name
- `sortBy=recent`: Sort by creation date (recently added alumni)
- `sortOrder`: `asc` (ascending) or `desc` (descending)

## Response

### Success Response (200 OK)

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
      "location": "New York",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 1280,
    "totalPages": 64,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "graduationYears": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    "departments": ["Computer Science", "Engineering", "Business", "Arts"]
  }
}
```

### Response Fields

#### `data` Array
Each alumni object contains:

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Unique alumni member ID |
| `studentId` | string | Student ID (e.g., "SGS2020001") |
| `firstName` | string | First name |
| `lastName` | string | Last name |
| `displayName` | string | Full name (computed: firstName + lastName) |
| `email` | string | Email address |
| `phone` | string \| null | Phone number (optional) |
| `graduationYear` | number | Year of graduation |
| `degree` | string | Degree or result |
| `department` | string | Department or center name |
| `location` | string \| null | Extracted from address (optional) |
| `createdAt` | string | ISO 8601 timestamp |
| `updatedAt` | string | ISO 8601 timestamp |

#### `pagination` Object

| Field | Type | Description |
|-------|------|-------------|
| `page` | number | Current page number |
| `perPage` | number | Items per page |
| `total` | number | Total number of matching records |
| `totalPages` | number | Total number of pages |
| `hasNext` | boolean | Whether there's a next page |
| `hasPrev` | boolean | Whether there's a previous page |

#### `filters` Object

| Field | Type | Description |
|-------|------|-------------|
| `graduationYears` | number[] | Available graduation years (sorted descending) |
| `departments` | string[] | Available departments (sorted alphabetically) |

### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Failed to fetch alumni directory",
  "message": "Detailed error message"
}
```

## Examples

### Example 1: Basic Request (Default Parameters)
```bash
GET /api/alumni/directory
```

Returns first 20 alumni sorted by name.

### Example 2: Search by Name
```bash
GET /api/alumni/directory?q=john
```

Returns alumni with "john" in their name or email.

### Example 3: Filter by Graduation Year
```bash
GET /api/alumni/directory?graduationYear=2020
```

Returns only alumni who graduated in 2020.

### Example 4: Filter by Year Range
```bash
GET /api/alumni/directory?graduationYearMin=2018&graduationYearMax=2022
```

Returns alumni who graduated between 2018 and 2022 (inclusive).

### Example 5: Filter by Department
```bash
GET /api/alumni/directory?department=Computer%20Science
```

Returns only alumni from Computer Science department.

### Example 6: Pagination
```bash
GET /api/alumni/directory?page=3&perPage=50
```

Returns page 3 with 50 items per page.

### Example 7: Sort by Graduation Year (Descending)
```bash
GET /api/alumni/directory?sortBy=graduationYear&sortOrder=desc
```

Returns alumni sorted by graduation year, newest first.

### Example 8: Combined Filters
```bash
GET /api/alumni/directory?q=john&graduationYear=2020&department=Computer%20Science&sortBy=name
```

Returns alumni named "john" from Computer Science who graduated in 2020, sorted by name.

## Performance

### Database Indexes
The following indexes are created for optimal performance:

```sql
CREATE INDEX idx_alumni_name ON alumni_members(last_name, first_name);
CREATE INDEX idx_alumni_batch ON alumni_members(batch);
CREATE INDEX idx_alumni_center ON alumni_members(center_name);
CREATE INDEX idx_alumni_batch_center ON alumni_members(batch, center_name);
```

### Expected Response Times
- Simple queries (no filters): < 100ms
- Filtered queries: < 200ms
- Complex queries (multiple filters): < 500ms
- Large result sets (100 items): < 1000ms

### Optimization Tips
1. Use pagination to limit result sets
2. Combine filters to reduce result count
3. Use specific graduation years instead of ranges when possible
4. Cache filter options (graduationYears, departments) on client side

## Testing

### Manual Testing with cURL

```bash
# Test basic endpoint
curl "http://localhost:3001/api/alumni/directory"

# Test with filters
curl "http://localhost:3001/api/alumni/directory?graduationYear=2020&perPage=10"

# Test search
curl "http://localhost:3001/api/alumni/directory?q=john"
```

### Automated Tests

Run the test suite:
```bash
npm run test tests/api/alumni-directory.test.js
```

## Migration Notes

### From Existing Search Endpoint
The existing `/api/alumni-members/search` endpoint is still available but limited:
- Only supports basic search (`q` parameter)
- No pagination
- No filtering
- Limited to 50 results

**Migration Path:**
1. Update frontend to use `/api/alumni/directory` instead
2. Add pagination controls
3. Add filter UI components
4. Deprecate old search endpoint after migration

## Future Enhancements

Planned features for future versions:
1. **Profile Images**: Add `profileImageUrl` field
2. **Social Links**: Add LinkedIn, Twitter, etc.
3. **Skills**: Add professional skills array
4. **Mutual Connections**: Show shared connections
5. **Full-Text Search**: Enable advanced search capabilities
6. **Export**: Add CSV/Excel export functionality
7. **Saved Searches**: Allow users to save filter combinations
8. **Advanced Filters**: Location, industry, company, etc.

## Related Endpoints

- `GET /api/alumni-members/:id` - Get single alumni member details
- `GET /api/alumni-members/search` - Legacy search endpoint (deprecated)
- `PUT /api/alumni-members/:id` - Update alumni member (admin only)

## Support

For issues or questions:
- Check the implementation plan: `docs/progress/phase-7/task-7.5-implementation-plan.md`
- Review test cases: `tests/api/alumni-directory.test.js`
- Contact: Development Team

