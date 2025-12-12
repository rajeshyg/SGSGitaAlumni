import dotenv from 'dotenv';
import { getPool } from '../../utils/database.js';

dotenv.config();

async function checkSchema() {
  const pool = getPool();
  console.log('🔍 Checking alumni_members schema...');

  try {
    const [columns] = await pool.query('DESCRIBE alumni_members');
    console.log('\n📋 alumni_members columns:');
    columns.forEach(c => console.log(` - ${c.Field} (${c.Type})`));

    const [profileColumns] = await pool.query('DESCRIBE user_profiles');
    console.log('\n📋 user_profiles columns:');
    profileColumns.forEach(c => console.log(` - ${c.Field} (${c.Type})`));

  } catch (error) {
    console.error('❌ Schema check failed:', error);
  } finally {
    process.exit(0);
  }
}

checkSchema();
