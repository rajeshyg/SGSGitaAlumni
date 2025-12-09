import dotenv from 'dotenv';
import { getPool } from '../../utils/database.js';

dotenv.config();

async function checkUserInvitations() {
  const pool = getPool();
  
  try {
    console.log('🔍 Checking USER_INVITATIONS table structure...');
    console.log('');
    
    // Get table structure
    const [columns] = await pool.execute('DESCRIBE USER_INVITATIONS');
    
    console.log('📋 Table columns:');
    columns.forEach(col => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'} ${col.Key ? `[${col.Key}]` : ''} ${col.Default ? `default=${col.Default}` : ''}`);
    });
    console.log('');
    
    // Get existing invitations count
    const [count] = await pool.execute('SELECT COUNT(*) as count FROM USER_INVITATIONS');
    console.log(`📊 Total invitations: ${count[0].count}`);
    
    // Get recent invitations
    const [recent] = await pool.execute(
      `SELECT id, email, invitation_type, token, status, expires_at, invited_by
       FROM USER_INVITATIONS 
       ORDER BY created_at DESC 
       LIMIT 5`
    );
    
    console.log('');
    console.log('📨 Recent invitations:');
    if (recent.length === 0) {
      console.log('   No invitations found');
    } else {
      recent.forEach((inv, i) => {
        console.log(`   ${i + 1}. ${inv.email} - ${inv.status} - Type: ${inv.invitation_type} - Invited by: ${inv.invited_by}`);
        console.log(`      Token: ${inv.token?.substring(0, 30)}...`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkUserInvitations();
