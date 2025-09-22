#!/usr/bin/env node

/**
 * Redundancy Prevention Script
 * Checks for duplicate code, files, and database elements
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Checking for code redundancy...\n')

let hasErrors = false

// Check for duplicate imports
function checkDuplicateImports() {
  console.log('📦 Checking for duplicate imports...')

  try {
    // Use findstr instead of grep for Windows compatibility
    const result = execSync('findstr /r /s "import.*from" src\\*.ts src\\*.tsx', { encoding: 'utf8' })

    if (result.trim()) {
      console.log('❌ Duplicate imports found:')
      console.log(result)
      hasErrors = true
    } else {
      console.log('✅ No duplicate imports found')
    }
  } catch (error) {
    // findstr returns exit code 1 when no matches found, which is OK
    if (error.status !== 1) {
      console.log('✅ No duplicate imports found')
    }
  }
}

// Check for large files
function checkFileSizes() {
  console.log('\n📏 Checking file sizes...')

  const srcDir = path.join(__dirname, '..', 'src')
  const largeFiles = []

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir)

    files.forEach(file => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        scanDirectory(filePath)
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf8')
        const lines = content.split('\n').length

        if (lines > 300) {
          largeFiles.push({ file: path.relative(srcDir, filePath), lines })
        }
      }
    })
  }

  scanDirectory(srcDir)

  if (largeFiles.length > 0) {
    console.log('❌ Large files found (>300 lines):')
    largeFiles.forEach(({ file, lines }) => {
      console.log(`  - ${file}: ${lines} lines`)
    })
    hasErrors = true
  } else {
    console.log('✅ No large files found')
  }
}

// Check for console statements
function checkConsoleStatements() {
  console.log('\n🚫 Checking for console statements...')

  try {
    // Use findstr instead of grep for Windows compatibility
    const result = execSync('findstr /r /s "console\." src\\*.ts src\\*.tsx', { encoding: 'utf8' })

    if (result.trim()) {
      console.log('❌ Console statements found:')
      console.log(result)
      hasErrors = true
    } else {
      console.log('✅ No console statements found')
    }
  } catch (error) {
    if (error.status !== 1) {
      console.log('❌ Error checking console statements:', error.message)
      hasErrors = true
    } else {
      console.log('✅ No console statements found')
    }
  }
}

// Check for duplicate component names
function checkDuplicateComponents() {
  console.log('\n🧩 Checking for duplicate component names...')

  const componentsDir = path.join(__dirname, '..', 'src', 'components')
  const componentNames = new Map()

  function scanComponents(dir) {
    if (!fs.existsSync(dir)) return

    const files = fs.readdirSync(dir)

    files.forEach(file => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        scanComponents(filePath)
      } else if (file.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf8')
        const exportMatches = content.match(/export (?:function|const) (\w+)/g)

        exportMatches?.forEach(match => {
          const componentName = match.replace(/export (?:function|const) /, '')
          const relativePath = path.relative(componentsDir, filePath)

          if (componentNames.has(componentName)) {
            console.log(`❌ Duplicate component name: ${componentName}`)
            console.log(`  - ${componentNames.get(componentName)}`)
            console.log(`  - ${relativePath}`)
            hasErrors = true
          } else {
            componentNames.set(componentName, relativePath)
          }
        })
      }
    })
  }

  scanComponents(componentsDir)

  if (!hasErrors) {
    console.log('✅ No duplicate component names found')
  }
}

// Check for unused imports (basic check)
function checkUnusedImports() {
  console.log('\n🗑️ Checking for potential unused imports...')

  const srcDir = path.join(__dirname, '..', 'src')
  const issues = []

  function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8')
    const importMatches = content.match(/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g)

    importMatches?.forEach(importMatch => {
      const [, imports] = importMatch.match(/import\s+{([^}]+)}\s+from/)
      const importList = imports.split(',').map(imp => imp.trim().split(' ')[0])

      importList.forEach(importedItem => {
        // Simple check: if imported item is not used in the file
        const usagePattern = new RegExp(`\\b${importedItem}\\b`, 'g')
        const usages = content.match(usagePattern)

        if (!usages || usages.length <= 1) { // 1 for the import itself
          issues.push({
            file: path.relative(srcDir, filePath),
            import: importedItem
          })
        }
      })
    })
  }

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir)

    files.forEach(file => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory()) {
        scanDirectory(filePath)
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        scanFile(filePath)
      }
    })
  }

  scanDirectory(srcDir)

  if (issues.length > 0) {
    console.log('⚠️ Potential unused imports found:')
    issues.forEach(({ file, import: importName }) => {
      console.log(`  - ${file}: ${importName}`)
    })
  } else {
    console.log('✅ No obvious unused imports found')
  }
}

// Run all checks
checkDuplicateImports()
checkFileSizes()
checkConsoleStatements()
checkDuplicateComponents()
checkUnusedImports()

console.log('\n' + '='.repeat(50))

if (hasErrors) {
  console.log('❌ Redundancy issues found! Please fix before committing.')
  process.exit(1)
} else {
  console.log('✅ No redundancy issues found!')
  process.exit(0)
}