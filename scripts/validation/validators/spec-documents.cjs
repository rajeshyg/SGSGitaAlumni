#!/usr/bin/env node
/**
 * SPEC DOCUMENTS VALIDATOR
 * 
 * Validates specification documents follow standards.
 * Uses spec-helpers.cjs for frontmatter/link parsing.
 * 
 * Checks:
 * - YAML frontmatter and required fields (except README.md)
 * - Required sections, acceptance criteria
 * - Link validity
 * - Stray files, module folder completeness
 * 
 * NOTE: README.md is navigation hub (no frontmatter required).
 *       ROADMAP.md is optional progress tracker (if present, requires frontmatter).
 *       Only spec content files require frontmatter.
 */

const fs = require('fs');
const path = require('path');
const { SPEC_RULES, MODULE_DEFINITIONS } = require('../rules/structure-rules.cjs');
const { parseFrontmatter, validateFrontmatter, validateRequiredSections, validateLinks } = require('./spec-helpers.cjs');

/**
 * Validate a single spec document
 */
function validateSpecDocument(filePath, relPath, specType) {
  const errors = [];
  const warnings = [];
  const fileName = path.basename(filePath);
  
  // Skip navigation file (no frontmatter required)
  if (fileName === 'README.md') return { errors, warnings };
  
  // ROADMAP.md is optional but requires frontmatter if present
  if (fileName === 'ROADMAP.md') {
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      warnings.push(`Cannot read ROADMAP.md: ${err.message}`);
      return { errors, warnings };
    }
    
    const fmResult = validateFrontmatter(content, specType);
    errors.push(...fmResult.errors);
    warnings.push(...fmResult.warnings);
    return { errors, warnings };
  }
  
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    warnings.push(`Cannot read file: ${err.message}`);
    return { errors, warnings };
  }
  
  // Validate frontmatter
  const fmResult = validateFrontmatter(content, specType);
  errors.push(...fmResult.errors);
  warnings.push(...fmResult.warnings);
  
  if (!fmResult.frontmatter) return { errors, warnings };
  
  // Validate sections (functional specs only)
  if (specType === 'functional') {
    const sectionResult = validateRequiredSections(content, fmResult.frontmatter, filePath);
    errors.push(...sectionResult.errors);
    warnings.push(...sectionResult.warnings);
  }
  
  // Validate links
  const linkResult = validateLinks(content, path.dirname(filePath));
  errors.push(...linkResult.errors);
  warnings.push(...linkResult.warnings);
  
  return { errors, warnings };
}

/**
 * Validate spec folder structure
 */
function validateSpecFolderStructure(specsDir, specType) {
  const errors = [];
  const warnings = [];
  
  const typeDir = path.join(specsDir, specType);
  if (!fs.existsSync(typeDir)) {
    errors.push(`${specType} specs directory not found: docs/specs/${specType}/`);
    return { errors, warnings };
  }
  
  const expectedFolders = specType === 'functional' 
    ? MODULE_DEFINITIONS.functionalSpecFolders 
    : MODULE_DEFINITIONS.technicalSpecFolders;
  
  const actualFolders = fs.readdirSync(typeDir)
    .filter(item => fs.statSync(path.join(typeDir, item)).isDirectory());
  
  const missing = expectedFolders.filter(f => !actualFolders.includes(f));
  if (missing.length) warnings.push(`Missing ${specType} spec folders: ${missing.join(', ')}`);
  
  const unexpected = actualFolders.filter(f => !expectedFolders.includes(f));
  if (unexpected.length) warnings.push(`Unexpected ${specType} spec folders: ${unexpected.join(', ')}`);
  
  // Check READMEs
  for (const folder of actualFolders) {
    const readmePath = path.join(typeDir, folder, 'README.md');
    if (!fs.existsSync(readmePath)) {
      errors.push(`Missing README.md in ${specType}/${folder}/`);
    } else {
      const result = validateSpecDocument(readmePath, `docs/specs/${specType}/${folder}/README.md`, specType);
      if (result.errors.length) errors.push(`${specType}/${folder}/README.md: ${result.errors.join(', ')}`);
    }
  }
  
  return { errors, warnings };
}

/**
 * Check for stray files at specs root
 */
