import dotenv from 'dotenv';
import { getPool } from '../../utils/database.js';

dotenv.config();

async function checkCollations() {
  const pool = getPool();
  console.log('🔍 Checking LIKES/COMMENTS collations...');

  const tables = ['POSTING_LIKES', 'POSTING_COMMENTS'];

  try {
    for (const table of tables) {
      console.log(`
📋 Table: ${table}`);
      // Check table default collation
      const [tableInfo] = await pool.query(`
        SELECT TABLE_COLLATION 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
      `, [table]);
      
      if (tableInfo.length > 0) {
        console.log(`  - Default Collation: ${tableInfo[0].TABLE_COLLATION}`);
      } else {
        console.log('  - Table not found');
        continue;
      }

      // Check column collations
      const [columns] = await pool.query(`
        SELECT COLUMN_NAME, COLLATION_NAME, DATA_TYPE
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? 
        AND COLLATION_NAME IS NOT NULL
      `, [table]);

      columns.forEach(c => {
        console.log(`  - Column ${c.COLUMN_NAME}: ${c.COLLATION_NAME}`);
      });
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    process.exit(0);
  }
}

checkCollations();
