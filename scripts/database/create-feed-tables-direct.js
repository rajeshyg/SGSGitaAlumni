/**
 * Direct Feed Tables Creation Script
 * Creates ACTIVITY_FEED and FEED_ENGAGEMENT tables directly
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
};

async function createFeedTables() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Database: ${dbConfig.database}`);
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');
    
    // Create ACTIVITY_FEED table
    console.log('📋 Creating ACTIVITY_FEED table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ACTIVITY_FEED (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        item_type ENUM('posting', 'event', 'connection', 'achievement') NOT NULL,
        item_id VARCHAR(36) NOT NULL,
        title VARCHAR(255),
        content TEXT,
        author_id VARCHAR(36),
        author_name VARCHAR(255),
        author_avatar VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_feed (user_id, created_at DESC),
        INDEX idx_type_feed (item_type, created_at DESC),
        INDEX idx_author_feed (author_id, created_at DESC),
        INDEX idx_item_lookup (item_type, item_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ ACTIVITY_FEED table created\n');
    
    // Create FEED_ENGAGEMENT table
    console.log('📋 Creating FEED_ENGAGEMENT table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS FEED_ENGAGEMENT (
        id VARCHAR(36) PRIMARY KEY,
        feed_item_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        engagement_type ENUM('like', 'comment', 'share') NOT NULL,
        comment_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_item_like (feed_item_id, user_id, engagement_type),
        INDEX idx_feed_engagement (feed_item_id, engagement_type),
        INDEX idx_user_engagement (user_id, created_at DESC),
        FOREIGN KEY (feed_item_id) REFERENCES ACTIVITY_FEED(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ FEED_ENGAGEMENT table created\n');
    
    // Create FEED_ENGAGEMENT_COUNTS view
    console.log('📋 Creating FEED_ENGAGEMENT_COUNTS view...');
    await connection.execute(`
      CREATE OR REPLACE VIEW FEED_ENGAGEMENT_COUNTS AS
      SELECT 
        feed_item_id,
        SUM(CASE WHEN engagement_type = 'like' THEN 1 ELSE 0 END) as like_count,
        SUM(CASE WHEN engagement_type = 'comment' THEN 1 ELSE 0 END) as comment_count,
        SUM(CASE WHEN engagement_type = 'share' THEN 1 ELSE 0 END) as share_count
      FROM FEED_ENGAGEMENT
      GROUP BY feed_item_id
    `);
    console.log('✅ FEED_ENGAGEMENT_COUNTS view created\n');
    
    // Verify tables
    console.log('🔍 Verifying tables...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('ACTIVITY_FEED', 'FEED_ENGAGEMENT')
    `, [dbConfig.database]);
    
    console.log('✅ Tables created:');
    tables.forEach(table => {
      console.log(`   - ${table.TABLE_NAME}`);
    });
    
    // Verify view
    const [views] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.VIEWS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'FEED_ENGAGEMENT_COUNTS'
    `, [dbConfig.database]);
    
    if (views.length > 0) {
      console.log('   - FEED_ENGAGEMENT_COUNTS (view)');
    }
    
    console.log('\n✅ All tables and views created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

createFeedTables();

