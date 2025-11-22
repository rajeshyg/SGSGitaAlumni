import dotenv from 'dotenv';
dotenv.config();
import { getPool } from './utils/database.js';

const pool = getPool();

async function checkSchema() {
  // Check POSTING_CATEGORIES
  console.log('POSTING_CATEGORIES structure:');
  const [catCols] = await pool.query(`
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'POSTING_CATEGORIES'
  `);
  catCols.forEach(col => console.log(`  ${col.COLUMN_NAME} (${col.DATA_TYPE})`));
  
  // Check POSTING_DOMAINS
  console.log('\nPOSTING_DOMAINS structure:');
  const [domCols] = await pool.query(`
    SELECT COLUMN_NAME, DATA_TYPE 
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'POSTING_DOMAINS'
  `);
  domCols.forEach(col => console.log(`  ${col.COLUMN_NAME} (${col.DATA_TYPE})`));
  
  // Check sample data
  console.log('\nSample POSTING_CATEGORIES:');
  const [cats] = await pool.query('SELECT * FROM POSTING_CATEGORIES LIMIT 5');
  console.log(cats);
  
  console.log('\nSample POSTING_DOMAINS:');
  const [doms] = await pool.query('SELECT * FROM POSTING_DOMAINS LIMIT 5');
  console.log(doms);
  
  await pool.end();
}

checkSchema();
