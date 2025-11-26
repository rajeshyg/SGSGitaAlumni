#!/usr/bin/env node
/**
 * Unified Project Structure Validator (Blocking)
 * - Walks the repo and validates each file path against structure-rules.cjs
 * - Exits 1 on errors, 0 on success (prints warnings but does not block)
 */

const fs = require('fs');
const path = require('path');
const {
  validateFilePath,
  isException,
} = require('./structure-rules.cjs');

const PROJECT_ROOT = path.resolve(__dirname, '../..');

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'coverage',
  'playwright-report',
  'test-results',
]);

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(PROJECT_ROOT, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        walk(fullPath, files);
      }
    } else {
      files.push(relPath);
    }
  }
  return files;
}

function main() {
  console.log('📁 Validating project structure (files, folders, extensions)...');
  const files = walk(PROJECT_ROOT);
  let errors = [];
  let warnings = [];

  for (const relPath of files) {
    // Skip exceptions explicitly allowed
    if (isException(relPath)) continue;
    const result = validateFilePath(relPath);
    if (!result.valid) {
      errors.push(...result.errors.map(e => `${relPath}: ${e}`));
    }
    if (result.warnings.length) {
      warnings.push(...result.warnings.map(w => `${relPath}: ${w}`));
    }
  }

  if (warnings.length) {
    console.log(`\n⚠️  Warnings (${warnings.length})`);
    warnings.slice(0, 50).forEach(w => console.log('  - ' + w));
    if (warnings.length > 50) console.log(`  ... ${warnings.length - 50} more`);
  }

  if (errors.length) {
    console.error(`\n❌ Errors (${errors.length})`);
    errors.slice(0, 50).forEach(e => console.error('  - ' + e));
    if (errors.length > 50) console.error(`  ... ${errors.length - 50} more`);
    console.error('\nCommit blocked. Fix the above issues.');
    process.exit(1);
  }

  console.log('\n✅ Structure validation passed.');
  process.exit(0);
}

main();
