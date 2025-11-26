#!/usr/bin/env node
/**
 * STRUCTURE RULES - Single Source of Truth (Aggregator)
 * 
 * This file aggregates all rule files and provides helper functions.
 * Rules are split into: folder-rules.cjs, module-rules.cjs, exceptions.cjs
 * 
 * Target: < 150 lines (helpers + exports + CLI)
 */

const path = require('path');
const { FOLDER_RULES } = require('./folder-rules.cjs');
const { MODULE_DEFINITIONS, DUPLICATE_RULES, SPEC_RULES, CANONICAL_VOCABULARY } = require('./module-rules.cjs');
const { EXCEPTION_REGISTRY, IGNORED_PATHS } = require('./exceptions.cjs');

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Get the folder rule for a file path */
function getFolderRule(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const sorted = Object.entries(FOLDER_RULES).sort((a, b) => b[0].length - a[0].length);
  
  for (const [folderPath, rule] of sorted) {
    if (folderPath === '/') {
      if (!normalized.includes('/')) return { path: folderPath, ...rule };
    } else {
      const folder = folderPath.replace(/\/$/, '');
      if (normalized.startsWith(folder + '/') || normalized.startsWith(folder)) {
        return { path: folderPath, ...rule };
      }
    }
  }
  return null;
}

/** Check if path is in exception registry */
function getException(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  for (const ex of EXCEPTION_REGISTRY) {
    if (ex.path && ex.path === normalized) return ex;
    if (ex.pathPattern && ex.pathPattern.test(normalized)) return ex;
  }
  return null;
}

/** Check if path should be ignored */
function shouldIgnore(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const fileName = path.basename(filePath);
  
  for (const dir of IGNORED_PATHS.directories) {
    if (normalized.includes(`/${dir}/`) || normalized.startsWith(`${dir}/`)) return true;
  }
  if (IGNORED_PATHS.files.includes(fileName)) return true;
  for (const p of IGNORED_PATHS.patterns) {
    if (p.test(normalized)) return true;
  }
  return false;
}

/** Get canonical term for a synonym */
function getCanonicalTerm(category, term) {
  const vocab = CANONICAL_VOCABULARY[category];
  if (!vocab) return null;
  if (vocab[term]) return { canonical: term, info: vocab[term] };
  for (const [canonical, info] of Object.entries(vocab)) {
    if (info.replaces?.includes(term)) return { canonical, info };
  }
  return null;
}

/** Map filename to module */
function getModuleForFile(fileName) {
  const base = fileName.toLowerCase().replace(/\.(js|ts|tsx|cjs|mjs|md|spec\.ts)$/, '');
  for (const [pattern, module] of Object.entries(MODULE_DEFINITIONS.modulePatterns)) {
    if (base.includes(pattern)) return module;
  }
  return null;
}

// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
  FOLDER_RULES, MODULE_DEFINITIONS, DUPLICATE_RULES, SPEC_RULES,
  CANONICAL_VOCABULARY, EXCEPTION_REGISTRY, IGNORED_PATHS,
  getFolderRule, getException, shouldIgnore, getCanonicalTerm, getModuleForFile,
};

// =============================================================================
// CLI
// =============================================================================
if (require.main === module) {
  console.log('📋 STRUCTURE RULES - Single Source of Truth\n' + '='.repeat(50));
  console.log(`\n📁 FOLDER RULES (${Object.keys(FOLDER_RULES).length} folders):`);
  Object.entries(FOLDER_RULES).slice(0, 10).forEach(([f, r]) => {
    console.log(`  ${r.forbidden ? '🚫' : '📂'} ${f}`);
  });
  console.log('  ... and more');
  console.log(`\n🏷️  MODULES: ${MODULE_DEFINITIONS.modules.join(', ')}`);
  console.log(`\n⚡ EXCEPTIONS: ${EXCEPTION_REGISTRY.length} registered`);
  console.log(`\n🚫 IGNORED: ${IGNORED_PATHS.directories.length} directories`);
  console.log('\n' + '='.repeat(50));
  console.log('Run: node scripts/validation/validate-structure.cjs');
}
