import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { getPool } from '../../utils/database.js';

dotenv.config();

async function checkAdminLogin() {
  const pool = getPool();
  
  try {
    console.log('🔍 Checking admin account...');
    console.log('');
    
    // Check if admin account exists
    const [accounts] = await pool.execute(
      `SELECT id, email, role, status, password_hash, email_verified, requires_otp, 
              created_at, last_login_at
       FROM accounts 
       WHERE email = ?`,
      ['datta.rajesh@gmail.com']
    );
    
    if (accounts.length === 0) {
      console.log('❌ Admin account NOT found in accounts table!');
      console.log('');
      console.log('📌 To create the admin account, run:');
      console.log('   node scripts/debug/create-admin-account.js');
      process.exit(1);
    }
    
    const admin = accounts[0];
    console.log('✅ Admin account found:');
    console.log('   ID:', admin.id);
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('   Status:', admin.status);
    console.log('   Email Verified:', admin.email_verified);
    console.log('   Requires OTP:', admin.requires_otp);
    console.log('   Has Password:', admin.password_hash ? 'Yes' : 'No');
    console.log('   Created:', admin.created_at);
    console.log('   Last Login:', admin.last_login_at || 'Never');
    console.log('');
    
    // Test password
    const testPassword = 'Admin123!';
    if (admin.password_hash) {
      const isValidPassword = await bcrypt.compare(testPassword, admin.password_hash);
      console.log(`🔐 Password 'Admin123!' is: ${isValidPassword ? '✅ VALID' : '❌ INVALID'}`);
    } else {
      console.log('⚠️  No password hash set for admin account');
    }
    console.log('');
    
    // Check recent OTP tokens for admin
    const [otps] = await pool.execute(
      `SELECT id, email, token_type, is_used, used_at, expires_at, created_at
       FROM OTP_TOKENS 
       WHERE email = ?
       ORDER BY created_at DESC
       LIMIT 5`,
      ['datta.rajesh@gmail.com']
    );
    
    console.log('📨 Recent OTP tokens for admin:');
    if (otps.length === 0) {
      console.log('   No OTP tokens found');
    } else {
      otps.forEach((otp, i) => {
        console.log(`   ${i + 1}. Type: ${otp.token_type}, Used: ${otp.is_used ? 'Yes' : 'No'}, Expires: ${otp.expires_at}`);
      });
    }
    console.log('');
    
    // Summary and recommendations
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 DIAGNOSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const issues = [];
    
    if (admin.status !== 'active') {
      issues.push(`Account status is '${admin.status}' - needs to be 'active'`);
    }
    
    if (!admin.password_hash) {
      issues.push('No password hash set');
    }
    
    if (admin.password_hash) {
      const isValid = await bcrypt.compare(testPassword, admin.password_hash);
      if (!isValid) {
        issues.push("Password 'Admin123!' does not match stored hash");
      }
    }
    
    if (issues.length === 0) {
      console.log('✅ Account looks good! Login should work.');
      console.log('');
      console.log('📌 Login Flow:');
      console.log('   1. Go to /login');
      console.log('   2. Enter email: datta.rajesh@gmail.com');
      console.log('   3. Click "Send OTP" or enter password: Admin123!');
      console.log('   4. If OTP required, check admin panel at /admin for the OTP code');
    } else {
      console.log('❌ Issues found:');
      issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
      console.log('');
      console.log('📌 To fix, run: node scripts/debug/fix-admin-account.js');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkAdminLogin();
