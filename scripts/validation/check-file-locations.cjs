#!/usr/bin/env node

/**
 * File Location Validation Script
 *
 * Enforces file organization standards defined in:
 * docs/specs/technical/file-organization.md
 *
 * Usage:
 *   node scripts/validation/check-file-locations.js
 *
 * Exit Codes:
 *   0 - All files in correct locations
 *   1 - Warnings (files should be moved but not blocking)
 *   2 - Errors (files MUST be moved, blocks commit)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ERROR: ${message}`, colors.red);
}

function warning(message) {
  log(`⚠️  WARNING: ${message}`, colors.yellow);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

// File organization rules
const rules = {
  // Root directory - very restrictive
  root: {
    allowed: [
      'README.md',
      'claude.md',
      'index.html',
      'package.json',
      'package-lock.json',
      'server-package.json',
      'tsconfig.json',
      'tsconfig.node.json',
      'vite.config.ts',
      'eslint.config.js',
    ],
    allowedPatterns: [
      /^\..*\.json$/,  // .jscpd.json, .prettierrc.json, etc.
      /^\..*rc$/,      // .eslintrc, .prettierrc, etc.
      /^\..*ignore$/,  // .gitignore, .dockerignore, etc.
    ],
    forbidden: {
      '*.sql': 'SQL files belong in migrations/ or scripts/database/schema/',
      '*.html (except index.html)': 'HTML files belong in docs/reports/ or docs/diagrams/',
      '*.sh': 'Shell scripts belong in scripts/deployment/ or scripts/database/',
      '*.ps1': 'PowerShell scripts belong in scripts/deployment/ or scripts/database/',
      '*-report.html': 'Generated reports should be in .gitignore or docs/reports/',
      '*-output.json': 'Generated output files should be in .gitignore',
      'lint-violations.json': 'Generated files should be in .gitignore',
      'eslint-output.json': 'Generated files should be in .gitignore',
    },
  },

  // SQL files
  sql: {
    allowed: [
      'migrations/',
      'scripts/database/migrations/',
      'scripts/database/schema/',
    ],
    forbidden: [
      'scripts/database/*.sql',  // Must be in subdirectory
      'src/**/*.sql',            // No SQL in source code
      'server/**/*.sql',         // No SQL in server code
      'docs/**/*.sql',           // No SQL in docs
    ],
  },

  // HTML files
  html: {
    allowed: [
      'index.html',              // Vite entry point
      'docs/reports/*.html',     // Reports
      'docs/diagrams/**/*.html', // Visualizations
      'public/*.html',           // Public assets
    ],
    forbidden: [
      'src/**/*.html',           // No HTML visualizations in src/
      '*.html (root, except index.html)', // No HTML reports in root
    ],
  },

  // Scripts
  scripts: {
    validLocations: {
      'check-*.js': ['scripts/core/', 'scripts/validation/', 'scripts/archive/check/'],
      'audit-*.js': ['scripts/validation/', 'scripts/archive/'],
      'test-*.js': ['tests/', 'scripts/archive/test/'],
      'validate-*.js': ['scripts/validation/', 'scripts/core/'],
    },
  },

  // Shell scripts
  shellScripts: {
    allowed: [
      'scripts/deployment/',
      'scripts/database/',
      'scripts/archive/',
      '.husky/',
    ],
    forbidden: [
      '*.sh (root)',
      '*.ps1 (root)',
    ],
  },
};

class FileLocationChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.projectRoot = path.resolve(__dirname, '../..');
  }

  // Get all tracked files in git
  getTrackedFiles() {
    try {
      const output = execSync('git ls-files', { cwd: this.projectRoot, encoding: 'utf8' });
      return output.split('\n').filter(Boolean);
    } catch (error) {
      // If git command fails, fall back to file system scan
      return this.getAllFiles(this.projectRoot);
    }
  }

  // Recursively get all files (fallback)
  getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
          this.getAllFiles(filePath, fileList);
        }
      } else {
        fileList.push(path.relative(this.projectRoot, filePath));
      }
    });
    return fileList;
  }

  // Check if file is in root directory
  isInRoot(filePath) {
    return !filePath.includes('/') && !filePath.includes('\\');
  }

  // Check root directory files
  checkRootFiles(files) {
    const rootFiles = files.filter(f => this.isInRoot(f));

    rootFiles.forEach(file => {
      const isAllowed = rules.root.allowed.includes(file);
      const matchesPattern = rules.root.allowedPatterns.some(pattern => pattern.test(file));

      if (!isAllowed && !matchesPattern) {
        // Check specific forbidden patterns
        const ext = path.extname(file);
        const basename = path.basename(file, ext);

        if (ext === '.sql') {
          this.errors.push({
            file,
            issue: 'SQL file in root directory',
            solution: 'Move to migrations/ or scripts/database/schema/',
          });
        } else if (ext === '.html' && file !== 'index.html') {
          this.errors.push({
            file,
            issue: 'HTML file in root directory',
            solution: 'Move to docs/reports/ or docs/diagrams/, or add to .gitignore',
          });
        } else if (ext === '.sh' || ext === '.ps1') {
          this.errors.push({
            file,
            issue: 'Shell script in root directory',
            solution: 'Move to scripts/deployment/ or scripts/database/',
          });
        } else if (file.includes('-report') || file.includes('-output')) {
          this.warnings.push({
            file,
            issue: 'Generated file in root directory',
            solution: 'Add to .gitignore or move to docs/reports/',
          });
        } else if (!file.startsWith('.')) {
          this.warnings.push({
            file,
            issue: 'Unexpected file in root directory',
            solution: 'Review file organization standard: docs/specs/technical/file-organization.md',
          });
        }
      }
    });
  }

  // Check SQL file locations
  checkSQLFiles(files) {
    const sqlFiles = files.filter(f => f.endsWith('.sql'));

    sqlFiles.forEach(file => {
      const dir = path.dirname(file);
      const isAllowed = rules.sql.allowed.some(allowed => file.startsWith(allowed));

      // Check if in forbidden location
      const inScriptsDatabaseRoot = file.startsWith('scripts/database/') &&
                                     !file.startsWith('scripts/database/migrations/') &&
                                     !file.startsWith('scripts/database/schema/');
      const inSrc = file.startsWith('src/');
      const inServer = file.startsWith('server/');
      const inDocs = file.startsWith('docs/');

      if (inScriptsDatabaseRoot) {
        this.errors.push({
          file,
          issue: 'SQL file in scripts/database/ root (not in subdirectory)',
          solution: 'Move to scripts/database/migrations/ or scripts/database/schema/',
        });
      } else if (inSrc) {
        this.errors.push({
          file,
          issue: 'SQL file in src/ directory',
          solution: 'Move to migrations/ or scripts/database/schema/',
        });
      } else if (inServer) {
        this.errors.push({
          file,
          issue: 'SQL file in server/ directory',
          solution: 'Move to migrations/ or scripts/database/schema/',
        });
      } else if (inDocs) {
        this.errors.push({
          file,
          issue: 'SQL file in docs/ directory',
          solution: 'Move to migrations/ or scripts/database/schema/',
        });
      } else if (!isAllowed && !this.isInRoot(file)) {
        this.warnings.push({
          file,
          issue: 'SQL file in unusual location',
          solution: 'Consider moving to migrations/ or scripts/database/schema/',
        });
      }
    });
  }

  // Check HTML file locations
  checkHTMLFiles(files) {
    const htmlFiles = files.filter(f => f.endsWith('.html'));

    htmlFiles.forEach(file => {
      if (file === 'index.html') {
        return; // Allowed
      }

      const inDocs = file.startsWith('docs/reports/') || file.startsWith('docs/diagrams/');
      const inPublic = file.startsWith('public/');
      const inSrc = file.startsWith('src/');
      const inRoot = this.isInRoot(file);

      if (inSrc) {
        this.errors.push({
          file,
          issue: 'HTML file in src/ directory (likely Mermaid visualization)',
          solution: 'Move to docs/diagrams/database/',
        });
      } else if (inRoot) {
        this.warnings.push({
          file,
          issue: 'HTML file in root directory',
          solution: 'Move to docs/reports/, add to .gitignore, or delete if generated',
        });
      } else if (!inDocs && !inPublic) {
        this.warnings.push({
          file,
          issue: 'HTML file in unusual location',
          solution: 'Consider moving to docs/reports/ or docs/diagrams/',
        });
      }
    });
  }

  // Check shell script locations
  checkShellScripts(files) {
    const shellFiles = files.filter(f => f.endsWith('.sh') || f.endsWith('.ps1'));

    shellFiles.forEach(file => {
      const isAllowed = rules.shellScripts.allowed.some(allowed => file.startsWith(allowed));
      const inRoot = this.isInRoot(file);

      if (inRoot) {
        this.errors.push({
          file,
          issue: 'Shell script in root directory',
          solution: 'Move to scripts/deployment/ or scripts/database/',
        });
      } else if (!isAllowed) {
        this.warnings.push({
          file,
          issue: 'Shell script in unusual location',
          solution: 'Consider moving to scripts/deployment/, scripts/database/, or scripts/archive/',
        });
      }
    });
  }

  // Check debug/check scripts organization
  checkDebugScripts(files) {
    const checkScripts = files.filter(f => {
      const basename = path.basename(f);
      return (basename.startsWith('check-') || basename.startsWith('test-')) &&
             f.endsWith('.js') &&
             !f.startsWith('tests/') &&
             !f.startsWith('scripts/archive/');
    });

    checkScripts.forEach(file => {
      const inValidation = file.startsWith('scripts/validation/');
      const inCore = file.startsWith('scripts/core/');
      const inDebug = file.startsWith('scripts/debug/');
      const inDatabase = file.startsWith('scripts/database/');

      if (inDatabase) {
        this.warnings.push({
          file,
          issue: 'Check/test script in scripts/database/ (usually one-time diagnostics)',
          solution: 'Consider moving to scripts/debug/database/ or scripts/archive/database/',
        });
      } else if (!inValidation && !inCore && !inDebug) {
        this.warnings.push({
          file,
          issue: 'Check/test script in unusual location',
          solution: 'Move to scripts/validation/, scripts/core/, or scripts/debug/[feature]/',
        });
      }
    });
  }

  // Run all checks
  check() {
    log('\n🔍 Checking file locations...\n', colors.bold);

    const files = this.getTrackedFiles();
    info(`Found ${files.length} tracked files\n`);

    this.checkRootFiles(files);
    this.checkSQLFiles(files);
    this.checkHTMLFiles(files);
    this.checkShellScripts(files);
    this.checkDebugScripts(files);

    return this.report();
  }

  // Generate report
  report() {
    let exitCode = 0;

    if (this.errors.length > 0) {
      log('\n❌ ERRORS (must fix before commit):\n', colors.red + colors.bold);
      this.errors.forEach(({ file, issue, solution }, index) => {
        log(`${index + 1}. ${file}`, colors.red);
        log(`   Issue: ${issue}`);
        log(`   Solution: ${solution}\n`);
      });
      exitCode = 2;
    }

    if (this.warnings.length > 0) {
      log('\n⚠️  WARNINGS (should fix but not blocking):\n', colors.yellow + colors.bold);
      this.warnings.forEach(({ file, issue, solution }, index) => {
        log(`${index + 1}. ${file}`, colors.yellow);
        log(`   Issue: ${issue}`);
        log(`   Solution: ${solution}\n`);
      });
      if (exitCode === 0) exitCode = 1;
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      success('\n✅ All files are in correct locations!\n');
    } else {
      log('\n📚 Reference: docs/specs/technical/file-organization.md\n', colors.cyan);
      log('Summary:', colors.bold);
      log(`  Errors: ${this.errors.length} (blocking)`);
      log(`  Warnings: ${this.warnings.length} (non-blocking)\n`);
    }

    return exitCode;
  }
}

// Run check
const checker = new FileLocationChecker();
const exitCode = checker.check();
process.exit(exitCode);
