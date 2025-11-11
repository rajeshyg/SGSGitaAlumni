import { getPool } from './utils/database.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runMigration() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    const pool = getPool();
    connection = await pool.getConnection();

    console.log('✅ Connected to database\n');

    // Step 0: Fix existing postings first
    console.log('📋 Step 0: Fixing existing postings that violate 30-day minimum...');
    const [initialUpdateResult] = await connection.query(`
      UPDATE POSTINGS
      SET expires_at = DATE_ADD(created_at, INTERVAL 30 DAY)
      WHERE expires_at < DATE_ADD(created_at, INTERVAL 30 DAY)
    `);
    console.log(`✅ Updated ${initialUpdateResult.affectedRows} postings\n`);

    // Step 1: Add CHECK constraint
    console.log('📋 Step 1: Adding CHECK constraint for 30-day minimum...');
    try {
      await connection.query(`
        ALTER TABLE POSTINGS
        ADD CONSTRAINT check_expiry_minimum_30_days
        CHECK (expires_at >= DATE_ADD(created_at, INTERVAL 30 DAY))
      `);
      console.log('✅ CHECK constraint added\n');
    } catch (err) {
      if (err.code === 'ER_CHECK_CONSTRAINT_DUP_NAME') {
        console.log('⚠️  CHECK constraint already exists\n');
      } else {
        throw err;
      }
    }

    // Step 2: Create stored function
    console.log('📋 Step 2: Creating calculate_expiry_date function...');
    try {
      // Drop function if exists
      await connection.query('DROP FUNCTION IF EXISTS calculate_expiry_date');
      
      // Create function
      await connection.query(`
        CREATE FUNCTION calculate_expiry_date(
          p_user_date DATETIME,
          p_created_at DATETIME
        ) 
        RETURNS DATETIME
        DETERMINISTIC
        NO SQL
        COMMENT 'Calculate posting expiry date with 30-day minimum enforcement'
        BEGIN
          DECLARE v_minimum_date DATETIME;
          DECLARE v_final_date DATETIME;
          
          SET v_minimum_date = DATE_ADD(p_created_at, INTERVAL 30 DAY);
          
          IF p_user_date IS NOT NULL THEN
            SET v_final_date = GREATEST(p_user_date, v_minimum_date);
          ELSE
            SET v_final_date = v_minimum_date;
          END IF;
          
          RETURN v_final_date;
        END
      `);
      console.log('✅ Function created\n');
    } catch (err) {
      console.error('❌ Failed to create function:', err.message);
      throw err;
    }

    // Step 3: Create INSERT trigger
    console.log('📋 Step 3a: Creating INSERT trigger...');
    try {
      await connection.query('DROP TRIGGER IF EXISTS posting_expiry_before_insert');
      await connection.query(`
        CREATE TRIGGER posting_expiry_before_insert
        BEFORE INSERT ON POSTINGS
        FOR EACH ROW
        BEGIN
          SET NEW.expires_at = calculate_expiry_date(NEW.expires_at, NEW.created_at);
        END
      `);
      console.log('✅ INSERT trigger created\n');
    } catch (err) {
      console.error('❌ Failed to create INSERT trigger:', err.message);
      throw err;
    }

    // Step 4: Create UPDATE trigger
    console.log('📋 Step 3b: Creating UPDATE trigger...');
    try {
      await connection.query('DROP TRIGGER IF EXISTS posting_expiry_before_update');
      await connection.query(`
        CREATE TRIGGER posting_expiry_before_update
        BEFORE UPDATE ON POSTINGS
        FOR EACH ROW
        BEGIN
          IF NEW.expires_at IS NOT NULL AND NEW.expires_at != OLD.expires_at THEN
            SET NEW.expires_at = calculate_expiry_date(NEW.expires_at, OLD.created_at);
          END IF;
        END
      `);
      console.log('✅ UPDATE trigger created\n');
    } catch (err) {
      console.error('❌ Failed to create UPDATE trigger:', err.message);
      throw err;
    }

    // Step 5: Verify all postings comply (should be 0 now)
    console.log('📋 Step 5: Verifying all postings comply...');
    const [verifyResult] = await connection.query(`
      SELECT COUNT(*) as violating_count
      FROM POSTINGS
      WHERE expires_at < DATE_ADD(created_at, INTERVAL 30 DAY)
    `);
    
    if (verifyResult[0].violating_count > 0) {
      console.log(`⚠️  Found ${verifyResult[0].violating_count} postings still violating 30-day minimum`);
    } else {
      console.log('✅ All postings comply with 30-day minimum\n');
    }

    console.log('✅ Migration completed successfully!\n');

    // Verify the changes
    console.log('🔍 Verifying migration...\n');

    // Check constraint
    const [constraints] = await connection.query(`
      SELECT CONSTRAINT_NAME, CHECK_CLAUSE 
      FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
      WHERE TABLE_NAME = 'POSTINGS' 
      AND CONSTRAINT_SCHEMA = 'sgs_alumni_portal_db'
      AND CONSTRAINT_NAME = 'check_expiry_minimum_30_days'
    `);

    if (constraints.length > 0) {
      console.log('✅ CHECK constraint added:');
      console.log(`   ${constraints[0].CONSTRAINT_NAME}: ${constraints[0].CHECK_CLAUSE}`);
    } else {
      console.log('⚠️  CHECK constraint not found (may not be visible in MySQL <8.0.16)');
    }

    // Check function
    const [functions] = await connection.query(`
      SELECT ROUTINE_NAME, ROUTINE_TYPE
      FROM INFORMATION_SCHEMA.ROUTINES
      WHERE ROUTINE_SCHEMA = 'sgs_alumni_portal_db'
      AND ROUTINE_NAME = 'calculate_expiry_date'
    `);

    if (functions.length > 0) {
      console.log('✅ Function created: calculate_expiry_date');
    } else {
      console.log('❌ Function not created');
    }

    // Check triggers
    const [triggers] = await connection.query(`
      SELECT TRIGGER_NAME, EVENT_MANIPULATION
      FROM INFORMATION_SCHEMA.TRIGGERS
      WHERE TRIGGER_SCHEMA = 'sgs_alumni_portal_db'
      AND TRIGGER_NAME IN ('posting_expiry_before_insert', 'posting_expiry_before_update')
    `);

    if (triggers.length >= 2) {
      console.log('✅ Triggers created:');
      triggers.forEach(t => console.log(`   - ${t.TRIGGER_NAME} (${t.EVENT_MANIPULATION})`));
    } else {
      console.log(`⚠️  Expected 2 triggers, found ${triggers.length}`);
    }

    // Check sample postings
    console.log('\n📊 Sample postings after migration:\n');
    const [postings] = await connection.query(`
      SELECT id, title, 
             created_at,
             expires_at,
             DATEDIFF(expires_at, created_at) as days_active,
             CASE 
               WHEN DATEDIFF(expires_at, created_at) < 30 THEN '❌ VIOLATION'
               ELSE '✅ OK'
             END as status
      FROM POSTINGS
      ORDER BY created_at DESC
      LIMIT 5
    `);

    postings.forEach(p => {
      console.log(`${p.status} ${p.title.substring(0, 40)}...`);
      console.log(`   Created: ${p.created_at.toISOString().split('T')[0]}`);
      console.log(`   Expires: ${p.expires_at.toISOString().split('T')[0]}`);
      console.log(`   Duration: ${p.days_active} days\n`);
    });

    console.log('\n✅ Migration verification complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
      console.log('\n🔌 Database connection released');
    }
  }
}

runMigration();
