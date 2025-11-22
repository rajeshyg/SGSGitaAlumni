import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function checkRefreshCollations() {
  try {
    console.log('Checking collations for refresh endpoint JOIN...\n');
    
    // Check app_users.primary_family_member_id collation
    const [appUsersCol] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_SET_NAME, COLLATION_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'app_users'
        AND COLUMN_NAME = 'primary_family_member_id'
    `, [process.env.DB_NAME]);
    
    console.log('app_users.primary_family_member_id:');
    console.table(appUsersCol);
    
    // Check FAMILY_MEMBERS.id collation
    const [familyMembersCol] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_SET_NAME, COLLATION_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'FAMILY_MEMBERS'
        AND COLUMN_NAME = 'id'
    `, [process.env.DB_NAME]);
    
    console.log('\nFAMILY_MEMBERS.id:');
    console.table(familyMembersCol);
    
    // Test the actual JOIN query that's failing
    console.log('\nTesting actual JOIN query from refresh endpoint...');
    const testUserId = 4600; // Use the admin user ID we found
    
    try {
      const [rows] = await pool.execute(
        `SELECT 
          u.id, u.email, u.role, u.is_active,
          u.first_name, u.last_name,
          u.is_family_account, u.family_account_type, u.primary_family_member_id,
          fm.first_name as family_first_name,
          fm.last_name as family_last_name,
          fm.display_name as family_display_name
        FROM app_users u
        LEFT JOIN FAMILY_MEMBERS fm ON u.primary_family_member_id = fm.id
        WHERE u.id = ? AND u.is_active = true`,
        [testUserId]
      );
      
      console.log('✅ JOIN query successful!');
      console.log('Rows returned:', rows.length);
      if (rows.length > 0) {
        console.table([{
          id: rows[0].id,
          email: rows[0].email,
          primary_family_member_id: rows[0].primary_family_member_id,
          family_first_name: rows[0].family_first_name
        }]);
      }
    } catch (joinError) {
      console.error('❌ JOIN query failed!');
      console.error('Error:', joinError.message);
      console.error('SQL State:', joinError.sqlState);
      console.error('SQL:', joinError.sql);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkRefreshCollations();
