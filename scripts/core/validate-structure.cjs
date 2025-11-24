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
// Rule 6: Validate spec folder structure (technical and functional)
// =============================================================================
function validateSpecFolderStructure(specType, requiredFolders = null) {
  const typeName = specType === 'technical' ? 'technical' : 'functional';
  console.log(`\n📁 Validating ${typeName} spec folder structure...`);

  const specDir = path.join(PROJECT_ROOT, `docs/specs/${specType}`);
  if (!fs.existsSync(specDir)) {
    ERRORS.push(`${typeName} specs directory not found: docs/specs/${specType}/`);
    return [];
  }

  // Get all subdirectories (modules)
  const modules = fs.readdirSync(specDir)
    .filter(item => {
      const itemPath = path.join(specDir, item);
      return fs.statSync(itemPath).isDirectory();
    });

  if (modules.length === 0) {
    WARNINGS.push(`No module folders found in docs/specs/${specType}/`);
    return [];
  }

  // If specific folders are required, check for them
  if (requiredFolders) {
    const missingFolders = requiredFolders.filter(f => !modules.includes(f));
    if (missingFolders.length > 0) {
      ERRORS.push(`Missing ${typeName} spec folders: ${missingFolders.join(', ')}`);
    }
  }

  let missingReadmes = [];

  modules.forEach(module => {
    const modulePath = path.join(specDir, module);
    const readmePath = path.join(modulePath, 'README.md');

    if (!fs.existsSync(readmePath)) {
      missingReadmes.push(module);
    } else {
      // Validate README has YAML frontmatter
      try {
        const content = fs.readFileSync(readmePath, 'utf8');
        if (!content.startsWith('---') || !content.includes('version:')) {
          WARNINGS.push(`README.md in ${typeName}/${module} missing YAML frontmatter`);
        }
      } catch (err) {
        WARNINGS.push(`Cannot read README.md in ${typeName}/${module}`);
      }
    }
  });

  if (missingReadmes.length > 0) {
    ERRORS.push(`Missing README.md in ${typeName} spec folders: ${missingReadmes.join(', ')}`);
  }

  // Check for stray .md files directly in the spec root (except README.md)
  const strayFiles = fs.readdirSync(specDir)
    .filter(item => {
      const itemPath = path.join(specDir, item);
      return fs.statSync(itemPath).isFile() && item.endsWith('.md') && item !== 'README.md';
    });

  if (strayFiles.length > 0) {
    ERRORS.push(`STRAY FILES: Found ${strayFiles.length} .md files directly in ${typeName} specs root (should be in module subfolders):\n  - ${strayFiles.join('\n  - ')}`);
  }

  console.log(`  Checked ${modules.length} ${typeName} spec modules`);
  return modules;
}

// Legacy wrapper for technical specs with required folders
function validateSpecFolderReadmes() {
  const requiredTechnicalFolders = [
    'architecture',
    'security',
    'database',
    'testing',
    'ui-standards',
    'coding-standards',
    'deployment',
    'integration'
  ];
  validateSpecFolderStructure('technical', requiredTechnicalFolders);
}

// Legacy wrapper for functional specs (dynamic discovery)
function validateFunctionalSpecFolders() {
  return validateSpecFolderStructure('functional');
}

