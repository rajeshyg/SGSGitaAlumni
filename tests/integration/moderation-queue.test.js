/**
 * Moderation Queue Integration Tests
 * 
 * Tests for the moderation queue endpoint
 * 
 * Task: Action 8 - Moderator Review System
 * Date: November 3, 2025
 */

const request = require('supertest');
const { app } = require('../../server');
const db = require('../../server/db');

describe('Moderation Queue API', () => {
  let moderatorToken;
  let testPostingId;
  let testUserId;

  beforeAll(async () => {
    // Create test moderator user
    const [userResult] = await db.query(
      `INSERT INTO app_users (id, email, first_name, last_name, password_hash, role, email_verified)
       VALUES (UUID(), 'moderator@test.com', 'Test', 'Moderator', 'hash', 'moderator', 1)`
    );
    
    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'moderator@test.com',
        password: 'testpass'
      });
    
    moderatorToken = loginRes.body.token;
    
    // Create test posting
    const [postingResult] = await db.query(
      `INSERT INTO POSTINGS (id, title, description, posting_type, domain_id, created_by, moderation_status)
       VALUES (UUID(), 'Test Posting', 'Test Description', 'JOB', ?, ?, 'PENDING')`,
      [testDomainId, userResult.insertId]
    );
    
    testPostingId = postingResult.insertId;
  });

  afterAll(async () => {
    // Cleanup
    await db.query('DELETE FROM POSTINGS WHERE id = ?', [testPostingId]);
    await db.query('DELETE FROM app_users WHERE email = ?', ['moderator@test.com']);
  });

  describe('GET /api/moderation/queue', () => {
    it('should return queue with pending postings', async () => {
      const res = await request(app)
        .get('/api/moderation/queue')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('postings');
      expect(res.body.data).toHaveProperty('pagination');
      expect(res.body.data).toHaveProperty('stats');
      expect(Array.isArray(res.body.data.postings)).toBe(true);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/moderation/queue?status=PENDING')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.postings.every(p => p.moderation_status === 'PENDING')).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/moderation/queue?page=1&limit=10')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.pagination.currentPage).toBe(1);
      expect(res.body.data.pagination.itemsPerPage).toBe(10);
    });

    it('should support search', async () => {
      const res = await request(app)
        .get('/api/moderation/queue?search=Test')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should support sorting', async () => {
      const res = await request(app)
        .get('/api/moderation/queue?sortBy=newest')
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/moderation/queue')
        .expect(401);
    });
  });

  describe('GET /api/moderation/posting/:id', () => {
    it('should return posting details with submitter stats', async () => {
      const res = await request(app)
        .get(`/api/moderation/posting/${testPostingId}`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('posting');
      expect(res.body.data).toHaveProperty('submitterStats');
      expect(res.body.data).toHaveProperty('moderationHistory');
    });

    it('should return 404 for non-existent posting', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .get(`/api/moderation/posting/${fakeId}`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/api/moderation/posting/${testPostingId}`)
        .expect(401);
    });
  });
});
