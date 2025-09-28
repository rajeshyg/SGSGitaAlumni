#!/usr/bin/env node

/**
 * Comprehensive Test Runner for SGSGitaAlumni
 * 
 * This script provides a unified interface for running all types of tests
 * with proper configuration, reporting, and error handling.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const testConfig = {
  environments: {
    development: {
      baseURL: 'http://localhost:5173',
      apiURL: 'http://localhost:3000',
      database: 'dev'
    },
    staging: {
      baseURL: 'https://staging.sgsgitaalumni.com',
      apiURL: 'https://api-staging.sgsgitaalumni.com',
      database: 'staging'
    },
    production: {
      baseURL: 'https://sgsgitaalumni.com',
      apiURL: 'https://api.sgsgitaalumni.com',
      database: 'production'
    }
  },
  testSuites: {
    unit: {
      command: 'npm run test:run',
      description: 'Unit tests with Vitest',
      timeout: 30000
    },
    e2e: {
      command: 'npx playwright test',
      description: 'End-to-end tests with Playwright',
      timeout: 300000
    },
    api: {
      command: 'npx playwright test tests/api/',
      description: 'API tests with Playwright',
      timeout: 180000
    },
    performance: {
      command: 'npx playwright test tests/e2e/performance.spec.ts',
      description: 'Performance tests',
      timeout: 300000
    },
    crossBrowser: {
      command: 'npx playwright test --project=chromium --project=firefox --project=webkit',
      description: 'Cross-browser tests',
      timeout: 600000
    },
    responsive: {
      command: 'npx playwright test tests/e2e/responsive.spec.ts',
      description: 'Responsive design tests',
      timeout: 180000
    }
  }
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Utility functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logHeader(message) {
  log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  log(`${colors.bright}${colors.cyan}${message}${colors.reset}`);
  log(`${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

// Environment validation
function validateEnvironment() {
  logInfo('Validating test environment...');
  
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion < 18) {
    logError(`Node.js version ${nodeVersion} is not supported. Please use Node.js 18 or higher.`);
    process.exit(1);
  }
  
  // Check if required files exist
  const requiredFiles = [
    'package.json',
    'playwright.config.ts',
    'tests/setup/test-data.ts'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      logError(`Required file not found: ${file}`);
      process.exit(1);
    }
  }
  
  // Check if test directories exist
  const testDirs = [
    'tests/e2e',
    'tests/api',
    'tests/setup'
  ];
  
  for (const dir of testDirs) {
    if (!fs.existsSync(dir)) {
      logError(`Required test directory not found: ${dir}`);
      process.exit(1);
    }
  }
  
  logSuccess('Environment validation passed');
}

// Database validation
function validateDatabase() {
  logInfo('Validating database connection...');
  
  try {
    // Check if database is accessible
    execSync('npm run test:db:check', { stdio: 'pipe' });
    logSuccess('Database connection validated');
  } catch (error) {
    logWarning('Database validation failed. Some tests may not work correctly.');
    logWarning('Please ensure your DEV database is running and accessible.');
  }
}

// Test execution
function runTest(testName, options = {}) {
  const config = testConfig.testSuites[testName];
  if (!config) {
    logError(`Unknown test suite: ${testName}`);
    return false;
  }
  
  logHeader(`Running ${config.description}`);
  
  try {
    const startTime = Date.now();
    
    // Set environment variables
    const env = {
      ...process.env,
      NODE_ENV: options.environment || 'development',
      BASE_URL: testConfig.environments[options.environment || 'development'].baseURL,
      API_URL: testConfig.environments[options.environment || 'development'].apiURL
    };
    
    // Execute test command
    const result = execSync(config.command, {
      env,
      stdio: 'inherit',
      timeout: config.timeout
    });
    
    const duration = Date.now() - startTime;
    logSuccess(`${config.description} completed in ${(duration / 1000).toFixed(2)}s`);
    return true;
    
  } catch (error) {
    logError(`${config.description} failed: ${error.message}`);
    return false;
  }
}

// Test suite execution
function runTestSuite(suiteName, options = {}) {
  logHeader(`Running ${suiteName} Test Suite`);
  
  const startTime = Date.now();
  let passed = 0;
  let failed = 0;
  
  const tests = suiteName === 'all' ? Object.keys(testConfig.testSuites) : [suiteName];
  
  for (const test of tests) {
    if (runTest(test, options)) {
      passed++;
    } else {
      failed++;
    }
  }
  
  const duration = Date.now() - startTime;
  
  logHeader('Test Suite Results');
  logSuccess(`Passed: ${passed}`);
  if (failed > 0) {
    logError(`Failed: ${failed}`);
  }
  logInfo(`Total duration: ${(duration / 1000).toFixed(2)}s`);
  
  return failed === 0;
}

// Report generation
function generateReports() {
  logInfo('Generating test reports...');
  
  try {
    // Generate HTML report
    execSync('npx playwright show-report', { stdio: 'pipe' });
    logSuccess('HTML report generated');
    
    // Generate Allure report if available
    try {
      execSync('npx allure generate test-results/allure-results --clean', { stdio: 'pipe' });
      logSuccess('Allure report generated');
    } catch (error) {
      logWarning('Allure report generation failed. Make sure allure-playwright is installed.');
    }
    
  } catch (error) {
    logError(`Report generation failed: ${error.message}`);
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  const options = {
    environment: args[1] || 'development',
    generateReports: args.includes('--report'),
    verbose: args.includes('--verbose')
  };
  
  logHeader('SGSGitaAlumni Test Runner');
  logInfo(`Command: ${command}`);
  logInfo(`Environment: ${options.environment}`);
  logInfo(`Generate Reports: ${options.generateReports}`);
  
  // Validate environment
  validateEnvironment();
  validateDatabase();
  
  // Run tests
  const success = runTestSuite(command, options);
  
  // Generate reports if requested
  if (options.generateReports) {
    generateReports();
  }
  
  // Exit with appropriate code
  process.exit(success ? 0 : 1);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run main function
if (require.main === module) {
  main();
}

module.exports = {
  testConfig,
  runTest,
  runTestSuite,
  generateReports
};
