/**
 * Check POSTING_COMMENTS and POSTING_LIKES structures
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkPostingTables() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('=== POSTING_COMMENTS Structure ===\n');
    const [comments] = await connection.query('DESCRIBE POSTING_COMMENTS');
    comments.forEach(c => console.log(`  ${c.Field}: ${c.Type}`));

    console.log('\n=== POSTING_COMMENTS Foreign Keys ===\n');
    const [commentFks] = await connection.query(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'POSTING_COMMENTS' AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [process.env.DB_NAME]);
    commentFks.forEach(fk => console.log(`  ${fk.CONSTRAINT_NAME}: ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`));

    console.log('\n=== POSTING_LIKES Structure ===\n');
    const [likes] = await connection.query('DESCRIBE POSTING_LIKES');
    likes.forEach(c => console.log(`  ${c.Field}: ${c.Type}`));

    console.log('\n=== POSTING_LIKES Foreign Keys ===\n');
    const [likeFks] = await connection.query(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'POSTING_LIKES' AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [process.env.DB_NAME]);
    likeFks.forEach(fk => console.log(`  ${fk.CONSTRAINT_NAME}: ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkPostingTables();
