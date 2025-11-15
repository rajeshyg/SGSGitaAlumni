const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkModerationQueueCollations() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4'
    });

    console.log('🔍 Checking collations for moderation queue query columns...\n');

    // Check key columns involved in the moderation queue query
    const tables = [
      { table: 'POSTINGS', columns: ['id', 'author_id', 'moderation_status', 'title', 'content', 'created_at'] },
      { table: 'app_users', columns: ['id', 'first_name', 'last_name', 'email'] },
      { table: 'POSTING_DOMAINS', columns: ['posting_id', 'domain_id', 'is_primary'] },
      { table: 'DOMAINS', columns: ['id', 'name'] },
      { table: 'MODERATION_HISTORY', columns: ['posting_id', 'moderator_id', 'action'] }
    ];

    for (const { table, columns } of tables) {
      console.log(`${table}:`);
      for (const column of columns) {
        try {
          const [rows] = await connection.query(
            `SELECT COLUMN_NAME, COLLATION_NAME, COLUMN_TYPE
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
            [process.env.DB_NAME, table, column]
          );

          if (rows.length > 0) {
            const col = rows[0];
            console.log(`  - ${column} (${col.COLUMN_TYPE}): ${col.COLLATION_NAME || 'NULL'}`);
          } else {
            console.log(`  - ${column}: NOT FOUND`);
          }
        } catch (err) {
          console.log(`  - ${column}: ERROR - ${err.message}`);
        }
      }
      console.log('');
    }

    // Test a simple version of the moderation queue query
    console.log('🧪 Testing simplified moderation queue query...\n');

    try {
      const [rows] = await connection.query(`
        SELECT COUNT(*) as total
        FROM POSTINGS p
        WHERE p.moderation_status IN ('PENDING', 'ESCALATED')
        LIMIT 1
      `);
      console.log('✅ Basic moderation status query works');
    } catch (err) {
      console.log('❌ Basic moderation status query failed:', err.message);
    }

    // Test JOIN query
    try {
      const [rows] = await connection.query(`
        SELECT p.id, u.first_name, u.last_name
        FROM POSTINGS p
        INNER JOIN app_users u ON p.author_id = u.id
        WHERE p.moderation_status IN ('PENDING', 'ESCALATED')
        LIMIT 1
      `);
      console.log('✅ Basic JOIN query works');
    } catch (err) {
      console.log('❌ Basic JOIN query failed:', err.message);
    }

  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkModerationQueueCollations();