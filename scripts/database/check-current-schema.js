/**
 * Check current database schema
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkSchema() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✓ Connected\n');

    // Get all tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('=== ALL TABLES ===');
    tables.forEach(t => console.log('  -', Object.values(t)[0]));
    console.log('');

    // Check for key tables
    console.log('=== KEY TABLES CHECK ===');
    const keyTables = ['app_users', 'FAMILY_MEMBERS', 'accounts', 'user_profiles', 'alumni_members'];
    
    for (const table of keyTables) {
      const [result] = await connection.query(
        'SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
        [process.env.DB_NAME, table]
      );
      console.log(`  ${table}: ${result[0].cnt > 0 ? '✓ EXISTS' : '✗ MISSING'}`);
    }
    console.log('');

    // Check alumni_members columns
    console.log('=== ALUMNI_MEMBERS COLUMNS ===');
    const [columns] = await connection.query(
      'SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = ? AND table_name = ? ORDER BY ordinal_position',
      [process.env.DB_NAME, 'alumni_members']
    );
    columns.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkSchema();
