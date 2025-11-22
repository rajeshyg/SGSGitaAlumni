import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306')
});

async function verifyTables() {
  try {
    const connection = await pool.getConnection();
    
    console.log('Verifying COPPA compliance tables...\n');
    
    // Check PARENT_CONSENT_RECORDS
    const [consentTables] = await connection.query(
      "SHOW TABLES LIKE 'PARENT_CONSENT_RECORDS'"
    );
    console.log('✓ PARENT_CONSENT_RECORDS table:', consentTables.length > 0 ? 'EXISTS' : 'NOT FOUND');
    
    // Check AGE_VERIFICATION_AUDIT
    const [auditTables] = await connection.query(
      "SHOW TABLES LIKE 'AGE_VERIFICATION_AUDIT'"
    );
    console.log('✓ AGE_VERIFICATION_AUDIT table:', auditTables.length > 0 ? 'EXISTS' : 'NOT FOUND');
    
    // Count records in PARENT_CONSENT_RECORDS
    const [consentCount] = await connection.query(
      'SELECT COUNT(*) as count FROM PARENT_CONSENT_RECORDS'
    );
    console.log('\nPARENT_CONSENT_RECORDS records:', consentCount[0].count);
    
    // Count records in AGE_VERIFICATION_AUDIT
    const [auditCount] = await connection.query(
      'SELECT COUNT(*) as count FROM AGE_VERIFICATION_AUDIT'
    );
    console.log('AGE_VERIFICATION_AUDIT records:', auditCount[0].count);
    
    // Sample consent records
    const [sampleRecords] = await connection.query(`
      SELECT 
        pcr.id,
        pcr.family_member_id,
        pcr.parent_email,
        pcr.consent_given,
        pcr.consent_timestamp,
        pcr.expires_at,
        pcr.is_active
      FROM PARENT_CONSENT_RECORDS pcr
      LIMIT 5
    `);
    
    if (sampleRecords.length > 0) {
      console.log('\nSample consent records:');
      console.table(sampleRecords);
    }
    
    connection.release();
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifyTables();
