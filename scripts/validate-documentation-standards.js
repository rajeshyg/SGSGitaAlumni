#!/usr/bin/env node

/**
 * Documentation Standards Validation Script
 *
 * Validates documentation against established standards:
 * 1. Status Format Standardization
 * 2. Parent-Child Rule Enforcement
 * 3. Success Criteria Validation
 * 4. Redundancy Elimination
 *
 * Usage: node scripts/validate-documentation-standards.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DocumentationStandardsValidator {
  constructor() {
    this.violations = [];
    this.docsDir = path.join(__dirname, '..', 'docs');
    this.rootDir = path.join(__dirname, '..');
  }

  // Main validation function
  async validateStandards() {
    console.log('📋 Starting Documentation Standards Validation...\n');
    
    try {
      // Reset violations
      this.violations = [];

      // Run all validation checks
      await this.validateParentChildRule();
      await this.validateStatusFormats();
      await this.validateSuccessCriteria();
      await this.validateRedundancy();

      // Generate report
      this.generateValidationReport();

      // Return results
      return {
        totalViolations: this.violations.length,
        violations: this.violations,
        complianceScore: this.calculateComplianceScore()
      };

    } catch (error) {
      console.error('❌ Error during validation:', error.message);
      process.exit(1);
    }
  }

  // Validate parent-child rule: PROGRESS.md should not contain child-level status
  async validateParentChildRule() {
    console.log('🔍 Validating parent-child status rules...');
    
    const progressPath = path.join(this.rootDir, 'PROGRESS.md');
    
    if (!fs.existsSync(progressPath)) {
      this.violations.push({
        type: 'MISSING_PROGRESS_FILE',
        file: 'PROGRESS.md',
        description: 'PROGRESS.md file not found',
        severity: 'HIGH',
        line: 0
      });
      return;
    }

    const content = fs.readFileSync(progressPath, 'utf8');
    const lines = content.split('\n');

    // Check for task-level status in parent document
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for task headers followed by status information
      if (line.match(/### Task \d+\.\d+:/)) {
        // Check next few lines for status information
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j];
          if (nextLine.match(/Status:\s*[🟡🟢🔴⏸️✅]/)) {
            this.violations.push({
              type: 'PARENT_CHILD_VIOLATION',
              file: 'PROGRESS.md',
              description: 'Contains child-level task status information',
              severity: 'HIGH',
              line: j + 1,
              context: `Task: ${line.trim()}, Status: ${nextLine.trim()}`
            });
          }
        }
      }
    }
  }

  // Validate status format consistency
  async validateStatusFormats() {
    console.log('🔍 Validating status format consistency...');

    const taskFiles = this.getAllTaskFiles();
    const validStatusPattern = /^Status:\s*[🟡🟢🔴⏸️✅]\s*\w+(\s*\([^)]*\))?$/;

    for (const file of taskFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      let inCodeBlock = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Track code blocks to skip validation inside them
        if (line.startsWith('```')) {
          inCodeBlock = !inCodeBlock;
          continue;
        }

        // Skip lines inside code blocks
        if (inCodeBlock) {
          continue;
        }

        // Check for status lines
        if (line.includes('Status:')) {
          // Skip if it's part of a bullet point or different context
          if (line.startsWith('- **Status:**') || line.startsWith('**Status:**')) {
            continue;
          }

          // Skip if it's in a code example or regex pattern
          if (line.includes('const') || line.includes('=') || line.includes('/') || line.includes('`')) {
            continue;
          }

          if (!validStatusPattern.test(line)) {
            this.violations.push({
              type: 'STATUS_FORMAT_VIOLATION',
              file: path.relative(this.rootDir, file),
              description: `Status format does not match standard: "${line}"`,
              severity: 'MEDIUM',
              line: i + 1,
              expected: 'Status: [emoji] [Status] ([details])'
            });
          }
        }
      }
    }
  }

  // Validate success criteria completeness
  async validateSuccessCriteria() {
    console.log('🔍 Validating success criteria completeness...');

    const taskFiles = this.getAllTaskFiles();

    for (const file of taskFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(this.rootDir, file);

      // Check if file has Success Criteria section (outside code blocks)
      const hasSuccessCriteria = this.hasActualSuccessCriteriaSection(content);

      if (!hasSuccessCriteria) {
        this.violations.push({
          type: 'MISSING_SUCCESS_CRITERIA',
          file: relativePath,
          description: 'Missing Success Criteria section',
          severity: 'HIGH',
          line: 0
        });
      } else {
        // Extract and validate success criteria content
        const criteriaSection = this.extractSection(content, 'Success Criteria');
        const criteriaCount = this.countCriteriaItems(criteriaSection);

        if (criteriaCount < 8) {
          this.violations.push({
            type: 'INSUFFICIENT_SUCCESS_CRITERIA',
            file: relativePath,
            description: `Only ${criteriaCount} success criteria found (minimum 8 required)`,
            severity: 'MEDIUM',
            line: this.findSectionLine(content, 'Success Criteria')
          });
        } else if (criteriaCount > 10) {
          this.violations.push({
            type: 'EXCESSIVE_SUCCESS_CRITERIA',
            file: relativePath,
            description: `${criteriaCount} success criteria found (maximum 10 recommended)`,
            severity: 'LOW',
            line: this.findSectionLine(content, 'Success Criteria')
          });
        }
      }
    }
  }

  // Validate redundancy issues
  async validateRedundancy() {
    console.log('🔍 Validating redundancy elimination...');
    
    const allFiles = this.getAllDocumentationFiles();
    const statusMap = new Map();

    // Collect all status information
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(this.rootDir, file);
      
      // Find status patterns
      const statusMatches = content.match(/Status:\s*[🟡🟢🔴⏸️✅]\s*\w+(\s*\([^)]*\))?/g) || [];
      
      for (const status of statusMatches) {
        if (!statusMap.has(status)) {
          statusMap.set(status, []);
        }
        statusMap.get(status).push(relativePath);
      }
    }

    // Report duplicate status entries
    for (const [status, files] of statusMap.entries()) {
      if (files.length > 1) {
        this.violations.push({
          type: 'REDUNDANT_STATUS',
          file: files[0],
          description: `Status "${status}" duplicated across ${files.length} files: ${files.join(', ')}`,
          severity: 'LOW',
          line: 0
        });
      }
    }
  }

  // Get all task files
  getAllTaskFiles() {
    const taskFiles = [];
    
    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if (file.includes('task-') && file.endsWith('.md')) {
          taskFiles.push(filePath);
        }
      }
    };
    
    if (fs.existsSync(this.docsDir)) {
      walkDir(this.docsDir);
    }
    
    return taskFiles;
  }

  // Get all documentation files
  getAllDocumentationFiles() {
    const docFiles = [];
    
    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if (file.endsWith('.md')) {
          docFiles.push(filePath);
        }
      }
    };
    
    // Include docs directory
    if (fs.existsSync(this.docsDir)) {
      walkDir(this.docsDir);
    }
    
    // Include root-level docs
    const rootDocs = ['README.md', 'PROGRESS.md', 'ARCHITECTURE.md', 'AWS_SETUP.md'];
    for (const doc of rootDocs) {
      const docPath = path.join(this.rootDir, doc);
      if (fs.existsSync(docPath)) {
        docFiles.push(docPath);
      }
    }
    
    return docFiles;
  }

  // Check if file has actual Success Criteria section (not in code blocks)
  hasActualSuccessCriteriaSection(content) {
    const lines = content.split('\n');
    let inCodeBlock = false;

    for (const line of lines) {
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      if (!inCodeBlock && line.trim() === '## Success Criteria') {
        return true;
      }
    }

    return false;
  }

  // Extract section content
  extractSection(content, sectionName) {
    const lines = content.split('\n');
    let sectionStart = -1;
    let inCodeBlock = false;

    // Find the actual section header (not in code blocks)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      if (!inCodeBlock && lines[i].trim() === `## ${sectionName}`) {
        sectionStart = i;
        break;
      }
    }

    if (sectionStart === -1) return '';

    let sectionEnd = lines.length;
    for (let i = sectionStart + 1; i < lines.length; i++) {
      if (lines[i].startsWith('## ')) {
        sectionEnd = i;
        break;
      }
    }

    return lines.slice(sectionStart, sectionEnd).join('\n');
  }

  // Count criteria items in section
  countCriteriaItems(sectionContent) {
    // Count bullet points, numbered items, and checkboxes
    const bulletPoints = (sectionContent.match(/^\s*[-*+]\s+/gm) || []).length;
    const numberedItems = (sectionContent.match(/^\s*\d+\.\s+/gm) || []).length;
    const checkboxes = (sectionContent.match(/^\s*-\s*\[[ x]\]\s+/gm) || []).length;

    return Math.max(bulletPoints, numberedItems, checkboxes);
  }

  // Find section line number
  findSectionLine(content, sectionName) {
    const lines = content.split('\n');
    return lines.findIndex(line => line.includes(`## ${sectionName}`)) + 1;
  }

  // Calculate compliance score
  calculateComplianceScore() {
    const totalFiles = this.getAllTaskFiles().length;
    if (totalFiles === 0) return 100;

    const highSeverityCount = this.violations.filter(v => v.severity === 'HIGH').length;
    const mediumSeverityCount = this.violations.filter(v => v.severity === 'MEDIUM').length;
    const lowSeverityCount = this.violations.filter(v => v.severity === 'LOW').length;

    // Weight violations by severity
    const weightedViolations = (highSeverityCount * 3) + (mediumSeverityCount * 2) + (lowSeverityCount * 1);
    const maxPossibleViolations = totalFiles * 3; // Assume max 3 high-severity violations per file

    const score = Math.max(0, 100 - (weightedViolations / maxPossibleViolations * 100));
    return Math.round(score);
  }

  // Generate validation report
  generateValidationReport() {
    console.log('\n📋 Documentation Standards Validation Report');
    console.log('='.repeat(60));
    console.log(`Total Violations: ${this.violations.length}`);
    console.log(`Compliance Score: ${this.calculateComplianceScore()}%`);
    console.log('');

    // Group violations by type
    const byType = this.violations.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    }, {});

    if (Object.keys(byType).length > 0) {
      console.log('Violations by Type:');
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count} violations`);
      });
      console.log('');
    }

    // Group violations by severity
    const bySeverity = this.violations.reduce((acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    }, {});

    if (Object.keys(bySeverity).length > 0) {
      console.log('Violations by Severity:');
      Object.entries(bySeverity).forEach(([severity, count]) => {
        const emoji = severity === 'HIGH' ? '🔴' : severity === 'MEDIUM' ? '🟡' : '🟢';
        console.log(`  ${emoji} ${severity}: ${count} violations`);
      });
      console.log('');
    }

    // Detailed violations
    if (this.violations.length > 0) {
      console.log('Detailed Violations:');
      this.violations.forEach((v, i) => {
        const emoji = v.severity === 'HIGH' ? '🔴' : v.severity === 'MEDIUM' ? '🟡' : '🟢';
        console.log(`${i + 1}. ${emoji} ${v.type} in ${v.file}:${v.line || 'N/A'}`);
        console.log(`   ${v.description}`);
        if (v.expected) console.log(`   Expected: ${v.expected}`);
        if (v.context) console.log(`   Context: ${v.context}`);
        console.log('');
      });
    } else {
      console.log('✅ No violations found! All documentation meets standards.');
    }

    console.log('='.repeat(60));

    if (this.violations.length > 0) {
      console.log('🚫 Documentation standards validation failed.');
      console.log('Please fix the violations above and re-run validation.');
    } else {
      console.log('✅ Documentation standards validation passed!');
    }
  }
}

// Run validation if called directly
const currentFile = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === currentFile;

if (isMainModule) {
  const validator = new DocumentationStandardsValidator();
  validator.validateStandards().then(result => {
    if (result.totalViolations > 0) {
      process.exit(1);
    }
  }).catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

export default DocumentationStandardsValidator;
