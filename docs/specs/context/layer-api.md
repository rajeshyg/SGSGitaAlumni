# API Context Layer

Load this when working on API endpoints.

## Architecture
- RESTful endpoints with Express
- Consistent response format
- Input validation on all endpoints

## Response Format
```javascript
// Success
res.json({
  success: true,
  data: { ... },
  pagination: { page, pageSize, total } // if applicable
});

// Error
res.status(400).json({
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'User-friendly message',
    details: { ... } // optional
  }
});
```

## Key Files
- `routes/` - All API route handlers
- `middleware/` - Auth, validation, rate limiting
- `server/routes/` - Additional route modules

## Patterns
- Use `authenticateToken` for protected routes
- Validate input at route level
- Return consistent error formats
- Log requests but not sensitive data

## Pagination
- Default pageSize: 20
- Max pageSize: 100
- Use LIMIT ? OFFSET ? (parameterized)

## Related Specs
- `docs/specs/technical/api-standards.md`
- `docs/specs/technical/error-handling.md`
