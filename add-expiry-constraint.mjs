import { getPool } from './utils/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function addConstraint() {
  let connection;
  
  try {
    console.log('🔄 Adding CHECK constraint for 30-day minimum...\n');
    
    const pool = getPool();
    connection = await pool.getConnection();

    // First, verify all postings comply
    const [violations] = await connection.query(`
      SELECT COUNT(*) as count
      FROM POSTINGS
      WHERE expires_at < DATE_ADD(created_at, INTERVAL 30 DAY)
    `);

    if (violations[0].count > 0) {
      console.log(`⚠️  Found ${violations[0].count} postings violating 30-day minimum.`);
      console.log('   Fixing them first...\n');
      
      const [result] = await connection.query(`
        UPDATE POSTINGS
        SET expires_at = DATE_ADD(created_at, INTERVAL 30 DAY)
        WHERE expires_at < DATE_ADD(created_at, INTERVAL 30 DAY)
      `);
      
      console.log(`✅ Fixed ${result.affectedRows} postings\n`);
    } else {
      console.log('✅ All postings already comply\n');
    }

    // Now add the constraint
    try {
      await connection.query(`
        ALTER TABLE POSTINGS
        ADD CONSTRAINT check_expiry_minimum_30_days
        CHECK (expires_at >= DATE_ADD(created_at, INTERVAL 30 DAY))
      `);
      console.log('✅ CHECK constraint added successfully!\n');
    } catch (err) {
      if (err.code === 'ER_CHECK_CONSTRAINT_DUP_NAME') {
        console.log('ℹ️  CHECK constraint already exists\n');
      } else {
        throw err;
      }
    }

    // Verify
    const [constraints] = await connection.query(`
      SELECT CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = 'sgs_alumni_portal_db'
      AND TABLE_NAME = 'POSTINGS'
      AND CONSTRAINT_NAME = 'check_expiry_minimum_30_days'
    `);

    if (constraints.length > 0) {
      console.log('✅ Verification: Constraint is active\n');
    } else {
      console.log('⚠️  Verification: Constraint not found (may not be visible in INFORMATION_SCHEMA)\n');
    }

  } catch (error) {
    console.error('❌ Failed:', error.message);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

addConstraint();
