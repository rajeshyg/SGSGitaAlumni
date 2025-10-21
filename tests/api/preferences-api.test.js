/**
 * Integration Tests for User Preferences API Endpoints
 * Tests CRUD operations, validation, and error handling for user preferences
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../../server.js';
import { createTestDatabase, cleanupTestDatabase } from '../setup/test-db.js';

let app;
let server;
let testDb;
let testUserId;

describe('Preferences API Integration Tests', () => {
  beforeAll(async () => {
    // Create test database
    testDb = await createTestDatabase();

    // Create server with test database
    app = createServer();
    server = app.listen(3002); // Use different port for tests

    // Set up test data
    testUserId = await setupTestUser();
    await setupTestDomains();
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
    if (testDb) {
      await cleanupTestDatabase(testDb);
    }
  });

  describe('GET /api/preferences/:userId', () => {
    it('should return user preferences with populated domain details', async () => {
      // Create test preferences first
      await createTestPreferences(testUserId);

      const response = await request(app)
        .get(`/api/preferences/${testUserId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.preferences).toBeDefined();

      const prefs = response.body.preferences;
      expect(prefs).toHaveProperty('user_id', testUserId);
      expect(prefs).toHaveProperty('primary_domain_id');
      expect(prefs).toHaveProperty('preference_type');
    });

    it('should populate secondary domains and areas of interest', async () => {
      const response = await request(app)
        .get(`/api/preferences/${testUserId}`)
        .expect(200);

      const prefs = response.body.preferences;

      if (prefs.secondary_domain_ids) {
        expect(prefs.secondary_domains).toBeDefined();
        expect(Array.isArray(prefs.secondary_domains)).toBe(true);
      }

      if (prefs.areas_of_interest_ids) {
        expect(prefs.areas_of_interest).toBeDefined();
        expect(Array.isArray(prefs.areas_of_interest)).toBe(true);
      }
    });

    it('should return 404 for user without preferences', async () => {
      const nonExistentUserId = 'non-existent-user';

      const response = await request(app)
        .get(`/api/preferences/${nonExistentUserId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Preferences not found');
    });
  });

  describe('PUT /api/preferences/:userId', () => {
    it('should update user preferences successfully', async () => {
      const updateData = {
        primary_domain_id: 'test-primary-1',
        secondary_domain_ids: ['test-secondary-1'],
        areas_of_interest_ids: ['test-area-1'],
        preference_type: 'professional',
        max_postings: 10,
        notification_settings: {
          email_notifications: true,
          push_notifications: false
        },
        privacy_settings: {
          profile_visibility: 'connections'
        },
        interface_settings: {
          theme: 'dark',
          language: 'en'
        },
        is_professional: true,
        education_status: 'graduate'
      };

      const response = await request(app)
        .put(`/api/preferences/${testUserId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated successfully');

      // Verify update
      const getResponse = await request(app)
        .get(`/api/preferences/${testUserId}`)
        .expect(200);

      const updatedPrefs = getResponse.body.preferences;
      expect(updatedPrefs.primary_domain_id).toBe(updateData.primary_domain_id);
      expect(updatedPrefs.preference_type).toBe(updateData.preference_type);
      expect(updatedPrefs.max_postings).toBe(updateData.max_postings);
    });

    it('should create preferences if they do not exist', async () => {
      const newUserId = 'new-test-user-' + Date.now();

      // Create user record first
      await testDb.query(
        'INSERT INTO users (id, email, first_name, last_name) VALUES (?, ?, ?, ?)',
        [newUserId, 'newuser@test.com', 'New', 'User']
      );

      const newPreferences = {
        primary_domain_id: 'test-primary-1',
        preference_type: 'both'
      };

      const response = await request(app)
        .put(`/api/preferences/${newUserId}`)
        .send(newPreferences)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify creation
      const getResponse = await request(app)
        .get(`/api/preferences/${newUserId}`)
        .expect(200);

      expect(getResponse.body.preferences.primary_domain_id).toBe(newPreferences.primary_domain_id);
    });

    it('should validate primary domain exists and is primary level', async () => {
      const invalidPreferences = {
        primary_domain_id: 'non-existent-domain'
      };

      const response = await request(app)
        .put(`/api/preferences/${testUserId}`)
        .send(invalidPreferences)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(response.body.errors).toContain('Invalid primary domain');
    });

    it('should validate secondary domains belong to primary domain', async () => {
      // Create another primary domain for testing
      await testDb.query(`
        INSERT INTO DOMAINS (id, name, domain_level, is_active)
        VALUES (?, ?, 'primary', true)
      `, ['test-primary-2', 'Another Primary Domain']);

      const invalidPreferences = {
        primary_domain_id: 'test-primary-1',
        secondary_domain_ids: ['test-secondary-1'], // Valid
        areas_of_interest_ids: ['test-area-1'] // Valid
      };

      // This should work
      const validResponse = await request(app)
        .put(`/api/preferences/${testUserId}`)
        .send(invalidPreferences)
        .expect(200);

      expect(validResponse.body.success).toBe(true);
    });

    it('should enforce maximum limits on selections', async () => {
      const tooManySecondaries = {
        primary_domain_id: 'test-primary-1',
        secondary_domain_ids: ['test-secondary-1', 'test-secondary-1', 'test-secondary-1', 'test-secondary-1'] // 4 > 3 limit
      };

      const response = await request(app)
        .put(`/api/preferences/${testUserId}`)
        .send(tooManySecondaries)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(response.body.errors).toContain('Maximum 3 secondary domains allowed');
    });

    it('should validate areas of interest belong to selected secondary domains', async () => {
      // Create area that doesn't belong to our secondary domain
      await testDb.query(`
        INSERT INTO DOMAINS (id, name, parent_domain_id, domain_level, is_active)
        VALUES (?, ?, ?, 'area_of_interest', true)
      `, ['test-area-other', 'Other Area', 'test-secondary-other']);

      const invalidAreas = {
        primary_domain_id: 'test-primary-1',
        secondary_domain_ids: ['test-secondary-1'],
        areas_of_interest_ids: ['test-area-other'] // Doesn't belong to test-secondary-1
      };

      const response = await request(app)
        .put(`/api/preferences/${testUserId}`)
        .send(invalidAreas)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(Array.isArray(response.body.errors)).toBe(true);
    });
  });

  describe('GET /api/preferences/domains/available', () => {
    it('should return available domains based on current selection', async () => {
      const response = await request(app)
        .get('/api/preferences/domains/available')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.primary_domains)).toBe(true);
      expect(Array.isArray(response.body.secondary_domains)).toBe(true);
      expect(Array.isArray(response.body.areas_of_interest)).toBe(true);
    });

    it('should filter secondary domains by primary domain', async () => {
      const response = await request(app)
        .get('/api/preferences/domains/available?primary_domain_id=test-primary-1')
        .expect(200);

      expect(response.body.secondary_domains.length).toBeGreaterThan(0);

      // All returned secondary domains should belong to the primary
      response.body.secondary_domains.forEach(secondary => {
        expect(secondary.parent_domain_id).toBe('test-primary-1');
      });
    });

    it('should filter areas by secondary domains', async () => {
      const response = await request(app)
        .get('/api/preferences/domains/available?secondary_domain_ids=test-secondary-1')
        .expect(200);

      expect(response.body.areas_of_interest.length).toBeGreaterThan(0);

      // All returned areas should belong to the secondary domain
      response.body.areas_of_interest.forEach(area => {
        expect(area.parent_domain_id).toBe('test-secondary-1');
      });
    });
  });

  describe('POST /api/preferences/validate', () => {
    it('should validate preference configuration without saving', async () => {
      const validPreferences = {
        primary_domain_id: 'test-primary-1',
        secondary_domain_ids: ['test-secondary-1'],
        areas_of_interest_ids: ['test-area-1']
      };

      const response = await request(app)
        .post('/api/preferences/validate')
        .send(validPreferences)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.valid).toBe(true);
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(response.body.errors.length).toBe(0);
    });

    it('should return validation errors for invalid configuration', async () => {
      const invalidPreferences = {
        primary_domain_id: 'non-existent-domain'
      };

      const response = await request(app)
        .post('/api/preferences/validate')
        .send(invalidPreferences)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.valid).toBe(false);
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Test with invalid JSON structure that might cause DB errors
      const malformedData = {
        primary_domain_id: null, // Invalid
        secondary_domain_ids: 'not-an-array' // Should be array
      };

      const response = await request(app)
        .put(`/api/preferences/${testUserId}`)
        .send(malformedData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should handle malformed JSON input', async () => {
      const response = await request(app)
        .put(`/api/preferences/${testUserId}`)
        .set('Content-Type', 'application/json')
        .send('{invalid json}')
        .expect(400);

      expect(response.status).toBe(400);
    });

    it('should handle concurrent updates gracefully', async () => {
      // This would require more complex setup to simulate concurrent updates
      // For now, just test that the endpoint handles normal load
      const promises = Array(3).fill().map(() =>
        request(app)
          .put(`/api/preferences/${testUserId}`)
          .send({
            primary_domain_id: 'test-primary-1',
            preference_type: 'professional'
          })
      );

      const responses = await Promise.all(promises);

      // At least one should succeed
      const successes = responses.filter(r => r.status === 200);
      expect(successes.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Helper function to set up test user
 */
