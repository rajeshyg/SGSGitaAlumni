const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      database: 'sgs_alumni_portal_db'
    });
    
    const [rows] = await conn.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'POSTINGS' 
       AND TABLE_SCHEMA = 'sgs_alumni_portal_db'`
    );
    
    console.log('POSTINGS table schema:');
    rows.forEach(row => {
      console.log(`  ${row.COLUMN_NAME}: ${row.COLUMN_TYPE} (nullable: ${row.IS_NULLABLE})`);
    });
    
    conn.end();
  } catch(e) {
    console.log('Error:', e.message);
  }
})();
