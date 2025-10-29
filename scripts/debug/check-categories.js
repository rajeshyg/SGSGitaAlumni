import { pool } from '../../utils/database.js';

async function checkCategories() {
  try {
    console.log('Fetching posting categories...\n');
    
    const { rows } = await pool.query('SELECT * FROM posting_categories ORDER BY id');
    
    console.log('Categories found:', rows.length);
    console.log(JSON.stringify(rows, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkCategories();
