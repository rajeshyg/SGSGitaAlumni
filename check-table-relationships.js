import dotenv from 'dotenv';
dotenv.config();
import { getPool } from './utils/database.js';

const pool = getPool();

async function checkTables() {
  // Check all tables
  const [tables] = await pool.query('SHOW TABLES');
  console.log('All tables:');
  tables.forEach(t => console.log('  -', Object.values(t)[0]));
  
  // Check if category_id in POSTINGS maps to anything
  const [fks] = await pool.query(`
    SELECT 
      COLUMN_NAME,
      CONSTRAINT_NAME,
      REFERENCED_TABLE_NAME,
      REFERENCED_COLUMN_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'POSTINGS'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  `);
  
  console.log('\nForeign keys in POSTINGS:');
  fks.forEach(fk => {
    console.log(`  ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
  });
  
  await pool.end();
}

checkTables();
