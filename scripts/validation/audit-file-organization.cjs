#!/usr/bin/env node
/**
 * Audit File Organization
 * Detects organizational anti-patterns:
 * - Backup/old files
 * - Duplicate patterns (*-new, *-v2, *-fixed)
 * - Empty/stub files
 * - Temp files
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

console.log('='.repeat(60));
console.log('AUDIT: FILE ORGANIZATION');
console.log('='.repeat(60));
console.log('');

const issues = {
  backup: [],
  duplicate: [],
  empty: [],
  temp: [],
  stub: []
};

function walkDir(dir, callback, relativePath = '') {
  if (!fs.existsSync(dir)) return;

  const items = fs.readdirSync(dir);
  items.forEach(item => {
    if (item === 'node_modules' || item === '.git') return;

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

// Scan for issues
walkDir(ROOT, (relPath, fullPath, stat) => {
  const name = path.basename(relPath).toLowerCase();
  const ext = path.extname(relPath);

  // Backup/old files
  if (/-old|\.old|\.bak|-backup|_backup|\.backup|-copy|_copy/.test(name)) {
    issues.backup.push(relPath);
  }

  // Duplicate patterns
  if (/-new|-v2|-v3|-fixed|-updated|-final/.test(name)) {
    issues.duplicate.push(relPath);
  }

  // Empty files
  if (['.js', '.ts', '.tsx', '.jsx'].includes(ext) && stat.size === 0) {
    issues.empty.push(relPath);
  }

  // Temp files
  if (/\.tmp|\.temp|\.log$|~$/.test(name) || name.startsWith('temp')) {
    issues.temp.push(relPath);
  }

  // Stub files (.js where .ts exists)
  if (ext === '.js') {
    const tsPath = fullPath.replace(/\.js$/, '.ts');
    const tsxPath = fullPath.replace(/\.js$/, '.tsx');
    if (fs.existsSync(tsPath) || fs.existsSync(tsxPath)) {
      issues.stub.push(relPath);
    }
  }
});

// Output report
console.log('## Issues Found\n');

if (issues.backup.length > 0) {
  console.log(`### Backup/Old Files (${issues.backup.length})`);
  console.log('Action: Delete or archive');
  issues.backup.forEach(f => console.log(`  - ${f}`));
  console.log('');
}

if (issues.duplicate.length > 0) {
  console.log(`### Duplicate Patterns (${issues.duplicate.length})`);
  console.log('Action: Consolidate - keep one version');
  issues.duplicate.forEach(f => console.log(`  - ${f}`));
  console.log('');
}

if (issues.empty.length > 0) {
  console.log(`### Empty Files (${issues.empty.length})`);
  console.log('Action: Delete');
  issues.empty.forEach(f => console.log(`  - ${f}`));
  console.log('');
}

if (issues.temp.length > 0) {
  console.log(`### Temp/Log Files (${issues.temp.length})`);
  console.log('Action: Delete');
  issues.temp.forEach(f => console.log(`  - ${f}`));
  console.log('');
}

if (issues.stub.length > 0) {
  console.log(`### JS Stubs (.js where .ts exists) (${issues.stub.length})`);
  console.log('Action: Delete .js file');
  issues.stub.forEach(f => console.log(`  - ${f}`));
  console.log('');
}

// Summary
const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);

console.log('='.repeat(60));
console.log('## Summary');
console.log(`  Backup/old files: ${issues.backup.length}`);
console.log(`  Duplicate patterns: ${issues.duplicate.length}`);
console.log(`  Empty files: ${issues.empty.length}`);
console.log(`  Temp/log files: ${issues.temp.length}`);
console.log(`  JS stubs: ${issues.stub.length}`);
console.log(`  Total issues: ${totalIssues}`);
console.log('='.repeat(60));

// Write manifest
const manifest = {
  timestamp: new Date().toISOString(),
  total: totalIssues,
  issues
};

const manifestPath = path.join(ROOT, 'scripts/validation/file-organization-manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`Manifest written to: scripts/validation/file-organization-manifest.json`);

process.exit(totalIssues > 20 ? 1 : 0);
