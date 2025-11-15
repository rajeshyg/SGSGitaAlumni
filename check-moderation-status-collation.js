import dotenv from 'dotenv';
dotenv.config();
import { getPool } from './utils/database.js';

const pool = getPool();

async function checkModerationStatusCollation() {
  const [cols] = await pool.query(`
    SELECT TABLE_NAME, COLUMN_NAME, COLLATION_NAME, COLUMN_TYPE
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'POSTINGS'
    AND COLUMN_NAME = 'moderation_status'
  `);
  
  console.log('POSTINGS.moderation_status:');
  console.log(cols[0]);
  
  await pool.end();
}

checkModerationStatusCollation();