function checkStrayFiles(specsDir) {
  const errors = [];
  const warnings = [];
  
  const rootFiles = fs.readdirSync(specsDir)
    .filter(item => fs.statSync(path.join(specsDir, item)).isFile() && item.endsWith('.md'));
  
  const stray = rootFiles.filter(f => !SPEC_RULES.strayFileRules.allowedAtRoot.includes(f));
  if (stray.length) warnings.push(`Stray files at specs/ root: ${stray.join(', ')}`);
  
  for (const type of ['functional', 'technical']) {
    const typeDir = path.join(specsDir, type);
    if (!fs.existsSync(typeDir)) continue;
    
    const typeRootFiles = fs.readdirSync(typeDir)
      .filter(item => fs.statSync(path.join(typeDir, item)).isFile() && item.endsWith('.md') && item !== 'README.md');
    
    if (type === 'functional' && typeRootFiles.length) {
      errors.push(`Stray files at functional/ root: ${typeRootFiles.join(', ')}`);
    }
    
    if (type === 'technical') {
      const allowed = ['project-structure-master.md'];
      const stray = typeRootFiles.filter(f => !allowed.includes(f));
      if (stray.length) errors.push(`Stray files at technical/ root: ${stray.join(', ')}`);
      const known = typeRootFiles.filter(f => allowed.includes(f));
      if (known.length) warnings.push(`Files at technical/ root (consider moving): ${known.join(', ')}`);
    }
  }
  
  return { errors, warnings };
}

/**
 * Validate all spec documents
 */
function validateAllSpecDocuments(rootDir) {
  const allErrors = [];
  const allWarnings = [];
  
  const specsDir = path.join(rootDir, 'docs/specs');
  if (!fs.existsSync(specsDir)) {
    allErrors.push('docs/specs/ directory not found');
    return { errors: allErrors, warnings: allWarnings };
  }
  
  // Structure validation
  for (const type of ['functional', 'technical']) {
    const result = validateSpecFolderStructure(specsDir, type);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }
  
  // Stray files
  const strayResult = checkStrayFiles(specsDir);
  allErrors.push(...strayResult.errors);
  allWarnings.push(...strayResult.warnings);
  
  // Individual documents
  for (const specType of ['functional', 'technical']) {
    const typeDir = path.join(specsDir, specType);
    if (!fs.existsSync(typeDir)) continue;
    
    const folders = fs.readdirSync(typeDir)
      .filter(item => fs.statSync(path.join(typeDir, item)).isDirectory());
    
    for (const folder of folders) {
      const folderPath = path.join(typeDir, folder);
      const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.md') && f !== 'README.md');
      
      for (const file of files) {
        const filePath = path.join(folderPath, file);
        const relPath = `docs/specs/${specType}/${folder}/${file}`;
        const result = validateSpecDocument(filePath, relPath, specType);
        
        allErrors.push(...result.errors.map(e => `${relPath}: ${e}`));
        allWarnings.push(...result.warnings.map(w => `${relPath}: ${w}`));
      }
    }
  }
  
  return { errors: allErrors, warnings: allWarnings };
}

module.exports = { validateSpecDocument, validateSpecFolderStructure, checkStrayFiles, validateAllSpecDocuments };

// CLI
if (require.main === module) {
  const PROJECT_ROOT = path.resolve(__dirname, '../../..');
  console.log('📄 Running spec document validation...\n');
  
  const { errors, warnings } = validateAllSpecDocuments(PROJECT_ROOT);
  
  if (errors.length) {
    console.log(`❌ Errors (${errors.length}):`);
    errors.slice(0, 30).forEach(e => console.log(`  - ${e}`));
    if (errors.length > 30) console.log(`  ... ${errors.length - 30} more`);
  }
  
  if (warnings.length) {
    console.log(`\n⚠️  Warnings (${warnings.length}):`);
    warnings.slice(0, 30).forEach(w => console.log(`  - ${w}`));
    if (warnings.length > 30) console.log(`  ... ${warnings.length - 30} more`);
  }
  
  if (!errors.length && !warnings.length) console.log('✅ All spec documents valid.');
  process.exit(errors.length > 0 ? 1 : 0);
}
