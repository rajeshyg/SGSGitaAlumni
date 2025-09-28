// Script to run step 1 schema improvements
import mysql from 'mysql2/promise';
import fs from 'fs';
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

async function runStep1Improvements() {
  let connection;

  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('Connected to database successfully');

    // Read the SQL file
    const sqlContent = fs.readFileSync('schema-improvements-step1.sql', 'utf8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`\nExecuting ${statements.length} SQL statements...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.startsWith('--') || statement.length < 10) {
        continue;
      }

      try {
        console.log(`[${i + 1}/${statements.length}] ${statement.substring(0, 60)}...`);
        await connection.execute(statement);
        successCount++;
        console.log('✅ Success');
      } catch (error) {
        errorCount++;
        
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('⚠️  Column already exists (skipping)');
        } else {
          console.log('❌ Error:', error.message);
        }
      }
    }

    console.log(`\n=== STEP 1 SUMMARY ===`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);

    // Update existing data
    console.log('\n=== UPDATING EXISTING DATA ===');

    try {
      // Set status for existing alumni_members
      await connection.execute("UPDATE alumni_members SET status = 'active' WHERE status IS NULL");
      console.log('✅ Updated alumni_members status');

      // Set status for existing app_users
      await connection.execute("UPDATE app_users SET status = 'active' WHERE status IS NULL");
      console.log('✅ Updated app_users status');

      // Set email_verified for existing users
      await connection.execute("UPDATE app_users SET email_verified = TRUE, email_verified_at = created_at WHERE email_verified = FALSE");
      console.log('✅ Updated email verification status');

      // Extract names from admin user email and populate first_name, last_name
      const [adminUser] = await connection.execute('SELECT id, email FROM app_users WHERE id = 4600');
      if (adminUser.length > 0) {
        const email = adminUser[0].email;
        const emailParts = email.split('@')[0].split('.');
        const firstName = emailParts[0] || 'Admin';
        const lastName = emailParts[1] || 'User';
        
        await connection.execute(
          'UPDATE app_users SET first_name = ?, last_name = ? WHERE id = ?',
          [firstName.charAt(0).toUpperCase() + firstName.slice(1), 
           lastName.charAt(0).toUpperCase() + lastName.slice(1), 
           4600]
        );
        console.log('✅ Updated admin user names');
      }

    } catch (error) {
      console.log('❌ Error updating data:', error.message);
    }

    // Verify the changes
    console.log('\n=== VERIFYING CHANGES ===');

    const [alumniStructure] = await connection.execute('DESCRIBE alumni_members');
    console.log('\nAlumni Members - New Columns:');
    const newAlumniCols = alumniStructure.filter(col => 
      ['email', 'phone', 'status', 'invitation_sent_at', 'invitation_accepted_at', 'last_contact_attempt'].includes(col.Field)
    );
    console.table(newAlumniCols);

    const [usersStructure] = await connection.execute('DESCRIBE app_users');
    console.log('\nApp Users - New Columns:');
    const newUserCols = usersStructure.filter(col => 
      ['first_name', 'last_name', 'birth_date', 'phone', 'profile_image_url', 'bio', 
       'linkedin_url', 'current_position', 'company', 'location', 'status', 
       'email_verified', 'email_verified_at', 'last_login_at', 'login_count'].includes(col.Field)
    );
    console.table(newUserCols);

    // Test the user profile query with new columns
    console.log('\n=== TESTING USER PROFILE QUERY ===');
    const [testResult] = await connection.execute(`
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.status as user_status,
        u.email_verified,
        am.family_name,
        am.father_name,
        am.status as alumni_status
      FROM app_users u
      LEFT JOIN alumni_members am ON u.alumni_member_id = am.id
      WHERE u.id = 4600
    `);
    
    console.log('User 4600 profile data:', testResult[0]);

    console.log('\n✅ Step 1 schema improvements completed successfully!');

  } catch (error) {
    console.error('Error running step 1 improvements:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runStep1Improvements();
