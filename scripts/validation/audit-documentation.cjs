#!/usr/bin/env node
/**
 * Audit Documentation
 * Documentation consolidation scout:
 * - Find all .md files outside docs/
 * - Check for stale docs
 * - Verify README in key folders
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

console.log('='.repeat(60));
console.log('AUDIT: DOCUMENTATION');
console.log('='.repeat(60));
console.log('');

const issues = {
  forbiddenLocations: [],
  missingReadme: [],
  stale: []
};

// Allowed .md locations
const allowedPatterns = [
  /^README\.md$/,
  /^CHANGELOG\.md$/,
  /^docs\//,
  /^\.github\//
];

function isAllowed(relPath) {
  return allowedPatterns.some(pattern => pattern.test(relPath));
}

function walkDir(dir, callback, relativePath = '') {
  if (!fs.existsSync(dir)) return;

  const items = fs.readdirSync(dir);
  items.forEach(item => {
    if (item === 'node_modules' || item === '.git') return;

    const fullPath = path.join(dir, item);
    const relPath = relativePath ? path.join(relativePath, item) : item;
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walkDir(fullPath, callback, relPath);
    } else {
      callback(relPath, fullPath, stat);
    }
  });
}

// Find all .md files
const allMdFiles = [];
walkDir(ROOT, (relPath, fullPath, stat) => {
  if (relPath.endsWith('.md')) {
    allMdFiles.push({
      path: relPath,
      fullPath,
      mtime: stat.mtime
    });

    // Check if in forbidden location
    if (!isAllowed(relPath)) {
      issues.forbiddenLocations.push(relPath);
    }
  }
});

// Check for stale docs (not modified in 180 days)
const sixMonthsAgo = new Date();
sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);

allMdFiles.forEach(file => {
  if (file.mtime < sixMonthsAgo) {
    const daysSince = Math.floor((Date.now() - file.mtime) / (1000 * 60 * 60 * 24));
    issues.stale.push({ path: file.path, daysSince });
  }
});

// Check for missing READMEs in key folders
const keyFolders = [
  'src',
  'server',
  'scripts',
  'tests',
  'docs'
];

keyFolders.forEach(folder => {
  const readmePath = path.join(ROOT, folder, 'README.md');
  if (fs.existsSync(path.join(ROOT, folder)) && !fs.existsSync(readmePath)) {
    issues.missingReadme.push(folder);
  }
});

// Output report
console.log('## Documentation Audit\n');

console.log(`### All .md Files Found: ${allMdFiles.length}\n`);

if (issues.forbiddenLocations.length > 0) {
  console.log(`### .md Files in Forbidden Locations (${issues.forbiddenLocations.length})`);
  console.log('Action: Move to docs/ or docs/archive/');
  console.log('');

  // Categorize by location
  const byLocation = {
    root: [],
    src: [],
    other: []
  };

  issues.forbiddenLocations.forEach(f => {
    if (!f.includes('/')) {
      byLocation.root.push(f);
    } else if (f.startsWith('src/')) {
      byLocation.src.push(f);
    } else {
      byLocation.other.push(f);
    }
  });

  if (byLocation.root.length > 0) {
    console.log('**Root directory:**');
    byLocation.root.forEach(f => console.log(`  - ${f}`));
  }

  if (byLocation.src.length > 0) {
    console.log('\n**src/ directory:**');
    byLocation.src.forEach(f => console.log(`  - ${f}`));
  }

  if (byLocation.other.length > 0) {
    console.log('\n**Other locations:**');
    byLocation.other.forEach(f => console.log(`  - ${f}`));
  }
  console.log('');
}

if (issues.stale.length > 0) {
  console.log(`### Potentially Stale Docs >180 days (${issues.stale.length})`);
  console.log('Action: Review and update or archive');
  issues.stale
    .sort((a, b) => b.daysSince - a.daysSince)
    .slice(0, 15)
    .forEach(f => console.log(`  - ${f.path} (${f.daysSince} days)`));
  if (issues.stale.length > 15) {
    console.log(`  ... and ${issues.stale.length - 15} more`);
  }
  console.log('');
}

if (issues.missingReadme.length > 0) {
  console.log(`### Missing README.md in Key Folders (${issues.missingReadme.length})`);
  console.log('Action: Consider adding README');
  issues.missingReadme.forEach(f => console.log(`  - ${f}/`));
  console.log('');
}

// Summary
console.log('='.repeat(60));
console.log('## Summary');
console.log(`  Total .md files: ${allMdFiles.length}`);
console.log(`  In forbidden locations: ${issues.forbiddenLocations.length}`);
console.log(`  Potentially stale: ${issues.stale.length}`);
console.log(`  Missing READMEs: ${issues.missingReadme.length}`);
console.log('='.repeat(60));

// Write manifest
const manifest = {
  timestamp: new Date().toISOString(),
  total: allMdFiles.length,
  issues
};

const manifestPath = path.join(ROOT, 'scripts/validation/documentation-manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`Manifest written to: scripts/validation/documentation-manifest.json`);

process.exit(issues.forbiddenLocations.length > 10 ? 1 : 0);
