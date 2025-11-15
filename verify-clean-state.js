// Verification Script: Show current clean state of database
// This displays the current active invitations and OTPs

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function verifyCleanState() {
  let connection;
  
  try {
    console.log('🔍 Verifying database clean state...\n');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database\n');

    // ========================================================================
    // Active Invitations
    // ========================================================================
    console.log('📧 ACTIVE INVITATIONS (Pending & Not Expired):\n');
    const [activeInvites] = await connection.execute(`
      SELECT 
        email,
        status,
        DATE_FORMAT(expires_at, '%Y-%m-%d %H:%i:%s') as expires_at,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,
        DATE_FORMAT(last_resent_at, '%Y-%m-%d %H:%i:%s') as last_resent_at,
        SUBSTRING(invitation_token, 1, 50) as token_preview
      FROM USER_INVITATIONS
      WHERE status = 'pending'
        AND expires_at > NOW()
      ORDER BY email
    `);

    if (activeInvites.length === 0) {
      console.log('   ℹ️  No active pending invitations\n');
    } else {
      activeInvites.forEach((inv, idx) => {
        console.log(`   ${idx + 1}. ${inv.email}`);
        console.log(`      Status: ${inv.status}`);
        console.log(`      Created: ${inv.created_at}`);
        console.log(`      Expires: ${inv.expires_at}`);
        if (inv.last_resent_at) {
          console.log(`      Last Resent: ${inv.last_resent_at}`);
        }
        console.log();
      });
    }

    // ========================================================================
    // Active OTPs
    // ========================================================================
    console.log('🔑 ACTIVE OTPs (Not Used & Not Expired):\n');
    const [activeOtps] = await connection.execute(`
      SELECT 
        email,
        token_type,
        otp_code,
        DATE_FORMAT(expires_at, '%Y-%m-%d %H:%i:%s') as expires_at,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
      FROM OTP_TOKENS
      WHERE is_used = FALSE
        AND expires_at > NOW()
      ORDER BY email, token_type, created_at DESC
    `);

    if (activeOtps.length === 0) {
      console.log('   ℹ️  No active OTPs\n');
    } else {
      activeOtps.forEach((otp, idx) => {
        console.log(`   ${idx + 1}. ${otp.email} (${otp.token_type})`);
        console.log(`      Code: ${otp.otp_code}`);
        console.log(`      Expires: ${otp.expires_at}`);
        console.log();
      });
    }

    // ========================================================================
    // Summary Statistics
    // ========================================================================
    console.log('📊 SUMMARY:\n');
    
    const [invitationStats] = await connection.execute(`
      SELECT status, COUNT(*) as count
      FROM USER_INVITATIONS
      GROUP BY status
    `);
    
    console.log('   Invitations by status:');
    invitationStats.forEach(stat => {
      console.log(`   - ${stat.status}: ${stat.count}`);
    });
    console.log();

    const [otpStats] = await connection.execute(`
      SELECT 
        CASE 
          WHEN is_used = TRUE THEN 'used'
          WHEN expires_at < NOW() THEN 'expired'
          ELSE 'active'
        END as status,
        COUNT(*) as count
      FROM OTP_TOKENS
      GROUP BY status
    `);
    
    console.log('   OTPs by status:');
    if (otpStats.length === 0) {
      console.log('   - None in database\n');
    } else {
      otpStats.forEach(stat => {
        console.log(`   - ${stat.status}: ${stat.count}`);
      });
      console.log();
    }

    // ========================================================================
    // Duplicate Check
    // ========================================================================
    console.log('🔍 DUPLICATE CHECK:\n');
    
    const [dupOtps] = await connection.execute(`
      SELECT email, token_type, COUNT(*) as count
      FROM OTP_TOKENS
      WHERE is_used = FALSE
        AND expires_at > NOW()
      GROUP BY email, token_type
      HAVING count > 1
    `);

    if (dupOtps.length === 0) {
      console.log('   ✅ No duplicate active OTPs found\n');
    } else {
      console.log('   ⚠️  Found duplicate active OTPs:\n');
      dupOtps.forEach(dup => {
        console.log(`   - ${dup.email} (${dup.token_type}): ${dup.count} records`);
      });
      console.log();
    }

    const [dupInvites] = await connection.execute(`
      SELECT email, COUNT(*) as count
      FROM USER_INVITATIONS
      WHERE status = 'pending'
        AND expires_at > NOW()
      GROUP BY email
      HAVING count > 1
    `);

    if (dupInvites.length === 0) {
      console.log('   ✅ No duplicate pending invitations found\n');
    } else {
      console.log('   ⚠️  Found duplicate pending invitations:\n');
      dupInvites.forEach(dup => {
        console.log(`   - ${dup.email}: ${dup.count} records`);
      });
      console.log();
    }

    console.log('✅ Verification complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyCleanState();
