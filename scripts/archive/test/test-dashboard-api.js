import dotenv from 'dotenv';

dotenv.config();

const API_BASE = process.env.API_BASE || process.env.API_URL || process.env.VITE_API_BASE_URL || 'http://localhost:3001';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'datta.rajesh@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123!';

async function testDashboardAPI() {
  console.log('🧪 Testing Dashboard API\n');
  console.log('='.repeat(60));

  try {
    // First, login to get a token
    console.log('\n1️⃣ Logging in...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    if (!loginResponse.ok) {
      const text = await loginResponse.text();
      throw new Error(`Login failed: ${loginResponse.status} ${text}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    const userId = loginData.user.id;

    console.log(`✅ Logged in as user ${userId}`);

    // Test dashboard endpoint
    console.log('\n2️⃣ Fetching dashboard data...');
    const dashboardResponse = await fetch(`${API_BASE}/api/dashboard/member?userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${dashboardResponse.status}`);

    if (!dashboardResponse.ok) {
      const errorText = await dashboardResponse.text();
      console.error('❌ Dashboard request failed:');
      console.error(errorText);
      return;
    }

    const dashboardData = await dashboardResponse.json();
    console.log('✅ Dashboard data received:');
    console.log(JSON.stringify(dashboardData, null, 2));

    // Minimal shape assertions to catch regressions when run standalone
    const required = ['summary','stats','quickActions','notifications','pendingActions','recommendedConnections','opportunities','recentActivity','meta'];
    const missing = required.filter(k => !(k in dashboardData));
    if (missing.length) {
      console.warn('⚠️ Missing expected keys:', missing);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

testDashboardAPI();

