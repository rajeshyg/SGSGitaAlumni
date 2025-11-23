# Prime: Database Context

Load this context before working on database-related tasks.

## Variables
- `$TASK`: The specific database task to perform
- `$TABLE`: (Optional) Target table name
- `$QUERY`: (Optional) Problem query to optimize

## Context to Load
Read these files to understand database patterns:
- `docs/specs/context/always-on.md` - Critical rules
- `docs/specs/technical/database/connection-management.md` - Connection patterns (try/finally)
- `docs/specs/technical/database/indexing.md` - Query optimization
- `docs/specs/technical/database/README.md` - Database overview

## Key Files
- `server/config/database.js` - Connection pool
- `src/lib/database/schema/` - Schema definitions
- `routes/*.js` - See existing query patterns

## Critical Rules
1. **ALWAYS** use parameterized queries: `[?, ?]` syntax
2. **ALWAYS** wrap in try/finally for connection.release()
3. **NEVER** string interpolation in SQL
4. Check for existing indexes before adding new ones

## Workflow
1. Read the context files listed above
2. Identify the target tables/queries for $TASK
3. Check existing patterns in routes/*.js
4. Write queries with parameterized values
5. Ensure connection.release() in finally block

## Report
After completing the task:
- List queries modified/added
- Connection leak risk: Yes/No
- SQL injection risk: Yes/No
- Tests to run
