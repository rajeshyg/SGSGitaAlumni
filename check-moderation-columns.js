import mysql from 'mysql2/promise';

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      database: 'sgs_alumni_portal_db'
    });
    
    // Check if moderation_status exists
    const [modeColumns] = await conn.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'POSTINGS' 
       AND TABLE_SCHEMA = 'sgs_alumni_portal_db'
       AND COLUMN_NAME LIKE '%moderation%'`
    );
    
    console.log('\n=== Moderation-related columns ===');
    if (modeColumns.length === 0) {
      console.log('❌ No columns with "moderation" in name found\n');
    } else {
      modeColumns.forEach(col => {
        console.log(`✓ ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
      });
    }
    
    // Check status column
    const [statusColumns] = await conn.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'POSTINGS' 
       AND TABLE_SCHEMA = 'sgs_alumni_portal_db'
       AND COLUMN_NAME = 'status'`
    );
    
    console.log('\n=== Status column ===');
    if (statusColumns.length === 0) {
      console.log('❌ No status column found\n');
    } else {
      statusColumns.forEach(col => {
        console.log(`✓ ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
      });
    }
    
    // Get sample data
    const [samples] = await conn.query(
      `SELECT id, status FROM POSTINGS LIMIT 3`
    );
    
    console.log('\n=== Sample data ===');
    samples.forEach(row => {
      console.log(`ID: ${row.id}, Status: ${row.status}`);
    });
    
    conn.end();
  } catch(e) {
    console.log('Error:', e.message);
  }
})();
