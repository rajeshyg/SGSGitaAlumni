import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkTables() {
  let connection;

  try {
    console.log('🔍 Checking tables in sgsgita_alumni database...');

    const config = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
      connectTimeout: 60000,
    };

    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database successfully!');

    // List all tables
    console.log('📊 Listing all tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('Available tables:');

    if (tables.length === 0) {
      console.log('  No tables found in this database.');
    } else {
      tables.forEach((table, index) => {
        const tableName = Object.values(table)[0];
        console.log(`  ${index + 1}. ${tableName}`);
      });
    }

    // Look for tables that might contain file import data
    const possibleTables = tables.filter(table => {
      const tableName = Object.values(table)[0].toLowerCase();
      return tableName.includes('file') ||
             tableName.includes('import') ||
             tableName.includes('upload') ||
             tableName.includes('csv') ||
             tableName.includes('data');
    });

    if (possibleTables.length > 0) {
      console.log('\n🎯 Possible data tables:');
      possibleTables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`  - ${tableName}`);
      });
    }

    // If no tables exist, suggest creating the file_imports table
    if (tables.length === 0) {
      console.log('\n📝 No tables found. You may need to create the file_imports table.');
      console.log('💡 Expected table structure:');
      console.log(`
CREATE TABLE file_imports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  upload_date DATETIME NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  records_count INT DEFAULT 0,
  processed_records INT DEFAULT 0,
  errors_count INT DEFAULT 0,
  uploaded_by VARCHAR(100),
  file_size VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
      `);
    }

    await connection.end();
    console.log('🔌 Connection closed.');

  } catch (error) {
    console.error('❌ Database operation failed:', error.message);
  }
}

checkTables();