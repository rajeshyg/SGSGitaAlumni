/* CommonJS copy of create-test-postings.js for projects with "type":"module" */

// Load environment variables for DB access when running this script directly
require('dotenv').config();

async function createTestPostings() {
  const { getPool } = await import('./utils/database.js');
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    console.log('Creating test postings for moderation queue...\n');
    
    // Note: Posting schema uses author_id and not domain_id; domains are mapped via POSTING_DOMAINS.
    
    // Get a test user (or create one)
    let [users] = await connection.query(
      `SELECT id FROM app_users WHERE email = 'testuser@example.com'`
    );
    
    let userId;
    if (users.length === 0) {
      console.log('Creating test user...');
      const [userResult] = await connection.query(
        `INSERT INTO app_users 
         (id, email, first_name, last_name, password_hash, role, email_verified, created_at)
         VALUES (UUID(), 'testuser@example.com', 'Test', 'User', 'hash', 'user', 1, NOW())`
      );
      [users] = await connection.query(
        `SELECT id FROM app_users WHERE email = 'testuser@example.com'`
      );
      userId = users[0].id;
      console.log('✓ Test user created');
    } else {
      userId = users[0].id;
      console.log('✓ Using existing test user');
    }
    
    // Create test postings
    const testPostings = [
      {
        title: 'Software Engineer Position - Urgent',
        description: 'We are looking for an experienced software engineer to join our team. Must have 5+ years of experience in full-stack development.',
        type: 'JOB',
        createdDaysAgo: 2 // Make it urgent (>24h)
      },
      {
        title: 'Mentorship Opportunity in Data Science',
        description: 'Offering free mentorship sessions for aspiring data scientists. Have 10 years of experience in ML/AI.',
        type: 'MENTORSHIP',
        createdDaysAgo: 0
      },
      {
        title: 'Help Needed: Career Guidance',
        description: 'Looking for advice on transitioning from academic research to industry. Any insights would be appreciated!',
        type: 'HELP',
        createdDaysAgo: 0
      },
      {
        title: 'Senior Product Manager Role Available',
        description: 'Exciting opportunity for a senior product manager at a fast-growing startup. Remote work available.',
        type: 'JOB',
        createdDaysAgo: 1
      },
      {
        title: 'Free Workshop on Cloud Computing',
        description: 'Conducting a free workshop on AWS and cloud architecture. Limited seats available.',
        type: 'MENTORSHIP',
        createdDaysAgo: 0
      }
    ];
    
    let created = 0;
    for (const posting of testPostings) {
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - posting.createdDaysAgo);
      
      // Insert according to current POSTINGS schema: author_id (bigint), title, content, posting_type, contact fields, expires_at, status/moderation_status
      const expiresAt = new Date(createdAt);
      expiresAt.setDate(expiresAt.getDate() + 30);

      await connection.query(
        `INSERT INTO POSTINGS 
         (id, author_id, title, content, posting_type, contact_name, contact_email, expires_at, status, moderation_status, version, created_at)
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, 'pending_review', 'PENDING', 1, ?)`,
        [
          userId,
          posting.title,
          posting.description || posting.content || posting.body,
          posting.type === 'JOB' ? 'offer_support' : posting.type === 'HELP' ? 'seek_support' : 'offer_support',
          'Test User',
          'testuser@example.com',
          expiresAt,
          createdAt
        ]
      );
      
      created++;
      console.log(`✓ Created: ${posting.title}`);
    }
    
    console.log(`\n✅ Created ${created} test postings successfully!`);
    console.log('\nThese postings are now in PENDING status and ready for moderation.');
    console.log('Login as a moderator to review them at /moderator/queue\n');
    
    // Show summary
    const [stats] = await connection.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN moderation_status = 'PENDING' THEN 1 END) as pending,
        COUNT(CASE WHEN created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as urgent
       FROM POSTINGS
       WHERE moderation_status = 'PENDING'`
    );
    
    console.log('Current Queue Stats:');
    console.log(`  Pending: ${stats[0].pending}`);
    console.log(`  Urgent (>24h): ${stats[0].urgent}`);
    
  } catch (error) {
    console.error('❌ Error creating test postings:', error.message);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

// Run the script
createTestPostings();
