/**
 * Integration Tests for Domains API Endpoints
 * Tests CRUD operations, validation, and error handling for domain management
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../../server.js';
import { createTestDatabase, cleanupTestDatabase } from '../setup/test-db.js';

let app;
let server;
let testDb;

describe('Domains API Integration Tests', () => {
  beforeAll(async () => {
    // Create test database
    testDb = await createTestDatabase();

    // Create server with test database
    app = createServer();
    server = app.listen(3001); // Use different port for tests

    // Set up test data
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

  describe('GET /api/domains', () => {
    it('should return all active domains with hierarchy', async () => {
      const response = await request(app)
        .get('/api/domains')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.domains)).toBe(true);
      expect(response.body.hierarchy).toBeDefined();

      // Check that domains have required fields
      if (response.body.domains.length > 0) {
        const domain = response.body.domains[0];
        expect(domain).toHaveProperty('id');
        expect(domain).toHaveProperty('name');
        expect(domain).toHaveProperty('domain_level');
        expect(domain).toHaveProperty('is_active', true);
      }
    });

    it('should return domains in correct hierarchical structure', async () => {
      const response = await request(app)
        .get('/api/domains')
        .expect(200);

      expect(response.body.hierarchy).toBeDefined();

      // Primary domains should be at root level
      const primaryDomains = Object.keys(response.body.hierarchy);
      expect(primaryDomains.length).toBeGreaterThan(0);

      // Check that primary domains have children
      const firstPrimary = response.body.hierarchy[primaryDomains[0]];
      expect(firstPrimary.children).toBeDefined();
    });
  });

  describe('GET /api/domains/:id', () => {
    it('should return specific domain details', async () => {
      // First get a domain ID
      const domainsResponse = await request(app)
        .get('/api/domains')
        .expect(200);

      const testDomain = domainsResponse.body.domains[0];

      const response = await request(app)
        .get(`/api/domains/${testDomain.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.domain.id).toBe(testDomain.id);
      expect(response.body.domain.name).toBe(testDomain.name);
    });

    it('should return 404 for non-existent domain', async () => {
      const response = await request(app)
        .get('/api/domains/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Domain not found');
    });
  });

  describe('GET /api/domains/primary', () => {
    it('should return only primary domains', async () => {
      const response = await request(app)
        .get('/api/domains/primary')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.domains)).toBe(true);

      // All returned domains should be primary level
      response.body.domains.forEach(domain => {
        expect(domain.domain_level).toBe('primary');
      });
    });
  });

  describe('GET /api/domains/:id/children', () => {
    it('should return child domains of a specific domain', async () => {
      // Get a primary domain first
      const primaryResponse = await request(app)
        .get('/api/domains/primary')
        .expect(200);

      const primaryDomain = primaryResponse.body.domains[0];

      const response = await request(app)
        .get(`/api/domains/${primaryDomain.id}/children`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.children)).toBe(true);

      // Children should have correct parent
      response.body.children.forEach(child => {
        expect(child.parent_domain_id).toBe(primaryDomain.id);
      });
    });
  });

  describe('GET /api/domains/hierarchy', () => {
    it('should return complete domain tree structure', async () => {
      const response = await request(app)
        .get('/api/domains/hierarchy')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.hierarchy).toBeDefined();
      expect(typeof response.body.hierarchy).toBe('object');
    });
  });

  describe('POST /api/admin/domains', () => {
    it('should create new domain successfully', async () => {
      const newDomain = {
        name: 'Test Domain',
        description: 'A test domain for integration testing',
        domain_level: 'primary',
        display_order: 99,
        icon: 'test-icon',
        color_code: '#FF0000'
      };

      const response = await request(app)
        .post('/api/admin/domains')
        .send(newDomain)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.domain_id).toBeDefined();

      // Verify domain was created
      const getResponse = await request(app)
        .get(`/api/domains/${response.body.domain_id}`)
        .expect(200);

      expect(getResponse.body.domain.name).toBe(newDomain.name);
    });

    it('should validate domain hierarchy rules', async () => {
      // Try to create secondary domain without parent
      const invalidDomain = {
        name: 'Invalid Secondary Domain',
        domain_level: 'secondary'
        // Missing parent_domain_id
      };

      const response = await request(app)
        .post('/api/admin/domains')
        .send(invalidDomain)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(response.body.errors).toContain('Secondary domains and areas must have a parent');
    });

    it('should prevent duplicate domain names', async () => {
      const duplicateDomain = {
        name: 'Test Domain', // Same as created above
        domain_level: 'primary'
      };

      const response = await request(app)
        .post('/api/admin/domains')
        .send(duplicateDomain)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });
  });

  describe('PUT /api/admin/domains/:id', () => {
    it('should update domain successfully', async () => {
      // Create a test domain first
      const createResponse = await request(app)
        .post('/api/admin/domains')
        .send({
          name: 'Update Test Domain',
          domain_level: 'primary'
        })
        .expect(201);

      const domainId = createResponse.body.domain_id;

      // Update the domain
      const updateData = {
        name: 'Updated Test Domain',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/admin/domains/${domainId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify update
      const getResponse = await request(app)
        .get(`/api/domains/${domainId}`)
        .expect(200);

      expect(getResponse.body.domain.name).toBe(updateData.name);
      expect(getResponse.body.domain.description).toBe(updateData.description);
    });

    it('should validate hierarchy when updating parent or level', async () => {
      // Create primary domain
      const primaryResponse = await request(app)
        .post('/api/admin/domains')
        .send({
          name: 'Primary for Update Test',
          domain_level: 'primary'
        })
        .expect(201);

      const primaryId = primaryResponse.body.domain_id;

      // Try to change it to secondary without parent
      const response = await request(app)
        .put(`/api/admin/domains/${primaryId}`)
        .send({
          domain_level: 'secondary'
          // No parent_domain_id
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(Array.isArray(response.body.errors)).toBe(true);
    });
  });

  describe('DELETE /api/admin/domains/:id', () => {
    it('should soft delete domain successfully', async () => {
      // Create a test domain
      const createResponse = await request(app)
        .post('/api/admin/domains')
        .send({
          name: 'Delete Test Domain',
          domain_level: 'primary'
        })
        .expect(201);

      const domainId = createResponse.body.domain_id;

      // Delete the domain
      const response = await request(app)
        .delete(`/api/admin/domains/${domainId}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify it's soft deleted (not returned in active queries)
      const getResponse = await request(app)
        .get(`/api/domains/${domainId}`)
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This would require mocking database failures
      // For now, test with invalid input types
      const response = await request(app)
        .post('/api/admin/domains')
        .send({
          name: '', // Invalid empty name
          domain_level: 'invalid_level'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle malformed JSON input', async () => {
      const response = await request(app)
        .post('/api/admin/domains')
        .set('Content-Type', 'application/json')
        .send('{invalid json}')
        .expect(400);

      // Express should handle malformed JSON
      expect(response.status).toBe(400);
    });
  });
});

/**
 * Helper function to set up test domains
 */
