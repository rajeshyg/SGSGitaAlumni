/**
 * Create POSTING_LIKES and POSTING_COMMENTS tables
 * These tables track user engagement with postings
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  connectTimeout: 60000,
};

async function createEngagementTables() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to database\n');

    // ========================================================================
    // Create POSTING_LIKES table
    // ========================================================================
    console.log('📋 Creating POSTING_LIKES table...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS POSTING_LIKES (
        id VARCHAR(36) PRIMARY KEY,
        posting_id VARCHAR(36) NOT NULL,
        user_id BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_posting_like (posting_id, user_id),
        INDEX idx_posting_likes (posting_id),
        INDEX idx_user_likes (user_id, created_at DESC),
        FOREIGN KEY (posting_id) REFERENCES POSTINGS(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ POSTING_LIKES table created\n');

    // ========================================================================
    // Create POSTING_COMMENTS table
    // ========================================================================
    console.log('📋 Creating POSTING_COMMENTS table...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS POSTING_COMMENTS (
        id VARCHAR(36) PRIMARY KEY,
        posting_id VARCHAR(36) NOT NULL,
        user_id BIGINT NOT NULL,
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_posting_comments (posting_id, created_at DESC),
        INDEX idx_user_comments (user_id, created_at DESC),
        FOREIGN KEY (posting_id) REFERENCES POSTINGS(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ POSTING_COMMENTS table created\n');

    // ========================================================================
    // Verify tables exist
    // ========================================================================
    console.log('📋 Verifying tables...');
    
    const [tables] = await connection.query(`
      SHOW TABLES LIKE 'POSTING_%'
    `);
    
    console.log(`✅ Found ${tables.length} posting engagement tables:`);
    tables.forEach(table => {
      console.log(`   - ${Object.values(table)[0]}`);
    });

    console.log('\n✅ Script completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
createEngagementTables();

