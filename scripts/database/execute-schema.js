/**
 * Execute SQL schema file using Node.js
 */
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  multipleStatements: true
};

async function executeSqlFile(sqlFilePath) {
  let connection;
  
  try {
    console.log('📂 Reading SQL file:', sqlFilePath);
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to:', DB_CONFIG.database);
    
    console.log('⚙️  Executing SQL statements...\n');
    const [results] = await connection.query(sqlContent);
    
    console.log('✅ SQL executed successfully!\n');
    
    // Show any result messages
    if (Array.isArray(results)) {
      results.forEach((result, index) => {
        if (result && typeof result === 'object') {
          console.log(`Result ${index + 1}:`, result);
        }
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error executing SQL:', error.message);
    throw error;
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

const sqlFile = path.join(__dirname, 'migrations/create-family-members-tables.sql');
executeSqlFile(sqlFile)
  .then(() => {
    console.log('\n✨ Schema creation completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
