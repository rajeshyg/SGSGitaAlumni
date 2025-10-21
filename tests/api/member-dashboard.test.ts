import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_URL || process.env.API_BASE || 'http://localhost:3001';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'datta.rajesh@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123!';

test.describe('Member Dashboard API', () => {
  let token: string;
  let userId: number;

  test.beforeAll(async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
    });

    expect(loginRes.status(), await loginRes.text()).toBe(200);
    const login = await loginRes.json();
    token = login.token;
    userId = login.user.id;
  });

  test('GET /api/dashboard/member returns dashboard data', async ({ request }) => {
    const res = await request.get(`${API_BASE}/api/dashboard/member?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    expect(res.status(), await res.text()).toBe(200);
    const body = await res.json();

    // Core shape
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('summary');
    expect(body).toHaveProperty('stats');
    expect(body).toHaveProperty('opportunities');

    // Minimal field checks
    expect(body.summary).toHaveProperty('firstName');
    expect(typeof body.stats.networkSize).toBe('number');
    expect(body.opportunities).toHaveProperty('matched');
    expect(body.opportunities).toHaveProperty('trending');
  });
});
