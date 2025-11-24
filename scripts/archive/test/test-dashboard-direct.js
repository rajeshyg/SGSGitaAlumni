import dotenv from 'dotenv';
import { getPool } from '../utils/database.js';
import { getMemberDashboard, setDashboardPool } from '../routes/dashboard.js';

dotenv.config();

// Mock Express request and response objects
const mockReq = {
  query: { userId: '10025' },
  user: { id: 10025, role: 'member' }
};

const mockRes = {
  statusCode: 200,
  responseData: null,
  
  status(code) {
    this.statusCode = code;
    return this;
  },
  
  json(data) {
    this.responseData = data;
    console.log('\n📊 Response Status:', this.statusCode);
    console.log('📦 Response Data:', JSON.stringify(data, null, 2));
    return this;
  }
};

async function testDashboard() {
  console.log('🧪 Testing Dashboard Endpoint Directly\n');
  console.log('='.repeat(60));
  
  try {
    const pool = getPool();
    setDashboardPool(pool);
    
    console.log('\n✅ Database pool initialized');
    console.log('📞 Calling getMemberDashboard with userId:', mockReq.query.userId);
    
    await getMemberDashboard(mockReq, mockRes);
    
    if (mockRes.statusCode === 200) {
      console.log('\n✅ Dashboard endpoint succeeded!');
    } else {
      console.log('\n❌ Dashboard endpoint failed with status:', mockRes.statusCode);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testDashboard();

