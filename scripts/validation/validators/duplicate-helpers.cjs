#!/usr/bin/env node
/**
 * DUPLICATE DETECTION UTILITIES
 * 
 * Helper functions for detecting file duplicates.
 * Extracted from file-uniqueness.cjs to keep files under 300 lines.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DUPLICATE_RULES, getModuleForFile } = require('../rules/structure-rules.cjs');

/**
 * Find all files matching criteria
 */
function findFiles(rootDir, extensions, excludeDirs) {
  const results = [];
  
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(rootDir, fullPath);
      
      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) walk(fullPath);
      } else {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) results.push(relPath);
      }
    }
  }
  
  walk(rootDir);
  return results;
}

/**
 * Detect exact content duplicates using MD5 hash
 */
function detectContentDuplicates(rootDir) {
  const errors = [];
  const warnings = [];
  const fileHashes = {};
  
  const { contentDuplicateExtensions, minFileSizeBytes, excludeDirs, allowedDuplicatePatterns } = DUPLICATE_RULES;
  const files = findFiles(rootDir, contentDuplicateExtensions, excludeDirs);
  
  for (const relPath of files) {
    const fullPath = path.join(rootDir, relPath);
    const fileName = path.basename(relPath);
    
    if (allowedDuplicatePatterns.some(p => p.test(fileName))) continue;
    
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.length < minFileSizeBytes) continue;
      
      const hash = crypto.createHash('md5').update(content).digest('hex');
      if (!fileHashes[hash]) fileHashes[hash] = [];
      fileHashes[hash].push(relPath);
    } catch (err) { /* skip unreadable */ }
  }
  
  for (const [hash, paths] of Object.entries(fileHashes)) {
    if (paths.length > 1) {
      errors.push(`DUPLICATE CONTENT (${paths.length} files):\n  - ${paths.join('\n  - ')}`);
    }
  }
  
  return { errors, warnings };
}

/**
 * Detect similar filenames (potential duplicates)
 */
function detectSimilarFilenames(rootDir) {
  const errors = [];
  const warnings = [];
  const { excludeDirs, similarityRules, allowedDuplicatePatterns } = DUPLICATE_RULES;
  const allFiles = [];
  
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(rootDir, fullPath);
      
      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) walk(fullPath);
      } else {
        allFiles.push(relPath);
      }
    }
  }
  
  walk(rootDir);
  
  const byBaseName = {};
  for (const relPath of allFiles) {
    const fileName = path.basename(relPath);
    if (allowedDuplicatePatterns.some(p => p.test(fileName))) continue;
    
    const baseName = fileName.replace(/\.(js|ts|tsx|jsx|cjs|mjs|md|json|spec\.ts)$/, '').toLowerCase();
    if (!byBaseName[baseName]) byBaseName[baseName] = [];
    byBaseName[baseName].push(relPath);
  }
  
  for (const [baseName, paths] of Object.entries(byBaseName)) {
    if (paths.length > 1) {
      const isExpected = similarityRules.expectedPairs.some(pair => {
        const folders = paths.map(p => {
          for (const folder of pair.folders) {
            if (p.replace(/\\/g, '/').startsWith(folder)) return folder;
          }
          return null;
        });
        return pair.folders.every(f => folders.includes(f));
      });
      
      if (!isExpected) {
        const extensions = paths.map(p => path.extname(p));
        const uniqueExts = [...new Set(extensions)];
        const jsTsDuplicate = uniqueExts.includes('.js') && uniqueExts.includes('.ts');
        
        if (uniqueExts.length === 1 || jsTsDuplicate) {
          warnings.push(`SIMILAR FILES "${baseName}":\n  - ${paths.join('\n  - ')}`);
        }
      }
    }
  }
  
  return { errors, warnings };
}

module.exports = { findFiles, detectContentDuplicates, detectSimilarFilenames };
