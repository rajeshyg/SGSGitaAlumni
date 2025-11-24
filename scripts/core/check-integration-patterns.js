#!/usr/bin/env node

/**
 * Integration Patterns Validator
 *
 * This script validates TypeScript/React source files for integration patterns:
 * 1. State synchronization patterns (API calls with state validation)
 * 2. Error handling completeness (try-catch around API calls)
 * 3. API safety patterns (duplicate prevention for multiple API calls)
 * 4. Loading state management (async operations with loading feedback)
 *
 * Usage: node scripts/check-integration-patterns.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  srcDir: 'src',
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  excludePatterns: [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    '__tests__',
    '__mocks__',
    'test-',
    '.test.',
    '.spec.'
  ]
};

class IntegrationPatternsValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.files = [];
  }

  // Main execution function
  async run() {
    console.log('🔍 Starting Integration Patterns Validation...\n');

    try {
      this.loadSourceFiles();
      this.validateStateSynchronization();
      this.validateErrorHandling();
      this.validateAPISafety();
      this.validateLoadingStates();

      this.reportResults();

      // Exit with error code if critical issues found
      if (this.errors.length > 0) {
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Error running integration patterns validation:', error.message);
      process.exit(1);
    }
  }

  // Load all TypeScript/React source files
  loadSourceFiles() {
    const findSourceFiles = (dir) => {
      const files = [];
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip excluded directories
          if (!CONFIG.excludePatterns.some(pattern => item.includes(pattern))) {
            files.push(...findSourceFiles(fullPath));
          }
        } else if (CONFIG.extensions.some(ext => item.endsWith(ext))) {
          // Skip excluded files
          if (!CONFIG.excludePatterns.some(pattern => item.includes(pattern))) {
            files.push({
              path: fullPath,
              name: item,
              content: fs.readFileSync(fullPath, 'utf8'),
              lines: fs.readFileSync(fullPath, 'utf8').split('\n').length
            });
          }
        }
      }
      return files;
    };

    this.files = findSourceFiles(CONFIG.srcDir);
    console.log(`📄 Found ${this.files.length} source files to validate`);
  }

  // Validate state synchronization patterns
  validateStateSynchronization() {
    console.log('🔄 Validating state synchronization patterns...');

    for (const file of this.files) {
      // Check for API calls without state validation
      const apiCallPatterns = [
        /APIService\.\w+\(/g,
        /apiClient\.(get|post|put|delete|patch)\(/g,
        /fetch\(/g
      ];

      let hasAPICalls = false;
      apiCallPatterns.forEach(pattern => {
        if (pattern.test(file.content)) {
          hasAPICalls = true;
        }
      });

      if (hasAPICalls) {
        // Check for state management patterns
        const hasStateManagement = this.checkStateManagement(file);

        // Check for backend-first patterns
        const hasBackendFirst = this.checkBackendFirst(file);

        if (!hasStateManagement) {
          this.errors.push({
            type: 'MISSING_STATE_SYNCHRONIZATION',
            severity: 'HIGH',
            file: file.path,
            message: 'API calls detected without proper state synchronization patterns'
          });
        }

        if (!hasBackendFirst) {
          this.warnings.push({
            type: 'MISSING_BACKEND_FIRST',
            severity: 'MEDIUM',
            file: file.path,
            message: 'API calls should follow backend-first architecture pattern'
          });
        }
      }
    }
  }

  // Validate error handling completeness
  validateErrorHandling() {
    console.log('🛡️ Validating error handling completeness...');

    for (const file of this.files) {
      const apiCalls = this.findAPICalls(file.content);

      for (const apiCall of apiCalls) {
        // Check if API call is wrapped in try-catch
        const hasTryCatch = this.checkTryCatchAroundAPICall(file.content, apiCall);

        if (!hasTryCatch) {
          this.errors.push({
            type: 'MISSING_ERROR_HANDLING',
            severity: 'HIGH',
            file: file.path,
            message: `API call "${apiCall}" is not wrapped in try-catch block`,
            line: this.findLineNumber(file.content, apiCall)
          });
        }

        // Check for proper error recovery patterns
        const hasErrorRecovery = this.checkErrorRecovery(file.content, apiCall);
        if (!hasErrorRecovery) {
          this.warnings.push({
            type: 'MISSING_ERROR_RECOVERY',
            severity: 'MEDIUM',
            file: file.path,
            message: `API call "${apiCall}" lacks proper error recovery patterns`,
            line: this.findLineNumber(file.content, apiCall)
          });
        }
      }
    }
  }

  // Validate API safety patterns (duplicate prevention)
  validateAPISafety() {
    console.log('🔒 Validating API safety patterns...');

    for (const file of this.files) {
      // Check for operation guards or duplicate prevention
      const hasOperationGuards = this.checkOperationGuards(file);

      if (!hasOperationGuards) {
        // Look for potential duplicate API calls
        const duplicateCalls = this.findPotentialDuplicateCalls(file);

        if (duplicateCalls.length > 0) {
          this.warnings.push({
            type: 'POTENTIAL_DUPLICATE_CALLS',
            severity: 'MEDIUM',
            file: file.path,
            message: `Potential duplicate API calls detected: ${duplicateCalls.join(', ')}`
          });
        }
      }
    }
  }

  // Validate loading state management
  validateLoadingStates() {
    console.log('⏳ Validating loading state management...');

    for (const file of this.files) {
      const asyncOperations = this.findAsyncOperations(file.content);

      for (const operation of asyncOperations) {
        const hasLoadingState = this.checkLoadingState(file.content, operation);

        if (!hasLoadingState) {
          this.warnings.push({
            type: 'MISSING_LOADING_STATE',
            severity: 'LOW',
            file: file.path,
            message: `Async operation "${operation}" lacks loading state management`,
            line: this.findLineNumber(file.content, operation)
          });
        }
      }
    }
  }

  // Helper methods for validation

  checkStateManagement(file) {
    // Check for useState, useReducer, or state management patterns
    const statePatterns = [
      /useState\(/,
      /useReducer\(/,
      /setState\(/,
      /dispatch\(/,
      /useContext\(/,
      /useSelector\(/,
      /useDispatch\(/
    ];

    return statePatterns.some(pattern => pattern.test(file.content));
  }

  checkBackendFirst(file) {
    // Check for backend-first patterns like optimistic updates with rollback
    const backendFirstPatterns = [
      /optimistic.*update/i,
      /rollback/i,
      /syncWithBackend/i,
      /backend.*first/i
    ];

    return backendFirstPatterns.some(pattern => pattern.test(file.content));
  }

  findAPICalls(content) {
    const apiCalls = [];
    const patterns = [
      /APIService\.(\w+)\(/g,
      /apiClient\.(get|post|put|delete|patch)\(/g,
      /fetch\(/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        apiCalls.push(match[0]);
      }
    });

    return [...new Set(apiCalls)]; // Remove duplicates
  }

  checkTryCatchAroundAPICall(content, apiCall) {
    const lines = content.split('\n');
    const apiCallLine = this.findLineNumber(content, apiCall);

    if (apiCallLine === -1) return false;

    // Look for try block before API call
    for (let i = apiCallLine - 1; i >= Math.max(0, apiCallLine - 10); i--) {
      if (lines[i].includes('try {')) {
        // Look for corresponding catch block
        let braceCount = 0;
        for (let j = i; j < lines.length; j++) {
          braceCount += (lines[j].match(/{/g) || []).length;
          braceCount -= (lines[j].match(/}/g) || []).length;

          if (lines[j].includes('catch') && braceCount <= 0) {
            return true;
          }

          if (braceCount < 0) break; // End of try block
        }
      }
    }

    return false;
  }

  checkErrorRecovery(content, apiCall) {
    // Check for error recovery patterns around the API call
    const errorRecoveryPatterns = [
      /catch.*error/i,
      /error.*recovery/i,
      /retry/i,
      /fallback/i,
      /ErrorRecoveryService/i
    ];

    // Get context around API call
    const lines = content.split('\n');
    const apiCallLine = this.findLineNumber(content, apiCall);

    if (apiCallLine === -1) return false;

    // Check lines around API call for error recovery
    const startLine = Math.max(0, apiCallLine - 5);
    const endLine = Math.min(lines.length, apiCallLine + 10);
    const context = lines.slice(startLine, endLine).join('\n');

    return errorRecoveryPatterns.some(pattern => pattern.test(context));
  }

  checkOperationGuards(file) {
    // Check for operation guard patterns
    const guardPatterns = [
      /useOperationGuard/i,
      /operation.*guard/i,
      /prevent.*duplicate/i,
      /pendingUpdates/i,
      /activeOperations/i
    ];

    return guardPatterns.some(pattern => pattern.test(file.content));
  }

  findPotentialDuplicateCalls(file) {
    const duplicateCalls = [];
    const apiCalls = this.findAPICalls(file.content);

    // Simple heuristic: if same API method called multiple times in same function
    const functions = file.content.split(/function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(/);

    functions.forEach(func => {
      const callsInFunction = apiCalls.filter(call => func.includes(call));
      const uniqueCalls = [...new Set(callsInFunction)];

      if (uniqueCalls.length < callsInFunction.length) {
        duplicateCalls.push(...callsInFunction);
      }
    });

    return [...new Set(duplicateCalls)];
  }

  findAsyncOperations(content) {
    const asyncOps = [];
    const patterns = [
      /async\s+\w+\s*\(/g,
      /await\s+\w+\./g,
      /Promise\./g,
      /\.then\(/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        asyncOps.push(match[0]);
      }
    });

    return [...new Set(asyncOps)];
  }

  checkLoadingState(content, operation) {
    // Check for loading state patterns around async operations
    const loadingPatterns = [
      /loading/i,
      /setLoading/i,
      /isLoading/i,
      /useState.*loading/i,
      /spinner/i,
      /Loading/i
    ];

    const lines = content.split('\n');
    const operationLine = this.findLineNumber(content, operation);

    if (operationLine === -1) return false;

    // Check context around operation
    const startLine = Math.max(0, operationLine - 5);
    const endLine = Math.min(lines.length, operationLine + 5);
    const context = lines.slice(startLine, endLine).join('\n');

    return loadingPatterns.some(pattern => pattern.test(context));
  }

  findLineNumber(content, searchText) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchText)) {
        return i + 1;
      }
    }
    return -1;
  }

  // Report results
  reportResults() {
    console.log('\n📊 Integration Patterns Validation Results\n');

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All integration patterns validated successfully!');
      return;
    }

    // Group issues by severity
    const highSeverity = [...this.errors.filter(e => e.severity === 'HIGH'), ...this.warnings.filter(w => w.severity === 'HIGH')];
    const mediumSeverity = [...this.errors.filter(e => e.severity === 'MEDIUM'), ...this.warnings.filter(w => w.severity === 'MEDIUM')];
    const lowSeverity = [...this.errors.filter(e => e.severity === 'LOW'), ...this.warnings.filter(w => w.severity === 'LOW')];

    if (highSeverity.length > 0) {
      console.log('🚨 HIGH SEVERITY ISSUES (will block commit):');
      highSeverity.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.type}: ${issue.message}`);
        console.log(`   File: ${issue.file}`);
        if (issue.line) console.log(`   Line: ${issue.line}`);
        console.log();
      });
    }

    if (mediumSeverity.length > 0) {
      console.log('⚠️ MEDIUM SEVERITY ISSUES:');
      mediumSeverity.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.type}: ${issue.message}`);
        console.log(`   File: ${issue.file}`);
        if (issue.line) console.log(`   Line: ${issue.line}`);
        console.log();
      });
    }

    if (lowSeverity.length > 0) {
      console.log('ℹ️ LOW SEVERITY ISSUES:');
      lowSeverity.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.type}: ${issue.message}`);
        console.log(`   File: ${issue.file}`);
        if (issue.line) console.log(`   Line: ${issue.line}`);
        console.log();
      });
    }

    console.log(`\nSummary: ${highSeverity.length} high, ${mediumSeverity.length} medium, ${lowSeverity.length} low severity issues`);

    if (highSeverity.length > 0) {
      console.log('\n🚫 Commit blocked due to high severity integration pattern violations. Please fix and try again.');
    }
  }
}

// Run the validator
const validator = new IntegrationPatternsValidator();
validator.run();

export default IntegrationPatternsValidator;