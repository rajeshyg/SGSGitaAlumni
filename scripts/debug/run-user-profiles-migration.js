import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2/promise';
import fs from 'fs';

async function runMigration() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    // Read and run the user_profiles migration
    const sql = fs.readFileSync('c:/React-Projects/SGSGitaAlumni/migrations/2025-12-07-004-create-user-profiles-table.sql', 'utf8');
    console.log('Running user_profiles migration...');
    await conn.query(sql);
    console.log('Migration completed!');
    
    // Verify
    const [desc] = await conn.query('DESCRIBE user_profiles');
    console.log('user_profiles columns:', desc.map(r => r.Field));
    
  } catch (e) {
    console.error('Error:', e.message);
    if (e.sql) console.error('SQL:', e.sql.substring(0, 200));
  }

  await conn.end();
}

runMigration();
