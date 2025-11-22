import dotenv from 'dotenv';
dotenv.config();
import { getPool } from './utils/database.js';

const pool = getPool();

async function checkCollations() {
  console.log('Checking collations in JOIN conditions...\n');
  
  // Check POSTINGS.id collation
  const [postingsId] = await pool.query(`
    SELECT TABLE_NAME, COLUMN_NAME, COLLATION_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'POSTINGS'
    AND COLUMN_NAME = 'id'
  `);
  console.log('POSTINGS.id:', postingsId[0].COLLATION_NAME);
  
  // Check POSTING_DOMAINS.posting_id collation
  const [pdPostingId] = await pool.query(`
    SELECT TABLE_NAME, COLUMN_NAME, COLLATION_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'POSTING_DOMAINS'
    AND COLUMN_NAME = 'posting_id'
  `);
  console.log('POSTING_DOMAINS.posting_id:', pdPostingId[0].COLLATION_NAME);
  
  // Check POSTING_DOMAINS.domain_id collation
  const [pdDomainId] = await pool.query(`
    SELECT TABLE_NAME, COLUMN_NAME, COLLATION_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'POSTING_DOMAINS'
    AND COLUMN_NAME = 'domain_id'
  `);
  console.log('POSTING_DOMAINS.domain_id:', pdDomainId[0].COLLATION_NAME);
  
  // Check DOMAINS.id collation
  const [domainsId] = await pool.query(`
    SELECT TABLE_NAME, COLUMN_NAME, COLLATION_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'DOMAINS'
    AND COLUMN_NAME = 'id'
  `);
  console.log('DOMAINS.id:', domainsId[0].COLLATION_NAME);
  
  await pool.end();
}

checkCollations();
