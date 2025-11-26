#!/usr/bin/env node
/**
 * FILE PLACEMENT VALIDATOR
 * 
 * Validates that files are in the correct folders with correct extensions.
 * Reads ALL rules from structure-rules.cjs - no hardcoded logic here.
 * 
 * Checks:
 * - File is in allowed folder
 * - File extension is allowed for folder
 * - File matches naming convention for folder
 * - No forbidden patterns
 */

const fs = require('fs');
const path = require('path');
const {
  FOLDER_RULES,
  EXCEPTION_REGISTRY,
  getFolderRule,
  getException,
  shouldIgnore,
} = require('../rules/structure-rules.cjs');

/**
 * Validate a single file's placement
 * @param {string} filePath - Relative path from project root
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
function validateFilePlacement(filePath) {
  const errors = [];
  const warnings = [];
  const normalizedPath = filePath.replace(/\\/g, '/');
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath);
  
  // Skip if in exception registry
  const exception = getException(normalizedPath);
  if (exception) {
    if (exception.action === 'delete') {
      warnings.push(`Should delete: ${exception.reason}`);
    } else if (exception.action === 'gitignore') {
      warnings.push(`Should be gitignored: ${exception.reason}`);
    }
    // Exception found - don't validate further
    return { valid: true, errors, warnings };
  }
  
  // Get the rule for this file's folder
  const rule = getFolderRule(normalizedPath);
  
  if (!rule) {
    // No rule found - file is in an uncontrolled location
    warnings.push(`No rule defined for folder containing: ${normalizedPath}`);
    return { valid: true, errors, warnings };
  }
  
  // Check if folder is forbidden
  if (rule.forbidden) {
    errors.push(`FORBIDDEN FOLDER: ${rule.message}`);
    if (rule.migration && rule.migration[fileName]) {
      errors.push(`  → Move to: ${rule.migration[fileName]}`);
    }
    return { valid: false, errors, warnings };
  }
  
  // ROOT level special handling
  if (rule.path === '/') {
    // Check allowed files list
    const isAllowedFile = (rule.allowedFiles || []).includes(fileName);
    const matchesPattern = (rule.allowedPatterns || []).some(p => p.test(fileName));
    
    if (!isAllowedFile && !matchesPattern) {
      // Check forbidden patterns first
      for (const fp of (rule.forbiddenPatterns || [])) {
        if (fp.pattern.test(fileName)) {
          errors.push(`${fp.message}`);
          return { valid: false, errors, warnings };
        }
      }
      
      // Check forbidden extensions
      if ((rule.forbiddenExtensions || []).includes(ext)) {
        errors.push(`Extension ${ext} not allowed at root`);
        return { valid: false, errors, warnings };
      }
      
      // Unexpected file at root
      warnings.push(`Unexpected file at root: ${fileName}`);
    }
    
    return { valid: errors.length === 0, errors, warnings };
  }
  
  // Check forbidden extensions
  if ((rule.forbiddenExtensions || []).includes(ext)) {
    errors.push(`Extension ${ext} forbidden in ${rule.path}. Move to appropriate folder.`);
  }
  
  // Check allowed extensions
  if (rule.allowedExtensions && !rule.allowedExtensions.includes(ext)) {
    // Check if it's a specific exception
    const isException = (rule.exceptions || []).includes(normalizedPath);
    if (!isException) {
      errors.push(`Extension ${ext} not allowed in ${rule.path}. Allowed: ${rule.allowedExtensions.join(', ')}`);
    }
  }
  
  // Check allowed files list (if specified and restrictive)
  if (rule.allowedFiles && rule.allowedFiles.length > 0) {
    if (!rule.allowedFiles.includes(fileName)) {
      warnings.push(`File not in allowed list for ${rule.path}`);
    }
  }
  
  // Check forbidden patterns
  for (const fp of (rule.forbiddenPatterns || [])) {
    if (fp.pattern.test(fileName)) {
      errors.push(fp.message);
    }
  }
  
  // Check naming convention
  if (rule.namingConvention) {
    const pattern = rule.namingConvention.pattern || rule.namingConvention;
    if (!pattern.test(fileName)) {
      warnings.push(`${fileName} doesn't follow naming convention for ${rule.path}`);
      if (rule.namingConvention.description) {
        warnings.push(`  Expected: ${rule.namingConvention.description}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Walk directory and validate all files
 * @param {string} rootDir - Project root directory
 * @returns {{ errors: string[], warnings: string[] }}
 */
function validateAllFiles(rootDir) {
  const allErrors = [];
  const allWarnings = [];
  
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
      
      // Skip ignored paths
      if (shouldIgnore(relPath)) continue;
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        const result = validateFilePlacement(relPath);
        allErrors.push(...result.errors.map(e => `${relPath}: ${e}`));
        allWarnings.push(...result.warnings.map(w => `${relPath}: ${w}`));
      }
    }
  }
  
  walk(rootDir);
  
  return { errors: allErrors, warnings: allWarnings };
}

module.exports = {
  validateFilePlacement,
  validateAllFiles,
};

// CLI
if (require.main === module) {
  const PROJECT_ROOT = path.resolve(__dirname, '../../..');
  console.log('📁 Running file placement validation...\n');
  
  const { errors, warnings } = validateAllFiles(PROJECT_ROOT);
  
  if (warnings.length) {
    console.log(`⚠️  Warnings (${warnings.length}):`);
    warnings.slice(0, 30).forEach(w => console.log(`  - ${w}`));
    if (warnings.length > 30) console.log(`  ... ${warnings.length - 30} more`);
  }
  
  if (errors.length) {
    console.log(`\n❌ Errors (${errors.length}):`);
    errors.slice(0, 30).forEach(e => console.log(`  - ${e}`));
    if (errors.length > 30) console.log(`  ... ${errors.length - 30} more`);
    process.exit(1);
  }
  
  console.log('\n✅ File placement validation passed.');
}