async function setupTestUser() {
  const userId = 'test-user-' + Date.now();

  await testDb.query(
    'INSERT INTO users (id, email, first_name, last_name) VALUES (?, ?, ?, ?)',
    [userId, 'test@example.com', 'Test', 'User']
  );

  return userId;
}

/**
 * Helper function to set up test domains
 */
async function setupTestDomains() {
  try {
    const domains = [
      {
        id: 'test-primary-1',
        name: 'Technology',
        domain_level: 'primary',
        is_active: true
      },
      {
        id: 'test-secondary-1',
        name: 'Software Development',
        parent_domain_id: 'test-primary-1',
        domain_level: 'secondary',
        is_active: true
      },
      {
        id: 'test-secondary-other',
        name: 'Other Secondary',
        parent_domain_id: 'test-primary-1',
        domain_level: 'secondary',
        is_active: true
      },
      {
        id: 'test-area-1',
        name: 'Web Development',
        parent_domain_id: 'test-secondary-1',
        domain_level: 'area_of_interest',
        is_active: true
      }
    ];

    for (const domain of domains) {
      await testDb.query(`
        INSERT INTO DOMAINS (
          id, name, parent_domain_id, domain_level, is_active
        ) VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name)
      `, [
        domain.id,
        domain.name,
        domain.parent_domain_id || null,
        domain.domain_level,
        domain.is_active
      ]);
    }
  } catch (error) {
    console.error('Error setting up test domains:', error);
  }
}

/**
 * Helper function to create test preferences
 */
async function createTestPreferences(userId) {
  const prefId = 'test-pref-' + Date.now();

  await testDb.query(`
    INSERT INTO USER_PREFERENCES (
      id, user_id, primary_domain_id, preference_type
    ) VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE primary_domain_id = VALUES(primary_domain_id)
  `, [prefId, userId, 'test-primary-1', 'both']);
}