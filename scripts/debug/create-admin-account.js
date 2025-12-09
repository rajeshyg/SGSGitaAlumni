import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../../utils/database.js';

dotenv.config();

async function createAdminAccount() {
  const pool = getPool();
  
  try {
    console.log('🔧 Creating admin account...');
    console.log('');
    
    const email = 'datta.rajesh@gmail.com';
    const password = 'Admin123!';
    const accountId = uuidv4();
    
    // Check if account already exists
    const [existing] = await pool.execute(
      'SELECT id, email, role FROM accounts WHERE email = ?',
      [email]
    );
    
    if (existing.length > 0) {
      console.log('⚠️  Admin account already exists:');
      console.log('   ID:', existing[0].id);
      console.log('   Role:', existing[0].role);
      console.log('');
      console.log('📌 Run node scripts/debug/fix-admin-account.js to update it');
      process.exit(0);
    }
    
    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create the admin account
    await pool.execute(
      `INSERT INTO accounts 
       (id, email, password_hash, role, status, email_verified, requires_otp, created_at, updated_at)
       VALUES (?, ?, ?, 'admin', 'active', TRUE, FALSE, NOW(), NOW())`,
      [accountId, email, passwordHash]
    );
    
    console.log('✅ Admin account created successfully!');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 ADMIN CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   Email:    datta.rajesh@gmail.com');
    console.log('   Password: Admin123!');
    console.log('   Role:     admin');
    console.log('   Status:   active');
    console.log('');
    console.log('📌 Login at: http://localhost:5173/login');
    
  } catch (error) {
    console.error('Error creating admin account:', error);
  } finally {
    process.exit(0);
  }
}

createAdminAccount();
