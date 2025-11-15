import dotenv from 'dotenv';
dotenv.config();

import { getPool } from './utils/database.js';

(async () => {
  const pool = getPool();
  
  try {
    // Check app_users record (MySQL uses ? placeholders, not $1)
    const userResult = await pool.query(
      'SELECT * FROM app_users WHERE email = ?',
      ['harshayarlagadda2@gmail.com']
    );
    
    console.log('=== APP USER RECORD ===');
    console.log(JSON.stringify(userResult[0], null, 2));
    
    if (userResult[0].length > 0) {
      const userId = userResult[0][0].id; // Changed from user_id to id
      
      // Check family members
      const familyResult = await pool.query(
        'SELECT * FROM FAMILY_MEMBERS WHERE parent_user_id = ?',
        [userId]
      );
      
      console.log('\n=== FAMILY MEMBERS ===');
      console.log(JSON.stringify(familyResult[0], null, 2));
      
      // Check family invitations
      const invitationResult = await pool.query(
        'SELECT * FROM FAMILY_INVITATIONS WHERE parent_user_id = ?',
        [userId]
      );
      
      console.log('\n=== FAMILY INVITATIONS ===');
      console.log(JSON.stringify(invitationResult[0], null, 2));
      
      // Count family members
      console.log(`\n=== SUMMARY ===`);
      console.log(`User ID: ${userId}`);
      console.log(`Total family members: ${familyResult[0].length}`);
      console.log(`Total invitations: ${invitationResult[0].length}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
})();
