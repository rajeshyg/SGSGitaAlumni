# Prime: Database Context

Load this context before working on database-related tasks.

## Variables
- `$TASK`: The specific database task to perform
- `$FEATURE`: (Optional) Feature/module name (e.g., "authentication", "messaging")
- `$TABLE`: (Optional) Target table name
- `$QUERY`: (Optional) Problem query to optimize

## Context to Load
Read these files to understand database patterns:
- `docs/specs/context/always-on.md` - Critical security rules
- `docs/specs/technical/database/schema-design.md` - Schema patterns and conventions
- `docs/specs/technical/database/connection-management.md` - Connection pool patterns (try/finally)
- `docs/specs/technical/database/indexing.md` - Query optimization
- `docs/specs/technical/database/README.md` - Database overview

## Feature-Specific Schemas
For feature-specific database schemas:
- **Read**: `docs/specs/functional/[feature-name]/db-schema.md` (if exists)
- **Create**: Use template `docs/specs/functional/_TEMPLATE_db-schema.md` for new features

## Key Files
- `server/config/database.js` - Connection pool implementation
- `routes/[feature-name].js` - See existing query patterns for features
- `server/services/[FeatureName]Service.js` - Business logic and database interactions

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
