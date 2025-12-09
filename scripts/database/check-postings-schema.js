/**
 * Check POSTINGS table structure and FKs
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkPostingsSchema() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('=== POSTINGS Table Structure ===\n');
    const [columns] = await connection.query('DESCRIBE POSTINGS');
    columns.forEach(c => console.log(`  ${c.Field}: ${c.Type} ${c.Null === 'NO' ? 'NOT NULL' : ''}`));

    console.log('\n=== Foreign Keys on POSTINGS ===\n');
    const [fks] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME, 
        COLUMN_NAME, 
        REFERENCED_TABLE_NAME, 
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'POSTINGS' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [process.env.DB_NAME]);
    
    if (fks.length === 0) {
      console.log('  No foreign keys found');
    } else {
      fks.forEach(fk => {
        console.log(`  ${fk.CONSTRAINT_NAME}: ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkPostingsSchema();
