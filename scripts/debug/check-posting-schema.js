import dotenv from 'dotenv';
import { getPool } from '../../utils/database.js';

dotenv.config();

async function checkSchema() {
  const pool = getPool();
  console.log('🔍 Checking database schema...');

  try {
    // 1. Check DOMAINS table columns
    const [domainCols] = await pool.query('DESCRIBE DOMAINS');
    console.log('\n📋 DOMAINS columns:');
    domainCols.forEach(c => console.log(` - ${c.Field} (${c.Type})`));
    
    const hasDesc = domainCols.some(c => c.Field === 'description');
    console.log(`👉 DOMAINS.description exists: ${hasDesc}`);

    // 2. Check POSTING_ATTACHMENTS table
    try {
      const [attachmentCols] = await pool.query('DESCRIBE POSTING_ATTACHMENTS');
      console.log('\n📋 POSTING_ATTACHMENTS columns:');
      attachmentCols.forEach(c => console.log(` - ${c.Field} (${c.Type})`));
    } catch (e) {
      console.log('\n❌ POSTING_ATTACHMENTS table likely missing:', e.message);
    }

    // 3. Check POSTINGS table columns (to ensure p.* works)
    const [postingCols] = await pool.query('DESCRIBE POSTINGS');
    console.log('\n📋 POSTINGS columns:');
    postingCols.forEach(c => console.log(` - ${c.Field} (${c.Type})`));

  } catch (error) {
    console.error('❌ Schema check failed:', error);
  } finally {
    process.exit(0);
  }
}

checkSchema();
