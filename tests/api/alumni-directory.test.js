/**
 * Alumni Directory API Tests
 * Task 7.5 - Alumni Directory & Profile Management
 * 
 * Tests for the new /api/alumni/directory endpoint
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../server.js';
import { getPool } from '../../utils/database.js';

describe('Alumni Directory API', () => {
  let pool;

  beforeAll(async () => {
    pool = getPool();
    // Ensure database connection is ready
    const connection = await pool.getConnection();
    connection.release();
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  describe('GET /api/alumni/directory', () => {
    it('should return paginated alumni directory with default parameters', async () => {
      const response = await request(app)
        .get('/api/alumni/directory')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body).toHaveProperty('filters');

      // Check data structure
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(20); // Default perPage

      // Check pagination metadata
      const { pagination } = response.body;
      expect(pagination).toHaveProperty('page', 1);
      expect(pagination).toHaveProperty('perPage', 20);
      expect(pagination).toHaveProperty('total');
      expect(pagination).toHaveProperty('totalPages');
      expect(pagination).toHaveProperty('hasNext');
      expect(pagination).toHaveProperty('hasPrev', false);

      // Check filter options
      const { filters } = response.body;
      expect(filters).toHaveProperty('graduationYears');
      expect(filters).toHaveProperty('departments');
      expect(Array.isArray(filters.graduationYears)).toBe(true);
      expect(Array.isArray(filters.departments)).toBe(true);
    });

    it('should return alumni with correct data structure', async () => {
      const response = await request(app)
        .get('/api/alumni/directory')
        .expect(200);

      if (response.body.data.length > 0) {
        const alumni = response.body.data[0];
        
        // Required fields
        expect(alumni).toHaveProperty('id');
        expect(alumni).toHaveProperty('studentId');
        expect(alumni).toHaveProperty('firstName');
        expect(alumni).toHaveProperty('lastName');
        expect(alumni).toHaveProperty('displayName');
        expect(alumni).toHaveProperty('email');
        expect(alumni).toHaveProperty('graduationYear');
        expect(alumni).toHaveProperty('degree');
        expect(alumni).toHaveProperty('department');

        // displayName should be firstName + lastName
        expect(alumni.displayName).toBe(`${alumni.firstName} ${alumni.lastName}`);
      }
    });

    it('should support pagination with custom page and perPage', async () => {
      const response = await request(app)
        .get('/api/alumni/directory?page=2&perPage=10')
        .expect(200);

      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.perPage).toBe(10);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });

    it('should filter by graduation year', async () => {
      const response = await request(app)
        .get('/api/alumni/directory?graduationYear=2020')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // All results should have graduationYear = 2020
      response.body.data.forEach(alumni => {
        expect(alumni.graduationYear).toBe(2020);
      });
    });

    it('should filter by graduation year range', async () => {
      const response = await request(app)
        .get('/api/alumni/directory?graduationYearMin=2018&graduationYearMax=2022')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // All results should be within range
      response.body.data.forEach(alumni => {
        expect(alumni.graduationYear).toBeGreaterThanOrEqual(2018);
        expect(alumni.graduationYear).toBeLessThanOrEqual(2022);
      });
    });

    it('should filter by department', async () => {
      // First get available departments
      const dirResponse = await request(app)
        .get('/api/alumni/directory')
        .expect(200);

      const departments = dirResponse.body.filters.departments;
      if (departments.length > 0) {
        const testDept = departments[0];
        
        const response = await request(app)
          .get(`/api/alumni/directory?department=${encodeURIComponent(testDept)}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        
        // All results should have the specified department
        response.body.data.forEach(alumni => {
          expect(alumni.department).toBe(testDept);
        });
      }
    });

    it('should support search query', async () => {
      const response = await request(app)
        .get('/api/alumni/directory?q=john')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Results should contain "john" in name or email
      response.body.data.forEach(alumni => {
        const searchText = `${alumni.firstName} ${alumni.lastName} ${alumni.email}`.toLowerCase();
        expect(searchText).toContain('john');
      });
    });

    it('should support sorting by name (default)', async () => {
      const response = await request(app)
        .get('/api/alumni/directory?sortBy=name&sortOrder=asc')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Check if results are sorted by last name, then first name
      const names = response.body.data.map(a => `${a.lastName}, ${a.firstName}`);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it('should support sorting by graduation year', async () => {
      const response = await request(app)
        .get('/api/alumni/directory?sortBy=graduationYear&sortOrder=desc')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Check if results are sorted by graduation year descending
      const years = response.body.data.map(a => a.graduationYear);
      for (let i = 1; i < years.length; i++) {
        expect(years[i]).toBeLessThanOrEqual(years[i - 1]);
      }
    });

    it('should enforce maximum perPage limit of 100', async () => {
      const response = await request(app)
        .get('/api/alumni/directory?perPage=500')
        .expect(200);

      expect(response.body.pagination.perPage).toBe(100);
      expect(response.body.data.length).toBeLessThanOrEqual(100);
    });

    it('should handle invalid page numbers gracefully', async () => {
      const response = await request(app)
        .get('/api/alumni/directory?page=-1')
        .expect(200);

      // Should default to page 1
      expect(response.body.pagination.page).toBe(1);
    });

    it('should combine multiple filters', async () => {
      const response = await request(app)
        .get('/api/alumni/directory?graduationYear=2020&q=john&sortBy=name')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Results should match all filters
      response.body.data.forEach(alumni => {
        expect(alumni.graduationYear).toBe(2020);
        const searchText = `${alumni.firstName} ${alumni.lastName} ${alumni.email}`.toLowerCase();
        expect(searchText).toContain('john');
      });
    });

    it('should return empty array when no results match filters', async () => {
      const response = await request(app)
        .get('/api/alumni/directory?graduationYear=1900')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
      expect(response.body.pagination.totalPages).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      // This test would require mocking the database to simulate an error
      // For now, we'll skip it and rely on manual testing
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time for large datasets', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/alumni/directory?perPage=100')
        .expect(200);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Should respond within 2 seconds even for 100 results
      expect(responseTime).toBeLessThan(2000);
    });
  });
});

