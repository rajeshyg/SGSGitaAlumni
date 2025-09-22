#!/usr/bin/env node

/**
 * Documentation Consistency Checker
 *
 * This script checks for:
 * 1. Duplicate content across documentation files
 * 2. Conflicting metrics and standards
 * 3. Document size violations
 * 4. Broken cross-references
 *
 * Usage: node scripts/check-documentation.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  docsDir: 'docs',
  maxSizes: {
    overview: 500,        // Increased from 250 to 500 (per updated DOCUMENTATION_STANDARDS.md)
    implementation: 800,  // Increased from 400 to 800 (per updated DOCUMENTATION_STANDARDS.md)
    reference: 600,       // Increased from 300 to 600 (per updated DOCUMENTATION_STANDARDS.md)
    standards: 900        // Increased from 450 to 900 (per updated DOCUMENTATION_STANDARDS.md)
  },
  authoritative: {
    'performance': 'docs/standards/PERFORMANCE_TARGETS.md',
    'quality': 'docs/standards/QUALITY_METRICS.md',
    'theme': 'docs/development/THEME_SYSTEM.md',
    'testing': 'docs/development/TESTING_GUIDE.md'
  },
  criticalMetrics: [
    'Bundle Size',
    'First Contentful Paint',
    'File Size',
    'Test Coverage',
    'Function Size'
  ]
};

class DocumentationChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.files = [];
  }

  // Check if a task document has completed status
  isTaskCompleted(file) {
    // Only check task documents in progress directory
    if (!file.path.includes('progress/') || !file.path.includes('task-')) {
      return false;
    }

    // Look for completed status indicators
    const completedPatterns = [
      /\*\*Status:\*\*\s*✅\s*Complete/i,
      /Status:\s*✅\s*Complete/i,
      /\*\*Status:\*\*\s*🟢\s*Complete/i,
      /Status:\s*🟢\s*Complete/i
    ];

    return completedPatterns.some(pattern => pattern.test(file.content));
  }

  // Main execution function
  async run() {
    console.log('🔍 Starting Documentation Consistency Check...\n');
    
    try {
      this.loadDocumentationFiles();
      this.checkDocumentSizes();
      this.checkDuplicateContent();
      this.checkConflictingMetrics();
      this.checkCrossReferences();
      
      this.reportResults();
      
      // Exit with error code if critical issues found
      if (this.errors.length > 0) {
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Error running documentation check:', error.message);
      process.exit(1);
    }
  }

  // Load all markdown files
  loadDocumentationFiles() {
    const findMarkdownFiles = (dir) => {
      const files = [];
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...findMarkdownFiles(fullPath));
        } else if (item.endsWith('.md')) {
          files.push({
            path: fullPath,
            name: item,
            content: fs.readFileSync(fullPath, 'utf8'),
            lines: fs.readFileSync(fullPath, 'utf8').split('\n').length
          });
        }
      }
      return files;
    };

    this.files = [
      ...findMarkdownFiles(CONFIG.docsDir),
      // Include root-level docs
      ...['README.md', 'PROGRESS.md', 'ARCHITECTURE.md', 'AWS_SETUP.md', 'TEST_RESULTS.md']
        .filter(file => fs.existsSync(file))
        .map(file => ({
          path: file,
          name: file,
          content: fs.readFileSync(file, 'utf8'),
          lines: fs.readFileSync(file, 'utf8').split('\n').length
        }))
    ];

    console.log(`📄 Found ${this.files.length} documentation files`);
  }

  // Check document size violations
  checkDocumentSizes() {
    console.log('📏 Checking document sizes...');
    
    for (const file of this.files) {
      let maxSize = CONFIG.maxSizes.reference; // default
      
      // Determine document type and size limit
      if (file.name.includes('OVERVIEW') || file.name === 'README.md') {
        maxSize = CONFIG.maxSizes.overview;
      } else if (file.name.includes('GUIDE') || file.name.includes('IMPLEMENTATION') ||
                 file.path.includes('progress/phase-') || // Task documents are implementation-level
                 file.name.includes('task-') ||
                 file.name.includes('subtask-')) {
        maxSize = CONFIG.maxSizes.implementation;
      } else if (file.path.includes('standards/')) {
        maxSize = CONFIG.maxSizes.standards;
      }
      
      if (file.lines > maxSize) {
        // Skip size violations for completed tasks (considered minor issue)
        if (this.isTaskCompleted(file)) {
          this.warnings.push({
            type: 'SIZE_VIOLATION_COMPLETED_TASK',
            file: file.path,
            message: `Document exceeds size limit: ${file.lines} lines (max: ${maxSize}) - IGNORED (task completed)`
          });
        } else {
          this.errors.push({
            type: 'SIZE_VIOLATION',
            file: file.path,
            message: `Document exceeds size limit: ${file.lines} lines (max: ${maxSize})`
          });
        }
      }
    }
  }

  // Check for duplicate content
  checkDuplicateContent() {
    console.log('🔍 Checking for duplicate content...');
    
    const contentBlocks = new Map();
    
    for (const file of this.files) {
      // Extract code blocks and significant text blocks
      const codeBlocks = file.content.match(/```[\s\S]*?```/g) || [];
      const textBlocks = file.content.split('\n')
        .filter(line => line.length > 50 && !line.startsWith('#'))
        .slice(0, 20); // Check first 20 significant lines
      
      [...codeBlocks, ...textBlocks].forEach(block => {
        const normalized = block.trim().toLowerCase();
        if (normalized.length > 100) { // Only check substantial blocks
          if (contentBlocks.has(normalized)) {
            this.warnings.push({
              type: 'DUPLICATE_CONTENT',
              files: [contentBlocks.get(normalized), file.path],
              message: `Potential duplicate content found`
            });
          } else {
            contentBlocks.set(normalized, file.path);
          }
        }
      });
    }
  }

  // Check for conflicting metrics
  checkConflictingMetrics() {
    console.log('⚖️ Checking for conflicting metrics...');
    
    const metrics = new Map();
    
    for (const file of this.files) {
      CONFIG.criticalMetrics.forEach(metric => {
        const regex = new RegExp(`${metric}[^\\n]*?([<>]\\s*[\\d.]+\\s*[a-zA-Z%]+)`, 'gi');
        const matches = file.content.match(regex);
        
        if (matches) {
          matches.forEach(match => {
            const key = `${metric}:${match.toLowerCase()}`;
            if (metrics.has(key)) {
              metrics.get(key).push(file.path);
            } else {
              metrics.set(key, [file.path]);
            }
          });
        }
      });
    }
    
    // Check for different values for same metric
    const metricValues = new Map();
    for (const [key, files] of metrics) {
      const [metric] = key.split(':');
      if (metricValues.has(metric)) {
        metricValues.get(metric).push({ key, files });
      } else {
        metricValues.set(metric, [{ key, files }]);
      }
    }
    
    for (const [metric, values] of metricValues) {
      if (values.length > 1) {
        this.errors.push({
          type: 'CONFLICTING_METRICS',
          metric,
          message: `Conflicting values found for ${metric}`,
          details: values
        });
      }
    }
  }

  // Check cross-references
  checkCrossReferences() {
    console.log('🔗 Checking cross-references...');
    
    for (const file of this.files) {
      // Find markdown links
      const links = file.content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
      
      links.forEach(link => {
        const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (match) {
          const [, text, url] = match;
          
          // Check internal links
          if (url.startsWith('../') || url.startsWith('./') || (!url.startsWith('http') && url.includes('.md'))) {
            const targetPath = path.resolve(path.dirname(file.path), url.split('#')[0]);
            
            if (!fs.existsSync(targetPath)) {
              this.warnings.push({
                type: 'BROKEN_LINK',
                file: file.path,
                message: `Broken internal link: ${url}`
              });
            }
          }
        }
      });
    }
  }

  // Report results
  reportResults() {
    console.log('\n📊 Documentation Check Results\n');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All documentation checks passed!');
      return;
    }
    
    if (this.errors.length > 0) {
      console.log('❌ ERRORS (will block commit):');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.type}: ${error.message}`);
        if (error.file) console.log(`   File: ${error.file}`);
        if (error.details) console.log(`   Details:`, error.details);
        console.log();
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('⚠️ WARNINGS:');
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning.type}: ${warning.message}`);
        if (warning.file) console.log(`   File: ${warning.file}`);
        if (warning.files) console.log(`   Files: ${warning.files.join(', ')}`);
        console.log();
      });
    }
    
    console.log(`\nSummary: ${this.errors.length} errors, ${this.warnings.length} warnings`);
    
    if (this.errors.length > 0) {
      console.log('\n🚫 Commit blocked due to documentation errors. Please fix and try again.');
    }
  }
}

// Run the checker
const checker = new DocumentationChecker();
checker.run();

export default DocumentationChecker;
