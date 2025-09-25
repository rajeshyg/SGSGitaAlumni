#!/usr/bin/env node

const https = require('https');
const http = require('http');

const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'http://localhost:3000';
const HEALTH_CHECK_URL = `${DEPLOYMENT_URL}/api/health`;

console.log('🔍 Starting deployment validation...');

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    const req = protocol.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function validateDeployment() {
  try {
    // Check application accessibility
    console.log('Checking application accessibility...');
    const appResponse = await makeRequest(DEPLOYMENT_URL);
    if (appResponse.statusCode >= 200 && appResponse.statusCode < 300) {
      console.log('✅ Application accessible');
    } else {
      throw new Error(`Application not accessible: ${appResponse.statusCode}`);
    }

    // Check health endpoint
    console.log('Checking health endpoint...');
    const healthResponse = await makeRequest(HEALTH_CHECK_URL);
    if (healthResponse.statusCode === 200) {
      const healthData = JSON.parse(healthResponse.data);
      if (healthData.status === 'healthy') {
        console.log('✅ Health check passed');
      } else {
        throw new Error('Health check failed: unhealthy status');
      }
    } else {
      throw new Error(`Health check failed: ${healthResponse.statusCode}`);
    }

    // Check for JavaScript errors in the main page
    console.log('Checking for JavaScript errors...');
    if (!appResponse.data.includes('console.error')) {
      console.log('✅ No JS errors detected');
    } else {
      console.log('⚠️ Potential JavaScript errors found (may be false positive)');
    }

    // Check response time
    console.log('Checking response time...');
    const startTime = Date.now();
    await makeRequest(DEPLOYMENT_URL);
    const responseTime = (Date.now() - startTime) / 1000;
    if (responseTime < 2.0) {
      console.log(`✅ Response time acceptable: ${responseTime.toFixed(2)}s`);
    } else {
      console.log(`⚠️ Response time slow: ${responseTime.toFixed(2)}s`);
    }

    console.log('🎉 Deployment validation completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Deployment validation failed:', error.message);
    process.exit(1);
  }
}

validateDeployment();