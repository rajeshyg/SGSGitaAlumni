/**
 * Test Zod Schema for Moderation Queue
 * 
 * This script tests the QueueQuerySchema to verify it correctly handles
 * empty strings and 'all' values for the status parameter.
 * 
 * Run with: node test-queue-schema.js
 */

import { z } from 'zod';

// Schema definition (same as in moderation.js)
const QueueQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  domain: z.string().uuid().optional(),
  status: z.preprocess(
    (val) => val === '' || val === 'all' ? undefined : val,
    z.enum(['PENDING', 'ESCALATED']).optional()
  ),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['oldest', 'newest', 'urgent']).default('oldest')
});

// Test cases
const testCases = [
  {
    name: 'Empty string status (should convert to undefined)',
    input: { page: '1', limit: '20', status: '', sortBy: 'oldest' },
    shouldPass: true,
    expectedStatus: undefined
  },
  {
    name: '"all" status (should convert to undefined)',
    input: { page: '1', limit: '20', status: 'all', sortBy: 'oldest' },
    shouldPass: true,
    expectedStatus: undefined
  },
  {
    name: 'PENDING status (should pass through)',
    input: { page: '1', limit: '20', status: 'PENDING', sortBy: 'oldest' },
    shouldPass: true,
    expectedStatus: 'PENDING'
  },
  {
    name: 'ESCALATED status (should pass through)',
    input: { page: '1', limit: '20', status: 'ESCALATED', sortBy: 'oldest' },
    shouldPass: true,
    expectedStatus: 'ESCALATED'
  },
  {
    name: 'Missing status (should be undefined)',
    input: { page: '1', limit: '20', sortBy: 'oldest' },
    shouldPass: true,
    expectedStatus: undefined
  },
  {
    name: 'Invalid status value (should fail)',
    input: { page: '1', limit: '20', status: 'INVALID', sortBy: 'oldest' },
    shouldPass: false,
    expectedStatus: undefined
  },
  {
    name: 'Valid with search parameter',
    input: { page: '1', limit: '20', status: 'PENDING', search: 'test', sortBy: 'newest' },
    shouldPass: true,
    expectedStatus: 'PENDING'
  }
];

// Run tests
console.log('Testing QueueQuerySchema...\n');

let passCount = 0;
let failCount = 0;

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`  Input:`, JSON.stringify(testCase.input));
  
  try {
    const result = QueueQuerySchema.parse(testCase.input);
    
    if (testCase.shouldPass) {
      // Check if status matches expected value
      if (result.status === testCase.expectedStatus) {
        console.log(`  ✅ PASS - Status: ${result.status === undefined ? 'undefined' : result.status}`);
        passCount++;
      } else {
        console.log(`  ❌ FAIL - Expected status: ${testCase.expectedStatus}, Got: ${result.status}`);
        failCount++;
      }
    } else {
      console.log(`  ❌ FAIL - Should have thrown validation error`);
      failCount++;
    }
  } catch (error) {
    if (!testCase.shouldPass) {
      const errorMsg = error.errors ? error.errors[0].message : error.message;
      console.log(`  ✅ PASS - Correctly rejected with error: ${errorMsg}`);
      passCount++;
    } else {
      const errorMsg = error.errors ? error.errors[0].message : error.message;
      console.log(`  ❌ FAIL - Unexpected error: ${errorMsg}`);
      failCount++;
    }
  }
  
  console.log('');
});

// Summary
console.log('='.repeat(50));
console.log(`Total Tests: ${testCases.length}`);
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log(`Success Rate: ${((passCount / testCases.length) * 100).toFixed(1)}%`);
console.log('='.repeat(50));

if (failCount === 0) {
  console.log('\n✅ All tests passed! The schema correctly handles empty strings and "all" values.');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please review the schema implementation.');
  process.exit(1);
}
