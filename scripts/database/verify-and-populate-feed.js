/**
 * Verify Feed Tables and Populate Test Data
 * Task 7.4.1 - Dashboard Feed Integration
 * 
 * This script:
 * 1. Verifies ACTIVITY_FEED and FEED_ENGAGEMENT tables exist
 * 2. Checks if FEED_ENGAGEMENT_COUNTS view exists
 * 3. Verifies user 4600 exists and has valid data
 * 4. Populates sample feed data for testing
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
};

async function verifyAndPopulateFeed() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');
    
    // ========================================================================
    // STEP 1: Verify Tables Exist
    // ========================================================================
    console.log('📋 Step 1: Verifying tables exist...');
    
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('ACTIVITY_FEED', 'FEED_ENGAGEMENT')
    `, [process.env.DB_NAME]);
    
    const tableNames = tables.map(t => t.TABLE_NAME);
    console.log('Found tables:', tableNames);
    
    if (!tableNames.includes('ACTIVITY_FEED')) {
      console.error('❌ ACTIVITY_FEED table does not exist!');
      console.log('Run: node scripts/database/run-task-7-migrations.js');
      process.exit(1);
    }
    
    if (!tableNames.includes('FEED_ENGAGEMENT')) {
      console.error('❌ FEED_ENGAGEMENT table does not exist!');
      console.log('Run: node scripts/database/run-task-7-migrations.js');
      process.exit(1);
    }
    
    console.log('✅ Both tables exist\n');
    
    // ========================================================================
    // STEP 2: Verify View Exists
    // ========================================================================
    console.log('📋 Step 2: Verifying FEED_ENGAGEMENT_COUNTS view...');
    
    const [views] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.VIEWS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'FEED_ENGAGEMENT_COUNTS'
    `, [process.env.DB_NAME]);
    
    if (views.length === 0) {
      console.log('⚠️  View does not exist, creating it...');
      await connection.query(`
        CREATE OR REPLACE VIEW FEED_ENGAGEMENT_COUNTS AS
        SELECT 
          feed_item_id,
          SUM(CASE WHEN engagement_type = 'like' THEN 1 ELSE 0 END) as like_count,
          SUM(CASE WHEN engagement_type = 'comment' THEN 1 ELSE 0 END) as comment_count,
          SUM(CASE WHEN engagement_type = 'share' THEN 1 ELSE 0 END) as share_count
        FROM FEED_ENGAGEMENT
        GROUP BY feed_item_id
      `);
      console.log('✅ View created successfully');
    } else {
      console.log('✅ View exists\n');
    }
    
    // ========================================================================
    // STEP 3: Verify User 4600 Exists
    // ========================================================================
    console.log('📋 Step 3: Verifying user 4600 exists...');
    
    const [users] = await connection.query(`
      SELECT id, email, first_name, last_name, role 
      FROM app_users 
      WHERE id = 4600
    `);
    
    if (users.length === 0) {
      console.error('❌ User 4600 does not exist!');
      console.log('Please verify the correct user ID or create the user first.');
      process.exit(1);
    }
    
    const user = users[0];
    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.first_name} ${user.last_name}`);
    console.log(`   Role: ${user.role}\n`);
    
    if (!user.first_name || user.first_name === 'Unknown') {
      console.warn('⚠️  User has invalid first_name, updating...');
      await connection.query(`
        UPDATE app_users 
        SET first_name = 'Rajesh', last_name = 'Datta' 
        WHERE id = 4600
      `);
      console.log('✅ User name updated\n');
    }
    
    // ========================================================================
    // STEP 4: Check Existing Feed Data
    // ========================================================================
    console.log('📋 Step 4: Checking existing feed data...');
    
    const [existingFeed] = await connection.query(`
      SELECT COUNT(*) as count FROM ACTIVITY_FEED WHERE user_id = 4600
    `);
    
    console.log(`Found ${existingFeed[0].count} existing feed items for user 4600\n`);
    
    // ========================================================================
    // STEP 5: Populate Sample Feed Data
    // ========================================================================
    console.log('📋 Step 5: Populating sample feed data...');
    
    const feedItems = [
      {
        id: uuidv4(),
        user_id: '4600',
        item_type: 'posting',
        item_id: uuidv4(),
        title: 'Welcome to the Alumni Network',
        content: 'We are excited to launch our new alumni networking platform! Connect with fellow alumni, share opportunities, and stay engaged with our community.',
        author_id: '4600',
        author_name: `${user.first_name} ${user.last_name}`,
        author_avatar: null
      },
      {
        id: uuidv4(),
        user_id: '4600',
        item_type: 'event',
        item_id: uuidv4(),
        title: 'Annual Alumni Meet 2025',
        content: 'Join us for our annual alumni gathering on March 15, 2025. Reconnect with old friends, network with professionals, and celebrate our shared journey.',
        author_id: '4600',
        author_name: `${user.first_name} ${user.last_name}`,
        author_avatar: null
      },
      {
        id: uuidv4(),
        user_id: '4600',
        item_type: 'posting',
        item_id: uuidv4(),
        title: 'Job Opportunity: Senior Software Engineer',
        content: 'Our company is hiring! Looking for experienced software engineers with 5+ years of experience in React and Node.js. Great benefits and remote work options available.',
        author_id: '4600',
        author_name: `${user.first_name} ${user.last_name}`,
        author_avatar: null
      },
      {
        id: uuidv4(),
        user_id: '4600',
        item_type: 'achievement',
        item_id: uuidv4(),
        title: 'Congratulations on Your Promotion!',
        content: 'Celebrating a major career milestone - promoted to Director of Engineering at TechCorp. Grateful for the journey and the support from our alumni community.',
        author_id: '4600',
        author_name: `${user.first_name} ${user.last_name}`,
        author_avatar: null
      },
      {
        id: uuidv4(),
        user_id: '4600',
        item_type: 'connection',
        item_id: uuidv4(),
        title: 'New Connection',
        content: 'Connected with 5 new alumni members this week. Building our network stronger every day!',
        author_id: '4600',
        author_name: `${user.first_name} ${user.last_name}`,
        author_avatar: null
      }
    ];
    
    for (const item of feedItems) {
      await connection.query(`
        INSERT INTO ACTIVITY_FEED (
          id, user_id, item_type, item_id, title, content,
          author_id, author_name, author_avatar, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        item.id,
        item.user_id,
        item.item_type,
        item.item_id,
        item.title,
        item.content,
        item.author_id,
        item.author_name,
        item.author_avatar
      ]);
      
      console.log(`✅ Created feed item: ${item.title}`);
    }
    
    // ========================================================================
    // STEP 6: Add Sample Engagement Data
    // ========================================================================
    console.log('\n📋 Step 6: Adding sample engagement data...');
    
    // Add some likes to the first feed item
    const firstItemId = feedItems[0].id;
    const likeId = uuidv4();
    
    await connection.query(`
      INSERT INTO FEED_ENGAGEMENT (id, feed_item_id, user_id, engagement_type)
      VALUES (?, ?, ?, 'like')
    `, [likeId, firstItemId, '4600']);
    
    console.log('✅ Added sample like\n');
    
    // ========================================================================
    // STEP 7: Verify Feed Query Works
    // ========================================================================
    console.log('📋 Step 7: Testing feed query...');
    
    const [testFeed] = await connection.query(`
      SELECT 
        af.*,
        COALESCE(fec.like_count, 0) as likes,
        COALESCE(fec.comment_count, 0) as comments,
        COALESCE(fec.share_count, 0) as shares,
        EXISTS(
          SELECT 1 FROM FEED_ENGAGEMENT 
          WHERE feed_item_id = af.id 
          AND user_id = ? 
          AND engagement_type = 'like'
        ) as user_liked
      FROM ACTIVITY_FEED af
      LEFT JOIN FEED_ENGAGEMENT_COUNTS fec ON af.id = fec.feed_item_id
      WHERE af.user_id = ?
      ORDER BY af.created_at DESC
      LIMIT 10
    `, ['4600', '4600']);
    
    console.log(`✅ Feed query successful! Retrieved ${testFeed.length} items\n`);
    
    if (testFeed.length > 0) {
      console.log('Sample feed item:');
      console.log(`  Title: ${testFeed[0].title}`);
      console.log(`  Type: ${testFeed[0].item_type}`);
      console.log(`  Likes: ${testFeed[0].likes}`);
      console.log(`  Comments: ${testFeed[0].comments}`);
      console.log(`  Shares: ${testFeed[0].shares}`);
      console.log(`  User Liked: ${testFeed[0].user_liked ? 'Yes' : 'No'}\n`);
    }
    
    console.log('✅ All verification and population steps completed successfully!');
    console.log('\n🎉 Feed system is ready to use!');
    console.log('You can now test the /api/feed endpoint in your application.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
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
verifyAndPopulateFeed();

