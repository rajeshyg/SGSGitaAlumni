// Immediate fix for user 4600 profile issue
// This script will link the user to an appropriate alumni record or create profile data
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

async function fixUserProfile() {
  let connection;

  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('Connected to database successfully');

    const userId = 4600;
    const userEmail = 'datta.rajesh@gmail.com';

    // Option 1: Check if user already has an alumni_member_id
    console.log('\n=== CHECKING CURRENT USER STATUS ===');
    const [currentUser] = await connection.execute(
      'SELECT alumni_member_id FROM app_users WHERE id = ?',
      [userId]
    );

    if (currentUser[0].alumni_member_id) {
      console.log(`User ${userId} already linked to alumni_member ${currentUser[0].alumni_member_id}`);
      return;
    }

    // Option 2: Try to find an existing alumni record that might match
    console.log('\n=== SEARCHING FOR POTENTIAL ALUMNI MATCHES ===');

    // Look for records with similar names or that might be admin-related
    const [potentialMatches] = await connection.execute(`
      SELECT id, family_name, father_name, student_id, batch, user_id
      FROM alumni_members
      WHERE user_id IS NULL
      AND (family_name LIKE '%admin%' OR father_name LIKE '%admin%' OR student_id LIKE '%admin%')
      LIMIT 5
    `);

    console.log('Potential admin-related alumni records:', potentialMatches);

    if (potentialMatches.length > 0) {
      // Use the first potential match
      const matchedRecord = potentialMatches[0];
      console.log('Using existing alumni record:', matchedRecord);

      // Link the user to this alumni record
      await connection.execute(
        'UPDATE app_users SET alumni_member_id = ? WHERE id = ?',
        [matchedRecord.id, userId]
      );

      // Also update the alumni record to link back to the user
      await connection.execute(
        'UPDATE alumni_members SET user_id = ? WHERE id = ?',
        [userId, matchedRecord.id]
      );

      console.log(`✅ Linked user ${userId} to existing alumni_member ${matchedRecord.id}`);

    } else {
      console.log('No suitable existing alumni record found');

      // Option 3: Create a new alumni record for this admin user
      console.log('\n=== CREATING NEW ALUMNI RECORD FOR ADMIN ===');

      // Extract name from email (basic fallback)
      const emailParts = userEmail.split('@')[0].split('.');
      const firstName = emailParts[0] || 'Admin';
      const lastName = emailParts[1] || 'User';

      // Insert new alumni_members record (without email column since it doesn't exist)
      const [insertResult] = await connection.execute(`
        INSERT INTO alumni_members (
          family_name, father_name, student_id, batch,
          center_name, result, category, user_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        lastName.charAt(0).toUpperCase() + lastName.slice(1), // family_name
        firstName.charAt(0).toUpperCase() + firstName.slice(1), // father_name
        `ADMIN_${userId}`, // student_id
        'ADMIN', // batch
        'Administrative', // center_name
        'Administrator', // result
        'Admin', // category
        userId, // user_id (link back to app_users)
      ]);

      const newAlumniId = insertResult.insertId;
      console.log(`✅ Created new alumni_members record with ID: ${newAlumniId}`);

      // Link the user to this new alumni record
      await connection.execute(
        'UPDATE app_users SET alumni_member_id = ? WHERE id = ?',
        [newAlumniId, userId]
      );

      console.log(`✅ Linked user ${userId} to new alumni_member ${newAlumniId}`);
    }

    // Verify the fix
    console.log('\n=== VERIFYING THE FIX ===');
    const [verifyResult] = await connection.execute(`
      SELECT
        u.id,
        u.email,
        u.role,
        u.alumni_member_id,
        am.family_name,
        am.father_name,
        am.batch as graduation_year,
        am.center_name as program,
        am.result as current_position,
        am.category as company
      FROM app_users u
      LEFT JOIN alumni_members am ON u.alumni_member_id = am.id
      WHERE u.id = ?
    `, [userId]);

    console.log('Updated user profile data:', verifyResult[0]);

    // Test the API response format
    const user = verifyResult[0];
    const apiResponse = {
      user: {
        id: user.id,
        firstName: user.father_name || "Unknown",
        lastName: user.family_name || "Unknown", 
        email: user.email,
        graduationYear: user.graduation_year,
        program: user.program,
        currentPosition: user.current_position,
        company: user.company,
        location: user.program,
        linkedinUrl: null,
        bio: null,
        skills: [],
        interests: [],
        profileImageUrl: null,
        isProfileComplete: !!(user.father_name && user.family_name),
        ageVerified: false,
        parentConsentRequired: false,
        parentConsentGiven: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: null
      }
    };

    console.log('\n=== API RESPONSE PREVIEW ===');
    console.log(JSON.stringify(apiResponse, null, 2));

    console.log('\n✅ User profile fix completed successfully!');
    console.log('The Edit Profile screen should now show proper names instead of "Unknown"');

  } catch (error) {
    console.error('Error fixing user profile:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixUserProfile();
