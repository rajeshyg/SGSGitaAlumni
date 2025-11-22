# Database Context Layer

Load this when working on database-related features.

## Architecture
- MySQL 8+ with mysql2 driver
- Connection pooling (max 10 connections)
- Parameterized queries only

## Key Files
- `utils/database.js` - Connection pool setup
- `database/schema.sql` - Table definitions
- `scripts/database/` - Migration scripts

## Patterns
```javascript
// ALWAYS use this pattern
const connection = await pool.getConnection();
try {
  const [rows] = await connection.execute(
    'SELECT * FROM table WHERE id = ?',
    [id]
  );
  return rows;
} finally {
  connection.release();
}
```

## Tables
- `app_users` - User accounts
- `alumni_members` - Alumni profiles
- `postings` - Jobs/mentorship/events
- `conversations` / `messages` - Chat system
- `user_invitations` - Invitation management

## Anti-Patterns (NEVER DO)
- String interpolation in SQL: `` `LIMIT ${limit}` ``
- Missing connection.release()
- Hardcoded values instead of lookups

## Related Specs
- `docs/specs/technical/database.md`
