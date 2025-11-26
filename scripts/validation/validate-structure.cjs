#!/usr/bin/env node
/**
 * STRUCTURE VALIDATION ORCHESTRATOR
 * 
 * This is the main entry point for all structure validation.
 * It imports and runs all individual validators, aggregates results,
 * and determines the exit code.
 * 
 * Usage:
 *   node scripts/validation/validate-structure.cjs [--verbose] [--warnings-as-errors]
 * 
 * Exit codes:
 *   0 - All validations passed (warnings may exist)
 *   1 - Errors found (blocking)
 * 
 * All rules come from: scripts/validation/rules/structure-rules.cjs
 */

const path = require('path');
const { validateAllFiles } = require('./validators/file-placement.cjs');
const { validateFileUniqueness } = require('./validators/file-uniqueness.cjs');
const { validateAllSpecDocuments } = require('./validators/spec-documents.cjs');
const { validateNamingConventions } = require('./validators/naming-conventions.cjs');

const PROJECT_ROOT = path.resolve(__dirname, '../..');

// Parse CLI arguments
const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');
const warningsAsErrors = args.includes('--warnings-as-errors') || args.includes('-w');
const helpRequested = args.includes('--help') || args.includes('-h');

if (helpRequested) {
  console.log(`
STRUCTURE VALIDATION ORCHESTRATOR

Usage: node scripts/validation/validate-structure.cjs [options]

Options:
  --verbose, -v           Show all warnings (default: show first 20)
  --warnings-as-errors, -w  Treat warnings as errors (block on warnings)
  --help, -h              Show this help message

Exit codes:
  0 - Passed (warnings may exist unless --warnings-as-errors)
  1 - Failed (errors found)

Rules defined in: scripts/validation/rules/structure-rules.cjs
`);
  process.exit(0);
}

/**
 * Format a section with a limit on items shown
 */
function formatSection(title, items, limit = 20) {
  if (items.length === 0) return '';
  
  let output = `\n${title} (${items.length}):\n`;
  const toShow = verbose ? items : items.slice(0, limit);
  toShow.forEach(item => {
    output += `  - ${item}\n`;
  });
  if (!verbose && items.length > limit) {
    output += `  ... and ${items.length - limit} more (use --verbose to see all)\n`;
  }
  return output;
}

/**
 * Run all validators and collect results
 */
function runAllValidators() {
  const results = {
    filePlacement: { name: 'File Placement', errors: [], warnings: [], time: 0 },
    fileUniqueness: { name: 'File Uniqueness', errors: [], warnings: [], time: 0 },
    specDocuments: { name: 'Spec Documents', errors: [], warnings: [], time: 0 },
    namingConventions: { name: 'Naming Conventions', errors: [], warnings: [], time: 0 },
  };
  
  console.log('🔍 Running Structure Validation...\n');
  console.log('=' .repeat(60));
  
  // 1. File Placement
  console.log('\n📁 Validating file placement...');
  let start = Date.now();
  try {
    const fp = validateAllFiles(PROJECT_ROOT);
    results.filePlacement.errors = fp.errors;
    results.filePlacement.warnings = fp.warnings;
  } catch (err) {
    results.filePlacement.errors.push(`Validator error: ${err.message}`);
  }
  results.filePlacement.time = Date.now() - start;
  console.log(`   ✓ ${results.filePlacement.errors.length} errors, ${results.filePlacement.warnings.length} warnings (${results.filePlacement.time}ms)`);
  
  // 2. File Uniqueness (duplicates)
  console.log('\n🔍 Validating file uniqueness...');
  start = Date.now();
  try {
    const fu = validateFileUniqueness(PROJECT_ROOT);
    results.fileUniqueness.errors = fu.errors;
    results.fileUniqueness.warnings = fu.warnings;
  } catch (err) {
    results.fileUniqueness.errors.push(`Validator error: ${err.message}`);
  }
  results.fileUniqueness.time = Date.now() - start;
  console.log(`   ✓ ${results.fileUniqueness.errors.length} errors, ${results.fileUniqueness.warnings.length} warnings (${results.fileUniqueness.time}ms)`);
  
  // 3. Spec Documents
  console.log('\n📄 Validating spec documents...');
  start = Date.now();
  try {
    const sd = validateAllSpecDocuments(PROJECT_ROOT);
    results.specDocuments.errors = sd.errors;
    results.specDocuments.warnings = sd.warnings;
  } catch (err) {
    results.specDocuments.errors.push(`Validator error: ${err.message}`);
  }
  results.specDocuments.time = Date.now() - start;
  console.log(`   ✓ ${results.specDocuments.errors.length} errors, ${results.specDocuments.warnings.length} warnings (${results.specDocuments.time}ms)`);
  
  // 4. Naming Conventions
  console.log('\n🏷️  Validating naming conventions...');
  start = Date.now();
  try {
    const nc = validateNamingConventions(PROJECT_ROOT);
    results.namingConventions.errors = nc.errors;
    results.namingConventions.warnings = nc.warnings;
  } catch (err) {
    results.namingConventions.errors.push(`Validator error: ${err.message}`);
  }
  results.namingConventions.time = Date.now() - start;
  console.log(`   ✓ ${results.namingConventions.errors.length} errors, ${results.namingConventions.warnings.length} warnings (${results.namingConventions.time}ms)`);
  
  return results;
}

/**
 * Main execution
 */
function main() {
  const results = runAllValidators();
  
  // Aggregate results
  const allErrors = [];
  const allWarnings = [];
  let totalTime = 0;
  
  for (const [key, result] of Object.entries(results)) {
    allErrors.push(...result.errors.map(e => `[${result.name}] ${e}`));
    allWarnings.push(...result.warnings.map(w => `[${result.name}] ${w}`));
    totalTime += result.time;
  }
  
  console.log('\n' + '=' .repeat(60));
  
  // Report errors
  if (allErrors.length > 0) {
    console.log(formatSection('❌ ERRORS (must fix)', allErrors, 30));
  }
  
  // Report warnings
  if (allWarnings.length > 0) {
    console.log(formatSection('⚠️  WARNINGS (should review)', allWarnings, 20));
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log(`📊 Summary: ${allErrors.length} errors, ${allWarnings.length} warnings (${totalTime}ms total)`);
  
  // Determine exit code
  if (allErrors.length > 0) {
    console.log('\n❌ Validation FAILED. Fix errors before committing.');
    process.exit(1);
  }
  
  if (warningsAsErrors && allWarnings.length > 0) {
    console.log('\n❌ Validation FAILED (--warnings-as-errors). Fix warnings before committing.');
    process.exit(1);
  }
  
  if (allWarnings.length > 0) {
    console.log('\n✅ Validation PASSED with warnings. Review before committing.');
    process.exit(0);
  }
  
  console.log('\n✅ All validations passed!');
  process.exit(0);
}

// Export for programmatic use
module.exports = { runAllValidators };

// Run if called directly
if (require.main === module) {
  main();
}
