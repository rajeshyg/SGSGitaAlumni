// Cleanup Script: Remove duplicate/old invitation records
// This script helps clean up multiple invitation records for the same email

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function cleanupInvitations() {
  let connection;
  
  try {
    console.log('🔧 Starting invitation cleanup...\n');
    
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
    // STEP 1: Show current invitation status
    // ========================================================================
    console.log('📋 Current invitation status:\n');
    const [currentStatus] = await connection.execute(`
      SELECT 
        email,
        status,
        DATE_FORMAT(expires_at, '%Y-%m-%d %H:%i:%s') as expires_at,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,
        DATE_FORMAT(last_resent_at, '%Y-%m-%d %H:%i:%s') as last_resent_at,
        SUBSTRING(invitation_token, 1, 40) as token_preview
      FROM USER_INVITATIONS
      ORDER BY email, created_at DESC
    `);

    const emailGroups = {};
    currentStatus.forEach(inv => {
      if (!emailGroups[inv.email]) {
        emailGroups[inv.email] = [];
      }
      emailGroups[inv.email].push(inv);
    });

    Object.keys(emailGroups).forEach(email => {
      const invitations = emailGroups[email];
      console.log(`\n   ${email} (${invitations.length} invitation(s)):`);
      invitations.forEach((inv, idx) => {
        console.log(`     ${idx + 1}. Status: ${inv.status} | Created: ${inv.created_at} | Expires: ${inv.expires_at}`);
        if (inv.last_resent_at) {
          console.log(`        Last Resent: ${inv.last_resent_at}`);
        }
      });
    });
    console.log('\n');

    // ========================================================================
    // STEP 2: Mark expired invitations
    // ========================================================================
    console.log('📋 Step 1: Marking expired invitations...');
    const [expiredResult] = await connection.execute(`
      UPDATE USER_INVITATIONS
      SET status = 'expired'
      WHERE expires_at < NOW()
        AND status = 'pending'
    `);
    console.log(`   ✅ Marked ${expiredResult.affectedRows} invitations as expired\n`);

    // ========================================================================
    // STEP 3: Find emails with multiple pending invitations
    // ========================================================================
    console.log('📋 Step 2: Finding duplicate pending invitations...');
    const [duplicates] = await connection.execute(`
      SELECT email, COUNT(*) as count
      FROM USER_INVITATIONS
      WHERE status = 'pending'
        AND expires_at > NOW()
      GROUP BY email
      HAVING count > 1
    `);

    console.log(`   Found ${duplicates.length} emails with multiple pending invitations\n`);

    if (duplicates.length > 0) {
      console.log('   Keeping only the most recently sent invitation for each email...\n');
      
      for (const dup of duplicates) {
        // Get all pending invitations for this email
        const [allInvites] = await connection.execute(`
          SELECT id, 
                 DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,
                 DATE_FORMAT(last_resent_at, '%Y-%m-%d %H:%i:%s') as last_resent_at
          FROM USER_INVITATIONS
          WHERE email = ?
            AND status = 'pending'
            AND expires_at > NOW()
          ORDER BY COALESCE(last_resent_at, created_at) DESC
        `, [dup.email]);

        // Keep the first one (most recent), cancel the rest
        const keepId = allInvites[0].id;
        const cancelIds = allInvites.slice(1).map(inv => inv.id);

        if (cancelIds.length > 0) {
          await connection.execute(`
            UPDATE USER_INVITATIONS
            SET status = 'cancelled'
            WHERE id IN (${cancelIds.join(',')})
          `);
          
          console.log(`   ✅ ${dup.email}: Kept ID ${keepId}, cancelled ${cancelIds.length} duplicate(s)`);
        }
      }
      console.log();
    }

    // ========================================================================
    // STEP 4: Clean up old cancelled/expired invitations (older than 7 days)
    // ========================================================================
    console.log('📋 Step 3: Removing old cancelled/expired invitations...');
    const [cleanupResult] = await connection.execute(`
      DELETE FROM USER_INVITATIONS
      WHERE status IN ('cancelled', 'expired', 'accepted')
        AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    console.log(`   ✅ Deleted ${cleanupResult.affectedRows} old invitation records\n`);

    // ========================================================================
    // STEP 5: Show final summary
    // ========================================================================
    console.log('📊 Final summary:\n');
    
    const [finalStatus] = await connection.execute(`
      SELECT status, COUNT(*) as count
      FROM USER_INVITATIONS
      GROUP BY status
    `);
    
    console.log('   Invitations by status:');
    finalStatus.forEach(row => {
      console.log(`   - ${row.status}: ${row.count}`);
    });
    console.log();

    const [activeInvites] = await connection.execute(`
      SELECT 
        email,
        status,
        DATE_FORMAT(expires_at, '%Y-%m-%d %H:%i:%s') as expires_at,
        DATE_FORMAT(COALESCE(last_resent_at, created_at), '%Y-%m-%d %H:%i:%s') as last_sent
      FROM USER_INVITATIONS
      WHERE status = 'pending'
        AND expires_at > NOW()
      ORDER BY email
    `);

    console.log('   Active pending invitations:');
    if (activeInvites.length === 0) {
      console.log('   - None\n');
    } else {
      activeInvites.forEach(inv => {
        console.log(`   - ${inv.email} | Expires: ${inv.expires_at} | Last sent: ${inv.last_sent}`);
      });
      console.log();
    }

    console.log('✅ Invitation cleanup completed successfully!\n');

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
cleanupInvitations();
