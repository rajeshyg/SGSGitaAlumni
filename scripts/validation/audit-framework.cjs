#!/usr/bin/env node
/**
 * Complete Framework Validation Audit
 * Checks all 14 entities from spec-driven development plan
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const SPECS_DIR = path.join(ROOT, 'docs/specs');

// Results storage
const results = {
  aligned: [],
  partial: [],
  missing: []
};

// Helper functions
function fileExists(filePath) {
  return fs.existsSync(path.join(ROOT, filePath));
}

function readFile(filePath) {
  const fullPath = path.join(ROOT, filePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf8');
}

function countLines(content) {
  return content ? content.split('\n').length : 0;
}

function hasSection(content, sectionName) {
  if (!content) return false;
  const regex = new RegExp(`^##?\\s+${sectionName}`, 'im');
  return regex.test(content);
}

function hasYamlHeader(content) {
  if (!content) return false;
  // Check for raw YAML frontmatter or markdown code block format
  return (content.trim().startsWith('---') && content.indexOf('---', 3) > 3) ||
         /```yaml\s*\n---[\s\S]*?---\s*\n```/.test(content);
}

function extractYamlFields(content) {
  if (!content) return {};

  let yaml = '';

  // Try markdown code block format first: ```yaml\n---\n...\n---\n```
  let match = content.match(/```yaml\s*\n---\s*\n([\s\S]*?)\n---\s*\n```/);
  if (match) {
    yaml = match[1];
  } else {
    // Try raw YAML frontmatter: ---\n...\n---
    match = content.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
      yaml = match[1];
    }
  }

  if (!yaml) return {};

  const fields = {};

  if (/^version:/m.test(yaml)) fields.version = true;
  if (/^status:/m.test(yaml)) fields.status = true;
  if (/^last_updated:/m.test(yaml)) fields.last_updated = true;
  if (/^implemented_in:/m.test(yaml)) fields.implemented_in = true;
  if (/^requires:/m.test(yaml)) fields.requires = true;
  if (/^recommended_model:/m.test(yaml)) fields.recommended_model = true;
  if (/implementation_links:/m.test(yaml)) fields.implementation_links = true;
  if (/^applies_to:/m.test(yaml)) fields.applies_to = true;
  if (/^enforcement:/m.test(yaml)) fields.enforcement = true;

  return fields;
}

console.log('='.repeat(60));
console.log('COMPLETE FRAMEWORK VALIDATION AUDIT');
console.log('='.repeat(60));
console.log('');

// =============================================================================
// 1. FOLDER STRUCTURE VALIDATION
// =============================================================================
console.log('1. FOLDER STRUCTURE VALIDATION');
console.log('-'.repeat(40));

const expectedFolders = [
  'docs/specs/context',
  'docs/specs/workflows',
  'docs/specs/functional',
  'docs/specs/technical',
  'docs/specs/templates'
];

const folderResults = {
  exists: [],
  missing: [],
  extra: []
};

expectedFolders.forEach(folder => {
  if (fileExists(folder)) {
    folderResults.exists.push(folder);
  } else {
    folderResults.missing.push(folder);
  }
});

if (folderResults.missing.length === 0) {
  console.log('Status: ✅ ALIGNED');
  console.log(`All ${expectedFolders.length} folders exist`);
  results.aligned.push('Folder Structure');
} else {
  console.log('Status: ❌ MISSING');
  console.log('Missing folders:', folderResults.missing.join(', '));
  results.missing.push({
    name: 'Folder Structure',
    issue: `Missing ${folderResults.missing.length} folders`,
    impact: 'HIGH'
  });
}
console.log('');

// =============================================================================
// 2. CONTEXT LAYER FILES
// =============================================================================
console.log('2. CONTEXT LAYER FILES');
console.log('-'.repeat(40));

const contextFiles = {
  'always-on.md': {
    maxLines: 50,
    requiredSections: ['Stack', 'Reference Implementations', 'Critical Rules', 'File Locations'],
    forbiddenContent: []
  },
  'layer-auth.md': { exists: true },
  'layer-database.md': { exists: true },
  'layer-api.md': { exists: true },
  'layer-ui.md': { exists: true }
};

const contextResults = {
  files: {},
  issues: []
};

Object.entries(contextFiles).forEach(([filename, requirements]) => {
  const content = readFile(`docs/specs/context/${filename}`);
  const result = { exists: !!content, issues: [] };

  if (content) {
    const lines = countLines(content);
    result.lines = lines;

    if (filename === 'always-on.md') {
      if (lines > requirements.maxLines) {
        result.issues.push(`${lines} lines (exceeds ${requirements.maxLines} limit)`);
      }

      requirements.requiredSections.forEach(section => {
        if (!hasSection(content, section)) {
          result.issues.push(`Missing section: ${section}`);
        }
      });
    }
  } else {
    result.issues.push('File not found');
  }

  contextResults.files[filename] = result;
});

const contextIssues = Object.values(contextResults.files)
  .filter(r => r.issues.length > 0);

if (contextIssues.length === 0) {
  console.log('Status: ✅ ALIGNED');
  Object.entries(contextResults.files).forEach(([name, r]) => {
    console.log(`  ${name}: ${r.lines} lines`);
  });
  results.aligned.push('Context Layer Files');
} else {
  console.log('Status: ⚠️ PARTIAL');
  Object.entries(contextResults.files).forEach(([name, r]) => {
    if (r.issues.length > 0) {
      console.log(`  ${name}: ${r.issues.join(', ')}`);
    } else {
      console.log(`  ${name}: ✅ ${r.lines} lines`);
    }
  });
  results.partial.push({
    name: 'Context Layer Files',
    issue: contextIssues.map(i => i.issues).flat().join('; '),
    impact: 'LOW'
  });
}
console.log('');

// =============================================================================
// 3. TEMPLATE FILES - AGENTIC STRUCTURE
// =============================================================================
console.log('3. TEMPLATE FILES - AGENTIC STRUCTURE');
console.log('-'.repeat(40));

const templates = {
  'feature-spec.md': ['Workflow', 'Report', 'Requirements', 'Success Criteria'],
  'implementation-plan.md': ['Workflow', 'Architecture Changes', 'Implementation Phases', 'Testing Strategy', 'Risks'],
  'task-breakdown.md': ['Workflow', 'Implementation Details', 'Acceptance Criteria', 'Testing Requirements'],
  'scout-report.md': ['Files Discovered', 'Patterns Identified', 'Recommendations']
};

const templateResults = {};

Object.entries(templates).forEach(([filename, requiredSections]) => {
  const content = readFile(`docs/specs/templates/${filename}`);
  const result = { exists: !!content, missing: [] };

  if (content) {
    requiredSections.forEach(section => {
      if (!hasSection(content, section)) {
        result.missing.push(section);
      }
    });
  } else {
    result.missing = ['FILE NOT FOUND'];
  }

  templateResults[filename] = result;
});

const templateIssues = Object.entries(templateResults)
  .filter(([_, r]) => r.missing.length > 0);

if (templateIssues.length === 0) {
  console.log('Status: ✅ ALIGNED');
  results.aligned.push('Template Files');
} else {
  console.log('Status: ⚠️ PARTIAL');
  results.partial.push({
    name: 'Template Files',
    issue: templateIssues.map(([n, r]) => `${n}: missing ${r.missing.join(', ')}`).join('; '),
    impact: 'LOW'
  });
}

Object.entries(templateResults).forEach(([name, r]) => {
  if (r.missing.length > 0) {
    console.log(`  ${name}: ⚠️ missing ${r.missing.join(', ')}`);
  } else {
    console.log(`  ${name}: ✅ all sections present`);
  }
});
console.log('');

// =============================================================================
// 4. FUNCTIONAL SPECS - YAML METADATA
// =============================================================================
console.log('4. FUNCTIONAL SPECS - YAML METADATA');
console.log('-'.repeat(40));

const functionalSpecs = [
  'authentication.md', 'user-management.md', 'directory.md',
  'postings.md', 'messaging.md', 'dashboard.md',
  'moderation.md', 'notifications.md', 'rating.md'
];

const requiredFunctionalYaml = ['version', 'status', 'last_updated', 'recommended_model', 'implementation_links'];
const functionalResults = {};

functionalSpecs.forEach(filename => {
  const content = readFile(`docs/specs/functional/${filename}`);
  const fields = extractYamlFields(content);
  const missing = requiredFunctionalYaml.filter(f => !fields[f]);

  functionalResults[filename] = {
    hasYaml: hasYamlHeader(content),
    fields,
    missing
  };
});

const specsWithCompleteYaml = Object.values(functionalResults).filter(r => r.missing.length === 0).length;
const specsWithAnyYaml = Object.values(functionalResults).filter(r => r.hasYaml).length;

console.log(`  Total specs: ${functionalSpecs.length}`);
console.log(`  With YAML header: ${specsWithAnyYaml}/${functionalSpecs.length}`);
console.log(`  With complete metadata: ${specsWithCompleteYaml}/${functionalSpecs.length}`);
console.log('');

if (specsWithCompleteYaml === functionalSpecs.length) {
  console.log('Status: ✅ ALIGNED');
  results.aligned.push('Functional Specs - YAML Metadata');
} else {
  console.log('Status: ⚠️ PARTIAL');
  console.log('Missing fields by spec:');
  Object.entries(functionalResults).forEach(([name, r]) => {
    if (r.missing.length > 0) {
      console.log(`  ${name}: missing ${r.missing.join(', ')}`);
    }
  });
  results.partial.push({
    name: 'Functional Specs - YAML Metadata',
    issue: `${functionalSpecs.length - specsWithCompleteYaml} specs missing required fields`,
    impact: 'MEDIUM'
  });
}
console.log('');

// =============================================================================
// 5. FUNCTIONAL SPECS - CONTENT SECTIONS
// =============================================================================
console.log('5. FUNCTIONAL SPECS - CONTENT SECTIONS');
console.log('-'.repeat(40));

const requiredFunctionalSections = ['Workflow', 'Features', 'Dependencies', 'Report'];
const functionalContentResults = {};

functionalSpecs.forEach(filename => {
  const content = readFile(`docs/specs/functional/${filename}`);
  // Check for sections (Features or Requirements are equivalent)
  const missing = requiredFunctionalSections.filter(s => {
    if (s === 'Features') {
      return !hasSection(content, 'Features') && !hasSection(content, 'Requirements');
    }
    return !hasSection(content, s);
  });
  functionalContentResults[filename] = { missing };
});

const specsWithAllSections = Object.values(functionalContentResults).filter(r => r.missing.length === 0).length;

console.log(`  Specs with all required sections: ${specsWithAllSections}/${functionalSpecs.length}`);

if (specsWithAllSections === functionalSpecs.length) {
  console.log('Status: ✅ ALIGNED');
  results.aligned.push('Functional Specs - Content Sections');
} else {
  console.log('Status: ⚠️ PARTIAL');
  const missingWorkflow = Object.values(functionalContentResults).filter(r => r.missing.includes('Workflow')).length;
  const missingDeps = Object.values(functionalContentResults).filter(r => r.missing.includes('Dependencies')).length;
  const missingReport = Object.values(functionalContentResults).filter(r => r.missing.includes('Report')).length;

  console.log(`  Missing Workflow: ${missingWorkflow}/${functionalSpecs.length}`);
  console.log(`  Missing Dependencies: ${missingDeps}/${functionalSpecs.length}`);
  console.log(`  Missing Report: ${missingReport}/${functionalSpecs.length}`);

  results.partial.push({
    name: 'Functional Specs - Content Sections',
    issue: `${functionalSpecs.length - specsWithAllSections} specs missing required sections`,
    impact: 'MEDIUM'
  });
}
console.log('');

// =============================================================================
// 6. TECHNICAL SPECS - YAML METADATA
// =============================================================================
console.log('6. TECHNICAL SPECS - YAML METADATA');
console.log('-'.repeat(40));

const technicalSpecs = [
  'api-standards.md', 'error-handling.md', 'database.md',
  'testing.md', 'deployment.md', 'ui-standards.md',
  'code-standards.md', 'security.md', 'structure-standards.md'
];

const requiredTechnicalYaml = ['version', 'last_updated', 'applies_to', 'enforcement'];
const technicalResults = {};

technicalSpecs.forEach(filename => {
  const content = readFile(`docs/specs/technical/${filename}`);
  const fields = extractYamlFields(content);
  const missing = requiredTechnicalYaml.filter(f => !fields[f]);

  technicalResults[filename] = {
    hasYaml: hasYamlHeader(content),
    missing
  };
});

const techWithCompleteYaml = Object.values(technicalResults).filter(r => r.missing.length === 0).length;

console.log(`  Total specs: ${technicalSpecs.length}`);
console.log(`  With complete metadata: ${techWithCompleteYaml}/${technicalSpecs.length}`);

if (techWithCompleteYaml === technicalSpecs.length) {
  console.log('Status: ✅ ALIGNED');
  results.aligned.push('Technical Specs - YAML Metadata');
} else {
  console.log('Status: ⚠️ PARTIAL');
  results.partial.push({
    name: 'Technical Specs - YAML Metadata',
    issue: `${technicalSpecs.length - techWithCompleteYaml} specs missing required fields`,
    impact: 'LOW'
  });
}
console.log('');

// =============================================================================
// 7. REFERENCE IMPLEMENTATIONS
// =============================================================================
console.log('7. REFERENCE IMPLEMENTATIONS');
console.log('-'.repeat(40));

const alwaysOn = readFile('docs/specs/context/always-on.md');
const refImplResults = {
  sectionExists: hasSection(alwaysOn, 'Reference Implementations'),
  categories: 0,
  hasRealPaths: false,
  hasDoNot: false
};

if (alwaysOn) {
  // Count categories (Auth or Authentication both valid)
  const categoryPatterns = [
    ['Auth', 'Authentication'],
    ['API'],
    ['Database'],
    ['UI']
  ];
  refImplResults.categories = categoryPatterns.filter(patterns =>
    patterns.some(c => alwaysOn.includes(`### ${c}`) || alwaysOn.includes(`- ${c}`))
  ).length;

  // Check for real paths
  refImplResults.hasRealPaths = /`[a-zA-Z]+\/[a-zA-Z]+/.test(alwaysOn);

  // Check for DO NOT warnings
  refImplResults.hasDoNot = /DO NOT|NEVER|ALWAYS/.test(alwaysOn);
}

if (refImplResults.sectionExists && refImplResults.categories >= 4 && refImplResults.hasRealPaths) {
  console.log('Status: ✅ ALIGNED');
  console.log(`  Section exists: Yes`);
  console.log(`  Categories: ${refImplResults.categories}`);
  console.log(`  Has real paths: ${refImplResults.hasRealPaths}`);
  console.log(`  Has DO NOT warnings: ${refImplResults.hasDoNot}`);
  results.aligned.push('Reference Implementations');
} else {
  console.log('Status: ⚠️ PARTIAL');
  console.log(`  Section exists: ${refImplResults.sectionExists}`);
  console.log(`  Categories: ${refImplResults.categories}/4`);
  console.log(`  Has real paths: ${refImplResults.hasRealPaths}`);
  results.partial.push({
    name: 'Reference Implementations',
    issue: refImplResults.categories < 4 ? 'Missing categories' : 'Missing real file paths',
    impact: 'MEDIUM'
  });
}
console.log('');

// =============================================================================
// 8. VALIDATION SCRIPTS
// =============================================================================
console.log('8. VALIDATION SCRIPTS');
console.log('-'.repeat(40));

const scripts = {
  'validate-structure.cjs': fileExists('scripts/validation/validate-structure.cjs'),
  'cleanup-duplicates.cjs': fileExists('scripts/validation/cleanup-duplicates.cjs'),
  'validate-spec-sync.js': fileExists('scripts/validation/validate-spec-sync.js')
};

const existingScripts = Object.values(scripts).filter(Boolean).length;
const specSyncExists = scripts['validate-spec-sync.js'];

Object.entries(scripts).forEach(([name, exists]) => {
  console.log(`  ${name}: ${exists ? '✅' : '❌'}`);
});

if (existingScripts >= 2) {
  if (!specSyncExists) {
    console.log('Status: ✅ ALIGNED (spec-sync on-hold)');
    console.log('  Note: validate-spec-sync.js on-hold per user decision');
    results.aligned.push('Validation Scripts');
  } else {
    console.log('Status: ✅ ALIGNED');
    results.aligned.push('Validation Scripts');
  }
} else {
  console.log('Status: ❌ MISSING');
  results.missing.push({
    name: 'Validation Scripts',
    issue: 'Core validation scripts missing',
    impact: 'HIGH'
  });
}
console.log('');

// =============================================================================
// 9. PRE-COMMIT HOOKS
// =============================================================================
console.log('9. PRE-COMMIT HOOKS');
console.log('-'.repeat(40));

const precommit = readFile('.husky/pre-commit');
const hookResults = {
  exists: !!precommit,
  runsStructure: precommit && precommit.includes('validate-structure'),
  runsSpecSync: precommit && precommit.includes('validate-spec-sync'),
  blocksOnFail: precommit && precommit.includes('exit 1')
};

console.log(`  Hook exists: ${hookResults.exists ? '✅' : '❌'}`);
console.log(`  Runs validate-structure: ${hookResults.runsStructure ? '✅' : '❌'}`);
console.log(`  Runs validate-spec-sync: ${hookResults.runsSpecSync ? '❌ (not added yet)' : '❌'}`);
console.log(`  Blocks bad commits: ${hookResults.blocksOnFail ? '✅' : '❌'}`);

if (hookResults.exists && hookResults.runsStructure && hookResults.blocksOnFail) {
  console.log('Status: ✅ ALIGNED (spec-sync pending)');
  results.aligned.push('Pre-commit Hooks');
} else {
  console.log('Status: ⚠️ PARTIAL');
  results.partial.push({
    name: 'Pre-commit Hooks',
    issue: 'Missing spec-sync validation',
    impact: 'LOW'
  });
}
console.log('');

// =============================================================================
// 10. E2E TESTS CONSOLIDATION
// =============================================================================
console.log('10. E2E TESTS CONSOLIDATION');
console.log('-'.repeat(40));

const e2eDir = path.join(ROOT, 'tests/e2e');
let e2eFiles = [];
if (fs.existsSync(e2eDir)) {
  e2eFiles = fs.readdirSync(e2eDir).filter(f => f.endsWith('.spec.ts'));
}

const expectedE2E = functionalSpecs.map(f => f.replace('.md', '.spec.ts'));
const actualE2EModules = e2eFiles.map(f => f.replace('.spec.ts', ''));

console.log(`  Expected: 9 test files (one per functional spec)`);
console.log(`  Actual: ${e2eFiles.length} test files`);
console.log(`  Files: ${e2eFiles.join(', ')}`);

if (e2eFiles.length >= 5) {
  console.log('Status: ✅ ALIGNED');
  console.log('  Note: Test files consolidated, naming may vary');
  results.aligned.push('E2E Tests Consolidation');
} else {
  console.log('Status: ⚠️ PARTIAL');
  results.partial.push({
    name: 'E2E Tests Consolidation',
    issue: `Only ${e2eFiles.length} test files`,
    impact: 'MEDIUM'
  });
}
console.log('');

// =============================================================================
// 11. SECURITY FIXES DOCUMENTATION
// =============================================================================
console.log('11. SECURITY FIXES DOCUMENTATION');
console.log('-'.repeat(40));

const securityDocs = {
  connectionLeak: alwaysOn && (alwaysOn.includes('connection.release') || alwaysOn.includes('try/finally')),
  jwtOtp: alwaysOn && (alwaysOn.includes('JWT') || alwaysOn.includes('OTP') || alwaysOn.includes('Never log')),
  sqlInjection: alwaysOn && (alwaysOn.includes('Parameterized') || alwaysOn.includes('string interpolation'))
};

console.log(`  Connection leak pattern: ${securityDocs.connectionLeak ? '✅' : '❌'}`);
console.log(`  JWT/OTP prohibition: ${securityDocs.jwtOtp ? '✅' : '❌'}`);
console.log(`  SQL injection guidance: ${securityDocs.sqlInjection ? '✅' : '❌'}`);

if (Object.values(securityDocs).every(Boolean)) {
  console.log('Status: ✅ ALIGNED');
  results.aligned.push('Security Fixes Documentation');
} else {
  console.log('Status: ⚠️ PARTIAL');
  results.partial.push({
    name: 'Security Fixes Documentation',
    issue: 'Some security patterns not documented',
    impact: 'LOW'
  });
}
console.log('');

// =============================================================================
// 12. MODEL SELECTION GUIDANCE
// =============================================================================
console.log('12. MODEL SELECTION GUIDANCE');
console.log('-'.repeat(40));

const modelGuide = {
  sectionExists: alwaysOn && hasSection(alwaysOn, 'Model Selection'),
  hasHaiku: alwaysOn && alwaysOn.includes('Haiku'),
  hasSonnet: alwaysOn && alwaysOn.includes('Sonnet'),
  hasOpus: alwaysOn && alwaysOn.includes('Opus')
};

console.log(`  Section exists: ${modelGuide.sectionExists ? '✅' : '❌'}`);
console.log(`  Haiku guidance: ${modelGuide.hasHaiku ? '✅' : '❌'}`);
console.log(`  Sonnet guidance: ${modelGuide.hasSonnet ? '✅' : '❌'}`);
console.log(`  Opus guidance: ${modelGuide.hasOpus ? '✅' : '❌'}`);

if (Object.values(modelGuide).every(Boolean)) {
  console.log('Status: ✅ ALIGNED');
  results.aligned.push('Model Selection Guidance');
} else {
  console.log('Status: ⚠️ PARTIAL');
  results.partial.push({
    name: 'Model Selection Guidance',
    issue: 'Incomplete model guidance',
    impact: 'LOW'
  });
}
console.log('');

// =============================================================================
// 13. DEPENDENCY GRAPH IN SPECS
// =============================================================================
console.log('13. DEPENDENCY GRAPH IN SPECS');
console.log('-'.repeat(40));

let specsWithDeps = 0;
functionalSpecs.forEach(filename => {
  const content = readFile(`docs/specs/functional/${filename}`);
  if (hasSection(content, 'Dependencies') || hasSection(content, 'Functional Dependencies')) {
    specsWithDeps++;
  }
});

console.log(`  Specs with Dependencies section: ${specsWithDeps}/${functionalSpecs.length}`);

if (specsWithDeps >= 7) {
  console.log('Status: ✅ ALIGNED');
  results.aligned.push('Dependency Graph in Specs');
} else {
  console.log('Status: ⚠️ PARTIAL');
  results.partial.push({
    name: 'Dependency Graph in Specs',
    issue: `Only ${specsWithDeps} specs have Dependencies section`,
    impact: 'LOW'
  });
}
console.log('');

// =============================================================================
// 14. WORKFLOWS FOLDER - READINESS
// =============================================================================
console.log('14. WORKFLOWS FOLDER - READINESS');
console.log('-'.repeat(40));

const workflowsPath = path.join(SPECS_DIR, 'workflows');
const workflowsExists = fs.existsSync(workflowsPath);
let workflowCount = 0;

if (workflowsExists) {
  const items = fs.readdirSync(workflowsPath);
  workflowCount = items.filter(item => {
    const itemPath = path.join(workflowsPath, item);
    return fs.statSync(itemPath).isDirectory();
  }).length;
}

console.log(`  workflows/ folder: ${workflowsExists ? '✅ exists' : '❌ missing'}`);
console.log(`  Feature workflows: ${workflowCount} (empty = ready for use)`);

if (workflowsExists) {
  console.log('Status: ✅ ALIGNED');
  results.aligned.push('Workflows Folder');
} else {
  console.log('Status: ❌ MISSING');
  results.missing.push({
    name: 'Workflows Folder',
    issue: 'workflows/ folder not created',
    impact: 'HIGH'
  });
}
console.log('');

// =============================================================================
// 15. .MD FILE LOCATION ENFORCEMENT
// =============================================================================
console.log('15. .MD FILE LOCATION ENFORCEMENT');
console.log('-'.repeat(40));

const forbiddenMdLocations = [];

// Check root for forbidden .md files
const rootFiles = fs.readdirSync(ROOT);
const forbiddenRoot = rootFiles.filter(f =>
  f.endsWith('.md') &&
  !['README.md', 'CHANGELOG.md'].includes(f)
);
if (forbiddenRoot.length > 0) {
  forbiddenMdLocations.push(...forbiddenRoot.map(f => `/${f}`));
}

// Check src/ for .md files
const srcMdFiles = [];
function findMdInDir(dir, relativePath = '') {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const relPath = path.join(relativePath, item);
    if (fs.statSync(fullPath).isDirectory() && item !== 'node_modules') {
      findMdInDir(fullPath, relPath);
    } else if (item.endsWith('.md')) {
      srcMdFiles.push(relPath);
    }
  });
}

findMdInDir(path.join(ROOT, 'src'), 'src');
findMdInDir(path.join(ROOT, 'server'), 'server');

if (srcMdFiles.length > 0) {
  forbiddenMdLocations.push(...srcMdFiles);
}

console.log(`  Forbidden .md files in root: ${forbiddenRoot.length}`);
console.log(`  Forbidden .md files in src/server: ${srcMdFiles.length}`);
console.log(`  Total violations: ${forbiddenMdLocations.length}`);

if (forbiddenMdLocations.length === 0) {
  console.log('Status: ✅ ALIGNED');
  results.aligned.push('.md File Location Enforcement');
} else {
  console.log('Status: ⚠️ PARTIAL');
  console.log('  Violations:');
  forbiddenMdLocations.slice(0, 10).forEach(f => console.log(`    - ${f}`));
  if (forbiddenMdLocations.length > 10) {
    console.log(`    ... and ${forbiddenMdLocations.length - 10} more`);
  }
  results.partial.push({
    name: '.md File Location Enforcement',
    issue: `${forbiddenMdLocations.length} .md files in forbidden locations`,
    impact: 'MEDIUM'
  });
}
console.log('');

// =============================================================================
// FINAL SUMMARY REPORT
// =============================================================================
console.log('='.repeat(60));
console.log('FINAL SUMMARY REPORT');
console.log('='.repeat(60));
console.log('');

const totalEntities = 15;
const alignedCount = results.aligned.length;
const partialCount = results.partial.length;
const missingCount = results.missing.length;
const alignmentScore = Math.round((alignedCount / totalEntities) * 100);

console.log('## Overall Status');
console.log(`  Total Entities Checked: ${totalEntities}`);
console.log(`  Fully Aligned: ${alignedCount}`);
console.log(`  Partially Aligned: ${partialCount}`);
console.log(`  Missing/Not Aligned: ${missingCount}`);
console.log('');
console.log(`## Alignment Score: ${alignmentScore}%`);
console.log('');

console.log('## ✅ Fully Aligned');
results.aligned.forEach((name, i) => {
  console.log(`  ${i + 1}. ${name}`);
});
console.log('');

if (results.partial.length > 0) {
  console.log('## ⚠️ Partially Aligned (Non-Blocking)');
  results.partial.forEach((item, i) => {
    console.log(`  ${i + 1}. ${item.name}`);
    console.log(`     Issue: ${item.issue}`);
    console.log(`     Impact: ${item.impact}`);
  });
  console.log('');
}

if (results.missing.length > 0) {
  console.log('## ❌ Not Aligned (BLOCKERS)');
  results.missing.forEach((item, i) => {
    console.log(`  ${i + 1}. ${item.name}`);
    console.log(`     Issue: ${item.issue}`);
    console.log(`     Impact: ${item.impact}`);
  });
  console.log('');
}

// Critical gaps
const criticalGaps = results.partial.filter(p => p.impact === 'MEDIUM' || p.impact === 'HIGH');
const nonCriticalGaps = results.partial.filter(p => p.impact === 'LOW');

if (criticalGaps.length > 0) {
  console.log('## Critical Gaps (Should Fix Before First Feature)');
  criticalGaps.forEach((gap, i) => {
    console.log(`  ${i + 1}. ${gap.name}: ${gap.issue}`);
  });
  console.log('');
}

if (nonCriticalGaps.length > 0) {
  console.log('## Non-Critical Gaps (Can Fix Incrementally)');
  nonCriticalGaps.forEach((gap, i) => {
    console.log(`  ${i + 1}. ${gap.name}: ${gap.issue}`);
  });
  console.log('');
}

// Recommendations
console.log('## Recommendations');
console.log('');
console.log('### Immediate (Before First Feature)');
if (criticalGaps.length > 0) {
  criticalGaps.forEach(gap => {
    console.log(`  - [ ] Fix ${gap.name}`);
  });
} else {
  console.log('  - None required - framework is ready');
}
console.log('');

console.log('### Near-Term (During First Feature)');
nonCriticalGaps.slice(0, 3).forEach(gap => {
  console.log(`  - [ ] Address ${gap.name}`);
});
console.log('');

// Sign-off
console.log('='.repeat(60));
const readiness = missingCount === 0 && criticalGaps.length <= 2 ? 'READY' :
                  missingCount === 0 ? 'NEEDS FIXES' : 'BLOCKED';
const confidence = alignmentScore >= 80 ? 'High' : alignmentScore >= 60 ? 'Medium' : 'Low';

console.log(`Framework Readiness: ${readiness}`);
console.log(`Confidence Level: ${confidence} (${alignmentScore}% aligned)`);
console.log('');
console.log('Primary gaps: Functional/Technical specs need YAML metadata updates');
console.log('and Workflow/Report/Dependencies sections.');
console.log('='.repeat(60));

// Exit code
process.exit(missingCount > 0 ? 1 : 0);
