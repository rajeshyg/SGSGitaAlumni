import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com',
  user: 'sgsgita_alumni_user',
  password: '2FvT6j06sfI',
  database: 'sgsgita_alumni',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10
});

async function runMigration() {
  const connection = await pool.getConnection();
  
  try {
    console.log('\n🔍 Current CONVERSATIONS schema:');
    const [schema] = await connection.query('DESCRIBE CONVERSATIONS');
    console.table(schema);

    console.log('\n📊 Current conversation types:');
    const [types] = await connection.query(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(CASE WHEN posting_id IS NOT NULL THEN 1 ELSE 0 END) as with_posting,
        SUM(CASE WHEN is_group = 1 THEN 1 ELSE 0 END) as is_group_true
      FROM CONVERSATIONS
      GROUP BY type
    `);
    console.table(types);

    console.log('\n💾 Creating backup table...');
    await connection.query('CREATE TABLE IF NOT EXISTS CONVERSATIONS_BACKUP_20251110 AS SELECT * FROM CONVERSATIONS');
    console.log('✅ Backup created: CONVERSATIONS_BACKUP_20251110');

    console.log('\n🔄 Migrating POST_LINKED conversations...');
    
    // POST_LINKED with 2 participants → DIRECT
    const [result1] = await connection.query(`
      UPDATE CONVERSATIONS c
      SET c.type = 'DIRECT'
      WHERE c.type = 'POST_LINKED'
        AND (
          SELECT COUNT(*) 
          FROM CONVERSATION_PARTICIPANTS cp 
          WHERE cp.conversation_id = c.id AND cp.left_at IS NULL
        ) = 2
    `);
    console.log(`✅ Migrated ${result1.affectedRows} POST_LINKED conversations to DIRECT`);

    // POST_LINKED with 3+ participants → GROUP
    const [result2] = await connection.query(`
      UPDATE CONVERSATIONS c
      SET c.type = 'GROUP'
      WHERE c.type = 'POST_LINKED'
        AND (
          SELECT COUNT(*) 
          FROM CONVERSATION_PARTICIPANTS cp 
          WHERE cp.conversation_id = c.id AND cp.left_at IS NULL
        ) > 2
    `);
    console.log(`✅ Migrated ${result2.affectedRows} POST_LINKED conversations to GROUP`);

    console.log('\n📊 After migration:');
    const [afterMigration] = await connection.query(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(CASE WHEN posting_id IS NOT NULL THEN 1 ELSE 0 END) as with_posting
      FROM CONVERSATIONS
      GROUP BY type
    `);
    console.table(afterMigration);

    console.log('\n🗑️  Dropping redundant columns...');
    
    // Check if columns exist before dropping
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'sgsgita_alumni' 
        AND TABLE_NAME = 'CONVERSATIONS' 
        AND COLUMN_NAME IN ('is_group', 'posting_title')
    `);
    
    const hasIsGroup = columns.some(c => c.COLUMN_NAME === 'is_group');
    const hasPostingTitle = columns.some(c => c.COLUMN_NAME === 'posting_title');

    if (hasIsGroup) {
      await connection.query('ALTER TABLE CONVERSATIONS DROP COLUMN is_group');
      console.log('✅ Dropped is_group column');
    } else {
      console.log('⏭️  is_group column already dropped');
    }

    if (hasPostingTitle) {
      await connection.query('ALTER TABLE CONVERSATIONS DROP COLUMN posting_title');
      console.log('✅ Dropped posting_title column');
    } else {
      console.log('⏭️  posting_title column already dropped');
    }

    console.log('\n🔧 Updating type enum...');
    await connection.query(`
      ALTER TABLE CONVERSATIONS 
        MODIFY COLUMN type ENUM('DIRECT', 'GROUP') NOT NULL
    `);
    console.log('✅ Updated type enum to DIRECT and GROUP only');

    console.log('\n🔍 Final schema:');
    const [finalSchema] = await connection.query('DESCRIBE CONVERSATIONS');
    console.table(finalSchema);

    console.log('\n📊 Final data distribution:');
    const [finalData] = await connection.query(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(CASE WHEN posting_id IS NOT NULL THEN 1 ELSE 0 END) as post_linked,
        SUM(CASE WHEN posting_id IS NULL THEN 1 ELSE 0 END) as regular_chat
      FROM CONVERSATIONS
      GROUP BY type
    `);
    console.table(finalData);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n💡 To rollback: DROP TABLE CONVERSATIONS; RENAME TABLE CONVERSATIONS_BACKUP_20251110 TO CONVERSATIONS;');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
