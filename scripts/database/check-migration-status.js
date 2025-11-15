/**
 * Check family member migration status
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
};

async function checkMigrationStatus() {
  let connection;
  
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to database\n');
    
    const [totalUsers] = await connection.execute(
      'SELECT COUNT(*) as count FROM app_users'
    );
    
    const [familyMembers] = await connection.execute(
      'SELECT COUNT(*) as count FROM FAMILY_MEMBERS'
    );
    
    const [linkedUsers] = await connection.execute(
      'SELECT COUNT(*) as count FROM app_users WHERE primary_family_member_id IS NOT NULL'
    );
    
    const [selfMembers] = await connection.execute(
      'SELECT COUNT(*) as count FROM FAMILY_MEMBERS WHERE relationship = "self"'
    );
    
    console.log('═══════════════════════════════════════');
    console.log('MIGRATION STATUS');
    console.log('═══════════════════════════════════════');
    console.log(`Total app_users:           ${totalUsers[0].count}`);
    console.log(`Family members created:    ${familyMembers[0].count}`);
    console.log(`  └─ Self profiles:        ${selfMembers[0].count}`);
    console.log(`Users linked to families:  ${linkedUsers[0].count}`);
    console.log('═══════════════════════════════════════\n');
    
    if (familyMembers[0].count === totalUsers[0].count && 
        linkedUsers[0].count === totalUsers[0].count) {
      console.log('✅ Migration is COMPLETE!');
      console.log('   All users have been migrated to family member system.\n');
      return true;
    } else {
      console.log('⚠️  Migration is INCOMPLETE');
      console.log(`   Missing: ${totalUsers[0].count - familyMembers[0].count} family members`);
      console.log(`   Unlinked: ${totalUsers[0].count - linkedUsers[0].count} users\n`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkMigrationStatus()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
