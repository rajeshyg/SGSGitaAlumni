#!/usr/bin/env node
/**
 * Structure Validation Script
 * Enforces project structure rules:
 * - One .mmd file per module
 * - One playwright test file per module
 * - Detects duplicate files, folders, and code patterns
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const ERRORS = [];
const WARNINGS = [];

// Module definitions - each module should have exactly ONE of each
const MODULES = [
  'authentication',
  'user-management',
  'directory',
  'postings',
  'messaging',
  'dashboard',
  'moderation',
  'notifications',
  'rating'
];

// =============================================================================
// Rule 1: One .mmd file per module
// =============================================================================
function validateMmdFiles() {
  console.log('\n📊 Validating .mmd files (one per module)...');

  const mmdFiles = findFiles(PROJECT_ROOT, '.mmd', ['node_modules', 'dist', '.git']);
  const mmdByModule = {};

  mmdFiles.forEach(file => {
    const fileName = path.basename(file, '.mmd').toLowerCase();
    const matched = MODULES.find(m => fileName.includes(m.replace('-', '')));

    if (matched) {
      if (!mmdByModule[matched]) {
        mmdByModule[matched] = [];
      }
      mmdByModule[matched].push(file);
    }
  });

  // Check for duplicates
  Object.entries(mmdByModule).forEach(([module, files]) => {
    if (files.length > 1) {
      ERRORS.push(`DUPLICATE: Module "${module}" has ${files.length} .mmd files:\n  - ${files.join('\n  - ')}`);
    }
  });

  console.log(`  Found ${mmdFiles.length} .mmd files`);
}

// =============================================================================
// Rule 2: One Playwright test file per module
// =============================================================================
function validatePlaywrightFiles() {
  console.log('\n🎭 Validating Playwright test files (one per module)...');

  const testDir = path.join(PROJECT_ROOT, 'tests/e2e');
  if (!fs.existsSync(testDir)) {
    WARNINGS.push('No tests/e2e directory found');
    return;
  }

  const specFiles = findFiles(testDir, '.spec.ts', []);
  const specByModule = {};

  // Map spec files to modules
  const moduleMapping = {
    'auth': 'authentication',
    'dashboard': 'dashboard',
    'chat': 'messaging',
    'posting': 'postings',
    'post': 'postings',
    'moderation': 'moderation'
  };

  specFiles.forEach(file => {
    const fileName = path.basename(file, '.spec.ts').toLowerCase();

    Object.entries(moduleMapping).forEach(([key, module]) => {
      if (fileName.includes(key)) {
        if (!specByModule[module]) {
          specByModule[module] = [];
        }
        specByModule[module].push(file);
      }
    });
  });

  // Check for duplicates
  Object.entries(specByModule).forEach(([module, files]) => {
    if (files.length > 1) {
      WARNINGS.push(`MULTIPLE TESTS: Module "${module}" has ${files.length} test files:\n  - ${files.map(f => path.basename(f)).join('\n  - ')}\n  Consider consolidating into one comprehensive test.`);
    }
  });

  console.log(`  Found ${specFiles.length} .spec.ts files`);
}

// =============================================================================
// Rule 3: Detect duplicate files by content hash
// =============================================================================
function detectDuplicateFiles() {
  console.log('\n🔍 Detecting duplicate files by content...');

  const extensions = ['.js', '.ts', '.tsx', '.md', '.json'];
  const excludeDirs = ['node_modules', 'dist', '.git', 'coverage', 'build'];

  const fileHashes = {};
  let totalFiles = 0;

  extensions.forEach(ext => {
    const files = findFiles(PROJECT_ROOT, ext, excludeDirs);

    files.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        // Skip very small files
        if (content.length < 100) return;

        const hash = crypto.createHash('md5').update(content).digest('hex');

        if (!fileHashes[hash]) {
          fileHashes[hash] = [];
        }
        fileHashes[hash].push(file);
        totalFiles++;
      } catch (err) {
        // Skip unreadable files
      }
    });
  });

  // Find duplicates
  const duplicates = Object.entries(fileHashes)
    .filter(([hash, files]) => files.length > 1)
    .map(([hash, files]) => files);

  duplicates.forEach(files => {
    const relativePaths = files.map(f => path.relative(PROJECT_ROOT, f));
    ERRORS.push(`DUPLICATE FILES (identical content):\n  - ${relativePaths.join('\n  - ')}`);
  });

  console.log(`  Scanned ${totalFiles} files, found ${duplicates.length} duplicate groups`);
}

// =============================================================================
// Rule 4: Detect similar file names (potential duplicates)
// =============================================================================
function detectSimilarFileNames() {
  console.log('\n📝 Detecting similar file names...');

  const excludeDirs = ['node_modules', 'dist', '.git', 'coverage', 'build'];
  const allFiles = [];

  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;

    fs.readdirSync(dir).forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!excludeDirs.includes(file)) {
          walkDir(fullPath);
        }
      } else {
        allFiles.push(fullPath);
      }
    });
  }

  walkDir(PROJECT_ROOT);

  // Group by base name (without extension and path)
  const byBaseName = {};
  allFiles.forEach(file => {
    const baseName = path.basename(file).replace(/\.(js|ts|tsx|jsx|md)$/, '').toLowerCase();
    if (!byBaseName[baseName]) {
      byBaseName[baseName] = [];
    }
    byBaseName[baseName].push(file);
  });

  // Flag groups with same base name in different locations
  Object.entries(byBaseName)
    .filter(([name, files]) => files.length > 1)
    .forEach(([name, files]) => {
      // Check if they're the same file type (potential real duplicate)
      const extensions = files.map(f => path.extname(f));
      const uniqueExts = [...new Set(extensions)];

      if (uniqueExts.length === 1 || (uniqueExts.includes('.js') && uniqueExts.includes('.ts'))) {
        const relativePaths = files.map(f => path.relative(PROJECT_ROOT, f));
        WARNINGS.push(`SIMILAR FILES "${name}":\n  - ${relativePaths.join('\n  - ')}`);
      }
    });

  console.log(`  Analyzed ${allFiles.length} files`);
}

// =============================================================================
// Rule 5: Database entity duplicate detection patterns
// =============================================================================
function detectDatabaseDuplicatePatterns() {
  console.log('\n🗄️  Checking for database duplicate handling...');

  const routeFiles = findFiles(path.join(PROJECT_ROOT, 'routes'), '.js', []);
  const serviceFiles = findFiles(path.join(PROJECT_ROOT, 'services'), '.js', []);
  const serverServiceFiles = findFiles(path.join(PROJECT_ROOT, 'server/services'), '.js', []);

  const allDbFiles = [...routeFiles, ...serviceFiles, ...serverServiceFiles];
  let missingUniqueConstraints = 0;

  allDbFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');

      // Check for INSERT without ON DUPLICATE KEY or REPLACE
      const insertMatches = content.match(/INSERT\s+INTO\s+\w+/gi) || [];
      const hasUpsertHandling = content.includes('ON DUPLICATE KEY') ||
                                content.includes('INSERT OR REPLACE') ||
                                content.includes('INSERT IGNORE');

      if (insertMatches.length > 0 && !hasUpsertHandling) {
        // Check if there's explicit duplicate checking before insert
        const hasDupeCheck = content.includes('SELECT') &&
                           (content.includes('EXISTS') || content.includes('COUNT(*)'));

        if (!hasDupeCheck) {
          missingUniqueConstraints++;
        }
      }
    } catch (err) {
      // Skip unreadable files
    }
  });

  if (missingUniqueConstraints > 0) {
    WARNINGS.push(`Found ${missingUniqueConstraints} files with INSERT statements that may not handle duplicates. Consider using ON DUPLICATE KEY UPDATE or explicit duplicate checks.`);
  }

  console.log(`  Analyzed ${allDbFiles.length} database-related files`);
}

// =============================================================================
// Helper: Find files by extension
// =============================================================================
function findFiles(dir, extension, excludeDirs) {
  const results = [];

  if (!fs.existsSync(dir)) return results;

  function walk(currentDir) {
    fs.readdirSync(currentDir).forEach(file => {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!excludeDirs.includes(file)) {
          walk(fullPath);
        }
      } else if (file.endsWith(extension)) {
        results.push(fullPath);
      }
    });
  }

  walk(dir);
  return results;
}

// =============================================================================
// Main execution
// =============================================================================
console.log('🔎 Running Structure Validation...\n');
console.log('=' .repeat(60));

validateMmdFiles();
validatePlaywrightFiles();
detectDuplicateFiles();
detectSimilarFileNames();
detectDatabaseDuplicatePatterns();

console.log('\n' + '='.repeat(60));

// Report results
if (ERRORS.length > 0) {
  console.log('\n❌ ERRORS (must fix):');
  ERRORS.forEach((err, i) => console.log(`\n${i + 1}. ${err}`));
}

if (WARNINGS.length > 0) {
  console.log('\n⚠️  WARNINGS (should review):');
  WARNINGS.forEach((warn, i) => console.log(`\n${i + 1}. ${warn}`));
}

if (ERRORS.length === 0 && WARNINGS.length === 0) {
  console.log('\n✅ All validations passed!');
}

// Exit with error code if there are errors
const exitCode = ERRORS.length > 0 ? 1 : 0;
console.log(`\n📊 Summary: ${ERRORS.length} errors, ${WARNINGS.length} warnings`);
process.exit(exitCode);
