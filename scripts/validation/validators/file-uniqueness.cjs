#!/usr/bin/env node
/**
 * FILE UNIQUENESS VALIDATOR
 * 
 * Detects duplicate and similar files.
 * Uses duplicate-helpers.cjs for content/filename detection.
 * 
 * Checks:
 * - Exact content duplicates (MD5 hash)
 * - Similar filenames (potential duplicates)
 * - Module-level uniqueness (.mmd files, specs per module)
 */

const fs = require('fs');
const path = require('path');
const { DUPLICATE_RULES, getModuleForFile } = require('../rules/structure-rules.cjs');
const { findFiles, detectContentDuplicates, detectSimilarFilenames } = require('./duplicate-helpers.cjs');

/**
 * Detect module-level uniqueness violations
 */
function detectModuleDuplicates(rootDir) {
  const errors = [];
  const warnings = [];
  const { moduleUniqueness, excludeDirs } = DUPLICATE_RULES;
  
  // Check "one per module" rules (e.g., .mmd files)
  for (const rule of moduleUniqueness.onePerModule) {
    const files = findFiles(rootDir, [rule.extension], excludeDirs);
    const byModule = {};
    
    for (const relPath of files) {
      const module = getModuleForFile(relPath);
      if (module) {
        if (!byModule[module]) byModule[module] = [];
        byModule[module].push(relPath);
      }
    }
    
    for (const [module, modulePaths] of Object.entries(byModule)) {
      if (modulePaths.length > 1) {
        errors.push(`DUPLICATE ${rule.description} for module "${module}":\n  - ${modulePaths.join('\n  - ')}`);
      }
    }
  }
  
  // Check "warn on multiple" rules
  for (const rule of moduleUniqueness.warnOnMultiple) {
    const allFiles = [];
    
    function walk(dir) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(rootDir, fullPath);
        if (entry.isDirectory() && !excludeDirs.includes(entry.name)) {
          walk(fullPath);
        } else if (rule.pattern.test(entry.name)) {
          allFiles.push(relPath);
        }
      }
    }
    
    walk(rootDir);
    
    const byModule = {};
    for (const relPath of allFiles) {
      const module = getModuleForFile(relPath);
      if (module) {
        if (!byModule[module]) byModule[module] = [];
        byModule[module].push(relPath);
      }
    }
    
    for (const [module, modulePaths] of Object.entries(byModule)) {
      if (modulePaths.length > 1) {
        warnings.push(`MULTIPLE ${rule.description} for module "${module}":\n  - ${modulePaths.map(p => path.basename(p)).join('\n  - ')}\n  Consider consolidating.`);
      }
    }
  }
  
  return { errors, warnings };
}

/**
 * Run all uniqueness validations
 */
function validateFileUniqueness(rootDir) {
  const results = [
    detectContentDuplicates(rootDir),
    detectSimilarFilenames(rootDir),
    detectModuleDuplicates(rootDir),
  ];
  
  return {
    errors: results.flatMap(r => r.errors),
    warnings: results.flatMap(r => r.warnings),
  };
}

module.exports = {
  detectContentDuplicates,
  detectSimilarFilenames,
  detectModuleDuplicates,
  validateFileUniqueness,
};

// CLI
if (require.main === module) {
  const PROJECT_ROOT = path.resolve(__dirname, '../../..');
  console.log('🔍 Running file uniqueness validation...\n');
  
  const { errors, warnings } = validateFileUniqueness(PROJECT_ROOT);
  
  if (errors.length) {
    console.log(`❌ Errors (${errors.length}):`);
    errors.forEach(e => console.log(`\n${e}`));
  }
  
  if (warnings.length) {
    console.log(`\n⚠️  Warnings (${warnings.length}):`);
    warnings.slice(0, 20).forEach(w => console.log(`\n${w}`));
    if (warnings.length > 20) console.log(`\n... ${warnings.length - 20} more`);
  }
  
  if (!errors.length && !warnings.length) {
    console.log('✅ No duplicates detected.');
  }
  
  process.exit(errors.length > 0 ? 1 : 0);
}
