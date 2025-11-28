#!/usr/bin/env node
/**
 * SPEC FRONTMATTER UTILITIES
 * 
 * Parsing and validation helpers for spec document frontmatter.
 * Extracted from spec-documents.cjs to keep files under 300 lines.
 */

const fs = require('fs');
const path = require('path');
const { SPEC_RULES } = require('../rules/structure-rules.cjs');

/**
 * Parse YAML frontmatter from markdown content
 * @param {string} content - Markdown file content
 * @returns {{ found: boolean, fields: object, raw: string }}
 */
function parseFrontmatter(content) {
  if (!content.startsWith('---')) {
    return { found: false, fields: {}, raw: '' };
  }
  
  // Handle both Unix (LF) and Windows (CRLF) line endings
  const match = content.match(/^---[\r\n]+([\s\S]*?)[\r\n]+---/);
  if (!match) {
    return { found: false, fields: {}, raw: '' };
  }
  
  const raw = match[1];
  const fields = {};
  
  // Simple YAML parsing (key: value)
  const lines = raw.split(/[\r\n]+/);
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      fields[key] = value;
    }
  }
  
  return { found: true, fields, raw };
}

/**
 * Validate frontmatter of a spec file
 * @param {string} content - File content  
 * @param {string} specType - 'functional' or 'technical'
 * @returns {{ errors: string[], warnings: string[] }}
 */
function validateFrontmatter(content, specType) {
  const errors = [];
  const warnings = [];
  
  const frontmatter = parseFrontmatter(content);
  
  if (!frontmatter.found) {
    errors.push('Missing YAML frontmatter');
    return { errors, warnings, frontmatter: null };
  }
  
  // Check required fields
  for (const field of SPEC_RULES.requiredFrontmatter) {
    if (!frontmatter.fields[field]) {
      errors.push(`Missing '${field}' in frontmatter`);
    }
  }
  
  // Check status value
  if (frontmatter.fields.status) {
    if (!SPEC_RULES.validStatuses.includes(frontmatter.fields.status)) {
      warnings.push(`Invalid status '${frontmatter.fields.status}'. Valid: ${SPEC_RULES.validStatuses.join(', ')}`);
    }
  }
  
  return { errors, warnings, frontmatter };
}

/**
 * Validate required sections for functional specs
 * @param {string} content - File content
 * @param {object} frontmatter - Parsed frontmatter
 * @param {string} [filePath] - File path (to determine if it's a db-schema file)
 * @returns {{ errors: string[], warnings: string[] }}
 */
function validateRequiredSections(content, frontmatter, filePath = '') {
  const errors = [];
  const warnings = [];

  const isPending = frontmatter?.fields?.status === 'pending';
  const isTemplate = frontmatter?.fields?.status === 'template';
  if (isPending || isTemplate) {
    return { errors, warnings };
  }

  // Determine if this is a db-schema file
  const isDbSchema = filePath.includes('db-schema.md');

  // Use appropriate required sections
  const requiredSections = isDbSchema
    ? SPEC_RULES.dbSchemaRequiredSections
    : SPEC_RULES.functionalRequiredSections;

  for (const section of requiredSections) {
    const sectionRegex = new RegExp(`^##\\s+${section}`, 'm');
    if (!sectionRegex.test(content)) {
      warnings.push(`Missing section: ${section}`);
    }
  }

  // Check acceptance criteria format (only for non-db-schema files)
  if (!isDbSchema && content.includes('## Acceptance Criteria')) {
    const criteriaSection = content.split('## Acceptance Criteria')[1]?.split('##')[0];
    if (criteriaSection) {
      const hasMarkers = SPEC_RULES.acceptanceCriteriaFormat.allowedMarkers.some(
        marker => criteriaSection.includes(marker)
      );
      if (!hasMarkers) {
        warnings.push('Acceptance Criteria should use checkboxes or markers');
      }
    }
  }

  return { errors, warnings };
}

/**
 * Validate internal and cross-module links
 * @param {string} content - File content
 * @param {string} moduleDir - Directory containing the file
 * @returns {{ errors: string[], warnings: string[] }}
 */
function validateLinks(content, moduleDir) {
  const errors = [];
  const warnings = [];
  
  // Internal links
  const internalLinks = content.match(/\[.*?\]\(\.\/.+?\.md\)/g) || [];
  for (const link of internalLinks) {
    const linkPath = link.match(/\((\.\/.*?\.md)\)/)?.[1];
    if (linkPath) {
      const absoluteLinkPath = path.join(moduleDir, linkPath.replace('./', ''));
      if (!fs.existsSync(absoluteLinkPath)) {
        warnings.push(`Broken link: ${linkPath}`);
      }
    }
  }
  
  // Cross-module links
  const crossLinks = content.match(/\[.*?\]\(\.\.\/.*?\.md\)/g) || [];
  for (const link of crossLinks) {
    const linkPath = link.match(/\((\.\.\/.*?\.md)\)/)?.[1];
    if (linkPath) {
      const absoluteLinkPath = path.join(moduleDir, linkPath);
      if (!fs.existsSync(absoluteLinkPath)) {
        warnings.push(`Broken cross-reference: ${linkPath}`);
      }
    }
  }
  
  return { errors, warnings };
}

module.exports = {
  parseFrontmatter,
  validateFrontmatter,
  validateRequiredSections,
  validateLinks,
};