async function setupTestDomains() {
  try {
    // Insert test domains directly into test database
    const domains = [
      {
        id: 'test-primary-1',
        name: 'Technology',
        description: 'Technology and computing domains',
        domain_level: 'primary',
        display_order: 1,
        icon: 'cpu',
        color_code: '#007bff',
        is_active: true
      },
      {
        id: 'test-secondary-1',
        name: 'Software Development',
        description: 'Software engineering and development',
        parent_domain_id: 'test-primary-1',
        domain_level: 'secondary',
        display_order: 1,
        is_active: true
      },
      {
        id: 'test-area-1',
        name: 'Web Development',
        description: 'Frontend and backend web development',
        parent_domain_id: 'test-secondary-1',
        domain_level: 'area_of_interest',
        display_order: 1,
        is_active: true
      }
    ];

    for (const domain of domains) {
      await testDb.query(`
        INSERT INTO DOMAINS (
          id, name, description, parent_domain_id, domain_level,
          display_order, icon, color_code, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE name = VALUES(name)
      `, [
        domain.id,
        domain.name,
        domain.description || null,
        domain.parent_domain_id || null,
        domain.domain_level,
        domain.display_order || 0,
        domain.icon || null,
        domain.color_code || null,
        domain.is_active
      ]);
    }
  } catch (error) {
    console.error('Error setting up test domains:', error);
  }
}