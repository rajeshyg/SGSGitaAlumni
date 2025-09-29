// Debug script to understand the user profile issue
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
};

async function debugUserProfile() {
  let connection;

  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('Connected to database successfully');

    // 1. Check app_users table structure
    console.log('\n=== APP_USERS TABLE STRUCTURE ===');
    const [appUsersStructure] = await connection.execute('DESCRIBE app_users');
    console.table(appUsersStructure);

    // 2. Check alumni_members table structure
    console.log('\n=== ALUMNI_MEMBERS TABLE STRUCTURE ===');
    const [alumniMembersStructure] = await connection.execute('DESCRIBE alumni_members');
    console.table(alumniMembersStructure);

    // 3. Check current user 4600 data
    console.log('\n=== USER 4600 DATA ===');
    const [userData] = await connection.execute('SELECT * FROM app_users WHERE id = ?', [4600]);
    console.log('User 4600 data:', userData[0]);

    // 4. Check if user 4600 has alumni_member_id set
    const user = userData[0];
    if (user && user.alumni_member_id) {
      console.log('\n=== LINKED ALUMNI MEMBER DATA ===');
      const [alumniData] = await connection.execute('SELECT * FROM alumni_members WHERE id = ?', [user.alumni_member_id]);
      console.log('Linked alumni member data:', alumniData[0]);
    } else {
      console.log('\n=== NO ALUMNI_MEMBER_ID LINK ===');
      console.log('User 4600 has no alumni_member_id set');
      
      // Check if there are any alumni_members records
      const [alumniCount] = await connection.execute('SELECT COUNT(*) as total FROM alumni_members');
      console.log(`Total alumni_members records: ${alumniCount[0].total}`);
      
      if (alumniCount[0].total > 0) {
        console.log('\n=== SAMPLE ALUMNI_MEMBERS RECORDS ===');
        const [sampleAlumni] = await connection.execute('SELECT id, family_name, father_name, student_id, user_id FROM alumni_members LIMIT 5');
        console.table(sampleAlumni);
      }
    }

    // 5. Test the current API query
    console.log('\n=== TESTING CURRENT API QUERY ===');
    const query = `
      SELECT
        u.id,
        u.email,
        u.role,
        u.is_active,
        u.created_at,
        u.updated_at,
        am.family_name,
        am.father_name,
        am.batch as graduation_year,
        am.center_name as program,
        am.result as current_position,
        am.category as company,
        am.center_name as location
      FROM app_users u
      LEFT JOIN alumni_members am ON u.alumni_member_id = am.id
      WHERE u.id = ? AND u.is_active = true
    `;
    
    const [apiResult] = await connection.execute(query, [4600]);
    console.log('API query result:', apiResult[0]);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugUserProfile();
