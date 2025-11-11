import mysql from 'mysql2/promise';

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      database: 'sgs_alumni_portal_db'
    });
    
    // Check POSTINGS table schema
    const [columns] = await conn.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'POSTINGS' 
       AND TABLE_SCHEMA = 'sgs_alumni_portal_db'
       ORDER BY ORDINAL_POSITION`
    );
    
    console.log('\n=== POSTINGS Table Schema ===\n');
    columns.forEach(col => {
      console.log(`${col.COLUMN_NAME}:`);
      console.log(`  Type: ${col.COLUMN_TYPE}`);
      console.log(`  Nullable: ${col.IS_NULLABLE}`);
      console.log(`  Default: ${col.COLUMN_DEFAULT || 'NULL'}`);
      console.log('');
    });

    // Check if expiry_date column exists
    const expiryColumn = columns.find(col => col.COLUMN_NAME === 'expiry_date');
    
    if (expiryColumn) {
      console.log('✅ expiry_date column EXISTS');
      console.log(`   Type: ${expiryColumn.COLUMN_TYPE}`);
      console.log(`   Nullable: ${expiryColumn.IS_NULLABLE}`);
      
      // Check sample data
      const [postings] = await conn.query(
        `SELECT id, title, created_at, expiry_date, 
                DATEDIFF(expiry_date, created_at) as days_duration
         FROM POSTINGS 
         LIMIT 5`
      );
      
      console.log('\n=== Sample Postings Data ===\n');
      postings.forEach(p => {
        console.log(`ID: ${p.id}`);
        console.log(`Title: ${p.title}`);
        console.log(`Created: ${p.created_at}`);
        console.log(`Expires: ${p.expiry_date}`);
        console.log(`Duration: ${p.days_duration} days`);
        console.log('---');
      });
    } else {
      console.log('❌ expiry_date column DOES NOT EXIST');
      console.log('Need to add this column before implementing expiry logic');
    }
    
    await conn.end();
  } catch(e) {
    console.error('Error:', e.message);
  }
})();
