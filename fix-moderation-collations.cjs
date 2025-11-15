const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixModerationCollations() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      charset: 'utf8mb4'
    });

    console.log('🔧 Fixing collation mismatches in moderation tables...\n');

    // The issue: POSTINGS uses utf8mb4_unicode_ci, but MODERATION_HISTORY uses utf8mb4_0900_ai_ci
    // This causes JOIN failures in the moderation queue query

    console.log('1. Checking current collations...');

    // Check POSTINGS table collation
    const [postingsCols] = await connection.query(
      `SELECT COLUMN_NAME, COLLATION_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'POSTINGS' AND COLUMN_NAME IN ('id', 'moderation_status')`,
      [process.env.DB_NAME]
    );

    // Check MODERATION_HISTORY table collation
    const [modHistoryCols] = await connection.query(
      `SELECT COLUMN_NAME, COLLATION_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'MODERATION_HISTORY' AND COLUMN_NAME IN ('posting_id', 'moderator_id')`,
      [process.env.DB_NAME]
    );

    console.log('POSTINGS collations:');
    postingsCols.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.COLLATION_NAME}`);
    });

    console.log('MODERATION_HISTORY collations:');
    modHistoryCols.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.COLLATION_NAME}`);
    });

    // Fix MODERATION_HISTORY columns to match POSTINGS
    console.log('\n2. Fixing MODERATION_HISTORY collation to match POSTINGS...');

    await connection.query(`ALTER TABLE MODERATION_HISTORY MODIFY COLUMN posting_id CHAR(36) COLLATE utf8mb4_unicode_ci`);
    console.log('  ✅ Fixed MODERATION_HISTORY.posting_id collation');

    await connection.query(`ALTER TABLE MODERATION_HISTORY MODIFY COLUMN moderator_id CHAR(36) COLLATE utf8mb4_unicode_ci`);
    console.log('  ✅ Fixed MODERATION_HISTORY.moderator_id collation');

    // Also fix other string columns in MODERATION_HISTORY
    await connection.query(`ALTER TABLE MODERATION_HISTORY MODIFY COLUMN action VARCHAR(20) COLLATE utf8mb4_unicode_ci`);
    await connection.query(`ALTER TABLE MODERATION_HISTORY MODIFY COLUMN reason TEXT COLLATE utf8mb4_unicode_ci`);
    await connection.query(`ALTER TABLE MODERATION_HISTORY MODIFY COLUMN feedback_to_user TEXT COLLATE utf8mb4_unicode_ci`);
    await connection.query(`ALTER TABLE MODERATION_HISTORY MODIFY COLUMN moderator_notes TEXT COLLATE utf8mb4_unicode_ci`);
    console.log('  ✅ Fixed all MODERATION_HISTORY string columns collation');

    // Test the moderation queue query
    console.log('\n3. Testing moderation queue query...');

    try {
      const [rows] = await connection.query(`
        SELECT
          p.id,
          p.title,
          p.content as description,
          p.posting_type,
          pd.domain_id,
          p.moderation_status,
          p.created_at,
          p.expires_at,
          p.version,
          d.name as domain_name,
          u.first_name,
          u.last_name,
          u.email as submitter_email,
          u.id as submitter_id,
          (SELECT COUNT(*)
           FROM MODERATION_HISTORY mh
           WHERE mh.posting_id = p.id) as moderation_count
        FROM POSTINGS p
        INNER JOIN app_users u ON p.author_id = u.id
        LEFT JOIN POSTING_DOMAINS pd ON p.id = pd.posting_id AND pd.is_primary = 1
        LEFT JOIN DOMAINS d ON pd.domain_id = d.id
        WHERE p.moderation_status IN ('PENDING', 'ESCALATED')
        LIMIT 1
      `);

      console.log('✅ Moderation queue query works! Found', rows.length, 'results');

    } catch (err) {
      console.log('❌ Moderation queue query still fails:', err.message);
    }

  } catch (error) {
    console.error('Database error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixModerationCollations();