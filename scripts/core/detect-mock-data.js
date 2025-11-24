#!/usr/bin/env node

/**
 * Mock Data Detection Script
 * Automated validation to detect and prevent mock data usage
 * Part of Zero Tolerance Mock Data Policy
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MockDataDetector {
  constructor() {
    this.violations = [];
    this.srcDir = path.join(__dirname, '..', '..', 'src');
    this.serverFile = path.join(__dirname, '..', '..', 'server.js');
  }

  // Mock data patterns to detect
  getMockPatterns() {
    return {
      imports: [
        /import.*from.*['"]\..*mock.*['"]/g,
        /import.*from.*['"]\..*Mock.*['"]/g,
        /import.*mockData/g,
        /import.*MockAPI/g,
        /import.*mockApiData/g
      ],
      variables: [
        /const.*mock.*=.*\[/g,
        /const.*mock.*=.*\{/g,
        /let.*mock.*=.*\[/g,
        /let.*mock.*=.*\{/g,
        /var.*mock.*=.*\[/g,
        /var.*mock.*=.*\{/g
      ],
      functionCalls: [
        /generateMock/g,
        /getMockData/g,
        /Math\.random\(\)/g,
        /faker\./g,
        /chance\./g
      ],
      comments: [
        /TODO.*mock/g,
        /FIXME.*mock/g,
        /HACK.*mock/g
      ],
      hardcodedData: [
        // Pattern for hardcoded user-like objects
        /\{[^}]*name:.*email:.*\}/g,
        // Pattern for hardcoded arrays of objects
        /\[[\s\S]*?\{[^}]*name:.*\}.*?\]/g
      ]
    };
  }

  // Check if file is exempted from mock data detection (legitimate use cases)
  isExemptedFile(filePath) {
    // Normalize path to use forward slashes for consistent checking
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Test files
    if (normalizedPath.includes('.test.') ||
        normalizedPath.includes('.spec.') ||
        normalizedPath.includes('__tests__') ||
        normalizedPath.includes('/test/') ||
        normalizedPath.includes('\\test\\') ||
        normalizedPath.endsWith('.test.ts') ||
        normalizedPath.endsWith('.test.tsx') ||
        normalizedPath.endsWith('.spec.ts') ||
        normalizedPath.endsWith('.spec.tsx') ||
        normalizedPath.includes('testing') ||
        normalizedPath.includes('mocks')) {
      return true;
    }

    // Legitimate mock data libraries and demo components
    const exemptedPaths = [
      'lib/mockData.ts',
      'lib/mockApiData.ts',
      'lib/ai/',
      'lib/security/',
      'lib/accessibility/',
      'lib/performance/',
      'components/performance/',
      'hooks/useLazyItem.ts'
    ];

    return exemptedPaths.some(path => normalizedPath.includes(path));
  }

  // Scan a single file for mock data patterns
  scanFile(filePath) {
    const relativePath = path.relative(this.srcDir, filePath);
    const isExemptedFile = this.isExemptedFile(relativePath);

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const patterns = this.getMockPatterns();

      lines.forEach((line, index) => {
        const lineNumber = index + 1;

        // Skip mock data detection in exempted files
        if (isExemptedFile) {
          return;
        }

        // Check imports
        patterns.imports.forEach(pattern => {
          if (pattern.test(line)) {
            this.violations.push({
              type: 'MOCK_DATA_IMPORT',
              file: relativePath,
              line: lineNumber,
              content: line.trim(),
              severity: 'ERROR',
              message: 'Mock data import detected in production code'
            });
          }
        });

        // Check variable declarations
        patterns.variables.forEach(pattern => {
          if (pattern.test(line)) {
            this.violations.push({
              type: 'MOCK_DATA_VARIABLE',
              file: relativePath,
              line: lineNumber,
              content: line.trim(),
              severity: 'ERROR',
              message: 'Mock data variable declaration detected'
            });
          }
        });

        // Check function calls
        patterns.functionCalls.forEach(pattern => {
          if (pattern.test(line)) {
            this.violations.push({
              type: 'MOCK_DATA_FUNCTION',
              file: relativePath,
              line: lineNumber,
              content: line.trim(),
              severity: 'ERROR',
              message: 'Mock data function call detected'
            });
          }
        });

        // Check hardcoded data patterns
        patterns.hardcodedData.forEach(pattern => {
          if (pattern.test(line)) {
            this.violations.push({
              type: 'HARDCODED_MOCK_DATA',
              file: relativePath,
              line: lineNumber,
              content: line.trim(),
              severity: 'WARNING',
              message: 'Potential hardcoded mock data detected'
            });
          }
        });
      });

    } catch (error) {
      // Skip binary files or files that can't be read
    }
  }

  // Scan server.js for mock data
  scanServerFile() {
    try {
      const content = fs.readFileSync(this.serverFile, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const lineNumber = index + 1;

        // Look for mock responses in server code
        if (line.includes('mock response') ||
            line.includes('return mock') ||
            line.includes('For now, return mock')) {
          this.violations.push({
            type: 'SERVER_MOCK_RESPONSE',
            file: 'server.js',
            line: lineNumber,
            content: line.trim(),
            severity: 'ERROR',
            message: 'Mock response detected in server code'
          });
        }
      });

    } catch (error) {
      // Server file might not exist
    }
  }

  // Main scanning function
  async scanForMockData() {
    console.log('🔍 Scanning for mock data violations...\n');

    // Scan all TypeScript/JavaScript files in src
    this.scanDirectory(this.srcDir);

    // Scan server file
    this.scanServerFile();

    // Generate report
    this.generateReport();

    return {
      totalViolations: this.violations.length,
      violations: this.violations,
      hasErrors: this.violations.some(v => v.severity === 'ERROR')
    };
  }

  // Recursively scan directory
  scanDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.includes('node_modules')) {
        this.scanDirectory(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        this.scanFile(filePath);
      }
    });
  }

  // Generate detailed report
  generateReport() {
    const errors = this.violations.filter(v => v.severity === 'ERROR');
    const warnings = this.violations.filter(v => v.severity === 'WARNING');

    console.log('📋 Mock Data Detection Report');
    console.log('='.repeat(50));

    if (errors.length > 0) {
      console.log(`❌ ERRORS FOUND (${errors.length}):`);
      errors.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.type} in ${violation.file}:${violation.line}`);
        console.log(`   ${violation.message}`);
        console.log(`   Content: ${violation.content}`);
        console.log('');
      });
    }

    if (warnings.length > 0) {
      console.log(`⚠️ WARNINGS FOUND (${warnings.length}):`);
      warnings.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.type} in ${violation.file}:${violation.line}`);
        console.log(`   ${violation.message}`);
        console.log(`   Content: ${violation.content}`);
        console.log('');
      });
    }

    if (errors.length === 0 && warnings.length === 0) {
      console.log('✅ No mock data violations found!');
    }

    console.log('='.repeat(50));

    if (errors.length > 0) {
      console.log('🚫 Mock data violations detected!');
      console.log('Please remove all mock data and use real API endpoints instead.');
      console.log('='.repeat(50));
    }
  }
}

// Run detection if called directly
const detector = new MockDataDetector();
detector.scanForMockData().then(result => {
  if (result.hasErrors) {
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Error during mock data detection:', error);
  process.exit(1);
});

export default MockDataDetector;