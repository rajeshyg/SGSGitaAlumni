#!/usr/bin/env node

/**
 * Populate ACTIVITY_FEED table from existing POSTINGS
 * This script creates feed items for all active postings so they appear in member dashboards
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sgsgitaalumni',
  port: parseInt(process.env.DB_PORT || '3306', 10)
};

async function populateFeedFromPostings() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`   Database: ${dbConfig.database}\n`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');
    
    // ========================================================================
    // STEP 1: Check if ACTIVITY_FEED table exists
    // ========================================================================
    console.log('📋 Step 1: Checking ACTIVITY_FEED table...');
    
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'ACTIVITY_FEED'
    `, [dbConfig.database]);
    
    if (tables.length === 0) {
      console.error('❌ ACTIVITY_FEED table does not exist!');
      console.log('   Please run: node scripts/database/create-feed-tables-direct.js');
      process.exit(1);
    }
    
    console.log('✅ ACTIVITY_FEED table exists\n');
    
    // ========================================================================
    // STEP 2: Get all active postings
    // ========================================================================
    console.log('📋 Step 2: Fetching active postings...');
    
    const [postings] = await connection.query(`
      SELECT
        p.id,
        p.title,
        p.content,
        p.author_id,
        p.created_at,
        u.first_name,
        u.last_name,
        u.profile_image_url
      FROM POSTINGS p
      LEFT JOIN app_users u ON p.author_id = u.id
      WHERE p.status = 'active'
      ORDER BY p.created_at DESC
    `);
    
    console.log(`✅ Found ${postings.length} active postings\n`);
    
    if (postings.length === 0) {
      console.log('⚠️  No active postings found. Nothing to populate.');
      return;
    }
    
    // ========================================================================
    // STEP 3: Get all app users to create feed items for each
    // ========================================================================
    console.log('📋 Step 3: Fetching all app users...');
    
    const [users] = await connection.query(`
      SELECT id FROM app_users WHERE status = 'active'
    `);
    
    console.log(`✅ Found ${users.length} active users\n`);
    
    if (users.length === 0) {
      console.log('⚠️  No active users found. Nothing to populate.');
      return;
    }
    
    // ========================================================================
    // STEP 4: Clear existing feed items (optional - for clean slate)
    // ========================================================================
    console.log('📋 Step 4: Clearing existing feed items...');
    
    const [deleteResult] = await connection.query(`
      DELETE FROM ACTIVITY_FEED WHERE item_type = 'posting'
    `);
    
    console.log(`✅ Deleted ${deleteResult.affectedRows} existing posting feed items\n`);
    
    // ========================================================================
    // STEP 5: Create feed items for each user for each posting
    // ========================================================================
    console.log('📋 Step 5: Creating feed items...');
    console.log(`   Creating ${postings.length} × ${users.length} = ${postings.length * users.length} feed items\n`);
    
    let insertedCount = 0;
    const batchSize = 100;
    const values = [];
    
    for (const posting of postings) {
      const authorName = posting.first_name && posting.last_name 
        ? `${posting.first_name} ${posting.last_name}`.trim()
        : 'Anonymous';
      
      for (const user of users) {
        values.push([
          uuidv4(),                           // id
          user.id,                            // user_id
          'posting',                          // item_type
          posting.id,                         // item_id
          posting.title,                      // title
          posting.content,                    // content
          posting.author_id,                  // author_id
          authorName,                         // author_name
          posting.profile_image_url || null,  // author_avatar
          posting.created_at                  // created_at
        ]);
        
        // Insert in batches
        if (values.length >= batchSize) {
          await connection.query(`
            INSERT INTO ACTIVITY_FEED (
              id, user_id, item_type, item_id, title, content,
              author_id, author_name, author_avatar, created_at
            ) VALUES ?
          `, [values]);
          
          insertedCount += values.length;
          console.log(`   Inserted ${insertedCount} feed items...`);
          values.length = 0; // Clear array
        }
      }
    }
    
    // Insert remaining items
    if (values.length > 0) {
      await connection.query(`
        INSERT INTO ACTIVITY_FEED (
          id, user_id, item_type, item_id, title, content,
          author_id, author_name, author_avatar, created_at
        ) VALUES ?
      `, [values]);
      
      insertedCount += values.length;
    }
    
    console.log(`\n✅ Successfully inserted ${insertedCount} feed items\n`);
    
    // ========================================================================
    // STEP 6: Verify feed items
    // ========================================================================
    console.log('📋 Step 6: Verifying feed items...');
    
    const [feedCount] = await connection.query(`
      SELECT COUNT(*) as count FROM ACTIVITY_FEED WHERE item_type = 'posting'
    `);
    
    console.log(`✅ Total posting feed items in database: ${feedCount[0].count}\n`);
    
    // ========================================================================
    // STEP 7: Show sample feed items
    // ========================================================================
    console.log('📋 Step 7: Sample feed items...');
    
    const [sampleFeed] = await connection.query(`
      SELECT 
        af.id,
        af.user_id,
        af.title,
        af.author_name,
        af.created_at
      FROM ACTIVITY_FEED af
      WHERE af.item_type = 'posting'
      ORDER BY af.created_at DESC
      LIMIT 5
    `);
    
    console.log('Sample feed items:');
    sampleFeed.forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.title}" by ${item.author_name}`);
      console.log(`      User: ${item.user_id}, Created: ${item.created_at}`);
    });
    
    console.log('\n✅ Feed population complete!');
    console.log('   Users should now see postings in their dashboard feed.\n');
    
  } catch (error) {
    console.error('❌ Error populating feed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
populateFeedFromPostings()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

