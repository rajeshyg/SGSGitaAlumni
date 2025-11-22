#!/usr/bin/env node
/**
 * Duplicate Cleanup Script
 * Identifies and helps remove duplicate files
 * Run with --dry-run to see what would be removed
 * Run with --execute to actually remove duplicates
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--execute');

if (DRY_RUN) {
  console.log('🔍 Running in DRY RUN mode. Use --execute to actually remove files.\n');
} else {
  console.log('⚠️  Running in EXECUTE mode. Files will be deleted!\n');
}

// =============================================================================
// Known stub files to remove (TypeScript versions exist)
// =============================================================================
const KNOWN_STUBS = [
  'src/services/EmailService.js',
  'src/services/AlumniDataIntegrationService.js',
  'src/services/StreamlinedRegistrationService.js',
  'src/lib/security/HMACTokenService.js',
  'src/lib/monitoring/server.js'
];

function removeKnownStubs() {
  console.log('📁 Checking for known stub files...');

  KNOWN_STUBS.forEach(stub => {
    const fullPath = path.join(PROJECT_ROOT, stub);
    const tsPath = fullPath.replace('.js', '.ts');

    if (fs.existsSync(fullPath) && fs.existsSync(tsPath)) {
      console.log(`  Found stub: ${stub}`);
      if (!DRY_RUN) {
        fs.unlinkSync(fullPath);
        console.log(`    ✓ Deleted`);
      } else {
        console.log(`    Would delete (dry run)`);
      }
    }
  });
}

// =============================================================================
// Find and remove duplicate files by content hash
// =============================================================================
function findDuplicates() {
  console.log('\n🔍 Finding duplicate files by content...');

  const extensions = ['.js', '.ts', '.tsx', '.md'];
  const excludeDirs = ['node_modules', 'dist', '.git', 'coverage', 'build'];

  const fileHashes = {};

  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;

    fs.readdirSync(dir).forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!excludeDirs.includes(file)) {
          walkDir(fullPath);
        }
      } else if (extensions.some(ext => file.endsWith(ext))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.length < 100) return; // Skip tiny files

          const hash = crypto.createHash('md5').update(content).digest('hex');

          if (!fileHashes[hash]) {
            fileHashes[hash] = [];
          }
          fileHashes[hash].push(fullPath);
        } catch (err) {
          // Skip unreadable files
        }
      }
    });
  }

  walkDir(PROJECT_ROOT);

  // Process duplicates
  const duplicates = Object.entries(fileHashes)
    .filter(([hash, files]) => files.length > 1);

  console.log(`  Found ${duplicates.length} groups of duplicate files\n`);

  duplicates.forEach(([hash, files], index) => {
    console.log(`\nDuplicate Group ${index + 1}:`);

    // Sort by path depth (prefer to keep files in more specific locations)
    files.sort((a, b) => {
      const depthA = a.split(path.sep).length;
      const depthB = b.split(path.sep).length;
      return depthA - depthB;
    });

    const keep = files[0];
    const remove = files.slice(1);

    console.log(`  Keep: ${path.relative(PROJECT_ROOT, keep)}`);
    remove.forEach(file => {
      const relativePath = path.relative(PROJECT_ROOT, file);
      console.log(`  Remove: ${relativePath}`);

      if (!DRY_RUN) {
        fs.unlinkSync(file);
        console.log(`    ✓ Deleted`);
      }
    });
  });

  return duplicates.length;
}

// =============================================================================
// Remove empty directories
// =============================================================================
function removeEmptyDirs() {
  console.log('\n📂 Checking for empty directories...');

  const excludeDirs = ['node_modules', 'dist', '.git', 'coverage', 'build', 'plans', 'tasks'];

  function walkAndRemove(dir) {
    if (!fs.existsSync(dir)) return true;

    let isEmpty = true;
    fs.readdirSync(dir).forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!excludeDirs.includes(file)) {
          const childEmpty = walkAndRemove(fullPath);
          if (!childEmpty) isEmpty = false;
        } else {
          isEmpty = false;
        }
      } else {
        isEmpty = false;
      }
    });

    if (isEmpty && dir !== PROJECT_ROOT) {
      const relativePath = path.relative(PROJECT_ROOT, dir);
      console.log(`  Empty directory: ${relativePath}`);
      if (!DRY_RUN) {
        fs.rmdirSync(dir);
        console.log(`    ✓ Removed`);
      }
    }

    return isEmpty;
  }

  walkAndRemove(PROJECT_ROOT);
}

// =============================================================================
// Main execution
// =============================================================================
console.log('🧹 Duplicate Cleanup Script\n');
console.log('='.repeat(60));

removeKnownStubs();
const dupCount = findDuplicates();
removeEmptyDirs();

console.log('\n' + '='.repeat(60));
console.log(`\n✅ Cleanup ${DRY_RUN ? 'preview' : 'completed'}`);
console.log(`   Found ${dupCount} duplicate groups`);

if (DRY_RUN) {
  console.log('\n💡 Run with --execute to actually remove files');
}
