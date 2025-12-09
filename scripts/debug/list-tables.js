import dotenv from 'dotenv';
import { getPool } from '../../utils/database.js';

dotenv.config();

async function listTables() {
  const pool = getPool();
  
  try {
    console.log('🔍 Listing all tables in database...');
    console.log('');
    
    // Get all tables
    const [tables] = await pool.execute('SHOW TABLES');
    
    console.log('📋 Tables in sgsgita_alumni database:');
    tables.forEach(t => {
      const tableName = Object.values(t)[0];
      console.log(`   - ${tableName}`);
    });
    console.log('');
    console.log(`Total: ${tables.length} tables`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

listTables();
