// Quick script to show POSTINGS columns for debugging
require('dotenv').config();
(async () => {
  try {
    const db = await import('../utils/database.js');
    const pool = db.getPool();
    const [rows] = await pool.query('SHOW COLUMNS FROM POSTINGS');
    console.log(JSON.stringify(rows, null, 2));
    await pool.end();
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
})();
