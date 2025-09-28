import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const saltRounds = 12;

// Database configuration
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

async function createAdminUser() {
  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('Connected to database');

    const email = 'datta.rajesh@gmail.com';
    const firstName = 'Rajesh';
    const lastName = 'Yarlagadda';
    const password = 'Admin123!';

    // Check if user already exists in app_users table
    const [existingUsers] = await connection.execute(
      'SELECT id FROM app_users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      console.log(`User with email ${email} already exists in users table`);
      return;
    }

    // Check if user data exists in raw_csv_uploads table
    const [uploadRecords] = await connection.execute(
      'SELECT * FROM raw_csv_uploads WHERE ROW_DATA LIKE ?',
      [`%${email}%`]
    );

    let userData = null;
    if (uploadRecords.length > 0) {
      // Find the record with the matching name "Rajesh Yarlagadda"
      const rajeshRecord = uploadRecords.find(record => {
        const rowData = record.ROW_DATA;
        return rowData.Name === 'Rajesh Yarlagadda' && rowData.Email === email;
      });

      if (rajeshRecord) {
        userData = rajeshRecord.ROW_DATA;
        console.log('Found Rajesh Yarlagadda data in raw_csv_uploads table:', userData);
      } else {
        // If no exact match, use the first record
        userData = uploadRecords[0].ROW_DATA;
        console.log('Using first matching record from raw_csv_uploads table:', userData);
      }
    }

    // Generate UUID for user
    const userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin user with data from upload table if available
    const graduationYear = userData?.batch ? parseInt(userData.batch.replace('B', '')) : null;
    const program = userData?.result || null;
    const phone = userData?.Phone || null;
    const familyId = userData?.familyId || null;
    const studentId = userData?.studentId || null;
    const familyName = userData?.FamilyName || null;
    const centerName = userData?.centerName || null;

    await connection.execute(`
      INSERT INTO app_users (
        id, email, password_hash, role, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, 'admin', 1, NOW(), NOW())
    `, [
      userId, email, hashedPassword
    ]);

    console.log(`Admin user created successfully with email: ${email}`);
    console.log(`Name: ${firstName} ${lastName}`);
    console.log(`Password: ${password}`);
    console.log(`Migrated from file upload table: ${userData ? 'Yes' : 'No'}`);

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the function
createAdminUser();