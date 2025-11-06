require('dotenv').config();

async function analyzeDatabase() {
  const { getPool } = await import('./utils/database.js');
  const pool = getPool();
  const conn = await pool.getConnection();
  
  try {
    console.log('=== CRITICAL DB ANALYSIS FOR MODERATION SYSTEM ===\n');
    
    // 1. Get actual table schemas
    console.log('1. POSTINGS TABLE COLUMNS:');
    const [postingsCols] = await conn.query(`SHOW FULL COLUMNS FROM POSTINGS`);
    postingsCols.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} | Collation: ${col.Collation || 'N/A'} | Null: ${col.Null} | Key: ${col.Key}`);
    });
    
    console.log('\n2. MODERATION_HISTORY TABLE COLUMNS:');
    const [modHistCols] = await conn.query(`SHOW FULL COLUMNS FROM MODERATION_HISTORY`);
    modHistCols.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} | Collation: ${col.Collation || 'N/A'} | Null: ${col.Null} | Key: ${col.Key}`);
    });
    
    console.log('\n3. POSTING_DOMAINS TABLE COLUMNS:');
    const [pdCols] = await conn.query(`SHOW FULL COLUMNS FROM POSTING_DOMAINS`);
    pdCols.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} | Collation: ${col.Collation || 'N/A'} | Null: ${col.Null} | Key: ${col.Key}`);
    });
    
    console.log('\n4. DOMAINS TABLE COLUMNS:');
    const [domainsCols] = await conn.query(`SHOW FULL COLUMNS FROM DOMAINS`);
    domainsCols.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} | Collation: ${col.Collation || 'N/A'} | Null: ${col.Null} | Key: ${col.Key}`);
    });
    
    // 2. Check indexes
    console.log('\n5. POSTINGS INDEXES:');
    const [postingsIdx] = await conn.query(`SHOW INDEX FROM POSTINGS`);
    const grouped = {};
    postingsIdx.forEach(idx => {
      if (!grouped[idx.Key_name]) grouped[idx.Key_name] = [];
      grouped[idx.Key_name].push(idx.Column_name);
    });
    Object.entries(grouped).forEach(([name, cols]) => {
      console.log(`  ${name}: [${cols.join(', ')}]`);
    });
    
    console.log('\n6. MODERATION_HISTORY INDEXES:');
    const [modHistIdx] = await conn.query(`SHOW INDEX FROM MODERATION_HISTORY`);
    const modGrouped = {};
    modHistIdx.forEach(idx => {
      if (!modGrouped[idx.Key_name]) modGrouped[idx.Key_name] = [];
      modGrouped[idx.Key_name].push(idx.Column_name);
    });
    Object.entries(modGrouped).forEach(([name, cols]) => {
      console.log(`  ${name}: [${cols.join(', ')}]`);
    });
    
    // 3. Check foreign keys
    console.log('\n7. FOREIGN KEY CONSTRAINTS:');
    const [fks] = await conn.query(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = 'sgs_alumni_portal'
      AND (TABLE_NAME IN ('POSTINGS', 'MODERATION_HISTORY', 'POSTING_DOMAINS'))
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    fks.forEach(fk => {
      console.log(`  ${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME} (${fk.CONSTRAINT_NAME})`);
    });
    
    // 4. Test the API query
    console.log('\n8. TESTING THE ACTUAL API QUERY:');
    console.log('Query from moderation.js line 158-175...\n');
    try {
      const [results] = await conn.query(`
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
          u.id as submitter_id
        FROM POSTINGS p
        INNER JOIN app_users u ON p.author_id = u.id
        LEFT JOIN POSTING_DOMAINS pd ON p.id COLLATE utf8mb4_unicode_ci = pd.posting_id COLLATE utf8mb4_unicode_ci AND pd.is_primary = 1
        LEFT JOIN DOMAINS d ON pd.domain_id COLLATE utf8mb4_unicode_ci = d.id COLLATE utf8mb4_unicode_ci
        WHERE p.moderation_status COLLATE utf8mb4_unicode_ci IN ('PENDING', 'ESCALATED')
        ORDER BY p.created_at ASC
        LIMIT 3
      `);
      console.log(`  ✓ Query executed successfully. ${results.length} results returned.`);
      if (results.length > 0) {
        console.log(`  Sample: ${results[0].title}`);
      }
    } catch (error) {
      console.error(`  ✗ QUERY FAILED:`, error.message);
      console.error(`  SQL State:`, error.sqlState);
      console.error(`  Error Code:`, error.code);
    }
    
    // 5. Test the subquery that counts moderation history
    console.log('\n9. TESTING MODERATION HISTORY SUBQUERY:');
    try {
      const [results] = await conn.query(`
        SELECT 
          p.id,
          p.title,
          (SELECT COUNT(*) 
           FROM MODERATION_HISTORY mh 
           WHERE mh.posting_id COLLATE utf8mb4_unicode_ci = p.id COLLATE utf8mb4_unicode_ci) as moderation_count
        FROM POSTINGS p
        WHERE p.moderation_status IN ('PENDING', 'ESCALATED')
        LIMIT 3
      `);
      console.log(`  ✓ Subquery executed successfully. ${results.length} results.`);
    } catch (error) {
      console.error(`  ✗ SUBQUERY FAILED:`, error.message);
    }
    
    // 6. Check if MODERATION_QUEUE table exists
    console.log('\n10. CHECKING FOR MODERATION_QUEUE TABLE:');
    const [tables] = await conn.query(`SHOW TABLES LIKE 'MODERATION_QUEUE'`);
    if (tables.length > 0) {
      console.log('  ✓ MODERATION_QUEUE table EXISTS');
      const [queueCols] = await conn.query(`SHOW FULL COLUMNS FROM MODERATION_QUEUE`);
      queueCols.forEach(col => {
        console.log(`    ${col.Field}: ${col.Type} | Collation: ${col.Collation || 'N/A'}`);
      });
    } else {
      console.log('  ✗ MODERATION_QUEUE table DOES NOT EXIST (might be a view or doesn\'t exist)');
    }
    
    // 7. Check app_users table
    console.log('\n11. APP_USERS TABLE (AUTHOR/MODERATOR REFERENCE):');
    const [usersCols] = await conn.query(`SHOW FULL COLUMNS FROM app_users WHERE Field = 'id'`);
    usersCols.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} | Collation: ${col.Collation || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('ANALYSIS FAILED:', error);
  } finally {
    conn.release();
    await pool.end();
  }
}

analyzeDatabase();
