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

  // Check if a task document has completed status
  isTaskCompleted(filePath) {
    // Only check task documents in progress directory
    if (!filePath.includes('progress') || !filePath.includes('task-')) {
      return false;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // Prefer YAML front-matter 'status' field if present
      const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (frontMatterMatch) {
        const fm = frontMatterMatch[1];
        const statusMatch = fm.match(/status:\s*(.+)/i);
        if (statusMatch) {
          const statusValue = statusMatch[1].toLowerCase();
          if (statusValue.includes('completed') || statusValue.includes('complete') || statusValue.includes('done')) {
            return true;
          }
        }
      }

      // Fallback: Look for completed status indicators in content
      const completedPatterns = [
        /\*\*Status:\*\*\s*✅\s*Complete/i,
        /Status:\s*✅\s*Complete/i,
        /\*\*Status:\*\*\s*🟢\s*Complete/i,
        /Status:\s*🟢\s*Complete/i,
        /Status:\s*Completed/i,
        /\bcompleted\b/i
      ];

      return completedPatterns.some(pattern => pattern.test(content));
    } catch (error) {
      return false;
    }
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
      await this.validateLinkingStructure();
      await this.validateFileOrganization();
      await this.validateStatusConsistency();
      await this.validateCodeSnippetLimits();

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
            // For completed tasks, convert to a warning (recorded in violations with 'LOW' severity)
            if (this.isTaskCompleted(file)) {
              this.violations.push({
                type: 'STATUS_FORMAT_VIOLATION_COMPLETED',
                file: path.relative(this.rootDir, file),
                description: `Status format does not match standard (completed task - warning): "${line}"`,
                severity: 'LOW',
                line: i + 1,
                expected: 'Status: [emoji] [Status] ([details])'
              });
            } else {
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
          // For completed tasks, record as a low-severity warning; otherwise medium violation
          if (this.isTaskCompleted(file)) {
            this.violations.push({
              type: 'INSUFFICIENT_SUCCESS_CRITERIA_COMPLETED',
              file: relativePath,
              description: `Only ${criteriaCount} success criteria found (minimum 8 required) - completed task (warning)`,
              severity: 'LOW',
              line: this.findSectionLine(content, 'Success Criteria')
            });
          } else {
            this.violations.push({
              type: 'INSUFFICIENT_SUCCESS_CRITERIA',
              file: relativePath,
              description: `Only ${criteriaCount} success criteria found (minimum 8 required)`,
              severity: 'MEDIUM',
              line: this.findSectionLine(content, 'Success Criteria')
            });
          }
        } else if (criteriaCount > 10) {
          // For completed tasks, record as a low-severity (already low) warning; otherwise low violation
          if (this.isTaskCompleted(file)) {
            this.violations.push({
              type: 'EXCESSIVE_SUCCESS_CRITERIA_COMPLETED',
              file: relativePath,
              description: `${criteriaCount} success criteria found (maximum 10 recommended) - completed task (warning)`,
              severity: 'LOW',
              line: this.findSectionLine(content, 'Success Criteria')
            });
          } else {
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
        // Check if any of the files are completed tasks
        const hasCompletedTask = files.some(file => this.isTaskCompleted(path.join(this.rootDir, file)));

        if (hasCompletedTask) {
          // Record as a low-severity redundant-status warning for traceability
          this.violations.push({
            type: 'REDUNDANT_STATUS_COMPLETED',
            file: files[0],
            description: `Status "${status}" duplicated across ${files.length} files (includes completed tasks - warning): ${files.join(', ')}`,
            severity: 'LOW',
            line: 0
          });
        } else {
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
  }

  // Validate linking structure (project -> phase -> task)
  async validateLinkingStructure() {
    console.log('🔍 Validating linking structure...');

    const progressPath = path.join(this.rootDir, 'PROGRESS.md');

    if (!fs.existsSync(progressPath)) {
      return;
    }

    const progressContent = fs.readFileSync(progressPath, 'utf8');
    const progressLines = progressContent.split('\n');

    // Check PROGRESS.md links to phase READMEs, not task files
    for (let i = 0; i < progressLines.length; i++) {
      const line = progressLines[i];
      if (line.includes('./docs/progress/phase-') && line.includes('task-')) {
        this.violations.push({
          type: 'LINKING_STRUCTURE_VIOLATION',
          file: 'PROGRESS.md',
          description: 'PROGRESS.md should link to phase READMEs, not individual task files',
          severity: 'MEDIUM',
          line: i + 1,
          expected: 'Link to phase README (e.g., docs/progress/phase-6/README.md)'
        });
      }
    }

    // Check phase READMEs link to task files appropriately
    const phaseReadmes = this.getAllPhaseReadmes();
    for (const readme of phaseReadmes) {
      const content = fs.readFileSync(readme, 'utf8');
      const relativePath = path.relative(this.rootDir, readme);

      // Should contain links to task files
      const taskLinks = content.match(/task-\d+\.\d+-[^\)]+\.md/g) || [];
      if (taskLinks.length === 0) {
        this.violations.push({
          type: 'MISSING_TASK_LINKS',
          file: relativePath,
          description: 'Phase README should contain links to task documents',
          severity: 'LOW',
          line: 0
        });
      }
    }
  }

  // Validate file organization (max files per task, naming)
  async validateFileOrganization() {
    console.log('🔍 Validating file organization...');

    const taskGroups = this.getTaskFileGroups();

    for (const [taskPrefix, files] of taskGroups.entries()) {
      if (files.length > 3) {
        this.violations.push({
          type: 'EXCESSIVE_FILES_PER_TASK',
          file: files[0],
          description: `Task ${taskPrefix} has ${files.length} files (maximum 3 allowed)`,
          severity: 'MEDIUM',
          line: 0,
          expected: 'Consolidate files or split into separate tasks'
        });
      }
    }
  }

  // Validate status consistency across files
  async validateStatusConsistency() {
    console.log('🔍 Validating status consistency...');

    const taskStatuses = this.collectTaskStatuses();

    for (const [taskId, statuses] of taskStatuses.entries()) {
      const uniqueStatuses = [...new Set(statuses.map(s => s.status))];
      if (uniqueStatuses.length > 1) {
        this.violations.push({
          type: 'STATUS_INCONSISTENCY',
          file: statuses[0].file,
          description: `Task ${taskId} has inconsistent status across files: ${uniqueStatuses.join(', ')}`,
          severity: 'HIGH',
          line: statuses[0].line,
          expected: 'All files should show the same status for this task'
        });
      }
    }
  }

  // Validate code snippet length limits
  async validateCodeSnippetLimits() {
    console.log('🔍 Validating code snippet limits...');

    const taskFiles = this.getAllTaskFiles();

    for (const file of taskFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(this.rootDir, file);
      const lines = content.split('\n');

      let inCodeBlock = false;
      let codeBlockStart = -1;
      let totalCodeLines = 0;
      let codeBlocks = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.trim().startsWith('```')) {
          if (!inCodeBlock) {
            inCodeBlock = true;
            codeBlockStart = i;
          } else {
            inCodeBlock = false;
            const codeBlockLength = i - codeBlockStart - 1;
            codeBlocks.push(codeBlockLength);
            totalCodeLines += codeBlockLength;

            if (codeBlockLength > 30) {
              this.violations.push({
                type: 'EXCESSIVE_CODE_SNIPPET',
                file: relativePath,
                description: `Code block exceeds 30 lines (found ${codeBlockLength} lines)`,
                severity: 'LOW',
                line: codeBlockStart + 1,
                expected: 'Break into smaller snippets or link to external file'
              });
            }
          }
        }
      }

      // Check total code content ratio
      const totalLines = lines.length;
      const codeRatio = totalCodeLines / totalLines;

      if (codeRatio > 0.4) {
        this.violations.push({
          type: 'EXCESSIVE_CODE_CONTENT',
          file: relativePath,
          description: `Code content exceeds 40% of document (${(codeRatio * 100).toFixed(1)}%)`,
          severity: 'LOW',
          line: 0,
          expected: 'Reduce code snippets or split into implementation guide'
        });
      }

      // Check for too many code blocks in one section
      if (codeBlocks.length > 5) {
        this.violations.push({
          type: 'TOO_MANY_CODE_BLOCKS',
          file: relativePath,
          description: `Document has ${codeBlocks.length} code blocks (maximum 5 recommended)`,
          severity: 'LOW',
          line: 0,
          expected: 'Consolidate related code or use external references'
        });
      }
    }
  }

  // Get all phase README files
  getAllPhaseReadmes() {
    const readmes = [];

    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if (file === 'README.md' && filePath.includes('phase-')) {
          readmes.push(filePath);
        }
      }
    };

    if (fs.existsSync(this.docsDir)) {
      walkDir(this.docsDir);
    }

    return readmes;
  }

  // Group task files by task prefix
  getTaskFileGroups() {
    const taskGroups = new Map();
    const taskFiles = this.getAllTaskFiles();

    for (const file of taskFiles) {
      const fileName = path.basename(file);
      const match = fileName.match(/^task-(\d+\.\d+)/);
      if (match) {
        const taskPrefix = match[1];
        if (!taskGroups.has(taskPrefix)) {
          taskGroups.set(taskPrefix, []);
        }
        taskGroups.get(taskPrefix).push(path.relative(this.rootDir, file));
      }
    }

    return taskGroups;
  }

  // Collect status information for all tasks
  collectTaskStatuses() {
    const taskStatuses = new Map();
    const allFiles = this.getAllDocumentationFiles();

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(this.rootDir, file);

      // Extract task statuses
      const statusMatches = content.match(/Status:\s*[🟡🟢🔴⏸️✅]\s*\w+(\s*\([^)]*\))?/g) || [];

      for (const statusMatch of statusMatches) {
        // Try to identify which task this status refers to
        const lines = content.split('\n');
        const statusLineIndex = lines.findIndex(line => line.includes(statusMatch));

        // Look backwards for task reference
        for (let i = statusLineIndex; i >= 0; i--) {
          const line = lines[i];
          const taskMatch = line.match(/Task (\d+\.\d+)/i);
          if (taskMatch) {
            const taskId = taskMatch[1];
            if (!taskStatuses.has(taskId)) {
              taskStatuses.set(taskId, []);
            }
            taskStatuses.get(taskId).push({
              status: statusMatch,
              file: relativePath,
              line: statusLineIndex + 1
            });
            break;
          }
        }
      }
    }

    return taskStatuses;
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
