---
title: Database Connection Management
version: 1.0
status: implemented
last_updated: 2025-11-23
applies_to: database
---

# Database Connection Management

## Overview

Connection pooling patterns, configuration, and best practices for MySQL database connections.

## Pool Configuration

Located in `/utils/database.js`:

```javascript
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  connectionLimit: 20,        // Max connections in pool
  queueLimit: 0,              // Unlimited queue
  connectTimeout: 60000,      // Connection timeout (ms)
  supportBigNumbers: true,    // Handle BIGINT
  bigNumberStrings: true,     // Return BIGINT as strings
  typeCast: function (field, next) {
    if (field.type === 'JSON') {
      return JSON.parse(field.string());
    }
    return next();
  }
});
```

## Lazy Initialization

The pool is created on first use to ensure environment variables are loaded:

```javascript
let pool = null;

export const getPool = () => {
  if (!pool) {
    if (!process.env.DB_HOST || !process.env.DB_USER) {
      throw new Error('Database environment variables not loaded.');
    }
    pool = mysql.createPool(getPoolConfig());
    console.log('MySQL: Connection pool created');
  }
  return pool;
};
```

## Connection Patterns

### Pattern 1: Manual try/finally (Current)

Used throughout routes:

```javascript
export const someEndpoint = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute('SELECT * FROM table WHERE id = ?', [id]);
    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed' });
  } finally {
    connection.release();  // ALWAYS release
  }
};
```

### Pattern 2: withDatabaseConnection Helper

Recommended for new code:

```javascript
import { withDatabaseConnection } from '../utils/database.js';

const result = await withDatabaseConnection(async (connection) => {
  const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [userId]);
  return rows[0];
}, 10000);  // Optional timeout
```

### Pattern 3: withTransaction Helper

For operations requiring transactions:

```javascript
import { withTransaction } from '../utils/database.js';

const result = await withTransaction(async (connection) => {
  await connection.execute('INSERT INTO orders (...) VALUES (?)', [...]);
  await connection.execute('UPDATE inventory SET ... WHERE ...', [...]);
  return { success: true };
}, 15000);  // Optional timeout
```

## Connection Monitoring

### Pool Status Check

```javascript
import { getPoolStatus } from '../utils/database.js';

const status = getPoolStatus();
// Returns:
// {
//   poolName: 'MainPool',
//   connectionLimit: 20,
//   availableConnections: 18,
//   usingConnections: 2,
//   waitingClients: 0,
//   totalConnections: 20
// }
```

### Automated Monitoring

```javascript
import { startPoolMonitoring } from '../utils/database.js';

// Log pool status every 60 seconds
startPoolMonitoring(60000);

// Logs warnings at 80% capacity
// Logs errors when pool is exhausted
```

## Error Handling

### Connection Timeout

```javascript
connection = await Promise.race([
  dbPool.getConnection(),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Database connection timeout')), timeoutMs)
  )
]);
```

### Transaction Rollback

```javascript
try {
  await connection.beginTransaction();
  // ... operations
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

## Common Issues

### Connection Leak

**Problem**: Connection not released on error.

```javascript
// WRONG - connection leaks on error
const connection = await pool.getConnection();
const [rows] = await connection.execute(...);  // If this fails, connection never released
connection.release();
```

**Solution**: Always use finally block.

```javascript
// RIGHT
const connection = await pool.getConnection();
try {
  const [rows] = await connection.execute(...);
} finally {
  connection.release();
}
```

### Pool Exhaustion

**Symptoms**: Requests hang, timeouts increase.

**Solutions**:
1. Increase `connectionLimit` (current: 20)
2. Ensure all connections are released
3. Monitor with `getPoolStatus()`
4. Add connection timeout handling

## Testing Connection

```javascript
import { testDatabaseConnection } from '../utils/database.js';

const isConnected = await testDatabaseConnection();
if (!isConnected) {
  console.error('Database connection failed');
  process.exit(1);
}
```

## Environment Variables

Required in `.env`:

```bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sgs_alumni
DB_PORT=3306
```

## Reference Files

- `/utils/database.js` - Main database utility
- `/server.js` - Server initialization and pool setup
