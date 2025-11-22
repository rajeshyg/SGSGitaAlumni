#!/usr/bin/env node
/**
 * Audit Root Clutter
 * Scout phase for root directory cleanup
 * Categorizes all root .js/.mjs/.ps1 files
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

console.log('='.repeat(60));
console.log('AUDIT: ROOT DIRECTORY CLUTTER');
console.log('='.repeat(60));
console.log('');

const categories = {
  config: [],      // Config files (keep)
  server: [],      // Server entry point (keep)
  check: [],       // Check/diagnostic scripts (archive)
  test: [],        // Test scripts (archive or move to tests/)
  cleanup: [],     // Cleanup scripts (archive)
  fix: [],         // Fix scripts (archive)
  create: [],      // Create/setup scripts (archive)
  migrate: [],     // Migration scripts (move to scripts/database/)
  debug: [],       // Debug scripts (archive)
  other: []        // Uncategorized
};

// Get all files in root
const rootFiles = fs.readdirSync(ROOT).filter(f => {
  const ext = path.extname(f);
  return ['.js', '.mjs', '.ps1', '.cjs'].includes(ext);
});

// Categorize each file
rootFiles.forEach(file => {
  const name = file.toLowerCase();

  // Config files to keep
  if (['eslint.config.js', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js'].includes(file)) {
    categories.config.push(file);
  }
  // Server entry point
  else if (file === 'server.js') {
    categories.server.push(file);
  }
  // Check/diagnostic scripts
  else if (name.startsWith('check-') || name.startsWith('verify-') || name.startsWith('show-') || name.startsWith('diagnose-') || name.startsWith('investigate-')) {
    categories.check.push(file);
  }
  // Test scripts
  else if (name.startsWith('test-')) {
    categories.test.push(file);
  }
  // Cleanup scripts
  else if (name.startsWith('cleanup-') || name.startsWith('clear-')) {
    categories.cleanup.push(file);
  }
  // Fix scripts
  else if (name.startsWith('fix-') || name.startsWith('recreate-')) {
    categories.fix.push(file);
  }
  // Create/setup scripts
  else if (name.startsWith('create-') || name.startsWith('reset-')) {
    categories.create.push(file);
  }
  // Migration scripts
  else if (name.startsWith('migrate-') || name.startsWith('run-') || name.startsWith('add-')) {
    categories.migrate.push(file);
  }
  // Debug scripts
  else if (name.startsWith('debug-')) {
    categories.debug.push(file);
  }
  // Other
  else {
    categories.other.push(file);
  }
});

// Output report
console.log('## File Categories\n');

const keepCount = categories.config.length + categories.server.length;
const archiveCount = categories.check.length + categories.test.length +
                     categories.cleanup.length + categories.fix.length +
                     categories.create.length + categories.debug.length;
const moveCount = categories.migrate.length;

console.log(`### Keep in Root (${keepCount} files)`);
console.log('Config files and server entry point:');
[...categories.config, ...categories.server].forEach(f => console.log(`  - ${f}`));
console.log('');

console.log(`### Archive to scripts/archive/ (${archiveCount} files)`);
console.log('One-time diagnostic and fix scripts:\n');

if (categories.check.length > 0) {
  console.log(`**Check/Diagnostic (${categories.check.length}):**`);
  categories.check.forEach(f => console.log(`  - ${f}`));
}

if (categories.test.length > 0) {
  console.log(`\n**Test Scripts (${categories.test.length}):**`);
  categories.test.forEach(f => console.log(`  - ${f}`));
}

if (categories.cleanup.length > 0) {
  console.log(`\n**Cleanup Scripts (${categories.cleanup.length}):**`);
  categories.cleanup.forEach(f => console.log(`  - ${f}`));
}

if (categories.fix.length > 0) {
  console.log(`\n**Fix Scripts (${categories.fix.length}):**`);
  categories.fix.forEach(f => console.log(`  - ${f}`));
}

if (categories.create.length > 0) {
  console.log(`\n**Create/Setup Scripts (${categories.create.length}):**`);
  categories.create.forEach(f => console.log(`  - ${f}`));
}

if (categories.debug.length > 0) {
  console.log(`\n**Debug Scripts (${categories.debug.length}):**`);
  categories.debug.forEach(f => console.log(`  - ${f}`));
}

console.log('');

console.log(`### Move to scripts/database/ (${moveCount} files)`);
console.log('Migration and database scripts:');
categories.migrate.forEach(f => console.log(`  - ${f}`));
console.log('');

if (categories.other.length > 0) {
  console.log(`### Uncategorized (${categories.other.length} files)`);
  console.log('Review manually:');
  categories.other.forEach(f => console.log(`  - ${f}`));
  console.log('');
}

// Summary
console.log('='.repeat(60));
console.log('## Summary');
console.log(`  Total root scripts: ${rootFiles.length}`);
console.log(`  Keep: ${keepCount}`);
console.log(`  Archive: ${archiveCount}`);
console.log(`  Move to scripts/database/: ${moveCount}`);
console.log(`  Review: ${categories.other.length}`);
console.log('');

// Output JSON manifest
const manifest = {
  timestamp: new Date().toISOString(),
  total: rootFiles.length,
  keep: [...categories.config, ...categories.server],
  archive: [
    ...categories.check,
    ...categories.test,
    ...categories.cleanup,
    ...categories.fix,
    ...categories.create,
    ...categories.debug
  ],
  moveToDatabase: categories.migrate,
  review: categories.other
};

const manifestPath = path.join(ROOT, 'scripts/validation/root-clutter-manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`Manifest written to: scripts/validation/root-clutter-manifest.json`);
console.log('='.repeat(60));

// Exit with warning if many files to clean
process.exit(archiveCount + moveCount > 50 ? 1 : 0);
