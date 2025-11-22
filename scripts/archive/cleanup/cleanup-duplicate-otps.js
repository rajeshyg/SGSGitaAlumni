// Cleanup Script: Remove duplicate/expired OTPs and old invitation links
// This script cleans up the database from accumulated test data

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function cleanupDatabase() {
  let connection;
  
  try {
    console.log('🔧 Starting database cleanup...\n');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database\n');

    // ========================================================================
    // STEP 1: Clean up expired OTPs
    // ========================================================================
    console.log('📋 Step 1: Cleaning up expired OTPs...');
    const [expiredResult] = await connection.execute(`
      DELETE FROM OTP_TOKENS
      WHERE expires_at < NOW()
    `);
    console.log(`   ✅ Deleted ${expiredResult.affectedRows} expired OTP records\n`);

    // ========================================================================
    // STEP 2: Clean up used OTPs older than 24 hours
    // ========================================================================
    console.log('📋 Step 2: Cleaning up old used OTPs...');
    const [usedResult] = await connection.execute(`
      DELETE FROM OTP_TOKENS
      WHERE is_used = TRUE
        AND used_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);
    console.log(`   ✅ Deleted ${usedResult.affectedRows} old used OTP records\n`);

    // ========================================================================
    // STEP 3: Find and mark duplicate active OTPs as used (keep only the most recent)
    // ========================================================================
    console.log('📋 Step 3: Handling duplicate active OTPs...');
    
    // Get emails with multiple active OTPs of the same type
    const [duplicates] = await connection.execute(`
      SELECT email, token_type, COUNT(*) as count
      FROM OTP_TOKENS
      WHERE expires_at > NOW()
        AND is_used = FALSE
      GROUP BY email, token_type
      HAVING count > 1
    `);

    console.log(`   Found ${duplicates.length} email/type combinations with duplicates`);

    for (const dup of duplicates) {
      // Keep only the most recent OTP, mark others as used
      await connection.execute(`
        UPDATE OTP_TOKENS
        SET is_used = TRUE, used_at = NOW()
        WHERE email = ?
          AND token_type = ?
          AND expires_at > NOW()
          AND is_used = FALSE
          AND id NOT IN (
            SELECT id FROM (
              SELECT id FROM OTP_TOKENS
              WHERE email = ?
                AND token_type = ?
                AND expires_at > NOW()
                AND is_used = FALSE
              ORDER BY created_at DESC
              LIMIT 1
            ) as keep_otp
          )
      `, [dup.email, dup.token_type, dup.email, dup.token_type]);
      
      console.log(`   ✅ Cleaned duplicates for ${dup.email} (${dup.token_type})`);
    }
    console.log();

    // ========================================================================
    // STEP 4: Clean up old expired invitations
    // ========================================================================
    console.log('📋 Step 4: Cleaning up expired invitations...');
    const [expiredInvites] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM USER_INVITATIONS
      WHERE expires_at < NOW()
        AND status = 'pending'
    `);
    
    if (expiredInvites[0].count > 0) {
      await connection.execute(`
        UPDATE USER_INVITATIONS
        SET status = 'expired'
        WHERE expires_at < NOW()
          AND status = 'pending'
      `);
      console.log(`   ✅ Marked ${expiredInvites[0].count} invitations as expired\n`);
    } else {
      console.log(`   ℹ️  No expired invitations found\n`);
    }

    // ========================================================================
    // STEP 5: Show summary of remaining active data
    // ========================================================================
    console.log('📊 Summary of remaining active data:\n');
    
    const [otpSummary] = await connection.execute(`
      SELECT token_type, COUNT(*) as count
      FROM OTP_TOKENS
      WHERE expires_at > NOW()
        AND is_used = FALSE
      GROUP BY token_type
    `);
    
    console.log('   Active OTPs by type:');
    if (otpSummary.length === 0) {
      console.log('   - None');
    } else {
      otpSummary.forEach(row => {
        console.log(`   - ${row.token_type}: ${row.count}`);
      });
    }
    console.log();

    const [inviteSummary] = await connection.execute(`
      SELECT status, COUNT(*) as count
      FROM USER_INVITATIONS
      GROUP BY status
    `);
    
    console.log('   Invitations by status:');
    inviteSummary.forEach(row => {
      console.log(`   - ${row.status}: ${row.count}`);
    });
    console.log();

    // ========================================================================
    // STEP 6: List remaining active OTPs for verification
    // ========================================================================
    console.log('📋 Remaining active OTPs:\n');
    const [activeOtps] = await connection.execute(`
      SELECT email, token_type, otp_code, 
             DATE_FORMAT(expires_at, '%Y-%m-%d %H:%i:%s') as expires_at,
             DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
      FROM OTP_TOKENS
      WHERE expires_at > NOW()
        AND is_used = FALSE
      ORDER BY email, token_type, created_at DESC
    `);

    if (activeOtps.length === 0) {
      console.log('   No active OTPs\n');
    } else {
      activeOtps.forEach(otp => {
        console.log(`   ${otp.email} | ${otp.token_type} | ${otp.otp_code} | Expires: ${otp.expires_at}`);
      });
      console.log();
    }

    console.log('✅ Database cleanup completed successfully!\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run cleanup
cleanupDatabase();
