// Debug the profile endpoint issue
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

async function debugProfileEndpoint() {
  let connection;

  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('Connected to database successfully');

    const userId = 4600;

    // Test the exact query from the updated endpoint
    console.log('\n=== TESTING UPDATED PROFILE QUERY ===');
    const query = `
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.status,
        u.is_active,
        u.birth_date,
        u.phone,
        u.profile_image_url,
        u.bio,
        u.linkedin_url,
        u.current_position,
        u.company,
        u.location,
        u.email_verified,
        u.email_verified_at,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        am.family_name,
        am.father_name,
        am.batch as graduation_year,
        am.center_name as program,
        am.result as alumni_position,
        am.category as alumni_category,
        am.phone as alumni_phone,
        am.email as alumni_email,
        am.student_id,
        am.status as alumni_status
      FROM app_users u
      LEFT JOIN alumni_members am ON u.alumni_member_id = am.id
      WHERE u.id = ? AND u.is_active = true
    `;

    const [rows] = await connection.execute(query, [userId]);
    
    if (rows.length === 0) {
      console.log('❌ No user found');
      return;
    }

    const row = rows[0];
    console.log('✅ Query successful, raw data:');
    console.log(row);

    // Build the response exactly like the endpoint
    const userProfile = {
      id: row.id,
      firstName: row.first_name || row.father_name || 'Unknown',
      lastName: row.last_name || row.family_name || 'Unknown',
      email: row.email,
      role: row.role,
      status: row.status,
      isActive: row.is_active,
      birthDate: row.birth_date,
      phone: row.phone || row.alumni_phone,
      profileImageUrl: row.profile_image_url,
      bio: row.bio,
      linkedinUrl: row.linkedin_url,
      currentPosition: row.current_position || row.alumni_position,
      company: row.company || row.alumni_category,
      location: row.location || row.program,
      graduationYear: row.graduation_year,
      program: row.program,
      emailVerified: !!row.email_verified,
      emailVerifiedAt: row.email_verified_at,
      lastLoginAt: row.last_login_at,
      isProfileComplete: !!(row.first_name && row.last_name) || !!(row.father_name && row.family_name),
      ageVerified: false,
      parentConsentRequired: false,
      parentConsentGiven: false,
      alumniProfile: row.alumni_member_id ? {
        familyName: row.family_name,
        fatherName: row.father_name,
        batch: row.graduation_year,
        centerName: row.program,
        result: row.alumni_position,
        category: row.alumni_category,
        phone: row.alumni_phone,
        email: row.alumni_email,
        studentId: row.student_id,
        status: row.alumni_status
      } : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    console.log('\n=== EXPECTED API RESPONSE ===');
    console.log(JSON.stringify(userProfile, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugProfileEndpoint();
