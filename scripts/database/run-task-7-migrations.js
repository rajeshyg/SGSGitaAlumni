// ============================================================================
// Run Task 7.7.4 and 7.4.1 Database Migrations
// ============================================================================
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
  host: 'sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com',
  user: 'sgsgita_alumni_user',
  password: '2FvT6j06sfI',
  database: 'sgsgita_alumni',
  multipleStatements: true
};

async function runMigrations() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');

    // Run Task 7.7.4 migrations (Preferences tables)
    console.log('📋 Running Task 7.7.4 migrations (Preferences tables)...');
    const preferencesSQL = fs.readFileSync(
      path.join(__dirname, 'migrations/task-7.7.4-preferences-tables.sql'),
      'utf8'
    );
    
    // Split by delimiter and execute each statement
    const preferencesStatements = preferencesSQL
      .split('DELIMITER $$')[0] // Get everything before triggers
      .split(';')
      .filter(stmt => stmt.trim().length > 0 && !stmt.trim().startsWith('--'));
    
    for (const statement of preferencesStatements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }
    console.log('✅ Task 7.7.4 migrations completed\n');

    // Run Task 7.4.1 migrations (Feed tables)
    console.log('📋 Running Task 7.4.1 migrations (Feed tables)...');
    const feedSQL = fs.readFileSync(
      path.join(__dirname, 'migrations/task-7.4.1-feed-tables.sql'),
      'utf8'
    );
    
    const feedStatements = feedSQL
      .split(';')
      .filter(stmt => stmt.trim().length > 0 && !stmt.trim().startsWith('--'));
    
    for (const statement of feedStatements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }
    console.log('✅ Task 7.4.1 migrations completed\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = 'sgsgita_alumni'
      AND TABLE_NAME IN (
        'USER_NOTIFICATION_PREFERENCES',
        'USER_PRIVACY_SETTINGS',
        'ACTIVITY_FEED',
        'FEED_ENGAGEMENT'
      )
    `);
    
    console.log('✅ Tables created:');
    tables.forEach(table => {
      console.log(`   - ${table.TABLE_NAME}`);
    });

    console.log('\n✅ All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

runMigrations();

