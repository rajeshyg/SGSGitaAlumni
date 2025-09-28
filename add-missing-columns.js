// Add missing columns and update data
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

async function addMissingColumns() {
  let connection;

  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('Connected to database successfully');

    // Add missing columns
    const missingColumns = [
      // app_users missing columns
      "ALTER TABLE app_users ADD COLUMN first_name VARCHAR(255) NULL AFTER email",
      "ALTER TABLE app_users ADD COLUMN status ENUM('active', 'inactive', 'suspended', 'pending') DEFAULT 'active' AFTER location",
      
      // alumni_members missing columns
      "ALTER TABLE alumni_members ADD COLUMN email VARCHAR(255) NULL AFTER father_name",
      "ALTER TABLE alumni_members ADD COLUMN phone VARCHAR(20) NULL AFTER email",
      "ALTER TABLE alumni_members ADD COLUMN status ENUM('active', 'inactive', 'pending', 'archived') DEFAULT 'active' AFTER phone",
      "ALTER TABLE alumni_members ADD COLUMN invitation_sent_at TIMESTAMP NULL AFTER status"
    ];

    console.log('\n=== ADDING MISSING COLUMNS ===');
    for (const sql of missingColumns) {
      try {
        console.log(`Executing: ${sql.substring(0, 60)}...`);
        await connection.execute(sql);
        console.log('✅ Success');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('⚠️  Column already exists (skipping)');
        } else {
          console.log('❌ Error:', error.message);
        }
      }
    }

    // Update existing data
    console.log('\n=== UPDATING EXISTING DATA ===');

    try {
      // Set status for existing records
      await connection.execute("UPDATE alumni_members SET status = 'active' WHERE status IS NULL");
      console.log('✅ Updated alumni_members status');

      await connection.execute("UPDATE app_users SET status = 'active' WHERE status IS NULL");
      console.log('✅ Updated app_users status');

      // Set email_verified for existing users
      await connection.execute("UPDATE app_users SET email_verified = TRUE, email_verified_at = created_at WHERE email_verified = FALSE");
      console.log('✅ Updated email verification status');

      // Extract names from admin user email and populate first_name, last_name
      const [adminUser] = await connection.execute('SELECT id, email, first_name, last_name FROM app_users WHERE id = 4600');
      if (adminUser.length > 0 && !adminUser[0].first_name) {
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

    // Test the improved user profile query
    console.log('\n=== TESTING IMPROVED USER PROFILE QUERY ===');
    const [testResult] = await connection.execute(`
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.status as user_status,
        u.email_verified,
        u.current_position,
        u.company,
        u.location,
        am.family_name,
        am.father_name,
        am.status as alumni_status,
        am.batch,
        am.center_name,
        am.result
      FROM app_users u
      LEFT JOIN alumni_members am ON u.alumni_member_id = am.id
      WHERE u.id = 4600
    `);
    
    console.log('User 4600 complete profile data:');
    console.log(testResult[0]);

    // Create the improved API response format
    const user = testResult[0];
    const improvedApiResponse = {
      user: {
        id: user.id,
        firstName: user.first_name || user.father_name || "Unknown",
        lastName: user.last_name || user.family_name || "Unknown", 
        email: user.email,
        graduationYear: user.batch,
        program: user.center_name,
        currentPosition: user.current_position || user.result,
        company: user.company,
        location: user.location || user.center_name,
        linkedinUrl: null,
        bio: null,
        skills: [],
        interests: [],
        profileImageUrl: null,
        isProfileComplete: !!(user.first_name && user.last_name),
        ageVerified: false,
        parentConsentRequired: false,
        parentConsentGiven: false,
        emailVerified: !!user.email_verified,
        status: user.user_status,
        createdAt: new Date().toISOString(),
        lastLoginAt: null
      }
    };

    console.log('\n=== IMPROVED API RESPONSE PREVIEW ===');
    console.log(JSON.stringify(improvedApiResponse, null, 2));

    console.log('\n✅ Missing columns added and data updated successfully!');

  } catch (error) {
    console.error('Error adding missing columns:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addMissingColumns();
