const mysql = require('mysql2/promise');

async function checkTables() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'sgs_alumni_portal_db',
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0
    });

    const conn = await pool.getConnection();

    // Check if CONVERSATIONS table exists
    const [rows] = await conn.execute(
      'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (?,?,?)',
      [process.env.DB_NAME || 'sgs_alumni_portal_db', 'CONVERSATIONS', 'CONVERSATION_PARTICIPANTS', 'MESSAGES']
    );

    console.log('Tables found:', rows.map(r => r.TABLE_NAME));

    if (rows.length === 0) {
      console.log('ERROR: Chat tables NOT found in database!');
      console.log('Need to run migration: scripts/database/chat-system-migration.sql');
    } else {
      console.log('SUCCESS: Found ' + rows.length + ' chat tables');

      // Also count records in each table
      for (const table of ['CONVERSATIONS', 'CONVERSATION_PARTICIPANTS', 'MESSAGES']) {
        const [[result]] = await conn.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`  ${table}: ${result.count} records`);
      }
    }

    conn.release();
    await pool.end();
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
}

checkTables();
