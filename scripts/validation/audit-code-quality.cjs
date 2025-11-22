#!/usr/bin/env node
/**
 * Audit Code Quality
 * Static analysis for code health:
 * - Large files (>500 lines)
 * - TODO/FIXME/HACK comments
 * - Console.log statements (non-debug)
 * - Hardcoded credentials patterns
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

console.log('='.repeat(60));
console.log('AUDIT: CODE QUALITY');
console.log('='.repeat(60));
console.log('');

const issues = {
  largeFiles: [],
  todoComments: [],
  consoleLogs: [],
  hardcodedSecrets: []
};

function walkDir(dir, callback, relativePath = '') {
  if (!fs.existsSync(dir)) return;

  const items = fs.readdirSync(dir);
  items.forEach(item => {
    if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'build') return;

    const fullPath = path.join(dir, item);
    const relPath = path.join(relativePath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walkDir(fullPath, callback, relPath);
    } else {
      callback(relPath, fullPath, stat);
    }
  });
}

// Scan code files
walkDir(ROOT, (relPath, fullPath, stat) => {
  const ext = path.extname(relPath);
  if (!['.js', '.ts', '.tsx', '.jsx', '.cjs', '.mjs'].includes(ext)) return;

  // Skip test files for some checks
  const isTest = relPath.includes('test') || relPath.includes('spec');

  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');

  // Large files
  if (lines.length > 500) {
    issues.largeFiles.push({ file: relPath, lines: lines.length });
  }

  // TODO/FIXME/HACK comments
  const todoMatches = content.match(/\/\/\s*(TODO|FIXME|HACK|XXX):/gi);
  if (todoMatches) {
    issues.todoComments.push({ file: relPath, count: todoMatches.length });
  }

  // Console.log in non-test files (excluding proper logger usage)
  if (!isTest) {
    const consoleMatches = content.match(/console\.(log|warn|error)\(/g);
    if (consoleMatches && consoleMatches.length > 5) {
      issues.consoleLogs.push({ file: relPath, count: consoleMatches.length });
    }
  }

  // Hardcoded secrets patterns
  const secretPatterns = [
    /password\s*=\s*['"][^'"]+['"]/gi,
    /secret\s*=\s*['"][^'"]+['"]/gi,
    /api_key\s*=\s*['"][^'"]+['"]/gi,
    /token\s*=\s*['"][a-zA-Z0-9]{20,}['"]/gi
  ];

  secretPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      // Filter out obvious false positives
      const realMatches = matches.filter(m =>
        !m.includes('process.env') &&
        !m.includes('undefined') &&
        !m.includes("''") &&
        !m.includes('""')
      );
      if (realMatches.length > 0) {
        issues.hardcodedSecrets.push({ file: relPath, matches: realMatches.length });
      }
    }
  });
});

// Output report
console.log('## Issues Found\n');

if (issues.largeFiles.length > 0) {
  console.log(`### Large Files >500 lines (${issues.largeFiles.length})`);
  console.log('Action: Consider splitting');
  issues.largeFiles
    .sort((a, b) => b.lines - a.lines)
    .forEach(f => console.log(`  - ${f.file} (${f.lines} lines)`));
  console.log('');
}

if (issues.todoComments.length > 0) {
  console.log(`### Files with TODO/FIXME Comments (${issues.todoComments.length})`);
  console.log('Action: Address or create tasks');
  issues.todoComments
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
    .forEach(f => console.log(`  - ${f.file} (${f.count} TODOs)`));
  if (issues.todoComments.length > 20) {
    console.log(`  ... and ${issues.todoComments.length - 20} more files`);
  }
  console.log('');
}

if (issues.consoleLogs.length > 0) {
  console.log(`### Excessive Console Logs (${issues.consoleLogs.length})`);
  console.log('Action: Replace with proper logger');
  issues.consoleLogs
    .sort((a, b) => b.count - a.count)
    .forEach(f => console.log(`  - ${f.file} (${f.count} logs)`));
  console.log('');
}

if (issues.hardcodedSecrets.length > 0) {
  console.log(`### Potential Hardcoded Secrets (${issues.hardcodedSecrets.length})`);
  console.log('Action: CRITICAL - Review immediately');
  issues.hardcodedSecrets.forEach(f => console.log(`  - ${f.file}`));
  console.log('');
}

// Summary
const totalIssues = issues.largeFiles.length + issues.todoComments.length +
                    issues.consoleLogs.length + issues.hardcodedSecrets.length;
const totalTodos = issues.todoComments.reduce((sum, f) => sum + f.count, 0);

console.log('='.repeat(60));
console.log('## Summary');
console.log(`  Large files: ${issues.largeFiles.length}`);
console.log(`  Files with TODOs: ${issues.todoComments.length} (${totalTodos} total TODOs)`);
console.log(`  Excessive console.logs: ${issues.consoleLogs.length}`);
console.log(`  Potential secrets: ${issues.hardcodedSecrets.length}`);
console.log('='.repeat(60));

// Write manifest
const manifest = {
  timestamp: new Date().toISOString(),
  summary: {
    largeFiles: issues.largeFiles.length,
    todoFiles: issues.todoComments.length,
    totalTodos,
    consoleLogs: issues.consoleLogs.length,
    secrets: issues.hardcodedSecrets.length
  },
  issues
};

const manifestPath = path.join(ROOT, 'scripts/validation/code-quality-manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`Manifest written to: scripts/validation/code-quality-manifest.json`);

// Exit with error if potential secrets found
process.exit(issues.hardcodedSecrets.length > 0 ? 1 : 0);
