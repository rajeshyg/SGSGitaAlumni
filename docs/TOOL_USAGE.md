# Tool Usage Guide

This document explains how to use the development tools and quality assurance systems in the SGSGita Alumni project.

## 🛠️ Development Tools Overview

### ESLint + SonarJS
**Purpose**: Code linting and quality enforcement with advanced redundancy detection
**Configuration**: `eslint.config.js`

#### Key Rules
```javascript
{
  // Core quality rules
  "no-console": "error",           // Prevents debug code
  "max-lines": ["error", 500],     // Prevents large files (AI context limit)
  "max-lines-per-function": ["error", 50], // Prevents complex functions
  "no-duplicate-imports": "error", // Prevents duplicate imports
  "no-unused-vars": "off",         // TypeScript handles this

  // SonarJS advanced redundancy rules
  "sonarjs/no-duplicate-string": "error",     // Detects duplicate strings
  "sonarjs/no-identical-functions": "error",  // Detects identical functions
  "sonarjs/no-collapsible-if": "error",       // Detects collapsible if statements
  "sonarjs/no-useless-catch": "error",        // Detects useless catch blocks
  "sonarjs/no-redundant-jump": "error",       // Detects redundant jumps
  "sonarjs/prefer-immediate-return": "error"  // Prefers immediate returns
}
```

#### Usage
```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Husky
**Purpose**: Git hooks for pre-commit quality checks
**Configuration**: `.husky/pre-commit`

#### What it does:
1. Runs ESLint before commits
2. Checks for console statements
3. Verifies file sizes
4. Runs tests
5. Blocks commits if quality gates fail

#### Manual Testing
```bash
# Test pre-commit hook
./.husky/pre-commit
```

### Vitest + React Testing Library
**Purpose**: Fast, user-centric testing
**Configuration**: `vitest.config.ts`

#### Writing Tests
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles clicks', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick}>Click me</Button>)
    await user.click(screen.getByText('Click me'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

#### Running Tests
```bash
# Development mode (watch)
npm run test

# UI mode (browser interface)
npm run test:ui

# CI mode (single run)
npm run test:run
```

## 🔍 Quality Assurance Scripts

### Custom Quality Scripts
Add these to your `package.json`:

```json
{
  "scripts": {
    "quality-check": "npm run lint && npm run test:run",
    "check-console": "grep -r 'console\\.' src/ --include='*.ts' --include='*.tsx' || echo '✅ No console statements'",
    "check-file-sizes": "find src -name '*.tsx' -o -name '*.ts' | xargs wc -l | awk '$1 > 300 {print \"📏 Large file:\", $2, \"-\", $1, \"lines\"}'",
    "audit-code": "npm run check-console && npm run check-file-sizes"
  }
}
```

### Automated Checks

#### Console Statement Detection
```bash
# Find all console statements
npm run check-console

# Output example:
❌ Found console statements in:
src/components/Button.tsx:5:console.log('Debug')
src/utils/api.ts:12:console.error('API Error')
```

#### File Size Monitoring
```bash
# Check for large files
npm run check-file-sizes

# Output example:
📏 Large file: src/pages/AdminPage.tsx - 444 lines
📏 Large file: src/components/Table.tsx - 320 lines
```

#### Duplicate Code Detection (jscpd)
**Configuration**: `.jscpd.json`

```bash
# Check for duplicates (configured via .jscpd.json)
npm run check-redundancy

# Generate HTML report
npm run check-redundancy  # Creates ./reports/jscpd/index.html
```

**What jscpd detects:**
- Code clones (10+ lines, 50+ tokens)
- Duplicate functions and methods
- Similar code patterns
- Copy-paste between files
- Identical code blocks

## 🚫 Preventing Redundancy

See [Quality Standards](QUALITY_STANDARDS.md) for comprehensive redundancy prevention guidelines and automated detection strategies.

## 🤖 AI Assistant Integration

See [AI Collaboration Guidelines](AI_COLLABORATION_GUIDELINES.md) for comprehensive AI assistance protocols and tool usage guidelines.

## 📊 Monitoring & Metrics

### Quality Metrics Dashboard
```bash
# Generate quality report
npm run quality-check > quality-report.txt

# Check test coverage
npm run test:run -- --coverage

# Monitor file sizes
npm run check-file-sizes > file-sizes.txt
```

### Automated Reporting
```javascript
// scripts/generate-report.js
const { execSync } = require('child_process')

function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    eslint: execSync('npm run lint').toString(),
    tests: execSync('npm run test:run').toString(),
    coverage: execSync('npm run test:run -- --coverage').toString(),
    fileSizes: execSync('npm run check-file-sizes').toString(),
    consoleStatements: execSync('npm run check-console').toString()
  }

  fs.writeFileSync('quality-report.json', JSON.stringify(report, null, 2))
  console.log('📊 Quality report generated')
}

generateReport()
```

## 🔧 Troubleshooting

### Common Issues

#### ESLint Errors
```bash
# Fix formatting
npm run lint:fix

# Check specific file
npx eslint src/components/Button.tsx

# Ignore false positives
/* eslint-disable-next-line no-console */
console.log('Legitimate use case')
```

#### Test Failures
```bash
# Debug specific test
npm run test Button.test.tsx

# Update snapshots
npm run test:run -- -u

# Check test coverage
npm run test:run -- --coverage
```

#### Husky Hook Issues
```bash
# Skip hooks temporarily
git commit --no-verify

# Debug hook
./.husky/pre-commit

# Reinstall hooks
npm run prepare
```

This comprehensive tool setup ensures code quality, prevents redundancy, and maintains high standards across the development process.