#!/usr/bin/env node
/**
 * Full Audit Orchestrator
 * Runs all audit scripts and aggregates results
 * Per Multi-Agent Orchestration pattern from spec-driven guide
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SCRIPTS_DIR = __dirname;
const ROOT = path.resolve(__dirname, '../..');

console.log('='.repeat(60));
console.log('FULL CODEBASE AUDIT - ORCHESTRATOR');
console.log('='.repeat(60));
console.log(`Started: ${new Date().toISOString()}`);
console.log('');

const audits = [
  { name: 'Framework Structure', script: 'audit-framework.cjs' },
  { name: 'Root Clutter', script: 'audit-root-clutter.cjs' },
  { name: 'File Organization', script: 'audit-file-organization.cjs' },
  { name: 'Code Quality', script: 'audit-code-quality.cjs' },
  { name: 'Documentation', script: 'audit-documentation.cjs' }
];

const results = [];

// Run each audit
audits.forEach((audit, index) => {
  console.log(`\n[${ index + 1}/${audits.length}] Running ${audit.name}...`);
  console.log('='.repeat(60));

  const scriptPath = path.join(SCRIPTS_DIR, audit.script);

  if (!fs.existsSync(scriptPath)) {
    console.log(`⚠️  Script not found: ${audit.script}`);
    results.push({
      name: audit.name,
      script: audit.script,
      status: 'SKIPPED',
      exitCode: -1
    });
    return;
  }

  try {
    execSync(`node "${scriptPath}"`, {
      stdio: 'inherit',
      cwd: ROOT
    });
    results.push({
      name: audit.name,
      script: audit.script,
      status: 'PASS',
      exitCode: 0
    });
  } catch (error) {
    results.push({
      name: audit.name,
      script: audit.script,
      status: 'WARN',
      exitCode: error.status || 1
    });
  }
});

// Aggregate results
console.log('\n');
console.log('='.repeat(60));
console.log('FULL AUDIT - AGGREGATE RESULTS');
console.log('='.repeat(60));
console.log('');

const passed = results.filter(r => r.status === 'PASS').length;
const warned = results.filter(r => r.status === 'WARN').length;
const skipped = results.filter(r => r.status === 'SKIPPED').length;

console.log('## Audit Results\n');
results.forEach(r => {
  const emoji = r.status === 'PASS' ? '✅' : r.status === 'WARN' ? '⚠️' : '⏭️';
  console.log(`${emoji} ${r.name}: ${r.status}`);
});

console.log('');
console.log('## Summary');
console.log(`  Passed: ${passed}/${audits.length}`);
console.log(`  Warnings: ${warned}/${audits.length}`);
console.log(`  Skipped: ${skipped}/${audits.length}`);
console.log('');

// Load and summarize manifests
console.log('## Manifests Generated');
const manifests = [
  'root-clutter-manifest.json',
  'file-organization-manifest.json',
  'code-quality-manifest.json',
  'documentation-manifest.json'
];

manifests.forEach(manifest => {
  const manifestPath = path.join(SCRIPTS_DIR, manifest);
  if (fs.existsSync(manifestPath)) {
    console.log(`  ✅ ${manifest}`);
  } else {
    console.log(`  ❌ ${manifest} (not generated)`);
  }
});

console.log('');
console.log('='.repeat(60));
console.log(`Completed: ${new Date().toISOString()}`);

// Overall status
const overallStatus = warned > 2 ? 'NEEDS ATTENTION' :
                      warned > 0 ? 'MINOR ISSUES' : 'CLEAN';
console.log(`Overall Status: ${overallStatus}`);
console.log('='.repeat(60));

// Write aggregate report
const aggregateReport = {
  timestamp: new Date().toISOString(),
  audits: results,
  summary: {
    total: audits.length,
    passed,
    warned,
    skipped
  },
  overallStatus
};

const reportPath = path.join(SCRIPTS_DIR, 'full-audit-report.json');
fs.writeFileSync(reportPath, JSON.stringify(aggregateReport, null, 2));
console.log(`\nFull report: scripts/validation/full-audit-report.json`);

// Exit with error if major issues
process.exit(warned > 2 ? 1 : 0);
