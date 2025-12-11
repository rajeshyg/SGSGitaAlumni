import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkChatCollations() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
  });

  console.log('Connected to database\n');

  const chatTables = [
    'CONVERSATIONS',
    'CONVERSATION_PARTICIPANTS',
    'MESSAGES',
    'MESSAGE_REACTIONS',
    'MESSAGE_READ_RECEIPTS'
  ];

  const relatedTables = [
    'user_profiles',
    'accounts',
    'alumni_members',
    'POSTINGS'
  ];

  try {
    // Check table collations
    console.log('=== CHAT TABLE COLLATIONS ===');
    const [chatTableInfo] = await pool.query(`
      SELECT TABLE_NAME, TABLE_COLLATION 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${chatTables.map(() => '?').join(',')})
    `, [process.env.DB_NAME, ...chatTables]);
    
    for (const table of chatTableInfo) {
      const status = table.TABLE_COLLATION === 'utf8mb4_0900_ai_ci' ? '✅' : '❌';
      console.log(`${status} ${table.TABLE_NAME}: ${table.TABLE_COLLATION}`);
    }

    console.log('\n=== RELATED TABLE COLLATIONS ===');
    const [relatedTableInfo] = await pool.query(`
      SELECT TABLE_NAME, TABLE_COLLATION 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${relatedTables.map(() => '?').join(',')})
    `, [process.env.DB_NAME, ...relatedTables]);
    
    for (const table of relatedTableInfo) {
      const status = table.TABLE_COLLATION === 'utf8mb4_0900_ai_ci' ? '✅' : '❌';
      console.log(`${status} ${table.TABLE_NAME}: ${table.TABLE_COLLATION}`);
    }

    // Check key column collations for JOIN operations
    console.log('\n=== KEY COLUMN COLLATIONS (for JOINs) ===');
    const keyColumns = [
      { table: 'CONVERSATIONS', column: 'id' },
      { table: 'CONVERSATIONS', column: 'created_by' },
      { table: 'CONVERSATIONS', column: 'posting_id' },
      { table: 'CONVERSATION_PARTICIPANTS', column: 'conversation_id' },
      { table: 'CONVERSATION_PARTICIPANTS', column: 'user_id' },
      { table: 'user_profiles', column: 'id' },
      { table: 'user_profiles', column: 'account_id' },
      { table: 'user_profiles', column: 'alumni_member_id' },
      { table: 'POSTINGS', column: 'id' },
      { table: 'accounts', column: 'id' },
      { table: 'alumni_members', column: 'id' }
    ];

    for (const { table, column } of keyColumns) {
      try {
        const [colInfo] = await pool.query(`
          SELECT COLUMN_NAME, COLLATION_NAME, COLUMN_TYPE, CHARACTER_SET_NAME
          FROM information_schema.COLUMNS 
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
        `, [process.env.DB_NAME, table, column]);
        
        if (colInfo.length > 0) {
          const col = colInfo[0];
          const status = col.COLLATION_NAME === 'utf8mb4_0900_ai_ci' ? '✅' : '❌';
          console.log(`${status} ${table}.${column}: ${col.COLUMN_TYPE} | collation=${col.COLLATION_NAME}`);
        } else {
          console.log(`⚠️  ${table}.${column}: NOT FOUND`);
        }
      } catch (e) {
        console.log(`❌ ${table}.${column}: ERROR - ${e.message}`);
      }
    }

    // Test the actual query that's failing
    console.log('\n=== TESTING GET /api/conversations QUERY ===');
    try {
      // Use a test profile ID (you may need to adjust this)
      const testProfileId = '00000000-0000-0000-0000-000000000000';
      const query = `
        SELECT
          c.*,
          am.first_name as creator_first_name,
          am.last_name as creator_last_name,
          p.title as posting_title,
          0 as unread_count
         FROM CONVERSATIONS c
         INNER JOIN CONVERSATION_PARTICIPANTS cp ON c.id = cp.conversation_id
         LEFT JOIN user_profiles up_creator ON c.created_by = up_creator.id
         LEFT JOIN accounts a ON up_creator.account_id = a.id
         LEFT JOIN alumni_members am ON up_creator.alumni_member_id = am.id
         LEFT JOIN POSTINGS p ON c.posting_id = p.id
         WHERE cp.user_id = ? AND cp.left_at IS NULL
         LIMIT 1
      `;
      
      const [result] = await pool.query(query, [testProfileId]);
      console.log('✅ Query executed successfully (no collation error)');
      console.log(`   Returned ${result.length} rows`);
    } catch (error) {
      console.log('❌ Query failed with error:');
      console.log(`   Code: ${error.code}`);
      console.log(`   Message: ${error.message}`);
      console.log(`   SQL Message: ${error.sqlMessage}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkChatCollations();