// =============================================================================
// Rule 7: Validate spec document content (technical and functional)
// =============================================================================
function validateSpecDocumentContent(specType, modules) {
  const typeName = specType === 'technical' ? 'technical' : 'functional';
  console.log(`\n📄 Validating ${typeName} spec document content...`);

  const specDir = path.join(PROJECT_ROOT, `docs/specs/${specType}`);
  if (!fs.existsSync(specDir) || !modules || modules.length === 0) {
    return;
  }

  const validStatuses = ['implemented', 'in-progress', 'pending', 'active'];
  const requiredSections = ['Purpose', 'User Flow', 'Acceptance Criteria', 'Implementation', 'Related'];
  
  let docsChecked = 0;
  let contentIssues = 0;

  modules.forEach(module => {
    const modulePath = path.join(specDir, module);
    if (!fs.existsSync(modulePath)) return;

    // Get all .md files except README.md
    const files = fs.readdirSync(modulePath)
      .filter(f => f.endsWith('.md') && f !== 'README.md');

    files.forEach(file => {
      const filePath = path.join(modulePath, file);
      docsChecked++;

      try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Check 1: YAML frontmatter
        if (!content.startsWith('---')) {
          ERRORS.push(`${typeName}/${module}/${file}: Missing YAML frontmatter`);
          contentIssues++;
          return;
        }

        // Handle both Unix (LF) and Windows (CRLF) line endings
        const frontmatterMatch = content.match(/^---[\r\n]+([\s\S]*?)[\r\n]+---/);
        if (!frontmatterMatch) {
          ERRORS.push(`${typeName}/${module}/${file}: Invalid YAML frontmatter format`);
          contentIssues++;
          return;
        }

        const frontmatter = frontmatterMatch[1];

        // Check 2: Required frontmatter fields
        if (!frontmatter.includes('version:')) {
          ERRORS.push(`${typeName}/${module}/${file}: Missing 'version' in frontmatter`);
          contentIssues++;
        }
        if (!frontmatter.includes('status:')) {
          ERRORS.push(`${typeName}/${module}/${file}: Missing 'status' in frontmatter`);
          contentIssues++;
        }
        if (!frontmatter.includes('last_updated:')) {
          ERRORS.push(`${typeName}/${module}/${file}: Missing 'last_updated' in frontmatter`);
          contentIssues++;
        }

        // Check 3: Valid status value
        const statusMatch = frontmatter.match(/status:\s*(\S+)/);
        if (statusMatch && !validStatuses.includes(statusMatch[1])) {
          WARNINGS.push(`${typeName}/${module}/${file}: Invalid status '${statusMatch[1]}' (should be: ${validStatuses.join(', ')})`);
        }

        // Check 4: Required sections (only for functional specs non-placeholder docs)
        if (specType === 'functional') {
          const isPending = content.includes('status: pending');
          if (!isPending) {
            const missingSections = requiredSections.filter(section => {
              // Use flexible matching for sections
              const regex = new RegExp(`^##\\s+${section}`, 'm');
              return !regex.test(content);
            });

            if (missingSections.length > 0) {
              WARNINGS.push(`${typeName}/${module}/${file}: Missing sections: ${missingSections.join(', ')}`);
            }
          }

          // Check 5: Acceptance Criteria format
          if (content.includes('## Acceptance Criteria')) {
            const criteriaSection = content.split('## Acceptance Criteria')[1]?.split('##')[0];
            if (criteriaSection && !criteriaSection.match(/[-✅⏳☐]/)) {
              WARNINGS.push(`${typeName}/${module}/${file}: Acceptance Criteria should use checkboxes (✅ ⏳ ☐)`);
            }
          }
        }

        // Check 6: Validate internal links
        const internalLinks = content.match(/\[.*?\]\(\.\/.+?\.md\)/g) || [];
        internalLinks.forEach(link => {
          const linkPath = link.match(/\((\.\/.*?\.md)\)/)?.[1];
          if (linkPath) {
            const absoluteLinkPath = path.join(modulePath, linkPath.replace('./', ''));
            if (!fs.existsSync(absoluteLinkPath)) {
              WARNINGS.push(`${typeName}/${module}/${file}: Broken link: ${linkPath}`);
            }
          }
        });

        // Check 7: Cross-module links
        const crossLinks = content.match(/\[.*?\]\(\.\.\/.*?\.md\)/g) || [];
        crossLinks.forEach(link => {
          const linkPath = link.match(/\((\.\.\/.*?\.md)\)/)?.[1];
          if (linkPath) {
            const absoluteLinkPath = path.join(modulePath, linkPath);
            if (!fs.existsSync(absoluteLinkPath)) {
              WARNINGS.push(`${typeName}/${module}/${file}: Broken cross-reference: ${linkPath}`);
            }
          }
        });

      } catch (err) {
        WARNINGS.push(`${typeName}/${module}/${file}: Cannot read or parse file - ${err.message}`);
      }
    });
  });

  console.log(`  Checked ${docsChecked} ${typeName} sub-spec documents`);
  if (contentIssues > 0) {
    console.log(`  Found ${contentIssues} content issues`);
  }
}

