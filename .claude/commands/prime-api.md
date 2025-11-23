# Prime: API Development Context

Load this context before working on API endpoints.

## Variables
- `$TASK`: The specific API task to perform
- `$ENDPOINT`: Target endpoint path (e.g., /api/users)
- `$METHOD`: HTTP method (GET, POST, PUT, DELETE)

## Context to Load
Read these files to understand API patterns:
- `docs/specs/context/always-on.md` - Critical rules
- `docs/specs/technical/architecture/api-design.md` - API design standards
- `docs/specs/technical/architecture/error-handling.md` - Error response patterns

## Key Files
- `routes/*.js` - Existing route patterns
- `middleware/auth.js` - Auth middleware
- `server/utils/errorHandler.js` - Error handling

## Response Format
Always use consistent format:
```javascript
res.json({
  success: true|false,
  data: result,      // on success
  error: message     // on failure
});
```

## Workflow
1. Read the context files listed above
2. Check if similar endpoint exists in routes/
3. Follow existing route structure and naming
4. Add auth middleware if endpoint needs protection
5. Validate input before database operations
6. Use try/finally for database connections
7. Return consistent response format

## Report
After completing the task:
- Endpoint created/modified: $METHOD $ENDPOINT
- Auth required: Yes/No
- Input validation added: Yes/No
- Tests to add: `tests/e2e/[module].spec.ts`
