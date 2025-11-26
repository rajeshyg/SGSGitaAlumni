#!/usr/bin/env node
/**
 * NAMING CONVENTIONS VALIDATOR
 * 
 * Validates that files and folders follow canonical naming conventions.
 * Reads ALL rules from structure-rules.cjs - no hardcoded logic here.
 * 
 * Checks:
 * - Script naming (validate vs check, audit vs scan)
 * - Folder naming conventions
 * - Script location matches its prefix
 */

const fs = require('fs');
const path = require('path');
const {
  CANONICAL_VOCABULARY,
  FOLDER_RULES,
  shouldIgnore,
} = require('../rules/structure-rules.cjs');

/**
 * Extract the action prefix from a filename
 * @param {string} fileName - File name without path
 * @returns {string|null} The action prefix (validate, check, audit, etc.)
 */
function extractActionPrefix(fileName) {
  const match = fileName.match(/^([a-z]+)-/);
  return match ? match[1] : null;
}

/**
 * Get the canonical term for an action
 * @param {string} action - The action prefix (check, verify, etc.)
 * @returns {{ canonical: string, info: object }|null}
 */
function getCanonicalAction(action) {
  const vocab = CANONICAL_VOCABULARY.scripts;
  
  // Check if already canonical
  if (vocab[action]) {
    return { canonical: action, info: vocab[action], isCanonical: true };
  }
  
  // Find what it should be
  for (const [canonical, info] of Object.entries(vocab)) {
    if (info.replaces && info.replaces.includes(action)) {
      return { canonical, info, isCanonical: false };
    }
  }
  
  return null;
}

/**
 * Validate naming conventions for scripts
 * @param {string} rootDir - Project root
 * @returns {{ errors: string[], warnings: string[] }}
 */
function validateScriptNaming(rootDir) {
  const errors = [];
  const warnings = [];
  
  const scriptsDir = path.join(rootDir, 'scripts');
  if (!fs.existsSync(scriptsDir)) {
    return { errors, warnings };
  }
  
  // Walk scripts directory
  function walkScripts(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
      
      // Skip archive and node_modules
      if (entry.name === 'archive' || entry.name === 'node_modules') continue;
      
      if (entry.isDirectory()) {
        walkScripts(fullPath);
      } else if (entry.name.endsWith('.js') || entry.name.endsWith('.cjs') || entry.name.endsWith('.mjs')) {
        // Extract action prefix
        const action = extractActionPrefix(entry.name);
        
        if (action) {
          const result = getCanonicalAction(action);
          
          if (result && !result.isCanonical) {
            // Using non-canonical term
            const correctName = entry.name.replace(`${action}-`, `${result.canonical}-`);
            warnings.push(`${relPath}: Use '${result.canonical}-' instead of '${action}-' (rename to ${correctName})`);
          }
          
          // Check if action matches folder
          if (result) {
            const expectedLocations = result.info.locations || [];
            const currentFolder = path.dirname(relPath) + '/';
            
            if (expectedLocations.length > 0 && !expectedLocations.some(loc => currentFolder.includes(loc))) {
              warnings.push(`${relPath}: ${result.canonical}-* scripts should be in ${expectedLocations.join(' or ')}`);
            }
          }
        }
      }
    }
  }
  
  walkScripts(scriptsDir);
  
  return { errors, warnings };
}

/**
 * Validate debug script naming
 * @param {string} rootDir - Project root
 * @returns {{ errors: string[], warnings: string[] }}
 */
function validateDebugScriptNaming(rootDir) {
  const errors = [];
  const warnings = [];
  
  const debugDir = path.join(rootDir, 'scripts/debug');
  if (!fs.existsSync(debugDir)) {
    return { errors, warnings };
  }
  
  const debugVocab = CANONICAL_VOCABULARY.scripts.debug;
  const validPrefixes = ['debug', ...debugVocab.replaces];
  const canonicalPrefix = 'debug';
  
  const files = fs.readdirSync(debugDir)
    .filter(f => f.endsWith('.js') || f.endsWith('.cjs') || f.endsWith('.mjs'));
  
  for (const file of files) {
    const prefix = extractActionPrefix(file);
    
    if (!prefix) {
      warnings.push(`scripts/debug/${file}: Debug scripts should have a prefix (debug-*, diagnose-*, etc.)`);
    } else if (!validPrefixes.includes(prefix) && prefix !== canonicalPrefix) {
      warnings.push(`scripts/debug/${file}: Consider renaming to debug-* for consistency`);
    }
  }
  
  return { errors, warnings };
}

/**
 * Validate validation script naming
 * @param {string} rootDir - Project root
 * @returns {{ errors: string[], warnings: string[] }}
 */
function validateValidationScriptNaming(rootDir) {
  const errors = [];
  const warnings = [];
  
  const validationDir = path.join(rootDir, 'scripts/validation');
  if (!fs.existsSync(validationDir)) {
    return { errors, warnings };
  }
  
  const files = fs.readdirSync(validationDir)
    .filter(f => {
      const fullPath = path.join(validationDir, f);
      return fs.statSync(fullPath).isFile() && 
             (f.endsWith('.js') || f.endsWith('.cjs') || f.endsWith('.mjs'));
    });
  
  for (const file of files) {
    const prefix = extractActionPrefix(file);
    
    // Valid prefixes for validation folder
    const validPrefixes = ['validate', 'audit', 'detect', 'run', 'deployment', 'cleanup'];
    
    if (prefix && !validPrefixes.includes(prefix)) {
      const result = getCanonicalAction(prefix);
      if (result) {
        warnings.push(`scripts/validation/${file}: Rename ${prefix}-* to ${result.canonical}-*`);
      } else {
        warnings.push(`scripts/validation/${file}: Unexpected prefix '${prefix}'. Use: ${validPrefixes.join(', ')}`);
      }
    }
  }
  
  return { errors, warnings };
}

/**
 * Run all naming convention validations
 * @param {string} rootDir - Project root
 * @returns {{ errors: string[], warnings: string[] }}
 */
function validateNamingConventions(rootDir) {
  const results = [
    validateScriptNaming(rootDir),
    validateDebugScriptNaming(rootDir),
    validateValidationScriptNaming(rootDir),
  ];
  
  return {
    errors: results.flatMap(r => r.errors),
    warnings: results.flatMap(r => r.warnings),
  };
}

module.exports = {
  validateScriptNaming,
  validateDebugScriptNaming,
  validateValidationScriptNaming,
  validateNamingConventions,
  extractActionPrefix,
  getCanonicalAction,
};

// CLI
if (require.main === module) {
  const PROJECT_ROOT = path.resolve(__dirname, '../../..');
  console.log('🏷️  Running naming convention validation...\n');
  
  const { errors, warnings } = validateNamingConventions(PROJECT_ROOT);
  
  if (errors.length) {
    console.log(`❌ Errors (${errors.length}):`);
    errors.forEach(e => console.log(`  - ${e}`));
  }
  
  if (warnings.length) {
    console.log(`⚠️  Warnings (${warnings.length}):`);
    warnings.forEach(w => console.log(`  - ${w}`));
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All naming conventions valid.');
  }
  
  process.exit(errors.length > 0 ? 1 : 0);
}