// =============================================================================
// Rule 8: Detect root-level clutter
// =============================================================================
function detectRootLevelClutter() {
  console.log('\n🧹 Checking for root-level clutter...');

  const clutterPatterns = [
    { ext: '.sql', desc: 'SQL files (should be in scripts/database/)' },
    { ext: '.txt', desc: 'Text files (temporary/debug output)' },
    { ext: '.log', desc: 'Log files (should be gitignored)' },
    { pattern: /^temp/, desc: 'Temporary files' },
    { pattern: /^db-.*\.(txt|json)$/, desc: 'Database debug output' }
  ];

  const rootFiles = fs.readdirSync(PROJECT_ROOT);
  const clutter = [];

  rootFiles.forEach(file => {
    const filePath = path.join(PROJECT_ROOT, file);
    if (!fs.statSync(filePath).isFile()) return;

    clutterPatterns.forEach(pattern => {
      if (pattern.ext && file.endsWith(pattern.ext)) {
        clutter.push(`${file} - ${pattern.desc}`);
      } else if (pattern.pattern && pattern.pattern.test(file)) {
        clutter.push(`${file} - ${pattern.desc}`);
      }
    });
  });

  if (clutter.length > 0) {
    ERRORS.push(`ROOT CLUTTER: Found ${clutter.length} files that should be moved or deleted:\n  - ${clutter.join('\n  - ')}`);
  }

  console.log(`  Checked root directory for clutter`);
}

// =============================================================================
// Rule 9: Validate script folder structure
// =============================================================================
function validateScriptLocations() {
  console.log('\n📂 Validating script folder structure...');

  const scriptsDir = path.join(PROJECT_ROOT, 'scripts');
  const allowedFolders = ['core', 'database', 'validation', 'archive', 'temp', 'debug'];

  // Check for scripts at scripts/ root (not allowed)
  const rootScripts = fs.readdirSync(scriptsDir).filter(item => {
    const itemPath = path.join(scriptsDir, item);
    return fs.statSync(itemPath).isFile() &&
           (item.endsWith('.js') || item.endsWith('.cjs') || item.endsWith('.mjs') || item.endsWith('.ps1'));
  });

  if (rootScripts.length > 0) {
    ERRORS.push(`SCRIPT LOCATION: Found ${rootScripts.length} scripts at scripts/ root (should be in subfolders):\n  - ${rootScripts.join('\n  - ')}\n  Move to: scripts/core/, scripts/database/, scripts/temp/, or scripts/archive/`);
  }

  // Check for stale temp scripts (older than 7 days)
  const tempDir = path.join(scriptsDir, 'temp');
  if (fs.existsSync(tempDir)) {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const staleScripts = [];

    fs.readdirSync(tempDir).forEach(file => {
      const filePath = path.join(tempDir, file);
      if (fs.statSync(filePath).isFile()) {
        const mtime = fs.statSync(filePath).mtimeMs;
        if (now - mtime > sevenDays) {
          const daysOld = Math.floor((now - mtime) / (24 * 60 * 60 * 1000));
          staleScripts.push(`${file} (${daysOld} days old)`);
        }
      }
    });

    if (staleScripts.length > 0) {
      WARNINGS.push(`STALE TEMP SCRIPTS: Found ${staleScripts.length} scripts in temp/ older than 7 days:\n  - ${staleScripts.join('\n  - ')}\n  Consider moving to archive/ or deleting`);
    }
  }

  // Check for unknown folders in scripts/
  const existingFolders = fs.readdirSync(scriptsDir).filter(item => {
    const itemPath = path.join(scriptsDir, item);
    return fs.statSync(itemPath).isDirectory();
  });

  const unknownFolders = existingFolders.filter(folder => !allowedFolders.includes(folder));
  if (unknownFolders.length > 0) {
    WARNINGS.push(`UNKNOWN SCRIPT FOLDERS: Found ${unknownFolders.length} non-standard folders in scripts/:\n  - ${unknownFolders.join('\n  - ')}\n  Standard folders: ${allowedFolders.join(', ')}`);
  }

  console.log(`  Checked script folder structure`);
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
detectRootLevelClutter();
validateScriptLocations();
validateSpecFolderReadmes();

// Validate functional specs (dynamic discovery)
const functionalModules = validateFunctionalSpecFolders();
validateSpecDocumentContent('functional', functionalModules);

// Validate technical specs (dynamic discovery)
const technicalModules = validateSpecFolderStructure('technical');
validateSpecDocumentContent('technical', technicalModules);

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
